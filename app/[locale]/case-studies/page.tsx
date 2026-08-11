import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('caseStudies')
  return { title: t('metaTitle'), description: t('metaDesc') }
}

const mono    = { fontFamily: 'var(--font-mono)' } as const
const grotesk = { fontFamily: 'var(--font-heading)' } as const
const sans    = { fontFamily: 'var(--font-body)' } as const

interface CaseStudyRef {
  id: 'cs1' | 'cs2' | 'cs3'
  resultKeys: ReadonlyArray<'Result1' | 'Result2' | 'Result3' | 'Result4'>
  tools: ReadonlyArray<string>
}

const CASE_STUDY_REFS: ReadonlyArray<CaseStudyRef> = [
  {
    id: 'cs1',
    resultKeys: ['Result1', 'Result2', 'Result3', 'Result4'],
    tools: ['Claude AI', 'n8n', 'Airtable', 'Document AI'],
  },
  {
    id: 'cs2',
    resultKeys: ['Result1', 'Result2', 'Result3', 'Result4'],
    tools: ['Document AI', 'Xero API', 'Make', 'Slack'],
  },
  {
    id: 'cs3',
    resultKeys: ['Result1', 'Result2', 'Result3', 'Result4'],
    tools: ['n8n', 'Claude AI', 'QuickBooks', 'Make'],
  },
]

export default async function CaseStudiesPage() {
  const t = await getTranslations('caseStudies')

  return (
    <main style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            {t('heroTitle')}
          </h1>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.8 }}>
            {t('heroDesc')}
          </p>
          <p style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '20px', letterSpacing: '0.05em' }}>
            {t('ndaNote')}
          </p>
        </div>
      </section>

      {/* Case studies */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {CASE_STUDY_REFS.map((cs) => (
            <div
              key={cs.id}
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-primary)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '48px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', padding: '4px 12px', letterSpacing: '0.05em', borderRadius: '4px' }}>
                      {t(`${cs.id}Tag`)}
                    </span>
                  </div>
                  <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', maxWidth: '36rem' }}>
                    {t(`${cs.id}Headline`)}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                    {t('deliveredIn')} {t(`${cs.id}Timeline`)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '3rem', marginBottom: '2rem' }} className="grid-cols-1 lg:grid-cols-2">
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {t('challengeLabel')}
                  </p>
                  <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    {t(`${cs.id}Challenge`)}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {t('solutionLabel')}
                  </p>
                  <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    {t(`${cs.id}Solution`)}
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '20px' }}>
                <p style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  {t('resultsLabel')}
                </p>
                <div style={{ display: 'grid', gap: '10px' }} className="grid-cols-1 sm:grid-cols-2">
                  {cs.resultKeys.map((rk) => (
                    <div key={rk} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: 'var(--color-primary)', flexShrink: 0, ...mono, fontSize: '13px' }}>✓</span>
                      <span style={{ ...sans, fontSize: '15px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                        {t(`${cs.id}${rk}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cs.tools.map((tool) => (
                  <span key={tool} style={{ ...mono, fontSize: '11px', color: 'var(--color-primary)', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '3px 10px', letterSpacing: '0.05em', borderRadius: '4px' }}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
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
