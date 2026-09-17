/**
 * components/ui/ComparisonPanel.tsx
 *
 * The current way beside the same work with a system carrying it.
 *
 * White neutral panel on the left, pale-green improved state on the right.
 * Left items take a dash, right items a check. The pattern is Agent Bureau's
 * "heute — manuell" against "mit Max Agent — überwacht", generalised so the
 * corporate site can use it wherever a page genuinely contains a before and an
 * after.
 *
 * WHEN NOT TO USE IT
 * Only where the page already holds both halves of the comparison as fact.
 * The case studies do: each one publishes what the business was doing and what
 * changed after the system went live, and both columns here are those existing
 * strings. Inventing a "before" to make an "after" look better would be
 * manufacturing evidence about a client, which is the thing ADR-0007 exists to
 * stop.
 *
 * Both panels stack on a narrow screen and keep their headings, so the
 * before-and-after meaning survives the transformation.
 */

interface ComparisonPanelProps {
  beforeTitle: string
  beforeItems: readonly string[]
  afterTitle: string
  afterItems: readonly string[]
}

export function ComparisonPanel({
  beforeTitle,
  beforeItems,
  afterTitle,
  afterItems,
}: ComparisonPanelProps) {
  return (
    <div className="cmp">
      <div className="cmp-panel cmp-before">
        <p className="cmp-title">{beforeTitle}</p>
        <ul className="cmp-list">
          {beforeItems.map((t) => (
            <li key={t}>
              <span className="cmp-mark cmp-mark-dash" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="cmp-panel cmp-after">
        <p className="cmp-title">{afterTitle}</p>
        <ul className="cmp-list">
          {afterItems.map((t) => (
            <li key={t}>
              <span className="cmp-mark cmp-mark-check" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
