'use client'

/**
 * components/systems/ConnectedSystems.tsx
 *
 * Ecosystem connection section, appears above the final CTA on every
 * product page. Shows 3 related systems to signal that Maxpromo is an
 * interconnected platform, not a collection of standalone products.
 *
 * Each page passes its own curated mapping, no automated suggestions.
 * Copy uses operational language only: no AI hype, no generic phrasing.
 */

import Image from 'next/image'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'

// =============================================================================
// TYPES
// =============================================================================

export interface ConnectedSystem {
  /** Image slug, maps to /images/systems/[slug]/card/[slug]-en.png */
  readonly slug: string
  /** Display name shown on the card */
  readonly name: string
  /** One-line operational description, no AI hype */
  readonly description: string
  /** Internal route (locale-aware) */
  readonly href: string
}

export interface ConnectedSystemsProps {
  readonly systems: ReadonlyArray<ConnectedSystem>
  /** Optional background override, defaults to dark Maxpromo surface */
  readonly background?: string
  /** Optional border color, defaults to dark border */
  readonly borderColor?: string
  /**
   * Active locale, passed down from the parent server component
   * (params.locale), never resolved client-side. Defaults to 'en'
   * for call sites that have not been updated yet.
   */
  readonly locale?: string
}

const COPY = {
  en: { eyebrow: 'CONNECTED SYSTEMS', title: 'Operations rarely run in one system.', body: 'Businesses usually solve more than one operational bottleneck. These systems often work together.', cta: 'Explore system →' },
  de: { eyebrow: 'VERBUNDENE SYSTEME', title: 'Betrieb läuft selten in einem einzigen System.', body: 'Unternehmen lösen meist mehr als einen operativen Engpass. Diese Systeme arbeiten oft zusammen.', cta: 'System entdecken →' },
} as const

/**
 * Card thumbnail with graceful locale-image fallback. Prefers
 * `{slug}-{locale}.png`; if that variant doesn't exist (not every
 * system has a German-labelled card yet), falls back to the English
 * asset instead of showing a broken image.
 */
function ConnectedSystemImage({ slug, alt, localizedSrc }: { slug: string; alt: string; localizedSrc: string }) {
  const [useEnFallback, setUseEnFallback] = useState(false)
  const fallbackSrc = `/images/systems/${slug}/card/${slug}-en.png`
  return (
    <Image
      src={useEnFallback ? fallbackSrc : localizedSrc}
      alt={alt}
      fill
      style={{ objectFit: 'cover' }}
      sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
      onError={() => setUseEnFallback(true)}
    />
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConnectedSystems({
  systems,
  background  = '#0F0F0F',
  borderColor = '#1A1A1A',
  locale      = 'en',
}: ConnectedSystemsProps) {
  const copy = locale === 'de' ? COPY.de : COPY.en
  return (
    <section
      style={{
        background,
        borderTop:    `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        padding:      '4rem 2rem',
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

        {/* Header */}
        <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
          {copy.eyebrow}
        </p>
        <h2 style={{ color: '#F0F0F0', marginBottom: '0.5rem' }}>
          {copy.title}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', maxWidth: '520px', lineHeight: 1.75, marginBottom: '2.5rem' }}>
          {copy.body}
        </p>

        {/* Cards */}
        <Reveal>
          <div className="cs-grid">
            {systems.map(system => (
              <Link
                key={system.slug}
                href={system.href}
                className="mp-card-hover"
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  background:    '#141414',
                  border:        '1px solid #1A1A1A',
                  borderRadius:  '16px',
                  overflow:      'hidden',
                  textDecoration: 'none',
                }}
              >
                {/* Thumbnail */}
                <div
                  className="mp-img-wrap"
                  style={{ position: 'relative', aspectRatio: '19/10' }}
                >
                  <ConnectedSystemImage
                    slug={system.slug}
                    alt={system.name}
                    localizedSrc={`/images/systems/${system.slug}/card/${system.slug}-${locale === 'de' ? 'de' : 'en'}.png`}
                  />
                </div>

                {/* Body */}
                <div style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 className="h-card" style={{ color: '#F0F0F0', margin: 0 }}>
                    {system.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666666', margin: 0, lineHeight: 1.6, flex: 1 }}>
                    {system.description}
                  </p>
                  <span style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '10px', color: 'var(--brand-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '6px' }}>
                    {copy.cta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  )
}
