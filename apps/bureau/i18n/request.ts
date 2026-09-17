import { getRequestConfig } from 'next-intl/server'
import { resolveLocale } from '@/lib/i18n/locale'

/**
 * i18n/request.ts — the translation bundle for this request.
 *
 * next-intl "without i18n routing": there is no [locale] segment in this
 * application and no locale in any URL (see lib/i18n/locale.ts for why), so
 * the locale comes from the cookie rather than from a route param. Everything
 * downstream — `getTranslations`, `useTranslations`, `getFormatter` — behaves
 * exactly as it does on the hub.
 *
 * The same convention as apps/web, one layer lower: same library, same message
 * files, same key style, resolved from a different place.
 */
export default getRequestConfig(async () => {
  const locale = await resolveLocale()

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    /**
     * No fallback locale, on purpose. next-intl throws on a missing key in
     * development and renders the key path in production; both are visible.
     * Silently substituting the other language is what produces a German
     * sentence in the middle of an English page, and `npm run check:i18n`
     * exists so it never gets that far.
     */
    onError(error) {
      if (process.env.NODE_ENV === 'development') throw error
      console.error('[i18n]', error.message)
    },
  }
})
