import { Icon } from '@maxpromo/ui'
import { INTEGRATIONS } from '@/lib/capabilities'

/**
 * components/ui/IntegrationMarquee.tsx
 *
 * The tools a business already has, travelling slowly across the page.
 *
 * WHY IT MOVES, AND WHY IT IS THE ONLY THING ON THIS SITE THAT DOES
 * A static block of twelve names reads as a tag cloud, and a tag cloud reads
 * as filler. Moving, the same twelve read as traffic — which is the argument
 * the section is making: work already flows through these, and we connect to
 * them rather than replacing them. Nothing else on the site animates, which is
 * what keeps this from looking like decoration.
 *
 * SEAMLESS, AT ANY WIDTH
 * The row holds the set twice and translates by exactly -50%, so the second
 * copy is under the cursor at the moment the first has finished. No pixel
 * distance is hardcoded, so it loops identically on a phone and on a 4K
 * display — the failure mode of every marquee written against one monitor.
 *
 * NOT CONTROLS
 * These are statements of fact, not links, so they are list items and not
 * buttons. Nothing here is focusable, because a focus stop that leads nowhere
 * is worse than none. The second copy is hidden from assistive technology so
 * the list is announced once.
 *
 * REDUCED MOTION
 * `prefers-reduced-motion: reduce` stops it dead and turns the rail into a
 * scrollable row instead. The tools stay readable and reachable; only the
 * movement goes. That is in the stylesheet, not in JavaScript, so it is true
 * before the page has finished loading.
 *
 * FULL WIDTH BY POSITION, NOT BY NEGATIVE MARGIN
 * This renders outside the container, as a direct child of the section, so it
 * spans the viewport without any `100vw` arithmetic — which is the usual way a
 * full-bleed rail ends up causing horizontal scroll on the page itself when a
 * scrollbar is present.
 */

export function IntegrationMarquee({ label }: { label: string }) {
  const set = (hidden: boolean) => (
    <ul className="mq-set" aria-hidden={hidden || undefined}>
      {INTEGRATIONS.map((tool) => (
        <li key={`${hidden ? 'b' : 'a'}-${tool.name}`} className="mq-item">
          <span className="mq-icon"><Icon name={tool.icon} size="xs" /></span>
          {tool.name}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="mq" role="group" aria-label={label}>
      <div className="mq-row">
        {set(false)}
        {set(true)}
      </div>
    </div>
  )
}
