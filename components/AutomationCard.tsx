'use client'

import { useState } from 'react'

interface AutomationCardProps {
  title: string
  description: string
  tools: string[]
}

export default function AutomationCard({ title, description, tools }: AutomationCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#161616' : '#0F0F0F',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: hovered ? '2px solid #F97316' : '2px solid transparent',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: '18px',
          color: '#FFFFFF',
          letterSpacing: '-0.03em',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '15px',
          color: '#999999',
          lineHeight: 1.7,
          flex: 1,
          marginBottom: '20px',
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {tools.map((tool) => (
          <span
            key={tool}
            style={{
              background: '#1A1A1A',
              color: '#F97316',
              border: '1px solid rgba(249,115,22,0.2)',
              fontFamily: 'var(--font-space-mono)',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '2px',
            }}
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  )
}
