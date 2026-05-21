import { getTranslations, getLocale } from 'next-intl/server'
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

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', lineHeight: 1.1, marginBottom: 0 }}>
      {children}
    </h2>
  )
}

/* ─── PAGE ─── */

export default async function HomePage() {
  const locale       = await getLocale()
  const t            = await getTranslations('home')
  const tProcess     = await getTranslations('home.process')
  const tWhyUs       = await getTranslations('home.whyUs')
  const tProof       = await getTranslations('home.proof')
  const tSystemsTabs = await getTranslations('home.systemsTabs')
  const tBlog        = await getTranslations('blog')

  const latestPosts = getLatestPosts(locale, 3)

  const WHY_REFS   = ['w1', 'w2', 'w3', 'w4'] as const
  const PROOF_REFS = ['p1', 'p2', 'p3'] as const
  const PROCESS_REFS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const

  return (
    <main>

      {/* 1 — Hero (LOCKED) */}
      <Hero />

      {/* Pain Slider — rotating problem strip below hero */}
      <PainSlider />

      {/* 2 — Pain Cards */}
      <PainCards />

      {/* 3 — Proof strip */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tProof('eyebrow')}</SectionLabel>
              <SectionTitle>{tProof('title')}</SectionTitle>
            </div>
            <Link href="/case-studies" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tProof('viewAll')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 60%)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '44rem' }}>
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
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 28%)', marginTop: '1rem', letterSpacing: '0.05em' }}>
            {tProof('note')}
          </p>
        </div>
      </section>

      {/* 4 — Systems tabs */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tSystemsTabs('eyebrow')}</SectionLabel>
              <SectionTitle>
                {tSystemsTabs('title')}{' '}
                <span style={{ color: '#F97316' }}>{tSystemsTabs('titleAccent')}</span>
              </SectionTitle>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', marginTop: '10px', lineHeight: 1.7 }}>
                {tSystemsTabs('subtitle')}
              </p>
            </div>
            <Link href="/systems" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tSystemsTabs('viewAll')} →
            </Link>
          </div>
          <SystemsTabs />
        </div>
      </section>

      {/* 5 — Why Maxpromo */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '44rem' }}>
            <SectionLabel>{tWhyUs('eyebrow')}</SectionLabel>
            <SectionTitle>
              {tWhyUs('title')}{' '}
              <span style={{ color: '#F97316' }}>{tWhyUs('titleAccent')}</span>
            </SectionTitle>
          </div>
          <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 sm:grid-cols-2">
            {WHY_REFS.map((id) => (
              <div
                key={id}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.07)',
                  borderRadius: '12px',
                  padding: '2rem 2.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: '#F97316', fontFamily: 'var(--font-mono)', fontSize: '16px', flexShrink: 0, paddingTop: '2px' }}>✓</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {tWhyUs(`${id}Title`)}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
                    {tWhyUs(`${id}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Team trust */}
      <TeamTrust />

      {/* 7 — How we work */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>{tProcess('processEyebrow')}</SectionLabel>
            <SectionTitle>{tProcess('processTitle')}</SectionTitle>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_REFS.map((id, i) => (
              <div key={id} style={{ background: 'hsl(240 12% 7%)', padding: '2rem 1.75rem', position: 'relative' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '48px', lineHeight: 1, marginBottom: '0.75rem', color: '#F97316' }}>
                  {tProcess(`${id}Num`)}
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 50%)', background: 'hsl(240 10% 14%)', padding: '2px 7px', display: 'inline-block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  {tProcess(`${id}Time`)}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.3 }}>
                  {tProcess(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'hsl(40 12% 60%)', lineHeight: 1.7, margin: 0 }}>
                  {tProcess(`${id}Desc`)}
                </p>
                {i < PROCESS_REFS.length - 1 && (
                  <span className="hidden lg:block" style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(249,115,22,0.3)', fontSize: '14px', zIndex: 1 }}>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — FAQ */}
      <FaqAccordion />

      {/* 9 — Latest insights (only when posts exist) */}
      {latestPosts.length > 0 && (
        <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              <div>
                <SectionLabel>{tBlog('homepageEyebrow')}</SectionLabel>
                <SectionTitle>
                  {tBlog('homepageTitle')}{' '}
                  <span style={{ color: '#F97316' }}>{tBlog('homepageTitleAccent')}</span>
                </SectionTitle>
              </div>
              <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
                {tBlog('homepageViewAll')} →
              </Link>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                  <article style={{ background: 'hsl(240 12% 7%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} className="mp-card-hover">
                    {post.featuredImage && (
                      <div className="mp-img-wrap" style={{ position: 'relative', aspectRatio: '16/9' }}>
                        <Image src={post.featuredImage} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      </div>
                    )}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {post.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {post.tags.map((tag) => (
                            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'hsl(40 30% 96%)', lineHeight: 1.35, margin: 0 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                        {post.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', letterSpacing: '0.05em' }}>{post.publishedAt}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.05em' }}>{tBlog('readArticle')}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10 — Final CTA */}
      <section style={{ background: 'hsl(240 14% 3%)', padding: '7rem 2rem', position: 'relative', overflow: 'hidden', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>{t('finalCtaEyebrow')}</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '1rem',
              marginTop: '0.5rem',
              lineHeight: 1.15,
            }}
          >
            {t('finalCtaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'hsl(40 12% 55%)', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
            {t('finalCtaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Link href="/automation-audit" className="shine" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px', boxShadow: '0 0 40px rgba(249,115,22,0.3)' }}>
              {t('finalCtaPrimary')}
            </Link>
            <Link href="/contact" className="glass" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('finalCtaSecondary')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 32%)', letterSpacing: '0.05em' }}>
            {t('finalCtaFootnote')}
          </p>
        </div>
      </section>

    </main>
  )
}
