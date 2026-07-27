import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import { SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'

interface ProductOverviewVisualProps {
  cardImageSrc: string
  domainBrand:  string
  locale:       string
}

/**
 * Added 2026-07-25 (Marcel's V2 correction, item 1) — split out of
 * ProductGallery.tsx.
 *
 * Every product has `media.card` at baseline (required, not optional, on
 * MediaAssets), so this section always has something real to show and
 * always renders — it is what keeps the page looking complete before any
 * real product screenshots exist, per the pilot's design test ("HandwerkOS
 * must already look complete without real screenshots").
 *
 * Deliberately labelled and worded so it can never be mistaken for a
 * software screenshot or an interface gallery: caption reads "Product
 * visual", not "Product overview" or "Screenshot", and the subcaption
 * states plainly that it is a marketing visual. No "more screens coming
 * soon" language — that promise belongs to ProductGallery.tsx, which only
 * ever appears once real screenshots exist, never as a stand-in caption
 * here.
 *
 * Visual-polish pass 2026-07-25 (Marcel — "the overview visual should
 * feel premium, never present it as a software screenshot"): kept the
 * honest labelling exactly as-is (that's a content-truthfulness rule, not
 * a style choice) but tightened the section padding to the shared token
 * and widened the frame slightly so the card image reads as a deliberate
 * visual moment rather than a small, orphaned box between two text-heavy
 * sections.
 */
export function ProductOverviewVisual({ cardImageSrc, domainBrand, locale }: ProductOverviewVisualProps) {
  const isDE = locale === 'de'

  return (
    <section data-section="product-overview-visual" style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '50rem', margin: '0 auto' }}>
        <ScreenshotSlot
          src={cardImageSrc}
          alt={`${domainBrand} — marketing product visual`}
          width={1200}
          height={630}
          caption={isDE ? 'Produktvisual' : 'Product visual'}
          subcaption={
            isDE
              ? `${domainBrand} — Marketingdarstellung, kein Software-Screenshot.`
              : `${domainBrand} — marketing visual, not a software screenshot.`
          }
          priority
        />
      </div>
    </section>
  )
}
