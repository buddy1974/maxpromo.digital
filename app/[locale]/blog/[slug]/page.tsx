import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getPostBySlug, getRelatedPosts } from '@/lib/blog/posts'
import { PRODUCTS } from '@/lib/registry/products'

// =============================================================================
// METADATA
// =============================================================================

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  // Locale from URL is not accessible here without next-intl helpers;
  // default to 'en' for metadata — SEO bots follow canonical anyway.
  const post = getPostBySlug(slug, 'en') ?? getPostBySlug(slug, 'de')
  if (!post) return { title: 'Not found' }
  return {
    title: `${post.title} — Maxpromo Digital`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  }
}

// =============================================================================
// PAGE
// =============================================================================

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params
  const locale   = await getLocale()
  const t        = await getTranslations('blog')

  const post = getPostBySlug(slug, locale)
  if (!post) notFound()

  const relatedPosts    = getRelatedPosts(post, 3)
  const relatedProduct  = post.relatedSystem
    ? PRODUCTS.find(p => p.slug === post.relatedSystem)
    : null

  const relatedHeadline = relatedProduct
    ? (locale === 'de' && relatedProduct.headline.de
        ? relatedProduct.headline.de
        : relatedProduct.headline.en)
    : null

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', paddingTop: '120px', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem' }}>

        {/* Back link */}
        <Link
          href="/blog"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'hsl(40 12% 65%)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            display: 'inline-block',
            marginBottom: '2.5rem',
          }}
        >
          {t('backToAll')}
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: '#F97316',
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.15)',
                  padding: '3px 10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '-0.04em',
            color: 'hsl(40 30% 96%)',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
          }}
        >
          {post.title}
        </h1>

        {/* Excerpt */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'hsl(40 12% 65%)',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
            borderLeft: '2px solid #F97316',
            paddingLeft: '1rem',
          }}
        >
          {post.excerpt}
        </p>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>
            {t('publishedOn')} {post.publishedAt}
          </span>
          {post.readCount !== undefined && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>
              {post.readCount} {t('readCount')}
            </span>
          )}
        </div>

        {/* Featured image */}
        {post.featuredImage && (
          <div
            style={{
              position: 'relative',
              aspectRatio: '16/9',
              overflow: 'hidden',
              marginBottom: '2.5rem',
              borderRadius: '2px',
            }}
          >
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          </div>
        )}

        {/* Body content */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '17px',
            color: 'hsl(40 12% 75%)',
            lineHeight: 1.85,
            marginBottom: '3rem',
          }}
          className="blog-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '3rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t('shareLabel')}
          </span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://maxpromo.digital/${locale}/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.05em', textDecoration: 'none' }}
          >
            X / Twitter →
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://maxpromo.digital/${locale}/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.05em', textDecoration: 'none' }}
          >
            LinkedIn →
          </a>
        </div>

        {/* Related system CTA */}
        {relatedProduct && (
          <div
            style={{
              background: 'hsl(240 12% 7%)',
              border: '1px solid rgba(249,115,22,0.2)',
              padding: '2rem',
              marginBottom: '3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
              {t('relatedTitle')}
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'hsl(40 30% 96%)', margin: 0 }}>
              {relatedProduct.name}
              {relatedHeadline && (
                <span style={{ fontWeight: 400, color: 'hsl(40 12% 65%)', fontSize: '1rem' }}>
                  {' '}— {relatedHeadline}
                </span>
              )}
            </p>
            <Link
              href={relatedProduct.landingUrl}
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: '#F97316',
                color: '#000',
                padding: '11px 20px',
                textDecoration: 'none',
                display: 'inline-block',
                alignSelf: 'flex-start',
              }}
            >
              {t('relatedCta')}
            </Link>
          </div>
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              {t('relatedPostsTitle')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  style={{
                    background: 'hsl(240 12% 7%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '1.25rem 1.5rem',
                    textDecoration: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', color: 'hsl(40 30% 96%)' }}>
                    {rp.title}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', flexShrink: 0 }}>
                    {t('readArticle')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: '4rem',
            padding: '3rem 2rem',
            background: 'hsl(240 14% 4%)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('bottomCtaEyebrow')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', marginBottom: '1.5rem' }}>
            {t('bottomCtaTitle')}
          </h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/automation-audit"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: '#F97316',
                color: '#000',
                padding: '13px 22px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {t('bottomCtaPrimary')}
            </Link>
            <Link
              href="/contact"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '13px 22px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {t('bottomCtaSecondary')}
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
