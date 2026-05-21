'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
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
        justifyContent: 'center',
        padding: '6rem 2rem',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid background */}
      <div
        className="grid-bg"
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '56rem',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        {/* Status badges */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '2.5rem',
            justifyContent: 'center',
          }}
        >
          <span
            className="glass"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'hsl(40 12% 65%)',
              padding: '6px 14px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              className="status-pulse"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'hsl(28 100% 58%)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {t('statusOperational')}
          </span>
          <span
            className="glass"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'hsl(40 12% 65%)',
              padding: '6px 14px',
              borderRadius: '6px',
            }}
          >
            {t('statusAgents')}
          </span>
          <span
            className="glass"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'hsl(40 12% 65%)',
              padding: '6px 14px',
              borderRadius: '6px',
            }}
          >
            {t('statusUptime')}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
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
          <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>{t('headline2')}</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'hsl(40 12% 65%)',
            maxWidth: '44rem',
            lineHeight: 1.75,
            marginBottom: '2.5rem',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {t('sub')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem', justifyContent: 'center' }}
        >
          <Link
            href="/automation-audit"
            className="shine"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '15px',
              color: 'hsl(240 14% 4%)',
              background: 'hsl(28 100% 58%)',
              padding: '16px 32px',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '10px',
              boxShadow: '0 0 40px hsl(28 100% 58% / 0.3)',
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
            {t('ctaSecondary')}
          </Link>
        </motion.div>

        {/* Urgency */}
        <motion.p
          custom={4}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'hsl(240 8% 35%)',
            letterSpacing: '0.05em',
          }}
        >
          {t('urgency')}
        </motion.p>
      </div>
    </section>
  )
}
