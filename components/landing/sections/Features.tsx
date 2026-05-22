import type { BulletTuple } from '@/lib/registry/types'

interface FeaturesProps {
  bullets: BulletTuple
  locale:  string
}

/**
 * 4 benefit columns — VG-11: exactly 4, categories = time / quality / revenue / reliability.
 * First 3 columns derive labels from registry bullets.
 * 4th column (Reliability) is fixed — applies universally to all products.
 * Phase 3: add per-product benefit copy to registry for fuller descriptions.
 */
export function Features({ bullets, locale }: FeaturesProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? '// Warum es funktioniert' : '// Why it works'
  const heading = isDE ? 'Vier Vorteile. Sofort.' : 'Four benefits. From day one.'

  const cols = [
    {
      cat:   isDE ? 'Zeit'     : 'Time',
      label: bullets[0],
      icon:  '⟳',
    },
    {
      cat:   isDE ? 'Qualität' : 'Quality',
      label: bullets[1],
      icon:  '◈',
    },
    {
      cat:   isDE ? 'Umsatz'   : 'Revenue',
      label: bullets[2],
      icon:  '↑',
    },
    {
      cat:   isDE ? 'Zuverlässigkeit' : 'Reliability',
      label: isDE ? 'Läuft ohne Ausfälle.' : 'Runs without failure.',
      icon:  '✦',
    },
  ] as const

  return (
    <section style={{ padding: '5rem 2rem', borderTop: '1px solid rgba(128,128,128,0.10)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.03em', marginBottom: '3rem', lineHeight: 1.15 }}>
          {heading}
        </h2>

        <div
          style={{ display: 'grid', gap: '12px' }}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {cols.map((col, i) => (
            <div
              key={i}
              style={{ padding: '2rem', border: '1px solid rgba(128,128,128,0.12)', borderRadius: '12px', background: 'var(--brand-bg)' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--brand-accent)', display: 'block', marginBottom: '1rem' }}>
                {col.icon}
              </span>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--brand-accent)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {col.cat}
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', lineHeight: 1.35, margin: 0, color: 'var(--brand-fg)' }}>
                {col.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
