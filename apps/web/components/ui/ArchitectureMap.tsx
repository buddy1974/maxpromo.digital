import { Icon, type IconName } from '@maxpromo/ui'

/**
 * components/ui/ArchitectureMap.tsx
 *
 * A centre and the things attached to it, in two layouts.
 *
 *   'fan'  one source, a row of branches beneath it, and one shared outcome
 *          under those. Used on /solutions: one business, three system
 *          families, one operation.
 *   'hub'  a centre surrounded by its members. Used on /industries: one
 *          operating backbone, the six sectors around it. And on the home
 *          page: one business, the five capabilities around it. Five or six
 *          members; the spoke set follows the node count.
 *
 * The pattern is Agent Bureau's radial team map, generalised. Same grammar —
 * lime centre, neutral members, thin grey connectors on a pale surface —
 * carrying a different argument on each page.
 *
 * GEOMETRY, AND THE MISTAKE IT AVOIDS
 * The hub is a 3×3 CSS grid with the centre in the middle cell. A 3×3 grid
 * puts every cell centre at 1/6, 3/6 or 5/6 of each axis, so the connector
 * SVG can name those coordinates exactly and meet each node at any size.
 *
 * The version of this that shipped on the old homepage placed its nodes by
 * trigonometry as percentages of a box sized by `aspect-ratio`. That box
 * computed to 0×0 in production and every label stacked on the centre. Nothing
 * here is sized by aspect-ratio and nothing is positioned by arithmetic over a
 * gutter (ADR-0013).
 *
 * Below the horizontal breakpoint both layouts become an ordered connected
 * list, because a six-spoke radial at 375px is six unreadable labels.
 */

export interface MapNode {
  label: string
  detail?: string
  icon?: IconName
}

interface ArchitectureMapProps {
  layout: 'fan' | 'hub'
  /** The thing everything else attaches to. */
  centre: MapNode
  nodes: readonly MapNode[]
  /** 'fan' only: the shared result beneath the branches. */
  outcome?: MapNode
  caption: string
  a11yIntro: string
}

/**
 * Hub connectors, from the middle cell of a 3×3 grid to the cells this
 * component uses. Cell centres are at 1/6, 3/6 and 5/6 on each axis, which in a
 * 0-6 viewBox are 1, 3 and 5.
 *
 * Six nodes fill the top and bottom rows. Five drop the bottom-centre cell and
 * its spoke, rather than leaving a line running to nothing: an unterminated
 * connector reads as a missing node, which is exactly the kind of thing a
 * diagram must not say by accident (ADR-0013).
 */
const HUB_SPOKES_6 = [
  'M3 3 L1 1', 'M3 3 L3 1', 'M3 3 L5 1',
  'M3 3 L1 5', 'M3 3 L3 5', 'M3 3 L5 5',
]
const HUB_SPOKES_5 = [
  'M3 3 L1 1', 'M3 3 L3 1', 'M3 3 L5 1',
  'M3 3 L1 5', 'M3 3 L5 5',
]

export function ArchitectureMap({
  layout,
  centre,
  nodes,
  outcome,
  caption,
  a11yIntro,
}: ArchitectureMapProps) {
  const all = [centre, ...nodes, ...(outcome ? [outcome] : [])]

  return (
    <figure className={layout === 'hub' ? 'amap amap-hub' : 'amap amap-fan'}>
      <div className="amap-frame" aria-hidden="true">
        {layout === 'fan' ? (
          <>
            <div className="amap-centre-row">
              <span className="amap-centre">{centre.label}</span>
            </div>

            {/* One source into three branches. Three equal columns put the
                branch centres at 1/6, 3/6 and 5/6, which is where the paths
                drop. */}
            <svg className="amap-fork" viewBox="0 0 6 4" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M3 0 V2" />
              <path d="M1 2 H5" />
              <path d="M1 2 V4" />
              <path d="M3 2 V4" />
              <path d="M5 2 V4" />
            </svg>

            <div className="amap-branches">
              {nodes.map((n) => (
                <div className="amap-node" key={n.label}>
                  {n.icon && <span className="amap-icon"><Icon name={n.icon} size="md" /></span>}
                  <p className="amap-label">{n.label}</p>
                  {n.detail && <p className="amap-detail">{n.detail}</p>}
                </div>
              ))}
            </div>

            {outcome && (
              <>
                <svg className="amap-fork amap-fork-up" viewBox="0 0 6 4" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <path d="M3 0 V2" />
                  <path d="M1 2 H5" />
                  <path d="M1 2 V4" />
                  <path d="M3 2 V4" />
                  <path d="M5 2 V4" />
                </svg>
                <div className="amap-centre-row">
                  <span className="amap-outcome">{outcome.label}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <div className={nodes.length === 5 ? 'amap-grid amap-grid-5' : 'amap-grid'}>
            <svg className="amap-spokes" viewBox="0 0 6 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              {(nodes.length === 5 ? HUB_SPOKES_5 : HUB_SPOKES_6).map((d) => <path key={d} d={d} />)}
            </svg>

            {nodes.slice(0, 3).map((n) => (
              <div className="amap-node amap-node-round" key={n.label}>
                {n.icon && <span className="amap-icon"><Icon name={n.icon} size="sm" /></span>}
                <p className="amap-label">{n.label}</p>
              </div>
            ))}

            <div className="amap-hub-centre">
              <span className="amap-centre amap-centre-disc">{centre.label}</span>
            </div>

            {nodes.slice(3, 6).map((n) => (
              <div className="amap-node amap-node-round" key={n.label}>
                {n.icon && <span className="amap-icon"><Icon name={n.icon} size="sm" /></span>}
                <p className="amap-label">{n.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <figcaption className="amap-caption">{caption}</figcaption>

      <div className="sr-only">
        <p>{a11yIntro}</p>
        <ul>
          {all.map((n) => (
            <li key={n.label}>{n.label}{n.detail ? `: ${n.detail}` : ''}</li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
