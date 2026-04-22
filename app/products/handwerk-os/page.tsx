'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── RESPONSIVE STYLES ───────────────────────────────────── */

const STYLES = `
  .hw-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .hw-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .hw-steps  { display: flex; flex-direction: row; gap: 0; }
  @media (max-width: 768px) {
    .hw-grid-3 { grid-template-columns: 1fr; }
    .hw-grid-2 { grid-template-columns: 1fr; }
    .hw-steps  { flex-direction: column; }
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
          { field: 'name',     type: 'text',  label: 'Your name',                           required: true  },
          { field: 'business', type: 'text',  label: 'Business name',                       required: true  },
          { field: 'trade',    type: 'text',  label: 'Your trade (e.g. Elektriker, Maler...)', required: true  },
          { field: 'email',    type: 'email', label: 'Email address',                        required: true  },
          { field: 'phone',    type: 'tel',   label: 'Phone (optional)',                     required: false },
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
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET HANDWERK OS →'}
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

/* ─── PAGE ────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: '[ OCR ]',
    name: 'Photo → Job Order in 10 Seconds',
    desc: 'Photograph any job sheet. AI reads the handwriting — extracts client name, address, dates, materials, description. One tap fills the entire form. Client auto-created if new.',
  },
  {
    icon: '[ AI ]',
    name: 'AI Price Suggestions',
    desc: 'Type a job position. AI suggests the market rate for your specific trade and location — with min/max range. One click applies it to the quote. No more guessing or under-pricing.',
  },
  {
    icon: '[ XML ]',
    name: 'XRechnung / ZUGFeRD Compliance',
    desc: 'Mandatory for B2B invoices to public sector in Germany from 2025. One click generates a fully compliant EN 16931 XML file. Bundesbehörden, Kommunen, large B2B — all covered.',
  },
  {
    icon: '[ GPS ]',
    name: 'GPS Time Tracking',
    desc: 'GPS coordinates locked at clock-in. Irrefutable proof your team was on site. Not available on Plancraft or Artesa. Every minute tracked and auditable.',
  },
  {
    icon: '[ SIG ]',
    name: 'Digital Reports + Customer Signature',
    desc: 'AI writes the professional service report from bullet points. Trade-specific checklist auto-loads. Customer signs directly on the phone screen. Office gets instant push notification.',
  },
  {
    icon: '[ AUTO ]',
    name: 'Maintenance Contracts → Auto Invoicing',
    desc: 'Set monthly, quarterly, or annual contracts. System auto-creates invoice drafts on the due date every morning. Review and send — zero manual work.',
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
              {'Photo a job sheet.\nGet a quote in 10 seconds.'}
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: '#666666',
              maxWidth: '600px',
              lineHeight: 1.8,
            }}>
              HandwerkOS is a complete operating system for German trades businesses. Built for Maler, Elektriker, Sanitär, Schreiner, and 8 other Gewerke. 100% Deutsch — no English word anywhere in the interface.
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
                Try Live Demo →
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
                Book a Call
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
              Your business. Running on HandwerkOS.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Setup included. Your branding, your Gewerk, your IBAN. Configured and live in 48 hours.
            </p>
            <HandwerkContactForm />
          </div>
        </section>

      </main>
    </>
  )
}
