'use client'

import Link from 'next/link'
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
        border: `1px solid ${hovered ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '2px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        transition: 'all 0.25s ease',
        cursor: 'default',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.5) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <h3
        style={{
          fontFamily: 'var(--font-inter)',
          fontWeight: 700,
          fontSize: '16px',
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '13px',
          color: '#888888',
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
              color: '#F97316',
              border: '1px solid rgba(249,115,22,0.2)',
              fontFamily: 'var(--font-roboto-mono)',
              fontSize: '10px',
              padding: '3px 10px',
              borderRadius: '2px',
            }}
          >
            {tool}
          </span>
        ))}
      </div>
      <Link
        href={`/contact?automation=${encodeURIComponent(title)}`}
        style={{
          fontFamily: 'var(--font-roboto-mono)',
          fontSize: '11px',
          color: '#F97316',
          textDecoration: 'none',
          letterSpacing: '0.08em',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        Request This →
      </Link>
    </div>
  )
}
