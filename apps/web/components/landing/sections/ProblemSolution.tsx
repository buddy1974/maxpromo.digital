import Image from 'next/image'
import { EYEBROW_STYLE, SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'

interface ProblemSolutionProps {
  problemStatement: string | null
  description:      string
  domainBrand:      string
  painImages?:      readonly [string, string, string]
  locale:           string
}

/**
 * V2 rebuild of Pain.tsx. Narrative problem → solution, not a 3-card
 * bullet grid — the old Pain.tsx and BeforeAfter.tsx both rendered the
 * same 3 `bullets` (once as "before" cards, once as a red/green ✗/✓
 * column), which is exactly the kind of repeated-block Marcel flagged.
 * `bullets` now appears in exactly one place (FeatureArchitecture.tsx).
 *
 * Falls back to `description` alone (as a plain solution statement) when
 * `problemStatement` hasn't been populated yet for a given product —
 * still renders something coherent, never a broken half-empty layout.
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts.
 *
 * Responsive pain-grid correction, 2026-07-25 (RestaurantOS V2 migration):
 * the sub-grid was a fixed 3-column layout at every width — a real risk
 * at narrow widths (390px ÷ 3 columns is far too tight for a portrait
 * image, and captions/details would be illegible). Now steps 1 → 2 → 3
 * columns (mobile → sm 640px → lg 1024px), matching the shared "never
 * jump straight to 3+ columns at 640px" grid rule documented in
 * showcaseTokens.ts. `painImages` is currently only populated for
 * RestaurantOS — this branch is a structural no-op for HandwerkOS and
 * every other showcase entry (none currently set `media.pain`), so the
 * fix carries zero regression risk elsewhere while still being the
 * shared, reusable correction (not RestaurantOS-specific logic).
 */
export function ProblemSolution({ problemStatement, description, domainBrand, painImages, locale }: ProblemSolutionProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Die Ausgangslage' : 'Where things stand today'

  return (
    <section data-section="problem-solution" style={{ padding: SECTION_PADDING.relaxed, borderTop: SECTION_DIVIDER }}>
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: 'var(--space-8)', alignItems: 'start' }}
        className="grid-cols-1 lg:grid-cols-2"
      >
        <div>
          <p style={{ ...EYEBROW_STYLE, marginBottom: 'var(--space-4)' }}>
            {eyebrow}
          </p>

          {problemStatement && (
            <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 600, fontSize: 'var(--text-h3)', letterSpacing: '-0.02em', lineHeight: 1.4, color: 'var(--showcase-muted)', margin: 0, marginBottom: 'var(--space-5)' }}>
              {problemStatement}
            </p>
          )}

          <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: 'var(--showcase-fg)', lineHeight: 1.8, margin: 0 }}>
            {description}
          </p>
        </div>

        {painImages && (
          <div style={{ display: 'grid', gap: '10px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {painImages.map((src, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--brand-border)' }}>
                <Image
                  src={src}
                  alt={`${domainBrand} — problem illustration ${i + 1}`}
                  fill
                  sizes="(min-width: 1024px) 17vw, (min-width: 640px) 30vw, 80vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
