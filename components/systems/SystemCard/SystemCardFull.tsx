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
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
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
          background: 'var(--color-bg-section)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
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
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: '1.5rem 1.5rem 1.75rem' }}
      >
        {/* Status badge, only when showBadge and product is LIVE */}
        {showBadge && product.status === 'live' && (
          <span
            data-field="status-badge"
            aria-label="Live"
            style={{
              alignSelf: 'flex-start',
              fontFamily: 'var(--brand-font-sans)', fontSize: '10px', fontWeight: 700,
              color: 'var(--brand-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: '4px', padding: '3px 8px',
            }}
          >
            LIVE
          </span>
        )}

        {/* Category label */}
        <span
          data-field="category"
          style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {/* TODO: translate category label via next-intl */}
          {product.category}
        </span>

        {/* Product name */}
        <h3 className="h-card" data-field="name" style={{ margin: 0 }}>
          {product.name}
        </h3>

        {/* Subline */}
        <p data-field="subline" style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {subline}
        </p>

        {/* Bullets, BulletTuple guarantees exactly 3 (VG-09) */}
        <ul data-field="bullets" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {bullets.map((bullet, i) => (
            <li key={i} data-bullet-index={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              <span aria-hidden="true" style={{ color: product.brandColor, fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>✓</span>
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
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textDecoration: 'none', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}
          >
            {product.domain}
          </a>
        )}

        {/* CTA pair */}
        {showCTA && (
          <div data-field="cta-group" style={{ display: 'flex', gap: '8px', paddingTop: showDomain ? '4px' : '10px', ...(showDomain ? {} : { marginTop: 'auto', borderTop: '1px solid var(--color-border)' }) }}>
            <a
              href={product.bookDemoUrl}
              data-field="cta-primary"
              data-event-source={product.eventSource}
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
            >
              {primaryLabel}
            </a>
            <a
              href={product.bookDemoUrl}
              data-field="cta-secondary"
              data-event-source={product.eventSource}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
            >
              {secondaryLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
