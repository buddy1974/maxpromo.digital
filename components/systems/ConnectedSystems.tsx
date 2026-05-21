'use client'

/**
 * components/systems/ConnectedSystems.tsx
 *
 * Ecosystem connection section — appears above the final CTA on every
 * product page. Shows 3 related systems to signal that Maxpromo is an
 * interconnected platform, not a collection of standalone products.
 *
 * Each page passes its own curated mapping — no automated suggestions.
 * Copy uses operational language only: no AI hype, no generic phrasing.
 */

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Reveal } from '@/components/ui/Reveal'

// =============================================================================
// TYPES
// =============================================================================

export interface ConnectedSystem {
  /** Image slug — maps to /images/systems/[slug]/card/[slug]-en.png */
  readonly slug: string
  /** Display name shown on the card */
  readonly name: string
  /** One-line operational description — no AI hype */
  readonly description: string
  /** Internal route (locale-aware) */
  readonly href: string
}

export interface ConnectedSystemsProps {
  readonly systems: ReadonlyArray<ConnectedSystem>
  /** Optional background override — defaults to dark Maxpromo surface */
  readonly background?: string
  /** Optional border color — defaults to dark border */
  readonly borderColor?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConnectedSystems({
  systems,
  background  = '#0F0F0F',
  borderColor = '#1A1A1A',
}: ConnectedSystemsProps) {
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
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
          CONNECTED SYSTEMS
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '0.5rem' }}>
          Operations rarely run in one system.
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', maxWidth: '520px', lineHeight: 1.75, marginBottom: '2.5rem' }}>
          Businesses usually solve more than one operational bottleneck. These systems often work together.
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
                  <Image
                    src={`/images/systems/${system.slug}/card/${system.slug}-en.png`}
                    alt={system.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                  />
                </div>

                {/* Body */}
                <div style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#F0F0F0', letterSpacing: '-0.02em', margin: 0 }}>
                    {system.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666666', margin: 0, lineHeight: 1.6, flex: 1 }}>
                    {system.description}
                  </p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '6px' }}>
                    Explore system →
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
