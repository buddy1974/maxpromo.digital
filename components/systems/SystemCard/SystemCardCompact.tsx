/**
 * components/systems/SystemCard/SystemCardCompact.tsx
 *
 * Compact card variant — used in the homepage HOMEPAGE_PRODUCTS grid.
 * Shows: thumbnail image (Size 3 crop), product name, 1-line subline, CTA.
 * Does NOT show: bullet list, HOW IT WORKS strip, domain footer.
 *
 * Governance: this component renders the top ~40% of the master card image.
 * The full landscape card (1200×630) is visible on the systems page (full variant).
 * Here only the hero portion is shown.
 *
 * Consumer:
 *   app/[locale]/page.tsx — HOMEPAGE_PRODUCTS grid
 *   Rendered by SystemGrid with variant='compact'
 *
 * TODO: connect registry consumers
 * TODO: homepage integration (import HOMEPAGE_PRODUCTS from registry)
 * TODO: add next/image optimisation once image paths are confirmed deployed
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { SystemCardProps } from './SystemCard'

// =============================================================================
// COMPACT-SPECIFIC PROPS
// Subset of SystemCardProps — compact variant only uses what it needs.
// =============================================================================

export interface SystemCardCompactProps
  extends Pick<SystemCardProps, 'product' | 'locale' | 'showCTA'> {}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardCompact — homepage mini card.
 *
 * Renders a thumbnail-first card with product name, one-line subline,
 * and a single CTA link. No bullet list. No workflow. No status badge.
 *
 * @example
 * // Rendered by SystemCard router:
 * <SystemCard product={p} variant="compact" locale="de" />
 *
 * // Or directly (prefer routing through SystemCard):
 * <SystemCardCompact product={p} locale="de" showCTA />
 */
export function SystemCardCompact({
  product,
  locale = 'de',
  showCTA = true,
}: SystemCardCompactProps) {

  // ── Locale-aware content helpers
  const headline = locale === 'de' && product.headline.de
    ? product.headline.de
    : product.headline.en

  const subline = locale === 'de' && product.subline.de
    ? product.subline.de
    : product.subline.en

  // ── CTA href — always links to the internal product landing page
  // TODO: update to use product.systemUrl (branded domain) once domains are live
  const ctaHref = product.landingUrl

  return (
    <article
      data-slug={product.slug}
      data-variant="compact"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/*
        ── THUMBNAIL
        TODO: replace with next/image once /public/images/systems/[slug]/thumb/ exists
        TODO: add locale-aware src (thumb.de when locale === 'de' && thumb.de exists)
        Size target: 480×300 (Size 3 — top half of master card)
      */}
      <div
        data-section="thumbnail"
        style={{
          width: '100%',
          aspectRatio: '8 / 5',
          background: 'hsl(240 12% 7%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {/* TODO: <Image src={product.media.thumb?.en ?? product.media.card.en} ... /> */}
      </div>

      {/*
        ── BODY — product name, subline, CTA
      */}
      <div
        data-section="body"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Product name */}
        <h3 data-field="name" style={{ margin: 0 }}>
          {product.name}
        </h3>

        {/* Locale-aware subline */}
        <p data-field="subline" style={{ margin: 0 }}>
          {subline}
        </p>

        {/* CTA — only rendered when showCTA is true */}
        {showCTA && (
          <a
            href={ctaHref}
            data-field="cta"
            data-event-source={product.eventSource}
            aria-label={`${product.name} — ${locale === 'de' ? 'System ansehen' : 'View system'}`}
          >
            {/* TODO: translate CTA label via next-intl or registry ctaPrimary */}
            {locale === 'de' ? 'System ansehen →' : 'View system →'}
          </a>
        )}
      </div>

      {/*
        ── DOMAIN LABEL (compact variant always hides domain)
        Domain is visible on the full variant only.
      */}
    </article>
  )
}
