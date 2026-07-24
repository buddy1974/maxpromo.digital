/**
 * components/systems/SystemCard/SystemCardFull.tsx
 *
 * Full card variant, systems page and products index.
 * Shows: thumbnail (card size), status badge (if live + showBadge),
 *        category label, product name, subline, 3 bullets,
 *        domain footer (if showDomain), primary + secondary CTA (if showCTA).
 *
 * This is the richest publicly visible variant. It maps directly to the
 * master card design reference in /public/images/systems/[slug]/card/.
 *
 * Consumer:
 *   app/[locale]/systems/page.tsx , PUBLIC_PRODUCTS grid, variant='full'
 *   app/[locale]/products/page.tsx, products index, variant='full'
 *   Rendered by SystemCard with variant='full'
 *
 * TODO: connect registry consumers
 * TODO: systems page integration (PUBLIC_PRODUCTS → variant='full')
 * TODO: add next/image for thumbnail
 * TODO: wire brandColor to accent bar and bullet icons
 */

import type { SystemCardProps } from './SystemCard'

// =============================================================================
// PROPS
// =============================================================================

export type SystemCardFullProps = Pick<
  SystemCardProps,
  'product' | 'locale' | 'showBadge' | 'showDomain' | 'showCTA'
>

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardFull, full-detail product card.
 *
 * The canonical public-facing card. Includes thumbnail, bullets,
 * domain, and CTA pair. Used on the systems page and products index.
 *
 * @example
 * <SystemCard product={p} variant="full" showBadge showDomain showCTA locale="de" />
 */
export function SystemCardFull({
  product,
  locale = 'de',
  showBadge = true,
  showDomain = true,
  showCTA = true,
}: SystemCardFullProps) {

  // ── Locale-aware content
  const subline = locale === 'de' && product.subline.de
    ? product.subline.de
    : product.subline.en

  const bullets = locale === 'de' && product.bullets.de
    ? product.bullets.de
    : product.bullets.en

  // ── CTA labels (governance rule Section 3)
  const primaryLabel = (() => {
    if (product.ctaPrimary) {
      return locale === 'de' && product.ctaPrimary.de
        ? product.ctaPrimary.de
        : product.ctaPrimary.en
    }
    if (locale === 'de') return product.ctaType === 'platform' ? 'Plattform erkunden →' : 'System ansehen →'
    return product.ctaType === 'platform' ? 'Explore platform →' : 'View system →'
  })()

  const secondaryLabel = (() => {
    if (product.ctaSecondary) {
      return locale === 'de' && product.ctaSecondary.de
        ? product.ctaSecondary.de
        : product.ctaSecondary.en
    }
    if (locale === 'de') return product.ctaType === 'platform' ? 'Fahrer werden →' : 'Kostenlosen Setup anfragen →'
    return product.ctaType === 'platform' ? 'Become a driver →' : 'Book free setup →'
  })()

  // ── Thumbnail src
  const cardSrc = locale === 'de' && product.media.card.de
    ? product.media.card.de
    : product.media.card.en

  return (
    <article
      data-slug={product.slug}
      data-variant="full"
      data-category={product.category}
      data-layout={product.layoutVariant}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {/*
        ── THUMBNAIL
        Design reference: /public/images/systems/[slug]/card/[slug]-[locale].png
        Layout variant (A/B/C) determines scene position, applied via CSS class in
        the visual implementation pass.

        TODO: replace with next/image
        TODO: apply data-src={cardSrc} → Image src once deployed
      */}
      <div
        data-section="thumbnail"
        data-src={cardSrc}
        data-layout={product.layoutVariant}
        style={{
          width: '100%',
          aspectRatio: '19 / 10',
          background: product.backgroundDark ? 'hsl(240 14% 4%)' : 'hsl(0 0% 97%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {/* Brand color accent bar, governance VG-02 */}
        <div
          data-section="brand-accent"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: product.brandColor,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── BODY */}
      <div
        data-section="body"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Status badge, only when showBadge and product is LIVE */}
        {showBadge && product.status === 'live' && (
          <span
            data-field="status-badge"
            aria-label="Live"
          >
            {/* TODO: style as orange LIVE badge */}
            LIVE
          </span>
        )}

        {/* Category label */}
        <span data-field="category">
          {/* TODO: translate category label via next-intl */}
          {product.category}
        </span>

        {/* Product name */}
        <h3 data-field="name" style={{ margin: 0 }}>
          {product.name}
        </h3>

        {/* Subline */}
        <p data-field="subline" style={{ margin: 0 }}>
          {subline}
        </p>

        {/* Bullets, BulletTuple guarantees exactly 3 (VG-09) */}
        <ul data-field="bullets" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bullets.map((bullet, i) => (
            <li key={i} data-bullet-index={i}>
              {/* TODO: style bullet icon with product.brandColor */}
              {bullet}
            </li>
          ))}
        </ul>

        {/* Domain footer, governance VG-12 */}
        {showDomain && (
          <a
            href={product.systemUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-field="domain"
            aria-label={`${product.name}, ${product.domain}`}
          >
            {/* TODO: style as small monospace grey text */}
            {product.domain}
          </a>
        )}

        {/* CTA pair */}
        {showCTA && (
          <div data-field="cta-group">
            <a
              href={product.bookDemoUrl}
              data-field="cta-primary"
              data-event-source={product.eventSource}
            >
              {/* TODO: style as #F97316 orange button (governance VG-03) */}
              {primaryLabel}
            </a>
            <a
              href={product.bookDemoUrl}
              data-field="cta-secondary"
              data-event-source={product.eventSource}
            >
              {/* TODO: style as ghost/border button */}
              {secondaryLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
