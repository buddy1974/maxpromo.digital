'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const ITEMS = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'] as const

export function PainSlider() {
  const t       = useTranslations('home.slider')
  const [active, setActive]   = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActive((n) => (n + 1) % ITEMS.length)
        setVisible(true)
      }, 220)
    }, 4200)
    return () => clearInterval(id)
  }, [])

  const key = ITEMS[active]

  return (
    <div
      style={{
        background: 'var(--brand-surface-subtle)',
        borderTop: '1px solid var(--brand-border)',
        borderBottom: '1px solid var(--brand-border)',
        padding: '22px 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-5)',
          flexWrap: 'wrap',
        }}
      >
        {/* Fixed label */}
        <span
          style={{
            fontFamily: 'var(--brand-font-sans)',
            fontSize: 'var(--text-label)',
            color: 'var(--brand-text-secondary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {t('prefix')}
        </span>

        {/* Rotating content */}
        <span
          style={{
            fontFamily: 'var(--brand-font-mono)',
            fontSize: '14px',
            opacity: visible ? 1 : 0,
            transition: 'opacity var(--duration-base) var(--ease)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            flex: 1,
          }}
        >
          <span style={{ color: 'var(--brand-text)' }}>
            {t(`${key}Pain`)}
          </span>
          <span style={{ color: 'var(--brand-text-secondary)' }}>-</span>
          <span style={{ color: 'var(--brand-text-secondary)' }}>
            {t(`${key}Fix`)}
          </span>
        </span>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
          {ITEMS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setActive(i); setVisible(true) }, 220) }}
              aria-label={`Go to item ${i + 1}`}
              style={{
                width: i === active ? '18px' : '5px',
                height: '5px',
                borderRadius: 'var(--radius-xs)',
                background: i === active ? 'var(--brand-primary)' : 'var(--brand-border)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width var(--duration-base) var(--ease), background var(--duration-base) var(--ease)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
