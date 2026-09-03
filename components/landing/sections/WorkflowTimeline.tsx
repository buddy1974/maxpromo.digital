import type { WorkflowTuple } from '@/lib/registry/types'
import { EYEBROW_STYLE, RADIUS, SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'

interface WorkflowTimelineProps {
  workflow: WorkflowTuple
  locale:   string
}

const STEP_NUMS = ['01', '02', '03', '04', '05'] as const

/**
 * Horizontal 5-step workflow strip. Renamed from HowItWorks.tsx for the
 * V2 architecture (same underlying data — WorkflowTuple, VG-10 enforces
 * exactly 5 steps at compile time).
 *
 * Visual-polish pass 2026-07-25: fixed a real responsive bug — the grid
 * previously jumped straight from 1 column to 5 columns at 640px
 * (`sm:grid-cols-5`), which put 5 full sentences into ~130px-wide columns
 * at 768px, one of the breakpoints named for this review. Now steps
 * through 1 → 2 (sm, 640px) → 3 (md, 768px) → 5 (lg, 1024px), so every
 * named breakpoint gets a column count the content can actually fit.
 * Step number size trimmed slightly and description line-height tightened
 * for better readability at the narrower intermediate widths.
 */
export function WorkflowTimeline({ workflow, locale }: WorkflowTimelineProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'So funktioniert es' : 'How it works'
  const heading = isDE ? 'Fünf Schritte. Dann läuft es.' : 'Five steps. Then it runs.'

  return (
    <section style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: '2.5rem' }}>
          {heading}
        </h2>

        <div
          style={{ display: 'grid', gap: '1px', background: 'rgba(128,128,128,0.12)', borderRadius: RADIUS.lg, overflow: 'hidden' }}
          className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        >
          {workflow.map((step, i) => (
            <div key={i} style={{ padding: '1.75rem 1.5rem', background: 'var(--brand-bg)', position: 'relative' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '2rem', lineHeight: 1, color: 'var(--brand-accent)', marginBottom: '0.6rem', opacity: 0.9 }}>
                {STEP_NUMS[i]}
              </p>
              <h3 className="h-card" style={{ color: 'var(--brand-fg)', marginBottom: '0.5rem' }}>
                {step.label}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-muted)', lineHeight: 1.6, margin: 0 }}>
                {step.description}
              </p>
              {i < 4 && (
                <span
                  className="hidden lg:block"
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
