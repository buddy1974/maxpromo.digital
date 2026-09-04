import type { BulletTuple } from '@/lib/registry/types'
import { EYEBROW_STYLE, RADIUS, SECTION_PADDING, SECTION_DIVIDER, CARD_BORDER } from '@/components/landing/showcaseTokens'
import { Icon, type IconName } from '@maxpromo/ui'

interface FeatureArchitectureProps {
  bullets: BulletTuple
  /** Benefit-phrased alternative to `bullets`, added 2026-07-25 (RestaurantOS correction). Null when the product hasn't set one. */
  featureBenefits: BulletTuple | null
  locale:  string
}

/**
 * Renamed from Features.tsx for the V2 architecture. This is now the
 * ONLY section that renders the registry's `bullets` (or `featureBenefits`
 * when set) — V1 repeated them in Pain.tsx and BeforeAfter.tsx too (3
 * sections saying the same 3 things in different boxes). ProblemSolution
 * and OutcomeStrip now use distinct registry fields instead
 * (problemStatement/description, outcomeStats).
 *
 * Correction 2026-07-25 (Marcel's visual-polish pass, TRUST/FEATURES
 * instructions — "no unsupported claims," "reduce visual clutter"): this
 * section used to synthesize a 4th card not backed by any registry
 * field — "Läuft ohne Ausfälle." / "Runs without failure." — an
 * uptime/reliability claim identical in kind to the ones already removed
 * from trustCue and TrustAndSecurity.tsx. Dropped. The section now shows
 * exactly the 3 real, registry-sourced bullets — fewer, more meaningful
 * cards, and no invented claim.
 *
 * `featureBenefits` fallback, 2026-07-25 (RestaurantOS correction): this
 * section renders `bullets` under fixed "Time / Quality / Revenue"
 * category headers, which assumes benefit-statement phrasing. RestaurantOS
 * discovered this assumption breaks when a product's `bullets` are
 * phrased as rhetorical questions for the hero instead ("Still shouting
 * for waiters?"). Rather than force one field to fit two different
 * sections, products can now set a distinct `featureBenefits` field for
 * this section only — resolved below as `featureBenefits ?? bullets`, so
 * a product with no featureBenefits renders exactly as before this field
 * existed.
 */
export function FeatureArchitecture({ bullets, featureBenefits, locale }: FeatureArchitectureProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Warum es funktioniert' : 'Why it works'
  const heading = isDE ? 'Drei Vorteile. Sofort.' : 'Three benefits. From day one.'

  const resolvedBullets = featureBenefits ?? bullets

  const cols = [
    { cat: isDE ? 'Zeit'     : 'Time',     label: resolvedBullets[0], icon: 'waiting' as IconName },
    { cat: isDE ? 'Qualität' : 'Quality',  label: resolvedBullets[1], icon: 'quality' as IconName },
    { cat: isDE ? 'Umsatz'   : 'Revenue',  label: resolvedBullets[2], icon: 'trendUp' as IconName },
  ] as const

  return (
    <section style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: '2.5rem' }}>
          {heading}
        </h2>

        <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 sm:grid-cols-3">
          {cols.map((col, i) => (
            <div key={i} style={{ padding: '1.75rem', border: CARD_BORDER, borderRadius: RADIUS.lg, background: 'var(--showcase-bg)' }}>
              <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '20px', color: 'var(--showcase-muted)', display: 'block', marginBottom: '1rem' }}>
                <Icon name={col.icon} size="md" />
              </span>
              <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label-dense)', color: 'var(--showcase-muted)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', marginBottom: '8px' }}>
                {col.cat}
              </p>
              <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 600, fontSize: '16px', lineHeight: 1.35, margin: 0, color: 'var(--showcase-fg)' }}>
                {col.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
