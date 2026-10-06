import './flow-steps.css'

/**
 * components/ui/FlowSteps.tsx
 *
 * A short flow of work, drawn as connected steps: the homepage's practice
 * examples and What We Do's automation-or-system comparison.
 *
 * Why not ProcessSequence: that is a horizontal hero figure that sizes itself
 * to the viewport. These sit three abreast in narrow columns, so they run
 * vertically at every width — one step per line, readable at 375px, nothing to
 * collapse and nothing to scroll sideways.
 *
 * ACCESSIBLE BY STRUCTURE
 * An ordered list, so the sequence is the markup's own order and a screen
 * reader announces it as steps. The connecting line and the dots are drawn in
 * CSS and carry no meaning on their own. A step where a person decides, or
 * where something is recorded, says so in a visible text tag; the lime marks it
 * as well, but colour is never the only signal.
 */

export interface FlowStep {
  readonly label: string
  /** Visible tag for a step a person takes, e.g. "Person". */
  readonly person?: string
  /** Visible tag for a step that keeps a record, e.g. "Record". */
  readonly record?: string
}

export function FlowSteps({ steps, label }: { steps: readonly FlowStep[]; label: string }) {
  return (
    <ol className="fsteps" aria-label={label}>
      {steps.map((s, i) => (
        <li
          key={`${i}-${s.label}`}
          className={['fstep', s.person ? 'fstep-person' : '', s.record ? 'fstep-record' : ''].filter(Boolean).join(' ')}
        >
          <span className="fstep-dot" aria-hidden="true" />
          <span className="fstep-label">{s.label}</span>
          {s.person ? <span className="fstep-tag">{s.person}</span> : null}
          {s.record ? <span className="fstep-tag fstep-tag-record">{s.record}</span> : null}
        </li>
      ))}
    </ol>
  )
}
