/**
 * lib/registry/adapters/utils.ts
 *
 * Shared utilities for all registry adapters.
 * Pure functions — no React, no JSX, no side effects.
 *
 * Every locale selection decision lives here.
 * Adapters call these helpers instead of repeating the same locale guard.
 */

import type {
  ProductEntry,
  LocalisedString,
  LocalisedBullets,
  LocalisedWorkflow,
  LocalisedAsset,
  BulletTuple,
  WorkflowTuple,
} from '@/lib/registry/types'

// =============================================================================
// LOCALE RESOLUTION
// =============================================================================

/**
 * Selects the correct locale variant from a localised field.
 * Falls back to `en` when the `de` variant is absent.
 *
 * @param field  A LocalisedString, LocalisedAsset, or any { en: T; de?: T } shape.
 * @param locale Active locale — 'de' | 'en' or any string (unknown locales fall back to en).
 */
export function pickLocale<T>(
  field: { readonly en: T; readonly de?: T },
  locale: string,
): T {
  if (locale === 'de' && field.de !== undefined) return field.de
  return field.en
}

/** Resolves a LocalisedString to a plain string for the given locale. */
export function resolveString(field: LocalisedString, locale: string): string {
  return pickLocale(field, locale)
}

/** Resolves LocalisedBullets to the correct BulletTuple for the given locale. */
export function resolveBullets(field: LocalisedBullets, locale: string): BulletTuple {
  return pickLocale(field, locale)
}

/** Resolves LocalisedWorkflow to the correct WorkflowTuple for the given locale. */
export function resolveWorkflow(field: LocalisedWorkflow, locale: string): WorkflowTuple {
  return pickLocale(field, locale)
}

/** Resolves a LocalisedAsset to the correct image path for the given locale. */
export function resolveAsset(field: LocalisedAsset, locale: string): string {
  return pickLocale(field, locale)
}

// =============================================================================
// MEDIA RESOLUTION
// =============================================================================

/** Returns the locale-appropriate card image path (always available). */
export function resolveCardImage(product: ProductEntry, locale: string): string {
  return resolveAsset(product.media.card, locale)
}

/**
 * Returns the locale-appropriate thumbnail image path, or null if the
 * thumb variant has not yet been deployed.
 * TODO: remove null return once all thumbs are deployed to /public/images/systems/
 */
export function resolveThumbImage(product: ProductEntry, locale: string): string | null {
  if (!product.media.thumb) return null
  return resolveAsset(product.media.thumb, locale)
}

// =============================================================================
// CTA LABEL RESOLUTION
// Governance rule Section 3 — standard / platform / personal-finance defaults.
// =============================================================================

/**
 * Resolves the primary CTA label for a product and locale.
 * Uses registry override (product.ctaPrimary) when present,
 * otherwise applies the ctaType default.
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
 * Demo URLs open in a new tab. Internal booking URLs do not.
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
