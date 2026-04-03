'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('cookie-consent-accepted')
      if (!accepted) setVisible(true)
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem('cookie-consent-accepted', '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        maxWidth: '480px',
        background: '#111111',
        borderLeft: '3px solid #F97316',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeftWidth: '3px',
        borderLeftColor: '#F97316',
        padding: '1rem 1.25rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px',
            color: '#CCCCCC',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          We use no tracking cookies. Essential functions only. Your data is handled per our{' '}
          <Link
            href="/privacy"
            style={{ color: '#F97316', textDecoration: 'none' }}
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '12px',
            color: '#666666',
            margin: '4px 0 0',
            lineHeight: '1.5',
          }}
        >
          Keine Tracking-Cookies. Nur technisch notwendige Funktionen.
        </p>
      </div>
      <button
        onClick={accept}
        style={{
          flexShrink: 0,
          background: '#F97316',
          color: '#000000',
          border: 'none',
          padding: '0.4rem 0.9rem',
          fontFamily: 'var(--font-space-mono)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Got it
      </button>
    </div>
  )
}
