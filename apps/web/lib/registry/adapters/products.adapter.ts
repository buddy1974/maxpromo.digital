/**
 * lib/registry/adapters/products.adapter.ts
 *
 * Transforms PUBLIC_PRODUCTS registry entries into the data shape
 * the products index page needs.
 *
 * Data flow:
 *   PUBLIC_PRODUCTS (registry)
 *     → toProductsCard() (transform)
 *     → ProductsCardData (output)
 *     → ProductsPageGrid (bridge)
 *     → SystemGrid → SystemCardFeatured
 *     → app/[locale]/products/page.tsx (consumer)
 *
 * TODO: future search  — add searchTokens field for client-side filtering
 * TODO: future filters  — add statusLabel / categoryLabel for filter chips
 * TODO: future tags     — add techStack[] from registry when field added
 * TODO: future analytics — inject impression data per product
 */

import type { ProductEntry, ProductCategory } from '@/lib/registry/types'
import { PUBLIC_PRODUCTS } from '@/lib/registry/products'
import {
  resolveString,
  resolveCardImage,
  resolveThumbImage,
  resolvePrimaryLabel,
  resolvePrimaryHref,
  resolveSecondaryLabel,
} from './utils'

// =============================================================================
// OUTPUT TYPE
// =============================================================================

/**
 * Products index card data — public listing shape.
 * Focused on what the products index page needs today.
 * Intentionally narrower than SystemsCardData — no bullets, workflow, or domain.
 */
export interface ProductsCardData {
  // ── Identity
  readonly slug: string
  readonly name: string

  // ── Classification (public-safe subset)
  readonly category: ProductCategory
  readonly isLive: boolean

  // ── Content (locale-resolved)
  readonly headline: string
  readonly subline: string

  // ── Media
  readonly media: {
    readonly card: string
    readonly thumb: string | null
  }

  // ── CTA
  readonly primaryCTA: {
    readonly label: string
    readonly href: string
    readonly opensNewTab: boolean
  }
  readonly secondaryCTALabel: string

  // ── Analytics
  readonly eventSource: string
  readonly trackingEnabled: boolean
}

// =============================================================================
// TRANSFORM
// =============================================================================

/** Transform a single ProductEntry into ProductsCardData for the products index. */
export function toProductsCard(product: ProductEntry, locale: string): ProductsCardData {
  const { href, opensNewTab } = resolvePrimaryHref(product)

  return {
    slug:            product.slug,
    name:            product.name,
    category:        product.category,
    isLive:          product.status === 'live',
    headline:        resolveString(product.headline, locale),
    subline:         resolveString(product.subline, locale),
    media: {
      card:          resolveCardImage(product, locale),
      thumb:         resolveThumbImage(product, locale),
    },
    primaryCTA: {
      label:         resolvePrimaryLabel(product, locale),
      href,
      opensNewTab,
    },
    secondaryCTALabel: resolveSecondaryLabel(product, locale),
    eventSource:     product.eventSource,
    trackingEnabled: product.trackingEnabled,
  }
}

// =============================================================================
// COLLECTION QUERIES
// =============================================================================

/** All public products for the products index — locale-resolved. */
export function getProductsCards(locale: string): ReadonlyArray<ProductsCardData> {
  return PUBLIC_PRODUCTS.map(p => toProductsCard(p, locale))
}

/** Filter by category — for future category tab implementation. */
export function getProductsCardsByCategory(
  category: ProductCategory,
  locale: string,
): ReadonlyArray<ProductsCardData> {
  return PUBLIC_PRODUCTS
    .filter(p => p.category === category)
    .map(p => toProductsCard(p, locale))
}
