import { Icon, type IconName } from '@maxpromo/ui'

/**
 * components/ui/ProcessSequence.tsx
 *
 * A numbered route through a process: circular nodes with line icons, thin
 * grey connectors, and one optional step where a person decides.
 *
 * The pattern is Agent Bureau's "safe action chain", brought into the
 * corporate site as a shared primitive rather than copied. Same grammar,
 * different scenes: Agent Bureau shows how the product executes work, the
 * corporate pages show how the company's own history, knowledge and first
 * conversation are structured.
 *
 * THREE USES, WHICH IS WHY IT IS A PRIMITIVE (§23)
 *   /about     the evolution from keeping systems alive to building them
 *   /resources the route through what we learned, built and reference
 *   /contact   what actually happens after someone gets in touch
 *
 * GEOMETRY
 * A flex row of alternating node and connector, so a connector is a real
 * element in a real gap. Nothing is positioned by computing where a gutter
 * fell, which is the failure ADR-0013 exists to prevent. Below the horizontal
 * breakpoint the same markup becomes a vertical route with the connectors
 * still drawn between steps.
 *
 * ACCESSIBILITY
 * The drawing is aria-hidden; an ordered list carries the same sequence, in
 * order, for assistive technology. Icons sit beside their own labels, so they
 * are decorative (ADR-0003).
 */

export interface SequenceStep {
  label: string
  detail?: string
  icon: IconName
  /** The step where a person decides. Gets the accent treatment. */
  human?: boolean
}

interface ProcessSequenceProps {
  steps: readonly SequenceStep[]
  a11yIntro: string
  /** Optional pale-green confirmation line beneath the sequence. */
  note?: string
  /** Short uppercase mark on the human step. */
  humanLabel?: string
  /** Show 01, 02, 03 above each node. */
  numbered?: boolean
}

export function ProcessSequence({
  steps,
  a11yIntro,
  note,
  humanLabel,
  numbered = true,
}: ProcessSequenceProps) {
  return (
    <figure className="ps">
      <div className="ps-row" aria-hidden="true">
        {steps.map((s, i) => (
          <div className="ps-cell" key={s.label}>
            <div className="ps-step">
              {numbered && <p className="ps-num">{String(i + 1).padStart(2, '0')}</p>}
              <span className={s.human ? 'ps-disc ps-disc-human' : 'ps-disc'}>
                <Icon name={s.icon} size="md" />
              </span>
              <p className={s.human ? 'ps-label ps-label-human' : 'ps-label'}>{s.label}</p>
              {s.detail && <p className="ps-detail">{s.detail}</p>}
              {s.human && humanLabel && <p className="ps-human">{humanLabel}</p>}
            </div>

            {i < steps.length - 1 && (
              <span className={steps[i].human ? 'ps-link ps-link-human' : 'ps-link'}>
                <span className="ps-link-line" />
                <span className="ps-link-tip" />
              </span>
            )}
          </div>
        ))}
      </div>

      {note && (
        <p className="ps-note">
          <span className="ps-note-check" aria-hidden="true" />
          {note}
        </p>
      )}

      <figcaption className="sr-only">
        <p>{a11yIntro}</p>
        <ol>
          {steps.map((s) => (
            <li key={s.label}>
              {s.label}
              {s.detail ? `: ${s.detail}` : ''}
              {s.human && humanLabel ? `. ${humanLabel}.` : ''}
            </li>
          ))}
        </ol>
        {note && <p>{note}</p>}
      </figcaption>
    </figure>
  )
}
