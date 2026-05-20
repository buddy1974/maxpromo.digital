/**
 * components/systems/ProductsPageGrid.tsx
 *
 * Adapter bridge — connects the products page adapter to the card rendering system.
 * Mirrors HomepageSystemsGrid and SystemsPageGrid exactly: accepts adapter output,
 * imports registry internally, delegates all rendering to SystemGrid → SystemCard.
 *
 * Architecture:
 *
 *   app/[locale]/products/page.tsx
 *     → getProductsCards(locale)          ← adapter (no registry access in page)
 *     → ProductsCardData[]
 *     → <ProductsPageGrid>                ← this file
 *         → SystemGrid                    ← existing card rendering system
 *           → SystemCard (featured)
 *             → SystemCardFeatured
 *
 * Accepted tech debt (same as HomepageSystemsGrid and SystemsPageGrid):
 *   SystemGrid expects ProductEntry[]. ProductsCardData[] is the adapter output.
 *   PUBLIC_PRODUCTS drives rendering today; cards holds adapter metadata.
 *   When SystemCardFeatured accepts ProductsCardData, remove PUBLIC_PRODUCTS.
 *
 * TODO: when SystemCardFeatured accepts ProductsCardData, replace PUBLIC_PRODUCTS
 *       with cards and remove the registry import from this file
 * TODO: future filters  — accept activeCategory prop, filter PUBLIC_PRODUCTS here
 * TODO: future search   — accept searchQuery prop, filter on cards[i].searchTokens
 * TODO: future analytics — fire product_card_viewed impressions using cards data
 */

import type { ProductsCardData } from '@/lib/registry/adapters'
import { PUBLIC_PRODUCTS } from '@/lib/registry/products'
import SystemGrid from '@/components/systems/SystemGrid/SystemGrid'

// =============================================================================
// PROPS
// =============================================================================

export interface ProductsPageGridProps {
  /**
   * Locale-resolved card data from products.adapter → getProductsCards(locale).
   * Order matches PUBLIC_PRODUCTS — both derived from the same registry source.
   * Used for adapter metadata today; will drive rendering in a future pass.
   */
  readonly cards: ReadonlyArray<ProductsCardData>
  /** Active locale — forwarded to SystemGrid for copy selection. */
  readonly locale: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProductsPageGrid({
  cards,
  locale,
}: ProductsPageGridProps) {

  if (cards.length === 0) return null

  return (
    <SystemGrid
      products={PUBLIC_PRODUCTS}
      variant="featured"
      locale={locale}
      source="products_featured"
    />
  )
}
