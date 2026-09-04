import type { FinalCtaData } from '@/lib/registry/adapters/landing.adapter'
import { EYEBROW_STYLE, SECTION_PADDING, BUTTON_PRIMARY, BUTTON_SECONDARY, INTERACTIVE_PRIMARY_CLASSES, INTERACTIVE_SECONDARY_CLASSES, externalLinkProps } from '@/components/landing/showcaseTokens'

interface ConversionProps {
  name:         string
  bookDemoUrl:  string
  domain:       string
  ctaPrimary:   string
  locale:       string
  bridge:       boolean
  finalCta:     FinalCtaData | null
}

/**
 * Final conversion section — the strongest point on the page by design.
 *
 * V2 correction 2026-07-25 (Marcel): copy is now driven by the registry's
 * `finalCta` fields when a product has been migrated to V2 — HandwerkOS
 * is the pilot. Falls back to generic, name-safe copy for the 5 showcase
 * products not yet migrated (Phase D backlog).
 *
 * CTA-duplication correction, 2026-07-25: `showcaseSecondary` requires
 * `secondaryUrl !== primaryUrl` — guards against a future product
 * migration accidentally repeating HandwerkOS's original same-URL bug.
 * Bridge mode keeps its own, unrelated secondary link out to the
 * product's own domain (correct there — the visitor hasn't reached the
 * product site yet; wrong on the showcase domain itself).
 *
 * Visual-polish pass 2026-07-25 (Marcel — "make the final CTA the
 * strongest point on the page"): section padding increased to
 * SECTION_PADDING.cta (7rem, the single largest padding value on the
 * page — deliberately, this section should feel like arriving somewhere,
 * not just another block). Heading now uses HEADING_SIZE.cta (the
 * second-largest type on the page, after the hero) instead of a
 * one-off clamp(). Both CTA buttons get explicit hover/active/focus
 * feedback via the shared interactive tokens, previously absent.
 */
export function Conversion({ name, bookDemoUrl, domain, ctaPrimary, locale, bridge, finalCta }: ConversionProps) {
  const isDE    = locale === 'de'
  const eyebrow = finalCta?.eyebrow || (isDE ? 'Bereit?' : 'Ready?')
  const heading = finalCta?.heading || (isDE ? 'Sehen Sie es in Ihrem Betrieb.' : 'See it in your business.')
  const sub     = finalCta?.description || (isDE
    ? `Erkunden Sie ${name} mit einem Workflow, der Ihrem Betrieb entspricht.`
    : `Explore ${name} using a workflow close to your business.`)

  const primaryLabel = finalCta?.primaryLabel || ctaPrimary
  const primaryHref  = finalCta?.primaryUrl || bookDemoUrl

  const bridgeSecondaryLabel = isDE
    ? `System ansehen bei ${domain} →`
    : `See full system at ${domain} →`

  const showcaseSecondary = !bridge
    && finalCta?.secondaryLabel
    && finalCta?.secondaryUrl
    && finalCta.secondaryUrl !== primaryHref
    ? { label: finalCta.secondaryLabel, href: finalCta.secondaryUrl }
    : null

  return (
    <section style={{ padding: SECTION_PADDING.cta, borderTop: '1px solid var(--brand-border)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '1rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: '1rem', color: 'var(--showcase-fg)' }}>
          {heading}
        </h2>
        <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '14px', color: 'var(--showcase-muted)', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
          {sub}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={primaryHref}
            className={INTERACTIVE_PRIMARY_CLASSES}
            style={{ ...BUTTON_PRIMARY, boxShadow: '0 0 36px color-mix(in srgb, var(--brand-primary) 30%, transparent)' }}
            {...externalLinkProps(primaryHref)}
          >
            {primaryLabel}
          </a>

          {bridge && (
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className={INTERACTIVE_SECONDARY_CLASSES}
              style={BUTTON_SECONDARY}
            >
              {bridgeSecondaryLabel}
            </a>
          )}

          {showcaseSecondary && (
            <a
              href={showcaseSecondary.href}
              className={INTERACTIVE_SECONDARY_CLASSES}
              style={BUTTON_SECONDARY}
              {...externalLinkProps(showcaseSecondary.href)}
            >
              {showcaseSecondary.label}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
