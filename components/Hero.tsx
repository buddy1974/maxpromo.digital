'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const AGENT_STATUSES = [
  { agent: 'lead-qualifier-v2',  task: 'Scoring 14 new leads from HubSpot',   status: 'ACTIVE', uptime: '99.8%' },
  { agent: 'invoice-processor',  task: 'Reconciling 6 invoices via Xero API', status: 'ACTIVE', uptime: '100%'  },
  { agent: 'support-agent-01',   task: 'Resolved 3 tickets — 1 escalated',    status: 'ACTIVE', uptime: '99.2%' },
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
      className="relative pt-36 pb-28 px-6 overflow-hidden"
      style={{ background: '#0A0A0A' }}
    >
      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* ── LEFT ── */}
        <div>
          {/* Eyebrow */}
          <span
            className="inline-block text-xs font-semibold px-3 py-1.5 mb-8 tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              background: 'rgba(249,115,22,0.1)',
              color: '#F97316',
              border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: '2px',
            }}
          >
            AI Automation Platform
          </span>

          {/* H1 — normal flow, 2-3 lines, one accent word */}
          <h1
            className="font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(2.6rem, 5vw, 4.25rem)',
              color: '#FFFFFF',
            }}
          >
            AI Agents &amp;{' '}
            <span style={{ color: '#F97316' }}>Automation</span>{' '}
            for Modern Organisations
          </h1>

          {/* Sub */}
          <p
            className="text-base leading-relaxed mb-10 max-w-lg"
            style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)' }}
          >
            We design intelligent workflows and AI agents that automate business
            processes, eliminate manual work, and improve operational efficiency
            — 24/7, without additional headcount.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <Link
              href="/automation-audit"
              className="text-sm font-semibold px-7 py-3.5 transition-opacity hover:opacity-85 text-center"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                background: '#F97316',
                color: '#0A0A0A',
                borderRadius: '2px',
              }}
            >
              Run Free Audit →
            </Link>
            <Link
              href="/automation-lab"
              className="text-sm font-semibold px-7 py-3.5 text-center transition-colors hover:border-white"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                background: 'transparent',
              }}
            >
              Explore Automations
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="flex gap-10 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { val: '50+',  label: 'Automations Built' },
              { val: '10×',  label: 'Efficiency Gains'  },
              { val: '24/7', label: 'Agent Uptime'       },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="text-2xl font-bold mb-0.5"
                  style={{ fontFamily: 'var(--font-syne)', color: '#F97316' }}
                >
                  {s.val}
                </p>
                <p
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-dm-sans)', color: '#888888' }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — SYS.AGENTS panel ── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '2px',
          }}
        >
          {/* Panel header bar */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#888888' }}
            >
              SYS.AGENTS
            </span>
            <span
              className="flex items-center gap-1.5 text-xs status-pulse"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F97316' }} />
              LIVE
            </span>
          </div>

          {/* Agent rows */}
          <div className="px-2 pt-3 pb-2 space-y-1">
            {AGENT_STATUSES.map((agent, i) => (
              <div
                key={agent.agent}
                className="flex items-center justify-between px-3 py-2.5 transition-all duration-500"
                style={{
                  background: i === tick ? 'rgba(249,115,22,0.06)' : 'transparent',
                  border: i === tick ? '1px solid rgba(249,115,22,0.15)' : '1px solid transparent',
                  borderRadius: '2px',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: agent.status === 'ACTIVE' ? '#F97316' : 'rgba(255,255,255,0.15)' }}
                  />
                  <span
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-ibm-mono)', color: i === tick ? '#FFFFFF' : '#888888' }}
                  >
                    {agent.agent}
                  </span>
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    fontFamily: 'var(--font-ibm-mono)',
                    color: agent.status === 'ACTIVE' ? '#F97316' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {agent.status}
                </span>
              </div>
            ))}
          </div>

          {/* Current task */}
          <div
            className="mx-4 mb-3 p-4"
            style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}
          >
            <p
              className="text-xs mb-1.5"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#888888' }}
            >
              // current task
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FFFFFF' }}
            >
              {active.task}
            </p>
            <div className="flex gap-3 mt-3">
              <span className="text-xs" style={{ fontFamily: 'var(--font-ibm-mono)', color: '#888888' }}>uptime</span>
              <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}>{active.uptime}</span>
            </div>
          </div>

          {/* Live log */}
          <div
            className="mx-4 mb-4 px-4 py-3"
            style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}
          >
            <p className="text-xs" style={{ fontFamily: 'var(--font-ibm-mono)', color: '#888888' }}>
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
