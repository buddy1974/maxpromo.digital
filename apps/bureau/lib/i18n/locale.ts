import { cookies, headers } from 'next/headers'
import { resolveDomain } from '@maxpromo/config'

/**
 * lib/i18n/locale.ts — which language this request is in.
 *
 * WHY THERE IS NO /de AND NO /en IN THE URL
 * The Domain Registry declares `useLocalePrefix: false` for
 * agents.maxpromo.digital, and that is not an oversight. This application has
 * one authenticated product behind NextAuth: a locale segment would put a
 * prefix in front of every callback URL, every `callbackUrl` round trip, every
 * deep link a customer has been sent, and the middleware's one protected
 * prefix. The hub carries /de and /en because it is a public site with two
 * complete copies of itself. A product does not need two addresses to speak
 * two languages.
 *
 * So the locale lives in a cookie, is read on the server on every request, and
 * never appears in a URL. Switching language keeps you exactly where you were,
 * signed in, on the same route.
 *
 * WHERE THE DEFAULT COMES FROM
 * `primaryLanguage` in the registry, not from a constant written here. German
 * is this product's governed default and stays the default; English is now a
 * complete second language rather than a fallback. If the registry ever
 * changes its mind, this file does not have to be found first.
 */

const BUREAU = resolveDomain('agents.maxpromo.digital')

/** The languages this product speaks, in the registry's own order. */
export const LOCALES = ['de', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = BUREAU.primaryLanguage as Locale

/** Long-lived: a language preference is not a session. */
export const LOCALE_COOKIE = 'bureau_locale'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'de' || value === 'en'
}

/**
 * The locale for this request.
 *
 * Cookie first, because it is a choice somebody made. `Accept-Language` only
 * when there is no cookie, so a German browser opening the link for the first
 * time gets German and an English one gets English — and neither is stuck with
 * it. Anything else is the registry's primary language.
 *
 * Deliberately never falls through to "whatever we have": a missing
 * translation must show as a missing translation in development and be caught
 * by `npm run check:i18n`, not be papered over at runtime with the other
 * language. That is how a page ends up half German.
 */
export async function resolveLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie

  const accept = (await headers()).get('accept-language') ?? ''
  const preferred = accept
    .split(',')
    .map((part) => part.split(';')[0]?.trim().slice(0, 2).toLowerCase())
    .find((code) => isLocale(code))

  return isLocale(preferred) ? preferred : DEFAULT_LOCALE
}

/** The tag for `<html lang>`, `Intl` and OpenGraph. */
export const HTML_LANG: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' }
export const OG_LOCALE: Record<Locale, string> = { de: 'de_DE', en: 'en_GB' }
