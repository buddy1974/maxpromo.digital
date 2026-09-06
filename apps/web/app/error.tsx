'use client'

import { useEffect } from 'react'

/**
 * The route-level boundary.
 *
 * Catches a failure in any page or layout below the root, which is nearly all
 * of them. The root layout survives, so the fonts, the tokens and the design
 * system are all available here — this component is allowed to look like the
 * platform, and `global-error.tsx` is not.
 *
 * It deliberately does not name the domain or the product. It renders on ten
 * public domains and inside the internal OS, and a boundary that tries to
 * resolve identity is a boundary with one more thing that can fail.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      event: 'render.route.failed',
      surface: 'web',
      digest: error.digest,
      name: error.name,
      message: error.message?.slice(0, 300),
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    }))
  }, [error])

  return (
    <main
      id="content"
      style={{
        maxWidth: 'var(--container)',
        margin: '0 auto',
        padding: 'var(--section-y) var(--section-x)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--brand-font-mono)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--brand-text-secondary)',
          margin: '0 0 var(--space-3)',
        }}
      >
        Fehler
      </p>
      <h1
        style={{
          fontFamily: 'var(--brand-font-heading)',
          fontSize: 'var(--text-h2)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          margin: '0 0 var(--space-4)',
          maxWidth: '22ch',
        }}
      >
        Dieser Abschnitt konnte nicht geladen werden
      </h1>
      <p
        style={{
          fontFamily: 'var(--brand-font-body)',
          fontSize: 'var(--text-body)',
          lineHeight: 1.7,
          color: 'var(--brand-text-secondary)',
          margin: '0 0 var(--space-6)',
          maxWidth: '46ch',
        }}
      >
        Der Fehler wurde aufgezeichnet. Sie können es erneut versuchen — der Rest der
        Seite funktioniert weiterhin.
      </p>
      <button
        onClick={reset}
        style={{
          font: 'inherit',
          fontWeight: 600,
          cursor: 'pointer',
          background: 'var(--brand-primary)',
          color: 'var(--brand-on-primary)',
          border: 'none',
          padding: '0.7rem 1.2rem',
          borderRadius: 'var(--radius-md)',
          minHeight: '44px',
        }}
      >
        Erneut versuchen
      </button>
      {error.digest ? (
        <p
          style={{
            fontFamily: 'var(--brand-font-mono)',
            fontSize: 'var(--text-label)',
            color: 'var(--brand-text-muted)',
            marginTop: 'var(--space-6)',
          }}
        >
          Referenz: {error.digest}
        </p>
      ) : null}
    </main>
  )
}
