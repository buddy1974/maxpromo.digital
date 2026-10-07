import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog/posts'
import { canonicalUrl } from '@maxpromo/config'
import { currentDomain } from '@/lib/domains/server'

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
  { path: '',                                priority: 1.0, changeFrequency: 'weekly'  },

  // Solutions — one page per business problem.
  { path: '/solutions',                      priority: 0.9, changeFrequency: 'monthly' },
  { path: '/solutions/workflow-automation',  priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/custom-applications', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/web-development',      priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/content-operations',   priority: 0.7, changeFrequency: 'monthly' },
  { path: '/solutions/product-operations',   priority: 0.7, changeFrequency: 'monthly' },

  // Industries — one page per sector.
  { path: '/industries',                     priority: 0.9, changeFrequency: 'monthly' },
  { path: '/industries/healthcare',          priority: 0.7, changeFrequency: 'monthly' },
  { path: '/industries/construction',        priority: 0.7, changeFrequency: 'monthly' },
  { path: '/industries/property',            priority: 0.7, changeFrequency: 'monthly' },
  { path: '/industries/hospitality',         priority: 0.7, changeFrequency: 'monthly' },
  { path: '/industries/publishing',          priority: 0.7, changeFrequency: 'monthly' },
  { path: '/industries/professional-services', priority: 0.7, changeFrequency: 'monthly' },

  // Resources.
  { path: '/work',                           priority: 0.8, changeFrequency: 'monthly' },
  { path: '/work/maxpromo-os',               priority: 0.8, changeFrequency: 'monthly' },
  { path: '/friction-check',                 priority: 0.8, changeFrequency: 'monthly' },
  { path: '/resources/what-to-automate-first', priority: 0.7, changeFrequency: 'yearly'  },
  { path: '/resources',                      priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog',                           priority: 0.6, changeFrequency: 'weekly'  },

  // Agent Bureau is the one product marketed publicly from the hub. The
  // operating systems are protected products and are deliberately absent:
  // they are marketed on their own domains, which carry their own sitemaps.
  { path: '/agent-bureau',                   priority: 0.8, changeFrequency: 'monthly' },

  { path: '/about',                          priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact',                        priority: 0.6, changeFrequency: 'monthly' },
  // Retired 2026-10-06 and permanently redirected (next.config.ts): the five
  // legacy solution slugs, /case-studies, /automation-lab and /ai-websites.
  { path: '/impressum',                      priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/privacy',                        priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/agb',                          priority: 0.3, changeFrequency: 'yearly' },
]

function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
    // Matches the page heads (lib/seo/og.ts): German is the default.
    'x-default': `${SITE_URL}/de${path}`,
  }
}

/**
 * The product domains' sitemap.
 *
 * A product domain publishes what it serves and nothing else: its product
 * page, the consultation about it, and the operator's legal pages — the same
 * list the middleware admits, so the sitemap cannot drift from route
 * isolation without one of them being edited alone.
 *
 * Priorities say what they mean: the product page is the domain's reason to
 * exist, the contact page is the action, the legal pages are required rather
 * than promoted.
 */
const PRODUCT_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
]

/**
 * sitemap.xml — served per domain.
 *
 * Before v13.0 every one of the ten public hosts served the consultancy's
 * 62-URL sitemap, all of them maxpromo.digital addresses. A product domain
 * submitting the consultancy's URLs is submitting nothing about itself.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = await currentDomain()

  if (domain.sitemap === 'none') return []

  if (domain.mode === 'showcase') {
    const entries: MetadataRoute.Sitemap = []
    for (const route of PRODUCT_ROUTES) {
      for (const locale of domain.languages) {
        entries.push({
          url: canonicalUrl(domain, locale, route.path === '' ? '/' : route.path),
          lastModified: new Date(),
          changeFrequency: route.changeFrequency,
          priority: route.priority,
          // Only the languages this domain actually serves. A single-language
          // product advertising an hreflang it redirects away from is the same
          // defect as the mixed-language page, one layer out.
          alternates: domain.languages.length > 1
            ? {
                languages: Object.fromEntries(
                  domain.languages.map((l) => [l, canonicalUrl(domain, l, route.path === '' ? '/' : route.path)]),
                ),
              }
            : undefined,
        })
      }
    }
    return entries
  }

  const entries: MetadataRoute.Sitemap = []

  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        // No lastmod. The repository records no per-page modification date,
        // and the request time claimed every page changed on every fetch — a
        // signal search engines learn to ignore for the whole sitemap. An
        // absent date is honest; the blog's publication dates below are real.
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: languageAlternates(route.path) },
      })
    }
  }

  // Blog posts are locale-specific: a DE post is not guaranteed to have an
  // EN counterpart under the same slug. Where one is published, the pair is
  // declared exactly as the article's own head declares it (de, en,
  // x-default → de); where not, no alternate is claimed.
  const published = Object.fromEntries(
    LOCALES.map((l) => [l, new Set(getPublishedPosts(l).map((p) => p.slug))]),
  ) as Record<(typeof LOCALES)[number], Set<string>>
  for (const locale of LOCALES) {
    for (const post of getPublishedPosts(locale)) {
      const paired = LOCALES.every((l) => published[l].has(post.slug))
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.5,
        ...(paired ? { alternates: { languages: languageAlternates(`/blog/${post.slug}`) } } : {}),
      })
    }
  }

  return entries
}
