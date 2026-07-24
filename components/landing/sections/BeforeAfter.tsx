import type { BulletTuple } from '@/lib/registry/types'

interface BeforeAfterProps {
  bullets: BulletTuple
  locale:  string
}

/**
 * Two-column before/after comparison.
 * Left (✗ Before): bullets framed as missing state.
 * Right (✓ After): same bullets as achieved outcomes.
 * Phase 3: add product-specific before-state copy to registry.
 */
export function BeforeAfter({ bullets, locale }: BeforeAfterProps) {
  const isDE      = locale === 'de'
  const eyebrow   = isDE ? '// Vorher vs. nachher'   : '// Before vs. after'
  const colBefore = isDE ? 'Ohne System'              : 'Without the system'
  const colAfter  = isDE ? 'Mit dem System'           : 'With the system'

  return (
    <section style={{ padding: '5rem 2rem', borderTop: '1px solid rgba(128,128,128,0.10)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
          {eyebrow}
        </p>

        <div style={{ display: 'grid', gap: '1px', background: 'rgba(128,128,128,0.12)', borderRadius: '12px', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2">

          {/* Before, left */}
          <div style={{ padding: '2.5rem', background: 'var(--brand-bg)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ef4444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              ✗ {colBefore}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px', fontSize: '13px' }}>✗</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--brand-muted)', lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After, right */}
          <div style={{ padding: '2.5rem', background: 'var(--brand-bg)', borderLeft: '2px solid var(--brand-accent)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              ✓ {colAfter}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--brand-accent)', flexShrink: 0, marginTop: '2px', fontSize: '13px' }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--brand-fg)', lineHeight: 1.5, fontWeight: 500 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
