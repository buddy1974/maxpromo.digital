'use client'

import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface PlanRef {
  id: 'plan1' | 'plan2' | 'plan3'
  href: string
  featured: boolean
  featureKeys: ReadonlyArray<string>
}

const PLAN_REFS: PlanRef[] = [
  { id: 'plan1', href: '/contact',   featured: false, featureKeys: ['F1','F2','F3','F4','F5'] },
  { id: 'plan2', href: '/contact',  featured: true,  featureKeys: ['F1','F2','F3','F4','F5','F6'] },
  { id: 'plan3', href: '/contact',    featured: false, featureKeys: ['F1','F2','F3','F4','F5','F6'] },
]

export default function PricingSection() {
  const t = useTranslations('pricingSection')

  return (
    <section style={{ padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem', background: 'var(--color-bg-section)' }}>
      <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-primary)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            {t('eyebrow')}
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
            }}
          >
            {t('title')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing grid */}
        <div
          style={{ display: 'grid', gap: '1.25rem', alignItems: 'start' }}
          className="grid-cols-1 lg:grid-cols-3"
        >
          {PLAN_REFS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                background: 'var(--color-bg)',
                border: plan.featured
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '2.5rem',
                boxShadow: plan.featured ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
              }}
            >
              {plan.featured && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#FFFFFF',
                    background: 'var(--color-primary)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('mostChosen')}
                </span>
              )}

              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--color-primary)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                {t(`${plan.id}Name`)}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '48px',
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                  marginBottom: '6px',
                }}
              >
                {t(`${plan.id}Price`)}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                {t(`${plan.id}Period`)}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '2rem' }}>
                {t(`${plan.id}Desc`)}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.featureKeys.map((fk) => (
                  <li
                    key={fk}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '15px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: plan.featured ? 'var(--color-primary)' : 'var(--color-bg-section)',
                        color: plan.featured ? '#FFFFFF' : 'var(--color-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      ✓
                    </span>
                    {t(`${plan.id}${fk}`)}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={plan.featured ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ display: 'block', textAlign: 'center' }}
              >
                {t(`${plan.id}Cta`)} →
              </Link>
            </motion.div>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '2.5rem', letterSpacing: '0.05em' }}>
          {t('footnote')}
        </p>
      </div>
    </section>
  )
}
