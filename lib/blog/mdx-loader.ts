/**
 * lib/blog/mdx-loader.ts
 *
 * Server-only filesystem loader. Scans content/blog/{locale}/*.mdx,
 * parses frontmatter with gray-matter, computes readTime if absent,
 * and returns BlogPost[]. Results are cached in-process.
 *
 * Do NOT import from client components.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { BlogPost } from './posts'

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'blog')

// In-process cache — reset on hot-reload / redeploy
const cache = new Map<string, BlogPost[]>()

// ---------------------------------------------------------------------------

function parseFile(filePath: string, locale: string): BlogPost | null {
  try {
    const raw            = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    if (!data.slug || !data.title) return null

    const rt: number = data.readTime
      ? Number(data.readTime)
      : Math.max(1, Math.ceil(readingTime(content).minutes))

    return {
      slug:             String(data.slug),
      locale:           String(data.locale ?? locale),
      title:            String(data.title),
      excerpt:          data.excerpt ? String(data.excerpt) : '',
      content,                                // raw MDX body (everything after frontmatter)
      featuredImage:    data.featuredImage ?? null,
      tags:             Array.isArray(data.tags) ? (data.tags as unknown[]).map(String) : [],
      publishedAt:      String(data.publishedAt ?? new Date().toISOString().split('T')[0]),
      status:           data.status === 'published' ? 'published' : 'draft',
      relatedSystem:    data.relatedSystem ? String(data.relatedSystem) : undefined,
      // Extended SEO / meta fields
      metaTitle:        data.metaTitle        ? String(data.metaTitle)        : undefined,
      metaDescription:  data.metaDescription  ? String(data.metaDescription)  : undefined,
      keywords:         Array.isArray(data.keywords)
                          ? (data.keywords as unknown[]).map(String)
                          : undefined,
      category:         data.category         ? String(data.category)         : undefined,
      readTime:         rt,
      author:           data.author           ? String(data.author)           : 'Maxpromo Digital',
      faq: Array.isArray(data.faq)
        ? (data.faq as Array<{q: unknown; a: unknown}>).map(item => ({
            q: String(item?.q ?? ''),
            a: String(item?.a ?? ''),
          })).filter(item => item.q && item.a)
        : undefined,
    }
  } catch {
    return null
  }
}

function loadLocale(locale: string): BlogPost[] {
  const dir = path.join(CONTENT_ROOT, locale)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => parseFile(path.join(dir, f), locale))
    .filter((p): p is BlogPost => p !== null)
}

// ---------------------------------------------------------------------------

/** Returns all posts across all locales. Cached per process. */
export function getAllPosts(): BlogPost[] {
  const key = 'all'
  if (cache.has(key)) return cache.get(key)!

  const posts = [...loadLocale('de'), ...loadLocale('en')]
  cache.set(key, posts)
  return posts
}

/** Clear the in-process cache (useful in dev tooling or tests). */
export function clearBlogCache(): void {
  cache.clear()
}
