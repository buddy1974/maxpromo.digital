'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroSlide } from './homepage/HeroSlide'
import { HeroSlideNav } from './homepage/HeroSlideNav'
import { OperationalTicker } from './homepage/OperationalTicker'
import { LiveCard } from './homepage/LiveCard'
import { LiveCardMobile } from './homepage/LiveCardMobile'
import { AmbientGlow } from './homepage/AmbientGlow'
import { HeroParticles } from './homepage/HeroParticles'

/* ─── slide data ───────────────────────────────────────────── */

const SLIDES = [
  { src: '/images/homepage/hero-1.png', alt: 'Agency statement — executive workspace' },
  { src: '/images/homepage/hero-2.png', alt: 'Automation story — field operations in action' },
  { src: '/images/homepage/hero-3.png', alt: 'Systems story — operations control center' },
  { src: '/images/homepage/hero-4.png', alt: 'Developer story — engineering studio' },
] as const

const SLIDE_DURATION = 6500 // ms

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

/* ─── component ─────────────────────────────────────────────── */

export default function Hero() {
  const t      = useTranslations('hero')
  const slides = t.raw('slides') as Array<{ label: string; items: string[]; meta: string[] }>
  const ticker = t.raw('ticker') as string[]

  const [active, setActive]     = useState(0)
  const [mouseX, setMouseX]     = useState(0)
  const [mouseY, setMouseY]     = useState(0)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const rafRef     = useRef<number>(0)
  const rawMouse   = useRef({ x: 0, y: 0 })
  const hasTouchRef = useRef(false)

  // Detect touch device — disable parallax
  useEffect(() => {
    hasTouchRef.current = window.matchMedia('(hover: none)').matches
  }, [])

  // Auto-advance
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActive((n) => (n + 1) % SLIDES.length)
    }, SLIDE_DURATION)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  // Mouse parallax via RAF (no state thrash on every move)
  useEffect(() => {
    if (hasTouchRef.current) return
    const section = sectionRef.current
    if (!section) return

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      // Normalize to -1 … +1 from center
      rawMouse.current = {
        x: ((e.clientX - rect.left) / rect.width  - 0.5) * 2,
        y: ((e.clientY - rect.top)  / rect.height - 0.5) * 2,
      }
    }

    const tick = () => {
      // bg moves ±5px, live card moves ±10px
      setMouseX(rawMouse.current.x * 5)
      setMouseY(rawMouse.current.y * 5)
      rafRef.current = requestAnimationFrame(tick)
    }

    section.addEventListener('mousemove', onMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      section.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleSelect = (i: number) => {
    setActive(i)
    resetTimer()
  }

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'hsl(240 14% 4%)',
      }}
    >
      {/* ── BACKGROUND LAYERS (z 0–5) ── */}

      {/* z0: Slide images with Ken Burns */}
      {SLIDES.map((slide, i) => (
        <HeroSlide
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          slideIndex={i + 1}
          active={i === active}
          parallaxX={mouseX}
          parallaxY={mouseY}
        />
      ))}

      {/* z2: Ambient glow — warmth behind headline */}
      <AmbientGlow />

      {/* z3: Particles — 12–16, barely visible, slow */}
      <HeroParticles />

      {/* z4: Cinema grain — hero-only, opacity 0.012 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
          opacity: 0.012,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '300px 300px',
        }}
      />

      {/* z5: Grid bg */}
      <div
        className="grid-bg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 22% 50%, black 20%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 60% 80% at 22% 50%, black 20%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── CONTENT (z 10) ── */}
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 2rem',
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: '48rem' }}>

          <motion.p
            custom={0} initial="hidden" animate="show" variants={fadeUp}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.5rem' }}
          >
            {t('eyebrow')}
          </motion.p>

          <motion.h1
            custom={1} initial="hidden" animate="show" variants={fadeUp}
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(3rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 1.02, marginBottom: '1.75rem' }}
          >
            <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>{t('headline1')}</span>
            <span style={{ display: 'block', color: '#F97316' }}>{t('headlineAccent')}</span>
            {t('headline2') && (
              <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>{t('headline2')}</span>
            )}
          </motion.h1>

          <motion.p
            custom={2} initial="hidden" animate="show" variants={fadeUp}
            style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: '40rem' }}
          >
            {t('sub')}
          </motion.p>

          <motion.div
            custom={3} initial="hidden" animate="show" variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1.75rem' }}
          >
            <Link
              href="/automation-audit"
              className="shine"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px', boxShadow: '0 0 40px rgba(249,115,22,0.3)' }}
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/services"
              className="glass-strong"
              style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}
            >
              {t('ctaSecondary')} →
            </Link>
          </motion.div>

          <motion.div
            custom={4} initial="hidden" animate="show" variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}
          >
            {(['statusOperational', 'statusAgents', 'statusUptime'] as const).map((k, i) => (
              <span
                key={k}
                className="glass"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 55%)', padding: '5px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: i === 0 ? '6px' : undefined }}
              >
                {i === 0 && (
                  <span className="pulse-dot-1" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }} />
                )}
                {t(k)}
              </span>
            ))}
          </motion.div>

          <motion.p
            custom={5} initial="hidden" animate="show" variants={fadeUp}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 32%)', letterSpacing: '0.05em' }}
          >
            {t('urgency')}
          </motion.p>
        </div>
      </div>

      {/* ── LIVE CARD — desktop z20 ── */}
      {slides[active] && (
        <LiveCard
          slide={slides[active]}
          parallaxX={mouseX * 2}    /* 10px max: mouseX is ±5 so ×2 = ±10 */
          parallaxY={mouseY * 2}
        />
      )}

      {/* ── LIVE CARD — mobile z20 ── */}
      <LiveCardMobile slides={slides} activeSlide={active} />

      {/* ── TICKER — z20, full width, bottom: 0 ── */}
      <OperationalTicker items={ticker} />

      {/* ── SLIDE NAV — z25, bottom: 48px, right ── */}
      <HeroSlideNav total={SLIDES.length} active={active} onSelect={handleSelect} />
    </section>
  )
}
