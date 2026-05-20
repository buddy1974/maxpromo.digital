/**
 * components/systems/SystemCard/helpers/image.ts
 *
 * Image source resolution and CSS property mapping for card variants.
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { ImageMode } from '../SystemCard'

/**
 * Resolve the thumbnail src for a compact card.
 * Prefers thumb variant; falls back to card image.
 * Currently locale-agnostic (thumb only has en variant in registry v1.1).
 */
export function resolveThumbSrc(product: ProductEntry): string {
  return product.media.thumb?.en ?? product.media.card.en
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
