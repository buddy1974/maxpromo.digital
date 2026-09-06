import { EYEBROW_STYLE, SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'

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
        <p style={{ ...EYEBROW_STYLE, marginBottom: 'var(--space-4)' }}>
          {eyebrow}
        </p>
        {/* This was a <p> at a size from the showcase engine's own heading
            scale, which meant the section had no heading in the outline and
            the type came from a scale the platform retired. It is the
            section's heading, so it is one. */}
        <h2 style={{ margin: 0, color: 'var(--showcase-fg)' }}>
          {targetAudience}
        </h2>
        {problemStatement && (
          <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '16px', color: 'var(--showcase-muted)', lineHeight: 1.75, marginTop: 'var(--space-4)', maxWidth: '42rem' }}>
            {problemStatement}
          </p>
        )}
      </div>
    </section>
  )
}
