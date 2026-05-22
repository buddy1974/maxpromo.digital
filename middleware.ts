import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { COOKIE_NAME, verifySession } from '@/lib/auth'
import { routing } from '@/i18n/routing'
import { resolveHost } from '@/lib/host/resolve'

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

  // ── 0. Host resolution (fires first for every matched request) ──────
  // Normalises the Host header and stamps four x-mp-* request headers so
  // any server component can read them via `headers()` from 'next/headers'.
  const hostHeader = req.headers.get('host')
  const resolution = resolveHost(hostHeader)
  const resolvedHeaders = new Headers(req.headers)
  resolvedHeaders.set('x-mp-host',           hostHeader ?? '')
  resolvedHeaders.set('x-mp-mode',           resolution.mode)
  resolvedHeaders.set('x-mp-slug',           resolution.slug ?? '')
  resolvedHeaders.set('x-mp-default-locale', resolution.defaultLocale)

  // ── 1. OS auth gate ────────────────────────────────────────────────
  // Anything under /os or /api/os goes through the existing auth check.
  // The login/logout endpoints bypass the gate so the unauthed user
  // can actually authenticate.
  if (pathname.startsWith('/os') || pathname.startsWith('/api/os')) {
    if (PUBLIC_OS_API_PATHS.has(pathname) || pathname === '/os/login') {
      return NextResponse.next({ request: { headers: resolvedHeaders } })
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

    // Forward verified user id alongside the host-resolution headers.
    resolvedHeaders.set('x-os-user', session.sub)
    return NextResponse.next({ request: { headers: resolvedHeaders } })
  }

  // ── 2. Showcase hosts — no locale prefix in visible URL ────────────
  // For hosts like restaurant-os.de the user never sees /de/ in the URL.
  //   • Redirect /de (default) prefix → strip it (canonical = no prefix)
  //   • Rewrite bare paths → /{defaultLocale}/... so next-intl resolves them
  if (resolution.mode === 'showcase' && !resolution.useLocalePrefix) {
    const dl = resolution.defaultLocale

    // /de or /de/... on a de-default host → redirect to strip the prefix
    if (pathname === `/${dl}` || pathname.startsWith(`/${dl}/`)) {
      const stripped = pathname.startsWith(`/${dl}/`)
        ? pathname.slice(`/${dl}`.length)
        : '/'
      return NextResponse.redirect(new URL(stripped, req.url))
    }

    // Bare path (no locale prefix) → internal rewrite so next-intl resolves
    const hasLocalePrefix =
      pathname === '/de' || pathname === '/en' ||
      pathname.startsWith('/de/') || pathname.startsWith('/en/')

    if (!hasLocalePrefix) {
      const target = pathname === '/' ? `/${dl}` : `/${dl}${pathname}`
      return NextResponse.rewrite(new URL(target, req.url), {
        request: { headers: resolvedHeaders },
      })
    }
  }

  // ── 3. Locale routing — hub + showcase-with-prefix ──────────────────
  // Pass a modified request so x-mp-* headers reach server components via
  // next-intl's internal NextResponse.next({ request: { headers } }) call.
  const modReq = new NextRequest(req.url, {
    method:  req.method,
    headers: resolvedHeaders,
  })
  return intlMiddleware(modReq)
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
