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

export default async function WebsitesPlatformsPage() {
  const locale = await getLocale()
  const t      = await getTranslations('websitesPlatforms')

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>

      {/* Hero */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('eyebrow')}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '20px',
              lineHeight: 1.1,
            }}
          >
            {t('title')}{' '}
            <span style={{ color: '#F97316' }}>{t('titleAccent')}</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '44rem', lineHeight: 1.8, marginBottom: '2rem' }}>
            {t('intro')}
          </p>

          {/* Pain → system signal */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
            {(['signal1', 'signal2', 'signal3'] as const).map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#F97316', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)' }}>
                  {t(k)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain section */}
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
          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(['pain1', 'pain2', 'pain3', 'pain4', 'pain5', 'pain6'] as const).map((k) => (
              <div
                key={k}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.07)',
                  padding: '24px 28px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <span style={{ color: '#F97316', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '14px', paddingTop: '2px' }}>✕</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
                  {t(k)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we build */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('capEyebrow')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', maxWidth: '36rem' }}>
              {t('capTitle')}
            </h2>
          </div>
          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.id}
                style={{ background: 'hsl(240 12% 7%)', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.35) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: '#F97316', display: 'block', marginBottom: '20px' }}>
                  {cap.icon}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
                  {t(cap.titleKey)}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0 }}>
                  {t(cap.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 65%)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
            {t('industriesLabel')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {INDUSTRIES.map((ind) => (
              <span
                key={ind}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'hsl(40 12% 65%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  background: 'hsl(240 12% 8%)',
                  padding: '5px 14px',
                  letterSpacing: '0.04em',
                }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem' }}>
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
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: '#F97316',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              {t('ctaPrimary')}
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
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
