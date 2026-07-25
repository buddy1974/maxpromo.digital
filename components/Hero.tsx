'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { HeroSlide } from './homepage/HeroSlide'
import { HeroSlideNav } from './homepage/HeroSlideNav'
import { OperationalTicker } from './homepage/OperationalTicker'
import { LiveCard } from './homepage/LiveCard'
import { LiveCardMobile } from './homepage/LiveCardMobile'
import { AmbientGlow } from './homepage/AmbientGlow'
import { HeroParticles } from './homepage/HeroParticles'

/* ─── slide data ─────────────────────────────────────────────── */

const SLIDES = [
  { src: '/images/homepage/hero-1.png', alt: 'Agency statement, executive workspace' },
  { src: '/images/homepage/hero-2.png', alt: 'Automation story, field operations in action' },
  { src: '/images/homepage/hero-3.png', alt: 'Systems story, operations control center' },
  { src: '/images/homepage/hero-4.png', alt: 'Developer story, engineering studio' },
] as const

const SLIDE_DURATION = 6500

/*
  BLOCKER 3 FIX, text always visible.
  Initial state: opacity 1, y offset only. Animation polishes position,
  never reveals content. Text readable on first server paint.
*/
const fadeUp = {
  hidden: { opacity: 1, y: 18 },
  show:   (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

/* ─── component ──────────────────────────────────────────────── */

export default function Hero() {
  const t      = useTranslations('hero')
  const tAgent = useTranslations('home.agentBureau')
  const slides = t.raw('slides') as Array<{ label: string; items: string[]; meta: string[] }>
  const ticker = t.raw('ticker') as string[]

  const [active, setActive] = useState(0)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef  = useRef<HTMLElement>(null)
  const rafRef      = useRef<number>(0)
  const rawMouse    = useRef({ x: 0, y: 0 })
  const hasTouchRef = useRef(false)

  /*
    BLOCKER 1 FIX, Direct DOM mutation.
    bgRef  → wrapper around all HeroSlide elements (parallax ±5px)
    cardRef → wrapper around LiveCard (parallax ±10px)
    No React state updated on every mousemove frame.
    Zero component reconciliation during parallax movement.
  */
  const bgRef        = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)
  const touchStartX  = useRef<number>(0)

  // Detect touch device, disable parallax on touch
  useEffect(() => {
    hasTouchRef.current = window.matchMedia('(hover: none)').matches
  }, [])

  // Auto-advance timer
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

  // BLOCKER 1 FIX, Parallax via RAF + direct DOM transform, no setState
  useEffect(() => {
    if (hasTouchRef.current) return
    const section = sectionRef.current
    if (!section) return

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      rawMouse.current = {
        x: ((e.clientX - rect.left)  / rect.width  - 0.5) * 2,
        y: ((e.clientY - rect.top)   / rect.height - 0.5) * 2,
      }
    }

    const tick = () => {
      const x = rawMouse.current.x
      const y = rawMouse.current.y
      // bg ±5px, mutate DOM directly, no React re-render
      if (bgRef.current) {
        bgRef.current.style.transform = `translate(${x * 5}px, ${y * 5}px)`
      }
      // live card ±10px
      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${x * 10}px, ${y * 10}px)`
      }
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

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        setActive((n) => (n + 1) % SLIDES.length)
      } else {
        setActive((n) => (n - 1 + SLIDES.length) % SLIDES.length)
      }
      resetTimer()
    }
  }, [resetTimer])

  return (
    <>
      {/*
        BLOCKER 2 FIX, responsive layout for content width and live card size.
        Content max-width reduces at tablet to prevent collision.
        Live card reduces width and position at tablet.
        WARNING 2 FIX, landscape mobile: add bottom padding on short viewports.
      */}
      <style>{`
        .hero-content-col { max-width: 48rem; }
        @media (min-width: 768px) and (max-width: 1024px) {
          .hero-content-col { max-width: 40rem; }
          .hero-live-card-wrapper {
            width: 220px !important;
            right: 1rem !important;
            bottom: 80px !important;
          }
        }
        @media (max-height: 650px) {
          .hero-content-col { padding-bottom: 60px; }
        }
      `}</style>

      <section
        ref={sectionRef}
        data-section="hero"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'hsl(240 14% 4%)',
        }}
      >
        {/* BLOCKER 1 FIX, bgRef wrapper. Parallax applied here via direct DOM
            style mutation. All slide layers translate together. */}
        <div
          ref={bgRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            // transition provides natural inertia on the bg layer
            transition: 'transform 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
        >
          {SLIDES.map((slide, i) => (
            <HeroSlide
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              slideIndex={i + 1}
              active={i === active}
            />
          ))}
        </div>

        {/* z2: Ambient glow */}
        <AmbientGlow />

        {/* z3: Particles */}
        <HeroParticles />

        {/* z4: Cinema grain, hero-only, opacity 0.012 */}
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

        {/* z10: Content */}
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
          {/* BLOCKER 2 FIX, responsive class reduces max-width at tablet */}
          <div className="hero-content-col">

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
                href="/contact"
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
              <Link
                href="/contact?system=agent-bureau"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#F97316', padding: '16px 24px', textDecoration: 'none', display: 'inline-block', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
              >
                {tAgent('primaryCta')}
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

        {/* BLOCKER 1 + 2 FIX, live card wrapper.
            cardRef receives direct DOM transform (no React state).
            hero-live-card-wrapper class applies tablet responsive overrides. */}
        <div
          ref={cardRef}
          className="hero-live-card-wrapper hidden md:block"
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '2rem',
            zIndex: 20,
            width: '240px',
            transition: 'transform 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
        >
          {slides[active] && <LiveCard slide={slides[active]} />}
        </div>

        {/* Mobile live card, controlled; dots drive hero slide */}
        <LiveCardMobile slides={slides} activeSlide={active} onSlideSelect={handleSelect} />

        {/* LIVE ticker */}
        <OperationalTicker items={ticker} />

        {/* Slide nav, hidden on mobile (className="hidden md:flex" in component) */}
        <HeroSlideNav total={SLIDES.length} active={active} onSelect={handleSelect} />
      </section>
    </>
  )
}
