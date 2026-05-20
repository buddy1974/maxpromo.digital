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
 * Consumers do NOT pass column counts — all responsive rules live here.
 *
 * Responsive matrix (Tailwind breakpoints):
 *   compact:  mobile=1 · tablet(md)=2 · desktop(lg)=3
 *   featured: mobile=1 · tablet(md)=2 · desktop(lg)=3
 *   full:     mobile=1 · tablet(md)=1 · desktop(lg)=2
 *   admin:    mobile=1 · tablet(md)=1 · desktop(lg)=1
 *   table:    mobile=1 · tablet(md)=1 · desktop(lg)=1
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { CardVariant, ImageMode } from '../SystemCard/SystemCard'
import SystemCard from '../SystemCard/SystemCard'

// =============================================================================
// RESPONSIVE COLUMN MAP
// Variant → Tailwind responsive grid classes.
// All class names written as complete strings for static analysis by Tailwind.
// =============================================================================

const RESPONSIVE_GRID_CLASSES: Record<CardVariant, string> = {
  compact:  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  featured: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  full:     'grid-cols-1 lg:grid-cols-2',
  admin:    'grid-cols-1',
  table:    'grid-cols-1',
}

// =============================================================================
// TYPES
// =============================================================================

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
   * Responsive column layout is derived automatically from this value.
   */
  readonly variant: CardVariant
  /**
   * Active locale. Passed down to each SystemCard for copy selection.
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
}: SystemGridProps) {

  if (products.length === 0) {
    return null
  }

  const gridClass = RESPONSIVE_GRID_CLASSES[variant]

  return (
    <section data-component="system-grid" data-variant={variant}>

      {/* ── Optional section header */}
      {(title || description) && (
        <header data-section="grid-header">
          {title && (
            <h2 data-field="title">
              {title}
            </h2>
          )}
          {description && (
            <p data-field="description">
              {description}
            </p>
          )}
        </header>
      )}

      {/*
        ── GRID
        Responsive column layout is Tailwind-driven, keyed by variant.
        All class strings are static literals in RESPONSIVE_GRID_CLASSES
        so Tailwind's content scanner can detect them at build time.

        TODO: add visual styling — background, gap, border-radius
        TODO: consider stagger animation with Framer Motion (visual pass)
      */}
      <div
        data-section="grid"
        className={gridClass}
        style={{
          display: 'grid',
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
