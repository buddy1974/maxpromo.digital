'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const AGENT_STATUSES = [
  { agent: 'lead-qualifier-v2', task: 'Scoring 14 new leads from HubSpot', status: 'ACTIVE', uptime: '99.8%' },
  { agent: 'invoice-processor', task: 'Reconciling 6 invoices via Xero API', status: 'ACTIVE', uptime: '100%' },
  { agent: 'support-agent-01', task: 'Resolved 3 tickets — 1 escalated', status: 'ACTIVE', uptime: '99.2%' },
  { agent: 'content-scheduler', task: 'Queued 12 posts for next 7 days', status: 'IDLE', uptime: '98.9%' },
]

const LOG_LINES = [
  '> agent.start("lead-qualifier-v2")',
  '> fetching leads from HubSpot CRM...',
  '> 14 records retrieved',
  '> scoring against ICP criteria...',
  '> 9 qualified → routed to sales slack',
  '> 5 disqualified → archived',
  '> task complete [2.3s]',
  '> agent.idle()',
]

export default function Hero() {
  const [tick, setTick] = useState(0)
  const [logIndex, setLogIndex] = useState(0)

  useEffect(() => {
    const statusTimer = setInterval(() => setTick((t) => (t + 1) % AGENT_STATUSES.length), 3000)
    return () => clearInterval(statusTimer)
  }, [])

  useEffect(() => {
    const logTimer = setInterval(() => {
      setLogIndex((i) => (i + 1) % LOG_LINES.length)
    }, 1200)
    return () => clearInterval(logTimer)
  }, [])

  const activeAgent = AGENT_STATUSES[tick]

  return (
    <section
      className="relative pt-36 pb-24 px-6 overflow-hidden grid-overlay"
      style={{ background: '#06080A' }}
    >
      {/* Orange radial glow top-left */}
      <div
        className="absolute top-0 -left-40 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,106,0,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT — copy */}
        <div>
          <span
            className="inline-block text-xs font-medium px-3 py-1.5 rounded-sm mb-7 tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              background: 'rgba(255,106,0,0.1)',
              color: '#FF6A00',
              border: '1px solid rgba(255,106,0,0.25)',
            }}
          >
            ◈ AI Automation Platform
          </span>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-7"
            style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
          >
            AI Agents &amp;{' '}
            <span style={{ color: '#FF6A00' }}>Automation</span>{' '}
            for Modern Orgs
          </h1>

          <p
            className="text-lg leading-relaxed mb-10 max-w-xl"
            style={{ color: 'rgba(240,237,232,0.65)', fontFamily: 'var(--font-dm-sans)' }}
          >
            We design intelligent workflows and AI agents that automate business
            processes, eliminate manual work, and improve operational efficiency
            — 24/7, without headcount.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Link
              href="/automation-audit"
              className="text-sm font-semibold px-7 py-4 rounded-sm transition-all text-center"
              style={{ fontFamily: 'var(--font-ibm-mono)', background: '#FF6A00', color: '#06080A' }}
            >
              Run Free Audit →
            </Link>
            <Link
              href="/automation-lab"
              className="text-sm font-semibold px-7 py-4 rounded-sm transition-all text-center"
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                color: '#F0EDE8',
                border: '1px solid rgba(255,106,0,0.3)',
                background: 'rgba(255,106,0,0.05)',
              }}
            >
              Explore Automations
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-sm">
            {[
              { val: '50+', label: 'Automations Built' },
              { val: '10×', label: 'Efficiency Gains' },
              { val: '24/7', label: 'Agent Uptime' },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-syne)', color: '#FF6A00' }}
                >
                  {s.val}
                </p>
                <p
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.45)' }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — animated system status panel */}
        <div
          className="rounded-sm p-6 space-y-4"
          style={{
            background: '#0D1014',
            border: '1px solid rgba(255,106,0,0.15)',
            boxShadow: '0 0 60px rgba(255,106,0,0.06)',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between pb-4 mb-2"
            style={{ borderBottom: '1px solid rgba(255,106,0,0.1)' }}
          >
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.4)' }}
            >
              sys.agents — live status
            </span>
            <span
              className="flex items-center gap-1.5 text-xs status-pulse"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#FF6A00' }}
              />
              LIVE
            </span>
          </div>

          {/* Active agents list */}
          {AGENT_STATUSES.map((agent, i) => (
            <div
              key={agent.agent}
              className="flex items-center justify-between py-2.5 px-3 rounded-sm transition-all duration-500"
              style={{
                background: i === tick ? 'rgba(255,106,0,0.06)' : 'transparent',
                border: i === tick ? '1px solid rgba(255,106,0,0.15)' : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: agent.status === 'ACTIVE' ? '#FF6A00' : 'rgba(240,237,232,0.2)' }}
                />
                <span
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.7)' }}
                >
                  {agent.agent}
                </span>
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-ibm-mono)',
                  color: agent.status === 'ACTIVE' ? '#FF6A00' : 'rgba(240,237,232,0.3)',
                }}
              >
                {agent.status}
              </span>
            </div>
          ))}

          {/* Current task */}
          <div
            className="rounded-sm p-4 mt-4"
            style={{ background: '#06080A', border: '1px solid rgba(255,106,0,0.1)' }}
          >
            <p
              className="text-xs mb-2"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.35)' }}
            >
              // current task
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.75)' }}
            >
              {activeAgent.task}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.3)' }}
              >
                uptime
              </span>
              <span
                className="text-xs font-medium"
                style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
              >
                {activeAgent.uptime}
              </span>
            </div>
          </div>

          {/* Live log line */}
          <div
            className="rounded-sm px-4 py-3"
            style={{ background: '#06080A', border: '1px solid rgba(255,106,0,0.08)' }}
          >
            <p
              className="text-xs"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.45)' }}
            >
              <span style={{ color: '#FF6A00' }}>$</span>{' '}
              {LOG_LINES[logIndex]}
              <span className="cursor-blink" style={{ color: '#FF6A00' }}>▊</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
