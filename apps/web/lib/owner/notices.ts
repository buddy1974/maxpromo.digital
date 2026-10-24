/**
 * Owner Control Plane: important events to Marcel's phone (ADR-0024).
 *
 * Telegram is not another inbox. Of everything owner.notices knows, only what changes Marcel's
 * next action is pushed (PUSH_POLICY); the rest stays in /os. Each notice key is claimed in
 * os_owner_notices before sending, so concurrent triggers and repeated checks deliver it once.
 * At most MAX_PER_RUN messages leave per run; the rest wait for the next trigger.
 *
 * Triggers are opportunistic (inbound mail, agent events, Marcel opening /os) plus the daily brief
 * from 07:00 Berlin on the first trigger of the day. Nothing here sends to a customer.
 */
import { ownerNotices } from '@/lib/commercial/capabilities/views'
import { berlinDate } from '@/lib/commercial/money'
import { sendTelegramNotification } from '@/lib/telegram'
import type { Sql } from '@/lib/commercial/types'

export interface Notice { key: string; severity: 'info' | 'warning' | 'critical'; text: string; action?: string }
export const MAX_PER_RUN = 5
const OS_URL = 'https://maxpromo.digital/os'

/** What reaches the phone. New enquiries are already pushed at intake (lib/telegram buildIntakeMessage). */
export function pushable(n: Notice): boolean {
  if (n.key.startsWith('lead-new:')) return false
  if (n.key.startsWith('brief:')) return true
  if (n.key.startsWith('email-replied:')) return true
  if (n.key.startsWith('email:')) return n.severity === 'critical'
  if (n.key.startsWith('followup:') || n.key.startsWith('renewal:')) return false
  return n.severity === 'warning' || n.severity === 'critical'
}

function escapeHtml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

/** One short message: what happened and where to act. Notice text is record data; escaped. */
export function format(n: Notice): string {
  const threadId = n.action?.match(/Open email thread ([0-9a-f-]{36})/)?.[1]
  const link = threadId ? `${OS_URL}/inbox?thread=${threadId}` : n.key.startsWith('approval:') ? `${OS_URL}/approvals`
    : n.key.startsWith('brief:') ? OS_URL : n.key.startsWith('overdue:') ? `${OS_URL}/invoices` : n.key.startsWith('money:') ? `${OS_URL}/money` : n.key.startsWith('agent:') ? OS_URL : null
  const head = n.severity === 'critical' ? '<b>Maxpromo · urgent</b>' : n.key.startsWith('brief:') ? '<b>Maxpromo · morning brief</b>' : '<b>Maxpromo</b>'
  return [head, escapeHtml(n.text.slice(0, 3500)), link ? `\n<a href="${link}">Open in Maxpromo OS</a>` : null].filter(Boolean).join('\n')
}

export interface DispatchResult { considered: number; sent: number; failed: number; skipped: number }

export async function dispatchOwnerNotices(sql: Sql, options: { now?: Date; briefFromHour?: number; send?: (text: string) => Promise<{ sent: boolean }>; notices?: () => Promise<Notice[]> } = {}): Promise<DispatchResult> {
  const now = options.now ?? new Date()
  const send = options.send ?? sendTelegramNotification
  const all = options.notices ? await options.notices() : await (async () => {
    const result = await ownerNotices.run!({ sql, actor: 'os:owner-notices', channel: 'telegram', now, today: berlinDate(now), committed: () => {} }, { brief_from_hour: options.briefFromHour ?? 7 })
    return (result.data as { notices?: Notice[] } | undefined)?.notices ?? []
  })()
  const candidates = all.filter(pushable).sort((a, b) => rank(b) - rank(a))
  /* Activation is the owner's decision: the first run pushes whatever is pending. Until
     OWNER_TELEGRAM_NOTICES=1 is set on the project, nothing is claimed and nothing is sent. */
  if (!options.send && process.env.OWNER_TELEGRAM_NOTICES !== '1') return { considered: candidates.length, sent: 0, failed: 0, skipped: all.length }
  let sent = 0, failed = 0
  for (const n of candidates) {
    if (sent + failed >= MAX_PER_RUN) break
    const claimed = await sql`INSERT INTO os_owner_notices(notice_key,severity) VALUES(${n.key.slice(0, 300)},${n.severity}) ON CONFLICT (notice_key) DO NOTHING RETURNING notice_key` as { notice_key: string }[]
    if (!claimed.length) continue
    const outcome = await send(format(n))
    if (outcome.sent) {
      sent++
      await sql`UPDATE os_owner_notices SET outcome='delivered',delivered_at=now() WHERE notice_key=${claimed[0].notice_key}`
    } else {
      failed++
      // Released, so the next trigger tries again; not configured / evidence mode also lands here.
      await sql`DELETE FROM os_owner_notices WHERE notice_key=${claimed[0].notice_key} AND outcome='claimed'`
    }
  }
  return { considered: candidates.length, sent, failed, skipped: all.length - candidates.length }
}

function rank(n: Notice) { return (n.severity === 'critical' ? 3 : n.severity === 'warning' ? 2 : 1) * 10 + (n.key.startsWith('brief:') ? 0 : 1) }
