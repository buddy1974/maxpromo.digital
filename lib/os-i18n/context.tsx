'use client'

/**
 * lib/os-i18n/context.tsx
 *
 * Client-side language context for the authenticated OS UI. This is
 * intentionally NOT next-intl / URL-segment based — /os and /api/os are
 * excluded from intlMiddleware on purpose (see middleware.ts comments),
 * because the OS is one authenticated app shell, not a set of
 * locale-prefixed public routes. Instead, the selected OS language is a
 * per-browser client preference, persisted in a plain (non-httpOnly)
 * cookie so it survives reloads and new tabs.
 *
 * This is a completely separate axis from a document's own language
 * (invoice.language / angebot.language, lib/documents/labels.ts) — an OS
 * user can browse the interface in German while an individual invoice is
 * written in English, and vice versa.
 *
 * Implementation note: the cookie is read via `useSyncExternalStore`
 * rather than `useState` + `useEffect`, so the store subscription model
 * (not a synchronous setState-in-effect) drives updates — the idiomatic
 * React pattern for syncing with an external, non-React-owned source of
 * truth like `document.cookie`. `getServerSnapshot` returns the default
 * locale for SSR; React reconciles the real client value right after
 * hydration with no manual effect needed.
 */

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import { DEFAULT_OS_LOCALE, INTL_LOCALE, OS_DICTIONARY, OS_LOCALE_COOKIE, type OsLocale } from './dictionary'

type OsDict = typeof OS_DICTIONARY['de']

interface OsLocaleContextValue {
  locale: OsLocale
  setLocale: (l: OsLocale) => void
  t: OsDict
  /** BCP-47 tag for Intl.* formatting of dates/numbers in the OS chrome. */
  intlLocale: string
  /** Currency formatter bound to the current OS locale (always EUR). */
  fmtEur: (n: number) => string
  /** Date formatter bound to the current OS locale. */
  fmtDate: (v: string | Date | null | undefined) => string
}

const OsLocaleContext = createContext<OsLocaleContextValue | null>(null)

function readCookieLocale(): OsLocale {
  if (typeof document === 'undefined') return DEFAULT_OS_LOCALE
  const match = document.cookie.match(new RegExp(`(?:^|; )${OS_LOCALE_COOKIE}=(de|en)`))
  return match ? (match[1] as OsLocale) : DEFAULT_OS_LOCALE
}

function writeCookieLocale(l: OsLocale) {
  if (typeof document === 'undefined') return
  // 1 year, path=/os so it's scoped to the OS app but survives across all its routes.
  document.cookie = `${OS_LOCALE_COOKIE}=${l}; path=/os; max-age=31536000; SameSite=Lax`
}

// Minimal pub/sub so useSyncExternalStore can react to setLocale() calls
// made from within this tab — the cookie itself has no native change
// event, so we notify subscribers ourselves right after writing it.
const listeners = new Set<() => void>()
function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}
function notifyListeners() {
  listeners.forEach(cb => cb())
}
function getServerSnapshot(): OsLocale {
  return DEFAULT_OS_LOCALE
}

export function OsLocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readCookieLocale, getServerSnapshot)

  const setLocale = useCallback((l: OsLocale) => {
    writeCookieLocale(l)
    notifyListeners()
  }, [])

  const value = useMemo<OsLocaleContextValue>(() => {
    const intlLocale = INTL_LOCALE[locale]
    return {
      locale,
      setLocale,
      t: OS_DICTIONARY[locale],
      intlLocale,
      fmtEur: (n: number) =>
        new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'EUR' }).format(Number(n) || 0),
      fmtDate: (v: string | Date | null | undefined) => {
        if (!v) return '—'
        const d = v instanceof Date ? v : new Date(v)
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(intlLocale)
      },
    }
  }, [locale, setLocale])

  return <OsLocaleContext.Provider value={value}>{children}</OsLocaleContext.Provider>
}

/** Access the current OS UI language + translation dictionary. Must be used within OsLocaleProvider (wired in app/os/(protected)/layout.tsx). */
export function useOsLocale(): OsLocaleContextValue {
  const ctx = useContext(OsLocaleContext)
  if (!ctx) throw new Error('useOsLocale() must be used within <OsLocaleProvider>')
  return ctx
}
