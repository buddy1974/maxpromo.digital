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
 *   siteGraph()    The three site-wide entities, rendered once per page by the
 *                  locale layout on the Maxpromo hub (never on showcase
 *                  product domains).
 *   breadcrumbs()  A BreadcrumbList for a page that sits below a real index
 *                  page — /solutions/x, /industries/x, /work/x, /blog/x,
 *                  /resources/x. Names are the visible navigation labels.
 *   service()      A Service for each capability page. Provider by @id. No
 *                  offers, no price, no areaServed: the site states none, and
 *                  structured data may not say more than the page.
 *
 * Rules: docs/governance/seo-inventory.md, "Structured data".
 */

import { BUSINESS, COMPANY_BRAND } from '@maxpromo/config'
import { FOUNDER_PORTRAIT } from '@/lib/founder'

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

/**
 * Organization, founder and WebSite. Every fact is read from @maxpromo/config
 * (the record the Impressum prints) or the brand registry.
 *
 * Deliberately absent (docs/governance/seo-inventory.md §9):
 *   - streetAddress, postalCode. Maxpromo Digital works at its clients'
 *     premises and does not receive them; the street address is printed only
 *     where the law requires it.
 *   - LocalBusiness, geo, openingHours. No storefront, no published hours.
 *     A future staffed office is added as a `location` Place here, not by
 *     changing the type (§11, future hybrid model).
 *   - areaServed, sameAs. Added when the site states a service area and when
 *     a public profile exists — not before.
 *   - Review, AggregateRating, SearchAction. Nothing on the site supports them.
 */
export function siteGraph(locale: string, founderName: string) {
  const l = asLocale(locale)
  const isDE = l === 'de'
  const logo = COMPANY_BRAND.logo
  return graph(
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: BUSINESS.brand,
      url: SITE,
      ...(logo.path ? { logo: { '@type': 'ImageObject', url: `${SITE}${logo.path}`, width: logo.width, height: logo.height } } : {}),
      description: isDE
        ? 'Maxpromo Digital baut und verbessert die Systeme, auf denen Betriebe laufen: Prozessautomatisierung, individuelle Anwendungen, Webentwicklung, Content- und Produktabläufe.'
        : 'Maxpromo Digital builds and improves the systems businesses run on: workflow automation, custom applications, web development, content and product operations.',
      address: { '@type': 'PostalAddress', addressLocality: BUSINESS.cityName, addressCountry: BUSINESS.countryCode },
      email: BUSINESS.email,
      knowsLanguage: ['de', 'en'],
      founder: { '@id': FOUNDER_ID },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: BUSINESS.phone,
        email: BUSINESS.email,
        contactType: 'customer service',
        availableLanguage: ['German', 'English'],
      },
    },
    {
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: founderName,
      jobTitle: isDE ? 'Gründer' : 'Founder',
      url: pageUrl(l, '/about'),
      image: `${SITE}${FOUNDER_PORTRAIT}`,
      worksFor: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: BUSINESS.brand,
      url: SITE,
      inLanguage: ['de-DE', 'en-GB'],
      publisher: { '@id': ORGANIZATION_ID },
    },
  )
}

/** One script payload: a @graph of the given nodes. */
export function graph(...nodes: readonly object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes }
}
