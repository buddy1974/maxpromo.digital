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
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--brand-primary) 30%, transparent)' : 'var(--color-border)'}`,
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
      <h3 className="h-card" style={{ marginBottom: '10px' }}>
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
              background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)',
              color: 'var(--brand-text-secondary)',
              border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)',
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
          color: 'var(--brand-text-secondary)',
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
