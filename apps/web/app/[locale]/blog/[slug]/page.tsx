import type { Metadata } from 'next'
import { THIRD_PARTY } from '@/lib/third-party-brands'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { evaluate } from '@mdx-js/mdx'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { getPostBySlug, getPublishedPosts } from '@/lib/blog/posts'

// =============================================================================
// STATIC PARAMS
// =============================================================================

export function generateStaticParams() {
  const slugs = new Set([
    ...getPublishedPosts('de').map(p => p.slug),
    ...getPublishedPosts('en').map(p => p.slug),
  ])
  return [...slugs].map(slug => ({ slug }))
}

// =============================================================================
// METADATA + JSON-LD
// =============================================================================

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const post = getPostBySlug(slug, locale) ?? getPostBySlug(slug, locale === 'de' ? 'en' : 'de')
  if (!post) return { title: 'Not found', robots: { index: false, follow: false } }

  const title       = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt
  // Absolute https://www. canonical — a bare-domain canonical here previously
  // caused a canonical→308→canonical redirect ping-pong when Facebook's
  // crawler scraped article URLs (confirmed via Sharing Debugger).
  const canonical   = `https://www.maxpromo.digital/${locale}/blog/${post.slug}`
  const images      = post.featuredImage ? [{ url: post.featuredImage, alt: title }] : []

  // Only advertise a language alternate when a published post with the same
  // slug genuinely exists in the other locale — never link to a 404.
  const otherLocale    = locale === 'de' ? 'en' : 'de'
  const hasOtherLocale = getPostBySlug(post.slug, otherLocale) !== null
  const languages = hasOtherLocale
    ? {
        [locale]:      canonical,
        [otherLocale]: `https://www.maxpromo.digital/${otherLocale}/blog/${post.slug}`,
      }
    : undefined

  return {
    title,
    description,
    keywords:    post.keywords,
    alternates:  { canonical, ...(languages ? { languages } : {}) },
    openGraph: {
      type:          'article',
      title,
      description,
      url:           canonical,
      images,
      publishedTime: post.publishedAt,
      authors:       [post.author ?? 'Maxpromo Digital'],
      locale:        locale === 'de' ? 'de_DE' : 'en_US',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      post.featuredImage ? [post.featuredImage] : [],
    },
  }
}

// =============================================================================
// MDX COMPONENT MAP, dark Maxpromo aesthetic
// =============================================================================

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 style={{ marginTop: '2.5rem', marginBottom: '0.75rem' }} {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="h-card" style={{ marginTop: '2rem', marginBottom: '0.5rem' }} {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.75, marginBottom: '1.25rem', marginTop: 0 }} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', color: 'var(--color-text-secondary)' }} {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', color: 'var(--color-text-secondary)' }} {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ fontFamily: 'var(--font-body)', fontSize: '18px', lineHeight: 1.75, marginBottom: '0.35rem' }} {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote style={{ borderLeft: '2px solid var(--color-primary)', paddingLeft: '1.25rem', marginLeft: 0, marginRight: 0, marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }} {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', background: 'var(--color-bg-section)', padding: '2px 6px', color: 'var(--color-text-primary)', borderRadius: '4px' }} {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '1.25rem', overflow: 'auto', marginBottom: '1.5rem' }} {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a style={{ color: 'var(--brand-text-secondary)', textDecoration: 'none' }} {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ color: 'var(--color-text-primary)', fontWeight: 700 }} {...props} />
  ),

  // Inline article CTA block, placed in MDX above "Continue reading"
  BlogArticleCTA: ({ locale: l = 'en' }: { locale?: string }) => {
    const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '4915901234567'
    const msg = encodeURIComponent(
      l === 'de'
        ? 'Hallo, ich möchte Kontakt aufnehmen.'
        : 'Hi, I would like to contact Maxpromo.'
    )
    return (
      <div style={{ background: 'var(--color-bg-section)', border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)', borderRadius: 'var(--radius-card)', padding: '2rem', margin: '2.5rem 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
          {l === 'de' ? 'Kontakt' : 'Contact'}
        </p>
        <h3 style={{ margin: 0 }}>
          {l === 'de' ? 'Noch eine alte Website im Einsatz?' : 'Still running an old website?'}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
          {l === 'de'
            ? 'Zeigen Sie uns Ihre aktuelle Website, Ihr CMS, Ihren Workflow oder manuellen Prozess. Wir identifizieren, was modernisiert, automatisiert oder transformiert werden kann.'
            : 'Show us your current website, CMS, workflow, online shop or manual process. We identify what can be modernized, automated or transformed.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
          <Link href="/contact" className="btn btn-primary">
            {l === 'de' ? 'Kontakt aufnehmen →' : 'Contact us →'}
          </Link>
          <a
            href={`https://wa.me/${wa}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.02em', background: THIRD_PARTY.whatsappTint, color: 'var(--brand-text-inverted)', border: '1px solid ${THIRD_PARTY.whatsappTint}', padding: '13px 24px', borderRadius: 'var(--radius-card)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            WhatsApp Maxpromo →
          </a>
        </div>
      </div>
    )
  },
}

// =============================================================================
// RELATED SERVICES, static tiles
// =============================================================================

const SERVICES = [
  { key: 'svc1', href: '/solutions/workflow-automation' },
  { key: 'svc2', href: '/solutions/websites-platforms' },
  { key: 'svc3', href: '/solutions/ai-agents' },
] as const

// =============================================================================
// PAGE
// =============================================================================

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug }   = await params
  const locale     = await getLocale()
  const t          = await getTranslations('blog')

  const post = getPostBySlug(slug, locale)
  if (!post) notFound()

  // MDX evaluation, server-side, no client bundle
  const { default: MDXContent } = await evaluate(post.content, {
    Fragment,
    jsx:  jsx  as Parameters<typeof evaluate>[1]['jsx'],
    jsxs: jsxs as Parameters<typeof evaluate>[1]['jsxs'],
  })


  // JSON-LD
  const articleUrl = `https://www.maxpromo.digital/${locale}/blog/${post.slug}`
  const jsonLd = {
    '@context':        'https://schema.org',
    '@type':           'Article',
    headline:          post.title,
    description:       post.metaDescription ?? post.excerpt,
    datePublished:     post.publishedAt,
    inLanguage:        locale,
    author:            { '@type': 'Organization', name: post.author ?? 'Maxpromo Digital' },
    publisher:         {
      '@type': 'Organization',
      name:    'Maxpromo Digital',
      url:     'https://www.maxpromo.digital',
      logo:    { '@type': 'ImageObject', url: 'https://www.maxpromo.digital/logo.png' },
    },
    url:               articleUrl,
    mainEntityOfPage:  { '@type': 'WebPage', '@id': articleUrl },
    ...(post.featuredImage ? { image: `https://www.maxpromo.digital${post.featuredImage}` } : {}),
    ...(post.keywords?.length ? { keywords: post.keywords.join(', ') } : {}),
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '491234567890'
  const whatsappMsg    = encodeURIComponent(t('whatsappMsg'))
  const whatsappHref   = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: '6rem' }}>

        {/* ─────────────────────────────────────────────── */}
        {/* 1. HERO                                         */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem' }}>

          <Link
            href="/blog"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', textDecoration: 'none', letterSpacing: '0.05em', display: 'inline-block', marginBottom: '2.5rem' }}
          >
            {t('backToAll')}
          </Link>

          {/* Category eyebrow */}
          {(post.category ?? post.tags[0]) && (
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px', marginTop: 0 }}>
              {post.category ?? post.tags[0]}
            </p>
          )}

          {/* H1 */}
          <h1 style={{ marginBottom: '1.5rem', marginTop: 0 }}>
            {post.title}
          </h1>

          {/* Meta row: date · read time · author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
              {t('publishedOn')} {post.publishedAt}
            </span>
            {post.readTime && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                {post.readTime} {t('readTimeMin')}
              </span>
            )}
            {post.author && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                {t('authorBy')} {post.author}
              </span>
            )}
          </div>

        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 2. INTRO, excerpt + featured image             */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem' }}>

          {post.excerpt && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                marginBottom: '2rem',
                borderLeft: '2px solid var(--color-primary)',
                paddingLeft: '1.25rem',
                marginTop: 0,
              }}
            >
              {post.excerpt}
            </p>
          )}

          {post.featuredImage && (
            <div
              style={{
                position: 'relative',
                aspectRatio: '16/9',
                overflow: 'hidden',
                marginBottom: '2.5rem',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--color-border)',
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

        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 3. ARTICLE BODY, MDX                           */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem', marginBottom: '4rem' }}>
          <MDXContent components={mdxComponents} />
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 4. CTA BLOCK, audit                            */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem', marginBottom: '5rem' }}>
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
              {t('bottomCtaEyebrow')}
            </p>
            <h2 style={{ margin: 0 }}>
              {t('ctaBlockTitle')}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {t('ctaBlockBody')}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              <Link href="/contact" className="btn btn-primary">
                {t('bottomCtaPrimary')}
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                {t('bottomCtaSecondary')}
              </Link>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 5. RELATED SERVICES, 3 service tiles           */}
        {/* ─────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto', padding: '0 2rem' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', marginTop: 0 }}>
              {t('relatedServicesEyebrow')}
            </p>
            <h2 style={{ marginBottom: '2.5rem', marginTop: 0 }}>
              {t('relatedServicesTitle')}
            </h2>
            <div
              style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}
              className="grid-cols-1 md:grid-cols-3"
            >
              {SERVICES.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    className="service-card"
                    style={{
                      background: 'var(--color-bg)',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      height: '100%',
                      borderTop: '2px solid transparent',
                    }}
                  >
                    <h3 className="h-card" style={{ margin: 0 }}>
                      {t(`${key}Title` as Parameters<typeof t>[0])}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0, flex: 1 }}>
                      {t(`${key}Desc` as Parameters<typeof t>[0])}
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em', marginTop: 'auto' }}>
                      {t(`${key}Cta` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────── */}
        {/* 7. WHATSAPP CTA                                 */}
        {/* ─────────────────────────────────────────────── */}
        <section style={{ background: 'var(--color-bg-section)', borderTop: '1px solid var(--color-border)', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              {t('whatsappEyebrow')}
            </p>
            <h2 style={{ marginBottom: '1.75rem', marginTop: 0 }}>
              {t('whatsappTitle')}
            </h2>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: THIRD_PARTY.whatsapp, color: 'var(--brand-text-inverted)' }}
            >
              {t('whatsappCta')}
            </a>
          </div>
        </section>

      </main>
    </>
  )
}/*xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx*/
