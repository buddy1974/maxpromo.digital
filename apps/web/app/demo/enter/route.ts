import { NextRequest, NextResponse } from 'next/server'
import { verifyDemoToken, signDemoSession, buildDemoCookie, demoRoomIsClosed } from '@/lib/demo/access'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * GET /demo/enter?g=<grantId>&t=<token>
 *
 * Exchanges an access link for a session cookie, then redirects to the room.
 *
 * Rate limited, because this is the one endpoint where a value is guessed
 * against. Every failure returns the same redirect as every other failure: a
 * caller cannot tell an unknown grant from a revoked one from a wrong token,
 * so the endpoint leaks nothing about which grants exist.
 *
 * The token never reaches the room's URL. It is consumed here and replaced by
 * an httpOnly cookie, so it does not sit in the address bar, the history or a
 * referrer header once the visitor is inside.
 */
export async function GET(request: NextRequest) {
  const blocked = enforceRateLimit(request, { scope: 'demo-enter', limit: 10, windowMs: 60_000 })
  if (blocked) return blocked

  const denied = NextResponse.redirect(new URL('/demo', request.url))

  if (demoRoomIsClosed()) return denied

  const grantId = request.nextUrl.searchParams.get('g')
  const token = request.nextUrl.searchParams.get('t') ?? undefined
  if (!grantId) return denied

  const grant = await verifyDemoToken(grantId, token)
  if (!grant) return denied

  const session = await signDemoSession(grant.id)
  if (!session) return denied

  const ok = NextResponse.redirect(new URL('/demo', request.url))
  ok.headers.set('Set-Cookie', buildDemoCookie(session))
  return ok
}
