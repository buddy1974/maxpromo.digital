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

const mono    = { fontFamily: 'var(--font-mono)' } as const
const grotesk = { fontFamily: 'var(--font-heading)' } as const
const sans    = { fontFamily: 'var(--font-body)' } as const

const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'

export default async function PricingPage() {
  const t      = await getTranslations('pricing')
  const tTiers = await getTranslations('pricing.tiers')
  const tFaq   = await getTranslations('pricing.faq')

  return (
    <main style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ marginBottom: '20px' }}>
            {t('title')}
          </h1>
          <p style={{ ...sans, fontSize: '19px', color: 'var(--color-text-secondary)', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.75 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section style={{ background: 'var(--color-bg-section)', padding: 'clamp(3.5rem, 6vw, 6rem) 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '20px', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-3">
            {TIER_REFS.map((tier) => (
              <div
                key={tier.id}
                style={{
                  background: tier.featured ? 'rgba(249,115,22,0.03)' : 'var(--color-bg)',
                  border: tier.featured
                    ? '2px solid rgba(249,115,22,0.35)'
                    : '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                  borderRadius: 'var(--radius-card)',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {tier.hasTag && (
                  <span style={{
                    ...mono,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: 'var(--color-primary)',
                    padding: '4px 12px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                  }}>
                    ✦ {tTiers(`${tier.id}Tag`)}
                  </span>
                )}
                <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px', marginTop: tier.hasTag ? '12px' : '0' }}>
                  {tTiers(`${tier.id}Name`)}
                </p>
                <p style={{ ...grotesk, fontWeight: 800, fontSize: '48px', color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px' }}>
                  {tTiers(`${tier.id}Price`)}
                </p>
                <p style={{ ...mono, fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px', letterSpacing: '0.03em' }}>
                  {tTiers(`${tier.id}Period`)}
                </p>
                <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
                  {tTiers(`${tier.id}Desc`)}
                </p>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {tier.includesKeys.map((ik) => (
                    <div key={ik} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--brand-text-secondary)', flexShrink: 0, ...mono, fontSize: '14px' }}>✓</span>
                      <span style={{ ...sans, fontSize: '15px', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                        {tTiers(`${tier.id}${ik}`)}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={tier.href}
                  className={tier.featured ? 'btn btn-primary' : 'btn btn-secondary'}
                >
                  {tTiers(`${tier.id}Cta`)} →
                </Link>
              </div>
            ))}
          </div>
          <p style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '24px', letterSpacing: '0.05em' }}>
            {t('footnote')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('faqEyebrow')}
          </p>
          <h2 style={{ marginBottom: '3rem' }}>
            {t('faqTitle')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {FAQ_IDS.map((qid, i) => (
              <div
                key={qid}
                style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: '2rem 0',
                  borderBottom: i === FAQ_IDS.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <h3 className="h-card" style={{ marginBottom: '12px' }}>
                  {tFaq(qid)}
                </h3>
                <p style={{ ...sans, fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>
                  {tFaq(`a${qid.substring(1)}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ marginBottom: '20px' }}>
            {t('ctaTitle')}
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
          <p style={{ ...mono, fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '20px', letterSpacing: '0.05em' }}>
            {t('ctaFootnote')}
          </p>
        </div>
      </section>
    </main>
  )
}
