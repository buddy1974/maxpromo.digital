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

export default async function WorkflowAutomationPage() {
  const t = await getTranslations('workflowAutomation')
  const proofBefore = t.raw('proofBefore') as string[]
  const proofAfter  = t.raw('proofAfter') as string[]

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>

      {/* Hero */}
      <section style={{ padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px', lineHeight: 1.1 }}>
            {t('title')}{' '}
            <span style={{ color: '#F97316' }}>{t('titleAccent')}</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '44rem', lineHeight: 1.8, marginBottom: '2rem' }}>
            {t('intro')}
          </p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
            {(['signal1', 'signal2', 'signal3'] as const).map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#F97316', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)' }}>{t(k)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service image */}
      <div style={{ background: 'hsl(240 14% 4%)', padding: '0 2rem 3rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <ServiceImage
            src="/images/services/Tools.png"
            alt="Workflow automation dashboard showing connected tools"
            placeholder="// image: tool dashboard · data flow · office operator"
          />
        </div>
      </div>

      {/* Pain */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '44rem', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('painEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', lineHeight: 1.2 }}>
              {t('painTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {PAIN_KEYS.map((k) => (
              <div key={k} style={{ background: 'hsl(240 12% 7%)', border: '1px solid hsl(40 30% 96% / 0.07)', padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#F97316', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '14px', paddingTop: '2px' }}>✕</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>{t(k)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('systemEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', maxWidth: '44rem' }}>
              {t('systemTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {SYS_KEYS.map((k, i) => (
              <div key={k} style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.35) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#F97316', display: 'block', marginBottom: '16px' }}>{SYS_ICONS[i]}</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
                  {t(`${k}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
                  {t(`${k}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('howEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)' }}>
              {t('howTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((k, i) => (
              <div key={k} style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem 2rem' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '56px', lineHeight: 1, marginBottom: '1.25rem', color: '#F97316' }}>
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                  {t(`${k}Title`)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
                  {t(`${k}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof: before vs after */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2rem', textAlign: 'center' }}>
            {t('proofEyebrow')}
          </p>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }} className="grid-cols-1 md:grid-cols-2">
            <div style={{ background: 'hsl(240 12% 7%)', padding: '2rem 2.5rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(0 84% 60% / 0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('proofBeforeLabel')}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proofBefore.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 55%)' }}>
                    <span style={{ color: 'hsl(0 84% 60% / 0.6)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>✕</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'hsl(240 12% 8%)', padding: '2rem 2.5rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('proofAfterLabel')}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proofAfter.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 30% 96% / 0.8)' }}>
                    <span style={{ color: '#F97316', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Result */}
      <div style={{ background: 'hsl(240 14% 4%)', padding: '3rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>
            {t('resultEyebrow')}
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', margin: 0 }}>
            {t('result')}
          </p>
        </div>
      </div>

      {/* CTA */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="shine" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="glass" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
