/**
 * lib/registry/adapters/utils/assets.ts
 *
 * Media and image asset resolution helpers.
 * Resolves locale-aware image paths from ProductEntry.media.
 * All functions are pure — no side effects, no React, no JSX.
 */

import type { LocalisedAsset, ProductEntry } from '@/lib/registry/types'
import { pickLocale } from './locale'

/** Resolves a LocalisedAsset to the correct image path for the given locale. */
export function resolveAsset(field: LocalisedAsset, locale: string): string {
  return pickLocale(field, locale)
}

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
