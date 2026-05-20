import { getTranslations, getLocale } from 'next-intl/server'
import Hero from '@/components/Hero'
import ProofSection from '@/components/ProofSection'
import PricingSection from '@/components/PricingSection'
import FaqSection from '@/components/FaqSection'
import ROICalculator from '@/components/ROICalculator'
import NewsletterSignup from '@/components/NewsletterSignup'
import { Link } from '@/i18n/navigation'
import SystemGrid from '@/components/systems/SystemGrid/SystemGrid'
import { HOMEPAGE_PRODUCTS } from '@/lib/registry/products'
import { getHomepageCards } from '@/lib/registry/adapters'

/* ─── REFERENCES ─────────────────────────────────────────────
   Layout / link / static-glyph data lives at module scope.
   All visitor-facing strings live in messages/{de,en}.json
   and are resolved inside the async component via getTranslations.
   ──────────────────────────────────────────────────────────── */

const SCENARIO_REFS = [
  { id: 's1', href: '/products/restaurant-os' },
  { id: 's2', href: '/products/praxis-os' },
  { id: 's3', href: '/products/handwerk-os' },
  { id: 's4', href: '/products/care-os' },
] as const

const LAYER_REFS = [
  { id: 'l1', icon: '→', href: '/products' },
  { id: 'l2', icon: '◰', href: '/products/handwerk-os' },
  { id: 'l3', icon: '⊟', href: '/services' },
  { id: 'l4', icon: '◇', href: '/services' },
  { id: 'l5', icon: '▤', href: '/products/care-os' },
  { id: 'l6', icon: '⌗', href: '/products/publishing-os' },
] as const


const PROCESS_REFS = ['p1', 'p2', 'p3', 'p4'] as const

interface TerminalLine {
  key: 'line1' | 'line2' | 'line3' | 'line4' | 'line5' | 'line6' | 'line7' | 'line8'
  type: 'cmd' | 'muted' | 'check' | 'cross' | 'stat' | 'blank'
}

const TERMINAL_REFS: TerminalLine[] = [
  { key: 'line1', type: 'cmd'   },
  { key: 'line2', type: 'muted' },
  { key: 'line3', type: 'check' },
  { key: 'line4', type: 'check' },
  { key: 'line5', type: 'cross' },
  { key: 'line6', type: 'check' },
  { key: 'line7', type: 'stat'  },
  { key: 'line8', type: 'stat'  },
]

// Tool stack chips — static brand names, no translation needed.
const STACK_TOOLS = [
  'Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier',
  'Supabase', 'Neon', 'Vercel', 'Render', 'Next.js',
  'Cloudflare', 'HubSpot', 'Slack', 'Notion', 'Xero',
  'Twilio', 'Resend', 'Airtable',
] as const

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
  const locale      = await getLocale()
  const t           = await getTranslations('home')
  const tLayers     = await getTranslations('home.layers')
  const tScenarios  = await getTranslations('home.scenarios')
  const tProcess    = await getTranslations('home.process')
  const tTerminal   = await getTranslations('home.terminal')

  const marqueeItems = t.raw('marquee') as string[]

  /*
   * Registry adapter — transforms HOMEPAGE_PRODUCTS into locale-resolved card data.
   * `cards` is the adapter output (HomepageCardData[]).
   *
   * SystemGrid currently accepts ProductEntry[] — so HOMEPAGE_PRODUCTS is passed
   * directly below. `cards` is available for metadata, SSR props, or any future
   * consumer that needs the transformed shape.
   *
   * TODO: when SystemCardCompact is updated to accept HomepageCardData,
   * pass `cards` to a HomepageSystemsGrid component instead of using SystemGrid.
   * TODO: future analytics — use cards.map(c => c.eventSource) for impression tracking
   * TODO: future experiment flags — A/B select card variants per eventSource
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cards = getHomepageCards(locale)

  return (
    <main>

      {/* 1 — Hero */}
      <Hero />

      {/* 2 — Marquee ticker (operational verbs, not tool names) */}
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

      {/* 01 — Operational layers */}
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
                maxWidth: '640px',
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
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'hsl(28 100% 58%)', display: 'block', marginBottom: '20px' }}>
                    {s.icon}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
                    {tLayers(`${s.id}Title`)}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, flex: 1, marginBottom: '20px' }}>
                    {tLayers(`${s.id}Desc`)}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'hsl(28 100% 58% / 0.8)',
                          background: 'hsl(28 100% 58% / 0.08)',
                          border: '1px solid hsl(28 100% 58% / 0.15)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', letterSpacing: '0.05em' }}>
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

      {/* 02 — Operational scenarios */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '76rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '40rem' }}>
            <SectionLabel>{t('scenariosEyebrow')}</SectionLabel>
            <SectionTitle>
              {t('scenariosTitle1')}{' '}
              <span style={{ color: '#F97316' }}>{t('scenariosTitleAccent')}</span>
            </SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, marginTop: '14px' }}>
              {t('scenariosLede')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {SCENARIO_REFS.map((sc, idx) => (
              <Link
                key={sc.id}
                href={sc.href}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '14px',
                  padding: '32px',
                  display: 'grid',
                  gap: '32px',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="grid-cols-1 lg:grid-cols-[1.2fr_1fr] scenario-card"
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.45) 50%, transparent 100%)' }} />

                {/* LEFT — operational reality */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(28 100% 58%)', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)', padding: '3px 10px', borderRadius: '4px' }}>
                      {String(idx + 1).padStart(2, '0')} · {tScenarios(`${sc.id}Industry`)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.08em' }}>
                      {tScenarios(`${sc.id}Time`)}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'hsl(40 30% 96%)', lineHeight: 1.45, letterSpacing: '-0.01em', marginBottom: '14px', fontWeight: 500 }}>
                    {tScenarios(`${sc.id}Scene`)}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('scenariosBottleneckLabel')}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                    {tScenarios(`${sc.id}Bottleneck`)}
                  </p>
                </div>

                {/* RIGHT — installed system + outcome */}
                <div style={{ borderLeft: '1px solid hsl(40 30% 96% / 0.06)', paddingLeft: '32px', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {t('scenariosSystemLabel')}
                  </p>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.01em', marginBottom: '10px', fontWeight: 700 }}>
                    {tScenarios(`${sc.id}System`)}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, marginBottom: '24px', flex: 1 }}>
                    {tScenarios(`${sc.id}SystemDesc`)}
                  </p>
                  <div style={{ borderTop: '2px solid rgba(249,115,22,0.4)', paddingTop: '14px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {t('scenariosResultLabel')}
                    </p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: '#F97316', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                      {tScenarios(`${sc.id}Result`)}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginTop: '4px' }}>
                      {tScenarios(`${sc.id}ResultDetail`)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — Proof / Results */}
      <ProofSection />

      {/* 04 — Our Systems */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem' }}>
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

          {/*
            Registry-driven systems grid — Task 1.5
            Source:    HOMEPAGE_PRODUCTS (6 products, locked editorial order)
            Adapter:   getHomepageCards() → locale-resolved HomepageCardData[]
            Component: SystemGrid → SystemCard (variant='compact') → SystemCardCompact
            imageMode: heroCrop — shows headline + photo section, hides workflow strip

            Grid columns: 3 desktop / 2 tablet / 1 mobile (Tailwind classes on SystemGrid)

            TODO: future analytics  — fire system_card_viewed per product on mount
            TODO: future click tracking — fire system_card_clicked on CTA interaction
            TODO: future experiment flags — swap variant per product via session context
          */}
          <SystemGrid
            products={HOMEPAGE_PRODUCTS}
            variant="compact"
            columns={3}
            locale={locale}
            imageMode="heroCrop"
          />

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/systems" className="glass" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('systemsViewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* 6 — ROI Calculator */}
      <ROICalculator />

      {/* 7 — Audit terminal */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', position: 'relative' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
        <div
          style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Terminal */}
          <div className="glass-strong" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px hsl(28 100% 58% / 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(0 84% 60% / 0.5)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(28 100% 58% / 0.5)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(75 100% 60% / 0.5)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginLeft: '8px' }}>
                {tTerminal('windowTitle')}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              {TERMINAL_REFS.map((line, i) => {
                const text = tTerminal(line.key)
                const mono = { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.8' as const }
                let rendered: React.ReactNode
                if (line.type === 'cmd') {
                  rendered = (
                    <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>
                      <span style={{ color: 'hsl(28 100% 58%)' }}>$</span>
                      {text.slice(1)}
                    </p>
                  )
                } else if (line.type === 'check') {
                  rendered = (
                    <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>
                      <span style={{ color: 'hsl(28 100% 58%)' }}>  ✓</span>
                      {text.slice(3)}
                    </p>
                  )
                } else if (line.type === 'cross') {
                  rendered = <p style={{ ...mono, color: 'hsl(40 12% 65%)' }}>{text}</p>
                } else if (line.type === 'stat') {
                  rendered = <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>{text}</p>
                } else {
                  rendered = <p style={{ ...mono, color: 'hsl(40 12% 65%)' }}>{text}</p>
                }
                return (
                  <div key={line.key} className="terminal-line" style={{ animationDelay: `${i * 300}ms` }}>
                    {rendered}
                  </div>
                )
              })}
              <p
                className="terminal-line"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', animationDelay: `${TERMINAL_REFS.length * 300}ms` }}
              >
                $ <span className="cursor-blink">▊</span>
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <SectionLabel>{tTerminal('auditEyebrow')}</SectionLabel>
            <SectionTitle>{tTerminal('auditTitle')}</SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', lineHeight: 1.8, marginTop: '1.25rem', marginBottom: '1.75rem', maxWidth: '440px' }}>
              {tTerminal('auditDesc')}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['auditFeat1', 'auditFeat2', 'auditFeat3'] as const).map((k) => (
                <li
                  key={k}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '17px',
                    color: 'hsl(40 30% 96% / 0.7)',
                  }}
                >
                  <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0 }}>✓</span>
                  {tTerminal(k)}
                </li>
              ))}
            </ul>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 30px hsl(28 100% 58% / 0.25)',
              }}
            >
              {tTerminal('auditCta')}
            </Link>
          </div>
        </div>
      </section>

      {/* 8 — Process */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem' }}>
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
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '2.5rem 2rem',
                  position: 'relative',
                }}
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
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(28 100% 58% / 0.4)',
                      fontSize: '14px',
                      zIndex: 1,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 — Pricing */}
      <PricingSection />

      {/* 10 — FAQ */}
      <FaqSection />

      {/* 11 — Final CTA */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '7rem 2rem', position: 'relative', overflow: 'hidden' }}>
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
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 40px hsl(28 100% 58% / 0.3)',
              }}
            >
              {t('finalCtaPrimary')}
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              {t('finalCtaSecondary')}
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em' }}>
            {t('finalCtaFootnote')}
          </p>
        </div>
      </section>

      {/* 12 — Stack */}
      <section style={{ background: 'hsl(240 14% 4%)', borderTop: '1px solid hsl(40 30% 96% / 0.06)', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' }}>
            {t('builtOnEyebrow')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {STACK_TOOLS.map((tool) => (
              <span
                key={tool}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'hsl(40 12% 65%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  padding: '5px 12px',
                  letterSpacing: '0.05em',
                  borderRadius: '4px',
                  background: 'hsl(240 12% 8%)',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSignup />

    </main>
  )
}
