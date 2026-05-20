/**
 * components/systems/SystemGrid/SystemGrid.tsx
 *
 * Grid renderer for collections of ProductEntry items.
 * Receives a pre-filtered product array from the registry export groups
 * and renders a SystemCard per product using the specified variant.
 *
 * No filtering logic lives here. Callers import the correct export group:
 *   HOMEPAGE_PRODUCTS  → variant='compact', columns=3
 *   PUBLIC_PRODUCTS    → variant='full',    columns=3
 *   FEATURED_PRODUCTS  → variant='featured', columns=2
 *
 * Consumers:
 *   app/[locale]/page.tsx        — homepage compact grid (TODO)
 *   app/[locale]/systems/page.tsx — systems page full grid (TODO)
 *   app/[locale]/products/page.tsx — products index (TODO)
 *
 * TODO: connect registry consumers
 * TODO: homepage integration — import HOMEPAGE_PRODUCTS, pass variant='compact'
 * TODO: systems page integration — import PUBLIC_PRODUCTS, pass variant='full'
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { CardVariant, ImageMode } from '../SystemCard/SystemCard'
import SystemCard from '../SystemCard/SystemCard'

// =============================================================================
// TYPES
// =============================================================================

/** Supported column counts for the grid layout. */
export type GridColumns = 2 | 3 | 4

/** Props for the SystemGrid component. */
export interface SystemGridProps {
  /**
   * Pre-filtered product array from a registry export group.
   * Do NOT pass PRODUCTS directly — always pass a filtered group.
   *
   * @example
   * import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
   * <SystemGrid products={HOMEPAGE_PRODUCTS} variant="compact" />
   */
  readonly products: ReadonlyArray<ProductEntry>
  /**
   * Card variant to use for all products in this grid.
   * All cards in one grid use the same variant.
   */
  readonly variant: CardVariant
  /**
   * Number of columns in the desktop grid layout.
   * Responsive breakpoints are handled by CSS — this sets the desktop target.
   * Defaults to 3.
   */
  readonly columns?: GridColumns
  /**
   * Active locale. Passed down to each SystemCard for copy selection.
   * TODO: derive from next-intl context once integrated with pages.
   */
  readonly locale?: string
  /**
   * Thumbnail image fill mode — forwarded to SystemCardCompact.
   * Only applied when variant='compact'. Ignored by all other variants.
   */
  readonly imageMode?: ImageMode
  /**
   * Optional section heading above the grid.
   * When provided, renders as an h2.
   */
  readonly title?: string
  /**
   * Optional section description below the title.
   * Rendered as a paragraph when provided.
   */
  readonly description?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemGrid — registry-driven product card grid.
 *
 * Pass a registry export group as `products` and choose a `variant`.
 * The grid handles layout; each card handles content.
 *
 * @example
 * // Homepage compact grid
 * import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
 * <SystemGrid products={HOMEPAGE_PRODUCTS} variant="compact" columns={3} locale="de" />
 *
 * // Systems page full grid
 * import { PUBLIC_PRODUCTS } from '@/lib/registry/products'
 * <SystemGrid products={PUBLIC_PRODUCTS} variant="full" columns={3} locale="de" />
 */
export default function SystemGrid({
  products,
  variant,
  columns = 3,
  locale = 'de',
  title,
  description,
  imageMode,
}: SystemGridProps) {

  // Guard: render nothing if the product list is empty.
  // This prevents layout gaps when a filter group returns zero results.
  if (products.length === 0) {
    return null
  }

  return (
    <section data-component="system-grid" data-variant={variant}>

      {/* ── Optional section header */}
      {(title || description) && (
        <header data-section="grid-header">
          {title && (
            <h2 data-field="title">
              {/* TODO: style heading using Syne/heading font */}
              {title}
            </h2>
          )}
          {description && (
            <p data-field="description">
              {/* TODO: style as body text */}
              {description}
            </p>
          )}
        </header>
      )}

      {/*
        ── GRID
        Layout: CSS grid with `columns` columns on desktop.
        Responsive breakpoints are handled by Tailwind className added during
        visual implementation.

        TODO: add visual styling — background, gap, border-radius
        TODO: add Tailwind responsive classes (grid-cols-1 sm:grid-cols-2 lg:grid-cols-N)
        TODO: consider stagger animation with Framer Motion (added in visual pass)
      */}
      <div
        data-section="grid"
        data-columns={columns}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
        }}
      >
        {products.map((product) => (
          <SystemCard
            key={product.slug}
            product={product}
            variant={variant}
            locale={locale}
            showBadge
            showDomain={variant !== 'compact'}
            showCTA
            imageMode={imageMode}
          />
        ))}
      </div>

    </section>
  )
}
