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
        background: 'hsl(240 14% 3%)',
        borderTop: '1px solid hsl(40 30% 96% / 0.05)',
        borderBottom: '1px solid hsl(40 30% 96% / 0.05)',
        padding: '20px 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Fixed label */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'hsl(40 12% 40%)',
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
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            opacity: visible ? 1 : 0,
            transition: 'opacity 220ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            flex: 1,
          }}
        >
          <span style={{ color: 'hsl(40 30% 96%)' }}>
            {t(`${key}Pain`)}
          </span>
          <span style={{ color: 'hsl(40 12% 40%)' }}>—</span>
          <span style={{ color: '#F97316' }}>
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
                borderRadius: '3px',
                background: i === active ? '#F97316' : 'hsl(40 30% 96% / 0.15)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 300ms ease, background 300ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
