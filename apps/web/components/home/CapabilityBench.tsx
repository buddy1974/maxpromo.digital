import { Icon, type IconName } from '@maxpromo/ui'
import { Link } from '@/i18n/navigation'

/**
 * components/home/CapabilityBench.tsx
 *
 * The five capabilities as one bench, not five cards.
 *
 * WHY NOT CARDS
 * Five equal cards in a grid say "pick a package". These five are not packages
 * and a business rarely wants exactly one of them: the same customer needs the
 * enquiry captured, the internal tool to hold it, and the website to start it.
 * A bench says they belong to one workshop. So they share one frame, one rule
 * between each, one numbering sequence, and the reader's eye travels down them
 * rather than choosing between them.
 *
 * Each row states the same three things in the same order, which is what makes
 * five different kinds of work feel like one company: the name, the sentence a
 * business owner would recognise, and what we actually do about it.
 *
 * The heading of each row is an `h3` and the whole row is not a link, only the
 * action at the end of it. A row-sized link with three separate ideas inside it
 * is one enormous, unreadable accessible name.
 */

export interface BenchItem {
  id: string
  icon: IconName
  name: string
  headline: string
  body: string
  cta: string
}

export function CapabilityBench({ items }: { items: readonly BenchItem[] }) {
  return (
    <ol className="bench">
      {items.map((c, i) => (
        <li className="bench-row" key={c.id}>
          <p className="bench-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>

          <div className="bench-id">
            <span className="bench-icon"><Icon name={c.icon} size="sm" /></span>
            <p className="bench-name">{c.name}</p>
          </div>

          <div className="bench-say">
            <h3 className="bench-headline">{c.headline}</h3>
            <p className="bench-body">{c.body}</p>
          </div>

          <Link href={`/solutions#${c.id}`} className="bench-cta">
            {c.cta}
            <span className="bench-cta-arrow" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ol>
  )
}
