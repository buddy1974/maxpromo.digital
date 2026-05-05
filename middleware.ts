import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifySession } from '@/lib/auth'

/**
 * Edge middleware — runs before every request matched by `config.matcher`.
 *
 * Responsibilities:
 *   1. Gate /os/* page routes — redirect to /os/login when unauthed.
 *   2. Gate /api/os/* routes — return 401 JSON when unauthed.
 *   3. Allow the login + logout endpoints through unconditionally so
 *      the unauthed user can actually authenticate.
 */

const PUBLIC_OS_API_PATHS = new Set([
  '/api/os/login',
  '/api/os/logout',
])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public OS API routes (login/logout) bypass the gate.
  if (PUBLIC_OS_API_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Login page itself is public.
  if (pathname === '/os/login') {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = await verifySession(token)

  if (!session) {
    if (pathname.startsWith('/api/os/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Redirect HTML routes to login with returnTo
    const loginUrl = new URL('/os/login', req.url)
    if (pathname && pathname !== '/os') {
      loginUrl.searchParams.set('returnTo', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Forward the verified user id to downstream handlers in case they
  // want to read it without parsing the cookie again.
  const headers = new Headers(req.headers)
  headers.set('x-os-user', session.sub)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Match every /os and /api/os route. Excludes /api/os/login and
  // /api/os/logout via the early-return above.
  matcher: ['/os/:path*', '/api/os/:path*'],
}
