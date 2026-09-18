'use client'

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

/**
 * components/HtmlLangSync.tsx
 *
 * Keeps `<html lang>` equal to the locale the reader is actually on.
 *
 * `<html lang>` is set in `app/layout.tsx`, which is the root layout — above
 * the `[locale]` segment. The App Router preserves layouts above the segment
 * that changed, so switching language from `/de/solutions` to `/en/solutions`
 * re-renders the page and the locale layout and leaves the root layout, and
 * therefore `lang`, exactly as it was. The document stayed `lang="de"` while
 * showing English until the next full page load.
 *
 * That is not cosmetic. `lang` is what a screen reader uses to choose its
 * pronunciation rules, what a browser uses to offer translation, and what
 * hyphenation and spell-checking key off. An English page announced as German
 * is read out in German phonetics.
 *
 * This is the narrowest fix available: one effect, inside the provider, that
 * assigns the attribute after a locale change. It does not touch the server
 * render — the first paint already carries the right `lang`, so there is no
 * hydration mismatch and no flash — it only repairs the case the framework's
 * layout preservation creates.
 *
 * Renders nothing.
 */
export default function HtmlLangSync() {
  const locale = useLocale()

  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale
    }
  }, [locale])

  return null
}
