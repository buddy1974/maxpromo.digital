/**
 * lib/blog/posts.ts
 *
 * Blog content adapter — single source of truth for all blog post helpers.
 *
 * Data source: content/blog/{locale}/*.mdx — scanned by lib/blog/mdx-loader.ts
 * The public API (helpers below) is stable; callers never touch raw data.
 *
 * Only posts with status: 'published' appear publicly.
 * All posts are locale-specific — one post per locale per slug.
 */

import { getAllPosts } from './mdx-loader'

// =============================================================================
// TYPES
// =============================================================================

export interface BlogPost {
  // Core
  slug:         string
  locale:       string
  title:        string
  excerpt:      string
  content:      string            // raw MDX body string
  featuredImage: string | null
  tags:         string[]
  publishedAt:  string            // ISO 8601 — e.g. '2026-05-25'
  status:       'published' | 'draft'

  // Optional existing
  readCount?:   number
  relatedSystem?: string          // ProductEntry slug

  // Extended SEO / meta
  metaTitle?:       string        // overrides title in <title> tag
  metaDescription?: string        // meta description
  keywords?:        string[]
  category?:        string        // e.g. 'Joomla Rescue'
  readTime?:        number        // minutes — auto-computed by loader if absent
  author?:          string        // default 'Maxpromo Digital'

  // FAQ — structured data prep (schema rendering in Phase 6)
  faq?: Array<{ q: string; a: string }>
}

// =============================================================================
// HELPERS  (public API — signatures unchanged)
// =============================================================================

/** All published posts for a locale, newest first. */
export function getPublishedPosts(locale: string): BlogPost[] {
  return getAllPosts()
    .filter(p => p.status === 'published' && p.locale === locale)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/** Latest N published posts for a locale — used on homepage. */
export function getLatestPosts(locale: string, count = 3): BlogPost[] {
  return getPublishedPosts(locale).slice(0, count)
}

/** Single post by slug + locale. Null if not found or not published. */
export function getPostBySlug(slug: string, locale: string): BlogPost | null {
  return (
    getAllPosts().find(
      p => p.slug === slug && p.locale === locale && p.status === 'published',
    ) ?? null
  )
}

/** All unique tags across published posts for a locale. */
export function getPublishedTags(locale: string): string[] {
  const all = getPublishedPosts(locale).flatMap(p => p.tags)
  return [...new Set(all)].sort()
}

/** Related posts — same locale, shares at least one tag, not the current slug. */
export function getRelatedPosts(current: BlogPost, count = 3): BlogPost[] {
  return getPublishedPosts(current.locale)
    .filter(
      p =>
        p.slug !== current.slug &&
        p.tags.some(tag => current.tags.includes(tag)),
    )
    .slice(0, count)
}
