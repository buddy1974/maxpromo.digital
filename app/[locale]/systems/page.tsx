import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('systems')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

interface AppRef {
  id: 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7'
  featureKeys: ReadonlyArray<'F1' | 'F2' | 'F3' | 'F4'>
  tags: ReadonlyArray<string>
  productPage: string
  contactSlug: string
  publicDemo?: string
  hasDemoLogin?: boolean
}

const APP_REFS: ReadonlyArray<AppRef> = [
  {
    id: 'a1',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Stripe', 'Real-time'],
    productPage: '/products/restaurant-os',
    contactSlug: 'restaurant-os',
    publicDemo: 'https://restaurant-os-one.vercel.app',
  },
  {
    id: 'a2',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Neon', 'Claude AI'],
    productPage: '/products/praxis-os',
    contactSlug: 'praxis-os',
  },
  {
    id: 'a3',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Claude AI', 'TypeScript'],
    productPage: '/products/handwerk-os',
    contactSlug: 'handwerk-os',
    publicDemo: 'https://handwerkos.vercel.app',
    hasDemoLogin: true,
  },
  {
    id: 'a4',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Claude AI', 'Neon'],
    productPage: '/products/care-os',
    contactSlug: 'care-os',
  },
  {
    id: 'a5',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Claude AI', 'Stripe'],
    productPage: '/products/printshop',
    contactSlug: 'printshop-os',
    publicDemo: 'https://printshop.maxpromo.digital',
    hasDemoLogin: true,
  },
  {
    id: 'a6',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Claude AI', 'n8n', 'Neon'],
    productPage: '/products/publishing-os',
    contactSlug: 'publishing-os',
  },
  {
    id: 'a7',
    featureKeys: ['F1','F2','F3','F4'],
    tags: ['Next.js', 'Claude AI', 'Drizzle ORM'],
    productPage: '/products/real-estate-os',
    contactSlug: 'real-estate-os',
  },
]

const mono    = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans    = { fontFamily: 'var(--font-inter)' } as const

interface ArchRef {
  no: string
  id: 'a1' | 'a2' | 'a3' | 'a4'
  itemKeys: ReadonlyArray<'I1' | 'I2' | 'I3' | 'I4' | 'I5' | 'I6'>
}

const ARCH_REFS: ReadonlyArray<ArchRef> = [
  { no: '04', id: 'a1', itemKeys: ['I1','I2','I3','I4','I5'] },
  { no: '03', id: 'a2', itemKeys: ['I1','I2','I3','I4','I5'] },
  { no: '02', id: 'a3', itemKeys: ['I1','I2','I3','I4','I5'] },
  { no: '01', id: 'a4', itemKeys: ['I1','I2','I3','I4','I5','I6'] },
]

const LIFECYCLE_REFS = [
  { no: '01', id: 's1' as const },
  { no: '02', id: 's2' as const },
  { no: '03', id: 's3' as const },
  { no: '04', id: 's4' as const },
  { no: '05', id: 's5' as const },
]

const ESCALATION_IDS = ['e1', 'e2', 'e3', 'e4', 'e5'] as const

export default async function SystemsPage() {
  const t       = await getTranslations('systems')
  const tApps   = await getTranslations('systems.apps')
  const tArch   = await getTranslations('systems.architecture')
  const tLife   = await getTranslations('systems.lifecycle')
  const tEsc    = await getTranslations('systems.escalation')

  const beforeItems = t('beforeItems').split(' · ')
  const afterItems  = t('afterItems').split(' · ')

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>

      {/* Header */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('eyebrow')}
          </p>
          <h1
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '20px',
            }}
          >
            {t('title')}
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '48rem', margin: '0 auto', lineHeight: 1.8 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Before / After */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '3.5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              letterSpacing: '-0.03em',
              color: 'hsl(40 30% 96%)',
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            {t('beforeAfterTitle')}
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '0',
              background: 'hsl(240 12% 7%)',
              border: '1px solid hsl(40 30% 96% / 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            <div style={{ padding: '28px 32px', borderRight: '1px solid hsl(40 30% 96% / 0.06)' }}>
              <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {t('before')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {beforeItems.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)' }}>
                    <span style={{ color: 'hsl(0 84% 60%)', flexShrink: 0, fontSize: '13px' }}>✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ padding: '28px 32px' }}>
              <p style={{ ...mono, fontSize: '10px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {t('after')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {afterItems.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '15px', color: 'hsl(40 30% 96%)' }}>
                    <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0, fontSize: '13px', fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture composition */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '40rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('archEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              {t('archTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              {t('archDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ARCH_REFS.map((layer, i) => (
              <div
                key={layer.no}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderLeft: `3px solid ${i === 1 ? '#F97316' : 'hsl(40 30% 96% / 0.15)'}`,
                  borderRadius: '8px',
                  padding: '20px 24px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                }}
                className="grid-cols-1 md:grid-cols-[180px_1fr_auto]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65%)', letterSpacing: '0.15em', marginBottom: '4px' }}>
                    {t('archLayerLabel')} {layer.no}
                  </p>
                  <p style={{ ...mono, fontSize: '14px', color: 'hsl(40 30% 96%)', letterSpacing: '0.08em', fontWeight: 700, margin: 0 }}>
                    {tArch(`${layer.id}Name`)}
                  </p>
                </div>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                  {tArch(`${layer.id}Desc`)}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '320px' }}>
                  {layer.itemKeys.map((ik) => (
                    <span key={ik} style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65%)', background: 'hsl(240 14% 4%)', border: '1px solid hsl(40 30% 96% / 0.08)', padding: '4px 10px', borderRadius: '3px', letterSpacing: '0.04em' }}>
                      {tArch(`${layer.id}${ik}`)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...mono, fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em', textAlign: 'center' }}>
            {t('archFlow')}
          </p>
        </div>
      </section>

      {/* Lifecycle pipeline */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '40rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('lifecycleEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              {t('lifecycleTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              {t('lifecycleDesc')}
            </p>
          </div>

          <div
            style={{ display: 'grid', gap: '0', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }}
            className="grid-cols-1 md:grid-cols-5"
          >
            {LIFECYCLE_REFS.map((step, i) => (
              <div
                key={step.no}
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '24px 22px',
                  borderTop: `2px solid ${i === LIFECYCLE_REFS.length - 1 ? 'rgba(34,197,94,0.5)' : 'rgba(249,115,22,0.4)'}`,
                  position: 'relative',
                }}
              >
                <p style={{ ...mono, fontSize: '10px', color: 'hsl(28 100% 58%)', letterSpacing: '0.15em', marginBottom: '6px' }}>
                  {step.no}
                </p>
                <p style={{ ...grotesk, fontSize: '16px', fontWeight: 700, color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                  {tLife(`${step.id}Name`)}
                </p>
                <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 12% 65%)', lineHeight: 1.6, margin: 0 }}>
                  {tLife(`${step.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation policy */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '44rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('escalationEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              {t('escalationTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              {t('escalationDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ESCALATION_IDS.map((id) => (
              <div
                key={id}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '8px',
                  padding: '18px 22px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                }}
                className="grid-cols-1 md:grid-cols-[200px_1fr_2fr]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('escTrigger')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96%)', fontWeight: 600, margin: 0 }}>
                    {tEsc(`${id}Trigger`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('escHandsTo')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96%)', margin: 0 }}>
                    {tEsc(`${id}To`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('escWhy')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.55, margin: 0 }}>
                    {tEsc(`${id}Why`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App cards */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '3rem 2rem 4rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '16px' }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            {APP_REFS.map((app) => (
              <div
                key={app.id}
                className="dark-card"
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '12px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, hsl(28 100% 58% / 0.5) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />

                <span
                  style={{
                    ...mono,
                    fontSize: '10px',
                    color: 'hsl(28 100% 58%)',
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '16px',
                    alignSelf: 'flex-start',
                  }}
                >
                  {tApps(`${app.id}Category`)}
                </span>

                <h2
                  style={{
                    ...grotesk,
                    fontWeight: 700,
                    fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
                    letterSpacing: '-0.03em',
                    color: 'hsl(40 30% 96%)',
                    marginBottom: '12px',
                  }}
                >
                  {tApps(`${app.id}Name`)}
                </h2>

                <p
                  style={{
                    ...sans,
                    fontSize: '15px',
                    color: 'hsl(40 12% 65%)',
                    lineHeight: 1.75,
                    marginBottom: '20px',
                  }}
                >
                  {tApps(`${app.id}Desc`)}
                </p>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1,
                  }}
                >
                  {app.featureKeys.map((fk) => (
                    <li
                      key={fk}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        ...sans,
                        fontSize: '14px',
                        color: 'hsl(40 30% 96% / 0.75)',
                      }}
                    >
                      <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0, fontWeight: 700, fontSize: '12px', marginTop: '1px' }}>
                        ✓
                      </span>
                      {tApps(`${app.id}${fk}`)}
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        ...mono,
                        fontSize: '10px',
                        color: 'hsl(40 12% 65%)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href={app.productPage} className="sys-cta">
                    {tApps('exploreCta')}
                  </Link>
                  <Link href={`/contact?system=${app.contactSlug}`} className="sys-cta-ghost">
                    {tApps('requestCta')}
                  </Link>
                </div>

                <p
                  style={{
                    ...mono,
                    fontSize: '10px',
                    color: 'hsl(240 8% 35%)',
                    margin: '12px 0 0',
                    letterSpacing: '0.04em',
                  }}
                >
                  {app.publicDemo ? (
                    <>
                      {'// '}
                      <a
                        href={app.publicDemo}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'hsl(28 100% 58%)', textDecoration: 'none' }}
                      >
                        {tApps('viewLive')}
                      </a>
                      {!app.hasDemoLogin && ` · ${tApps(`${app.id}Demo`)}`}
                    </>
                  ) : (
                    `// ${tApps(`${app.id}Demo`)}`
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '16px',
            }}
          >
            {t('ctaTitleLine1')}
            <br />{t('ctaTitleLine2')}
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/discovery"
              className="shine"
              style={{
                ...mono,
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
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/estimate"
              className="glass"
              style={{
                ...sans,
                fontWeight: 500,
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              {t('ctaSecondary')}
            </Link>
          </div>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em' }}>
            {t('ctaFootnote')}
          </p>
        </div>
      </section>

    </main>
  )
}
