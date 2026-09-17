/**
 * lib/blog/themes.ts
 *
 * How the company reads its own archive today.
 *
 * `category` on each article is the article's own and is never edited here.
 * A theme is an editorial grouping laid over the top, so the written work can
 * be presented by where the company is now without retitling, recategorising
 * or unpublishing anything that is accurate.
 *
 * This exists in one file because two pages need it: the written-work index
 * groups by theme, and the Resources overview shows one piece from each area
 * rather than the five most recent. A straight recency list on Resources put
 * four legacy-modernisation pieces on the company's overview page, which is an
 * accident of when things were written rather than a statement about what the
 * company does.
 *
 * An unmapped category falls to `modernisation`, which is where every
 * remaining legacy topic belongs. A genuinely new area gets a mapping here
 * rather than being silently filed under legacy.
 */

export const THEME_ORDER = ['operations', 'delivered', 'modernisation'] as const

export type Theme = (typeof THEME_ORDER)[number]

export const THEME_OF: Record<string, Theme> = {
  'Business Systems': 'operations',
  'Case Studies': 'delivered',
  'Joomla Rescue': 'modernisation',
  'WordPress Rescue': 'modernisation',
  'Website Recovery': 'modernisation',
  'Legacy Transformation': 'modernisation',
}

/** The theme an article belongs to, with the fallback applied. */
export function themeOf(category: string | undefined): Theme {
  return THEME_OF[category ?? ''] ?? 'modernisation'
}
