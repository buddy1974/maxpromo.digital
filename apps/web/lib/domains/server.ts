import { headers } from 'next/headers'
import type { Metadata } from 'next'
import type { DomainEntry } from '@maxpromo/config'
import { canonicalUrl } from '@maxpromo/config'
import { resolveWebDomain } from './resolve'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'

/**
 * apps/web/lib/domains/server.ts
 *
 * The server-side half of domain identity: read the record, then build the
 * things that are derived from it.
 *
 * Every surface that used to hardcode `https://www.maxpromo.digital` reads
 * from here instead. That constant appeared in the root layout's
 * `metadataBase`, in the home page's canonical, in `robots.ts` and in
 * `sitemap.ts`, and nine domains inherited all four.
 */

/**
 * The domain serving this request.
 *
 * `x-mp-domain` is stamped by the middleware and is the registry key, already
 * normalised. Metadata routes — robots.txt, sitemap.xml, manifest.webmanifest —
 * are excluded from the middleware matcher by the dot rule, so they fall back
 * to the raw Host header and normalise it themselves.
 */
export async function currentDomain(): Promise<DomainEntry> {
  const h = await headers()
  return resolveWebDomain(h.get('x-mp-domain') ?? h.get('host'))
}

/**
 * The locale this request renders in.
 *
 * next-intl's `getLocale()` reads the locale next-intl itself resolved, and on
 * a product domain the middleware rewrites `/` to `/en` or `/de` directly —
 * next-intl never sees that request, so it answers with the routing default.
 * On the two English-led domains that produced `<html lang="de">` around
 * English pages, which is the RC1-04 defect in miniature: a language declared
 * that the page is not written in.
 *
 * The middleware knows the answer, so it stamps it.
 */
export async function currentLocale(fallback: string): Promise<string> {
  const h = await headers()
  const stamped = h.get('x-mp-locale')
  return stamped === 'de' || stamped === 'en' ? stamped : fallback
}

/**
 * Product copy for a showcase domain, or null for the hub.
 *
 * The text lives in `lib/registry/products.ts` and is read from there rather
 * than repeated in the Domain Registry — see the header of
 * `packages/config/domains.ts`. `audit-domains.mjs` asserts that every
 * showcase domain's slug resolves to a product, so this returning null on a
 * showcase host is a build-time impossibility rather than a runtime hope.
 */
function productCopy(domain: DomainEntry, locale: string) {
  if (domain.mode !== 'showcase' || !domain.productSlug) return null
  return getLandingData(domain.productSlug, locale)
}

/**
 * The site-wide metadata every page on this domain inherits.
 *
 * Replaces the static `metadata` export in `app/layout.tsx`, which named the
 * consultancy in `metadataBase`, `applicationName`, `openGraph.siteName` and
 * the `%s | Maxpromo Digital` title template — so every product domain
 * introduced itself as Maxpromo Digital in the browser tab before any page had
 * a chance to say otherwise.
 */
export function domainRootMetadata(domain: DomainEntry, locale: string, hub: Metadata): Metadata {
  if (domain.mode === 'hub') {
    // The consultancy's own metadata is unchanged by this sprint. It is passed
    // in rather than restated so there is still only one copy of it.
    return { ...hub, metadataBase: new URL(domain.origin) }
  }

  const product = productCopy(domain, locale)
  const name = product?.name ?? domain.product
  const title = product ? `${name} — ${product.headline}` : name
  const description = product?.description ?? ''

  return {
    metadataBase:    new URL(domain.origin),
    applicationName: domain.siteName,
    title: {
      default:  title,
      template: `%s | ${domain.siteName}`,
    },
    description,
    icons:    { icon: domain.favicon },
    manifest: domain.manifest ? '/manifest.webmanifest' : undefined,
    robots:   domain.robots === 'noindex' ? { index: false, follow: false } : undefined,
    openGraph: {
      siteName: domain.siteName,
      title,
      description,
      type:     'website',
      url:      canonicalUrl(domain, locale, '/'),
      images:   [{
        url:    domain.openGraph.path,
        width:  domain.openGraph.width,
        height: domain.openGraph.height,
        alt:    name,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [domain.openGraph.path],
    },
  }
}

/**
 * Metadata for a showcase domain's root page, or null on the hub.
 *
 * The canonical is the product's own address. Nine domains previously
 * canonicalised to `https://www.maxpromo.digital/de`, which asks a search
 * engine to treat the product as a duplicate of the consultancy and show the
 * consultancy instead.
 *
 * `alternates.languages` lists only the languages this domain serves, so a
 * single-language product never advertises a page it redirects away from.
 */
export function showcaseRootMetadata(domain: DomainEntry, locale: string): Metadata | null {
  const product = productCopy(domain, locale)
  if (!product) return null

  const title = `${product.name} — ${product.headline}`
  const canonical = canonicalUrl(domain, locale, '/')

  // The product's own card in the language being served. The registry declares
  // one image per domain for the pages that resolve before a locale is known;
  // here the locale *is* known, so the English page gets the English card
  // rather than the German one. audit-domains asserts both are present and
  // both are the dimensions the registry states.
  const image = {
    url:    product.cardImageSrc,
    width:  domain.openGraph.width,
    height: domain.openGraph.height,
    alt:    product.name,
  }

  return {
    // `absolute` because the root layout sets a `%s | RestaurantOS` template
    // for this domain and this title already names the product. Without it the
    // tab reads "RestaurantOS — Bestellungen laufen. Personal nicht. |
    // RestaurantOS".
    title: { absolute: title },
    description: product.description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        domain.languages.map((l) => [l, canonicalUrl(domain, l, '/')]),
      ),
    },
    openGraph: {
      siteName:    domain.siteName,
      title,
      description: product.description,
      url:         canonical,
      images:      [image],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description: product.description,
      images:      [image.url],
    },
  }
}
