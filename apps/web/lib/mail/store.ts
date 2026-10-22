import type { Sql } from '@/lib/commercial/types'
import { classifyMail, normalizeMail, type InboundMail } from './normalization'

/** One SQL statement is one transaction, including thread creation and event dedupe.
 * Account/message identity is the replay key; email addresses are possible matches,
 * never proof of sender identity (a From header can be forged).
 */
export async function ingestMail(sql: Sql, input: InboundMail): Promise<boolean> {
  const m = normalizeMail(input)
  const c = classifyMail(m)
  const key = JSON.stringify([m.accountId, m.messageId])
  const rows = await sql`
    WITH claimed AS (
      INSERT INTO mail.events(id,account_id,kind)
      SELECT ${key}, id, 'received' FROM mail.accounts WHERE id=${m.accountId} AND enabled
      ON CONFLICT DO NOTHING RETURNING id
    ), thread AS (
      INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at)
      SELECT ${m.accountId},${m.threadId},${m.subject},${c.classification},${c.needsReply},${m.receivedAt}::timestamptz FROM claimed
      ON CONFLICT(account_id,provider_thread_id) DO UPDATE SET
        updated_at=greatest(mail.threads.updated_at,excluded.updated_at), needs_reply=mail.threads.needs_reply OR excluded.needs_reply,
        classification=CASE
          WHEN mail.threads.classification='system' THEN mail.threads.classification
          WHEN excluded.classification='system' THEN excluded.classification
          WHEN mail.threads.classification='billing' THEN mail.threads.classification
          WHEN excluded.needs_reply THEN excluded.classification
          ELSE mail.threads.classification END
      RETURNING id
    ), message AS (
      INSERT INTO mail.messages(thread_id,account_id,provider_message_id,sender,recipients,cc,subject,body_text,received_at,attachments)
      SELECT id,${m.accountId},${m.messageId},${m.sender},${JSON.stringify(m.recipients)}::jsonb,${JSON.stringify(m.cc)}::jsonb,
      ${m.subject},${m.text},${m.receivedAt}::timestamptz,${JSON.stringify(m.attachments)}::jsonb FROM thread
      ON CONFLICT DO NOTHING RETURNING thread_id
    ) SELECT thread_id FROM message`
  // A sibling data-modifying CTE cannot see an event inserted in its snapshot.
  // Repair the optional reference separately, including on retry after a crash.
  // Message/event creation above remains one atomic transaction.
  const references = await sql`UPDATE mail.events e SET thread_id=m.thread_id FROM mail.messages m
    WHERE e.id=${key} AND m.account_id=${m.accountId} AND m.provider_message_id=${m.messageId}
    RETURNING m.thread_id,m.sender`
  if (references[0]) await suggestBusinessLinks(sql, references[0].thread_id as string, references[0].sender as string)
  if (rows[0] && c.classification !== 'routine') {
    // A known email relationship is useful for attention, never proof of identity.
    // Only a new message can raise attention; retries cannot undo owner triage.
    await sql`UPDATE mail.threads SET needs_reply=true,
      classification=CASE WHEN classification='other' THEN 'client' ELSE classification END
      WHERE id=${rows[0].thread_id}::uuid AND EXISTS(
        SELECT 1 FROM mail.business_links WHERE thread_id=mail.threads.id AND entity_kind='client')`
  }
  return rows.length > 0
}

export async function suggestBusinessLinks(sql: Sql, threadId: string, sender: string) {
  // A possible association grants no authority and performs no merge.
  await sql`INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status)
    SELECT ${threadId}::uuid,'lead',id::text,'possible' FROM os_leads WHERE lower(email)=${sender}
    UNION ALL SELECT ${threadId}::uuid,'client',id::text,'possible' FROM os_clients WHERE lower(email)=${sender}
    ON CONFLICT DO NOTHING`
}
