'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FormData {
  name: string
  email: string
  organisation: string
  message: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const mono = { fontFamily: 'var(--font-space-mono)' } as const
const grotesk = { fontFamily: 'var(--font-space-grotesk)' } as const
const sans = { fontFamily: 'var(--font-dm-sans)' } as const

const inputStyle = {
  ...sans,
  fontSize: '15px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  border: '1px solid #D5D5D5',
  borderRadius: '2px',
  padding: '12px 14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 150ms ease',
}

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    organisation: '',
    message: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isValid = form.name && form.email && form.organisation && form.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Get in Touch
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
            Contact Us
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: '#555555', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.8 }}>
            Tell us about your project or automation challenge. We&apos;ll respond within one
            business day.
          </p>
        </div>
      </section>

      <section style={{ background: '#FAFAFA', padding: '4rem 2rem' }}>
        <div
          style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '3rem' }}
          className="grid-cols-1 lg:grid-cols-3"
        >
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '18px', color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                MaxPromo Digital
              </h2>
              <p style={{ ...sans, fontSize: '15px', color: '#666666', lineHeight: 1.7 }}>
                AI agents and automation systems for businesses, NGOs, and government organisations.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ ...mono, fontSize: '16px', color: '#F97316', flexShrink: 0, marginTop: '2px' }}>⚡</span>
                <div>
                  <p style={{ ...sans, fontWeight: 500, fontSize: '14px', color: '#0A0A0A', marginBottom: '4px' }}>
                    Free Automation Audit
                  </p>
                  <p style={{ ...sans, fontSize: '13px', color: '#888888', lineHeight: 1.5, marginBottom: '6px' }}>
                    Start with our free audit to identify your top opportunities.
                  </p>
                  <Link
                    href="/automation-audit"
                    style={{ ...mono, fontSize: '12px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em' }}
                  >
                    Run the audit →
                  </Link>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ ...mono, fontSize: '16px', color: '#F97316', flexShrink: 0, marginTop: '2px' }}>◻</span>
                <div>
                  <p style={{ ...sans, fontWeight: 500, fontSize: '14px', color: '#0A0A0A', marginBottom: '4px' }}>
                    Chat with Max
                  </p>
                  <p style={{ ...sans, fontSize: '13px', color: '#888888', lineHeight: 1.5 }}>
                    Quick questions? Our AI assistant can answer immediately.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ ...mono, fontSize: '16px', color: '#F97316', flexShrink: 0, marginTop: '2px' }}>▸</span>
                <div>
                  <p style={{ ...sans, fontWeight: 500, fontSize: '14px', color: '#0A0A0A', marginBottom: '4px' }}>
                    Response time
                  </p>
                  <p style={{ ...sans, fontSize: '13px', color: '#888888', lineHeight: 1.5 }}>
                    Within 1 business day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ gridColumn: 'span 1' }} className="lg:col-span-2">
            {status === 'success' ? (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  padding: '3rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</p>
                <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '28px', color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                  Message sent!
                </h2>
                <p style={{ ...sans, fontSize: '15px', color: '#666666', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                  Thank you for getting in touch. We&apos;ll get back to you within one business day.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ name: '', email: '', organisation: '', message: '' }) }}
                  style={{ ...mono, fontSize: '13px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  padding: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {status === 'error' && (
                  <div
                    style={{
                      background: '#FFF5F5',
                      border: '1px solid #FFCCCC',
                      color: '#CC0000',
                      ...sans,
                      fontSize: '14px',
                      padding: '12px 16px',
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gap: '20px' }} className="grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label style={{ ...sans, fontSize: '13px', fontWeight: 500, color: '#444444', display: 'block', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#F97316' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Jane Smith"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#D5D5D5')}
                    />
                  </div>
                  <div>
                    <label style={{ ...sans, fontSize: '13px', fontWeight: 500, color: '#444444', display: 'block', marginBottom: '6px' }}>
                      Email Address <span style={{ color: '#F97316' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="jane@company.com"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#D5D5D5')}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ ...sans, fontSize: '13px', fontWeight: 500, color: '#444444', display: 'block', marginBottom: '6px' }}>
                    Organisation <span style={{ color: '#F97316' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.organisation}
                    onChange={(e) => update('organisation', e.target.value)}
                    placeholder="Company or organisation name"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D5D5D5')}
                  />
                </div>

                <div>
                  <label style={{ ...sans, fontSize: '13px', fontWeight: 500, color: '#444444', display: 'block', marginBottom: '6px' }}>
                    Message <span style={{ color: '#F97316' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Tell us about your project, the processes you'd like to automate, or the challenges you're facing..."
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D5D5D5')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  style={{
                    ...mono,
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#0A0A0A',
                    background: !isValid || status === 'loading' ? '#AAAAAA' : '#F97316',
                    border: 'none',
                    padding: '16px 28px',
                    cursor: !isValid || status === 'loading' ? 'not-allowed' : 'pointer',
                    width: '100%',
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {status === 'loading' ? 'Sending...' : 'Send Message →'}
                </button>

                <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', textAlign: 'center', letterSpacing: '0.05em' }}>
                  // Your information is never shared with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
