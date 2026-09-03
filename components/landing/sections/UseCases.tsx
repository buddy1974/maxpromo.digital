import type { SeeInActionTab } from '@/lib/registry/types'
import { EYEBROW_STYLE, RADIUS, SECTION_PADDING, SECTION_DIVIDER, CARD_BORDER } from '@/components/landing/showcaseTokens'

interface UseCasesProps {
  seeInAction: ReadonlyArray<SeeInActionTab> | null
  locale:      string
}

/**
 * Required by the shared page architecture (section 3, item 11) and the
 * V2 block list (item 10). Deliberately does NOT reuse `bullets` (already
 * FeatureArchitecture's) or `workflow` (already WorkflowTimeline's) —
 * per Marcel's instruction, "each block must render only when truthful,
 * [distinct] content exists," rather than force a 4th section to repeat
 * the same 3 sentences in yet another layout.
 *
 * Sources scenario copy from the registry's `seeInAction` tab metadata
 * (tab/headline/description — already written per-module usage
 * scenarios, e.g. RestaurantOS's "Guest / Kitchen / Admin / Analytics /
 * Staff"). HandwerkOS has no `seeInAction` data yet, so this section
 * renders nothing for the pilot rather than inventing scenario copy —
 * flagged as a real content gap, not silently skipped.
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts.
 */
export function UseCases({ seeInAction, locale }: UseCasesProps) {
  if (!seeInAction || seeInAction.length === 0) return null

  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Einsatzbereiche' : 'Use cases'
  const heading = isDE ? 'Für jeden Bereich Ihres Betriebs.' : 'For every part of your business.'

  return (
    <section style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: '2rem' }}>
          {heading}
        </h2>

        <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {seeInAction.map((tab, i) => (
            <div key={i} style={{ padding: '1.5rem', border: CARD_BORDER, borderRadius: RADIUS.md }}>
              <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '10px', color: 'var(--showcase-muted)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', marginBottom: '8px' }}>
                {tab.tab}
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', color: 'var(--showcase-fg)', margin: '0 0 6px', lineHeight: 1.35 }}>
                {tab.headline}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--showcase-muted)', lineHeight: 1.6, margin: 0 }}>
                {tab.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
