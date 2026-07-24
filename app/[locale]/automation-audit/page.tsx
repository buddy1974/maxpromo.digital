import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import AuditForm from '@/components/AuditForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('automationAudit')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

export default async function AutomationAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('automationAudit')
  const pills = [t('pill1'), t('pill2'), t('pill3')]

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      {/* Header */}
      <section style={{ padding: '4rem 2rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <p style={{ ...mono, fontSize: '10px', color: '#444444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '28px' }}>
            {t('breadcrumb')}
          </p>

          <h1
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            {t('heroTitle')}
          </h1>
          <p
            style={{
              ...sans,
              fontSize: '16px',
              color: '#666666',
              lineHeight: 1.7,
              maxWidth: '520px',
              marginBottom: '28px',
            }}
          >
            {t('heroSubtitle')}
          </p>

          {/* Trust pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {pills.map((pill) => (
              <span
                key={pill}
                style={{
                  ...mono,
                  fontSize: '11px',
                  color: '#F97316',
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  padding: '6px 14px',
                  letterSpacing: '0.04em',
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Audit form */}
      <section style={{ padding: '3rem 2rem 5rem', minHeight: '500px' }}>
        <AuditForm />
      </section>
    </main>
  )
}
