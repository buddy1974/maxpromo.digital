import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import type { SeeInActionTab } from '@/lib/registry/types'
import { EYEBROW_STYLE, SECTION_PADDING, SECTION_DIVIDER } from '@/components/landing/showcaseTokens'

interface ProductGalleryProps {
  seeInAction: ReadonlyArray<SeeInActionTab> | null
  locale:      string
}

/**
 * V2 rebuild of InAction.tsx — wires ScreenshotSlot.tsx (previously
 * built but never used anywhere) into the architecture.
 *
 * Corrected 2026-07-25 (Marcel's V2 review, item 1): this component used
 * to fall back to the marketing card image, captioned "Produktübersicht"
 * with a "more screens will appear here as real screenshots are
 * captured" subcaption, whenever no real screenshots existed yet — a
 * "screens coming soon" placeholder wearing a gallery layout. That is
 * exactly what the original brief banned ("no empty frame, no 'screens
 * coming soon' message, no fake interface gallery").
 *
 * ProductGallery now renders ONLY when at least one `seeInAction` tab has
 * a real, non-null `imageUrl` — otherwise it renders nothing (`null`),
 * same as ScreenshotSlot's own behaviour for a missing `src`. The
 * marketing card image has its own honestly-labelled home now:
 * ProductOverviewVisual.tsx, which is explicitly NOT a screenshot gallery
 * and never claims to be one.
 *
 * As more tabs get real screenshots later (see products.ts's RestaurantOS
 * entry, which already has tabs waiting with imageUrl: null), they appear
 * automatically — no redesign needed.
 *
 * Reconfirmed 2026-07-25 (Marcel's visual-polish pass, PRODUCT VISUAL
 * instruction — "when real screenshots do not exist, ProductGallery must
 * remain hidden"): the null-return path is unchanged and re-verified;
 * only the tokens below changed.
 */
export function ProductGallery({ seeInAction, locale }: ProductGalleryProps) {
  const captured = (seeInAction ?? []).filter((tab) => tab.imageUrl)
  if (captured.length === 0) return null

  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Das System in Aktion' : 'The system in action'
  const heading = isDE ? 'So sieht es aus.' : 'Here’s what it looks like.'

  return (
    <section id="gallery" data-section="gallery" style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: '2.5rem' }}>
          {heading}
        </h2>

        <div style={{ display: 'grid', gap: '2rem' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {captured.map((tab, i) => (
            <ScreenshotSlot
              key={i}
              src={tab.imageUrl}
              alt={tab.headline}
              width={1200}
              height={750}
              caption={tab.tab}
              subcaption={tab.headline}
              priority={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
