import type { BulletTuple } from '@/lib/registry/types'

interface PainProps {
  bullets:     BulletTuple
  description: string
  locale:      string
}

const ICONS = ['⊟', '◇', '⌗'] as const

/**
 * Pain section — 3 cards derived from registry bullets (inverted framing).
 * Phase 2: bullets rendered as goals you don't yet have (implied pain).
 * Phase 3: replace with product-specific before-state copy per product.
 */
export function Pain({ bullets, description, locale }: PainProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? '// Die Herausforderung' : '// The challenge'
  const heading = isDE ? 'Was heute noch fehlt' : "What you're still missing"

  return (
    <section style={{ padding: '5rem 2rem', borderTop: '1px solid rgba(128,128,128,0.10)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.15 }}>
          {heading}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--brand-muted)', lineHeight: 1.75, maxWidth: '44rem', marginBottom: '3rem' }}>
          {description}
        </p>

        <div
          style={{ display: 'grid', gap: '1px', background: 'rgba(128,128,128,0.12)', borderRadius: '12px', overflow: 'hidden' }}
          className="grid-cols-1 sm:grid-cols-3"
        >
          {bullets.map((b, i) => (
            <div
              key={i}
              style={{ padding: '2rem 2.25rem', background: 'var(--brand-bg)' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: '#ef4444', display: 'block', marginBottom: '1rem', opacity: 0.8 }}>
                {ICONS[i]}
              </span>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', lineHeight: 1.35, margin: 0, color: 'var(--brand-fg)' }}>
                {b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
