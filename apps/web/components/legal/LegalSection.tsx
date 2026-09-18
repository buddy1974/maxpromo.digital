/**
 * components/legal/LegalSection.tsx
 *
 * One section of a legal document.
 *
 * WHAT THIS REPLACES
 * Three separate `Section` components, one defined locally in each of
 * /impressum, /privacy and /agb, all rendering the same thing: a rounded panel
 * on the subtle surface with a 3px Dark Green left border and an uppercase
 * label. Repeated thirteen times down the terms page and around forty times
 * down the privacy policy.
 *
 * Two problems with that, beyond being three implementations of one thing.
 * A pale accented card is how this design system marks something a reader
 * should notice, and a document in which every clause is marked has marked
 * nothing. And a legal page is a document rather than an interface: a person
 * reading it is looking for one clause, which means they need scanning
 * structure, not a stack of panels of identical weight.
 *
 * So: a numbered heading, a hairline rule between sections, body copy at a
 * readable measure, and an anchor so a clause can be linked to and a table of
 * contents can reach it. That is what a contract looks like when it is typeset
 * rather than decorated.
 *
 * NOTHING HERE TOUCHES LEGAL SUBSTANCE. This component receives its children
 * and renders them. No wording, obligation, disclosure, retention statement,
 * liability term or jurisdiction clause was read, rewritten or reordered by
 * the change that introduced it.
 */

/**
 * The document typography for the three legal routes, carried by the
 * component that uses it rather than by the global stylesheet that every
 * page of the site downloads. Six classes, one consumer — this file.
 */
import './legal-section.css'

/** Stable anchor from a heading, so a clause can be linked to directly. */
export function legalAnchor(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function LegalSection({
  label,
  num,
  id,
  children,
}: {
  label: string
  /** The clause number where the document already has one, e.g. "§1". */
  num?: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <section id={id ?? legalAnchor(label)} className="legal-section">
      <h2 className="legal-h">
        {num && <span className="legal-h-num">{num}</span>}
        <span>{label}</span>
      </h2>
      <div className="legal-body">{children}</div>
    </section>
  )
}

/** The contents list at the head of a long document. */
export function LegalToc({
  items,
  label,
}: {
  items: readonly { num?: string; label: string; id?: string }[]
  label: string
}) {
  return (
    <nav aria-label={label}>
      <ul className="legal-toc">
        {items.map((item) => (
          <li key={item.label}>
            <a href={`#${item.id ?? legalAnchor(item.label)}`}>
              {item.num && <span className="legal-toc-num">{item.num}</span>}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
