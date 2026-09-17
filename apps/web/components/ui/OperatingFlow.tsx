import { Icon, type IconName } from '@maxpromo/ui'

/**
 * components/ui/OperatingFlow.tsx
 *
 * The Maxpromo operating flow, in two presentations.
 *
 *   'track'  the joined hairline table. Used on /solutions, unchanged.
 *   'nodes'  seven discrete boxes with icons, connected by a lime route.
 *            The approved homepage hero composition.
 *
 * The 'nodes' presentation reproduces a supplied design reference rather than
 * an interpretation of one. Specifics that come from the reference and are not
 * open to improvement: the boxes do not touch, every stage carries an icon,
 * there is no 01-07 numbering, the route runs through the gaps with a dot, a
 * hairline and a chevron, and the two human-control stages carry a lime pill
 * attached beneath the box rather than a label inside it.
 *
 * WHY THE BOXES ARE FLEX AND NOT A GRID
 * The connectors ARE the gaps. Making the row `[node][link][node][link]…` with
 * nodes at `flex: 1` and links at a fixed width means a connector is a real
 * element with real width, drawn where it belongs, instead of something
 * positioned into a grid gutter by arithmetic. Per ADR-0013, geometry that
 * depends on computing where a gap is will eventually be wrong; geometry that
 * IS the gap cannot be.
 *
 * ACCESSIBILITY
 * The drawing is aria-hidden and the same sequence is an ordered list for
 * assistive technology, because a flow summarised into one aria-label loses
 * the order, and the order is the content. Icons are decorative here: every
 * one sits beside its own text label, so announcing them would read the label
 * twice (ADR-0003).
 */

export interface FlowStage {
  name: string
  detail: string
  /** True where a person is answerable for what happens. */
  human?: boolean
  /** Governed icon. 'nodes' presentation only. */
  icon?: IconName
}

interface OperatingFlowProps {
  stages: readonly FlowStage[]
  caption: string
  a11yIntro: string
  /** Label on the return line. 'track' presentation only. */
  feedback?: string
  /** Short uppercase mark on a stage a person is answerable for. */
  humanLabel?: string
  tone?: 'light' | 'dark'
  presentation?: 'track' | 'nodes'
}

export function OperatingFlow({
  stages,
  caption,
  a11yIntro,
  feedback,
  humanLabel,
  tone = 'light',
  presentation = 'track',
}: OperatingFlowProps) {
  const dark = tone === 'dark'

  /* ── The approved hero composition ─────────────────────────────────────── */
  if (presentation === 'nodes') {
    return (
      <figure className={dark ? 'ofn ofn-dark' : 'ofn'}>
        <div className="ofn-row" aria-hidden="true">
          {stages.map((s, i) => (
            <div className="ofn-cell" key={s.name}>
              <div className={s.human ? 'ofn-node ofn-node-human' : 'ofn-node'}>
                {s.icon && (
                  <span className={s.human ? 'ofn-icon ofn-icon-human' : 'ofn-icon'}>
                    <Icon name={s.icon} size="md" />
                  </span>
                )}
                <p className="ofn-name">{s.name}</p>
                <p className="ofn-detail">{s.detail}</p>
              </div>
              {s.human && humanLabel && <span className="ofn-tab">{humanLabel}</span>}

              {/* The route between this stage and the next. A real element in
                  a real gap, not a position computed into a gutter. */}
              {i < stages.length - 1 && (
                <span className="ofn-link">
                  <span className="ofn-link-dot" />
                  <span className="ofn-link-line" />
                  <span className="ofn-link-tip" />
                </span>
              )}
            </div>
          ))}
        </div>

        <figcaption className="sr-only">
          <p>{a11yIntro}</p>
          <ol>
            {stages.map((s) => (
              <li key={s.name}>
                {s.name}: {s.detail}
                {s.human && humanLabel ? `. ${humanLabel}.` : ''}
              </li>
            ))}
          </ol>
          <p>{caption}</p>
        </figcaption>
      </figure>
    )
  }

  /* ── The joined track, used on /solutions ──────────────────────────────── */
  return (
    <figure className={dark ? 'of of-dark' : 'of'}>
      {feedback && (
        <div className="of-return" aria-hidden="true">
          <svg className="of-return-line" viewBox="0 0 14 4" preserveAspectRatio="none" focusable="false">
            <path d="M13 4 V1 H5 V4" />
          </svg>
          <span className="of-return-head" />
          <p className="of-return-label">{feedback}</p>
        </div>
      )}

      <ol className="of-track" aria-hidden="true">
        {stages.map((s, i) => (
          <li key={s.name} className={s.human ? 'of-stage of-stage-human' : 'of-stage'}>
            <p className="of-stage-index">{String(i + 1).padStart(2, '0')}</p>
            <p className="of-stage-name">{s.name}</p>
            <p className="of-stage-detail">{s.detail}</p>
            {s.human && humanLabel && <p className="of-human">{humanLabel}</p>}
          </li>
        ))}
      </ol>

      <figcaption className="of-caption">{caption}</figcaption>

      <div className="sr-only">
        <p>{a11yIntro}</p>
        <ol>
          {stages.map((s) => (
            <li key={s.name}>
              {s.name}: {s.detail}
              {s.human && humanLabel ? `. ${humanLabel}.` : ''}
            </li>
          ))}
        </ol>
        {feedback && <p>{feedback}</p>}
      </div>
    </figure>
  )
}
