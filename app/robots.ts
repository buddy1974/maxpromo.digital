import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.maxpromo.digital'

/**
 * robots.txt — served at /robots.txt.
 *
 * Public marketing/product routes are crawlable. Internal tooling
 * (/os/*, /api/*), the staff portfolio login (/portfolio), and the
 * account-deletion utility page are excluded — none of these are
 * meant to rank, and /os is the authenticated internal admin panel.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/os', '/os/', '/api/', '/portfolio', '/data-deletion'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
