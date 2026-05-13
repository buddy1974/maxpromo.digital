'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface FormData {
  name: string
  email: string
  organisation: string
  message: string
  automation: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

const inputBase: React.CSSProperties = {
  ...sans,
  fontSize: '15px',
  color: '#FFFFFF',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '2px',
  padding: '14px 16px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    organisation: '',
    message: '',
    automation: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Pre-fill message from ?automation= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const automation = params.get('automation')
    if (automation) {
      setForm((prev) => ({
        ...prev,
        automation,
        message: `I'm interested in: ${automation}.\nPlease tell me more about this automation and how it could work for my business.`,
      }))
    }
  }, [])

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
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organisation: form.organisation,
          message: form.message,
          automation: form.automation || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
  }
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>
      {/* Header */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // Talk to an architect
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            Where is your operation leaking?
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.7 }}>
            Describe the bottleneck, the handover, the missing layer.
            Marcel replies personally within one business day with a first read on what to install.
          </p>
        </div>
      </section>

      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem' }}>
        {/*
          Restructured from a `[260px sidebar | form]` lopsided grid into
          a single centered column. The 3 info cards now sit in a
          symmetric row ABOVE the form, then the form drops centered
          beneath them — every block is centered to the page axis so
          there's no visual left-anchor.
        */}
        <div style={{ maxWidth: '44rem', margin: '0 auto' }}>

          {/* Three info cards in a symmetric row */}
          <div
            style={{ display: 'grid', gap: '12px', marginBottom: '3rem' }}
            className="grid-cols-1 sm:grid-cols-3"
          >
            {[
              {
                icon: '⚡',
                title: 'Free Operational Audit',
                desc: 'Map your current operation, identify the missing layer.',
                href: '/automation-audit',
                cta: 'Run the audit →',
              },
              {
                icon: '◻',
                title: 'Chat with Max',
                desc: 'Quick questions answered immediately by the on-site assistant.',
                href: undefined,
                cta: undefined,
              },
              {
                icon: '▸',
                title: 'Response time',
                desc: 'Marcel replies personally within one business day.',
                href: undefined,
                cta: undefined,
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.06)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ ...mono, fontSize: '16px', color: '#F97316' }}>{card.icon}</span>
                <p style={{ ...sans, fontWeight: 600, fontSize: '14px', color: 'hsl(40 30% 96%)', margin: 0 }}>
                  {card.title}
                </p>
                <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 12% 65%)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                  {card.desc}
                </p>
                {card.href && card.cta && (
                  <Link
                    href={card.href}
                    style={{ ...mono, fontSize: '12px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', marginTop: '6px' }}
                  >
                    {card.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Centered form */}
          <div>
            {status === 'success' ? (
              <div
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '3rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</p>
                <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '28px', color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                  Message sent!
                </h2>
                <p style={{ ...sans, fontSize: '17px', color: '#F97316', marginBottom: '8px', lineHeight: 1.7, fontWeight: 500 }}>
                  Message sent. We&apos;ll be in touch within 24 hours.
                </p>
                <p style={{ ...sans, fontSize: '14px', color: '#888888', marginBottom: '1.5rem' }}>
                  If you don&apos;t hear from us, email us directly at{' '}
                  <a href="mailto:info@maxpromo.digital" style={{ color: '#F97316', textDecoration: 'none' }}>
                    info@maxpromo.digital
                  </a>
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ name: '', email: '', organisation: '', message: '', automation: '' }) }}
                  style={{ ...mono, fontSize: '13px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {status === 'error' && (
                  <div
                    style={{
                      background: 'rgba(204,0,0,0.1)',
                      border: '1px solid rgba(204,0,0,0.3)',
                      color: '#FF6666',
                      ...sans,
                      fontSize: '14px',
                      padding: '12px 16px',
                      borderRadius: '2px',
                    }}
                  >
                    {errorMsg || 'Something went wrong. Please email us directly at info@maxpromo.digital'}
                  </div>
                )}

                {form.automation && (
                  <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '10px 14px', borderRadius: '2px' }}>
                    <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.05em' }}>
                      // Enquiring about: {form.automation}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '20px' }} className="grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Full Name <span style={{ color: '#F97316' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Jane Smith"
                      style={inputBase}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                  <div>
                    <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Email Address <span style={{ color: '#F97316' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="jane@company.com"
                      style={inputBase}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Organisation <span style={{ color: '#F97316' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.organisation}
                    onChange={(e) => update('organisation', e.target.value)}
                    placeholder="Company or organisation name"
                    style={inputBase}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                <div>
                  <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Message <span style={{ color: '#F97316' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Tell us about your project, the processes you'd like to automate, or the challenges you're facing..."
                    style={{ ...inputBase, resize: 'none' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  style={{
                    ...mono,
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#000000',
                    background: !isValid || status === 'loading' ? 'rgba(249,115,22,0.3)' : '#F97316',
                    border: 'none',
                    padding: '16px 28px',
                    cursor: !isValid || status === 'loading' ? 'not-allowed' : 'pointer',
                    width: '100%',
                    borderRadius: '2px',
                    boxShadow: !isValid || status === 'loading' ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {status === 'loading' ? 'Sending...' : 'Send Message →'}
                </button>

                <p style={{ ...mono, fontSize: '11px', color: '#555555', textAlign: 'center', letterSpacing: '0.05em' }}>
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
