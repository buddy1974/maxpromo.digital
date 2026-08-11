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
    <main style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4rem, 8vw, 7rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h1
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              marginBottom: '20px',
            }}
          >
            {t('title')}
          </h1>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '48rem', margin: '0 auto', lineHeight: 1.75 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Before / After */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(3rem, 5vw, 4.5rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
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
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
            }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            <div style={{ padding: '28px 32px', borderRight: '1px solid var(--color-border)' }}>
              <p style={{ ...mono, fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {t('before')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {beforeItems.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#DC2626', flexShrink: 0, fontSize: '13px' }}>✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ padding: '28px 32px' }}>
              <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {t('after')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {afterItems.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                    <span style={{ color: 'var(--color-primary)', flexShrink: 0, fontSize: '13px', fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture composition */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4rem, 8vw, 7rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '40rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('archEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: '0 0 14px' }}>
              {t('archTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {t('archDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ARCH_REFS.map((layer, i) => (
              <div
                key={layer.no}
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${i === 1 ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-card)',
                  padding: '22px 26px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                }}
                className="grid-cols-1 md:grid-cols-[180px_1fr_auto]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.12em', marginBottom: '4px' }}>
                    {t('archLayerLabel')} {layer.no}
                  </p>
                  <p style={{ ...mono, fontSize: '15px', color: 'var(--color-text-primary)', letterSpacing: '0.04em', fontWeight: 700, margin: 0 }}>
                    {tArch(`${layer.id}Name`)}
                  </p>
                </div>
                <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {tArch(`${layer.id}Desc`)}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '320px' }}>
                  {layer.itemKeys.map((ik) => (
                    <span key={ik} style={{ ...mono, fontSize: '11px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.02em' }}>
                      {tArch(`${layer.id}${ik}`)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '20px', letterSpacing: '0.04em', textAlign: 'center' }}>
            {t('archFlow')}
          </p>
        </div>
      </section>

      {/* App cards, registry-driven via SystemsPageGrid → SystemGrid → SystemCardFull */}
      <SystemsPageGrid cards={cards} locale={locale} />

      {/* Operations Lifecycle, premium timeline, below system cards */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4rem, 8vw, 7rem) 2rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('lifecycleEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: '0 0 14px' }}>
              {t('lifecycleTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {t('lifecycleDesc')}
            </p>
          </div>
          <div
            style={{ display: 'grid', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)' }}
            className="grid-cols-1 md:grid-cols-5"
          >
            {LIFECYCLE_REFS.map((step, i) => (
              <div
                key={step.no}
                style={{
                  background: 'var(--color-bg)',
                  borderTop: '2px solid var(--color-primary)',
                  borderRight: i < LIFECYCLE_REFS.length - 1 ? '1px solid var(--color-border)' : 'none',
                  borderBottom: '1px solid var(--color-border)',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <p style={{ ...mono, fontWeight: 700, fontSize: '40px', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1, opacity: 0.3, margin: 0 }}>
                  {step.no}
                </p>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '17px', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.3 }}>
                  {tLife(`${step.id}Name`)}
                </h3>
                <p style={{ ...sans, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {tLife(`${step.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation Policy, premium operational rows, below lifecycle */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(4rem, 8vw, 7rem) 2rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '44rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('escalationEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: '0 0 14px' }}>
              {t('escalationTitle')}
            </h2>
            <p style={{ ...sans, fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {t('escalationDesc')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            {ESCALATION_IDS.map((id) => (
              <div
                key={id}
                style={{
                  background: 'var(--color-bg)',
                  padding: '24px 28px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                  borderLeft: '2px solid rgba(249,115,22,0.3)',
                }}
                className="grid-cols-1 md:grid-cols-[220px_1fr_2fr]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.75 }}>
                    {t('escTrigger')}
                  </p>
                  <p style={{ ...mono, fontSize: '14px', color: 'var(--color-primary)', fontWeight: 700, margin: 0, letterSpacing: '0.01em' }}>
                    {tEsc(`${id}Trigger`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.75 }}>
                    {t('escHandsTo')}
                  </p>
                  <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>
                    {tEsc(`${id}To`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.75 }}>
                    {t('escWhy')}
                  </p>
                  <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {tEsc(`${id}Why`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4rem, 8vw, 7rem) 2rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            {t('ctaTitleLine1')}
            <br />{t('ctaTitleLine2')}
          </h2>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.75 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="btn btn-primary">
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              {t('ctaSecondary')}
            </Link>
          </div>
          <p style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '20px', letterSpacing: '0.04em' }}>
            {t('ctaFootnote')}
          </p>
        </div>
      </section>

    </main>
  )
}
