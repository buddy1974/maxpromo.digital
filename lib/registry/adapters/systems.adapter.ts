/**
 * lib/registry/adapters/systems.adapter.ts
 *
 * Transforms PUBLIC_PRODUCTS registry entries into the data shape
 * the systems page and products index need.
 *
 * Data flow:
 *   PUBLIC_PRODUCTS (registry)
 *     → toSystemsCard() (transform)
 *     → SystemsCardData (output)
 *     → SystemCardFull (component)
 *     → app/[locale]/systems/page.tsx (consumer — TODO)
 *     → app/[locale]/products/page.tsx (consumer — TODO)
 *
 * TODO: future analytics — inject click-through data per product
 * TODO: future tracking — add UTM parameters to external CTAs
 * TODO: future permissions — filter by user-visible categories when roles exist
 * TODO: future i18n — accept next-intl formatter for dynamic CTA labels
 */

import type {
  ProductEntry,
  ProductCategory,
  ProductTrack,
  ProductLayout,
  BulletTuple,
  WorkflowTuple,
} from '@/lib/registry/types'
import { PUBLIC_PRODUCTS, PROTECTED_PRODUCTS } from '@/lib/registry/products'
import {
  resolveString,
  resolveBullets,
  resolveWorkflow,
  resolveCardImage,
  resolveThumbImage,
  resolvePrimaryLabel,
  resolveSecondaryLabel,
  resolvePrimaryHref,
} from './utils'

// =============================================================================
// OUTPUT TYPE
// =============================================================================

/**
 * Systems page card data — full public card shape.
 * Richer than HomepageCardData: includes bullets, workflow, domain,
 * CTA pair, and category for filter tab placement.
 * No internal fields (status enum value, priority_score, maturity, etc.).
 */
export interface SystemsCardData {
  // ── Identity
  readonly slug: string
  readonly name: string
  readonly domainBrand: string
  readonly domain: string

  // ── Classification (public-safe subset)
  /** Used for systems page filter tab placement. */
  readonly category: ProductCategory
  /** Used to determine rendering context (founder products surface separately). */
  readonly track: ProductTrack
  /** True only when product.status === 'live'. Safe to show publicly. */
  readonly isLive: boolean

  // ── Locale-resolved content
  readonly headline: string
  readonly subline: string
  readonly description: string
  /** BulletTuple — always exactly 3 items (governance VG-09). */
  readonly bullets: BulletTuple
  /** WorkflowTuple — always exactly 5 steps (governance VG-10). */
  readonly workflow: WorkflowTuple

  // ── Visual
  readonly brandColor: string
  readonly layoutVariant: ProductLayout
  readonly media: {
    readonly card: string
    readonly thumb: string | null
  }

  // ── Links
  readonly landingUrl: string
  readonly systemUrl: string
  readonly demoUrl: string | null
  readonly bookDemoUrl: string

  // ── CTAs
  readonly primaryCTA: {
    readonly label: string
    readonly href: string
    readonly opensNewTab: boolean
  }
  readonly secondaryCTA: {
    readonly label: string
    readonly href: string
  }

  // ── Tracking
  readonly eventSource: string
  readonly trackingEnabled: boolean
}

// =============================================================================
// TRANSFORM
// =============================================================================

/**
 * Transforms a single ProductEntry into SystemsCardData for the given locale.
 * Pure function — no side effects.
 */
export function toSystemsCard(
  product: ProductEntry,
  locale: string,
): SystemsCardData {
  const primaryHref = resolvePrimaryHref(product)

  return {
    // ── Identity
    slug:        product.slug,
    name:        product.name,
    domainBrand: product.domainBrand,
    domain:      product.domain,

    // ── Classification
    category: product.category,
    track:    product.track,
    isLive:   product.status === 'live',

    // ── Locale-resolved content
    headline:    resolveString(product.headline, locale),
    subline:     resolveString(product.subline, locale),
    description: resolveString(product.description, locale),
    bullets:     resolveBullets(product.bullets, locale),
    workflow:    resolveWorkflow(product.workflow, locale),

    // ── Visual
    brandColor:     product.brandColor,
    layoutVariant:  product.layoutVariant,
    media: {
      card:  resolveCardImage(product, locale),
      thumb: resolveThumbImage(product, locale),
    },

    // ── Links
    landingUrl:  product.landingUrl,
    systemUrl:   product.systemUrl,
    demoUrl:     product.demoUrl,
    bookDemoUrl: product.bookDemoUrl,

    // ── CTAs
    primaryCTA: {
      label:      resolvePrimaryLabel(product, locale),
      href:       primaryHref.href,
      opensNewTab: primaryHref.opensNewTab,
    },
    secondaryCTA: {
      label: resolveSecondaryLabel(product, locale),
      href:  product.bookDemoUrl,
    },

    // ── Tracking
    eventSource:     product.eventSource,
    trackingEnabled: product.trackingEnabled,
  }
}

// =============================================================================
// GETTERS
// =============================================================================

/**
 * Returns all public systems cards for the given locale.
 * Sourced from PUBLIC_PRODUCTS — excludes protected and internal products.
 * Drive24 (protected) does NOT appear here. Use getProtectedCards() for that.
 *
 * Consumer: app/[locale]/systems/page.tsx
 *
 * @example
 * const cards = getSystemsCards('de')
 */
export function getSystemsCards(locale: string): ReadonlyArray<SystemsCardData> {
  return PUBLIC_PRODUCTS.map(p => toSystemsCard(p, locale))
}

/**
 * Returns public systems cards for a specific category.
 * Used to populate individual filter tabs on the systems page.
 *
 * @example
 * const businessCards = getSystemsCardsByCategory('business-system', 'de')
 */
export function getSystemsCardsByCategory(
  category: ProductCategory,
  locale: string,
): ReadonlyArray<SystemsCardData> {
  return PUBLIC_PRODUCTS
    .filter(p => p.category === category)
    .map(p => toSystemsCard(p, locale))
}

/**
 * Returns protected (gated) product cards.
 * Currently: Drive24 only.
 * Used by systems page Platforms tab — renders these separately from public grid.
 *
 * TODO: future permissions — check user session before returning protected cards
 *
 * @example
 * const protectedCards = getProtectedCards('en')
 */
export function getProtectedCards(locale: string): ReadonlyArray<SystemsCardData> {
  return PROTECTED_PRODUCTS.map(p => toSystemsCard(p, locale))
}
