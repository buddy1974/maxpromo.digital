/**
 * components/systems/SystemCard/SystemCardFeatured.tsx
 *
 * Featured card variant — used in featured sections and editorial highlights.
 * Shows: thumbnail (card size), status badge (if live), product name, headline,
 *        3 bullets, domain footer (optional), primary + secondary CTA (optional).
 *
 * Richer than Compact, leaner than Full (no HOW IT WORKS strip).
 * Intended for: homepage featured block if ever reintroduced, campaign pages,
 * seasonal highlights, landing page embeds.
 *
 * Consumer:
 *   Rendered by SystemCard with variant='featured'
 *   Rendered by SystemGrid with variant='featured'
 *
 * TODO: connect registry consumers
 * TODO: add next/image for thumbnail rendering
 * TODO: wire brand color accent to headline word highlighting
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { SystemCardProps } from './SystemCard'

// =============================================================================
// FEATURED-SPECIFIC PROPS
// =============================================================================

export interface SystemCardFeaturedProps
  extends Pick<
    SystemCardProps,
    'product' | 'locale' | 'showBadge' | 'showDomain' | 'showCTA'
  > {}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardFeatured — rich editorial card.
 *
 * Shows the product name, headline, 3 governance-enforced bullets,
 * and optional status badge, domain label, and CTA pair.
 *
 * Bullets are locale-aware and must match the BulletTuple (exactly 3).
 * The tuple is enforced at compile time in the registry.
 *
 * @example
 * <SystemCard product={p} variant="featured" locale="de" showBadge showDomain showCTA />
 */
export function SystemCardFeatured({
  product,
  locale = 'de',
  showBadge = true,
  showDomain = true,
  showCTA = true,
}: SystemCardFeaturedProps) {

  // ── Locale-aware content helpers
  const headline = locale === 'de' && product.headline.de
    ? product.headline.de
    : product.headline.en

  const subline = locale === 'de' && product.subline.de
    ? product.subline.de
    : product.subline.en

  // Bullets are a BulletTuple — readonly [string, string, string]
  // TypeScript guarantees exactly 3 items; no runtime length check needed.
  const bullets = locale === 'de' && product.bullets.de
    ? product.bullets.de
    : product.bullets.en

  // ── CTA labels — use registry override if set, otherwise use ctaType default
  const primaryLabel = (() => {
    if (product.ctaPrimary) {
      return locale === 'de' && product.ctaPrimary.de
        ? product.ctaPrimary.de
        : product.ctaPrimary.en
    }
    // Default labels per ctaType (governance rule Section 3)
    if (locale === 'de') {
      return product.ctaType === 'platform' ? 'Plattform erkunden →' : 'System ansehen →'
    }
    return product.ctaType === 'platform' ? 'Explore platform →' : 'View system →'
  })()

  const secondaryLabel = (() => {
    if (product.ctaSecondary) {
      return locale === 'de' && product.ctaSecondary.de
        ? product.ctaSecondary.de
        : product.ctaSecondary.en
    }
    if (locale === 'de') {
      return product.ctaType === 'platform' ? 'Fahrer werden →' : 'Kostenlosen Setup anfragen →'
    }
    return product.ctaType === 'platform' ? 'Become a driver →' : 'Book free setup →'
  })()

  return (
    <article
      data-slug={product.slug}
      data-variant="featured"
      data-category={product.category}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {/*
        ── THUMBNAIL (card size — full landscape image)
        TODO: replace with next/image
        TODO: locale-aware: use product.media.card.de when locale === 'de' && de exists
        TODO: apply brandColor as an accent overlay or border-top strip
        Governance: layout A = human RIGHT, layout B = scene LEFT (see VG-07)
      */}
      <div
        data-section="thumbnail"
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
        {/* TODO: <Image src={product.media.card.en} alt={product.name} fill /> */}

        {/* Brand color accent bar — top of card (governance VG-02) */}
        <div
          data-section="brand-accent"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
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
        {/* Status badge — only rendered when showBadge and product is live */}
        {showBadge && product.status === 'live' && (
          <span data-field="status-badge" aria-label="Live">
            {/* TODO: style with LIVE badge (orange, uppercase, monospace) */}
            LIVE
          </span>
        )}

        {/* Category label */}
        <span data-field="category">
          {/* TODO: translate category label */}
          {product.category}
        </span>

        {/* Product name */}
        <h3 data-field="name" style={{ margin: 0 }}>
          {product.name}
        </h3>

        {/* Headline — locale-aware */}
        <p data-field="headline" style={{ margin: 0 }}>
          {/*
            TODO: highlight the accent word using product.brandColor
            The exact word is determined by brand guidelines — not in registry yet.
          */}
          {headline}
        </p>

        {/* Subline — locale-aware */}
        <p data-field="subline" style={{ margin: 0 }}>
          {subline}
        </p>

        {/* Bullets — BulletTuple guarantees exactly 3 (VG-09) */}
        <ul data-field="bullets" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bullets.map((bullet, i) => (
            <li key={i} data-bullet-index={i}>
              {/* TODO: style bullet icon with product.brandColor */}
              {bullet}
            </li>
          ))}
        </ul>

        {/* Domain footer — only rendered when showDomain is true */}
        {showDomain && (
          <a
            href={product.systemUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-field="domain"
            aria-label={`${product.name} — ${product.domain}`}
          >
            {/* TODO: style as small monospace grey text (bottom of card, VG-12) */}
            {product.domain}
          </a>
        )}

        {/* CTA pair — only rendered when showCTA is true */}
        {showCTA && (
          <div data-field="cta-group">
            {/* Primary CTA — links to demo URL or system URL */}
            <a
              href={product.demoUrl ?? product.systemUrl}
              target={product.demoUrl ? '_blank' : undefined}
              rel={product.demoUrl ? 'noopener noreferrer' : undefined}
              data-field="cta-primary"
              data-event-source={product.eventSource}
              aria-label={primaryLabel}
            >
              {/* TODO: style as orange button (#F97316) — governance VG-03 */}
              {primaryLabel}
            </a>

            {/* Secondary CTA — links to booking/contact */}
            <a
              href={product.bookDemoUrl}
              data-field="cta-secondary"
              data-event-source={product.eventSource}
              aria-label={secondaryLabel}
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
