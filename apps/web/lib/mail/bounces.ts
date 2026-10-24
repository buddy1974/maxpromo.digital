/**
 * Delivery failure reports (bounces) for email Maxpromo sent (ADR-0023 amendment). SERVER ONLY
 * for recordBounce; parseBounce is pure.
 *
 * Hostinger hands a bounce to the mailbox like any other mail, from MAILER-DAEMON or postmaster.
 * Its text names the recipient that failed and an SMTP status (5.x.x permanent, 4.x.x temporary),
 * either in the delivery-status part (Final-Recipient / Action / Status / Diagnostic-Code) or in
 * the human part ("<a@b>: host … said: 550 5.1.1 …"). Both are read; nothing is guessed: a report
 * that names no recipient, or no message Maxpromo sent to that recipient, links to nothing.
 *
 * The result lands on Maxpromo's OWN outbound message (delivery_state, delivery_detail), so the
 * conversation shows it and attention says "your email to X did not arrive" — the bounce mail
 * itself is never something Marcel has to answer.
 */
import type { Sql } from '@/lib/commercial/types'

export interface BounceReport { kind: 'bounced' | 'delayed'; recipients: string[]; status: string | null; detail: string; messageIds: string[] }

const ADDRESS = /[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/

export function isBounceSender(sender: string): boolean {
  const address = (sender.match(ADDRESS)?.[0] ?? sender).toLowerCase()
  return /^(mailer-daemon|postmaster|mail-daemon)@/.test(address)
}

export function parseBounce(text: string): BounceReport | null {
  const body = text.slice(0, 200_000)
  const recipients = new Set<string>()
  for (const m of body.matchAll(/^(?:Final|Original)-Recipient:\s*rfc822;\s*<?([^\s>]+@[^\s>]+)>?/gim)) recipients.add(m[1].toLowerCase())
  const human = [...body.matchAll(/<([^\s<>]+@[^\s<>]+)>:\s*([\s\S]{0,500}?)(?:\n\s*\n|$)/g)]
  if (!recipients.size) for (const m of human) recipients.add(m[1].toLowerCase())
  if (!recipients.size) return null
  const action = body.match(/^Action:\s*(failed|delayed)/im)?.[1]?.toLowerCase() ?? null
  const status = body.match(/^Status:\s*([245]\.\d{1,3}\.\d{1,3})/im)?.[1] ?? body.match(/\b([45]\.\d{1,3}\.\d{1,3})\b/)?.[1] ?? null
  const kind: BounceReport['kind'] | null = action === 'failed' || status?.startsWith('5') ? 'bounced' : action === 'delayed' || status?.startsWith('4') ? 'delayed'
    : /could not be delivered|delivery (?:has )?failed|undeliverable|zustellung (?:ist )?fehlgeschlagen|nicht zugestellt/i.test(body) ? 'bounced' : null
  if (!kind) return null
  const diagnostic = body.match(/^Diagnostic-Code:\s*[^;\n]*;\s*(.+)$/im)?.[1] ?? human[0]?.[2] ?? ''
  const detail = [status, diagnostic.replace(/\s+/g, ' ').trim()].filter(Boolean).join(' · ').slice(0, 300)
  const messageIds = [...new Set([...body.matchAll(/^Message-ID:\s*(<[^>\s]{3,250}>)/gim)].map(m => m[1]))]
  return { kind, recipients: [...recipients].slice(0, 20), status, detail, messageIds }
}

/** Marks the outbound message a bounce is about. Returns the outbound message ids it marked. */
export async function recordBounce(sql: Sql, report: { messageId: string; sender: string; text: string; receivedAt?: Date }): Promise<string[]> {
  if (!isBounceSender(report.sender)) return []
  const parsed = parseBounce(report.text)
  if (!parsed) return []
  const marked: string[] = []
  for (const recipient of parsed.recipients) {
    /* The message Maxpromo sent to that address: the one whose Message-ID the report quotes, else
       the most recent one sent to it in the 14 days before the report. */
    const rows = await sql`
      SELECT id FROM mail.messages
      WHERE direction='outbound' AND (recipients ? ${recipient} OR cc ? ${recipient})
        AND received_at <= coalesce(${report.receivedAt?.toISOString() ?? null}::timestamptz, now())
        AND received_at > coalesce(${report.receivedAt?.toISOString() ?? null}::timestamptz, now()) - interval '14 days'
      ORDER BY (rfc_message_id = ANY(${parsed.messageIds})) DESC, received_at DESC LIMIT 1` as { id: string }[]
    if (!rows[0]) continue
    // A permanent failure is never downgraded by a later "delayed" report for the same message.
    const updated = await sql`
      UPDATE mail.messages SET delivery_state = CASE WHEN delivery_state='bounced' THEN 'bounced' ELSE ${parsed.kind} END,
        delivery_detail=${`${recipient}: ${parsed.detail}`.slice(0, 300)}, delivery_report=${report.messageId}::uuid, delivery_at=now()
      WHERE id=${rows[0].id}::uuid RETURNING id, thread_id` as { id: string; thread_id: string }[]
    if (updated[0]) {
      marked.push(updated[0].id)
      await sql`INSERT INTO mail.action_audit(thread_id,action,status,payload) VALUES(${updated[0].thread_id}::uuid,'delivery_report','done',
        ${JSON.stringify({ actor: 'mail:bounce', kind: parsed.kind, status: parsed.status, outbound_message: updated[0].id, report_message: report.messageId })}::jsonb)`
    }
  }
  return marked
}
