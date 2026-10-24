import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { dispatchOwnerNotices } from '@/lib/owner/notices'

/**
 * GET /api/cron/owner-notices — the daily Vercel cron (vercel.json): the morning brief and any
 * pending important notice to Marcel's phone (ADR-0024). Vercel sends `Authorization: Bearer
 * <CRON_SECRET>`; without that variable the route refuses everything (fails closed).
 */
export const dynamic = 'force-dynamic'

function authorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !header?.startsWith('Bearer ')) return false
  const digest = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(digest(header.slice(7)), digest(secret))
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  if (!authorized(request.headers.get('authorization'), process.env.CRON_SECRET)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'database_unavailable' }, { status: 503 })
  try {
    // The brief is due from 06:00 Berlin; the cron runs after that, so this run includes it.
    const result = await dispatchOwnerNotices(getDb(), { briefFromHour: 6 })
    console.info(JSON.stringify({ event: 'owner.notices', source: 'cron', ...result }))
    return NextResponse.json({ status: 'done', ...result })
  } catch (err) {
    console.error('[cron/owner-notices]', err instanceof Error ? err.message : err)
    return NextResponse.json({ status: 'failed' }, { status: 500 })
  }
}
