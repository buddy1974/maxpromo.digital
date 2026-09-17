import { NextRequest, NextResponse } from 'next/server'
import { DEMO_COOKIE, resolveDemoSession, demoRoomIsClosed } from '@/lib/demo/access'
import { getDemo, grantAuthorises } from '@/lib/demo/registry'

/**
 * GET /demo/open/<id>
 *
 * The only route that knows where a demonstration lives, and it re-checks
 * authorisation for that specific demo before it says so.
 *
 * Authorisation is per demo, not per session: holding a valid cookie is not
 * enough. A visitor granted one demonstration cannot reach another by editing
 * the id in the address bar, which is the obvious attack on a room like this.
 *
 * Every refusal is the same redirect, so the endpoint does not distinguish a
 * demo that does not exist from one this visitor may not see.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = NextResponse.redirect(new URL('/demo', request.url))
  if (demoRoomIsClosed()) return denied

  const { id } = await params
  const cookie = request.cookies.get(DEMO_COOKIE)?.value
  const grant = await resolveDemoSession(cookie)
  if (!grant) return denied

  if (!grantAuthorises(grant, id)) return denied

  const demo = getDemo(id)
  if (!demo) return denied

  return NextResponse.redirect(demo.destination)
}
