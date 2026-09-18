import { Icon, type IconName } from '@maxpromo/ui'

/**
 * components/home/MethodTransform.tsx
 *
 * The same job, twice: how it runs today, and how it runs after.
 *
 * The section's argument is "don't automate a bad process", and the only way to
 * show that is to show the bad process. The left panel is deliberately untidy:
 * seven stops, lines crossing, two of them doubling back. The right panel is
 * the same work as one route with a single point where a person decides.
 *
 * NOT AN ARCHITECTURE DIAGRAM. There are no labels on the connectors, no
 * system names and no legend. It reads in about two seconds or it has failed.
 *
 * Both panels are always rendered. The "resolve" is a slow crossfade of the
 * left panel's tangle, not a sequence the reader has to wait for, and under
 * `prefers-reduced-motion` both panels simply stand still. Nothing here is
 * required to understand the section: the two labels above the panels carry
 * the meaning on their own.
 */

const MESSY: readonly { icon: IconName; key: string }[] = [
  { icon: 'newsletter', key: 'm1' },
  { icon: 'projects',   key: 'm2' },
  { icon: 'documents',  key: 'm3' },
  { icon: 'message',    key: 'm4' },
  { icon: 'user',       key: 'm5' },
  { icon: 'projects',   key: 'm6' },
  { icon: 'waiting',    key: 'm7' },
]

const CLEAR: readonly { icon: IconName; key: string; human?: boolean }[] = [
  { icon: 'inbox',     key: 'c1' },
  { icon: 'system',    key: 'c2' },
  { icon: 'approvals', key: 'c3', human: true },
  { icon: 'check',     key: 'c4' },
]

export function MethodTransform({
  beforeLabel,
  afterLabel,
  beforeA11y,
  afterA11y,
}: {
  beforeLabel: string
  afterLabel: string
  beforeA11y: string
  afterA11y: string
}) {
  return (
    <div className="mtr">
      <figure className="mtr-panel mtr-before">
        <figcaption className="mtr-label">{beforeLabel}</figcaption>
        <div className="mtr-stage" aria-hidden="true">
          <svg className="mtr-tangle" viewBox="0 0 200 100" preserveAspectRatio="none" focusable="false">
            <path d="M18 30 C 60 12, 70 70, 104 46" />
            <path d="M104 46 C 128 30, 96 84, 150 66" />
            <path d="M18 30 C 52 58, 34 86, 150 66" />
            <path d="M62 78 C 92 88, 118 20, 182 34" />
          </svg>
          <ul className="mtr-nodes">
            {MESSY.map((m) => (
              <li key={m.key}><Icon name={m.icon} size="xs" /></li>
            ))}
          </ul>
        </div>
        <p className="sr-only">{beforeA11y}</p>
      </figure>

      <span className="mtr-arrow" aria-hidden="true" />

      <figure className="mtr-panel mtr-after">
        <figcaption className="mtr-label">{afterLabel}</figcaption>
        <div className="mtr-stage" aria-hidden="true">
          <ul className="mtr-route">
            {CLEAR.map((c, i) => (
              <li key={c.key} className={c.human ? 'mtr-stop mtr-stop-human' : 'mtr-stop'}>
                <Icon name={c.icon} size="xs" />
                {i < CLEAR.length - 1 && <span className="mtr-link" />}
              </li>
            ))}
          </ul>
        </div>
        <p className="sr-only">{afterA11y}</p>
      </figure>
    </div>
  )
}
