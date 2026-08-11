import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'
import Hero from '@/components/Hero'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getLatestPosts } from '@/lib/blog/posts'
import { PainSlider } from '@/components/ui/PainSlider'
import { PainCards } from '@/components/homepage/PainCards'
import { SystemsTabs } from '@/components/homepage/SystemsTabs'
import { ProofMetrics } from '@/components/homepage/ProofMetrics'
import type { ProofMetric } from '@/components/homepage/ProofMetrics'
import { TeamTrust } from '@/components/homepage/TeamTrust'
import { FaqAccordion } from '@/components/homepage/FaqAccordion'
import { AgentBureauSection } from '@/components/homepage/AgentBureauSection'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  // Bare page title, root layout's `%s | Maxpromo Digital` template appends
  // the brand suffix. Previously this string already included the brand
  // prefix itself, producing a doubled "... | Maxpromo Digital | Maxpromo
  // Digital" <title> tag.
  const title = isDE
    ? 'KI-Business-Systeme aus Essen'
    : 'AI Business Systems Built in Essen'
  const description = isDE
    ? 'Wir modernisieren veraltete Websites, automatisieren Workflows und installieren KI-gestützte Betriebssysteme für Restaurants, Handwerk, Praxen und mehr.'
    : 'We modernize legacy websites, automate workflows, and install AI-powered operating systems for restaurants, trades, medical practices and more.'
  // og:title / twitter:title are shown as-is by social crawlers (no template
  // applied), og:site_name already carries the brand there, but keeping the
  // full framing here matches the page's prior social-facing copy.
  const ogTitle = isDE
    ? 'Maxpromo Digital | KI-Business-Systeme aus Essen'
    : 'Maxpromo Digital | AI Business Systems Built in Essen'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}`,
      languages: {
        de: 'https://www.maxpromo.digital/de',
        en: 'https://www.maxpromo.digital/en',
      },
    },
    openGraph: {
      title: ogTitle,
      description,
      url: `https://www.maxpromo.digital/${locale}`,
      images: [{ url: '/images/seo/maxpromo-digital-og.png', width: 1200, height: 630, alt: 'Maxpromo Digital' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['/images/seo/maxpromo-digital-og.png'],
    },
  }
}

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', lineHeight: 1.1, marginBottom: 0 }}>
      {children}
    </h2>
  )
}

/* ─── PAGE ─── */

export default async function HomePage() {
  const locale = await getLocale()

  // ── Showcase dispatch ─────────────────────────────────────────────────
  // Middleware stamps x-mp-mode + x-mp-slug for every request.
  // When a product domain hits this page (e.g. restaurant-os.de/),
  // render LandingEngine instead of the hub homepage.
  const h    = await headers()
  const mode = h.get('x-mp-mode')
  const slug = h.get('x-mp-slug')

  if (mode === 'showcase' && slug) {
    const data = getLandingData(slug, locale)
    if (!data) return notFound()
    return <LandingEngine data={data} />
  }
  // ── Hub homepage (unchanged below) ───────────────────────────────────

  const t            = await getTranslations('home')
  const tProcess     = await getTranslations('home.process')
  const tWhyUs       = await getTranslations('home.whyUs')
  const tProof       = await getTranslations('home.proof')
  const tSystemsTabs = await getTranslations('home.systemsTabs')
  const tLegacy      = await getTranslations('home.legacy')
  const tPhilosophy  = await getTranslations('home.philosophy')
  const tBlog        = await getTranslations('blog')

  const latestPosts = getLatestPosts(locale, 3)

  const WHY_REFS   = ['w1', 'w2', 'w3', 'w4'] as const
  const PROOF_REFS = ['p1', 'p2', 'p3'] as const
  const PROCESS_REFS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const

  const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'

  return (
    <>
      <main>

      {/* 1, Hero (LOCKED) */}
      <Hero />

      {/* Pain Slider, rotating problem strip below hero */}
      <PainSlider />

      {/* 2, Pain Cards */}
      <PainCards />

      {/* 3, Proof strip */}
      <section data-section="proof" style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tProof('eyebrow')}</SectionLabel>
              <SectionTitle>{tProof('title')}</SectionTitle>
            </div>
            <Link href="/case-studies" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tProof('viewAll')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '44rem' }}>
            {tProof('subtitle')}
          </p>
          <ProofMetrics
            metrics={PROOF_REFS.map((id): ProofMetric => ({
              id,
              value:  tProof(`${id}Value`),
              label:  tProof(`${id}Label`),
              source: tProof(`${id}Source`),
            }))}
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1rem', letterSpacing: '0.05em' }}>
            {tProof('note')}
          </p>
        </div>
      </section>

      {/* 4a, Legacy modernization */}
      <section data-section="legacy" style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '52rem', marginBottom: '3rem' }}>
            <SectionLabel>{tLegacy('eyebrow')}</SectionLabel>
            <SectionTitle>{tLegacy('title')}</SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.75, marginTop: '1rem' }}>
              {tLegacy('subtitle')}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((id) => (
              <div key={id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                  {tLegacy(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {tLegacy(`${id}Pain`)}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', lineHeight: 1.6, margin: 0, paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                  → {tLegacy(`${id}System`)}
                </p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '52rem', margin: 0 }}>
              {tLegacy('closing')}
            </p>
            <Link href="/contact" className="btn btn-primary" style={{ flexShrink: 0 }}>
              {tLegacy('cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4, Systems tabs */}
      <section data-section="systems" style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tSystemsTabs('eyebrow')}</SectionLabel>
              <SectionTitle>
                {tSystemsTabs('title')}{' '}
                <span style={{ color: 'var(--color-primary)' }}>{tSystemsTabs('titleAccent')}</span>
              </SectionTitle>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: '10px', lineHeight: 1.7 }}>
                {tSystemsTabs('subtitle')}
              </p>
            </div>
            <Link href="/systems" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tSystemsTabs('viewAll')} →
            </Link>
          </div>
          <SystemsTabs />
        </div>
      </section>

      {/* 4b, Max Agent Bureau — redesigned two-column hero + orchestration
          diagram + compact workflow + grouped capability panels, extracted
          into its own component (see components/homepage/AgentBureauSection.tsx) */}
      <AgentBureauSection locale={locale} />

      {/* 5, Why Maxpromo */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '44rem' }}>
            <SectionLabel>{tWhyUs('eyebrow')}</SectionLabel>
            <SectionTitle>
              {tWhyUs('title')}{' '}
              <span style={{ color: 'var(--color-primary)' }}>{tWhyUs('titleAccent')}</span>
            </SectionTitle>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2">
            {WHY_REFS.map((id) => (
              <div key={id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '18px', flexShrink: 0, paddingTop: '2px' }}>✓</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', marginBottom: '8px' }}>
                    {tWhyUs(`${id}Title`)}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
                    {tWhyUs(`${id}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6, Team trust */}
      <TeamTrust />

      {/* 6a, Philosophy */}
      <section data-section="philosophy" style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto', display: 'grid', gap: '4rem' }} className="grid-cols-1 lg:grid-cols-2">
          <div>
            <SectionLabel>{tPhilosophy('eyebrow')}</SectionLabel>
            <SectionTitle>{tPhilosophy('title')}</SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.85, marginTop: '1.5rem', whiteSpace: 'pre-line' }}>
              {tPhilosophy('body')}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-primary)', marginTop: '2rem', letterSpacing: '0.03em' }}>
              → {tPhilosophy('closing')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            {(['step1', 'step2', 'step3', 'step4', 'step5'] as const).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '18px 24px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-primary)', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '4px', padding: '3px 8px', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                  {tPhilosophy(s)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7, How we work */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>{tProcess('processEyebrow')}</SectionLabel>
            <SectionTitle>{tProcess('processTitle')}</SectionTitle>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_REFS.map((id, i) => (
              <div key={id} style={{ background: 'var(--color-bg)', padding: '2rem 1.75rem', position: 'relative' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '48px', lineHeight: 1, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                  {tProcess(`${id}Num`)}
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', padding: '2px 7px', display: 'inline-block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  {tProcess(`${id}Time`)}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', marginBottom: '8px', lineHeight: 1.3 }}>
                  {tProcess(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {tProcess(`${id}Desc`)}
                </p>
                {i < PROCESS_REFS.length - 1 && (
                  <span className="hidden lg:block" style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', fontSize: '14px', zIndex: 1 }}>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8, FAQ */}
      <FaqAccordion />

      {/* 9, Latest insights (only when posts exist) */}
      {latestPosts.length > 0 && (
        <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              <div>
                <SectionLabel>{tBlog('homepageEyebrow')}</SectionLabel>
                <SectionTitle>
                  {tBlog('homepageTitle')}{' '}
                  <span style={{ color: 'var(--color-primary)' }}>{tBlog('homepageTitleAccent')}</span>
                </SectionTitle>
              </div>
              <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
                {tBlog('homepageViewAll')} →
              </Link>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                  <article className="card mp-card-hover" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 0 }}>
                    {post.featuredImage && (
                      <div className="mp-img-wrap" style={{ position: 'relative', aspectRatio: '16/9' }}>
                        <Image src={post.featuredImage} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      </div>
                    )}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {post.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {post.tags.map((tag) => (
                            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-primary)', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '19px', letterSpacing: '-0.01em', color: 'var(--color-text-primary)', lineHeight: 1.35, margin: 0 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                        {post.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>{post.publishedAt}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>{tBlog('readArticle')}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10, Final CTA */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(5rem, 10vw, 9.5rem) 2rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>{t('finalCtaEyebrow')}</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
              marginTop: '0.5rem',
              lineHeight: 1.15,
            }}
          >
            {t('finalCtaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
            {t('finalCtaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Link href="/contact" className="btn btn-primary">
              {t('finalCtaPrimary')}
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              {t('finalCtaSecondary')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
            {t('finalCtaFootnote')}
          </p>
        </div>
      </section>

      </main>
    </>
  )
}
