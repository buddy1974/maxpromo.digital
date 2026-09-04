import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getLandingData } from '@/lib/registry/adapters/landing.adapter'
import { LandingEngine } from '@/components/landing/LandingEngine'
import Hero from '@/components/Hero'
import { Link } from '@/i18n/navigation'
import { Icon, SectionHeader } from '@maxpromo/ui'
import Image from 'next/image'
import { getLatestPosts } from '@/lib/blog/posts'
import { PainSlider } from '@/components/ui/PainSlider'
import { PainCards } from '@/components/homepage/PainCards'
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
    ? 'Business-Systeme aus Essen'
    : 'Business Systems, Built in Essen'
  const description = isDE
    ? 'Eine Software-Beratung aus Essen. Wir modernisieren veraltete Websites, verbinden Abläufe und bauen Betriebssysteme für Restaurants, Handwerk, Praxen und mehr.'
    : 'A software consultancy in Essen. We modernise legacy websites, connect workflows and build the operating systems that restaurants, trades and practices run on.'
  // og:title / twitter:title are shown as-is by social crawlers (no template
  // applied), og:site_name already carries the brand there, but keeping the
  // full framing here matches the page's prior social-facing copy.
  const ogTitle = isDE
    ? 'Maxpromo Digital — Business-Systeme aus Essen'
    : 'Maxpromo Digital — Business Systems, Built in Essen'
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

/* SectionLabel and SectionTitle were local wrappers duplicating what
   @maxpromo/ui already exports. They are gone; the shared SectionHeader is
   used directly at each call site. */

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
  const tRoutes = await getTranslations('home.routes')
  const tLegacy      = await getTranslations('home.legacy')
  const tPhilosophy  = await getTranslations('home.philosophy')
  const tBlog        = await getTranslations('blog')

  const latestPosts = getLatestPosts(locale, 3)

  const WHY_REFS   = ['w1', 'w2', 'w3', 'w4'] as const
  const PROOF_REFS = ['p1', 'p2', 'p3'] as const
  const PROCESS_REFS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const

  const SECTION_PADDING = 'var(--section-y) var(--section-x)'

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
      <section data-section="proof" style={{ background: 'var(--brand-background)', padding: SECTION_PADDING, borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <SectionHeader label={tProof('eyebrow')}>
                {tProof('title')}
              </SectionHeader>
            </div>
            <Link href="/case-studies" style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tProof('viewAll')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '44rem' }}>
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
          <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', marginTop: '1rem', letterSpacing: '0.05em' }}>
            {tProof('note')}
          </p>
        </div>
      </section>

      {/* 4a, Legacy modernization */}
      <section data-section="legacy" style={{ background: 'var(--brand-surface-subtle)', padding: SECTION_PADDING, borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
          <div style={{ maxWidth: '52rem', marginBottom: '3rem' }}>
            <SectionHeader label={tLegacy('eyebrow')}>
                {tLegacy('title')}
              </SectionHeader>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: 'var(--brand-text-secondary)', lineHeight: 1.75, marginTop: '1rem' }}>
              {tLegacy('subtitle')}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((id) => (
              <div key={id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 className="h-card" style={{ margin: 0 }}>
                  {tLegacy(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {tLegacy(`${id}Pain`)}
                </p>
                <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', lineHeight: 1.6, margin: 0, paddingTop: '10px', borderTop: '1px solid var(--brand-border)' }}>
                  → {tLegacy(`${id}System`)}
                </p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '16px', color: 'var(--brand-text-secondary)', lineHeight: 1.7, maxWidth: '52rem', margin: 0 }}>
              {tLegacy('closing')}
            </p>
            <Link href="/contact" className="btn btn-primary" style={{ flexShrink: 0 }}>
              {tLegacy('cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Where we work — the two ways into the site. Replaces the former
          systems showcase: the operating systems are protected products
          marketed on their own domains, not a public section of the
          consultancy site. A visitor arrives knowing either their sector or
          their problem, so those are the two doors offered. */}
      <section data-section="routes" className="section" style={{ background: 'var(--brand-background)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div style={{ maxWidth: '44rem', marginBottom: 'var(--space-8)' }}>
            <SectionHeader label={tRoutes('eyebrow')}>
                {tRoutes('title')}
              </SectionHeader>
            <p style={{ margin: 'var(--space-4) 0 0', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {tRoutes('lede')}
            </p>
          </div>

          <div className="route-grid">
            <Link href="/industries" className="route-cell">
              <p className="route-cell-label">{tRoutes('industriesLabel')}</p>
              <h3 className="h-card" style={{ margin: '0 0 var(--space-3)' }}>{tRoutes('industriesTitle')}</h3>
              <p className="route-cell-desc">{tRoutes('industriesDesc')}</p>
              <span className="route-cell-cta">{tRoutes('industriesCta')} &rarr;</span>
            </Link>

            <Link href="/solutions" className="route-cell">
              <p className="route-cell-label">{tRoutes('solutionsLabel')}</p>
              <h3 className="h-card" style={{ margin: '0 0 var(--space-3)' }}>{tRoutes('solutionsTitle')}</h3>
              <p className="route-cell-desc">{tRoutes('solutionsDesc')}</p>
              <span className="route-cell-cta">{tRoutes('solutionsCta')} &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4b, Max Agent Bureau — redesigned two-column hero + orchestration
          diagram + compact workflow + grouped capability panels, extracted
          into its own component (see components/homepage/AgentBureauSection.tsx) */}
      <AgentBureauSection locale={locale} />

      {/* 5, Why Maxpromo */}
      <section style={{ background: 'var(--brand-surface-subtle)', padding: SECTION_PADDING, borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '44rem' }}>
            <SectionHeader label={tWhyUs('eyebrow')}>
                {tWhyUs('title')}{' '}
              <span style={{ color: 'var(--brand-text-secondary)' }}>{tWhyUs('titleAccent')}</span>
              </SectionHeader>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2">
            {WHY_REFS.map((id) => (
              <div key={id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--brand-text-secondary)', fontFamily: 'var(--brand-font-mono)', fontSize: '18px', flexShrink: 0, paddingTop: '2px' }}><Icon name="check" size="sm" /></span>
                <div>
                  <h3 className="h-card" style={{ marginBottom: '8px' }}>
                    {tWhyUs(`${id}Title`)}
                  </h3>
                  <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', lineHeight: 1.75, margin: 0 }}>
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
      <section data-section="philosophy" style={{ background: 'var(--brand-background)', padding: SECTION_PADDING, borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto', display: 'grid', gap: '4rem' }} className="grid-cols-1 lg:grid-cols-2">
          <div>
            <SectionHeader label={tPhilosophy('eyebrow')}>
                {tPhilosophy('title')}
              </SectionHeader>
            <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-body)', color: 'var(--brand-text-secondary)', lineHeight: 1.85, marginTop: '1.5rem', whiteSpace: 'pre-line' }}>
              {tPhilosophy('body')}
            </p>
            <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '14px', color: 'var(--brand-text-secondary)', marginTop: '2rem', letterSpacing: '0.03em' }}>
              → {tPhilosophy('closing')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            {(['step1', 'step2', 'step3', 'step4', 'step5'] as const).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-lg)', padding: '18px 24px' }}>
                <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)', borderRadius: '4px', padding: '3px 8px', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: 'var(--brand-font-body)', fontSize: '16px', color: 'var(--brand-text)', letterSpacing: '-0.01em' }}>
                  {tPhilosophy(s)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7, How we work */}
      <section style={{ background: 'var(--brand-surface-subtle)', padding: SECTION_PADDING, borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionHeader label={tProcess('processEyebrow')}>
                {tProcess('processTitle')}
              </SectionHeader>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--brand-border)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_REFS.map((id, i) => (
              <div key={id} style={{ background: 'var(--brand-background)', padding: '2rem 1.75rem', position: 'relative' }}>
                <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 'var(--weight-heading)', fontSize: '48px', lineHeight: 1, marginBottom: '0.75rem', color: 'var(--brand-text-secondary)' }}>
                  {tProcess(`${id}Num`)}
                </p>
                <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', padding: '2px 7px', display: 'inline-block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  {tProcess(`${id}Time`)}
                </span>
                <h3 className="h-card" style={{ marginBottom: '8px' }}>
                  {tProcess(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: '14px', color: 'var(--brand-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {tProcess(`${id}Desc`)}
                </p>
                {i < PROCESS_REFS.length - 1 && (
                  <span className="hidden lg:block" style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-text-secondary)', fontSize: '14px', zIndex: 1 }}>
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
        <section style={{ background: 'var(--brand-background)', padding: SECTION_PADDING, borderTop: '1px solid var(--brand-border)' }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              <div>
                <SectionHeader label={tBlog('homepageEyebrow')}>
                {tBlog('homepageTitle')}{' '}
                  <span style={{ color: 'var(--brand-text-secondary)' }}>{tBlog('homepageTitleAccent')}</span>
              </SectionHeader>
              </div>
              <Link href="/blog" style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
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
                            <span key={tag} style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)', padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="h-card" style={{ margin: 0 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                        {post.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--brand-border)', marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>{post.publishedAt}</span>
                        <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>{tBlog('readArticle')}</span>
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
      <section style={{ background: 'var(--brand-surface-subtle)', padding: 'var(--section-y-feature) var(--section-x)', borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <p className="section-label">{t('finalCtaEyebrow')}</p>
          <h2 style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
            {t('finalCtaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
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
          <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>
            {t('finalCtaFootnote')}
          </p>
        </div>
      </section>

      </main>
    </>
  )
}
