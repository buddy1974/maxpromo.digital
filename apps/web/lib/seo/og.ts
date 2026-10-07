import type { Metadata } from 'next'
import { primitive, token } from '@maxpromo/design-tokens'
import { COMPANY_BRAND } from '@maxpromo/config'

/**
 * lib/seo/og.ts — one social-card system, by page family.
 *
 * THE PROBLEM THIS REPLACES
 *
 * Every page served the same static image, and only four routes set
 * `openGraph` at all. A shared link to the Resources page and one to the
 * Impressum previewed identically, so a share told nobody which page it was.
 * Patching Resources alone would have left the same hole in twenty-six other
 * routes.
 *
 * ONE SYSTEM, NOT ONE PATCH
 *
 * `pageMetadata()` builds the whole block — title, description, canonical,
 * both hreflang alternates, Open Graph and the Twitter equivalent — from the
 * page's own title and family. A page cannot set half of it and forget the
 * rest, because there is no half to set.
 *
 * THE CARD MAY NOT CLAIM MORE THAN THE PAGE
 *
 * A social card is a persuasive surface. Everything the claims rules forbid on
 * a page they forbid here: no figures, no customer names, no testimonials, no
 * awards, no "leading". The card carries the wordmark, the page's own title,
 * and a family label. Because the title comes from the page, the card cannot
 * drift from it the way a hand-made PNG does the day a page is renamed.
 */

export const OG_FAMILIES = [
  'company',
  'capability',
  'industry',
  'work',
  'resource',
  'guide',
] as const

export type OgFamily = (typeof OG_FAMILIES)[number]

/**
 * Brand values for the card.
 *
 * Taken from the JS token module rather than written as hex. The card is
 * rendered by the edge runtime, which has no stylesheet and cannot resolve a
 * CSS custom property — which is exactly why `@maxpromo/design-tokens` exports
 * `token` as values, and why Agent Bureau's system map already reads from it.
 *
 * The first version of this file hardcoded five colours with a comment
 * claiming the design-token audit exempted it. The audit disagreed, correctly:
 * a social card is brand output like any other, and a card that keeps its own
 * copy of the brand is a card that goes stale the day the brand moves.
 */
export const BRAND_OG = {
  black: primitive.black,
  lime: primitive.lime400,
  limeDark: primitive.lime600,
  white: primitive.white,
  /*
   * `token.textInverted` — the palette's own value for secondary text on a
   * dark surface, which is exactly what the card's footer line is.
   *
   * The previous attempt used `color-mix()` against the white primitive. It
   * satisfied the token audit and broke the card: the image is rendered by
   * satori, which does not implement `color-mix`, so the route stopped
   * responding entirely while every gate stayed green — the gate checked that
   * an og:image URL was present, not that the URL returned an image.
   */
  muted: token.textInverted,
  width: 1200,
  height: 630,
  familyLabel: {
    company:    { de: 'Maxpromo Digital', en: 'Maxpromo Digital' },
    capability: { de: 'Leistung',         en: 'Capability' },
    industry:   { de: 'Branche',          en: 'Industry' },
    work:       { de: 'Arbeiten',         en: 'Work' },
    resource:   { de: 'Ressource',        en: 'Resource' },
    guide:      { de: 'Leitfaden',        en: 'Guide' },
  },
} as const

const SITE = 'https://www.maxpromo.digital'

/** What the hub's title template appends (`%s | Maxpromo Digital`, lib/domains/server.ts). */
const TITLE_SUFFIX = ' | Maxpromo Digital'

/** Roughly how many characters a results page shows before cutting a title off. */
export const TITLE_BUDGET = 65

/**
 * The document title: templated with the brand when the result still fits the
 * budget, the page's own words alone when the suffix would only be cut off.
 * og:site_name carries the brand to social previews either way.
 */
export function documentTitle(title: string): Metadata['title'] {
  return title.length + TITLE_SUFFIX.length <= TITLE_BUDGET ? title : { absolute: title }
}

/**
 * The approved corporate card, as a `pageMetadata({ image })` value — read
 * from the brand registry so its path and true dimensions live in one place.
 * Used where the company itself is the subject (home) and where a generated
 * title card would add nothing (the legal pages).
 */
export function corporateCard(alt: string): PageMetadataInput['image'] {
  const card = COMPANY_BRAND.openGraphImage
  return card.path && card.width && card.height
    ? { path: card.path, width: card.width, height: card.height, alt }
    : undefined
}

interface PageMetadataInput {
  readonly locale: string
  /** Path without the locale prefix, e.g. `/solutions/web-development`. */
  readonly path: string
  readonly title: string
  readonly description: string
  readonly family: OgFamily
  /** Title for the card, when the page title is too long to read at card size. */
  readonly cardTitle?: string
  /**
   * Social title, when it should differ from the page title. The home page is
   * the case: its `<title>` is templated with the brand, while its og:title
   * carries the full framing because a crawler shows og:title as-is.
   */
  readonly ogTitle?: string
  /**
   * An approved image instead of the generated card. The share-preview
   * hierarchy (docs/governance/seo-inventory.md): a page-specific approved
   * image first, the generated family card otherwise. Path is site-relative,
   * e.g. `/images/seo/maxpromo-digital-og.png`; dimensions are the file's own.
   */
  readonly image?: { readonly path: string; readonly width: number; readonly height: number; readonly alt: string }
}

/**
 * The complete head block for a public page.
 *
 * Returns canonical, both language alternates, Open Graph and Twitter together,
 * so a page cannot acquire a canonical without an hreflang or an OG title
 * without an OG image.
 */
export function pageMetadata({
  locale, path, title, description, family, cardTitle, ogTitle, image: approved,
}: PageMetadataInput): Metadata {
  const social = ogTitle ?? title
  const loc = locale === 'en' ? 'en' : 'de'
  const url = `${SITE}/${loc}${path === '/' ? '' : path}`
  const image = approved ? `${SITE}${approved.path}` : `${SITE}/og?${new URLSearchParams({
    title: cardTitle ?? social,
    family,
    locale: loc,
  })}`
  const og = approved
    ? { url: image, width: approved.width, height: approved.height, alt: approved.alt }
    : { url: image, width: BRAND_OG.width, height: BRAND_OG.height, alt: title }

  return {
    title: documentTitle(title),
    description,
    alternates: {
      canonical: `/${loc}${path === '/' ? '' : path}`,
      languages: {
        de: `/de${path === '/' ? '' : path}`,
        en: `/en${path === '/' ? '' : path}`,
        // German is the default locale and the primary market: a searcher
        // whose language is neither gets the German page.
        'x-default': `/de${path === '/' ? '' : path}`,
      },
    },
    openGraph: {
      type: 'website',
      title: social,
      description,
      url,
      siteName: 'Maxpromo Digital',
      locale: loc === 'de' ? 'de_DE' : 'en_GB',
      alternateLocale: loc === 'de' ? 'en_GB' : 'de_DE',
      images: [og],
    },
    twitter: {
      card: 'summary_large_image',
      title: social,
      description,
      images: [image],
    },
  }
}
