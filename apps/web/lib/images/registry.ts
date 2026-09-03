/**
 * lib/images/registry.ts
 *
 * Central source of truth for product image path resolution.
 *
 * Rules:
 *   — All image src values used by cards come from here.
 *   — Locale selection happens here, not in components.
 *   — Callers never construct paths by hand.
 *   — To add CDN prefixing or cloud storage, change this file only.
 *
 * TODO: future CDN — prefix resolved paths with NEXT_PUBLIC_CDN_URL
 * TODO: future cloud storage — swap path builder to return full https:// URLs
 * TODO: future locale-aware thumbs — add de variant to registry products when assets exist
 */

import type { ProductEntry } from '@/lib/registry/types'

// =============================================================================
// FALLBACK
// Used when a product has no valid image src (registry gap or future empty entry).
// =============================================================================

/** Signals that no image src is available — callers render a dark placeholder. */
export const IMAGE_FALLBACK = null

// =============================================================================
// CARD IMAGE (16:10 landscape hero crop)
// =============================================================================

/**
 * Resolve the card image src for a product.
 * Prefers the locale variant; falls back to EN if DE is absent.
 * Returns null if no card image exists at all (future-proof for partial registry).
 */
export function resolveCardSrc(
  product: ProductEntry,
  locale: string,
): string | null {
  const src = locale === 'de' && product.media.card.de
    ? product.media.card.de
    : product.media.card.en
  return src ?? IMAGE_FALLBACK
}

// =============================================================================
// THUMBNAIL (8:5 compact card)
// =============================================================================

/**
 * Resolve the thumbnail src for a compact card.
 * Prefers the thumb variant (if it exists for the locale); falls back to card image.
 * Returns null if neither exists.
 */
export function resolveThumbSrc(
  product: ProductEntry,
  locale: string,
): string | null {
  const deThumb = product.media.thumb?.de
  const enThumb = product.media.thumb?.en
  const thumb   = locale === 'de' && deThumb ? deThumb : enThumb
  return thumb ?? resolveCardSrc(product, locale)
}

// =============================================================================
// PUBLIC PATH HELPER
// All registry paths are relative (no leading slash).
// next/image requires a leading slash for local public/ files.
// =============================================================================

/**
 * Prefix a registry-relative path with / for use as an img/Image src.
 * No-op if the path is already absolute (starts with / or https://).
 */
export function toPublicSrc(path: string): string {
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `/${path}`
}
