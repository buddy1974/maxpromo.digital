'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── RESPONSIVE STYLES ───────────────────────────────────── */

const STYLES = `
  .hw-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .hw-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .hw-steps  { display: flex; flex-direction: row; gap: 0; }
  .hw-proof  { display: grid; grid-template-columns: 3fr 2fr; gap: 1px; background: #1A1A1A; }
  @media (max-width: 768px) {
    .hw-grid-3 { grid-template-columns: 1fr; }
    .hw-grid-2 { grid-template-columns: 1fr; }
    .hw-steps  { flex-direction: column; }
    .hw-proof  { grid-template-columns: 1fr; }
  }
`

/* ─── FORM ────────────────────────────────────────────────── */

interface HandwerkForm {
  name: string
  business: string
  trade: string
  email: string
  phone: string
}

function HandwerkContactForm() {
  const [form, setForm] = useState<HandwerkForm>({
    name: '', business: '', trade: '', email: '', phone: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof HandwerkForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organisation: form.business,
          message: `Trade: ${form.trade}${form.phone ? `\nPhone: ${form.phone}` : ''}`,
          automation: 'handwerk-os',
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0F0F0F',
    border: '1px solid #1A1A1A',
    color: '#F0F0F0',
    padding: '14px 16px',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    width: '100%',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 150ms ease',
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}
    >
      {(
        [
          { field: 'name',     type: 'text',  label: 'Your name',                              required: true  },
          { field: 'business', type: 'text',  label: 'Business name',                          required: true  },
          { field: 'trade',    type: 'text',  label: 'Your trade (e.g. Elektriker, Maler...)', required: true  },
          { field: 'email',    type: 'email', label: 'Email address',                           required: true  },
          { field: 'phone',    type: 'tel',   label: 'Phone (optional)',                        required: false },
        ] as const
      ).map(({ field, type, label, required }) => (
        <input
          key={field}
          name={field}
          type={type}
          placeholder={label}
          required={required}
          value={form[field]}
          onChange={update(field)}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#E8FF00')}
          onBlur={(e)  => (e.currentTarget.style.borderColor = '#1A1A1A')}
        />
      ))}

      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        style={{
          background: '#E8FF00',
          color: '#080808',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700,
          padding: '16px',
          width: '100%',
          border: 'none',
          cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET YOUR SYSTEM SETUP →'}
      </button>

      {status === 'success' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#E8FF00', margin: 0 }}>
          ✓ Request received. We&apos;ll contact you within 24 hours.
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>
          Something went wrong. Email us at hello@maxpromo.digital
        </p>
      )}
    </form>
  )
}

/* ─── PAGE DATA ───────────────────────────────────────────── */

const AFTER_STATE = [
  'Quotes sent in under 2 minutes — not 20',
  'Every job tracked automatically — no paper, no WhatsApp',
  'XRechnung invoices generated in one click — no accountant needed',
  'Time disputes won before they start — GPS proof on every visit',
  'Maintenance contracts invoiced automatically — no chasing required',
]

const WHO_FOR = [
  'German trades businesses — Maler, Elektriker, Sanitär, Schreiner, and 8 other Gewerke',
  '1–20 staff, currently running jobs through WhatsApp and paper job sheets',
  'Sending quotes in Word, tracking time on paper, invoicing late or underbilling',
  'Losing billable hours because they cannot prove time on site in a dispute',
  'Need XRechnung compliance for public sector and large B2B contracts',
]

const FEATURES = [
  {
    icon: '[ OCR ]',
    name: 'Create a Job Record in 10 Seconds',
    desc: 'Photograph the job sheet. Full record created instantly — client, address, scope, materials. Up to 60% less admin time per job.',
  },
  {
    icon: '[ AI ]',
    name: 'Never Under-Price a Job Again',
    desc: 'AI suggests market rates for your trade and location. Quotes built and sent up to 5x faster than doing it manually in Word.',
  },
  {
    icon: '[ XML ]',
    name: 'Win Public Sector Contracts',
    desc: 'One click generates a fully compliant EN 16931 XML file. Win public sector and large B2B work without extra paperwork.',
  },
  {
    icon: '[ GPS ]',
    name: 'Win Every Time Dispute',
    desc: 'GPS coordinates locked at clock-in. Irrefutable proof your team was on site. Every billable minute tracked and auditable.',
  },
  {
    icon: '[ SIG ]',
    name: 'Get Paid Days Earlier',
    desc: 'AI writes the service report from bullet points. Customer signs on the phone. No paper to chase, no disputes, no delays.',
  },
  {
    icon: '[ AUTO ]',
    name: 'Set Contracts Once. Get Paid Every Month.',
    desc: 'Set monthly, quarterly, or annual contracts once. Invoices generate automatically on the due date. No reminders. No chasing.',
  },
]

const PROBLEMS = [
  {
    icon: '📋',
    text: 'Fotografiert Auftragszettel — tippt alles manuell ab. 20 Minuten pro Auftrag.',
  },
  {
    icon: '📄',
    text: 'Erstellt Angebote in Word. Rechnet Preise im Kopf. Versendet per WhatsApp.',
  },
  {
    icon: '⏱',
    text: 'Verfolgt Zeiten auf Papier. Kann bei Streit nichts beweisen. Stunden gehen verloren.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Photograph the job sheet',
    desc: 'AI creates the full project record in under 10 seconds — client, address, scope, materials.',
  },
  {
    num: '02',
    title: 'AI prices the quote',
    desc: 'Select your trade and location. AI suggests market rates. Generate and email the PDF quote directly to the client.',
  },
  {
    num: '03',
    title: 'One click to invoice',
    desc: 'Convert the accepted quote to a Rechnung. XRechnung XML export included. Mark paid when done.',
  },
]

const FLOW = [
  { step: '01', label: 'Job comes in via WhatsApp' },
  { step: '02', label: 'Photograph job sheet' },
  { step: '03', label: 'AI creates full record' },
  { step: '04', label: 'Quote emailed to client' },
  { step: '05', label: 'Accepted — one-click invoice' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function HandwerkOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#080808' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem 5rem', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#E8FF00',
              marginBottom: '1.5rem',
            }}>
              LIVE SYSTEM · DEMO READY
            </p>

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: '#F0F0F0',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              whiteSpace: 'pre-line',
            }}>
              {'Still managing jobs\non WhatsApp and paper?'}
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: '#666666',
              maxWidth: '600px',
              lineHeight: 1.8,
            }}>
              HandwerkOS replaces the WhatsApp chaos, paper job sheets, and slow quotes. One system handles the entire job — from photo to paid invoice. If your jobs start in WhatsApp, this system replaces everything after it.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <a
                href="https://handwerkos.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#080808',
                  background: '#E8FF00',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#D4EB00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E8FF00')}
              >
                Watch It Run Live →
              </a>
              <Link
                href="/contact?system=handwerk-os"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  color: '#F0F0F0',
                  border: '1px solid #1A1A1A',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  background: 'transparent',
                  transition: 'border-color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333333')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1A1A1A')}
              >
                Get This System Installed →
              </Link>
            </div>

            {/* Demo credentials */}
            <div style={{
              marginTop: '2rem',
              background: '#0F0F0F',
              border: '1px solid #1A1A1A',
              padding: '20px 24px',
              maxWidth: '360px',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#333333',
                marginBottom: '12px',
              }}>
                DEMO ACCESS
              </p>
              {[
                'URL: handwerkos.vercel.app',
                'Email: admin@handwerkos.de',
                'Password: admin123456',
              ].map((line) => (
                <p key={line} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: '#666666',
                  margin: '4px 0',
                }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO THIS IS FOR ── */}
        <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              WHO THIS IS FOR
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Built for your type of business.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {WHO_FOR.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#E8FF00', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px' }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── AFTER STATE ── */}
        <section style={{ background: '#080808', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              AFTER THIS SYSTEM IS INSTALLED
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              What your business looks like on week two.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AFTER_STATE.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', lineHeight: 1.6, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#E8FF00', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── PROBLEM STRIP ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              THE PROBLEM
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              What your tradesperson does today
            </h2>
            <div className="hw-grid-3">
              {PROBLEMS.map((p) => (
                <div key={p.icon} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontSize: '28px', marginBottom: '16px' }}>{p.icon}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              WHAT&apos;S BUILT
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              8 modules. Everything a trade business needs.
            </h2>
            <div className="hw-grid-2">
              {FEATURES.map((f) => (
                <div key={f.name} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#E8FF00', marginBottom: '16px' }}>
                    {f.icon}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                    {f.name}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ background: '#0F0F0F', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              WORKFLOW
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              From photo to paid invoice.
            </h2>
            <div className="hw-steps" style={{ borderTop: '1px solid #1A1A1A' }}>
              {STEPS.map((step, idx) => (
                <div
                  key={step.num}
                  style={{
                    flex: 1,
                    padding: '40px 32px',
                    borderRight: idx < STEPS.length - 1 ? '1px solid #1A1A1A' : 'none',
                    borderBottom: '1px solid #1A1A1A',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <p style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '80px',
                    color: 'rgba(232,255,0,0.06)',
                    lineHeight: 1,
                    position: 'absolute',
                    top: '16px',
                    right: '24px',
                    margin: 0,
                    letterSpacing: '-0.04em',
                    pointerEvents: 'none',
                  }}>
                    {step.num}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px', position: 'relative' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0, position: 'relative' }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SYSTEM IN ACTION ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>SYSTEM IN ACTION</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              See how it runs.
            </h2>
            <div className="hw-proof">
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#141414', border: '1px dashed #2A2A2A', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2A2A2A', margin: 0 }}>[ DASHBOARD SCREENSHOT ]</p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#444444', margin: 0, lineHeight: 1.6 }}>
                  Job pipeline, live quotes, GPS time logs, and XRechnung invoices — one dashboard.
                </p>
              </div>
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                {[
                  { label: 'Job status', text: 'Every open job, quote, and invoice tracked in one view — from photo to paid.' },
                  { label: 'GPS log', text: 'Clock-in coordinates visible per technician. Audit trail on every visit.' },
                  { label: 'One-click export', text: 'XRechnung XML generated from any invoice. No accountant required.' },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E8FF00', margin: '0 0 6px' }}>{item.label}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── IN PRACTICE ── */}
        <section style={{ background: '#0F0F0F', padding: '4rem 2rem', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>IN PRACTICE</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              From WhatsApp message to paid invoice.
            </h2>
            <div style={{ display: 'flex', gap: '2px', background: '#1A1A1A', overflowX: 'auto' }}>
              {FLOW.map((item) => (
                <div key={item.step} style={{ background: '#141414', padding: '24px 20px', flex: 1, minWidth: '140px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#E8FF00', margin: '0 0 8px', letterSpacing: '0.1em' }}>{item.step}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#F0F0F0', margin: 0, lineHeight: 1.5 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '20px 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0 }}>
              Currently used by Handwerk (DE) · PSL Services LLC (US) · MM Flooring Solutions (US)
            </p>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              background: '#E8FF00',
              color: '#080808',
              padding: '4px 10px',
              fontWeight: 700,
            }}>
              LIVE IN PRODUCTION
            </span>
          </div>
        </section>

        {/* ── CONVERSION ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              GET THIS SYSTEM
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              Get Your System Setup
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Your branding, your Gewerk, your IBAN. Configured and live in under 10 days.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Setup in 5–10 days.', 'Configured for your trade and region.', 'No upfront commitment.'].map((line) => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666', margin: '4px 0', letterSpacing: '0.05em' }}>
                  — {line}
                </p>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: '1px solid rgba(232,255,0,0.2)', padding: '16px 24px', maxWidth: '400px', display: 'inline-block' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', margin: '0 0 6px' }}>AVAILABILITY</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>
                We onboard a limited number of clients per month.<br />Next available slot: <span style={{ color: '#F0F0F0', fontWeight: 600 }}>May 2026</span>
              </p>
            </div>
            <HandwerkContactForm />
          </div>
        </section>

        {/* ── WHY MAXPROMO ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>WHY MAXPROMO</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>
              Not theory. Real systems, running now.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: '#1A1A1A' }}>
              {[
                { num: '01', text: 'Built from real client briefs — not feature lists' },
                { num: '02', text: 'Already deployed in production, not in staging' },
                { num: '03', text: 'Configured to your workflow — not a generic template' },
                { num: '04', text: 'We hand you a running system, not a prototype' },
              ].map((item) => (
                <div key={item.num} style={{ background: '#141414', padding: '28px 32px' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '32px', color: 'rgba(232,255,0,0.12)', letterSpacing: '-0.04em', margin: '0 0 12px' }}>{item.num}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
