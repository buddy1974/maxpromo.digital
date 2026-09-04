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
        background: hovered ? 'var(--brand-surface-subtle)' : 'var(--brand-background)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--brand-primary) 30%, transparent)' : 'var(--brand-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'border-color var(--duration-base) var(--ease), background-color var(--duration-base) var(--ease)',
        cursor: 'default',
      }}
    >
      <h3 className="h-card" style={{ marginBottom: '10px' }}>
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--brand-font-body)',
          fontSize: 'var(--text-small)',
          color: 'var(--brand-text-secondary)',
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
              fontFamily: 'var(--brand-font-mono)',
              fontSize: 'var(--text-label)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {tool}
          </span>
        ))}
      </div>
      <Link
        href={`/contact?automation=${encodeURIComponent(title)}`}
        style={{
          fontFamily: 'var(--brand-font-mono)',
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
