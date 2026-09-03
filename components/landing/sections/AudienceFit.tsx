import { EYEBROW_STYLE, HEADING_SIZE, SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'

interface AudienceFitProps {
  targetAudience:    string | null
  problemStatement:  string | null
  locale:            string
}

/**
 * "Who it's for" section — required by the shared page architecture
 * (section 3, item 4) and the V2 block list (item 3, AudienceFit).
 *
 * Renders only when `targetAudience` exists in the registry — this is a
 * progressive-rollout field (HandwerkOS only, as of this pilot), not a
 * placeholder. Pairs the audience statement with `problemStatement` (the
 * same field ProblemSolution.tsx uses as its "before" column) so the
 * section reads as "who this is for, and what they're dealing with today"
 * rather than a bare one-liner — a different pairing/angle from
 * ProblemSolution, which pairs problemStatement against the solution
 * description instead.
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts.
 */
export function AudienceFit({ targetAudience, problemStatement, locale }: AudienceFitProps) {
  if (!targetAudience) return null

  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Für wen' : 'Who it’s for'

  return (
    <section style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '1rem' }}>
          {eyebrow}
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: HEADING_SIZE.compact, letterSpacing: '-0.03em', lineHeight: 1.35, margin: 0, color: 'var(--brand-fg)' }}>
          {targetAudience}
        </p>
        {problemStatement && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--brand-muted)', lineHeight: 1.75, marginTop: '1rem', maxWidth: '42rem' }}>
            {problemStatement}
          </p>
        )}
      </div>
    </section>
  )
}
