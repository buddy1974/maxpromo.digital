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
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
    <html lang="de">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: token.surface, color: token.text }}>
        <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
            Diese Seite konnte nicht geladen werden
          </h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: token.textSecondary, margin: '0 0 1.5rem' }}>
            Ein technischer Fehler hat das Laden verhindert. Der Fehler wurde aufgezeichnet.
            Bitte versuchen Sie es erneut.
          </p>
          <button
            onClick={reset}
            style={{
              font: 'inherit', fontWeight: 600, cursor: 'pointer',
              background: token.primary, color: token.onPrimary, border: 'none',
              padding: '0.7rem 1.2rem', borderRadius: '6px', minHeight: '44px',
            }}
          >
            Erneut versuchen
          </button>
          {error.digest ? (
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', color: token.textMuted, marginTop: '2rem' }}>
              Referenz: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}
