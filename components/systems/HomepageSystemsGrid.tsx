/**
 * components/systems/HomepageSystemsGrid.tsx
 *
 * Adapter-driven homepage systems grid.
 * The ONLY point in the homepage that consumes HomepageCardData[].
 *
 * Architecture position:
 *
 *   Registry (HOMEPAGE_PRODUCTS)
 *     ↓
 *   homepage.adapter → getHomepageCards(locale)
 *     ↓
 *   HomepageCardData[]   ← this component receives this
 *     ↓
 *   HomepageSystemsGrid (here)
 *     ↓
 *   card shells per product
 *
 * No registry imports here. No ProductEntry here.
 * No HOMEPAGE_PRODUCTS here. Adapter output only.
 *
 * Grid rules:
 *   Desktop: 3 columns
 *   Tablet:  2 columns
 *   Mobile:  1 column
 *   imageMode: heroCrop (top portion of card image, reveals headline + photo)
 *
 * TODO: future analytics  — fire system_card_viewed on IntersectionObserver
 * TODO: future click tracking — fire system_card_clicked event on CTA anchor click
 * TODO: future experiment flags — swap card layout variant per product slug
 * TODO: add Tailwind responsive grid classes (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
 *       once visual implementation pass begins
 */

import type { HomepageCardData } from '@/lib/registry/adapters'

// =============================================================================
// PROPS
// =============================================================================

export interface HomepageSystemsGridProps {
  /**
   * Locale-resolved card data from homepage.adapter.
   * Must come from getHomepageCards(locale) — never pass ProductEntry[] here.
   */
  readonly cards: ReadonlyArray<HomepageCardData>
  /** Active locale — used for aria labels and future i18n CTA labels. */
  readonly locale: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * HomepageSystemsGrid — adapter-to-grid bridge.
 *
 * Consumes HomepageCardData from the adapter and renders each product
 * as a compact card. No registry access, no raw ProductEntry.
 *
 * @example
 * // In app/[locale]/page.tsx:
 * const cards = getHomepageCards(locale)
 * <HomepageSystemsGrid cards={cards} locale={locale} />
 */
export default function HomepageSystemsGrid({
  cards,
  locale,
}: HomepageSystemsGridProps) {

  if (cards.length === 0) return null

  return (
    <div
      data-component="homepage-systems-grid"
      data-count={cards.length}
      style={{
        display: 'grid',
        // TODO: replace with Tailwind: className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
      }}
    >
      {cards.map((card) => (
        <HomepageSystemCard key={card.slug} card={card} locale={locale} />
      ))}
    </div>
  )
}

// =============================================================================
// CARD SUB-COMPONENT
// Renders a single compact card from HomepageCardData.
// Intentionally inline — consumed only by HomepageSystemsGrid.
// =============================================================================

interface HomepageSystemCardProps {
  readonly card: HomepageCardData
  readonly locale: string
}

function HomepageSystemCard({ card, locale }: HomepageSystemCardProps) {
  // ── Thumbnail — prefer thumb, fall back to card image
  const imgSrc = card.media.thumb ?? card.media.card

  return (
    <article
      data-slug={card.slug}
      data-variant="compact"
      data-image-mode="heroCrop"
      data-event-source={card.eventSource}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {/*
        ── THUMBNAIL
        imageMode: heroCrop — top portion of the 1200×630 card image
        Shows: product logo, headline, photography section
        Hides: HOW IT WORKS strip, benefit columns, CTA footer

        Brand color accent bar — governance VG-02
        TODO: replace div with next/image
        TODO: apply objectPosition: 'top' for heroCrop behavior
        TODO: apply objectFit: 'cover'
      */}
      <div
        data-section="thumbnail"
        data-src={imgSrc}
        style={{
          width: '100%',
          aspectRatio: '8 / 5',
          background: 'hsl(240 12% 7%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <div
          data-section="brand-accent"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: card.brandColor,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── BODY */}
      <div
        data-section="body"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}
      >
        <h3
          data-field="name"
          style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em' }}
        >
          {card.name}
        </h3>

        <p
          data-field="headline"
          style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.6 }}
        >
          {card.headline}
        </p>

        {/* CTA — adapter already resolved the label and href */}
        <a
          href={card.primaryCTA.href}
          target={card.primaryCTA.opensNewTab ? '_blank' : undefined}
          rel={card.primaryCTA.opensNewTab ? 'noopener noreferrer' : undefined}
          data-field="cta"
          data-event-source={card.eventSource}
          aria-label={`${card.name} — ${card.primaryCTA.label}`}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'hsl(28 100% 58%)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            alignSelf: 'flex-start',
            marginTop: 'auto',
          }}
        >
          {card.primaryCTA.label}
        </a>
      </div>
    </article>
  )
}
