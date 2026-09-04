import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getPublishedPosts, getPublishedTags } from '@/lib/blog/posts'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

export default async function BlogIndexPage() {
  const locale       = await getLocale()
  const t            = await getTranslations('blog')
  const posts        = getPublishedPosts(locale)
  const tags         = getPublishedTags(locale)
  const placeholders = t.raw('placeholders') as Array<{ tag: string; title: string; excerpt: string; readTime: string }>

  return (
    <main style={{ background: 'var(--brand-background)', minHeight: '100vh', paddingTop: 'var(--section-y)', paddingBottom: 'var(--section-y)' }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '0 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem', maxWidth: '640px' }}>
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('indexEyebrow')}
          </p>
          <h1 style={{ marginBottom: '1rem' }}>
            {t('indexTitle')}{' '}
            <span>{t('indexTitleAccent')}</span>
          </h1>
          <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '18px', color: 'var(--brand-text-secondary)', lineHeight: 1.75, margin: 0 }}>
            {t('indexLede')}
          </p>
        </div>

        {/* Tag filters, only render if posts exist */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '3rem' }}>
            <span
              style={{
                fontFamily: 'var(--brand-font-mono)',
                fontSize: '12px',
                color: 'var(--brand-text-secondary)',
                background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)',
                padding: '6px 14px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}
            >
              {t('filterAll')}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--brand-font-mono)',
                  fontSize: '12px',
                  color: 'var(--brand-text-secondary)',
                  border: '1px solid var(--brand-border)',
                  background: 'var(--brand-background)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Article grid or placeholder cards */}
        {posts.length === 0 ? (
          <>
            <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.08em', marginBottom: '2rem' }}>
              {t('emptyTitle')}
            </p>
            <div
              style={{ display: 'grid', gap: '1.5rem' }}
              className="grid-cols-1 md:grid-cols-2"
            >
              {placeholders.map((card, i) => (
                <article key={i} className="card" style={{ display: 'flex', flexDirection: 'column', opacity: 0.7, padding: 0 }}>
                  <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <span style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)', padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                      {card.tag}
                    </span>
                    <h2 className="h-card" style={{ margin: 0 }}>
                      {card.title}
                    </h2>
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                      {card.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--brand-border)', marginTop: 'auto' }}>
                      <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>
                        {card.readTime}
                      </span>
                      <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>
                        {t('readArticle')}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <Link href="/contact" className="btn btn-primary">
                {t('bottomCtaPrimary')}
              </Link>
            </div>
          </>
        ) : (
          <div
            style={{ display: 'grid', gap: '1.5rem' }}
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <article className="card mp-card-hover" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 0 }}>
                  {/* Featured image */}
                  {post.featuredImage && (
                    <div className="mp-img-wrap" style={{ position: 'relative', aspectRatio: '16/9' }}>
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontFamily: 'var(--brand-font-sans)',
                              fontSize: 'var(--text-label)',
                              color: 'var(--brand-text-secondary)',
                              background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)',
                              border: '1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)',
                              padding: '2px 8px',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="h-card" style={{ margin: 0 }}>
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                      {post.excerpt}
                    </p>

                    {/* Footer row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--brand-border)', marginTop: 'auto' }}>
                      <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>
                        {post.publishedAt}
                      </span>
                      <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>
                        {t('readArticle')}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
