import type { WorkflowTuple } from '@/lib/registry/types'

interface HowItWorksProps {
  workflow: WorkflowTuple
  locale:   string
}

const STEP_NUMS = ['01.', '02.', '03.', '04.', '05.'] as const

/**
 * Horizontal 5-step workflow strip. Exactly 5 steps — VG-10.
 * TypeScript enforces the count via WorkflowTuple.
 * Wraps to 1-column on mobile.
 */
export function HowItWorks({ workflow, locale }: HowItWorksProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? '// So funktioniert es' : '// How it works'
  const heading = isDE ? 'Fünf Schritte. Dann läuft es.' : 'Five steps. Then it runs.'

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
          style={{ display: 'grid', gap: '1px', background: 'rgba(128,128,128,0.12)', borderRadius: '12px', overflow: 'hidden' }}
          className="grid-cols-1 sm:grid-cols-5"
        >
          {workflow.map((step, i) => (
            <div
              key={i}
              style={{ padding: '2rem 1.5rem', background: 'var(--brand-bg)', position: 'relative' }}
            >
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '3rem', lineHeight: 1, color: 'var(--brand-accent)', marginBottom: '0.75rem', opacity: 0.9 }}>
                {STEP_NUMS[i]}
              </p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', color: 'var(--brand-fg)', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                {step.label}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-muted)', lineHeight: 1.7, margin: 0 }}>
                {step.description}
              </p>
              {i < 4 && (
                <span
                  className="hidden sm:block"
                  style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-accent)', fontSize: '14px', opacity: 0.4, zIndex: 1 }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
