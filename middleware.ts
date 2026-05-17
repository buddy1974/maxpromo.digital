import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { COOKIE_NAME, verifySession } from '@/lib/auth'
import { routing } from '@/i18n/routing'

/**
 * Composed Edge middleware.
 *
 * Two concerns share this single function — order matters:
 *
 *  1. OS auth gate (/os/* and /api/os/*)
 *     Existing behaviour preserved verbatim. These routes are NOT
 *     localized — they're the internal admin and its API.
 *
 *  2. next-intl locale routing (everything else under matcher)
 *     Detects Accept-Language on first hit, redirects /foo → /de/foo
 *     or /en/foo, sets a cookie so the choice sticks, and keeps the
 *     locale segment present on every navigation. Excludes /api/*
 *     (API routes don't get a locale prefix).
 */

const PUBLIC_OS_API_PATHS = new Set([
  '/api/os/login',
  '/api/os/logout',
])

const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. OS auth gate ────────────────────────────────────────────────
  // Anything under /os or /api/os goes through the existing auth check.
  // The login/logout endpoints bypass the gate so the unauthed user
  // can actually authenticate.
  if (pathname.startsWith('/os') || pathname.startsWith('/api/os')) {
    if (PUBLIC_OS_API_PATHS.has(pathname) || pathname === '/os/login') {
      return NextResponse.next()
    }

    const token = req.cookies.get(COOKIE_NAME)?.value
    const session = await verifySession(token)

    if (!session) {
      if (pathname.startsWith('/api/os/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/os/login', req.url)
      if (pathname && pathname !== '/os') {
        loginUrl.searchParams.set('returnTo', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    // Forward verified user id so downstream handlers can read it
    // without re-parsing the cookie.
    const headers = new Headers(req.headers)
    headers.set('x-os-user', session.sub)
    return NextResponse.next({ request: { headers } })
  }

  // ── 2. Locale routing for public site ──────────────────────────────
  // All non-/os and non-/api/os paths are public marketing routes.
  // next-intl handles Accept-Language detection, redirects to the
  // locale-prefixed URL, and sets the NEXT_LOCALE cookie.
  return intlMiddleware(req)
}

export const config = {
  /**
   * Match everything except Next.js internals, static files, and the
   * remaining /api/* routes (the public lead-capture APIs don't need
   * locale prefixing; OS API gating happens inside the function above).
   *
   * Exclusions:
   *   /_next/*       — framework internals
   *   /api/*         — unless it's /api/os (handled above)
   *   /favicon.ico, /robots.txt, /sitemap.xml, etc. — static
   *   files with a dot in the path — public assets (.svg, .png, etc.)
   */
  matcher: [
    // OS routes go through the auth gate
    '/os/:path*',
    '/api/os/:path*',
    // All other paths get locale routing, except internals and static
    '/((?!_next|api/(?!os)|_vercel|.*\\.).*)',
  ],
}
