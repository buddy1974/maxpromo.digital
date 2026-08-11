'use client'

import Link from 'next/link'
import { useState } from 'react'

interface AutomationCardProps {
  title: string
  description: string
  tools: string[]
  locale: string
}

/* ─── LOCALE HELPER ───────────────────────────────────────── */
function t(locale: string, de: string, en: string): string {
  return locale === 'de' ? de : en
}

export default function AutomationCard({ title, description, tools, locale }: AutomationCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--color-bg-section)' : 'var(--color-bg)',
        border: `1px solid ${hovered ? 'rgba(249,115,22,0.3)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
        transition: 'all 0.25s ease',
        cursor: 'default',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
          flex: 1,
          marginBottom: '20px',
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
        {tools.map((tool) => (
          <span
            key={tool}
            style={{
              background: 'rgba(249,115,22,0.08)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(249,115,22,0.2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '5px',
            }}
          >
            {tool}
          </span>
        ))}
      </div>
      <Link
        href={`/contact?automation=${encodeURIComponent(title)}`}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-primary)',
          textDecoration: 'none',
          letterSpacing: '0.08em',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        {t(locale, 'Anfragen →', 'Request This →')}
      </Link>
    </div>
  )
}
