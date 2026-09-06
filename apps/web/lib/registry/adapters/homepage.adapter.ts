/**
 * lib/registry/adapters/homepage.adapter.ts
 *
 * Transforms HOMEPAGE_PRODUCTS registry entries into the data shape
 * the homepage grid needs. Pages import from here — never from the
 * registry directly.
 *
 * Data flow:
 *   HOMEPAGE_PRODUCTS (registry)
 *     → toHomepageCard() (transform)
 *     → HomepageCardData (output)
 *     → SystemCardCompact or SystemCardFeatured (component)
 *     → app/[locale]/page.tsx (consumer — TODO)
 *
 * TODO: future analytics — inject session/experiment context here
 * TODO: future tracking — append UTM or click-id to ctaHref
 * TODO: future A/B — accept variant flag to swap headline/CTA copy
 */

import type { ProductEntry, ProductLayout } from '@/lib/registry/types'
import { resolveBrand } from '@maxpromo/config'
import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
import {
  resolveString,
  resolveCardImage,
  resolveThumbImage,
  resolvePrimaryLabel,
  resolvePrimaryHref,
} from './utils'

// =============================================================================
// OUTPUT TYPE
// =============================================================================

/**
 * Homepage card data — minimal shape for the compact grid.
 * Contains only what SystemCardCompact needs. No internal fields.
 */
export interface HomepageCardData {
  /** Registry slug — use as React key. */
  readonly slug: string
  /** Display name. */
  readonly name: string
  /** Locale-resolved headline. */
  readonly headline: string
  /** Locale-resolved subline. */
  readonly subline: string
  /** Brand accent hex color. */
  readonly brandColor: string
  /** Visual layout variant (A | B | C). */
  readonly layoutVariant: ProductLayout
  /** Resolved image paths for this locale. */
  readonly media: {
    /** Card image (always available). */
    readonly card: string
    /**
     * Thumbnail image (smaller crop).
     * Null until /public/images/systems/[slug]/thumb/ is deployed.
     * Component falls back to card when null.
     * TODO: remove null once all thumbs are deployed.
     */
    readonly thumb: string | null
  }
  /** Primary CTA for this product and locale. */
  readonly primaryCTA: {
    readonly label: string
    readonly href: string
    readonly opensNewTab: boolean
  }
  /** Event source slug for click tracking. */
  readonly eventSource: string
  /** Whether tracking is enabled for this product. */
  readonly trackingEnabled: boolean
}

// =============================================================================
// TRANSFORM
// =============================================================================

/**
 * Transforms a single ProductEntry into HomepageCardData for the given locale.
 * Pure function — no side effects.
 */
export function toHomepageCard(
  product: ProductEntry,
  locale: string,
): HomepageCardData {
  const primaryHref = resolvePrimaryHref(product)

  return {
    slug:          product.slug,
    name:          product.name,
    headline:      resolveString(product.headline, locale),
    subline:       resolveString(product.subline, locale),
    brandColor:    resolveBrand(product.slug).colours.accent,
    layoutVariant: product.layoutVariant,
    media: {
      card:  resolveCardImage(product, locale),
      thumb: resolveThumbImage(product, locale),
    },
    primaryCTA: {
      label:      resolvePrimaryLabel(product, locale),
      href:       primaryHref.href,
      opensNewTab: primaryHref.opensNewTab,
    },
    eventSource:     product.eventSource,
    trackingEnabled: product.trackingEnabled,
  }
}

// =============================================================================
// GETTER
// =============================================================================

/**
 * Returns all homepage card data for the given locale.
 * Order is the hard-coded HOMEPAGE_PRODUCTS order — intentional, editorial.
 *
 * Consumer: app/[locale]/page.tsx
 *
 * @example
 * const cards = getHomepageCards('de')
 */
export function getHomepageCards(locale: string): ReadonlyArray<HomepageCardData> {
  return HOMEPAGE_PRODUCTS.map(p => toHomepageCard(p, locale))
}
