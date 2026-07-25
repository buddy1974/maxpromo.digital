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
    <section style={{ padding: '6rem 2rem', background: 'hsl(240 12% 6%)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'hsl(28 100% 58%)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            {t('eyebrow')}
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '1rem',
            }}
          >
            {t('title')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing grid */}
        <div
          style={{ display: 'grid', gap: '1rem', alignItems: 'start' }}
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
                background: plan.featured
                  ? 'linear-gradient(135deg, hsl(28 100% 58% / 0.1), hsl(240 12% 7%) 60%)'
                  : 'hsl(240 12% 7%)',
                border: plan.featured
                  ? '1px solid hsl(28 100% 58% / 0.4)'
                  : '1px solid hsl(40 30% 96% / 0.06)',
                borderRadius: '16px',
                padding: '2.5rem',
                boxShadow: plan.featured ? 'var(--glow-primary)' : 'none',
              }}
            >
              {plan.featured && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: 'hsl(240 14% 4%)',
                    background: 'hsl(28 100% 58%)',
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
                  fontSize: '11px',
                  color: 'hsl(28 100% 58%)',
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
                  fontWeight: 700,
                  fontSize: '48px',
                  letterSpacing: '-0.04em',
                  color: 'hsl(40 30% 96%)',
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {t(`${plan.id}Price`)}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginBottom: '1.5rem' }}>
                {t(`${plan.id}Period`)}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, marginBottom: '2rem' }}>
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
                      fontSize: '14px',
                      color: 'hsl(40 30% 96%)',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: plan.featured ? 'hsl(28 100% 58%)' : 'hsl(240 10% 16%)',
                        color: plan.featured ? 'hsl(240 14% 4%)' : 'hsl(28 100% 58%)',
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
                className={plan.featured ? 'shine' : ''}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: plan.featured ? 'hsl(240 14% 4%)' : 'hsl(40 30% 96%)',
                  background: plan.featured ? 'hsl(28 100% 58%)' : 'transparent',
                  border: plan.featured ? 'none' : '1px solid hsl(40 30% 96% / 0.12)',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                  borderRadius: '10px',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {t(`${plan.id}Cta`)} →
              </Link>
            </motion.div>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', textAlign: 'center', marginTop: '2.5rem', letterSpacing: '0.05em' }}>
          {t('footnote')}
        </p>
      </div>
    </section>
  )
}
