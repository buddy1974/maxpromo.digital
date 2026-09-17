'use client'

import { useEffect } from 'react'
import { token } from '@maxpromo/design-tokens'

/**
 * The last boundary, for Agent Bureau.
 *
 * `global-error.tsx` catches what `error.tsx` cannot: a failure in the root
 * layout itself. It replaces the whole document, which is why it renders its
 * own `<html>` and `<body>` and why it cannot use the design system — at this
 * point the layout that loads the fonts and the tokens is the thing that
 * broke.
 *
 * Before v15.0 neither application had any error boundary at all. A runtime
 * failure rendered the framework's default — a blank page reading "Application
 * error: a client-side exception has occurred" — with nothing written down
 * anywhere. On the dashboard side that page is what an operator would have seen
 * mid-approval, with no reference to quote to anyone.
 *
 * The colours come from the token package's TypeScript mirror rather than from
 * `var(--brand-*)`. This component renders when the root layout has failed, so
 * the stylesheet that defines those custom properties may never have loaded —
 * but the mirror is a plain object bundled into the same chunk as this
 * component, so if it were unavailable there would be nothing here to render
 * it. Same values, no stylesheet dependency, and no exception needed to the
 * rule that nothing in this repository writes a colour.
 *
 * THE WORDS ARE HERE FOR THE SAME REASON THE COLOURS ARE
 * The root layout is what mounts `NextIntlClientProvider`, so at this point
 * there is no catalogue to read from: `useTranslations` would throw inside the
 * boundary whose whole job is to be the thing that does not throw. Every other
 * surface in this product reads its text from `messages/{de,en}.json`, and
 * this one cannot.
 *
 * So both languages are bundled into this chunk, chosen from the same locale
 * cookie the server reads, with German as the same default the registry
 * declares. It is four strings, it is the last screen before a blank page, and
 * it is the one place in Agent Bureau where a literal is the correct answer
 * rather than a missed one. The `i18n-exempt` marker below says so to the
 * audit, which would otherwise be right to fail this file.
 */
/**
 * i18n-exempt — the catalogue is unreachable here; see the note above.
 * Both languages are present, which is what "supported" means.
 */
const COPY = {
  de: {
    title: 'Diese Seite konnte nicht geladen werden',
    body: 'Ein technischer Fehler hat das Laden verhindert. Der Fehler wurde aufgezeichnet. Bitte versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
    reference: 'Referenz',
  },
  en: {
    title: 'This page could not be loaded',
    body: 'A technical error prevented it from loading. The error has been recorded. Please try again.',
    retry: 'Try again',
    reference: 'Reference',
  },
}

/** The cookie the server reads, read here without the server. */
function readLocale(): 'de' | 'en' {
  if (typeof document === 'undefined') return 'de'
  const match = document.cookie.match(/(?:^|;\s*)bureau_locale=(de|en)/)
  return match ? (match[1] as 'de' | 'en') : 'de'
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const locale = readLocale()
  const copy = COPY[locale]

  useEffect(() => {
    // Structured, so it can be found among everything else Vercel collects.
    // `digest` is the server-side identity of the error: the stack itself is
    // stripped in production, and this is what ties this page to the log line
    // the server already wrote.
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'critical',
      event: 'render.root.failed',
      surface: 'bureau',
      digest: error.digest,
      name: error.name,
      message: error.message?.slice(0, 300),
    }))
  }, [error])

  return (
    <html lang={locale}>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: token.surface, color: token.text }}>
        <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
            {copy.title}
          </h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: token.textSecondary, margin: '0 0 1.5rem' }}>
            {copy.body}
          </p>
          <button
            onClick={reset}
            style={{
              font: 'inherit', fontWeight: 600, cursor: 'pointer',
              background: token.primary, color: token.onPrimary, border: 'none',
              padding: '0.7rem 1.2rem', borderRadius: '6px', minHeight: '44px',
            }}
          >
            {copy.retry}
          </button>
          {error.digest ? (
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', color: token.textMuted, marginTop: '2rem' }}>
              {copy.reference}: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}
