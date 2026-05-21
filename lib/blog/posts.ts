/**
 * lib/blog/posts.ts
 *
 * Blog content adapter — single source of truth for all blog posts.
 *
 * Currently: static array (empty — no posts published yet).
 * Future: replace POSTS array with a Supabase fetch or CMS API call.
 *         The exported helper functions are the stable interface —
 *         callers never touch POSTS directly.
 *
 * Only posts with status: 'published' appear publicly.
 * All posts are locale-specific — one post per locale per slug.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface BlogPost {
  slug: string
  locale: string
  title: string
  excerpt: string
  content: string
  featuredImage: string | null
  tags: string[]
  publishedAt: string // ISO 8601 date string — e.g. '2026-05-21'
  status: 'published' | 'draft'
  readCount?: number
  relatedSystem?: string // ProductEntry slug — powers "related system" CTA on detail page
}

// =============================================================================
// DATA — replace with CMS fetch when ready
// =============================================================================

const POSTS: BlogPost[] = [
  // No posts yet. Add entries here or replace with Supabase query.
  // Example structure (do not uncomment — add real posts only):
  //
  // {
  //   slug: 'how-handwerk-os-saved-8-hours-a-week',
  //   locale: 'en',
  //   title: 'How HandwerkOS saved 8 hours a week for a Berlin electrician',
  //   excerpt: 'A look at what changed when we installed the job management system.',
  //   content: '...',
  //   featuredImage: '/images/blog/handwerk-case-1.jpg',
  //   tags: ['case-study', 'handwerk'],
  //   publishedAt: '2026-05-21',
  //   status: 'published',
  //   relatedSystem: 'handwerk-os',
  // },
]

// =============================================================================
// HELPERS
// =============================================================================

/** All published posts for a locale, newest first. */
export function getPublishedPosts(locale: string): BlogPost[] {
  return POSTS
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
    POSTS.find(p => p.slug === slug && p.locale === locale && p.status === 'published') ?? null
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
