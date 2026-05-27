import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { evaluate } from '@mdx-js/mdx'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { getPostBySlug, getPublishedPosts } from '@/lib/blog/posts'
import { PUBLIC_PRODUCTS } from '@/lib/registry/products'
import { SystemCardCompact } from '@/components/systems/SystemCard/SystemCardCompact'

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
  if (!post) return { title: 'Not found' }

  const title       = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt
  const canonical   = `https://maxpromo.digital/${locale}/blog/${post.slug}`
  const images      = post.featuredImage ? [{ url: post.featuredImage }] : []

  return {
    title:       `${title} — Maxpromo Digital`,
    description,
    keywords:    post.keywords,
    alternates:  { canonical },
    openGraph: {
      type:          'article',
      title,
      description,
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
// MDX COMPONENT MAP — dark Maxpromo aesthetic
// =============================================================================

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', marginTop: '2.5rem', marginBottom: '0.75rem', lineHeight: 1.25 }} {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em', color: 'hsl(40 30% 96%)', marginTop: '2rem', marginBottom: '0.5rem', lineHeight: 1.3 }} {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 75%)', lineHeight: 1.85, marginBottom: '1.25rem', marginTop: 0 }} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', color: 'hsl(40 12% 75%)' }} {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', color: 'hsl(40 12% 75%)' }} {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ fontFamily: 'var(--font-body)', fontSize: '17px', lineHeight: 1.75, marginBottom: '0.35rem' }} {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote style={{ borderLeft: '2px solid #F97316', paddingLeft: '1.25rem', marginLeft: 0, marginRight: 0, marginBottom: '1.5rem', color: 'hsl(40 12% 65%)', fontStyle: 'italic' }} {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', color: 'hsl(40 30% 90%)', borderRadius: '2px' }} {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', background: 'hsl(240 12% 7%)', border: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem', overflow: 'auto', marginBottom: '1.5rem' }} {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a style={{ color: '#F97316', textDecoration: 'none' }} {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ color: 'hsl(40 30% 96%)', fontWeight: 700 }} {...props} />
  ),

  // Inline article CTA block — placed in MDX above "Continue reading"
  BlogArticleCTA: ({ locale: l = 'en' }: { locale?: string }) => {
    const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '4915901234567'
    const msg = encodeURIComponent(
      l === 'de'
        ? 'Hallo, ich interessiere mich für einen Business Systems Audit.'
        : 'Hi, I would like to request a Business Systems Audit.'
    )
    return (
      <div style={{ background: 'hsl(240 12% 7%)', border: '1px solid rgba(249,115,22,0.2)', padding: '2rem', margin: '2.5rem 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
          // {l === 'de' ? 'Kostenloser Audit' : 'Free audit'}
        </p>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', margin: 0, lineHeight: 1.2 }}>
          {l === 'de' ? 'Noch eine alte Website im Einsatz?' : 'Still running an old website?'}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
          {l === 'de'
            ? 'Zeigen Sie uns Ihre aktuelle Website, Ihr CMS, Ihren Workflow oder manuellen Prozess. Wir identifizieren, was modernisiert, automatisiert oder transformiert werden kann.'
            : 'Show us your current website, CMS, workflow, online shop or manual process. We identify what can be modernized, automated or transformed.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
          <a
            href="/automation-audit"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F97316', color: '#000', padding: '11px 18px', textDecoration: 'none', display: 'inline-block' }}
          >
            {l === 'de' ? 'Business Systems Audit anfordern →' : 'Request Business Systems Audit →'}
          </a>
          <a
            href={`https://wa.me/${wa}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)', padding: '11px 18px', textDecoration: 'none', display: 'inline-block' }}
          >
            WhatsApp Maxpromo →
          </a>
        </div>
      </div>
    )
  },
}

// =============================================================================
// RELATED SERVICES — static tiles
// =============================================================================

const SERVICES = [
  { key: 'svc1', href: '/services/workflow-automation' },
  { key: 'svc2', href: '/services/websites-platforms' },
  { key: 'svc3', href: '/services/ai-agents' },
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

  // MDX evaluation — server-side, no client bundle
  const { default: MDXContent } = await evaluate(post.content, {
    Fragment,
    jsx:  jsx  as Parameters<typeof evaluate>[1]['jsx'],
    jsxs: jsxs as Parameters<typeof evaluate>[1]['jsxs'],
  })

  // Related systems: relatedSystem first, then fill from PUBLIC_PRODUCTS
  const relatedSystemProducts = (() => {
    if (!post.relatedSystem) return [...PUBLIC_PRODUCTS].slice(0, 3)
    const primary = PUBLIC_PRODUCTS.find(p => p.slug === post.relatedSystem)
    const others  = PUBLIC_PRODUCTS.filter(p => p.slug !== post.relatedSystem).slice(0, 2)
    return primary ? [primary, ...others] : [...PUBLIC_PRODUCTS].slice(0, 3)
  })()

  // JSON-LD
  const jsonLd = {
    '@context':        'https://schema.org',
    '@type':           'Article',
    headline:          post.title,
    description:       post.metaDescription ?? post.excerpt,
    datePublished:     post.publishedAt,
    author:            { '@type': 'Organization', name: post.author ?? 'Maxpromo Digital' },
    publisher:         { '@type': 'Organization', name: 'Maxpromo Digital', url: 'https://maxpromo.digital' },
    url:               `https://maxpromo.digital/${locale}/blog/${post.slug}`,
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
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

      <main style={{ background: '#0A0A0A', minHeight: '100vh', paddingTop: '120px', paddingBottom: '6rem' }}>

        {/* ─────────────────────────────────────────────── */}
        {/* 1. HERO                                         */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem' }}>

          <Link
            href="/blog"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(40 12% 65%)', textDecoration: 'none', letterSpacing: '0.05em', display: 'inline-block', marginBottom: '2.5rem' }}
          >
            {t('backToAll')}
          </Link>

          {/* Category eyebrow */}
          {(post.category ?? post.tags[0]) && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              // {post.category ?? post.tags[0]}
            </p>
          )}

          {/* H1 */}
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              lineHeight: 1.15,
              marginBottom: '1.5rem',
              marginTop: 0,
            }}
          >
            {post.title}
          </h1>

          {/* Meta row: date · read time · author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 40%)', letterSpacing: '0.05em' }}>
              {t('publishedOn')} {post.publishedAt}
            </span>
            {post.readTime && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 40%)', letterSpacing: '0.05em' }}>
                {post.readTime} {t('readTimeMin')}
              </span>
            )}
            {post.author && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 40%)', letterSpacing: '0.05em' }}>
                {t('authorBy')} {post.author}
              </span>
            )}
          </div>

        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 2. INTRO — excerpt + featured image             */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem' }}>

          {post.excerpt && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                color: 'hsl(40 12% 65%)',
                lineHeight: 1.7,
                marginBottom: '2rem',
                borderLeft: '2px solid #F97316',
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

        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 3. ARTICLE BODY — MDX                           */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem', marginBottom: '4rem' }}>
          <MDXContent components={mdxComponents} />
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 4. CTA BLOCK — audit                            */}
        {/* ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 2rem', marginBottom: '5rem' }}>
          <div
            style={{
              background: 'hsl(240 14% 4%)',
              border: '1px solid rgba(249,115,22,0.2)',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
              {t('bottomCtaEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', margin: 0, lineHeight: 1.2 }}>
              {t('ctaBlockTitle')}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
              {t('ctaBlockBody')}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              <Link
                href="/automation-audit"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F97316', color: '#000', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }}
              >
                {t('bottomCtaPrimary')}
              </Link>
              <Link
                href="/contact"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }}
              >
                {t('bottomCtaSecondary')}
              </Link>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* 5. RELATED SERVICES — 3 service tiles           */}
        {/* ─────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px', marginTop: 0 }}>
              {t('relatedServicesEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', marginBottom: '2.5rem', marginTop: 0 }}>
              {t('relatedServicesTitle')}
            </h2>
            <div
              style={{ display: 'grid', gap: '1px', background: 'rgba(255,255,255,0.06)' }}
              className="grid-cols-1 md:grid-cols-3"
            >
              {SERVICES.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      background: 'hsl(240 12% 7%)',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      height: '100%',
                      borderTop: '2px solid rgba(249,115,22,0.25)',
                      transition: 'border-top-color 200ms ease',
                    }}
                    className="hover:!border-t-[#F97316]"
                  >
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', color: 'hsl(40 30% 96%)', margin: 0 }}>
                      {t(`${key}Title` as Parameters<typeof t>[0])}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0, flex: 1 }}>
                      {t(`${key}Desc` as Parameters<typeof t>[0])}
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.05em', marginTop: 'auto' }}>
                      {t(`${key}Cta` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────── */}
        {/* 6. RELATED SYSTEMS — SystemCardCompact grid     */}
        {/* ─────────────────────────────────────────────── */}
        {relatedSystemProducts.length > 0 && (
          <section style={{ paddingTop: '4rem', paddingBottom: '4rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px', marginTop: 0 }}>
                {t('relatedSystemsEyebrow')}
              </p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', marginBottom: '2.5rem', marginTop: 0 }}>
                {t('relatedSystemsTitle')}
              </h2>
              <div
                style={{ display: 'grid', gap: '1.25rem' }}
                className="grid-cols-1 md:grid-cols-3"
              >
                {relatedSystemProducts.map(product => (
                  <SystemCardCompact
                    key={product.slug}
                    product={product}
                    locale={locale}
                    showCTA
                    imageMode="cover"
                    source="blog-article"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────── */}
        {/* 7. WHATSAPP CTA                                 */}
        {/* ─────────────────────────────────────────────── */}
        <section style={{ background: 'hsl(240 14% 4%)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              {t('whatsappEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', marginBottom: '1.75rem', marginTop: 0 }}>
              {t('whatsappTitle')}
            </h2>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#25D366', color: '#000', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }}
            >
              {t('whatsappCta')}
            </a>
          </div>
        </section>

      </main>
    </>
  )
}
