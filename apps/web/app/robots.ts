import type { MetadataRoute } from 'next'
import { currentDomain } from '@/lib/domains/server'

/**
 * robots.txt — served at /robots.txt, per domain.
 *
 * Before v13.0 this file held one hardcoded `SITE_URL` and every one of the
 * ten public domains served the result. So `restaurant-os.de/robots.txt`
 * declared `Host: https://www.maxpromo.digital` and pointed crawlers at the
 * consultancy's sitemap — the product domain telling search engines it was a
 * different site.
 *
 * Now: the domain answers for itself. `Host` and `Sitemap` name this property,
 * and a domain the registry marks `noindex` says so instead.
 *
 * Public marketing and product routes are crawlable. Internal tooling
 * (/os/*, /api/*), the staff portfolio login and the account-deletion utility
 * page are excluded. Those paths no longer resolve on a product domain at all
 * — the middleware redirects them to the hub — but they stay in the list
 * because a disallow that is merely redundant costs nothing, while one that is
 * missing costs an indexed admin panel.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const domain = await currentDomain()

  if (domain.robots === 'noindex') {
    return { rules: { userAgent: '*', disallow: '/' }, host: domain.origin }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/os', '/os/', '/api/', '/portfolio', '/data-deletion'],
    },
    sitemap: domain.sitemap === 'none' ? undefined : `${domain.origin}/sitemap.xml`,
    host: domain.origin,
  }
}
