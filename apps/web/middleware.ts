import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { COOKIE_NAME, verifySession } from '@/lib/auth'
import { routing } from '@/i18n/routing'
import { resolveWebDomain } from '@/lib/domains/resolve'
import { FALLBACK_DOMAIN, servesRoute, servesLocale } from '@maxpromo/config'
import { newTrace, TRACE_HEADER } from '@maxpromo/observability'

/**
 * Composed Edge middleware.
 *
 * Identity first. Every request resolves to a Domain Registry entry before
 * anything else happens, and the four concerns below are all decided from that
 * one record rather than each guessing for itself:
 *
 *   0. Host resolution      which property is this, and what may it serve,
 *                           and the correlation id everything about it carries
 *   1. OS auth gate         staff routes, hub host only
 *   2. Domain isolation     a path this domain does not serve goes to the hub
 *   3. Language governance  a locale this domain does not speak is redirected
 *   4. Locale routing       prefix handling, then next-intl
 *
 * WHY THE ORDER
 *
 * Isolation runs before locale routing because the question "does this domain
 * serve /about" is about the domain, not about the URL's spelling. Running it
 * afterwards would have meant asking it once per locale form, which is how a
 * rule ends up enforced on /de/about and not on /about.
 *
 * Language governance runs before rendering for the same reason RC1-04 exists:
 * the product registry falls back from German to English field by field and
 * says nothing, so the only place a mixed-language page can be prevented is
 * before it is built. A domain that does not list a language does not serve it.
 */

const PUBLIC_OS_API_PATHS = new Set([
  '/api/os/login',
  '/api/os/logout',
])

const intlMiddleware = createMiddleware(routing)

const LOCALES = routing.locales as readonly string[]

/** Splits `/de/contact` into its locale and the path beneath it. */
function splitLocale(pathname: string): { locale: string | null; path: string } {
  const seg = pathname.split('/')[1]
  if (seg && LOCALES.includes(seg)) {
    const rest = pathname.slice(seg.length + 1)
    return { locale: seg, path: rest === '' ? '/' : rest }
  }
  return { locale: null, path: pathname }
}

/** The same path on the consultancy site, which always carries a locale prefix. */
function hubUrl(path: string, locale: string): string {
  const l = LOCALES.includes(locale) ? locale : routing.defaultLocale
  return `${FALLBACK_DOMAIN.origin}/${l}${path === '/' ? '' : path}`
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 0. Identity ────────────────────────────────────────────────────────
  // One lookup. Every decision below reads this record; nothing re-derives it
  // from the Host header, and nothing hardcodes a domain name.
  const hostHeader = req.headers.get('host')
  const domain = resolveWebDomain(hostHeader)

  const { locale: urlLocale, path } = splitLocale(pathname)

  const resolvedHeaders = new Headers(req.headers)
  resolvedHeaders.set('x-mp-host',           hostHeader ?? '')
  resolvedHeaders.set('x-mp-mode',           domain.mode)
  resolvedHeaders.set('x-mp-slug',           domain.productSlug ?? '')
  resolvedHeaders.set('x-mp-default-locale', domain.primaryLanguage)
  // The registry key, so a server component can look the full record up
  // without re-normalising a Host header of its own.
  resolvedHeaders.set('x-mp-domain',         domain.host)
  // A correlation id for this request.
  //
  // One deployment answers ten public domains, so a log line that cannot be
  // tied back to a single visitor's journey is a log line nobody can act on.
  // An inbound id is honoured — a load balancer or an upstream caller may
  // already have started the trace — and otherwise one is minted here, at the
  // only point every request passes through.
  const trace = req.headers.get(TRACE_HEADER) ?? newTrace()
  resolvedHeaders.set(TRACE_HEADER, trace)
  // The locale this request will render in.
  //
  // A product domain shows no prefix for its own language, so the middleware
  // rewrites `/` to `/en` internally without going through next-intl — and
  // next-intl's getLocale() then returns the routing default in the root
  // layout, because nothing told it otherwise. drive24.live and
  // publishers24.org, the two English-led domains, served every page as
  // `<html lang="de">`. Stamping the answer removes the guess.
  resolvedHeaders.set('x-mp-locale',         urlLocale ?? domain.primaryLanguage)

  /**
   * Every response leaves with the trace id on it.
   *
   * Stamped in one place rather than at each `return`, because the first
   * version of this set it only on the two paths that happened to be tested —
   * and a product domain's home page, which is the most-served route on the
   * platform, goes through the rewrite branch and left without one.
   */
  const traced = (res: NextResponse) => {
    res.headers.set(TRACE_HEADER, trace)
    return res
  }
  const pass = () => traced(NextResponse.next({ request: { headers: resolvedHeaders } }))

  // ── 1. OS auth gate ────────────────────────────────────────────────────
  // Staff routes belong to one address. Before v13.0 they answered on all ten
  // public domains: robots.txt kept them out of the index, but a customer on
  // pflege-care24.de could still reach the Maxpromo staff login.
  if (pathname.startsWith('/os') || pathname.startsWith('/api/os')) {
    if (domain.mode !== 'hub') {
      if (pathname.startsWith('/api/os')) {
        // Never redirect an API call across origins — a POSTed login would
        // arrive at the hub stripped of its body. It simply is not here.
        return traced(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      }
      return traced(NextResponse.redirect(`${FALLBACK_DOMAIN.origin}${pathname}`, 308))
    }

    if (PUBLIC_OS_API_PATHS.has(pathname) || pathname === '/os/login') {
      return pass()
    }

    const token = req.cookies.get(COOKIE_NAME)?.value
    const session = await verifySession(token)

    if (!session) {
      if (pathname.startsWith('/api/os/')) {
        return traced(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const loginUrl = new URL('/os/login', req.url)
      if (pathname && pathname !== '/os') {
        loginUrl.searchParams.set('returnTo', pathname)
      }
      return traced(NextResponse.redirect(loginUrl))
    }

    resolvedHeaders.set('x-os-user', session.sub)
    return pass()
  }

  // ── 2. Domain isolation ────────────────────────────────────────────────
  // The path is judged without its locale prefix, so the answer cannot depend
  // on which spelling of the URL was requested.
  //
  // Redirect rather than 404: the page exists and is worth reading, it is just
  // not this domain's page. This also keeps every inbound link alive.
  if (!servesRoute(domain, path)) {
    return traced(NextResponse.redirect(hubUrl(path, urlLocale ?? domain.primaryLanguage), 308))
  }

  // ── 3. Language governance ─────────────────────────────────────────────
  // A locale this domain does not speak is not rendered in a degraded form; it
  // is redirected to the language the domain actually has copy in.
  if (urlLocale && !servesLocale(domain, urlLocale)) {
    const canonical = domain.useLocalePrefix ? `/${domain.primaryLanguage}${path === '/' ? '' : path}` : path
    return traced(NextResponse.redirect(new URL(canonical, req.url), 308))
  }

  // ── 4. Locale routing ──────────────────────────────────────────────────
  // Product domains show no locale prefix: restaurant-os.de/contact, never
  // restaurant-os.de/de/contact. The prefix still exists internally because
  // next-intl resolves messages from it.
  if (!domain.useLocalePrefix) {
    // The primary language's prefix is redundant in the URL — strip it so one
    // page has one address.
    if (urlLocale === domain.primaryLanguage) {
      return traced(NextResponse.redirect(new URL(path, req.url), 308))
    }
    // A second supported language keeps its prefix and falls through to
    // next-intl below (restaurant-os.de/en).
    if (!urlLocale) {
      const target = `/${domain.primaryLanguage}${path === '/' ? '' : path}`
      return traced(NextResponse.rewrite(new URL(target, req.url), {
        request: { headers: resolvedHeaders },
      }))
    }
  }

  // Hub, and the prefixed second language of a product domain.
  const modReq = new NextRequest(req.url, {
    method:  req.method,
    headers: resolvedHeaders,
  })
  return traced(intlMiddleware(modReq))
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
   *
   * Metadata routes (robots.txt, sitemap.xml, manifest.webmanifest) are
   * excluded by the dot rule and read the raw Host header themselves — see
   * lib/domains/server.ts.
   */
  matcher: [
    // OS routes go through the auth gate
    '/os/:path*',
    '/api/os/:path*',
    // All other paths get locale routing, except internals and static
    '/((?!_next|api/(?!os)|_vercel|.*\\.).*)',
  ],
}
