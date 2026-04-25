'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const PLANS = [
  {
    name: 'Spark',
    price: '€1,499',
    period: 'one-time',
    desc: 'One automation system. Ideal for a single high-impact workflow.',
    features: [
      '1 custom automation workflow',
      'n8n or Make deployment',
      'API & webhook integration',
      'Testing + handover',
      '30-day support',
    ],
    cta: 'Start with Spark',
    href: '/estimate',
    featured: false,
  },
  {
    name: 'Engine',
    price: '€3,999',
    period: 'one-time',
    desc: 'A full automation suite. Multiple agents, connected systems, full stack.',
    features: [
      '3-5 automation systems',
      'AI agent deployment',
      'CRM / ERP / accounting integration',
      'Custom dashboard',
      '60-day support + monitoring',
      'Priority response',
    ],
    cta: 'Book a discovery call',
    href: '/discovery',
    featured: true,
  },
  {
    name: 'Operating System',
    price: 'Custom',
    period: 'quoted',
    desc: 'Full AI operating layer for your business. Ongoing, evolving, monitored.',
    features: [
      'Unlimited automations',
      'Dedicated AI agents',
      'Monthly strategy sessions',
      'Proactive optimisation',
      'Custom OS build if needed',
      'SLA uptime guarantee',
    ],
    cta: 'Talk to founders',
    href: '/contact',
    featured: false,
  },
]

export default function PricingSection() {
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
            // 04 — PRICING
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
            Straightforward pricing.
            <br />No retainer traps.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            You pay for what gets built. No monthly lock-in unless you want ongoing management.
          </p>
        </div>

        {/* Pricing grid */}
        <div
          style={{ display: 'grid', gap: '1rem', alignItems: 'start' }}
          className="grid-cols-1 lg:grid-cols-3"
        >
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
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
                  ✦ Most chosen
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
                {plan.name}
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
                {plan.price}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginBottom: '1.5rem' }}>
                {plan.period}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, marginBottom: '2rem' }}>
                {plan.desc}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f) => (
                  <li
                    key={f}
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
                    {f}
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
                {plan.cta} →
              </Link>
            </motion.div>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', textAlign: 'center', marginTop: '2.5rem', letterSpacing: '0.05em' }}>
          // All projects include a free pre-build scope call. No contract without your sign-off.
        </p>
      </div>
    </section>
  )
}
