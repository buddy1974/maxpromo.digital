'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface StatConfig {
  target: number
  suffix: string
  display: (n: number) => string
  label: string
}

const STATS: StatConfig[] = [
  {
    target: 127,
    suffix: '+',
    display: (n) => `${n}+`,
    label: 'Workflows Built',
  },
  {
    target: 32,
    suffix: '',
    display: (n) => `${(n / 10).toFixed(1)}k`,
    label: 'Hours Saved / Month',
  },
  {
    target: 94,
    suffix: '%',
    display: (n) => `${n}%`,
    label: 'Client Retention',
  },
]

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])

  return count
}

function StatCounter({ stat }: { stat: StatConfig }) {
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = useCountUp(stat.target, active)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <p
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: '40px',
          color: '#FAFAFF',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: '6px',
        }}
      >
        {stat.display(count)}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '13px',
          color: '#6B6B7A',
        }}
      >
        {stat.label}
      </p>
    </div>
  )
}

const STATUS_PILLS = [
  { label: '• SYSTEMS OPERATIONAL' },
  { label: '47 automations deployed' },
  { label: '99.9% uptime' },
]

export default function Hero() {
  return (
    <section
      style={{
        background: '#030305',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '6rem 2rem',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', width: '100%' }}>
        {/* Status bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '3rem' }}>
          {STATUS_PILLS.map((pill, i) => (
            <span
              key={pill.label}
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '11px',
                color: '#6B6B7A',
                background: '#0E0E12',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {i === 0 && (
                <span
                  className="status-pulse"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#E8FF3D',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
              )}
              {i === 0 ? 'SYSTEMS OPERATIONAL' : pill.label}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontWeight: 700,
            fontSize: 'clamp(3rem, 7vw, 6rem)',
            letterSpacing: '-0.04em',
            lineHeight: 1.02,
            marginBottom: '1.5rem',
            maxWidth: '900px',
          }}
        >
          <span style={{ display: 'block', color: '#FAFAFF' }}>We build the</span>
          <span
            className="glitch-word"
            style={{ display: 'block', color: '#E8FF3D' }}
          >
            machines
          </span>
          <span style={{ display: 'block', color: '#FAFAFF' }}>that run your business.</span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontWeight: 500,
            fontSize: '18px',
            color: '#6B6B7A',
            maxWidth: '520px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          AI agents, workflow automation, and intelligent systems for businesses
          that are serious about growth.
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '4rem' }}>
          <Link
            href="/automation-audit"
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontWeight: 700,
              fontSize: '13px',
              color: '#030305',
              background: '#E8FF3D',
              padding: '14px 28px',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            $ run --free-audit
          </Link>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontWeight: 500,
              fontSize: '14px',
              color: '#FAFAFF',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '14px 28px',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
          >
            Talk to our team →
          </Link>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            maxWidth: '600px',
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: '1 1 120px',
                paddingRight: i < STATS.length - 1 ? '2rem' : 0,
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                marginRight: i < STATS.length - 1 ? '2rem' : 0,
              }}
            >
              <StatCounter stat={stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
