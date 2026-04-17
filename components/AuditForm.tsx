'use client'

import { useState, useEffect } from 'react'
import AuditResults, { AuditResult } from './AuditResults'
import CostEstimate, { EstimateData } from './CostEstimate'

type Stage = 'questions' | 'loading' | 'results' | 'estimate-loading' | 'estimate'

interface FormData {
  orgType: string
  teamSize: string
  timeDrains: string[]
  timeDrainsOther: string
  tools: string[]
  experience: string
  goal: string
  name: string
  email: string
  company: string
}

const ORG_TYPES = [
  'Agency / Consultancy',
  'Professional Services',
  'E-commerce / Retail',
  'Financial Services',
  'Logistics / Operations',
  'Marketing / Media',
  'Healthcare',
  'Other',
]
const TEAM_SIZES = ['1–5', '6–20', '21–100', '100+']
const TIME_DRAINS = [
  'Data entry & processing',
  'Email management',
  'Report generation',
  'Invoice & billing',
  'Lead qualification',
  'Customer support',
  'Document handling',
  'Scheduling & bookings',
  'Social media posting',
  'Other',
]
const TOOL_OPTIONS = [
  'Google Workspace',
  'Microsoft 365',
  'HubSpot',
  'Salesforce',
  'Slack',
  'Notion',
  'Airtable',
  'Xero',
  'QuickBooks',
  'Shopify',
  'Zapier',
  'Make',
  'n8n',
  'Zendesk',
  'None of these',
]
const EXPERIENCE_OPTIONS = [
  'No automation yet',
  'A few simple automations',
  'Moderate — some workflows running',
  'Advanced — large-scale automation',
]
const QUICK_FILLS = [
  'Our team spends hours on manual data entry between disconnected tools.',
  'We manually qualify and follow up with every inbound lead.',
  'Monthly reporting takes days to compile from multiple sources.',
]
const LOADING_MESSAGES = [
  'Analysing your business profile...',
  'Mapping automation opportunities...',
  'Calculating potential ROI...',
  'Preparing recommendations...',
  'Finalising your report...',
]

const ESTIMATE_LOADING_MESSAGES = [
  'Reviewing your audit results...',
  'Researching German market rates...',
  'Building your itemised estimate...',
  'Calculating year-one costs...',
  'Finalising your Kostenvoranschlag...',
]

const TOTAL_STEPS = 5
const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

/* ─── STEP INDICATOR ────────────────────────────────────────── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div
            key={n}
            style={{ display: 'flex', alignItems: 'center', flex: n < total ? 1 : 'none' }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
                background: done ? '#F97316' : active ? 'rgba(249,115,22,0.15)' : 'transparent',
                border: done ? 'none' : active ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.15)',
                color: done ? '#000' : active ? '#F97316' : '#555555',
                transition: 'all 250ms ease',
              }}
            >
              {done ? '✓' : n}
            </div>
            {n < total && (
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: done ? '#F97316' : 'rgba(255,255,255,0.08)',
                  transition: 'background 250ms ease',
                  margin: '0 4px',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── OPTION BUTTON ─────────────────────────────────────────── */
function OptionBtn({
  label,
  selected,
  onClick,
  multi = false,
}: {
  label: string
  selected: boolean
  onClick: () => void
  multi?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: mono,
        fontSize: '12px',
        letterSpacing: '0.04em',
        padding: '10px 16px',
        border: selected ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.12)',
        background: selected ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.02)',
        color: selected ? '#F97316' : '#888888',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {multi && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: selected ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.2)',
            background: selected ? '#F97316' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: '#000',
            flexShrink: 0,
          }}
        >
          {selected ? '✓' : ''}
        </span>
      )}
      {label}
    </button>
  )
}

/* ─── LOADING SCREEN ────────────────────────────────────────── */
function LoadingScreen({ messages = LOADING_MESSAGES }: { messages?: string[] }) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, messages.length - 1))
    }, 1500)

    const start = Date.now()
    const progInterval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(90, (elapsed / 8000) * 90)
      setProgress(pct)
      if (pct >= 90) clearInterval(progInterval)
    }, 100)

    return () => {
      clearInterval(msgInterval)
      clearInterval(progInterval)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        className="audit-pulse"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#F97316',
          marginBottom: '40px',
          boxShadow: '0 0 32px rgba(249,115,22,0.4)',
        }}
      />
      <p
        style={{
          fontFamily: mono,
          fontSize: '13px',
          color: '#FFFFFF',
          letterSpacing: '0.05em',
          marginBottom: '8px',
          minHeight: '20px',
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        {messages[msgIndex]}
      </p>
      <p
        style={{
          fontFamily: mono,
          fontSize: '11px',
          color: '#444444',
          letterSpacing: '0.1em',
          marginBottom: '48px',
        }}
      >
        // powered by claude ai
      </p>
      <div
        style={{
          width: '280px',
          height: '2px',
          background: 'rgba(255,255,255,0.08)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: '#F97316',
            transition: 'width 100ms linear',
            boxShadow: '0 0 8px rgba(249,115,22,0.6)',
          }}
        />
      </div>
      <p
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#333333',
          marginTop: '12px',
          letterSpacing: '0.1em',
        }}
      >
        {Math.round(progress)}%
      </p>
    </div>
  )
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function AuditForm() {
  const [step, setStep] = useState(1)
  const [stage, setStage] = useState<Stage>('questions')
  const [form, setForm] = useState<FormData>({
    orgType: '',
    teamSize: '',
    timeDrains: [],
    timeDrainsOther: '',
    tools: [],
    experience: '',
    goal: '',
    name: '',
    email: '',
    company: '',
  })
  const [results, setResults] = useState<AuditResult[]>([])
  const [estimate, setEstimate] = useState<EstimateData | null>(null)
  const [error, setError] = useState('')

  const toggleMulti = (field: 'timeDrains' | 'tools', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const canProceed = (): boolean => {
    if (step === 1) return form.orgType !== '' && form.teamSize !== ''
    if (step === 2) return form.timeDrains.length > 0
    if (step === 3) return form.tools.length > 0
    if (step === 4) return form.goal.trim().length > 0
    if (step === 5) return form.name !== '' && form.email !== '' && form.company !== ''
    return true
  }

  const runAudit = async () => {
    setStage('loading')
    setError('')

    const allTimeDrains =
      form.timeDrains.includes('Other') && form.timeDrainsOther
        ? [...form.timeDrains.filter((d) => d !== 'Other'), form.timeDrainsOther]
        : form.timeDrains

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgType: form.orgType,
          teamSize: form.teamSize,
          timeDrains: allTimeDrains,
          tools: form.tools,
          experience: form.experience,
          goal: form.goal,
          name: form.name,
          email: form.email,
          company: form.company,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      setResults(data.results as AuditResult[])
      setStage('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStage('questions')
    }
  }

  const getEstimate = async () => {
    setStage('estimate-loading')
    setError('')

    const allTimeDrains =
      form.timeDrains.includes('Other') && form.timeDrainsOther
        ? [...form.timeDrains.filter((d) => d !== 'Other'), form.timeDrainsOther]
        : form.timeDrains

    try {
      const res = await fetch('/api/discovery/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgType: form.orgType,
          teamSize: form.teamSize,
          timeDrains: allTimeDrains,
          tools: form.tools,
          experience: form.experience,
          goal: form.goal,
          company: form.company,
          auditResults: results,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Estimate failed')
      setEstimate(data.estimate as EstimateData)
      setStage('estimate')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate estimate. Please try again.')
      setStage('results')
    }
  }

  const next = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
    else void runAudit()
  }

  const back = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  if (stage === 'loading') return <LoadingScreen />
  if (stage === 'estimate-loading') return <LoadingScreen messages={ESTIMATE_LOADING_MESSAGES} />
  if (stage === 'results') {
    return (
      <AuditResults
        results={results}
        orgType={form.orgType}
        company={form.company}
        onEstimate={() => void getEstimate()}
      />
    )
  }
  if (stage === 'estimate' && estimate) {
    return (
      <CostEstimate
        estimate={estimate}
        company={form.company}
        name={form.name}
        email={form.email}
        auditResults={results}
        onBack={() => setStage('results')}
      />
    )
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 16px' }}>
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '48px',
        }}
        className="px-6 md:px-12"
      >
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {error && (
          <div
            style={{
              background: 'rgba(204,0,0,0.1)',
              border: '1px solid rgba(204,0,0,0.3)',
              padding: '12px 16px',
              marginBottom: '24px',
              fontFamily: sans,
              fontSize: '13px',
              color: '#FF6666',
            }}
          >
            {error}
          </div>
        )}

        {/* ── STEP 1: Org type + team size ── */}
        {step === 1 && (
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Step 1 of 5
            </p>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '32px' }}>
              Tell us about your organisation
            </h2>

            <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Organisation type
            </p>
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginBottom: '32px' }}
            >
              {ORG_TYPES.map((type) => (
                <OptionBtn
                  key={type}
                  label={type}
                  selected={form.orgType === type}
                  onClick={() => setForm((p) => ({ ...p, orgType: type }))}
                />
              ))}
            </div>

            <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Team size
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TEAM_SIZES.map((size) => (
                <OptionBtn
                  key={size}
                  label={size}
                  selected={form.teamSize === size}
                  onClick={() => setForm((p) => ({ ...p, teamSize: size }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Time drains ── */}
        {step === 2 && (
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Step 2 of 5
            </p>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '8px' }}>
              Where does your team lose the most time?
            </h2>
            <p style={{ fontFamily: sans, fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
              Select all that apply.
            </p>
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '20px' }}
            >
              {TIME_DRAINS.map((drain) => (
                <OptionBtn
                  key={drain}
                  label={drain}
                  selected={form.timeDrains.includes(drain)}
                  onClick={() => toggleMulti('timeDrains', drain)}
                  multi
                />
              ))}
            </div>
            {form.timeDrains.includes('Other') && (
              <input
                type="text"
                value={form.timeDrainsOther}
                onChange={(e) => setForm((p) => ({ ...p, timeDrainsOther: e.target.value }))}
                placeholder="Describe your time drain..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  fontFamily: sans,
                  fontSize: '14px',
                  padding: '12px 16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginTop: '8px',
                  borderRadius: '2px',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            )}
          </div>
        )}

        {/* ── STEP 3: Tools + experience ── */}
        {step === 3 && (
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Step 3 of 5
            </p>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '8px' }}>
              What tools does your team use?
            </h2>
            <p style={{ fontFamily: sans, fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
              Select all that apply.
            </p>
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '32px' }}
            >
              {TOOL_OPTIONS.map((tool) => (
                <OptionBtn
                  key={tool}
                  label={tool}
                  selected={form.tools.includes(tool)}
                  onClick={() => toggleMulti('tools', tool)}
                  multi
                />
              ))}
            </div>

            <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Automation experience
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <OptionBtn
                  key={opt}
                  label={opt}
                  selected={form.experience === opt}
                  onClick={() => setForm((p) => ({ ...p, experience: opt }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Goal ── */}
        {step === 4 && (
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Step 4 of 5
            </p>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '8px' }}>
              Describe your biggest operational challenge
            </h2>
            <p style={{ fontFamily: sans, fontSize: '14px', color: '#666666', marginBottom: '24px' }}>
              The more specific, the better your report will be.
            </p>
            <textarea
              value={form.goal}
              onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}
              rows={5}
              placeholder="e.g. Our sales team manually copies leads from our website into HubSpot and then sends individual follow-up emails. This takes 2–3 hours per day..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontFamily: sans,
                fontSize: '14px',
                padding: '16px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.7,
                minHeight: '120px',
                boxSizing: 'border-box',
                borderRadius: '2px',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#444444', letterSpacing: '0.1em', marginTop: '16px', marginBottom: '12px' }}>
              // QUICK FILL
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {QUICK_FILLS.map((fill) => (
                <button
                  key={fill}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, goal: fill }))}
                  style={{
                    fontFamily: sans,
                    fontSize: '13px',
                    color: '#666666',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#666666'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  }}
                >
                  &ldquo;{fill}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5: Lead capture ── */}
        {step === 5 && (
          <div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Step 5 of 5
            </p>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '8px' }}>
              Where should we send your report?
            </h2>
            <p style={{ fontFamily: sans, fontSize: '14px', color: '#666666', marginBottom: '32px' }}>
              Your personalised audit will be ready in under 60 seconds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              {[
                { field: 'name' as const, label: 'Full Name', placeholder: 'Jane Smith', type: 'text' },
                { field: 'email' as const, label: 'Work Email', placeholder: 'jane@company.com', type: 'email' },
                { field: 'company' as const, label: 'Company', placeholder: 'Your company name', type: 'text' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label
                    style={{
                      fontFamily: mono,
                      fontSize: '11px',
                      color: '#888888',
                      display: 'block',
                      marginBottom: '8px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label} <span style={{ color: '#F97316' }}>*</span>
                  </label>
                  <input
                    type={type}
                    required
                    value={form[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      fontFamily: sans,
                      fontSize: '15px',
                      padding: '14px 16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      borderRadius: '2px',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontFamily: mono, fontSize: '11px', color: '#444444', letterSpacing: '0.05em' }}>
              // No spam. Report delivered in your browser instantly.
            </p>
          </div>
        )}

        {/* ── Navigation ── */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: '14px',
                color: '#666666',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '13px 24px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.color = '#CCCCCC'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#666666'
              }}
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canProceed()}
            style={{
              fontFamily: mono,
              fontWeight: 700,
              fontSize: '13px',
              color: '#000000',
              background: '#F97316',
              padding: '13px 28px',
              border: 'none',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              opacity: canProceed() ? 1 : 0.4,
              flex: 1,
              letterSpacing: '0.05em',
              transition: 'opacity 150ms ease, box-shadow 150ms ease',
              boxShadow: canProceed() ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            {step === TOTAL_STEPS ? 'Generate My Automation Report →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
