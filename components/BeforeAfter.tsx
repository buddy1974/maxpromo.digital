'use client'

import { useState } from 'react'

const mono = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans = 'var(--font-dm-sans)'

interface Task {
  name: string
  time: string
}

interface Scenario {
  tab: string
  before: Task[]
  after: Task[]
  metric: string
  metricLabel: string
}

const SCENARIOS: Scenario[] = [
  {
    tab: 'Invoice Processing',
    before: [
      { name: 'Download invoice from email',    time: '⏱ 5 mins per invoice' },
      { name: 'Manually enter data into Xero',  time: '⏱ 15 mins per invoice' },
      { name: 'Match against purchase orders',  time: '⏱ 10 mins per invoice' },
      { name: 'Chase approvals via email',       time: '⏱ 25 mins average wait' },
    ],
    after: [
      { name: 'Email received → data extracted by AI', time: '⚡ 8 seconds' },
      { name: 'Auto-validated against PO database',    time: '⚡ Instant' },
      { name: 'Posted to Xero automatically',          time: '⚡ 3 seconds' },
      { name: 'Exception flagged to human only',       time: '⚡ Only 6% require review' },
    ],
    metric: '94%',
    metricLabel: 'of invoices processed without human touch',
  },
  {
    tab: 'Lead Qualification',
    before: [
      { name: 'Read every inbound lead manually',    time: '⏱ 8 mins per lead' },
      { name: 'Research company on LinkedIn',        time: '⏱ 12 mins per lead' },
      { name: 'Manually score and assign to rep',    time: '⏱ 5 mins per lead' },
      { name: 'Write and send follow-up email',      time: '⏱ 15 mins per lead' },
    ],
    after: [
      { name: 'Lead received → AI reads and scores',   time: '⚡ 4 seconds' },
      { name: 'Company enriched via Apollo.io API',    time: '⚡ 6 seconds' },
      { name: 'Routed to correct rep in HubSpot',      time: '⚡ Instant' },
      { name: 'Personalised email sent automatically', time: '⚡ 2 seconds' },
    ],
    metric: '40 hrs',
    metricLabel: 'saved per month for sales teams',
  },
  {
    tab: 'Client Reporting',
    before: [
      { name: 'Pull data from CRM manually',        time: '⏱ 45 mins per report' },
      { name: 'Copy into spreadsheet template',     time: '⏱ 30 mins per report' },
      { name: 'Format and check for errors',        time: '⏱ 20 mins per report' },
      { name: 'Email to each client individually',  time: '⏱ 15 mins per report' },
    ],
    after: [
      { name: 'Data pulled from all sources on schedule', time: '⚡ Automatic, every Friday 06:00' },
      { name: 'AI formats into branded template',         time: '⚡ 12 seconds' },
      { name: 'Validated and error-checked by rules',     time: '⚡ Instant' },
      { name: 'Sent to all clients simultaneously',       time: '⚡ Zero manual steps' },
    ],
    metric: '110 hrs',
    metricLabel: 'saved per year per 10 clients',
  },
]

export default function BeforeAfter() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  const switchTab = (i: number) => {
    if (i === active) return
    setVisible(false)
    setTimeout(() => {
      setActive(i)
      setVisible(true)
    }, 150)
  }

  const scenario = SCENARIOS[active]

  return (
    <section
      style={{
        background: '#0A0A0A',
        padding: '100px 2rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              fontFamily: mono,
              fontSize: '11px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Before &amp; After
          </p>
          <h2
            style={{
              fontFamily: grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            What changes when you automate
          </h2>
          <p
            style={{
              fontFamily: sans,
              fontSize: '16px',
              color: '#888888',
              maxWidth: '440px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Real operational scenarios — before and after intelligent automation is deployed.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            maxWidth: '480px',
            margin: '0 auto 56px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          className="flex-col sm:flex-row"
        >
          {SCENARIOS.map((s, i) => (
            <button
              key={s.tab}
              type="button"
              onClick={() => switchTab(i)}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontFamily: mono,
                fontSize: '11px',
                letterSpacing: '0.08em',
                fontWeight: active === i ? 600 : 400,
                color: active === i ? '#000000' : '#555555',
                background: active === i ? '#F97316' : 'transparent',
                border: 'none',
                borderRight: i < SCENARIOS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {s.tab}
            </button>
          ))}
        </div>

        {/* ── Panel ── */}
        <div
          style={{
            display: 'flex',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          className="flex-col lg:flex-row"
        >
          {/* LEFT — BEFORE */}
          <div
            style={{
              flex: '0 0 45%',
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRight: 'none',
              padding: '40px',
            }}
            className="border-r-0 lg:border-r-0"
          >
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#FF4444',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: mono,
                  fontSize: '10px',
                  color: '#FF4444',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                Before
              </span>
            </div>

            {/* Tasks */}
            <div>
              {scenario.before.map((task) => (
                <div
                  key={task.name}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,68,68,0.15)',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,68,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                  <span style={{ color: '#FF4444', fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>✗</span>
                  <div>
                    <p style={{ fontFamily: sans, fontSize: '14px', fontWeight: 500, color: '#CCCCCC', marginBottom: '4px', lineHeight: 1.4 }}>
                      {task.name}
                    </p>
                    <p style={{ fontFamily: mono, fontSize: '11px', color: '#666666', letterSpacing: '0.04em' }}>
                      {task.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTRE — Arrow divider */}
          <div
            style={{
              flex: '0 0 10%',
              background: '#0A0A0A',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="py-4 lg:py-0"
          >
            <div
              style={{
                flex: 1,
                width: '1px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(249,115,22,0.3) 100%)',
                minHeight: '40px',
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                background: '#F97316',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              →
            </div>
            <div
              style={{
                flex: 1,
                width: '1px',
                background: 'linear-gradient(180deg, rgba(249,115,22,0.3) 0%, transparent 100%)',
                minHeight: '40px',
              }}
            />
          </div>

          {/* RIGHT — AFTER */}
          <div
            style={{
              flex: '0 0 45%',
              background: '#0D1A0D',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '2px solid rgba(34,197,94,0.3)',
              padding: '40px',
            }}
          >
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <span
                className="status-pulse"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: mono,
                  fontSize: '10px',
                  color: '#22C55E',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                After Automation
              </span>
            </div>

            {/* Tasks */}
            <div>
              {scenario.after.map((task) => (
                <div
                  key={task.name}
                  style={{
                    background: 'rgba(34,197,94,0.04)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <span style={{ color: '#22C55E', fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <div>
                    <p style={{ fontFamily: sans, fontSize: '14px', fontWeight: 500, color: '#CCCCCC', marginBottom: '4px', lineHeight: 1.4 }}>
                      {task.name}
                    </p>
                    <p style={{ fontFamily: mono, fontSize: '11px', color: '#22C55E', letterSpacing: '0.04em' }}>
                      {task.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Result box */}
            <div
              style={{
                background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.2)',
                padding: '20px',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <p
                style={{
                  fontFamily: grotesk,
                  fontWeight: 700,
                  fontSize: '36px',
                  color: '#F97316',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {scenario.metric}
              </p>
              <p style={{ fontFamily: sans, fontSize: '13px', color: '#CCCCCC', lineHeight: 1.5 }}>
                {scenario.metricLabel}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
