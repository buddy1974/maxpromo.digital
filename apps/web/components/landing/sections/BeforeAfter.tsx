import type { BulletTuple, WorkflowStep } from '@/lib/registry/types'
import { EYEBROW_STYLE, RADIUS, SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'
import { Icon } from '@maxpromo/ui'

interface BeforeAfterProps {
  bullets:          BulletTuple
  problemStatement: string | null
  lastStep:         WorkflowStep
  locale:           string
}

/**
 * V2 rebuild. V1 rendered the same 3 `bullets` as both the "before" (✗)
 * and "after" (✓) column — literally identical content twice, just
 * recolored. That is exactly the repeated-block pattern Marcel flagged
 * ("six separate blocks saying the same thing").
 *
 * Before column shows `problemStatement` (the same field ProblemSolution
 * and AudienceFit use) as prose when the product has it populated; falls
 * back to the original bullets-as-✗-list rendering for the 5 showcase
 * products not yet migrated to V2 registry fields, so nothing breaks.
 *
 * After column shows the workflow's final step (`lastStep` — index 4,
 * mandatory on every ProductEntry via WorkflowTuple's 5-item compile-time
 * guarantee) instead of repeating `bullets` a second time.
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts.
 */
export function BeforeAfter({ bullets, problemStatement, lastStep, locale }: BeforeAfterProps) {
  const isDE      = locale === 'de'
  const eyebrow   = isDE ? 'Vorher vs. nachher'   : 'Before vs. after'
  const colBefore = isDE ? 'Ohne System'              : 'Without the system'
  const colAfter  = isDE ? 'Mit dem System'           : 'With the system'

  return (
    <section style={{ padding: SECTION_PADDING.relaxed, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '2.5rem' }}>
          {eyebrow}
        </p>

        <div style={{ display: 'grid', gap: '1px', background: 'var(--brand-border)', borderRadius: RADIUS.lg, overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2">

          {/* Before, left */}
          <div style={{ padding: '2.5rem', background: 'var(--showcase-bg)' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 'var(--space-5)' }}>
              <Icon name="cross" size="sm" /> {colBefore}
            </p>
            {problemStatement ? (
              <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--showcase-muted)', lineHeight: 1.7, margin: 0 }}>
                {problemStatement}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--semantic-danger)', flexShrink: 0, marginTop: '2px', fontSize: 'var(--text-micro)' }}><Icon name="cross" size="sm" /></span>
                    <span style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--showcase-muted)', lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* After, right */}
          <div style={{ padding: '2.5rem', background: 'var(--showcase-bg)', borderLeft: '2px solid var(--showcase-accent)' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', color: 'var(--showcase-muted)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', marginBottom: 'var(--space-5)' }}>
              <Icon name="check" size="sm" /> {colAfter}
            </p>
            <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 600, fontSize: '16px', color: 'var(--showcase-fg)', margin: '0 0 var(--space-2)', lineHeight: 1.4 }}>
              {lastStep.label}
            </p>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--showcase-fg)', lineHeight: 1.6, margin: 0 }}>
              {lastStep.description}
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
