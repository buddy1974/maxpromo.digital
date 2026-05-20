/**
 * components/systems/SystemCard/helpers/image.ts
 *
 * Card-level image utilities.
 * Image SOURCE resolution delegates to lib/images/registry.
 * Image CSS property mapping lives here (it's styling, not data).
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { ImageMode } from '../SystemCard'
import {
  resolveCardSrc as _resolveCardSrc,
  resolveThumbSrc as _resolveThumbSrc,
  toPublicSrc,
} from '@/lib/images/registry'

// Re-export with the card-ready signature — callers import from this file only.

/** Locale-aware card image src, prefixed for next/image. Null = show placeholder. */
export function resolveCardSrc(product: ProductEntry, locale: string): string | null {
  const path = _resolveCardSrc(product, locale)
  return path ? toPublicSrc(path) : null
}

/** Locale-aware thumbnail src (prefers thumb, falls back to card), prefixed. */
export function resolveThumbSrc(product: ProductEntry, locale: string): string | null {
  const path = _resolveThumbSrc(product, locale)
  return path ? toPublicSrc(path) : null
}

/**
 * Map imageMode to CSS objectFit + objectPosition values.
 * Keeps CSS property derivation out of component render.
 */
export function resolveImageStyle(imageMode: ImageMode): {
  objectFit: 'cover' | 'contain'
  objectPosition: string
} {
  return {
    objectFit:      imageMode === 'contain' ? 'contain' : 'cover',
    objectPosition: imageMode === 'heroCrop' ? 'top' : 'center',
  }
}
