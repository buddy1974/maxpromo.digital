import type { ReactNode } from 'react'

/**
 * components/ui/SectionHeader.tsx
 *
 * The section label + heading pair, in one place.
 *
 * Before this existed the same markup was defined as local helpers inside
 * app/[locale]/page.tsx and re-inlined byte-for-byte inside TeamTrust.tsx,
 * with a third variant across the service pages — three copies of one idea,
 * which is how the label drifted into three different sizes.
 *
 * Two rules are enforced here rather than left to each caller:
 *
 *   1. The label is uppercase sans in secondary grey. Never mono, never
 *      accent-coloured, and never prefixed with `//`. Section labels were the
 *      single most frequent accent appearance on every page; de-colouring them
 *      does more for the "software consultancy, not AI startup" read than any
 *      other single change.
 *
 *   2. The heading is black. Colour does not carry the message. Callers may
 *      pass ReactNode for a genuine one-word emphasis, but there is no
 *      `accent` prop — highlighting a whole phrase is the pattern being
 *      retired, so the component does not offer it.
 */

interface SectionHeaderProps {
  /** Short uppercase label above the heading. Omit when the heading stands alone. */
  label?: string
  children: ReactNode
  /** Renders an <h1> instead of the default <h2>. One per page. */
  as?: 'h1' | 'h2'
  /** Supporting sentence below the heading. */
  lede?: ReactNode
  align?: 'start' | 'center'
}

export function SectionHeader({
  label,
  children,
  as: Heading = 'h2',
  lede,
  align = 'start',
}: SectionHeaderProps) {
  return (
    <div style={{ textAlign: align === 'center' ? 'center' : undefined }}>
      {label && <p className="section-label">{label}</p>}
      <Heading style={{ margin: 0 }}>{children}</Heading>
      {lede && (
        <p
          style={{
            marginTop: 'var(--space-4)',
            marginBottom: 0,
            maxWidth: '46rem',
            marginInline: align === 'center' ? 'auto' : undefined,
            fontSize: 'var(--text-body)',
            lineHeight: 'var(--leading-body)',
            color: 'var(--brand-text-secondary)',
          }}
        >
          {lede}
        </p>
      )}
    </div>
  )
}
