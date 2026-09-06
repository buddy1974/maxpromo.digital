import type { MetadataRoute } from 'next'
import { resolveDomain } from '@maxpromo/config'

/**
 * robots.txt for agents.maxpromo.digital.
 *
 * This property published none before v13.0 — no robots.txt, no sitemap, no
 * manifest — so the one public domain not served by `apps/web` was the one
 * domain with no crawl policy at all. Part 1 of the brief lists it alongside
 * the others; this is it holding the same contract.
 *
 * The dashboard and its API are the supervised-agent console. They are
 * excluded, as `/os` is on the hub.
 */
const BUREAU = resolveDomain('agents.maxpromo.digital')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/dashboard/', '/api/', '/login'],
    },
    sitemap: `${BUREAU.origin}/sitemap.xml`,
    host: BUREAU.origin,
  }
}
