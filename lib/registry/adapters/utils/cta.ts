/**
 * lib/registry/adapters/utils/cta.ts
 *
 * CTA label and href resolution helpers.
 * Applies governance rule Section 3 defaults by ctaType,
 * falling back to registry overrides when present.
 * All functions are pure — no side effects, no React, no JSX.
 */

import type { ProductEntry } from '@/lib/registry/types'
import { resolveString } from './locale'

/**
 * Resolves the primary CTA label for a product and locale.
 * Uses registry override (product.ctaPrimary) when present,
 * otherwise applies the ctaType default.
 *
 * Governance rule Section 3:
 *   standard         → "System ansehen →" / "View system →"
 *   platform         → "Plattform erkunden →" / "Explore platform →"
 *   personal-finance → "System ansehen →" / "View system →"
 */
export function resolvePrimaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaPrimary) {
    return resolveString(product.ctaPrimary, locale)
  }
  if (locale === 'de') {
    switch (product.ctaType) {
      case 'platform':         return 'Plattform erkunden →'
      case 'personal-finance': return 'System ansehen →'
      default:                 return 'System ansehen →'
    }
  }
  switch (product.ctaType) {
    case 'platform':         return 'Explore platform →'
    case 'personal-finance': return 'View system →'
    default:                 return 'View system →'
  }
}

/**
 * Resolves the secondary CTA label for a product and locale.
 * Uses registry override (product.ctaSecondary) when present,
 * otherwise applies the ctaType default.
 *
 * Governance rule Section 3:
 *   standard         → "Kostenlosen Setup anfragen →" / "Book free setup →"
 *   platform         → "Fahrer werden →" / "Become a driver →"
 *   personal-finance → "Kostenlosen Setup anfragen →" / "Book free setup →"
 */
export function resolveSecondaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaSecondary) {
    return resolveString(product.ctaSecondary, locale)
  }
  if (locale === 'de') {
    switch (product.ctaType) {
      case 'platform':         return 'Fahrer werden →'
      case 'personal-finance': return 'Kostenlosen Setup anfragen →'
      default:                 return 'Kostenlosen Setup anfragen →'
    }
  }
  switch (product.ctaType) {
    case 'platform':         return 'Become a driver →'
    case 'personal-finance': return 'Book free setup →'
    default:                 return 'Book free setup →'
  }
}

/**
 * Resolves the primary CTA href and whether it should open in a new tab.
 * Demo URLs open in a new tab. System URLs open in a new tab.
 * Internal booking URLs (/contact?system=...) do not.
 */
export function resolvePrimaryHref(product: ProductEntry): {
  href: string
  opensNewTab: boolean
} {
  if (product.demoUrl) {
    return { href: product.demoUrl, opensNewTab: true }
  }
  return { href: product.systemUrl, opensNewTab: true }
}
