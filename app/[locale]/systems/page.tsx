import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import SystemsPageGrid from '@/components/systems/SystemsPageGrid'
import { getSystemsCards } from '@/lib/registry/adapters'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('systems')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}


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
  const locale  = await getLocale()
  const cards   = getSystemsCards(locale)
  const t       = await getTranslations('systems')
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

      {/* App cards, registry-driven via SystemsPageGrid → SystemGrid → SystemCardFull */}
      <SystemsPageGrid cards={cards} locale={locale} />

      {/* Operations Lifecycle, premium timeline, below system cards */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
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
            style={{ display: 'grid', overflow: 'hidden', border: '1px solid hsl(40 30% 96% / 0.08)' }}
            className="grid-cols-1 md:grid-cols-5"
          >
            {LIFECYCLE_REFS.map((step, i) => (
              <div
                key={step.no}
                style={{
                  background: 'hsl(240 12% 7%)',
                  borderTop: '2px solid #F97316',
                  borderRight: i < LIFECYCLE_REFS.length - 1 ? '1px solid hsl(40 30% 96% / 0.06)' : 'none',
                  borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <p style={{ ...mono, fontWeight: 700, fontSize: '40px', color: '#F97316', letterSpacing: '-0.06em', lineHeight: 1, opacity: 0.3, margin: 0 }}>
                  {step.no}
                </p>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '16px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.3 }}>
                  {tLife(`${step.id}Name`)}
                </h3>
                <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                  {tLife(`${step.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation Policy, premium operational rows, below lifecycle */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('escalationEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              {t('escalationTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              {t('escalationDesc')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'hsl(240 10% 14%)' }}>
            {ESCALATION_IDS.map((id) => (
              <div
                key={id}
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '24px 28px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                  borderLeft: '2px solid rgba(249,115,22,0.3)',
                }}
                className="grid-cols-1 md:grid-cols-[220px_1fr_2fr]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('escTrigger')}
                  </p>
                  <p style={{ ...mono, fontSize: '13px', color: '#F97316', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
                    {tEsc(`${id}Trigger`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('escHandsTo')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96%)', lineHeight: 1.6, margin: 0 }}>
                    {tEsc(`${id}To`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
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
              href="/contact"
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
              href="/contact"
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
}//x
