import { NextResponse, after } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { railIssues } from '@/lib/money/attention'
import { berlinDate } from '@/lib/commercial/money'
import { sweepScheduledMail } from '@/lib/mail/outbound'
import { sweepLeads } from '@/lib/leads/workflow'

/**
 * GET /api/os/shell — the three numbers the phone navigation shows as badges: conversations waiting
 * for Marcel's reply, approvals waiting for his decision, money issues needing his look. Counts only:
 * no subject, sender or amount leaves here. Owner session, never cached.
 */
export const dynamic = 'force-dynamic'

async function count(query: PromiseLike<unknown>): Promise<number> {
  try { return Number(((await query) as { n: number }[])[0]?.n ?? 0) } catch { return 0 }
}

export const GET = withAuth(async (_request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  try {
    const sql = getDb()
    const [needsReply, approvals, money] = await Promise.all([
      count(sql`SELECT count(*)::int AS n FROM mail.threads WHERE needs_reply AND quarantine IS NULL AND archived = false AND trashed = false`),
      count(sql`SELECT count(*)::int AS n FROM os_approvals WHERE status = 'pending' AND expires_at > now()`),
      railIssues(sql).then(i => i.length).catch(() => 0),
    ])
    // While the OS is open (this is polled every minute) due scheduled emails go out (0023).
    after(() => sweepScheduledMail(sql, berlinDate()).catch(() => undefined))
    // …and the lead workflow takes its next step (ADR-0027 §3): replies always, the rest when switched on.
    after(() => sweepLeads(sql, berlinDate()).catch(() => undefined))
    return NextResponse.json({ needsReply, approvals, money }, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/shell]', err instanceof Error ? err.message : err)
    return ownerReply('Shell status unavailable', 503)
  }
})
