import type { MetadataRoute } from 'next'
import { resolveDomain } from '@maxpromo/config'

/**
 * sitemap.xml for agents.maxpromo.digital.
 *
 * Three public pages: the offer, and the two legal pages the operator is
 * required to show. The dashboard is not public and is disallowed in
 * robots.txt.
 *
 * German only, which is what the Domain Registry declares for this property
 * and what the pages are actually written in — the same rule that took the
 * German route off the two English-only product domains.
 */
const BUREAU = resolveDomain('agents.maxpromo.digital')

const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',             priority: 1.0, changeFrequency: 'weekly' },
  { path: '/impressum',   priority: 0.2, changeFrequency: 'yearly' },
  { path: '/datenschutz', priority: 0.2, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${BUREAU.origin}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
