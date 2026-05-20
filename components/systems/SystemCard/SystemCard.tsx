/**
 * components/systems/SystemCard/SystemCard.tsx
 *
 * Main entry point for all product card variants.
 * Routes to the correct sub-component based on the `variant` prop.
 * Shared types for the card family are defined and exported from here.
 *
 * Variants:
 *   compact   → thumbnail-first mini card (SystemCardCompact)
 *   featured  → editorial rich card (SystemCardFeatured)
 *   full      → systems page full card (SystemCardFull)
 *   admin     → /os/systems registry row (SystemCardAdmin)
 *   table     → future tabular listing (SystemCardTable)
 *
 * TODO: connect registry consumers
 * TODO: homepage integration (HOMEPAGE_PRODUCTS → variant='compact')
 * TODO: systems page integration (PUBLIC_PRODUCTS → variant='full')
 */

import type { ProductEntry } from '@/lib/registry/types'
import { SystemCardCompact } from './SystemCardCompact'
import { SystemCardFeatured } from './SystemCardFeatured'
import { SystemCardFull } from './SystemCardFull'
import { SystemCardAdmin } from './SystemCardAdmin'
import { SystemCardTable } from './SystemCardTable'

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
 * All variant-specific components live in this folder.
 *
 * @example
 * <SystemCard product={p} variant="compact" locale="de" />
 * <SystemCard product={p} variant="full" showBadge showDomain showCTA />
 * <SystemCard product={p} variant="admin" />
 */
export default function SystemCard({
  product,
  variant = 'full',
  locale = 'de',
  showBadge = true,
  showDomain = true,
  showCTA = true,
}: SystemCardProps) {

  if (variant === 'compact') {
    return (
      <SystemCardCompact
        product={product}
        locale={locale}
        showCTA={showCTA}
      />
    )
  }

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

  if (variant === 'full') {
    return (
      <SystemCardFull
        product={product}
        locale={locale}
        showBadge={showBadge}
        showDomain={showDomain}
        showCTA={showCTA}
      />
    )
  }

  if (variant === 'admin') {
    return (
      <SystemCardAdmin
        product={product}
        locale={locale}
      />
    )
  }

  // ── Table / fallback
  return (
    <SystemCardTable
      product={product}
      locale={locale}
    />
  )
}
