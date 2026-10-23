import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { attentionSnapshot } from '@/lib/commercial/capabilities/views'
import { acknowledgeAgentEvent } from '@/lib/commercial/agent-events'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { OWNER_HEADERS, ownerReply, readOwnerJson } from '@/lib/owner-request'
import { scheduleProviderCheck } from '@/lib/mail/providerSchedule'

/**
 * GET  /api/os/attention   what needs Marcel today: ranked items across sales,
 *                          money, clients, system and agents; email needing a
 *                          reply; approvals waiting for him (ADR-0021).
 * POST /api/os/attention   { acknowledge: <agent event id> } — seen, off the list.
 *
 * Read-only apart from the acknowledgement. The same attention model as the
 * brief and the notices, so /os, Telegram and the brief never disagree.
 */

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  try {
    const now = new Date()
    const snapshot = await attentionSnapshot({
      sql: getDb(), actor: OWNER_ACTOR, channel: 'os', now, today: berlinDate(now), committed: () => {},
    })
    // Provider Junk still unverified (a failed earlier check) leaves attention on the next view (ADR-0022).
    scheduleProviderCheck('attention')
    return NextResponse.json(snapshot, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/attention]', err instanceof Error ? err.message : err)
    return ownerReply('Attention unavailable', 503)
  }
})

export const POST = withAuth(async (request, { session }) => {
  const read = await readOwnerJson(request, session, 1024)
  if (!read.ok) return read.response
  const { body } = read
  if (Object.keys(body).some((k) => k !== 'acknowledge') || typeof body.acknowledge !== 'string') return ownerReply('Invalid body', 400)
  try {
    const done = await acknowledgeAgentEvent(getDb(), body.acknowledge, OWNER_ACTOR)
    return done ? NextResponse.json({ status: 'done' }, { headers: OWNER_HEADERS }) : ownerReply('Event not found or already acknowledged', 404)
  } catch (err) {
    console.error('[os/attention] acknowledge', err instanceof Error ? err.message : err)
    return ownerReply('Attention unavailable', 503)
  }
})
