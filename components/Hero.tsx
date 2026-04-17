'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/* ─── SYS.AGENTS data ─────────────────────────────────────── */

const AGENT_STATUSES = [
  { agent: 'lead-qualifier-v2',  task: 'Scoring 14 new leads from HubSpot',    status: 'ACTIVE', uptime: '99.8%' },
  { agent: 'invoice-processor',  task: 'Reconciling 6 invoices via Xero API',  status: 'ACTIVE', uptime: '100%'  },
  { agent: 'support-agent-01',   task: 'Resolved 3 tickets — 1 escalated',     status: 'ACTIVE', uptime: '99.2%' },
  { agent: 'content-scheduler',  task: 'Queued 12 posts for next 7 days',       status: 'IDLE',   uptime: '98.9%' },
]

const LOG_LINES = [
  'agent.start("lead-qualifier-v2")',
  'fetching leads from HubSpot CRM...',
  '14 records retrieved',
  'scoring against ICP criteria...',
  '9 qualified → routed to sales slack',
  '5 disqualified → archived',
  'task complete [2.3s]',
  'agent.idle()',
]

/* ─── Stats count-up ──────────────────────────────────────── */

interface StatConfig {
  target: number
  display: (n: number) => string
  label: string
}

const STATS: StatConfig[] = [
  { target: 127, display: (n) => `${n}+`,                   label: 'Workflows Built'    },
  { target: 32,  display: (n) => `${(n / 10).toFixed(1)}k`, label: 'Hours Saved / Month' },
  { target: 94,  display: (n) => `${n}%`,                   label: 'Client Retention'   },
]

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let cur = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      cur += step
      if (cur >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(cur))
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
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect() } },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '44px', color: '#FAFAFF', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '6px' }}>
        {stat.display(count)}
      </p>
      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: '#6B6B7A' }}>
        {stat.label}
      </p>
    </div>
  )
}

/* ─── STATUS PILLS ────────────────────────────────────────── */

const STATUS_PILLS = [
  { label: 'SYSTEMS OPERATIONAL', dot: true },
  { label: '47 automations deployed', dot: false },
  { label: '99.9% uptime', dot: false },
]

/* ─── HERO ────────────────────────────────────────────────── */

export default function Hero() {
  const [tick, setTick]         = useState(0)
  const [logIndex, setLogIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % AGENT_STATUSES.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setLogIndex((n) => (n + 1) % LOG_LINES.length), 1400)
    return () => clearInterval(t)
  }, [])

  const active = AGENT_STATUSES[tick]

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #050505 0%, #0D0500 40%, #050505 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '6rem 2rem',
      }}
    >
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', width: '100%', display: 'grid', gap: '4rem', alignItems: 'center' }}
        className="grid-cols-1 lg:grid-cols-2"
      >

        {/* ── LEFT ─────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          {/* Orange radial glow behind headline */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              transform: 'translateY(-50%)',
              width: '800px',
              height: '400px',
              background: 'radial-gradient(ellipse 900px 500px at 35% 50%, rgba(249,115,22,0.15) 0%, transparent 65%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Status pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '2.5rem' }}>
              {STATUS_PILLS.map((pill) => (
                <span
                  key={pill.label}
                  style={{
                    fontFamily: 'var(--font-roboto-mono)',
                    fontSize: '12px',
                    color: '#AAAAAA',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {pill.dot && (
                    <span
                      className="status-pulse"
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }}
                    />
                  )}
                  {pill.label}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 700,
                fontSize: 'clamp(3.5rem, 6vw, 5.5rem)',
                letterSpacing: '-0.04em',
                lineHeight: 1.02,
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ display: 'block', color: '#FAFAFF' }}>We build the</span>
              <span className="glitch-word" style={{ display: 'block', color: '#F97316' }}>machines</span>
              <span style={{ display: 'block', color: '#FAFAFF' }}>that run your business.</span>
            </h1>

            {/* Sub */}
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
                fontSize: '18px',
                color: '#AAAAAA',
                maxWidth: '480px',
                lineHeight: 1.8,
                marginBottom: '2.5rem',
              }}
            >
              AI agents, workflow automation, and intelligent systems for
              businesses that are serious about growth.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '3.5rem' }}>
              <Link
                href="/automation-audit"
                style={{
                  fontFamily: 'var(--font-roboto-mono)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#000000',
                  background: '#F97316',
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
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  fontSize: '15px',
                  color: '#FAFAFF',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'border-color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              >
                Talk to our team →
              </Link>
            </div>

            {/* Urgency line */}
            <p
              style={{
                fontFamily: 'var(--font-roboto-mono)',
                fontSize: '11px',
                color: '#666666',
                marginBottom: '2.5rem',
                letterSpacing: '0.05em',
              }}
            >
              // Free audit · No commitment · 3 onboarding slots open this month
            </p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                maxWidth: '540px',
              }}
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: '1 1 110px',
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
        </div>

        {/* ── RIGHT — SYS.AGENTS panel ───────────────────── */}
        <div
          style={{
            background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '2px',
            boxShadow: '0 0 0 1px rgba(249,115,22,0.05), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(249,115,22,0.06)',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '12px', letterSpacing: '0.15em', color: '#6B6B7A', textTransform: 'uppercase' }}>
              SYS.AGENTS
            </span>
            <span
              className="status-pulse"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-roboto-mono)', fontSize: '12px', color: '#F97316' }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
              LIVE
            </span>
          </div>

          {/* Agent rows */}
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {AGENT_STATUSES.map((agent, i) => (
              <div
                key={agent.agent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: i === tick ? 'rgba(249,115,22,0.06)' : 'transparent',
                  border: i === tick ? '1px solid rgba(249,115,22,0.15)' : '1px solid transparent',
                  borderRadius: '2px',
                  transition: 'all 500ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: agent.status === 'ACTIVE' ? '#F97316' : 'rgba(255,255,255,0.15)',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '12px', color: i === tick ? '#FFFFFF' : '#6B6B7A' }}>
                    {agent.agent}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '12px', fontWeight: 700, color: agent.status === 'ACTIVE' ? '#F97316' : 'rgba(255,255,255,0.2)' }}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>

          {/* Current task */}
          <div
            style={{
              margin: '0 12px 12px',
              padding: '16px',
              background: '#0A0A0A',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '11px', color: '#6B6B7A', marginBottom: '6px' }}>
              // current task
            </p>
            <p style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '13px', color: '#FFFFFF', lineHeight: 1.5 }}>
              {active.task}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <span style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '11px', color: '#6B6B7A' }}>uptime</span>
              <span style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '11px', fontWeight: 700, color: '#F97316' }}>{active.uptime}</span>
            </div>
          </div>

          {/* Live log */}
          <div
            style={{
              margin: '0 12px 12px',
              padding: '14px 16px',
              background: '#0A0A0A',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '13px', color: '#6B6B7A' }}>
              <span style={{ color: '#F97316' }}>$ </span>
              {LOG_LINES[logIndex]}
              <span className="cursor-blink" style={{ color: '#F97316' }}>▊</span>
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
