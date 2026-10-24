import { getDb } from '@/lib/db'
import { CapabilityRefusal, type Sql } from '@/lib/commercial/types'

export interface MailAction {
  accountId: string; threadId: string; action: 'archive' | 'unarchive' | 'trash' | 'mark_read' | 'mark_unread'
  approvalId?: string; actor?: string
}

/** Local mailbox state in Maxpromo OS. Hostinger's folders are not changed: the provider is the
 * transport and the record of what arrived, the OS is where Marcel works (ADR-0023). Sending
 * goes through lib/mail/outbound.ts only. */
export async function executeMailAction(input: MailAction, sql: Sql = getDb()) {
  // Only the local actions below exist here; sending is lib/mail/outbound.ts after confirmation.
  if (!['archive', 'unarchive', 'trash', 'mark_read', 'mark_unread'].includes(input.action)) throw new CapabilityRefusal('Unsupported mail action. Sending requires a confirmed draft.', 'unsupported')
  if (input.action === 'trash' && !input.approvalId) throw new CapabilityRefusal('Owner confirmation required.')
  const actor = input.actor ?? 'unknown'
  let rows: { id: string }[]
  let summary: string
  switch (input.action) {
    case 'mark_read':
    case 'mark_unread':
      rows = await sql`UPDATE mail.messages SET is_read=${input.action === 'mark_read'}
        WHERE thread_id=${input.threadId}::uuid AND account_id=${input.accountId} RETURNING id` as { id: string }[]
      summary = `${input.action === 'mark_read' ? 'Read' : 'Unread'} in Maxpromo OS. Hostinger is unchanged.`
      break
    case 'archive':
    case 'unarchive':
      rows = await sql`UPDATE mail.threads SET archived=${input.action === 'archive'},needs_reply=CASE WHEN ${input.action === 'archive'} THEN false ELSE needs_reply END
        WHERE id=${input.threadId}::uuid AND account_id=${input.accountId} RETURNING id` as { id: string }[]
      summary = input.action === 'archive' ? 'Archived in Maxpromo OS. Hostinger is unchanged; nothing was deleted.' : 'Back in the Inbox.'
      break
    case 'trash':
      rows = await sql`UPDATE mail.threads SET trashed=true,needs_reply=false,waiting=false
        WHERE id=${input.threadId}::uuid AND account_id=${input.accountId} RETURNING id` as { id: string }[]
      summary = 'Removed from Maxpromo OS views. Hostinger still holds the message; nothing was deleted.'
      break
  }
  if (!rows.length) throw new CapabilityRefusal('Email thread not found.', 'not_found')
  await sql`INSERT INTO mail.action_audit(thread_id,action,status,payload,approval_id)
    VALUES (${input.threadId}::uuid,${input.action},'local_only',${JSON.stringify({ actor })}::jsonb,${input.approvalId ?? null})`
  return { summary }
}
