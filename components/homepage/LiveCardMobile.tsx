'use client'

import { useState } from 'react'

interface SlideCard {
  label: string
  items: string[]
  meta: string[]
}

interface LiveCardMobileProps {
  slides: SlideCard[]
  activeSlide: number
}

const DOT_CLASSES = ['pulse-dot-1', 'pulse-dot-2', 'pulse-dot-3'] as const

export function LiveCardMobile({ slides, activeSlide }: LiveCardMobileProps) {
  const [cardIndex, setCardIndex] = useState(0)
  const slide = slides[cardIndex] ?? slides[0]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: 'calc(100% - 4rem)',
        maxWidth: '320px',
      }}
      className="md:hidden"
    >
      <div
        style={{
          background: 'rgba(10,10,14,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(249,115,22,0.12)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}
      >
        {/* Header with swipe dots */}
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#F97316',
              textTransform: 'uppercase',
            }}
          >
            {slide.label}
          </span>
          {/* Swipe dots */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIndex(i)}
                style={{
                  width: i === cardIndex ? '12px' : '4px',
                  height: '4px',
                  borderRadius: '2px',
                  background: i === cardIndex ? '#F97316' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 250ms ease, background 250ms ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Compact 2-item row */}
        <div style={{ padding: '8px 12px 10px', display: 'flex', gap: '12px' }}>
          {slide.items.slice(0, 2).map((item, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span
                  className={DOT_CLASSES[i % 3]}
                  style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(249,115,22,0.65)', paddingLeft: '9px' }}>
                {slide.meta[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
