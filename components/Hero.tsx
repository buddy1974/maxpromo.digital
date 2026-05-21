'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.75, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

export default function Hero() {
  const t = useTranslations('hero')

  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'hsl(240 14% 4%)',
      }}
    >
      {/* Hero background image — swap in /public/images/homepage/hero.jpg when ready */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'linear-gradient(to right, hsl(240 14% 4%) 40%, hsl(240 14% 4% / 0.75) 70%, hsl(240 14% 4% / 0.45) 100%)',
            'url(/images/homepage/hero.jpg) center right / cover no-repeat',
          ].join(', '),
          zIndex: 0,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="grid-bg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 20% 50%, black 20%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 60% 80% at 20% 50%, black 20%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Content — left-aligned */}
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 2rem',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ maxWidth: '48rem' }}>

          {/* Eyebrow */}
          <motion.p
            custom={0} initial="hidden" animate="show" variants={fadeUp}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}
          >
            {t('eyebrow')}
          </motion.p>

          {/* Headline */}
          <motion.h1
            custom={1} initial="hidden" animate="show" variants={fadeUp}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              marginBottom: '1.75rem',
            }}
          >
            <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>{t('headline1')}</span>
            <span style={{ display: 'block', color: '#F97316' }}>{t('headlineAccent')}</span>
            {t('headline2') && (
              <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>{t('headline2')}</span>
            )}
          </motion.h1>

          {/* Sub */}
          <motion.p
            custom={2} initial="hidden" animate="show" variants={fadeUp}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'hsl(40 12% 65%)',
              lineHeight: 1.75,
              marginBottom: '2.5rem',
              maxWidth: '40rem',
            }}
          >
            {t('sub')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3} initial="hidden" animate="show" variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1.75rem' }}
          >
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: '#F97316',
                padding: '16px 32px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 40px rgba(249,115,22,0.3)',
              }}
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/services"
              className="glass-strong"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '16px 32px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              {t('ctaSecondary')} →
            </Link>
          </motion.div>

          {/* Status chips */}
          <motion.div
            custom={4} initial="hidden" animate="show" variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}
          >
            {(['statusOperational', 'statusAgents', 'statusUptime'] as const).map((k, i) => (
              <span
                key={k}
                className="glass"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'hsl(40 12% 55%)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: i === 0 ? '6px' : undefined,
                }}
              >
                {i === 0 && (
                  <span
                    className="status-pulse"
                    style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }}
                  />
                )}
                {t(k)}
              </span>
            ))}
          </motion.div>

          {/* Urgency */}
          <motion.p
            custom={5} initial="hidden" animate="show" variants={fadeUp}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 32%)', letterSpacing: '0.05em' }}
          >
            {t('urgency')}
          </motion.p>

        </div>
      </div>
    </section>
  )
}
