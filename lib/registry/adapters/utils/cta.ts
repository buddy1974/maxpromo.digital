/**
 * lib/registry/adapters/utils/cta.ts
 *
 * CTA label and href resolution helpers.
 * Applies governance rule Section 3 defaults by ctaType,
 * falling back to registry overrides when present.
 * All functions are pure — no side effects, no React, no JSX.
 */

import type { ProductEntry, DemoAccess } from '@/lib/registry/types'
import { resolveString } from './locale'

/**
 * Canonical primary-CTA label for a given `demoAccess` state. Added
 * 2026-07-25 (RestaurantOS correction) — this is now the ONE place that
 * maps demo access to CTA copy, replacing ad hoc per-product wording that
 * was previously inferred from `hasDemoLogin` (an indirect, unverified
 * signal — see the `DemoAccess` type doc comment in types.ts). Every
 * registry entry's `finalPrimaryLabel` for a demo-driven CTA should match
 * what this function returns for its declared `demoAccess`, so the two
 * never drift apart.
 *
 *   public → "System testen" / "Try the system"        (anonymous self-serve demo)
 *   guided → "Demo anfragen" / "Request a demo"         (access via guided review)
 *   none   → "Beratung anfragen" / "Request a consultation" (no usable demo)
 */
export function resolveDemoAccessLabel(demoAccess: DemoAccess, locale: string): string {
  const isDE = locale === 'de'
  switch (demoAccess) {
    case 'public': return isDE ? 'System testen →'      : 'Try the system →'
    case 'guided': return isDE ? 'Demo anfragen →'       : 'Request a demo →'
    case 'none':   return isDE ? 'Beratung anfragen →'   : 'Request a consultation →'
  }
}

/**
 * Resolves the primary CTA label for a product and locale.
 * Uses registry override (product.ctaPrimary) when present, then the
 * explicit `demoAccess` mapping above when set, otherwise falls back to
 * the ctaType default (unchanged behaviour for every entry that hasn't
 * set `demoAccess` yet).
 *
 * Governance rule Section 3, corrected 2026-07-25: this resolver feeds
 * BOTH the Maxpromo hub cards (via a different, hub-specific helper in
 * components/systems/SystemCard/helpers/cta.ts) AND LandingData.ctaPrimary
 * for the external showcase domains (via landing.adapter.ts). "System
 * ansehen →" / "View system →" is correct on the hub (you're choosing
 * which system to view) but is explicitly banned on a showcase domain —
 * the visitor is already ON the product's website, so "view system"
 * promises nothing new. Defaults changed to the approved external-site
 * action-CTA vocabulary (request the next real step, not "look at this").
 *   standard         → "Demo anfragen →" / "Request a demo →"
 *   platform         → "Plattform erkunden →" / "Explore platform →"
 *   personal-finance → "Demo anfragen →" / "Request a demo →"
 *
 * demoAccess correction, 2026-07-25: for `standard`/`personal-finance`
 * products this ctaType default happens to already equal the `guided`
 * demoAccess label — this branch only changes behaviour once a product
 * sets `demoAccess: 'public'` or `'none'`, where the wording genuinely
 * needs to differ from the generic "Demo anfragen" default.
 */
export function resolvePrimaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaPrimary) {
    return resolveString(product.ctaPrimary, locale)
  }
  if (product.demoAccess) {
    return resolveDemoAccessLabel(product.demoAccess, locale)
  }
  if (locale === 'de') {
    switch (product.ctaType) {
      case 'platform':         return 'Plattform erkunden →'
      case 'personal-finance': return 'Demo anfragen →'
      default:                 return 'Demo anfragen →'
    }
  }
  switch (product.ctaType) {
    case 'platform':         return 'Explore platform →'
    case 'personal-finance': return 'Request a demo →'
    default:                 return 'Request a demo →'
  }
}

/**
 * Resolves the secondary CTA label for a product and locale.
 * Uses registry override (product.ctaSecondary) when present,
 * otherwise applies the ctaType default.
 *
 * Corrected 2026-07-25, same reasoning as resolvePrimaryLabel — "Book
 * free setup" overpromises (pricing/setup terms aren't public) and reads
 * oddly as a secondary action. Paired action from the approved showcase
 * vocabulary instead.
 *   standard         → "Beratung buchen →" / "Book a consultation →"
 *   platform         → "Fahrer werden →" / "Become a driver →"
 *   personal-finance → "Beratung buchen →" / "Book a consultation →"
 */
export function resolveSecondaryLabel(product: ProductEntry, locale: string): string {
  if (product.ctaSecondary) {
    return resolveString(product.ctaSecondary, locale)
  }
  if (locale === 'de') {
    switch (product.ctaType) {
      case 'platform':         return 'Fahrer werden →'
      case 'personal-finance': return 'Beratung buchen →'
      default:                 return 'Beratung buchen →'
    }
  }
  switch (product.ctaType) {
    case 'platform':         return 'Become a driver →'
    case 'personal-finance': return 'Book a consultation →'
    default:                 return 'Book a consultation →'
  }
}

/**
 * Resolves the primary CTA href for hub product cards.
 * Always resolves to the product domain (systemUrl) — never the demo app.
 * Hub cards are entry points to the product domain, not the demo infrastructure.
 */
export function resolvePrimaryHref(product: ProductEntry): {
  href: string
  opensNewTab: boolean
} {
  return { href: product.systemUrl, opensNewTab: true }
}
