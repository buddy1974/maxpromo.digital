/**
 * lib/seo/schema.ts
 *
 * Structured data for pages below the site-wide entity graph.
 *
 * The locale layout declares three entities once, with stable @ids:
 * #organization, #website and #founder. Everything here points at them by @id
 * instead of restating the company, so there is one Organization in the whole
 * site's markup and nothing to drift.
 *
 * WHAT IS BUILT HERE
 *
 *   breadcrumbs()  A BreadcrumbList for a page that sits below a real index
 *                  page — /solutions/x, /industries/x, /work/x, /blog/x,
 *                  /resources/x. Names are the visible navigation labels.
 *   service()      A Service for each capability page. Provider by @id. No
 *                  offers, no price, no areaServed: the site states none, and
 *                  structured data may not say more than the page.
 *
 * Rules: docs/governance/seo-inventory.md, "Structured data".
 */

export const SITE = 'https://www.maxpromo.digital'
export const ORGANIZATION_ID = `${SITE}/#organization`
export const FOUNDER_ID = `${SITE}/#founder`
export const WEBSITE_ID = `${SITE}/#website`

type Locale = 'de' | 'en'
const asLocale = (l: string): Locale => (l === 'en' ? 'en' : 'de')

/** The public URL of a page. `path` is without the locale prefix. */
export function pageUrl(locale: string, path: string): string {
  return `${SITE}/${asLocale(locale)}${path === '/' ? '' : path}`
}

const HOME: Record<Locale, string> = { de: 'Startseite', en: 'Home' }

export interface Crumb {
  readonly name: string
  /** Path without the locale prefix. */
  readonly path: string
}

/** Home, then each crumb, the last one being the page itself. */
export function breadcrumbs(locale: string, trail: readonly Crumb[]) {
  const l = asLocale(locale)
  const items = [{ name: HOME[l], path: '/' }, ...trail]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: pageUrl(l, c.path),
    })),
  }
}

export function service(locale: string, path: string, name: string, description: string) {
  const l = asLocale(locale)
  return {
    '@type': 'Service',
    '@id': `${pageUrl(l, path)}#service`,
    name,
    description,
    url: pageUrl(l, path),
    inLanguage: l === 'en' ? 'en-GB' : 'de-DE',
    provider: { '@id': ORGANIZATION_ID },
  }
}

/** One script payload: a @graph of the given nodes. */
export function graph(...nodes: readonly object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes }
}
