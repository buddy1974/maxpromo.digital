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
  if (locale === 'de') {
    return product.ctaType === 'platform' ? 'Plattform erkunden →' : 'System ansehen →'
  }
  return product.ctaType === 'platform' ? 'Explore platform →' : 'View system →'
}

export function resolveSecondaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaSecondary) {
    return locale === 'de' && product.ctaSecondary.de
      ? product.ctaSecondary.de
      : product.ctaSecondary.en
  }
  if (locale === 'de') {
    return product.ctaType === 'platform' ? 'Fahrer werden →' : 'Kostenlosen Setup anfragen →'
  }
  return product.ctaType === 'platform' ? 'Become a driver →' : 'Book free setup →'
}
