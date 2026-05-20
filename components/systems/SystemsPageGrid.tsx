/**
 * components/systems/SystemsPageGrid.tsx
 *
 * Adapter bridge — connects the systems page adapter to the card rendering system.
 * Mirrors HomepageSystemsGrid exactly: accepts adapter output, imports registry
 * internally, delegates all rendering to SystemGrid → SystemCard.
 *
 * Architecture:
 *
 *   app/[locale]/systems/page.tsx
 *     → getSystemsCards(locale)          ← adapter (no registry access in page)
 *     → SystemsCardData[]
 *     → <SystemsPageGrid>                ← this file
 *         → SystemGrid                   ← existing card rendering system
 *           → SystemCard (full)
 *             → SystemCardFull
 *
 * Accepted tech debt (same as HomepageSystemsGrid):
 *   SystemGrid expects ProductEntry[]. SystemsCardData[] is the adapter output.
 *   SYSTEMS_PAGE_PRODUCTS drives rendering today; cards holds adapter metadata.
 *   When SystemCardFull accepts SystemsCardData, remove SYSTEMS_PAGE_PRODUCTS.
 *
 * TODO: when SystemCardFull accepts SystemsCardData, replace SYSTEMS_PAGE_PRODUCTS
 *       with cards and remove the registry import from this file
 */

import type { SystemsCardData } from '@/lib/registry/adapters'
import { SYSTEMS_PAGE_PRODUCTS } from '@/lib/registry/products'
import SystemGrid from '@/components/systems/SystemGrid/SystemGrid'

// =============================================================================
// PROPS
// =============================================================================

export interface SystemsPageGridProps {
  /**
   * Locale-resolved card data from systems.adapter → getSystemsCards(locale).
   * Order matches SYSTEMS_PAGE_PRODUCTS — both derived from the same source.
   * Used for adapter metadata today; will drive rendering in a future pass.
   */
  readonly cards: ReadonlyArray<SystemsCardData>
  /** Active locale — forwarded to SystemGrid for copy selection. */
  readonly locale: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SystemsPageGrid({
  cards,
  locale,
}: SystemsPageGridProps) {

  if (cards.length === 0) return null

  return (
    <SystemGrid
      products={SYSTEMS_PAGE_PRODUCTS}
      variant="featured"
      columns={2}
      locale={locale}
    />
  )
}
