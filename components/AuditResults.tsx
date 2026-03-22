'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface AuditResult {
  title: string
  problem: string
  solution: string
  tools: string[]
}

interface AuditResultsProps {
  results: AuditResult[]
  businessType: string
}

interface LeadData {
  name: string
  email: string
  company: string
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: '#030305',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.15)',
  color: '#FAFAFF',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '16px',
  padding: '12px 0',
  outline: 'none',
}

export default function AuditResults({ results, businessType }: AuditResultsProps) {
  const [lead, setLead] = useState<LeadData>({ name: '', email: '', company: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateLead = (field: keyof LeadData, value: string) =>
    setLead((prev) => ({ ...prev, [field]: value }))

  const handleFocusBorder = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderBottomColor = '#E8FF3D'
  }
  const handleBlurBorder = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.15)'
  }

  const submitLead = async () => {
    if (!lead.name || !lead.email || !lead.company) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          organisation: lead.company,
          message: `Audit report request. Business type: ${businessType}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSubmitted(true)
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontWeight: 700,
            fontSize: '36px',
            letterSpacing: '-0.04em',
            color: '#FAFAFF',
            marginBottom: '8px',
          }}
        >
          Your Automation Report
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
            color: '#6B6B7A',
          }}
        >
          {results.length} opportunities identified{businessType ? ` for ${businessType}` : ''}
        </p>
      </div>

      {/* Result cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '3.5rem' }}>
        {results.map((r, i) => (
          <div
            key={i}
            className="result-card"
            style={{
              background: '#0E0E12',
              padding: '28px',
              animationDelay: `${i * 200}ms`,
            }}
          >
            {/* Title */}
            <h3
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 700,
                fontSize: '18px',
                letterSpacing: '-0.04em',
                color: '#FAFAFF',
                marginBottom: '20px',
              }}
            >
              {r.title || `Opportunity ${i + 1}`}
            </h3>

            {/* Problem */}
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '10px',
                color: '#6B6B7A',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Problem
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                color: 'rgba(250,250,255,0.7)',
                lineHeight: 1.7,
                marginBottom: '16px',
              }}
            >
              {r.problem}
            </p>

            {/* Solution */}
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '10px',
                color: '#6B6B7A',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Solution
            </p>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                color: 'rgba(250,250,255,0.7)',
                lineHeight: 1.7,
                marginBottom: '16px',
              }}
            >
              {r.solution}
            </p>

            {/* Tools */}
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '10px',
                color: '#6B6B7A',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Tools
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {r.tools.map((tool) => (
                <span
                  key={tool}
                  style={{
                    fontFamily: 'var(--font-space-mono)',
                    fontSize: '11px',
                    color: '#FAFAFF',
                    background: '#16161C',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lead capture */}
      <div
        style={{
          background: '#0E0E12',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '40px 48px',
        }}
        className="px-6 md:px-12"
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '11px',
                color: '#E8FF3D',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Sent ✓
            </p>
            <p
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 700,
                fontSize: '22px',
                letterSpacing: '-0.04em',
                color: '#FAFAFF',
                marginBottom: '8px',
              }}
            >
              Check your inbox
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#6B6B7A' }}>
              We&apos;ll send your full report and implementation plan shortly.
            </p>
          </div>
        ) : (
          <>
            <h3
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 700,
                fontSize: '22px',
                letterSpacing: '-0.04em',
                color: '#FAFAFF',
                marginBottom: '8px',
              }}
            >
              Get your full report by email
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                color: '#6B6B7A',
                marginBottom: '28px',
              }}
            >
              We&apos;ll also send a detailed implementation plan. No spam.
            </p>

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              {[
                { field: 'name' as const,    placeholder: 'Name',    type: 'text'  },
                { field: 'email' as const,   placeholder: 'Email',   type: 'email' },
                { field: 'company' as const, placeholder: 'Company', type: 'text'  },
              ].map(({ field, placeholder, type }) => (
                <input
                  key={field}
                  type={type}
                  value={lead[field]}
                  onChange={(e) => updateLead(field, e.target.value)}
                  onFocus={handleFocusBorder}
                  onBlur={handleBlurBorder}
                  placeholder={placeholder}
                  style={{ ...inputStyle }}
                  className="placeholder-[#6B6B7A]"
                />
              ))}
            </div>

            <button
              onClick={submitLead}
              disabled={!lead.name || !lead.email || !lead.company || submitting}
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontWeight: 700,
                fontSize: '13px',
                color: '#030305',
                background: '#E8FF3D',
                padding: '14px 28px',
                border: 'none',
                cursor: lead.name && lead.email && lead.company && !submitting ? 'pointer' : 'not-allowed',
                opacity: lead.name && lead.email && lead.company && !submitting ? 1 : 0.4,
                transition: 'opacity 150ms ease',
              }}
            >
              {submitting ? 'Sending...' : 'Send me the report →'}
            </button>
          </>
        )}
      </div>

      {/* Secondary CTAs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2rem' }}>
        <Link
          href="/contact"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontWeight: 500,
            fontSize: '14px',
            color: '#030305',
            background: '#E8FF3D',
            padding: '12px 24px',
            textDecoration: 'none',
          }}
        >
          Talk to our team →
        </Link>
        <Link
          href="/automation-lab"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            fontWeight: 500,
            fontSize: '14px',
            color: '#FAFAFF',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '12px 24px',
            textDecoration: 'none',
          }}
        >
          Browse Automation Lab
        </Link>
      </div>
    </div>
  )
}
