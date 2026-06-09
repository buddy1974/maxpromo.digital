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
// FEATURED CARD
// =============================================================================

export function resolvePrimaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaPrimary) {
    return locale === 'de' && product.ctaPrimary.de
      ? product.ctaPrimary.de
      : product.ctaPrimary.en
  }
  // MVP hardening: primary CTA always routes to consultation, not external system.
  return locale === 'de' ? 'Beratung anfragen →' : 'Book consultation →'
}

export function resolveSecondaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaSecondary) {
    return locale === 'de' && product.ctaSecondary.de
      ? product.ctaSecondary.de
      : product.ctaSecondary.en
  }
  // MVP hardening: secondary CTA requests a walkthrough, not a free immediate setup.
  return locale === 'de' ? 'Walkthrough anfragen →' : 'Request walkthrough →'
}
