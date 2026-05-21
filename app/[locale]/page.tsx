import { getTranslations, getLocale } from 'next-intl/server'
import Hero from '@/components/Hero'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import HomepageSystemsGrid from '@/components/systems/HomepageSystemsGrid'
import { getHomepageCards } from '@/lib/registry/adapters'
import { getLatestPosts } from '@/lib/blog/posts'
import { PainSlider } from '@/components/ui/PainSlider'

/* ─── REFERENCES ───────────────────────────────────────────── */

const LAYER_REFS = [
  { id: 'l1', num: '01', icon: '⊟', href: '/services/customer-inquiries' },
  { id: 'l2', num: '02', icon: '◰', href: '/services/workflow-automation' },
  { id: 'l3', num: '03', icon: '◇', href: '/services/reviews' },
  { id: 'l4', num: '04', icon: '▤', href: '/services/social-media' },
  { id: 'l5', num: '05', icon: '⌗', href: '/services/ai-agents' },
  { id: 'l6', num: '06', icon: '→', href: '/services/websites-platforms' },
] as const

const PROCESS_REFS = ['p1', 'p2', 'p3', 'p4'] as const

const BENEFIT_REFS = ['b1', 'b2', 'b3', 'b4'] as const
const BENEFIT_ICONS = ['⊟', '◇', '▤', '→'] as const

const WHY_REFS = ['w1', 'w2', 'w3', 'w4'] as const

const PROOF_REFS = ['p1', 'p2', 'p3'] as const

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'hsl(28 100% 58%)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        letterSpacing: '-0.04em',
        color: 'hsl(40 30% 96%)',
        marginBottom: '0',
      }}
    >
      {children}
    </h2>
  )
}

/* ─── PAGE ─── */

export default async function HomePage() {
  const locale        = await getLocale()
  const t             = await getTranslations('home')
  const tLayers       = await getTranslations('home.layers')
  const tProcess      = await getTranslations('home.process')
  const tBenefits     = await getTranslations('home.benefits')
  const tWhyUs        = await getTranslations('home.whyUs')
  const tProof        = await getTranslations('home.proof')
  const tBlog         = await getTranslations('blog')

  const marqueeItems = t.raw('marquee') as string[]
  const cards        = getHomepageCards(locale)
  const latestPosts  = getLatestPosts(locale, 3)

  return (
    <main>

      {/* 1 — Hero */}
      <Hero />

      {/* Pain slider */}
      <PainSlider />

      {/* 2 — Marquee ticker */}
      <div
        style={{
          background: 'hsl(240 12% 6%)',
          borderTop: '1px solid hsl(40 30% 96% / 0.06)',
          borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
          padding: '14px 0',
          overflow: 'hidden',
        }}
      >
        <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'hsl(40 30% 96% / 0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginRight: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2rem',
              }}
            >
              {item}
              <span style={{ color: 'hsl(28 100% 58% / 0.4)' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* 3 — Services */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>{t('layersEyebrow')}</SectionLabel>
            <SectionTitle>
              {t('layersTitle1')}{' '}
              <span style={{ color: '#F97316' }}>{t('layersTitleAccent')}</span>
            </SectionTitle>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'hsl(40 12% 65%)',
                lineHeight: 1.7,
                marginTop: '14px',
                maxWidth: '600px',
              }}
            >
              {t('layersLede')}
            </p>
          </div>

          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {LAYER_REFS.map((s) => {
              const tags = tLayers(`${s.id}Tags`).split(' · ')
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className="service-card"
                  style={{
                    background: 'hsl(240 12% 7%)',
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    minHeight: '280px',
                  }}
                >
                  {/* Low-opacity radial overlay — brand accent in corner */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '180px',
                      height: '180px',
                      background: 'radial-gradient(circle at 0% 0%, rgba(249,115,22,0.07) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Ghost card number — large decorative element */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1.5rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '80px',
                      lineHeight: 1,
                      color: 'rgba(255,255,255,0.03)',
                      letterSpacing: '-0.04em',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {s.num}
                  </span>

                  {/* Content */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '32px',
                      color: '#F97316',
                      display: 'block',
                      marginBottom: '1.25rem',
                      position: 'relative',
                    }}
                  >
                    {s.icon}
                  </span>

                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '19px',
                      color: 'hsl(40 30% 96%)',
                      letterSpacing: '-0.03em',
                      marginBottom: '10px',
                      lineHeight: 1.25,
                      position: 'relative',
                    }}
                  >
                    {tLayers(`${s.id}Title`)}
                  </h3>

                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'hsl(40 12% 60%)',
                      lineHeight: 1.75,
                      flex: 1,
                      marginBottom: '1.25rem',
                      position: 'relative',
                    }}
                  >
                    {tLayers(`${s.id}Desc`)}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1rem', position: 'relative' }}>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'hsl(28 100% 58% / 0.7)',
                          background: 'hsl(28 100% 58% / 0.06)',
                          border: '1px solid hsl(28 100% 58% / 0.12)',
                          padding: '3px 8px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: '#F97316',
                      letterSpacing: '0.05em',
                      position: 'relative',
                    }}
                  >
                    {t('layersCtaCard')}
                  </span>
                </Link>
              )
            })}
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Link href="/services" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(28 100% 58%)', textDecoration: 'none', letterSpacing: '0.05em' }}>
              {t('layersCtaAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4 — Benefits */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '44rem' }}>
            <SectionLabel>{tBenefits('eyebrow')}</SectionLabel>
            <SectionTitle>
              {tBenefits('title')}{' '}
              <span style={{ color: '#F97316' }}>{tBenefits('titleAccent')}</span>
            </SectionTitle>
          </div>
          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {BENEFIT_REFS.map((id, i) => (
              <div
                key={id}
                style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.3) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: '#F97316', display: 'block', marginBottom: '20px' }}>
                  {BENEFIT_ICONS[i]}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: 1.3 }}>
                  {tBenefits(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
                  {tBenefits(`${id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Why choose us */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '44rem' }}>
            <SectionLabel>{tWhyUs('eyebrow')}</SectionLabel>
            <SectionTitle>
              {tWhyUs('title')}{' '}
              <span style={{ color: '#F97316' }}>{tWhyUs('titleAccent')}</span>
            </SectionTitle>
          </div>
          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-1 sm:grid-cols-2"
          >
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

      {/* 6 — Proof strip */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel>{tProof('eyebrow')}</SectionLabel>
              <SectionTitle>{tProof('title')}</SectionTitle>
            </div>
            <Link href="/case-studies" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(28 100% 58%)', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
              {tProof('viewAll')}
            </Link>
          </div>

          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-3"
          >
            {PROOF_REFS.map((id) => (
              <div key={id} style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F97316', lineHeight: 1, marginBottom: '12px' }}>
                  {tProof(`${id}Value`)}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', lineHeight: 1.5, marginBottom: '10px' }}>
                  {tProof(`${id}Label`)}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 65%)', letterSpacing: '0.05em' }}>
                  {tProof(`${id}Source`)}
                </p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 30%)', marginTop: '1rem', letterSpacing: '0.05em' }}>
            {tProof('note')}
          </p>
        </div>
      </section>

      {/* 7 — Systems preview */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <SectionLabel>{t('systemsEyebrow')}</SectionLabel>
            <SectionTitle>
              {t('systemsTitle1')}{' '}
              <span style={{ color: '#F97316' }}>{t('systemsTitleAccent')}</span>
            </SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '600px', marginTop: '1rem', lineHeight: 1.8 }}>
              {t('systemsLede')}
            </p>
          </div>
          <HomepageSystemsGrid cards={cards} locale={locale} />
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/systems" className="glass" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('systemsViewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* 8 — How we work */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>{t('processEyebrow')}</SectionLabel>
            <SectionTitle>{t('processTitle')}</SectionTitle>
          </div>
          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROCESS_REFS.map((id, i) => (
              <div
                key={id}
                className="process-step"
                style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem 2rem', position: 'relative' }}
              >
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '56px', lineHeight: 1, marginBottom: '1.25rem', color: '#F97316' }}>
                  {tProcess(`${id}Num`)}
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 65%)', background: 'hsl(240 10% 16%)', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  {tProcess(`${id}Time`)}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', marginBottom: '10px', display: 'block' }}>
                  {tProcess(`${id}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75 }}>
                  {tProcess(`${id}Desc`)}
                </p>
                {i < PROCESS_REFS.length - 1 && (
                  <span
                    className="hidden lg:block"
                    style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(28 100% 58% / 0.4)', fontSize: '14px', zIndex: 1 }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 — Latest insights (hidden when no published posts) */}
      {latestPosts.length > 0 && (
        <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              <div>
                <SectionLabel>{tBlog('homepageEyebrow')}</SectionLabel>
                <SectionTitle>
                  {tBlog('homepageTitle')}{' '}
                  <span style={{ color: '#F97316' }}>{tBlog('homepageTitleAccent')}</span>
                </SectionTitle>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, marginTop: '12px', maxWidth: '520px' }}>
                  {tBlog('homepageLede')}
                </p>
              </div>
              <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', flexShrink: 0 }}>
                {tBlog('homepageViewAll')}
              </Link>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                  <article style={{ background: 'hsl(240 12% 7%)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} className="mp-card-hover">
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
      <section style={{ background: 'hsl(240 14% 4%)', padding: '7rem 2rem', position: 'relative', overflow: 'hidden', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>{t('finalCtaEyebrow')}</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            {t('finalCtaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            {t('finalCtaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: 'hsl(28 100% 58%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px', boxShadow: '0 0 40px hsl(28 100% 58% / 0.3)' }}
            >
              {t('finalCtaPrimary')}
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}
            >
              {t('finalCtaSecondary')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em' }}>
            {t('finalCtaFootnote')}
          </p>
        </div>
      </section>

    </main>
  )
}
