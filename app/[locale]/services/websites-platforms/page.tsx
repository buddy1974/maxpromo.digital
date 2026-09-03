import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations, getLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Websites & Business Platforms, Maxpromo Digital',
  description:
    'Websites that do more than look good. Lead capture, booking systems, customer portals, and business automation, all in one platform.',
}

const CAPABILITIES = [
  {
    id: 'c1',
    icon: '→',
    titleKey: 'cap1Title',
    descKey:  'cap1Desc',
  },
  {
    id: 'c2',
    icon: '◰',
    titleKey: 'cap2Title',
    descKey:  'cap2Desc',
  },
  {
    id: 'c3',
    icon: '⊟',
    titleKey: 'cap3Title',
    descKey:  'cap3Desc',
  },
  {
    id: 'c4',
    icon: '◇',
    titleKey: 'cap4Title',
    descKey:  'cap4Desc',
  },
  {
    id: 'c5',
    icon: '▤',
    titleKey: 'cap5Title',
    descKey:  'cap5Desc',
  },
  {
    id: 'c6',
    icon: '⌗',
    titleKey: 'cap6Title',
    descKey:  'cap6Desc',
  },
] as const

const INDUSTRIES = [
  'Restaurants',
  'Clinics & Practices',
  'Trades businesses',
  'Care services',
  'Real estate',
  'Professional services',
] as const

const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'

export default async function WebsitesPlatformsPage() {
  const locale = await getLocale()
  const t      = await getTranslations('websitesPlatforms')

  return (
    <main style={{ background: 'var(--color-bg)' }}>

      {/* Hero */}
      <section style={{ background: 'var(--color-bg)', padding: 'clamp(4rem, 8vw, 7rem) 2rem 3.5rem', borderBottom: '1px solid var(--color-border)' }}>
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

          {/* Pain → system signal */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            {(['signal1', 'signal2', 'signal3'] as const).map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brand-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
                  {t(k)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain section */}
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
          <div
            style={{ display: 'grid', gap: '16px' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(['pain1', 'pain2', 'pain3', 'pain4', 'pain5', 'pain6'] as const).map((k) => (
              <div
                key={k}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <span style={{ color: 'var(--brand-text-secondary)', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '14px', paddingTop: '2px' }}>✕</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {t(k)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we build */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('capEyebrow')}
            </p>
            <h2 style={{ maxWidth: '36rem' }}>
              {t('capTitle')}
            </h2>
          </div>
          <div
            style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.id}
                style={{ background: 'var(--color-bg)', padding: '2.5rem' }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--brand-text-secondary)', display: 'block', marginBottom: '20px' }}>
                  {cap.icon}
                </span>
                <h3 className="h-card" style={{ marginBottom: '10px' }}>
                  {t(cap.titleKey)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
                  {t(cap.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(3.5rem, 6vw, 5rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--color-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>
            {t('industriesLabel')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {INDUSTRIES.map((ind) => (
              <span
                key={ind}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  letterSpacing: '0.03em',
                }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING }}>
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
