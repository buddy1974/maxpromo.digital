import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

/**
 * Request handler — runs per-request on the server to load the right
 * translation bundle for the locale being rendered. Wired into
 * Next.js via the createNextIntlPlugin() call in next.config.ts.
 *
 * Falls back to defaultLocale ('de') for any request that arrives
 * without a valid locale param — defensive against bots or
 * misconfigured links.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
