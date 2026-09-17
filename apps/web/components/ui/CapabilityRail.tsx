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
 * ONE LINE, ALWAYS. The row never wraps at any width. On a desktop all five
 * fit; below that the track scrolls sideways. A rail that wraps stops being a
 * rail — the first version wrapped a single item onto a second line at 1440
 * and read as the beginning of a card grid, which is the opposite of what this
 * is for.
 *
 * NOT A MARQUEE. It does not move on its own at any width: an animated rail
 * reads as decoration and stops people reading it. Each item links to the
 * section of Solutions that covers it, so this is navigation rather than a row
 * of words.
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
    <section className="rail-band surface-plain" data-section="capability-rail">
      <div className="container">
        <p className="section-label">{label}</p>
        <div className="rail-wrap">
          <ul className="rail">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/solutions#${c.id}`} className="rail-item">
                  {/* 14px, the smallest size in the governed set, so the mark
                      sits with a 13px label instead of over-weighing it. */}
                  <span className="rail-icon"><Icon name={c.icon} size="xs" /></span>
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
