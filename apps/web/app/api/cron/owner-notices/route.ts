import { NextRequest, NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { cronAuthorized } from '@/lib/cron'
import { berlinDate } from '@/lib/commercial/money'
import { dispatchOwnerNotices } from '@/lib/owner/notices'
import { sweepScheduledMail } from '@/lib/mail/outbound'

/**
 * GET /api/cron/owner-notices — the daily Vercel cron (vercel.json): the morning brief and any
 * pending important notice to Marcel's phone (ADR-0024), and any scheduled email that is due.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`; without that variable the route refuses
 * everything (fails closed).
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  if (!cronAuthorized(request.headers.get('authorization'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'database_unavailable' }, { status: 503 })
  try {
    const sql = getDb()
    // The brief is due from 06:00 Berlin; the cron runs after that, so this run includes it.
    const result = await dispatchOwnerNotices(sql, { briefFromHour: 6 })
    const mail = await sweepScheduledMail(sql, berlinDate()).catch(() => null)
    console.info(JSON.stringify({ event: 'owner.notices', source: 'cron', ...result, scheduledMail: mail }))
    return NextResponse.json({ status: 'done', ...result, scheduledMail: mail })
  } catch (err) {
    console.error('[cron/owner-notices]', err instanceof Error ? err.message : err)
    return NextResponse.json({ status: 'failed' }, { status: 500 })
  }
}
