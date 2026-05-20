/**
 * components/systems/SystemCard/SystemCard.tsx
 *
 * Main entry point for all product card variants.
 * Routes to the correct sub-component based on the `variant` prop.
 * Shared types for the card family are defined and exported from here.
 *
 * Variants:
 *   compact   → homepage grid (SystemCardCompact)
 *   featured  → featured sections (SystemCardFeatured)
 *   full      → systems page and products index (inline below)
 *   admin     → /os/systems registry table row (inline below)
 *   table     → future tabular listing (inline below)
 *
 * TODO: connect registry consumers
 * TODO: homepage integration (HOMEPAGE_PRODUCTS → variant='compact')
 * TODO: systems page integration (PUBLIC_PRODUCTS → variant='full')
 */

import type { ProductEntry } from '@/lib/registry/types'
import { SystemCardCompact } from './SystemCardCompact'
import { SystemCardFeatured } from './SystemCardFeatured'

// =============================================================================
// SHARED TYPES — imported by all variants
// =============================================================================

/** All supported card rendering variants. */
export type CardVariant = 'compact' | 'featured' | 'full' | 'admin' | 'table'

/** Props shared by all SystemCard variants. */
export interface SystemCardProps {
  /** Product data from the registry. */
  readonly product: ProductEntry
  /**
   * Visual rendering variant.
   * Defaults to 'full' when not specified.
   */
  readonly variant?: CardVariant
  /**
   * Active locale for copy selection (en | de).
   * Passed down from the page's locale param.
   * TODO: derive from next-intl context once integrated with pages.
   */
  readonly locale?: string
  /** Show the LIVE status badge (only visible when product.status === 'live'). */
  readonly showBadge?: boolean
  /** Show the product domain label in the card footer. */
  readonly showDomain?: boolean
  /** Show the primary and secondary CTA buttons. */
  readonly showCTA?: boolean
}

// =============================================================================
// VARIANT ROUTER
// =============================================================================

/**
 * SystemCard — variant router.
 *
 * Import this component whenever you need a product card.
 * Pass `variant` to select the rendering mode.
 * All variant-specific components are internal to this folder.
 *
 * @example
 * <SystemCard product={p} variant="compact" locale="de" />
 * <SystemCard product={p} variant="full" showBadge showDomain showCTA />
 */
export default function SystemCard({
  product,
  variant = 'full',
  locale = 'de',
  showBadge = true,
  showDomain = true,
  showCTA = true,
}: SystemCardProps) {

  // ── Compact — homepage grid
  if (variant === 'compact') {
    return (
      <SystemCardCompact
        product={product}
        locale={locale}
        showCTA={showCTA}
      />
    )
  }

  // ── Featured — editorial featured sections
  if (variant === 'featured') {
    return (
      <SystemCardFeatured
        product={product}
        locale={locale}
        showBadge={showBadge}
        showDomain={showDomain}
        showCTA={showCTA}
      />
    )
  }

  // ── Full — systems page and products index
  if (variant === 'full') {
    return (
      <article
        data-slug={product.slug}
        data-variant="full"
        style={{ position: 'relative' }}
      >
        {/*
          TODO: implement full variant
          Sections: thumbnail image, status badge (if showBadge), category label,
          product name, subline, 3 bullets, domain footer (if showDomain),
          primary + secondary CTA (if showCTA)
          Design reference: /public/images/systems/[slug]/card/[slug]-[locale].png
        */}
        <div data-shell="full" style={{ display: 'none' }} aria-hidden="true" />
      </article>
    )
  }

  // ── Admin — /os/systems registry view
  if (variant === 'admin') {
    return (
      <div
        data-slug={product.slug}
        data-variant="admin"
        role="row"
      >
        {/*
          TODO: implement admin variant
          Columns: product name, domain (link), status dropdown, maturity,
          featured toggle, priority_score, demo URL, health indicator,
          action buttons (open system, open landing, open domain, book demo)
        */}
        <div data-shell="admin" style={{ display: 'none' }} aria-hidden="true" />
      </div>
    )
  }

  // ── Table — future tabular listing
  // Placeholder — not yet designed.
  return (
    <div
      data-slug={product.slug}
      data-variant="table"
    >
      {/* TODO: implement table variant */}
      <div data-shell="table" style={{ display: 'none' }} aria-hidden="true" />
    </div>
  )
}
