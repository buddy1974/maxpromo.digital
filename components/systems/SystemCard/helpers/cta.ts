/**
 * components/systems/SystemCard/helpers/cta.ts
 *
 * CTA label resolution for card variants.
 * Derives locale-aware button labels from registry fields and ctaType.
 */

import type { ProductEntry } from '@/lib/registry/types'

// =============================================================================
// COMPACT CARD
// =============================================================================

export function resolveCompactCTALabel(locale: string): string {
  return locale === 'de' ? 'Ansehen →' : 'View →'
}

export function resolveCompactAriaLabel(productName: string, locale: string): string {
  return `${productName} — ${locale === 'de' ? 'System ansehen' : 'View system'}`
}

// =============================================================================
// ROUTING, single source of truth for the "hub card → dedicated system page
// first" rule. Every public entry point (systems overview, products overview,
// homepage, footer, related-system links, etc.) must resolve its main click
// target through this helper — never straight to bookDemoUrl or an external
// systemUrl. Only the dedicated /systems/[slug] page itself may expose those.
// =============================================================================

/**
 * Locale-safe internal href for a product's dedicated system/product page.
 * `landingUrl` is stored locale-less in the registry (e.g. '/systems/taxkontrol');
 * this prefixes the active locale so a raw <a> (TrackableLink is not locale-aware
 * by design, see its own doc comment) always resolves correctly regardless of
 * which locale the visitor is currently on.
 */
export function resolveSystemHref(landingUrl: string, locale: string): string {
  return `/${locale}${landingUrl}`
}

// =============================================================================
// FEATURED CARD
// =============================================================================

export function resolvePrimaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaPrimary) {
    return locale === 'de' && product.ctaPrimary.de
      ? product.ctaPrimary.de
      : product.ctaPrimary.en
  }
  // Routing correction 2026-07-25: hub cards now link to the dedicated system
  // page (see resolveSystemHref), not straight to consultation, so the label
  // must promise "view the system", matching what it actually does.
  return locale === 'de' ? 'System ansehen →' : 'View system →'
}

export function resolveSecondaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaSecondary) {
    return locale === 'de' && product.ctaSecondary.de
      ? product.ctaSecondary.de
      : product.ctaSecondary.en
  }
  // Routing correction 2026-07-25: same destination as primary (the dedicated
  // page), so the label reads as a complementary nudge rather than a
  // duplicate promise, not a booking/consultation claim it can no longer keep.
  return locale === 'de' ? 'Mehr erfahren →' : 'Learn more →'
}
