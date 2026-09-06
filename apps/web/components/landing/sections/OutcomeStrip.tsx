import type { BulletTuple } from '@/lib/registry/types'
import { SECTION_PADDING } from '@/components/landing/showcaseTokens'

interface OutcomeStripProps {
  outcomeStats: BulletTuple | null
}

/**
 * Compact strip of 3 short, factual, quantifiable stats
 * (e.g. "5 Schritte vom Auftrag zur Zahlung"). Distinct from the hero's
 * bullets and FeatureArchitecture's bullets — this uses the registry's
 * `outcomeStats` field specifically so the same 3 sentences don't repeat
 * across three different-looking sections (the V1 problem Marcel flagged
 * — "six separate blocks" saying similar things).
 *
 * Renders nothing when `outcomeStats` is absent (progressive rollout,
 * HandwerkOS only as of this pilot).
 *
 * Visual-polish pass 2026-07-25: uses SECTION_PADDING.tight (this strip
 * is deliberately more compact than a full content section — it should
 * read as a beat, not a chapter). Grid now activates at `md` (768px)
 * instead of `sm` (640px) — 3 columns starting at 640px left too little
 * room per stat in the 640–767px range, one of the breakpoints flagged
 * for this pass's responsive review.
 */
export function OutcomeStrip({ outcomeStats }: OutcomeStripProps) {
  if (!outcomeStats) return null

  return (
    <section style={{ padding: SECTION_PADDING.tight, borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)' }}>
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '1px', background: 'var(--brand-border)' }}
        className="grid-cols-1 md:grid-cols-3"
      >
        {outcomeStats.map((stat, i) => (
          <div key={i} style={{ background: 'var(--showcase-bg)', padding: '1.25rem 1.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '14px', fontWeight: 'var(--weight-heading)', color: 'var(--showcase-fg)', letterSpacing: '-0.01em', margin: 0 }}>
              {stat}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
