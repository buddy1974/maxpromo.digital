import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog/posts'

const SITE_URL = 'https://www.maxpromo.digital'
const LOCALES = ['de', 'en'] as const

/**
 * Static public routes, given without a locale prefix. Each entry is
 * expanded into one sitemap URL per locale below, with `alternates`
 * pointing at its sibling-language URL so Google treats /de/x and
 * /en/x as the same page in two languages rather than duplicate
 * content.
 *
 * Only routes meant to rank are listed here. Internal tooling
 * (/os/*), the staff portfolio login, and the account-deletion
 * utility page are intentionally excluded — see app/robots.ts.
 */
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',                              priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about',                        priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services',                     priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/customer-inquiries',  priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/workflow-automation', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/ai-agents',           priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/reviews',             priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/social-media',        priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/websites-platforms',  priority: 0.6, changeFrequency: 'monthly' },
  { path: '/systems',                      priority: 0.8, changeFrequency: 'monthly' },
  { path: '/systems/agent-bureau',         priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/restaurant-os',        priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/taxkontrol',           priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/handwerk-os',          priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/praxis-os',            priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/printshop-os',         priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/publishing-os',        priority: 0.7, changeFrequency: 'monthly' },
  // care-os and real-estate-os moved from /products/<slug> to /systems/<slug>
  // 2026-07-26 (LANDINGENGINE CONSOLIDATION) — legacy /products/<slug> paths
  // now permanently redirect (next.config.ts) and are intentionally not
  // listed here, matching the other six systems above.
  { path: '/systems/care-os',              priority: 0.7, changeFrequency: 'monthly' },
  { path: '/systems/real-estate-os',       priority: 0.7, changeFrequency: 'monthly' },
  { path: '/products',                     priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing',                      priority: 0.6, changeFrequency: 'monthly' },
  { path: '/case-studies',                 priority: 0.6, changeFrequency: 'monthly' },
  { path: '/ai-websites',                  priority: 0.6, changeFrequency: 'monthly' },
  { path: '/automation-lab',               priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact',                      priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog',                         priority: 0.6, changeFrequency: 'weekly' },
  { path: '/impressum',                    priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy',                      priority: 0.3, changeFrequency: 'yearly' },
  { path: '/agb',                          priority: 0.3, changeFrequency: 'yearly' },
]

function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: languageAlternates(route.path) },
      })
    }
  }

  // Blog posts are locale-specific — one post per locale per slug, and a
  // DE post is not guaranteed to share a slug with its EN counterpart —
  // so these are listed per-locale without a cross-locale hreflang
  // alternate (unlike the static routes above).
  for (const locale of LOCALES) {
    for (const post of getPublishedPosts(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
  }

  return entries
}
