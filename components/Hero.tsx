'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Hero right-hand console — live operations panel.
 *
 * Each row is a system we installed, named the way the business names
 * it (not the way the dev names it). Internal tool names like
 * "lead-qualifier-v2" or "support-agent-01" are gone — replaced with the
 * operational layer name as it appears in the org. The event line on
 * each row carries an operational pressure signal, not a debug message:
 * pending counts, after-hours captures, escalations, drift events.
 *
 * Tools (n8n, Claude, Resend…) are deliberately absent — implementation
 * details live on the architecture page, not on the control deck.
 */
const SYSTEMS_FEED = [
  { runtime: 'Client Intake System',       event: '3 after-hours enquiries captured · routed to night-shift in <3 min',       status: 'ACTIVE', uptime: '99.8%' },
  { runtime: 'Vendor Processing Layer',    event: '17 invoices in queue · 12 auto-approved · 5 flagged for review',            status: 'ACTIVE', uptime: '100%'  },
  { runtime: 'Communications Triage',      event: 'Inbound volume +24% today · 11 auto-resolved · 1 escalated',                status: 'ACTIVE', uptime: '99.2%' },
  { runtime: 'Compliance Continuity',      event: 'CQC evidence pack assembled · 0 drift events · audit-ready',                status: 'IDLE',   uptime: '98.9%' },
  { runtime: 'Field Dispatch Engine',      event: '4 jobs in field · 1 photo-invoice flowed back · time logged',               status: 'ACTIVE', uptime: '99.6%' },
]

/**
 * Live narrative — what just happened, not what the dev console wrote.
 * Reads like a duty manager's afternoon, not a stack trace.
 */
const LOG_LINES = [
  '22:47 · after-hours enquiry · 3 missed-call recoveries today',
  '22:47 · auto-qualified [revenue tier: high]',
  '22:48 · routed to night-shift on-call',
  '22:50 · confirmation sent · client acknowledged',
  '22:51 · booking confirmed [2m 14s end-to-end]',
  'compliance · audit pack updated · drift: 0',
  'shift handover · 0 unresolved escalations',
]

interface StatConfig {
  target: number
  display: (n: number) => string
  label: string
}

/**
 * Operational signals — not agency brag stats. Each one points at a
 * measurable outcome a client felt after we installed their layer.
 */
const STATS: StatConfig[] = [
  { target: 7,  display: (n) => `${n}`,       label: 'Systems Live'           },
  { target: 24, display: (n) => `${n}`,       label: 'Workflows Running'      },
  { target: 96, display: (n) => `−${n}%`,     label: 'Avg Response Time'      },
  { target: 32, display: (n) => `+${n}h/wk`,  label: 'Reclaimed per Client'   },
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
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: '36px',
        color: '#FFFFFF',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        marginBottom: '4px',
      }}>
        {stat.display(count)}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.05em' }}>
        {stat.label}
      </p>
    </div>
  )
}

export default function Hero() {
  const [tick, setTick]         = useState(0)
  const [logIndex, setLogIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % SYSTEMS_FEED.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setLogIndex((n) => (n + 1) % LOG_LINES.length), 1400)
    return () => clearInterval(t)
  }, [])

  const active = SYSTEMS_FEED[tick]

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
  }

  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        padding: '5rem 2rem',
        overflow: 'hidden',
      }}
    >
      {/* Grid background */}
      <div
        className="grid-bg"
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/*
        Removed: the two blurred radial orbs (orange + purple/pink).
        Reasons:
          1. Generic AI-agency cliché per the repositioning brief.
          2. The purple orb (hue 265) violates CLAUDE.md's palette
             (no blue, no purple, no decorative gradients).
        The grid background above provides enough depth on its own.
      */}

      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gap: '4rem',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
        className="grid-cols-1 lg:grid-cols-2"
      >
        {/* LEFT — copy */}
        <div>
          {/* Status badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '2rem' }}
          >
            <span
              className="glass"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'hsl(40 12% 65%)',
                padding: '6px 14px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                className="status-pulse"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'hsl(28 100% 58%)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              SYSTEMS OPERATIONAL
            </span>
            <span
              className="glass"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'hsl(40 12% 65%)',
                padding: '6px 14px',
                borderRadius: '6px',
              }}
            >
              8 agents deployed
            </span>
            <span
              className="glass"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'hsl(40 12% 65%)',
                padding: '6px 14px',
                borderRadius: '6px',
              }}
            >
              99.9% uptime
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>We build the</span>
            <span style={{ display: 'block', color: '#F97316' }}>machines</span>
            <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>that run your business.</span>
          </motion.h1>

          {/* Sub — mission-critical infrastructure tone. Operational
              continuity, execution systems, orchestration — not AI
              capabilities. Tools (n8n, Claude, Make…) live on the
              architecture page, not here. */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'hsl(40 12% 65%)',
              maxWidth: '540px',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
            }}
          >
            Operational infrastructure for businesses that can&rsquo;t afford operational drift. We architect the layer between your team and their tools — intake, dispatch, billing, compliance, escalation — orchestrated, monitored, recoverable.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}
          >
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 40px hsl(28 100% 58% / 0.3)',
              }}
            >
              Get my free audit
            </Link>
            <Link
              href="/automation-lab"
              className="glass-strong"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                transition: 'border-color 150ms ease',
              }}
            >
              See it in action →
            </Link>
          </motion.div>

          {/* Urgency */}
          <motion.p
            custom={4}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'hsl(240 8% 35%)',
              letterSpacing: '0.05em',
              marginBottom: '2.5rem',
            }}
          >
            // No commitment · 30-min call · 3 onboarding slots open this month
          </motion.p>

          {/* Stats */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0',
              paddingTop: '1.5rem',
              borderTop: '1px solid hsl(40 30% 96% / 0.07)',
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  paddingRight: i < STATS.length - 1 ? '1.5rem' : 0,
                  borderRight: i < STATS.length - 1 ? '1px solid hsl(40 30% 96% / 0.07)' : 'none',
                  paddingLeft: i > 0 ? '1.5rem' : 0,
                }}
              >
                <StatCounter stat={stat} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — SYS.AGENTS console */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong border-gradient"
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 30px 80px -20px hsl(0 0% 0% / 0.6), 0 0 60px hsl(28 100% 58% / 0.06)',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(0 84% 60% / 0.7)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(28 100% 58% / 0.7)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(75 100% 60% / 0.7)', display: 'inline-block' }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: 'hsl(40 12% 65%)',
              textTransform: 'uppercase',
            }}>
              OPERATIONS · LIVE
            </span>
            <span
              className="status-pulse"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'hsl(28 100% 58%)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(28 100% 58%)', display: 'inline-block' }} />
              LIVE
            </span>
          </div>

          {/* System rows — each runtime is a layer we installed and run */}
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SYSTEMS_FEED.map((row, i) => (
              <div
                key={row.runtime}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: i === tick ? 'hsl(28 100% 58% / 0.06)' : 'transparent',
                  border: i === tick ? '1px solid hsl(28 100% 58% / 0.15)' : '1px solid transparent',
                  borderRadius: '8px',
                  transition: 'all 500ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: row.status === 'ACTIVE' ? 'hsl(28 100% 58%)' : 'hsl(40 30% 96% / 0.15)',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: i === tick ? 'hsl(40 30% 96%)' : 'hsl(40 12% 65%)',
                  }}>
                    {row.runtime}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: row.status === 'ACTIVE' ? 'hsl(28 100% 58%)' : 'hsl(40 30% 96% / 0.2)',
                }}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>

          {/* Current operational event — business outcome, not dev log */}
          <div
            style={{
              margin: '0 12px 12px',
              padding: '16px',
              background: 'hsl(240 14% 4% / 0.5)',
              border: '1px solid hsl(40 30% 96% / 0.06)',
              borderRadius: '10px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginBottom: '6px' }}>
              // last event
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(40 30% 96%)', lineHeight: 1.5 }}>
              {active.event}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)' }}>uptime</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'hsl(28 100% 58%)' }}>{active.uptime}</span>
            </div>
          </div>

          {/* Live log */}
          <div
            style={{
              margin: '0 12px 12px',
              padding: '14px 16px',
              background: 'hsl(240 14% 4% / 0.5)',
              border: '1px solid hsl(40 30% 96% / 0.06)',
              borderRadius: '10px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(40 12% 65%)' }}>
              <span style={{ color: 'hsl(28 100% 58%)' }}>$ </span>
              {LOG_LINES[logIndex]}
              <span className="cursor-blink" style={{ color: 'hsl(28 100% 58%)' }}>▊</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
