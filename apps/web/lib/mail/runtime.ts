import { getDb } from '@/lib/db'
import { CapabilityRefusal, type Sql } from '@/lib/commercial/types'

export const MAIL_ACTIONS = ['archive', 'unarchive', 'trash', 'restore', 'mark_read', 'mark_unread'] as const
export type MailActionName = typeof MAIL_ACTIONS[number]

export interface MailAction {
  accountId: string; threadId: string; action: MailActionName
  approvalId?: string; actor?: string
}

/** Local mailbox state in Maxpromo OS. Hostinger's folders are not changed: the provider is the
 * transport and the record of what arrived, the OS is where Marcel works (ADR-0023). Sending
 * goes through lib/mail/outbound.ts only.
 *
 * Trash is reversible (0025): the conversation leaves every view, count and attention list (they
 * all read trashed = false) with its reply / waiting / follow-up state kept as it was, so Restore
 * returns it exactly. A scheduled email in a trashed conversation goes back to a draft — nothing
 * leaves from Trash. A new message from the other side brings it back by itself (trigger).
 * Nothing is deleted, here or at Hostinger; permanent deletion is not offered. */
export async function executeMailAction(input: MailAction, sql: Sql = getDb()) {
  // Only the local actions below exist here; sending is lib/mail/outbound.ts after confirmation.
  if (!(MAIL_ACTIONS as readonly string[]).includes(input.action)) throw new CapabilityRefusal('Unsupported mail action. Sending requires a confirmed draft.', 'unsupported')
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
      rows = await sql`UPDATE mail.threads SET trashed=true,trashed_at=coalesce(trashed_at,now())
        WHERE id=${input.threadId}::uuid AND account_id=${input.accountId} RETURNING id` as { id: string }[]
      if (rows.length) {
        const parked = await sql`UPDATE mail.drafts SET status='draft',scheduled_for=NULL,scheduled_approval=NULL,revision=revision+1,updated_at=now()
          WHERE thread_id=${input.threadId}::uuid AND status='scheduled' RETURNING id` as { id: string }[]
        for (const d of parked) await sql`UPDATE os_approvals SET status='superseded',decided_at=now(),decided_by=${actor} WHERE dedupe_key=${`email.deliver:draft:${d.id}`} AND status='pending'`
      }
      summary = 'Moved to Trash in Maxpromo OS. Restore brings it back unchanged; Hostinger still holds the message and nothing was deleted.'
      break
    case 'restore':
      rows = await sql`UPDATE mail.threads SET trashed=false,trashed_at=NULL
        WHERE id=${input.threadId}::uuid AND account_id=${input.accountId} RETURNING id` as { id: string }[]
      summary = 'Restored from Trash.'
      break
  }
  if (!rows.length) throw new CapabilityRefusal('Email thread not found.', 'not_found')
  await sql`INSERT INTO mail.action_audit(thread_id,action,status,payload,approval_id)
    VALUES (${input.threadId}::uuid,${input.action},'local_only',${JSON.stringify({ actor })}::jsonb,${input.approvalId ?? null})`
  return { summary }
}
