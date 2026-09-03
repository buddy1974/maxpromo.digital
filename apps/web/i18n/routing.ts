import { defineRouting } from 'next-intl/routing'

/**
 * Locale routing config — shared by the middleware, the request handler,
 * and the typed navigation helpers (Link, useRouter, redirect).
 *
 * - locales: the two we support. German first because Marcel's primary
 *   market is DE-speaking; English second for international visitors.
 * - defaultLocale: 'de' — the typical visitor we expect; new URLs
 *   without a locale prefix get redirected to /de/* on first hit
 *   unless the visitor's Accept-Language header says otherwise.
 * - localePrefix: 'always' — every URL carries /de or /en so Google
 *   indexes both as separate canonical pages and shared links
 *   preserve the language of the screenshot.
 */
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'always',
})
