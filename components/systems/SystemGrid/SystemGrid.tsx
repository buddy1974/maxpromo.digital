/**
 * components/systems/SystemGrid/SystemGrid.tsx
 *
 * Grid renderer for collections of ProductEntry items.
 * Receives a pre-filtered product array from the registry export groups
 * and renders a SystemCard per product using the specified variant.
 *
 * No filtering logic lives here. Callers import the correct export group:
 *   HOMEPAGE_PRODUCTS  → variant='compact'
 *   SYSTEMS_PAGE_PRODUCTS → variant='featured'
 *   PUBLIC_PRODUCTS    → variant='featured'
 *
 * Responsive layout is derived automatically from `variant`.
 * Consumers do NOT pass column counts, all responsive rules live in config.ts.
 * To change breakpoints, edit config.ts only, not this file.
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { CardVariant, ImageMode } from '../SystemCard/SystemCard'
import SystemCard from '../SystemCard/SystemCard'
import { RESPONSIVE_GRID_CLASSES } from './config'

// =============================================================================
// TYPES
// =============================================================================

/** Props for the SystemGrid component. */
export interface SystemGridProps {
  /**
   * Pre-filtered product array from a registry export group.
   * Do NOT pass PRODUCTS directly, always pass a filtered group.
   *
   * @example
   * import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
   * <SystemGrid products={HOMEPAGE_PRODUCTS} variant="compact" />
   */
  readonly products: ReadonlyArray<ProductEntry>
  /**
   * Card variant to use for all products in this grid.
   * All cards in one grid use the same variant.
   * Responsive column layout is derived automatically from this value.
   */
  readonly variant: CardVariant
  /**
   * Active locale. Passed down to each SystemCard for copy selection.
   */
  readonly locale?: string
  /**
   * Thumbnail image fill mode, forwarded to SystemCardCompact.
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
  /**
   * Analytics surface identifier, forwarded to each SystemCard for trackEvent().
   * Set by bridge components: 'homepage_compact' | 'systems_featured' | 'products_featured'
   */
  readonly source?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemGrid, registry-driven product card grid.
 *
 * Pass a registry export group as `products` and choose a `variant`.
 * Responsive column layout is computed automatically from the variant.
 *
 * @example
 * // Homepage compact grid
 * import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
 * <SystemGrid products={HOMEPAGE_PRODUCTS} variant="compact" locale="de" />
 *
 * // Systems page featured grid
 * import { SYSTEMS_PAGE_PRODUCTS } from '@/lib/registry/products'
 * <SystemGrid products={SYSTEMS_PAGE_PRODUCTS} variant="featured" locale="de" />
 */
export default function SystemGrid({
  products,
  variant,
  locale = 'de',
  title,
  description,
  imageMode,
  source,
}: SystemGridProps) {

  if (products.length === 0) {
    return null
  }

  const gridClass = RESPONSIVE_GRID_CLASSES[variant]

  return (
    <section
      data-component="system-grid"
      data-variant={variant}
      style={{
        padding: 'clamp(3.5rem, 6vw, 6rem) 2rem',
        background: 'var(--color-bg)',
      }}
    >

      {/* ── Optional section header */}
      {(title || description) && (
        <header data-section="grid-header" style={{ maxWidth: 'var(--container-width)', margin: '0 auto 2.5rem' }}>
          {title && (
            <h2 data-field="title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: 0 }}>
              {title}
            </h2>
          )}
          {description && (
            <p data-field="description" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginTop: '10px' }}>
              {description}
            </p>
          )}
        </header>
      )}

      {/* ── GRID */}
      <div
        data-section="grid"
        className={gridClass}
        style={{
          display: 'grid',
          gap: '1.5rem',
          maxWidth: 'var(--container-width)',
          margin: '0 auto',
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
            source={source}
          />
        ))}
      </div>

    </section>
  )
}
