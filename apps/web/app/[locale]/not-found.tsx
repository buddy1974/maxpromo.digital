'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

/**
 * Localized 404 for the public site. Renders inside app/[locale]/layout, so
 * it inherits the locale segment. Uses the same inline locale pattern as the
 * funnel tool pages (/contact, /contact) rather than the message catalog,
 * to stay self-contained and avoid a hard dependency during error rendering.
 */
export default function LocaleNotFound() {
  const params = useParams<{ locale: string }>()
  const de = params?.locale === 'de'

  return (
    <main
      style={{
        background: 'var(--brand-background)',
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--brand-font-mono)',
          fontSize: 'var(--text-label)',
          color: 'var(--brand-primary-text)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          margin: '0 0 16px',
        }}
      >
        {'404'}
      </p>
      <h1 style={{ color: 'var(--brand-text-inverted)', margin: '0 0 12px' }}>
        {de ? 'Diese Seite gibt es nicht.' : 'This page does not exist.'}
      </h1>
      <p
        style={{
          fontFamily: 'var(--brand-font-body)',
          fontSize: '16px',
          color: 'var(--brand-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 32px',
          maxWidth: '440px',
        }}
      >
        {de
          ? 'Der Link ist vielleicht veraltet oder falsch geschrieben. Zurück zur Startseite geht es hier.'
          : 'The link may be outdated or mistyped. You can head back to the homepage from here.'}
      </p>
      <Link
        href={`/${de ? 'de' : 'en'}`}
        style={{
          fontFamily: 'var(--brand-font-mono)',
          fontWeight: 700,
          fontSize: 'var(--text-micro)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: 'var(--brand-primary)',
          color: 'var(--brand-text)',
          padding: '14px 24px',
          textDecoration: 'none',
          borderRadius: '2px',
        }}
      >
        {de ? 'Zur Startseite →' : 'Back to home →'}
      </Link>
    </main>
  )
}
