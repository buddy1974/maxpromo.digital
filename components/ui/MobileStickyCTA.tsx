'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { OPEN_MAX_CHAT } from '@/lib/events'

type SectionId = 'hero' | 'pain' | 'proof' | 'systems'

const COPY: Record<SectionId, { en: string; de: string }> = {
  hero:    { en: 'Get Free Audit',       de: 'Kostenloser Geschäfts-Check' },
  pain:    { en: 'Fix This — Free Check', de: 'Problem lösen — Kostenlos'  },
  proof:   { en: 'Get These Results',    de: 'Diese Ergebnisse sehen'      },
  systems: { en: 'View This System',     de: 'System ansehen'              },
}

const DEFAULT = { en: 'Get Free Audit', de: 'Kostenloser Geschäfts-Check' }

function label(section: SectionId | null, locale: string): string {
  if (!section) return locale === 'de' ? DEFAULT.de : DEFAULT.en
  return locale === 'de' ? COPY[section].de : COPY[section].en
}

export function MobileStickyCTA() {
  const [visible, setVisible] = useState(false)
  const [section, setSection] = useState<SectionId | null>(null)
  const [pulsing, setPulsing] = useState(false)
  const pathname = usePathname()
  const locale   = useLocale()

  // ── Section detection ────────────────────────────────────────
  useEffect(() => {
    const hero    = document.querySelector<Element>('[data-section="hero"]')
    const footer  = document.querySelector<Element>('footer')
    const allSecs = document.querySelectorAll<Element>('[data-section]')

    // Non-homepage fallback — no hero marker, use scroll threshold
    if (!hero) {
      const check = () => setVisible(window.scrollY > 300)
      window.addEventListener('scroll', check, { passive: true })
      check()
      return () => window.removeEventListener('scroll', check)
    }

    // Visibility: appear once hero leaves, disappear at footer
    const visObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero)   setVisible(!e.isIntersecting)
          if (e.target === footer && e.isIntersecting) setVisible(false)
        }
      },
      { threshold: 0.15 },
    )

    // Text: highest-ratio section wins
    const textObs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (best) {
          const id = best.target.getAttribute('data-section') as SectionId | null
          if (id) setSection(id)
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75] },
    )

    visObs.observe(hero)
    if (footer) visObs.observe(footer)
    allSecs.forEach((s) => textObs.observe(s))

    return () => {
      visObs.disconnect()
      textObs.disconnect()
    }
  }, [pathname])

  // ── Pulse every 6 s ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setPulsing(true)
      setTimeout(() => setPulsing(false), 700)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const ctaText = label(section, locale)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mobile-sticky-cta"
          className="md:hidden"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            // gradient so content behind doesn't hard-cut
            background: 'linear-gradient(to top, hsl(240 14% 4%) 60%, hsl(240 14% 4% / 0))',
            pointerEvents: 'none',  // gradient layer passes clicks through
          }}
        >
          <div style={{ maxWidth: '640px', margin: '0 auto', pointerEvents: 'auto' }}>
            <motion.button
              onClick={() => window.dispatchEvent(new Event(OPEN_MAX_CHAT))}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: pulsing
                  ? '0 0 0 8px rgba(249,115,22,0.18), 0 0 32px rgba(249,115,22,0.40)'
                  : '0 0 28px rgba(249,115,22,0.28)',
              }}
              transition={{ duration: 0.35 }}
              style={{
                width: '100%',
                minHeight: '52px',
                background: '#F97316',
                border: 'none',
                borderRadius: '16px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '0.04em',
                color: 'hsl(240 14% 4%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                overflow: 'hidden',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={ctaText}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {ctaText}
                </motion.span>
              </AnimatePresence>
              <span aria-hidden="true">→</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
