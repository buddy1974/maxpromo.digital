import { NextResponse } from 'next/server'
import { resolveDomain } from '@maxpromo/config'
import { signHandoff } from '@maxpromo/config/agent-contract'
import { withAuth } from '@/lib/auth'
import { OWNER_ACTOR } from '@/lib/commercial/types'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { writeAudit } from '@/lib/commercial/audit'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/os/bureau/handoff — open the Agent Bureau admin without a second login (ADR-0030).
 *
 * Owner session only. Issues a one-time, 60-second ticket (@maxpromo/config/agent-contract
 * signHandoff) and redirects to the Bureau's /sso page, which checks it once and starts the Bureau's
 * own session for its owner user. Without the shared credential it falls back to the Bureau login.
 * The ticket is never logged; the handoff itself is audited.
 */
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request, { session }) => {
  const limited = enforceRateLimit(request, { scope: 'os-bureau-handoff', limit: 20, windowMs: 10 * 60_000 })
  if (limited) return limited
  const bureau = resolveDomain('agents.maxpromo.digital').origin
  const actor = `os:${session.sub}`
  if (actor !== OWNER_ACTOR) return NextResponse.redirect(`${bureau}/login`, 303)
  const ticket = signHandoff(process.env, actor)
  if (!ticket) return NextResponse.redirect(`${bureau}/login`, 303)
  if (isDatabaseConfigured()) await writeAudit(getDb(), { actor, channel: 'os-web', operation: 'bureau.handoff', outcome: 'succeeded' })
  const res = NextResponse.redirect(`${bureau}/sso#t=${ticket}`, 303)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('Referrer-Policy', 'no-referrer')
  return res
})
