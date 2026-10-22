import { getDb } from '@/lib/db'
import { CapabilityRefusal, type Sql } from '@/lib/commercial/types'

export interface MailAction {
  accountId: string; threadId: string; action: 'send' | 'archive' | 'trash' | 'mark_read' | 'mark_unread'
  approvalId?: string; to?: string; subject?: string; body?: string; actor?: string
}

/** The only owner mutation port. No provider is activated until the real webhook
 * identity/UID contract has been evidenced. Do not fall back to Resend for replies.
 */
export async function executeMailAction(input: MailAction, sql: Sql = getDb()) {
  if (input.action === 'send' || input.action === 'trash') {
    if (!input.approvalId) throw new CapabilityRefusal('Owner confirmation required.')
  }
  if (input.action !== 'mark_read' && input.action !== 'mark_unread') {
    throw new CapabilityRefusal('Hostinger activation is disabled pending verified webhook fixture and owner activation.', 'unsupported')
  }
  const rows = await sql`UPDATE mail.messages SET is_read=${input.action === 'mark_read'}
    WHERE thread_id=${input.threadId}::uuid AND account_id=${input.accountId} RETURNING id`
  if (!rows.length) throw new CapabilityRefusal('Email thread not found.', 'not_found')
  await sql`INSERT INTO mail.action_audit(thread_id,action,status,payload)
    VALUES (${input.threadId}::uuid,${input.action},'local_only',${JSON.stringify({ actor: input.actor ?? 'unknown' })}::jsonb)`
  return { summary: `${input.action === 'mark_read' ? 'Read' : 'Unread'} in Maxpromo OS. Provider synchronization is not active.` }
}
