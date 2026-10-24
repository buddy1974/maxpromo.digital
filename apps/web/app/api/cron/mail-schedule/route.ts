import { NextRequest, NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { cronAuthorized } from '@/lib/cron'
import { berlinDate } from '@/lib/commercial/money'
import { sweepScheduledMail } from '@/lib/mail/outbound'

/**
 * GET /api/cron/mail-schedule — sends confirmed scheduled emails whose time has come, each once
 * (0023). Meant for a frequent cron (every few minutes) where the hosting plan allows it; the OS
 * also sweeps while it is open and the daily cron sweeps once a day. Fails closed without CRON_SECRET.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  if (!cronAuthorized(request.headers.get('authorization'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'database_unavailable' }, { status: 503 })
  try {
    const result = await sweepScheduledMail(getDb(), berlinDate())
    console.info(JSON.stringify({ event: 'mail.schedule', source: 'cron', ...result }))
    return NextResponse.json({ status: 'done', ...result })
  } catch (err) {
    console.error('[cron/mail-schedule]', err instanceof Error ? err.message : err)
    return NextResponse.json({ status: 'failed' }, { status: 500 })
  }
}
