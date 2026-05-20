/**
 * components/systems/SystemCard/SystemCardCompact.tsx
 *
 * Compact card variant — thumbnail-first, minimal content.
 * Shows: thumbnail image, product name, 1-line subline, optional CTA.
 * Does NOT show: bullet list, HOW IT WORKS strip, domain footer.
 *
 * Which context uses this variant, and how many columns, is decided by
 * the consumer. This component has no opinion about where it is rendered.
 *
 * TODO: connect registry consumers
 * TODO: add next/image optimisation once image paths are confirmed deployed
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { SystemCardProps } from './SystemCard'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Controls how the thumbnail image fills its container.
 * Rendering behavior belongs to the consumer — pass the mode that matches
 * where this card is being placed.
 *
 * cover    → fill container, crop to fit (object-fit: cover)
 * contain  → fit entirely within container, letterbox if needed
 * heroCrop → show only the top portion of the landscape card image
 *            (reveals headline + photo section, hides workflow strip)
 */
export type ImageMode = 'cover' | 'contain' | 'heroCrop'

/** Props for the compact card variant. */
export interface SystemCardCompactProps
  extends Pick<SystemCardProps, 'product' | 'locale' | 'showCTA'> {
  /**
   * How the thumbnail image fills its container.
   * Defaults to 'cover'. Pass 'heroCrop' to reveal only the card's
   * headline and photography section.
   */
  readonly imageMode?: ImageMode
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardCompact — thumbnail-first mini card.
 *
 * Renders a compact product card with thumbnail, name, subline, and CTA.
 * The consumer decides the context, layout, and image mode.
 *
 * @example
 * // Via SystemCard router (preferred):
 * <SystemCard product={p} variant="compact" locale="de" />
 *
 * // Direct use with explicit image mode:
 * <SystemCardCompact product={p} locale="de" imageMode="heroCrop" showCTA />
 */
export function SystemCardCompact({
  product,
  locale = 'de',
  showCTA = true,
  imageMode = 'cover',
}: SystemCardCompactProps) {

  // ── Locale-aware content
  const subline = locale === 'de' && product.subline.de
    ? product.subline.de
    : product.subline.en

  // ── CTA href — links to internal product page
  // TODO: update to product.systemUrl once product domains are live
  const ctaHref = product.landingUrl

  // ── Thumbnail src — prefer thumb variant, fall back to card
  // TODO: add locale-aware src (product.media.thumb?.de when locale==='de' && de exists)
  const thumbSrc = product.media.thumb?.en ?? product.media.card.en

  return (
    <article
      data-slug={product.slug}
      data-variant="compact"
      data-image-mode={imageMode}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {/*
        ── THUMBNAIL
        imageMode controls object-fit behavior:
          cover    → fill, crop   → { objectFit: 'cover' }
          contain  → fit, no crop → { objectFit: 'contain' }
          heroCrop → show top     → { objectFit: 'cover', objectPosition: 'top' }

        TODO: replace div with next/image
        TODO: use thumbSrc once /public/images/systems/[slug]/thumb/ is deployed
        TODO: set objectFit and objectPosition from imageMode
      */}
      <div
        data-section="thumbnail"
        data-src={thumbSrc}
        style={{
          width: '100%',
          aspectRatio: '8 / 5',
          background: 'hsl(240 12% 7%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      />

      {/* ── BODY */}
      <div
        data-section="body"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <h3 data-field="name" style={{ margin: 0 }}>
          {product.name}
        </h3>

        <p data-field="subline" style={{ margin: 0 }}>
          {subline}
        </p>

        {showCTA && (
          <a
            href={ctaHref}
            data-field="cta"
            data-event-source={product.eventSource}
            aria-label={`${product.name} — ${locale === 'de' ? 'System ansehen' : 'View system'}`}
          >
            {/* TODO: translate via next-intl or registry ctaPrimary override */}
            {locale === 'de' ? 'System ansehen →' : 'View system →'}
          </a>
        )}
      </div>
    </article>
  )
}
