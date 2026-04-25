'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const AGENT_STATUSES = [
  { agent: 'lead-qualifier-v2',  task: 'Scoring 14 new leads from HubSpot',    status: 'ACTIVE', uptime: '99.8%' },
  { agent: 'invoice-processor',  task: 'Reconciling 6 invoices via Xero API',  status: 'ACTIVE', uptime: '100%'  },
  { agent: 'support-agent-01',   task: 'Resolved 3 tickets — 1 escalated',     status: 'ACTIVE', uptime: '99.2%' },
  { agent: 'content-scheduler',  task: 'Queued 12 posts for next 7 days',      status: 'IDLE',   uptime: '98.9%' },
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

interface StatConfig {
  target: number
  display: (n: number) => string
  label: string
}

const STATS: StatConfig[] = [
  { target: 6,   display: (n) => `${n}`,      label: 'Systems Live'        },
  { target: 8,   display: (n) => `${n}`,      label: 'AI Agents Deployed'  },
  { target: 14,  display: (n) => `${n} days`, label: 'Avg. Delivery'       },
  { target: 100, display: (n) => `${n}%`,     label: 'Client Retention'    },
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
        color: 'hsl(40 30% 96%)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        marginBottom: '4px',
        background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
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
    const t = setInterval(() => setTick((n) => (n + 1) % AGENT_STATUSES.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setLogIndex((n) => (n + 1) % LOG_LINES.length), 1400)
    return () => clearInterval(t)
  }, [])

  const active = AGENT_STATUSES[tick]

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

      {/* Orbs */}
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, hsl(28 100% 58% / 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, hsl(265 100% 70% / 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
          animationDelay: '2s',
        }}
      />

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
            <span
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              machines
            </span>
            <span style={{ display: 'block', color: 'hsl(40 30% 96%)' }}>that run your business.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'hsl(40 12% 65%)',
              maxWidth: '480px',
              lineHeight: 1.8,
              marginBottom: '2.5rem',
            }}
          >
            AI agents, n8n workflows and intelligent systems for companies that are
            done losing hours to manual work.
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
              SYS.AGENTS
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
                      background: agent.status === 'ACTIVE' ? 'hsl(28 100% 58%)' : 'hsl(40 30% 96% / 0.15)',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: i === tick ? 'hsl(40 30% 96%)' : 'hsl(40 12% 65%)',
                  }}>
                    {agent.agent}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: agent.status === 'ACTIVE' ? 'hsl(28 100% 58%)' : 'hsl(40 30% 96% / 0.2)',
                }}>
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
              background: 'hsl(240 14% 4% / 0.5)',
              border: '1px solid hsl(40 30% 96% / 0.06)',
              borderRadius: '10px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginBottom: '6px' }}>
              // current task
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(40 30% 96%)', lineHeight: 1.5 }}>
              {active.task}
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
