import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { briefingSnapshot } from '@/lib/commercial/capabilities/views'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'

/**
 * GET /api/os/briefing — the morning briefing: what changed since yesterday and what to do first.
 * Read-only. The same snapshot owner.brief sends to text channels.
 */
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  try {
    const now = new Date()
    const snapshot = await briefingSnapshot({ sql: getDb(), actor: OWNER_ACTOR, channel: 'os', now, today: berlinDate(now), committed: () => {} })
    return NextResponse.json(snapshot, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/briefing]', err instanceof Error ? err.message : err)
    return ownerReply('Briefing unavailable', 503)
  }
})
