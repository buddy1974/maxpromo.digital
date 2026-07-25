import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pricing')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

interface TierRef {
  id: 't1' | 't2' | 't3'
  href: string
  featured: boolean
  hasTag: boolean
  includesKeys: ReadonlyArray<'I1' | 'I2' | 'I3' | 'I4' | 'I5' | 'I6' | 'I7' | 'I8'>
}

const TIER_REFS: ReadonlyArray<TierRef> = [
  {
    id: 't1', href: '/contact', featured: false, hasTag: false,
    includesKeys: ['I1','I2','I3','I4','I5','I6'],
  },
  {
    id: 't2', href: '/contact', featured: true, hasTag: true,
    includesKeys: ['I1','I2','I3','I4','I5','I6','I7','I8'],
  },
  {
    id: 't3', href: '/contact', featured: false, hasTag: false,
    includesKeys: ['I1','I2','I3','I4','I5','I6','I7','I8'],
  },
]

const FAQ_IDS = ['q1', 'q2', 'q3', 'q4'] as const

const mono    = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans    = { fontFamily: 'var(--font-inter)' } as const

export default async function PricingPage() {
  const t      = await getTranslations('pricing')
  const tTiers = await getTranslations('pricing.tiers')
  const tFaq   = await getTranslations('pricing.faq')

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>
      {/* Header */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            {t('title')}
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.8 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '16px', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-3">
            {TIER_REFS.map((tier) => (
              <div
                key={tier.id}
                style={{
                  background: tier.featured
                    ? 'linear-gradient(135deg, hsl(28 100% 58% / 0.1), hsl(240 12% 7%) 60%)'
                    : 'hsl(240 12% 7%)',
                  border: tier.featured
                    ? '1px solid hsl(28 100% 58% / 0.4)'
                    : '1px solid hsl(40 30% 96% / 0.08)',
                  boxShadow: tier.featured ? 'var(--glow-primary)' : 'none',
                  borderRadius: '16px',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {tier.hasTag && (
                  <span style={{
                    ...mono,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'hsl(240 14% 4%)',
                    background: '#F97316',
                    padding: '4px 12px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                  }}>
                    ✦ {tTiers(`${tier.id}Tag`)}
                  </span>
                )}
                <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', marginTop: tier.hasTag ? '12px' : '0' }}>
                  {tTiers(`${tier.id}Name`)}
                </p>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '42px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '4px' }}>
                  {tTiers(`${tier.id}Price`)}
                </p>
                <p style={{ ...mono, fontSize: '12px', color: 'hsl(40 12% 65%)', marginBottom: '20px', letterSpacing: '0.05em' }}>
                  {tTiers(`${tier.id}Period`)}
                </p>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, marginBottom: '28px' }}>
                  {tTiers(`${tier.id}Desc`)}
                </p>
                <div style={{ borderTop: '1px solid hsl(40 30% 96% / 0.08)', paddingTop: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {tier.includesKeys.map((ik) => (
                    <div key={ik} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid hsl(40 30% 96% / 0.05)' }}>
                      <span style={{ color: '#F97316', flexShrink: 0, ...mono, fontSize: '13px' }}>✓</span>
                      <span style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96% / 0.8)', lineHeight: 1.5 }}>
                        {tTiers(`${tier.id}${ik}`)}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={tier.href}
                  className={tier.featured ? 'shine' : ''}
                  style={{
                    ...mono,
                    fontWeight: 700,
                    fontSize: '14px',
                    color: tier.featured ? 'hsl(240 14% 4%)' : 'hsl(40 30% 96%)',
                    background: tier.featured ? '#F97316' : 'transparent',
                    border: tier.featured ? 'none' : '1px solid hsl(40 30% 96% / 0.12)',
                    boxShadow: tier.featured ? '0 4px 20px rgba(249,115,22,0.4)' : 'none',
                    padding: '14px 24px',
                    textDecoration: 'none',
                    display: 'block',
                    textAlign: 'center',
                    borderRadius: '10px',
                  }}
                >
                  {tTiers(`${tier.id}Cta`)} →
                </Link>
              </div>
            ))}
          </div>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(40 12% 65%)', textAlign: 'center', marginTop: '24px', letterSpacing: '0.05em' }}>
            {t('footnote')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('faqEyebrow')}
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '3rem' }}>
            {t('faqTitle')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {FAQ_IDS.map((qid, i) => (
              <div
                key={qid}
                style={{
                  borderTop: '1px solid hsl(40 30% 96% / 0.07)',
                  padding: '2rem 0',
                  borderBottom: i === FAQ_IDS.length - 1 ? '1px solid hsl(40 30% 96% / 0.07)' : 'none',
                }}
              >
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '18px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                  {tFaq(qid)}
                </h3>
                <p style={{ ...sans, fontSize: '16px', color: 'hsl(40 12% 65%)', lineHeight: 1.8 }}>
                  {tFaq(`a${qid.substring(1)}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="shine" style={{ ...mono, fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="glass" style={{ ...sans, fontWeight: 500, fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
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
