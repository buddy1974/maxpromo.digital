'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6'] as const

export default function FaqSection() {
  const t = useTranslations('faq')
  const [open, setOpen] = useState<number | null>(0)

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
            }}
          >
            {t('title')}
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '800px' }}>
          {FAQ_KEYS.map((k, i) => (
            <div
              key={k}
              className="glass"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: open === i
                  ? '1px solid hsl(28 100% 58% / 0.2)'
                  : '1px solid hsl(40 30% 96% / 0.06)',
                transition: 'border-color 200ms ease',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '1rem',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    fontSize: '17px',
                    color: 'hsl(40 30% 96%)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                  }}
                >
                  {t(`q${k}`)}
                </span>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: open === i ? 'hsl(28 100% 58%)' : 'hsl(240 10% 16%)',
                    color: open === i ? 'hsl(240 14% 4%)' : 'hsl(40 30% 96%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                    transition: 'background 200ms ease, color 200ms ease',
                  }}
                >
                  {open === i ? '−' : '+'}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px',
                        color: 'hsl(40 12% 65%)',
                        lineHeight: 1.75,
                        padding: '0 1.5rem 1.5rem',
                      }}
                    >
                      {t(`a${k}`)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
