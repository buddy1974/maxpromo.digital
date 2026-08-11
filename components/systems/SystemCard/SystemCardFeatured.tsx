/**
 * components/systems/SystemCard/SystemCardFeatured.tsx
 *
 * Featured card variant, premium catalog-style.
 *
 * Design target: SaaS marketplace / Apple product catalog.
 * NOT a mini landing page, tight, scannable, action-oriented.
 *
 * Layout:
 *   ┌────────────────────────────┐
 *   │ [brand accent 2px]         │
 *   │ [image 5:2, compact]      │
 *   │ [LIVE badge if live]       │
 *   ├────────────────────────────┤
 *   │ Product Name               │
 *   │ Short tagline              │
 *   │ ✓ Outcome 1                │
 *   │ ✓ Outcome 2                │
 *   │ ✓ Outcome 3                │
 *   │─────────────────────────── │
 *   │ [View System] [Book Consult]│
 *   └────────────────────────────┘
 *
 * Used on: systems page (3-col grid), products page (3-col grid)
 * Server component. Client boundary isolated to TrackableLink.
 */

import Image from 'next/image'
import type { SystemCardProps } from './SystemCard'
import { resolvePrimaryLabel, resolveSecondaryLabel, resolveSystemHref } from './helpers/cta'
import { TrackableLink } from '@/components/systems/interactions/TrackableLink'
import { CTA_PRIMARY_CLICKED, CTA_SECONDARY_CLICKED, CARD_CLICKED } from '@/lib/analytics/events'
import { resolveCardSrc } from './helpers/image'

// =============================================================================
// TYPES
// =============================================================================

export interface SystemCardFeaturedProps
  extends Pick<
    SystemCardProps,
    'product' | 'locale' | 'showBadge' | 'showDomain' | 'showCTA'
  > {
  readonly source?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SystemCardFeatured({
  product,
  locale = 'de',
  showBadge = true,
  showCTA = true,
  source,
}: SystemCardFeaturedProps) {

  const headline = locale === 'de' && product.headline.de
    ? product.headline.de
    : product.headline.en

  const bullets = locale === 'de' && product.bullets.de
    ? product.bullets.de
    : product.bullets.en

  const cardSrc       = resolveCardSrc(product, locale)
  const primaryLabel  = resolvePrimaryLabel(product, locale)
  const secondaryLabel = resolveSecondaryLabel(product, locale)
  const eventSource   = source ?? product.eventSource
  // Routing correction 2026-07-25: hub cards (systems overview, products
  // overview) are entry points, not the dedicated page — every link on this
  // card must land on the dedicated /systems/[slug] (or /products/[slug])
  // page first. bookDemoUrl (/contact?system=...) is reserved for that
  // dedicated page's own secondary CTA, never for a hub-card click target.
  const systemHref    = resolveSystemHref(product.landingUrl, locale)

  return (
    <article
      data-slug={product.slug}
      data-variant="featured"
      data-category={product.category}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-elevated)]"
    >

      {/* ── BRAND ACCENT BAR */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{ background: product.brandColor }}
        aria-hidden="true"
      />

      {/* ── IMAGE, 5:2 compact banner */}
      <div
        className="relative w-full overflow-hidden flex-shrink-0"
        style={{ aspectRatio: '5 / 2' }}
      >
        {cardSrc ? (
          <Image
            src={cardSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--color-bg-section)]" />
        )}

        {/* Overlay click tracker, routes to the dedicated system page, not contact */}
        <TrackableLink
          href={systemHref}
          event={{ type: CARD_CLICKED, slug: product.slug, source: eventSource, locale }}
          className="absolute inset-0 z-[1]"
          overlay
        />

        {/* Live badge */}
        {showBadge && product.status === 'live' && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-primary)]/25 z-10 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
            <span className="font-mono text-[10px] text-[var(--color-primary)] tracking-widest uppercase font-bold">Live</span>
          </div>
        )}
      </div>

      {/* ── BODY */}
      <div className="flex flex-col flex-1 px-5 pt-5 pb-5 gap-3">

        {/* Product name */}
        <h3 className="m-0 text-[18px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)]">
          <TrackableLink
            href={systemHref}
            event={{ type: CARD_CLICKED, slug: product.slug, source: eventSource, locale }}
            className="text-inherit no-underline hover:text-[var(--color-primary)] transition-colors duration-150"
          >
            {product.name}
          </TrackableLink>
        </h3>

        {/* Tagline */}
        <p className="m-0 font-mono text-[13px] text-[var(--color-text-secondary)] leading-snug">
          {headline}
        </p>

        {/* Key outcomes, max 3, guaranteed by BulletTuple */}
        <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="font-mono text-[11px] font-bold mt-0.5 flex-shrink-0 leading-none"
                style={{ color: product.brandColor }}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className="font-sans text-[13px] text-[var(--color-text-secondary)] leading-snug">
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        {/* ── CTA pair */}
        {showCTA && (
          <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--color-border)]">
            {/* Primary, View system (routes to the dedicated system page) */}
            <TrackableLink
              href={systemHref}
              event={{ type: CTA_PRIMARY_CLICKED, slug: product.slug, source: eventSource, locale, ctaLabel: primaryLabel }}
              aria-label={primaryLabel}
              className="flex-1 text-center font-mono text-[11px] font-bold uppercase tracking-widest bg-[var(--color-primary)] text-white rounded-[6px] px-3 py-2.5 hover:bg-[var(--color-primary-hover)] transition-colors leading-none"
            >
              {primaryLabel}
            </TrackableLink>

            {/* Secondary, Learn more (same dedicated page — that page carries
                its own Primary(external)/Secondary(contact) CTA pair) */}
            <TrackableLink
              href={systemHref}
              event={{ type: CTA_SECONDARY_CLICKED, slug: product.slug, source: eventSource, locale, ctaLabel: secondaryLabel }}
              aria-label={secondaryLabel}
              className="flex-1 text-center font-mono text-[11px] uppercase tracking-widest border border-[var(--color-border)] rounded-[6px] text-[var(--color-text-primary)] px-3 py-2.5 hover:border-[var(--color-text-secondary)] transition-colors leading-none"
            >
              {secondaryLabel}
            </TrackableLink>
          </div>
        )}
      </div>
    </article>
  )
}
