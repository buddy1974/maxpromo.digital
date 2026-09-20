import { Icon, type IconName } from '@maxpromo/ui'

/**
 * components/capability/FlowContrast.tsx
 *
 * The same enquiry, drawn twice: once as it runs today, once as it runs after.
 *
 * WHY THIS IS NOT ComparisonPanel
 * `components/ui/ComparisonPanel.tsx` is a before and after in words, two
 * lists side by side, and it is right for a case study where the difference is
 * a set of statements. This difference is a *shape*. The point of the section
 * is that the work stops zig-zagging between hands and starts travelling in
 * one line, and a reader should see that before reading a single label.
 *
 * WHY IT IS NOT A ZAPIER DIAGRAM
 * No app logos, no connector cards, no implication that the answer is a chain
 * of integrations. Both rows use the same five discs and the same grammar as
 * the rest of the site; only the path between them changes. The "before" row
 * is deliberately drawn as broken segments with a gap under each hand-off,
 * because that gap is where the work actually goes missing.
 *
 * MOTION
 * One thing moves, and only in the "after" row: a single mark travelling the
 * line once, slowly, then resting. It is the record moving through a process
 * that now carries it. Under `prefers-reduced-motion` it stops at the end of
 * the line, which is the state that makes the point, and the stylesheet does
 * that before hydration rather than a script doing it afterwards.
 *
 * ACCESSIBILITY
 * Both rows are `aria-hidden` and each is described in one sentence supplied
 * by the caller from the message catalogue, because a picture of a process is
 * not something an assistive reader should have to infer from five nouns.
 */

export interface FlowStep {
  readonly label: string
  readonly icon: IconName
}

interface FlowContrastProps {
  beforeLabel: string
  beforeSteps: readonly FlowStep[]
  beforeA11y: string
  afterLabel: string
  afterSteps: readonly FlowStep[]
  afterA11y: string
  /** Index in `afterSteps` that a person approves. Gets the only accent. */
  humanAt?: number
}

function Row({
  steps,
  variant,
  humanAt,
}: {
  steps: readonly FlowStep[]
  variant: 'before' | 'after'
  humanAt?: number
}) {
  return (
    <ol className={`fc-row fc-row-${variant}`} aria-hidden="true">
      {steps.map((s, i) => (
        <li key={s.label} className={`fc-step${humanAt === i ? ' fc-step-human' : ''}`}>
          <span className="fc-disc">
            <Icon name={s.icon} size="sm" />
          </span>
          <span className="fc-label">{s.label}</span>
        </li>
      ))}
      {variant === 'after' && <span className="fc-travel" />}
    </ol>
  )
}

export function FlowContrast({
  beforeLabel,
  beforeSteps,
  beforeA11y,
  afterLabel,
  afterSteps,
  afterA11y,
  humanAt,
}: FlowContrastProps) {
  return (
    <div className="fc">
      <figure className="fc-figure">
        <figcaption className="fc-caption">{beforeLabel}</figcaption>
        <Row steps={beforeSteps} variant="before" />
        <p className="sr-only">{beforeA11y}</p>
      </figure>

      <figure className="fc-figure">
        <figcaption className="fc-caption fc-caption-after">{afterLabel}</figcaption>
        <Row steps={afterSteps} variant="after" humanAt={humanAt} />
        <p className="sr-only">{afterA11y}</p>
      </figure>
    </div>
  )
}
