'use client'

import { useState } from 'react'
import AuditResults, { AuditResult } from './AuditResults'

type Stage = 'questions' | 'loading' | 'results'

interface FormData {
  businessType: string
  companySize: string
  tasks: string[]
  tools: string[]
  process: string
}

const BUSINESS_TYPES = [
  'E-commerce', 'Agency', 'Consultant', 'Local Business',
  'Healthcare', 'Education', 'Government', 'Other',
]
const COMPANY_SIZES = ['1–5', '6–20', '21–50', '50+']
const TASK_OPTIONS = [
  'Email replies', 'Data entry', 'Lead management', 'Customer support',
  'Scheduling', 'Reporting', 'Invoicing', 'Document processing',
]
const TOOL_OPTIONS = [
  'Google Workspace', 'CRM', 'Slack', 'Notion',
  'Excel', 'Xero', 'None',
]

const TOTAL_STEPS = 5

const LOADING_LINES = [
  'connecting to audit engine...',
  'scanning business profile...',
  'identifying automation opportunities...',
  'generating report...',
]

/* ─── CHIP ────────────────────────────────────────────────── */
function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`audit-chip${selected ? ' selected' : ''}`}
      style={{
        fontFamily: 'var(--font-space-mono)',
        fontSize: '12px',
        padding: '10px 18px',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/* ─── QUESTION LABEL ──────────────────────────────────────── */
function QuestionLabel({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-space-grotesk)',
        fontWeight: 700,
        fontSize: '22px',
        letterSpacing: '-0.04em',
        color: '#FAFAFF',
        marginBottom: '24px',
      }}
    >
      {children}
    </h2>
  )
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
export default function AuditForm() {
  const [step, setStep] = useState(1)
  const [stage, setStage] = useState<Stage>('questions')
  const [loadingLine, setLoadingLine] = useState(0)
  const [form, setForm] = useState<FormData>({
    businessType: '',
    companySize: '',
    tasks: [],
    tools: [],
    process: '',
  })
  const [results, setResults] = useState<AuditResult[]>([])
  const [error, setError] = useState('')

  const toggleMulti = (field: 'tasks' | 'tools', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const canProceed = (): boolean => {
    if (step === 1) return form.businessType !== ''
    if (step === 2) return form.companySize !== ''
    if (step === 3) return form.tasks.length > 0
    if (step === 4) return form.tools.length > 0
    if (step === 5) return form.process.trim().length > 0
    return true
  }

  const runAudit = async () => {
    setStage('loading')
    setError('')

    // Stagger loading lines
    let i = 0
    const interval = setInterval(() => {
      i++
      setLoadingLine(i)
      if (i >= LOADING_LINES.length - 1) clearInterval(interval)
    }, 800)

    try {
      await new Promise((r) => setTimeout(r, 3200)) // let loading animation play
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionnaire: {
            businessType: form.businessType,
            companySize: form.companySize,
            timeConsumingTasks: form.tasks.join(', '),
            currentTools: form.tools.join(', '),
            processToAutomate: form.process,
          },
          lead: { name: '', email: '', company: '' },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      setResults(data.results as AuditResult[])
      setStage('results')
    } catch (e) {
      clearInterval(interval)
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStage('questions')
    }
  }

  const next = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
    } else {
      void runAudit()
    }
  }

  const back = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  /* Loading state */
  if (stage === 'loading') {
    return (
      <div
        style={{
          background: '#0E0E12',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '40px 48px',
          maxWidth: '680px',
          margin: '0 auto',
        }}
        className="px-6 md:px-12"
      >
        <p
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '11px',
            color: '#6B6B7A',
            letterSpacing: '0.2em',
            marginBottom: '24px',
          }}
        >
          ANALYSING...
        </p>
        <div style={{ background: '#030305', padding: '20px' }}>
          {LOADING_LINES.map((line, i) => (
            <p
              key={line}
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '12px',
                lineHeight: '1.8',
                color: i <= loadingLine ? '#FAFAFF' : 'transparent',
                transition: 'color 300ms ease',
              }}
            >
              <span style={{ color: '#E8FF3D', marginRight: '8px' }}>
                {i <= loadingLine ? '✓' : ' '}
              </span>
              {line}
            </p>
          ))}
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '12px',
              color: '#E8FF3D',
              marginTop: '8px',
            }}
          >
            $ <span className="cursor-blink">▊</span>
          </p>
        </div>
      </div>
    )
  }

  /* Results state */
  if (stage === 'results') {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <AuditResults results={results} businessType={form.businessType} />
      </div>
    )
  }

  /* Question steps */
  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Card */}
      <div
        style={{
          background: '#0E0E12',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '40px 48px',
        }}
        className="px-6 md:px-12"
      >
        {/* Progress */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '11px',
                color: '#6B6B7A',
                letterSpacing: '0.1em',
              }}
            >
              0{step} / 0{TOTAL_STEPS}
            </span>
          </div>
          <div
            style={{
              height: '2px',
              background: 'rgba(255,255,255,0.07)',
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
                background: '#E8FF3D',
                transition: 'width 250ms ease',
              }}
            />
          </div>
        </div>

        {error && (
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
              color: '#FF3D6B',
              marginBottom: '16px',
            }}
          >
            {error}
          </p>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <QuestionLabel>What type of business do you run?</QuestionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {BUSINESS_TYPES.map((bt) => (
                <Chip
                  key={bt}
                  label={bt}
                  selected={form.businessType === bt}
                  onClick={() => setForm((prev) => ({ ...prev, businessType: bt }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <QuestionLabel>How many people work in your organisation?</QuestionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COMPANY_SIZES.map((size) => (
                <Chip
                  key={size}
                  label={size}
                  selected={form.companySize === size}
                  onClick={() => setForm((prev) => ({ ...prev, companySize: size }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <QuestionLabel>Which tasks eat the most time each week?</QuestionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TASK_OPTIONS.map((task) => (
                <Chip
                  key={task}
                  label={task}
                  selected={form.tasks.includes(task)}
                  onClick={() => toggleMulti('tasks', task)}
                />
              ))}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '10px',
                color: '#6B6B7A',
                marginTop: '12px',
                letterSpacing: '0.1em',
              }}
            >
              SELECT ALL THAT APPLY
            </p>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div>
            <QuestionLabel>Which tools do you currently use?</QuestionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TOOL_OPTIONS.map((tool) => (
                <Chip
                  key={tool}
                  label={tool}
                  selected={form.tools.includes(tool)}
                  onClick={() => toggleMulti('tools', tool)}
                />
              ))}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '10px',
                color: '#6B6B7A',
                marginTop: '12px',
                letterSpacing: '0.1em',
              }}
            >
              SELECT ALL THAT APPLY
            </p>
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div>
            <QuestionLabel>What process would you most like to automate?</QuestionLabel>
            <textarea
              value={form.process}
              onChange={(e) => setForm((prev) => ({ ...prev, process: e.target.value }))}
              rows={5}
              placeholder="Describe your biggest operational headache..."
              style={{
                width: '100%',
                background: '#030305',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FAFAFF',
                fontFamily: 'var(--font-space-mono)',
                fontSize: '13px',
                padding: '14px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#E8FF3D')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        )}

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          {step > 1 && (
            <button
              onClick={back}
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '14px',
                color: '#6B6B7A',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 24px',
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
                flex: '0 0 auto',
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={next}
            disabled={!canProceed()}
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontWeight: 700,
              fontSize: '13px',
              color: '#030305',
              background: canProceed() ? '#E8FF3D' : 'rgba(232,255,61,0.3)',
              padding: '12px 28px',
              border: 'none',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              transition: 'background 150ms ease',
              flex: '1',
            }}
          >
            {step === TOTAL_STEPS ? '$ analyse --my-business →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
