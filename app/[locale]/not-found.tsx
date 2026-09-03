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
        background: '#0A0A0A',
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
          fontFamily: 'var(--font-roboto-mono)',
          fontSize: '11px',
          color: 'var(--brand-primary)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          margin: '0 0 16px',
        }}
      >
        {'404'}
      </p>
      <h1 style={{ color: '#FFFFFF', margin: '0 0 12px' }}>
        {de ? 'Diese Seite gibt es nicht.' : 'This page does not exist.'}
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '16px',
          color: '#888888',
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
          fontFamily: 'var(--font-roboto-mono)',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: 'var(--brand-primary)',
          color: '#000',
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
