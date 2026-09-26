'use client'

import Link from 'next/link'
import { useEffect } from 'react'
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

  /*
   * The tab title, set here because nowhere else can.
   *
   * A governed browser QA pass found `/de/no-such-page` and `/en/no-such-page`
   * both serving "Maxpromo Digital — Business Systems Consultancy": the site's
   * generic English company title, on a German page, describing a page that
   * does not exist. All three of those are wrong.
   *
   * Next does not support `generateMetadata` in `not-found.tsx`, and adding it
   * to the catch-all route does nothing because `notFound()` throws before the
   * page's metadata is used. So the title is set on the client, which is where
   * the visitor is. A 404 already carries a 404 status, so nothing here is
   * about search; it is about the person with twelve tabs open.
   */
  useEffect(() => {
    document.title = de ? 'Seite nicht gefunden' : 'Page not found'
  }, [de])

  return (
    <div
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
          margin: '0 0 var(--space-4)',
        }}
      >
        {'404'}
      </p>
      {/* `--brand-text-inverted` is near-white and this page sits on
          `--brand-background`, which is white: the headline measured about
          1.05:1 and could not be seen at all. Same class of fault as the
          Work hero's step labels — an inverted token on a light surface. */}
      <h1 style={{ color: 'var(--brand-text)', margin: '0 0 var(--space-3)' }}>
        {de ? 'Diese Seite gibt es nicht.' : 'This page does not exist.'}
      </h1>
      <p
        style={{
          fontFamily: 'var(--brand-font-body)',
          fontSize: '16px',
          color: 'var(--brand-text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 var(--space-6)',
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
          borderRadius: 'var(--radius-xs)',
        }}
      >
        {de ? 'Zur Startseite →' : 'Back to home →'}
      </Link>
    </div>
  )
}
