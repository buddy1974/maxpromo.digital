/**
 * components/systems/SystemCard/SystemCardCompact.tsx
 *
 * Compact card variant — thumbnail-first, minimal content.
 * Shows: thumbnail image, brand accent strip, product name,
 *        1-line subline, domain, CTA.
 *
 * Used on: homepage (3-col grid)
 * imageMode='heroCrop' → object-position: top (reveals headline band of card image)
 *
 * Server component. Client boundary is isolated to TrackableLink.
 */

import Image from 'next/image'
import type { SystemCardProps, ImageMode } from './SystemCard'
import { resolveCompactCTALabel, resolveCompactAriaLabel } from './helpers/cta'
import { resolveThumbSrc, resolveImageStyle } from './helpers/image'
import { TrackableLink } from '@/components/systems/interactions/TrackableLink'
import { CTA_PRIMARY_CLICKED } from '@/lib/analytics/events'

// =============================================================================
// TYPES
// =============================================================================

export type { ImageMode }

export interface SystemCardCompactProps
  extends Pick<SystemCardProps, 'product' | 'locale' | 'showCTA'> {
  readonly imageMode?: ImageMode
  readonly source?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SystemCardCompact({
  product,
  locale = 'de',
  showCTA = true,
  imageMode = 'cover',
  source,
}: SystemCardCompactProps) {

  const subline = locale === 'de' && product.subline.de
    ? product.subline.de
    : product.subline.en

  const ctaHref                       = product.landingUrl
  const thumbSrc                      = resolveThumbSrc(product)
  const { objectFit, objectPosition } = resolveImageStyle(imageMode)
  const ctaLabel                      = resolveCompactCTALabel(locale)
  const eventSource                   = source ?? product.eventSource

  return (
    <article
      data-slug={product.slug}
      data-variant="compact"
      data-image-mode={imageMode}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] bg-[hsl(240_12%_7%)] transition-shadow duration-300 hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.7)]"
    >
      {/* ── THUMBNAIL */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '8 / 5' }}
        aria-hidden="true"
      >
        {thumbSrc ? (
          <Image
            src={`/${thumbSrc}`}
            alt={product.name}
            fill
            className="transition-transform duration-500 group-hover:scale-[1.04]"
            style={{ objectFit, objectPosition }}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[hsl(240_14%_4%)]" />
        )}

        {/* Brand accent strip */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{ background: product.brandColor }}
          aria-hidden="true"
        />
      </div>

      {/* ── BODY */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-2">
        <h3 className="m-0 text-[1rem] font-bold leading-tight tracking-tight text-[hsl(40_30%_96%)]">
          {product.name}
        </h3>
        <p className="m-0 text-[13px] leading-relaxed text-[hsl(40_12%_65%)] line-clamp-2 font-mono">
          {subline}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
          <span className="font-mono text-[10px] text-[hsl(240_8%_35%)] tracking-wider uppercase">
            {product.domain}
          </span>
          {showCTA && (
            <TrackableLink
              href={ctaHref}
              event={{
                type:      CTA_PRIMARY_CLICKED,
                slug:      product.slug,
                source:    eventSource,
                timestamp: 0,
                locale,
                ctaLabel,
              }}
              aria-label={resolveCompactAriaLabel(product.name, locale)}
              data-event-source={eventSource}
              className="font-mono text-[11px] text-[#F97316] tracking-widest uppercase hover:opacity-70 transition-opacity"
            >
              {ctaLabel}
            </TrackableLink>
          )}
        </div>
      </div>
    </article>
  )
}
