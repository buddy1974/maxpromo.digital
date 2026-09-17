import { Icon, type IconName } from '@maxpromo/ui'
import { Link } from '@/i18n/navigation'

/**
 * components/ui/CapabilityRail.tsx
 *
 * The answer to "do these people do the thing I need?", directly beneath the
 * hero that explains how the company thinks.
 *
 * The hero earns attention by showing the operating model. It does not tell a
 * visitor searching for a web developer that Maxpromo builds websites. This
 * rail does, in a few words each, before they scroll far enough to leave.
 *
 * NOT A MARQUEE. It scrolls horizontally on a narrow screen because five
 * labels do not fit, and it does not move on its own at any width: an animated
 * rail reads as decoration and stops people reading it. Each item links to the
 * section of Solutions that covers it, so this is navigation rather than a row
 * of words.
 *
 * `overflow-x: auto` on the track is also what the responsive audit asks of
 * anything wider than its viewport, and here it is honest: on a phone the row
 * really is meant to be scrolled.
 *
 * Labels are passed in already translated. The component holds no copy, so
 * German and English use the same one.
 */

export interface RailItem {
  id: string
  icon: IconName
  name: string
}

export function CapabilityRail({ label, items }: { label: string; items: readonly RailItem[] }) {
  return (
    <section className="section-compact surface-plain" data-section="capability-rail">
      <div className="container">
        <p className="section-label">{label}</p>
        <div className="rail-wrap">
          <ul className="rail">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/solutions#${c.id}`} className="rail-item">
                  <span className="rail-icon"><Icon name={c.icon} size="sm" /></span>
                  <span className="rail-name">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
