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
    <main style={{ background: '#0A0A0A', minHeight: '100vh', paddingTop: '120px', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem', maxWidth: '640px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('indexEyebrow')}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              lineHeight: 1.1,
              marginBottom: '1rem',
            }}
          >
            {t('indexTitle')}{' '}
            <span style={{ color: '#F97316' }}>{t('indexTitleAccent')}</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
            {t('indexLede')}
          </p>
        </div>

        {/* Tag filters, only render if posts exist */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '3rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#F97316',
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.25)',
                padding: '5px 14px',
                letterSpacing: '0.05em',
              }}
            >
              {t('filterAll')}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'hsl(40 12% 65%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '5px 14px',
                  letterSpacing: '0.05em',
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', letterSpacing: '0.1em', marginBottom: '2rem' }}>
              {t('emptyTitle')}
            </p>
            <div
              style={{ display: 'grid', gap: '1.5rem' }}
              className="grid-cols-1 md:grid-cols-2"
            >
              {placeholders.map((card, i) => (
                <article
                  key={i}
                  style={{
                    background: 'hsl(240 12% 7%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: 0.75,
                  }}
                >
                  <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                      {card.tag}
                    </span>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em', color: 'hsl(40 30% 96%)', lineHeight: 1.35, margin: 0 }}>
                      {card.title}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                      {card.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>
                        {card.readTime}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>
                        {t('readArticle')}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <Link
                href="/automation-audit"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F97316', color: '#000', padding: '12px 22px', textDecoration: 'none', display: 'inline-block' }}
              >
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
                <article
                  style={{
                    background: 'hsl(240 12% 7%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    transition: 'border-color 200ms ease',
                  }}
                  className="blog-card"
                >
                  {/* Featured image */}
                  {post.featuredImage && (
                    <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
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
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              color: '#F97316',
                              background: 'rgba(249,115,22,0.08)',
                              border: '1px solid rgba(249,115,22,0.15)',
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
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em', color: 'hsl(40 30% 96%)', lineHeight: 1.35, margin: 0 }}>
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                      {post.excerpt}
                    </p>

                    {/* Footer row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>
                        {post.publishedAt}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.05em' }}>
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
