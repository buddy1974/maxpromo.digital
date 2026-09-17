import type { Locale } from './locale'

/**
 * lib/i18n/format.ts — dates, times and the part of the day.
 *
 * WHY THESE ARE NOT STRINGS IN THE CATALOGUE
 * A date is not text to be translated; it is a value to be formatted. Written
 * into the message files it would drift — "14.03.2026" in one place and
 * "14. März 2026" in another, and neither would be right for an English
 * reader. `Intl` already knows all of this, in every locale, and it is in the
 * runtime.
 *
 * ONE TIME ZONE, NAMED
 * The business operates from Essen, and an operator in Essen should see the
 * same "today" whatever the server thinks. `Europe/Berlin` is stated once
 * here rather than left to whichever machine renders the page — a dashboard
 * that says "Good evening" at four in the afternoon because it is deployed in
 * a different region is the usual way this shows up.
 */

export const TIME_ZONE = 'Europe/Berlin'

const TAG: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' }

/** 14.03.2026 · 14/03/2026 */
export function formatDate(value: Date | string, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(TAG[locale], {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TIME_ZONE,
  }).format(date)
}

/** 14. März 2026 · 14 March 2026 */
export function formatDateLong(value: Date | string, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(TAG[locale], {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE,
  }).format(date)
}

/** 14.03.2026, 09:41 · 14/03/2026, 09:41 */
export function formatDateTime(value: Date | string, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(TAG[locale], {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE,
  }).format(date)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(TAG[locale]).format(value)
}

/**
 * Which greeting to use, in Essen's day rather than the server's.
 *
 * The name is never part of the translated sentence — it is interpolated into
 * it, so a message file never contains a person.
 */
export function partOfDay(now: Date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: TIME_ZONE }).format(now),
  )
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/** The name to greet: what the account calls itself, never the email address. */
export function displayName(user: { name?: string | null; email?: string | null } | null): string {
  const name = user?.name?.trim()
  if (name) return name.split(' ')[0]
  const email = user?.email ?? ''
  const local = email.split('@')[0]
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : ''
}
