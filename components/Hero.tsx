'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'

/*
  Visual Facelift v2.1 — hero rewritten from a 4-slide Ken Burns photo
  carousel + particles + ambient glow + floating live-ticker card down to
  a typography-led hero per design/visual-facelift-v2.1.md: "Keep only one
  strong visual element... Avoid multiple floating graphics, generic AI
  illustrations, futuristic artwork." No replacement diagram/screenshot
  asset exists yet (known-risks.md), so the correct call per spec is no
  decorative visual rather than a placeholder. Copy is unchanged.
*/

const fadeUp = {
  hidden: { opacity: 1, y: 18 },
  show:   (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

export default function Hero() {
  const t      = useTranslations('hero')
  const tAgent = useTranslations('home.agentBureau')

  return (
    <section
      data-section="hero"
      style={{
        background: 'var(--color-bg)',
        padding: 'clamp(4rem, 10vw, 8rem) 2rem clamp(4rem, 8vw, 6rem)',
      }}
    >
      <div style={{ maxWidth: '52rem', margin: '0 auto' }}>

        <motion.p
          custom={0} initial="hidden" animate="show" variants={fadeUp}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5rem' }}
        >
          {t('eyebrow')}
        </motion.p>

        <motion.h1
          custom={1} initial="hidden" animate="show" variants={fadeUp}
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(2.75rem, 6vw, 5.25rem)', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '1.75rem' }}
        >
          <span style={{ display: 'block', color: 'var(--color-text-primary)' }}>{t('headline1')}</span>
          <span style={{ display: 'block', color: 'var(--color-primary)' }}>{t('headlineAccent')}</span>
          {t('headline2') && (
            <span style={{ display: 'block', color: 'var(--color-text-primary)' }}>{t('headline2')}</span>
          )}
        </motion.h1>

        <motion.p
          custom={2} initial="hidden" animate="show" variants={fadeUp}
          style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '40rem' }}
        >
          {t('sub')}
        </motion.p>

        <motion.div
          custom={3} initial="hidden" animate="show" variants={fadeUp}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2rem' }}
        >
          <Link href="/contact" className="btn btn-primary">
            {t('ctaPrimary')}
          </Link>
          <Link href="/services" className="btn btn-secondary">
            {t('ctaSecondary')} →
          </Link>
          {/* Routing correction 2026-07-25: was a direct /contact?system= link,
              bypassing the dedicated Agent Bureau page. Now routes there first;
              that page carries its own external/contact CTA pair. */}
          <Link
            href="/systems/agent-bureau"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-primary)', padding: '14px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
          >
            {tAgent('primaryCta')}
          </Link>
        </motion.div>

        <motion.div
          custom={4} initial="hidden" animate="show" variants={fadeUp}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
        >
          {(['statusOperational', 'statusAgents', 'statusUptime'] as const).map((k) => (
            <span
              key={k}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-section)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}
            >
              {t(k)}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
