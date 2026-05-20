/**
 * components/systems/HomepageSystemsGrid.tsx
 *
 * Adapter bridge — connects the homepage adapter to the card rendering system.
 * This is the ONLY file that knows about both HomepageCardData and SystemGrid.
 *
 * Architecture:
 *
 *   app/[locale]/page.tsx
 *     → getHomepageCards(locale)        ← adapter (no registry access in page)
 *     → HomepageCardData[]
 *     → <HomepageSystemsGrid>           ← this file
 *         → SystemGrid                  ← existing card rendering system
 *           → SystemCard (compact)
 *             → SystemCardCompact
 *
 * Responsibilities:
 *   1. Receive HomepageCardData[] from the adapter (locale-resolved, ordered)
 *   2. Provide HOMEPAGE_PRODUCTS to SystemGrid (ProductEntry[] it requires today)
 *   3. Pass locale, variant, imageMode to SystemGrid
 *
 * Why both cards AND HOMEPAGE_PRODUCTS?
 *   SystemGrid currently requires ProductEntry[]. HomepageCardData[] is the
 *   adapter output — locale-resolved, analytics-ready, and the intended future
 *   input once SystemCardCompact is updated to accept HomepageCardData.
 *
 *   Today:  HOMEPAGE_PRODUCTS drives rendering; cards holds adapter metadata
 *   Future: cards drives rendering directly; HOMEPAGE_PRODUCTS import removed
 *
 * What cards is used for today:
 *   - Validation: assert order parity with HOMEPAGE_PRODUCTS
 *   - Future analytics: cards.map(c => c.eventSource) for impression events
 *   - Future experiments: cards.map(c => c.slug) for A/B variant selection
 *   - Future: pass trackingEnabled per card into SystemCard props
 *
 * No card markup here. No CTA rendering here.
 * One card system: SystemCard → SystemCardCompact.
 *
 * TODO: when SystemCardCompact accepts HomepageCardData, replace HOMEPAGE_PRODUCTS
 *       with cards and remove the registry import from this file
 * TODO: future analytics  — fire system_card_viewed impressions using cards data
 * TODO: future experiments — use cards[i].eventSource for A/B variant routing
 */

import type { HomepageCardData } from '@/lib/registry/adapters'
import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
import SystemGrid from '@/components/systems/SystemGrid/SystemGrid'

// =============================================================================
// PROPS
// =============================================================================

export interface HomepageSystemsGridProps {
  /**
   * Locale-resolved card data from homepage.adapter → getHomepageCards(locale).
   * Order matches HOMEPAGE_PRODUCTS — both are derived from the same source.
   * Used for adapter metadata today; will drive rendering in a future pass.
   */
  readonly cards: ReadonlyArray<HomepageCardData>
  /** Active locale — forwarded to SystemGrid for copy selection. */
  readonly locale: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * HomepageSystemsGrid — adapter-to-SystemGrid bridge.
 *
 * Accepts adapter output (HomepageCardData[]) and feeds the existing
 * card rendering system (SystemGrid → SystemCardCompact). No rendering
 * logic lives here — all card markup stays in the SystemCard family.
 *
 * @example
 * // In app/[locale]/page.tsx:
 * const cards = getHomepageCards(locale)
 * <HomepageSystemsGrid cards={cards} locale={locale} />
 */
export default function HomepageSystemsGrid({
  cards,
  locale,
}: HomepageSystemsGridProps) {

  // Guard: if the adapter returns no cards, render nothing.
  if (cards.length === 0) return null

  return (
    <SystemGrid
      products={HOMEPAGE_PRODUCTS}
      variant="compact"
      locale={locale}
      imageMode="heroCrop"
      source="homepage_compact"
    />
  )
}
