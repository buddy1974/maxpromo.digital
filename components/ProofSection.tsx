'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const RESULT_KEYS = ['stat1', 'stat2', 'stat3'] as const
const QUOTE_KEYS  = ['quote1', 'quote2'] as const

export default function ProofSection() {
  const t = useTranslations('proof')

  return (
    <section style={{ padding: '6rem 2rem', background: 'hsl(240 14% 4%)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
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
              marginBottom: '0',
            }}
          >
            {t('title')}
          </h2>
        </div>

        {/* Results cards */}
        <div
          style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', marginBottom: '3rem', borderRadius: '16px', overflow: 'hidden' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {RESULT_KEYS.map((k, i) => (
            <motion.div
              key={k}
              className="border-gradient"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'hsl(240 12% 7%)',
                padding: '2.5rem',
                borderRadius: '0',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 'clamp(3rem, 5vw, 4rem)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: '12px',
                  color: '#F97316',
                }}
              >
                {t(`${k}Value`)}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'hsl(40 30% 96%)', lineHeight: 1.5, marginBottom: '12px' }}>
                {t(`${k}Desc`)}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.05em' }}>
                {t(`${k}Source`)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div
          style={{ display: 'grid', gap: '1rem' }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {QUOTE_KEYS.map((k, i) => (
            <motion.blockquote
              key={k}
              className="glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                margin: 0,
                padding: '2rem',
                borderRadius: '16px',
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '80px',
                  lineHeight: 0.8,
                  color: 'hsl(28 100% 58% / 0.2)',
                  display: 'block',
                  marginBottom: '1rem',
                }}
              >
                &ldquo;
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  color: 'hsl(40 30% 96%)',
                  lineHeight: 1.7,
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                }}
              >
                {t(k)}
              </p>
              <figcaption
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid hsl(40 30% 96% / 0.06)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', marginBottom: '2px' }}>
                  {t(`${k}Author`)}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)' }}>
                  {t(`${k}Detail`)}
                </p>
              </figcaption>
            </motion.blockquote>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)', textAlign: 'center', marginTop: '2rem', letterSpacing: '0.05em' }}>
          {t('footnote')}
        </p>
      </div>
    </section>
  )
}
