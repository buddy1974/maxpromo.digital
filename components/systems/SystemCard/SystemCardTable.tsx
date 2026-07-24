/**
 * components/systems/SystemCard/SystemCardTable.tsx
 *
 * Table row variant, future tabular product listing.
 * The most condensed variant: one row per product with just enough information
 * to identify and link to it.
 *
 * Intended for: search results, comparison views, embedded product lists,
 * partner dashboards, and any context where dense display is preferred.
 *
 * Consumer:
 *   Not yet assigned, future use only.
 *   Rendered by SystemCard with variant='table'
 *
 * TODO: design table variant layout
 * TODO: assign to a specific consumer page
 */

import type { SystemCardProps } from './SystemCard'

// =============================================================================
// PROPS
// =============================================================================

/** Table variant props, minimal set. */
export type SystemCardTableProps = Pick<SystemCardProps, 'product' | 'locale'>

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardTable, condensed table-row card.
 *
 * One row per product. Minimal content: name, category, domain, status, CTA.
 * Full design not yet specified, shell only.
 *
 * @example
 * <SystemCard product={p} variant="table" />
 */
export function SystemCardTable({ product, locale = 'de' }: SystemCardTableProps) {

  const name = product.name
  const domain = product.domain
  const category = product.category

  return (
    <div
      data-slug={product.slug}
      data-variant="table"
      data-category={category}
      role="row"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {/*
        ── SHELL, layout not yet designed.
        TODO: design table row layout:
          [brand-dot] [name] [category] [domain] [status] [CTA →]
        TODO: assign to a specific page and grid context.
      */}
      <span data-field="name">{name}</span>
      <span data-field="category">{category}</span>
      <span data-field="domain">{domain}</span>

      <a
        href={product.landingUrl}
        data-field="cta"
        data-event-source={product.eventSource}
      >
        {locale === 'de' ? 'Ansehen →' : 'View →'}
      </a>
    </div>
  )
}
