import { defineRouting } from 'next-intl/routing'

/**
 * Locale routing config — shared by the middleware, the request handler,
 * and the typed navigation helpers (Link, useRouter, redirect).
 *
 * - locales: the two we support. German first because Marcel's primary
 *   market is DE-speaking; English second for international visitors.
 * - defaultLocale: 'de' — the typical visitor we expect, and the x-default
 *   destination in every hreflang set.
 * - localePrefix: 'always' — every URL carries /de or /en so Google
 *   indexes both as separate canonical pages and shared links
 *   preserve the language of the screenshot.
 *
 * ONE URL, ONE IDENTITY (Iteration 2A.1, Search Console evidence)
 *
 * An unprefixed URL is not a page. On the hub it answers a permanent 308 to
 * the same path under /de, for every client: browsers, Googlebot, curl — with
 * or without Accept-Language, with or without a cookie. middleware.ts issues
 * that redirect before next-intl runs. The defaults this replaces sent a
 * temporary 307 whose target followed Accept-Language and a NEXT_LOCALE
 * cookie, so `/` had no single destination; Google kept `/` itself as the
 * canonical and filed /de as a duplicate. A visitor changes language with the
 * switcher, which links to the other prefix.
 *
 * - localeDetection: false — no Accept-Language or cookie negotiation.
 * - localeCookie: false — nothing reads it any more, and a Set-Cookie on every
 *   page response makes the same URL look stateful.
 * - alternateLinks: false — next-intl's automatic `Link` header declared the
 *   unprefixed URL as x-default, contradicting the page head and the sitemap,
 *   which both say /de (lib/seo/og.ts, app/sitemap.ts). The head and the
 *   sitemap are the governed sources; there is no third.
 */
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
})
