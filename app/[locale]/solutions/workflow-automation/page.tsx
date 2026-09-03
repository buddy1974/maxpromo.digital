import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ServiceImage } from '@/components/ui/ServiceImage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('workflowAutomation')
  return { title: t('metaTitle'), description: t('metaDesc') }
}

const PAIN_KEYS = ['pain1', 'pain2', 'pain3', 'pain4', 'pain5', 'pain6'] as const
const SYS_KEYS  = ['sys1', 'sys2', 'sys3', 'sys4', 'sys5', 'sys6'] as const
const SYS_ICONS = ['→', '◰', '▤', '⊟', '◇', '⌗'] as const
const HOW_STEPS = ['how1', 'how2', 'how3', 'how4'] as const
const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'

export default async function WorkflowAutomationPage() {
  const t = await getTranslations('workflowAutomation')
  const proofBefore = t.raw('proofBefore') as string[]
  const proofAfter  = t.raw('proofAfter') as string[]

  return (
    <main style={{ background: 'var(--color-bg)' }}>

      {/* Hero */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 2rem 3.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ marginBottom: '20px' }}>
            {t('title')}{' '}
            <span>{t('titleAccent')}</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '44rem', lineHeight: 1.75, marginBottom: '2rem' }}>
            {t('intro')}
          </p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            {(['signal1', 'signal2', 'signal3'] as const).map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brand-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>{t(k)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service image — real tool-dashboard screenshot, kept per spec (explains the product) */}
      <div style={{ background: 'var(--color-bg)', padding: '0 2rem 3.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <ServiceImage
            src="/images/services/Tools.png"
            alt="Workflow automation dashboard showing connected tools"
            placeholder="image: tool dashboard · data flow · office operator"
          />
        </div>
      </div>

      {/* Pain */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '44rem', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('painEyebrow')}
            </p>
            <h2>
              {t('painTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {PAIN_KEYS.map((k) => (
              <div key={k} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: 'var(--brand-text-secondary)', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '14px', paddingTop: '2px' }}>✕</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{t(k)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('systemEyebrow')}
            </p>
            <h2 style={{ maxWidth: '44rem' }}>
              {t('systemTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {SYS_KEYS.map((k, i) => (
              <div key={k} style={{ background: 'var(--color-bg)', padding: '2.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--brand-text-secondary)', display: 'block', marginBottom: '16px' }}>{SYS_ICONS[i]}</span>
                <h3 className="h-card" style={{ marginBottom: '10px' }}>
                  {t(`${k}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
                  {t(`${k}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('howEyebrow')}
            </p>
            <h2>
              {t('howTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((k, i) => (
              <div key={k} style={{ background: 'var(--color-bg)', padding: '2.5rem 2rem' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '56px', lineHeight: 1, marginBottom: '1.25rem', color: 'var(--brand-text-secondary)' }}>
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="h-card" style={{ marginBottom: '10px' }}>
                  {t(`${k}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
                  {t(`${k}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof: before vs after */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(3.5rem, 6vw, 5.5rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2rem', textAlign: 'center' }}>
            {t('proofEyebrow')}
          </p>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }} className="grid-cols-1 md:grid-cols-2">
            <div style={{ background: 'var(--color-bg-section)', padding: '2rem 2.5rem' }}>
              <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '11px', color: 'var(--color-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('proofBeforeLabel')}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proofBefore.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>✕</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'var(--color-bg)', padding: '2rem 2.5rem' }}>
              <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '11px', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('proofAfterLabel')}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proofAfter.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)' }}>
                    <span style={{ color: 'var(--brand-text-secondary)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Result */}
      <div style={{ background: 'var(--color-bg)', padding: '3rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '11px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
            {t('resultEyebrow')}
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '19px', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
            {t('result')}
          </p>
        </div>
      </div>

      {/* CTA */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.75 }}>
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
        </div>
      </section>

    </main>
  )
}
