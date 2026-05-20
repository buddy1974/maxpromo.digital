/**
 * components/systems/SystemCard/SystemCardFeatured.tsx
 *
 * Featured card variant — large image, category badge, headline,
 * 3-bullet list, domain, primary + secondary CTA.
 *
 * Used on: systems page (2-col grid), products page (2-col grid)
 */

import Image from 'next/image'
import type { SystemCardProps } from './SystemCard'
import { resolvePrimaryLabel, resolveSecondaryLabel } from './helpers/cta'
import { resolveCategoryLabel } from './helpers/category'

// =============================================================================
// TYPES
// =============================================================================

export interface SystemCardFeaturedProps
  extends Pick<
    SystemCardProps,
    'product' | 'locale' | 'showBadge' | 'showDomain' | 'showCTA'
  > {}

// =============================================================================
// COMPONENT
// =============================================================================

export function SystemCardFeatured({
  product,
  locale = 'de',
  showBadge = true,
  showDomain = true,
  showCTA = true,
}: SystemCardFeaturedProps) {

  const headline = locale === 'de' && product.headline.de
    ? product.headline.de
    : product.headline.en

  const bullets = locale === 'de' && product.bullets.de
    ? product.bullets.de
    : product.bullets.en

  const cardSrc = locale === 'de' && product.media.card.de
    ? product.media.card.de
    : product.media.card.en

  const primaryLabel   = resolvePrimaryLabel(product, locale)
  const secondaryLabel = resolveSecondaryLabel(product, locale)
  const categoryLabel  = resolveCategoryLabel(product.category, locale)

  return (
    <article
      data-slug={product.slug}
      data-variant="featured"
      data-category={product.category}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] bg-[hsl(240_12%_7%)] transition-shadow duration-300 hover:shadow-[0_12px_48px_-8px_rgba(0,0,0,0.8)]"
    >
      {/* Brand accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{ background: product.brandColor }}
        aria-hidden="true"
      />

      {/* ── IMAGE */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '19 / 10' }}
        aria-hidden="true"
      >
        {cardSrc ? (
          <Image
            src={`/${cardSrc}`}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[hsl(240_14%_4%)]" />
        )}

        {/* Bottom gradient to body */}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240_12%_7%)] via-transparent to-transparent opacity-50 pointer-events-none" />

        {/* Live badge */}
        {showBadge && product.status === 'live' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080808]/80 backdrop-blur-sm border border-[#F97316]/25 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
            <span className="font-mono text-[9px] text-[#F97316] tracking-widest uppercase font-bold">Live</span>
          </div>
        )}
      </div>

      {/* ── BODY */}
      <div className="flex flex-col flex-1 px-6 pt-5 pb-6 gap-4">

        {/* Category badge */}
        <span className="self-start font-mono text-[10px] text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/20 px-2.5 py-1 rounded tracking-widest uppercase">
          {categoryLabel}
        </span>

        {/* Name + headline */}
        <div className="space-y-1.5">
          <h3 className="m-0 text-xl font-bold leading-tight tracking-tight text-[hsl(40_30%_96%)]">
            {product.name}
          </h3>
          <p className="m-0 font-mono text-[13px] text-[hsl(40_12%_65%)] leading-relaxed">
            {headline}
          </p>
        </div>

        {/* Bullets — BulletTuple guarantees exactly 3 */}
        <ul className="list-none p-0 m-0 space-y-2">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="font-mono text-[11px] font-bold mt-0.5 flex-shrink-0"
                style={{ color: product.brandColor }}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className="font-mono text-[13px] text-[hsl(40_12%_65%)] leading-snug">
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        {/* Domain */}
        {showDomain && product.domain && (
          <a
            href={product.systemUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-[hsl(240_8%_35%)] tracking-wider hover:text-[hsl(40_12%_65%)] transition-colors self-start"
          >
            {product.domain}
          </a>
        )}

        {/* CTA pair */}
        {showCTA && (
          <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-white/[0.06]">
            <a
              href={product.demoUrl ?? product.systemUrl}
              target={product.demoUrl ? '_blank' : undefined}
              rel={product.demoUrl ? 'noopener noreferrer' : undefined}
              data-event-source={product.eventSource}
              aria-label={primaryLabel}
              className="font-mono text-[11px] font-bold uppercase tracking-widest bg-[#F97316] text-[#080808] px-5 py-2.5 hover:bg-[#EA6A00] transition-colors"
            >
              {primaryLabel}
            </a>
            <a
              href={product.bookDemoUrl}
              data-event-source={product.eventSource}
              aria-label={secondaryLabel}
              className="font-mono text-[11px] uppercase tracking-widest border border-white/20 text-[hsl(40_30%_96%)] px-5 py-2.5 hover:border-white/40 transition-colors"
            >
              {secondaryLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
