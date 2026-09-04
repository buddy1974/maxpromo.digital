import Image from 'next/image'
import type { BulletTuple } from '@/lib/registry/types'
import { Icon } from '@maxpromo/ui'
import {
  EYEBROW_STYLE, RADIUS,
  BUTTON_PRIMARY, BUTTON_SECONDARY,
  INTERACTIVE_PRIMARY_CLASSES, INTERACTIVE_SECONDARY_CLASSES,
  externalLinkProps,
} from '@/components/landing/showcaseTokens'

interface ProductHeroProps {
  domainBrand:     string
  headline:        string
  subline:         string
  bullets:         BulletTuple
  cardImageSrc:    string
  targetAudience:  string | null
  trustCue:        string | null
  ctaPrimaryLabel: string
  ctaPrimaryHref:  string
  /** Null when no genuinely distinct secondary action exists — see LandingEngine.tsx's CTA-duplication guard, 2026-07-25. */
  ctaSecondaryLabel: string | null
  ctaSecondaryHref:  string | null
  locale:          string
}

/**
 * V2 hero for showcase product domains. Rebuild of the old HeroWorld.tsx.
 *
 * By design this section alone must answer four questions on arrival:
 * what is this (domainBrand + headline), who is it for (targetAudience
 * chip), why care (subline + bullets), what to do next (primary CTA).
 *
 * Fixes vs V1:
 *  , Product image was `className="hidden lg:block"` — invisible below
 *    1024px, i.e. hidden for most visitors on a product landing page.
 *    Now shown at every breakpoint (reflows above the copy on mobile).
 *  , No target-audience line, no trust cue — both required by spec
 *    section 4. Render nothing when the registry field is absent
 *    (progressive per-product rollout, not a placeholder).
 *  , Secondary CTA was a dead `#see-in-action` anchor with a generic
 *    "System in Aktion" label. The primary CTA is always passed in fully
 *    resolved (label + href) by the caller, which — per the 2026-07-25 CTA
 *    correction — never resolves to "System ansehen" on a showcase
 *    domain, since the visitor is already on the product's own site.
 *  , Secondary CTA is nullable and rendered only when both label and href
 *    are present (CTA-duplication correction, 2026-07-25). LandingEngine
 *    only supplies it when the registry defines a genuinely distinct
 *    second action — never synthesized from generic defaults that would
 *    point at the same URL as the primary.
 *
 * Visual-polish pass 2026-07-25: headline/CTA/button values now come from
 * showcaseTokens.ts (the V2 Showcase Baseline) instead of one-off inline
 * values; both CTAs get explicit hover/active/focus-visible feedback,
 * previously absent; hero vertical rhythm tightened slightly (title →
 * subline → audience chip → bullets → CTAs → trust cue) so each element
 * reads as a clear step rather than a loose stack.
 */
export function ProductHero({
  domainBrand, headline, subline, bullets, cardImageSrc,
  targetAudience, trustCue,
  ctaPrimaryLabel, ctaPrimaryHref, ctaSecondaryLabel, ctaSecondaryHref,
  locale,
}: ProductHeroProps) {
  const dotAt = headline.indexOf('. ')
  const line1 = dotAt > -1 ? headline.slice(0, dotAt + 1) : headline
  const line2 = dotAt > -1 ? headline.slice(dotAt + 2)    : null

  return (
    <section id="top" style={{ padding: '3rem 2rem 4.5rem' }}>
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', width: '100%', display: 'grid', gap: '2.5rem', alignItems: 'center' }}
        className="grid-cols-1 lg:grid-cols-2"
      >
        {/* Product visual, visible on every breakpoint */}
        <div
          className="order-first lg:order-last"
          style={{ position: 'relative', aspectRatio: '6 / 5', borderRadius: RADIUS.xl, overflow: 'hidden', background: 'var(--brand-border)' }}
        >
          <Image
            src={cardImageSrc}
            alt={`${domainBrand} — product visual`}
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>

        {/* Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <p style={{ ...EYEBROW_STYLE, margin: 0 }}>
            {domainBrand}
          </p>

          <h1 style={{ margin: 0 }}>
            <span style={{ display: 'block' }}>{line1}</span>
            {line2 && <span style={{ display: 'block' }}>{line2}</span>}
          </h1>

          <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '18px', color: 'var(--showcase-muted)', lineHeight: 1.7, maxWidth: '34rem', margin: 0 }}>
            {subline}
          </p>

          {targetAudience && (
            <p
              style={{
                fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: 'var(--showcase-fg)',
                lineHeight: 1.6, maxWidth: '34rem', margin: 0,
                padding: '10px 14px', borderRadius: RADIUS.sm,
                background: 'color-mix(in srgb, var(--showcase-accent) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--showcase-accent) 25%, transparent)',
                display: 'inline-block', width: 'fit-content',
              }}
            >
              {(locale === 'de' ? 'Für: ' : 'For: ') + targetAudience}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.15rem' }}>
            {bullets.map((b, i) => (
              <span key={i} style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--showcase-fg)' }}>
                <span style={{ color: 'var(--showcase-muted)', flexShrink: 0 }}>→</span>
                {b}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '0.6rem' }}>
            <a
              href={ctaPrimaryHref}
              className={INTERACTIVE_PRIMARY_CLASSES}
              style={{ ...BUTTON_PRIMARY, padding: '14px 28px' }}
              {...externalLinkProps(ctaPrimaryHref)}
            >
              {ctaPrimaryLabel}
            </a>
            {ctaSecondaryLabel && ctaSecondaryHref && (
              <a
                href={ctaSecondaryHref}
                className={INTERACTIVE_SECONDARY_CLASSES}
                style={{ ...BUTTON_SECONDARY, padding: '14px 28px' }}
                {...externalLinkProps(ctaSecondaryHref)}
              >
                {ctaSecondaryLabel}
              </a>
            )}
          </div>

          {trustCue && (
            <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', margin: 0, marginTop: '0.2rem' }}>
              <Icon name="check" size="sm" /> {trustCue}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
