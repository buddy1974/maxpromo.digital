'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── RESPONSIVE STYLES ───────────────────────────────────── */

const STYLES = `
  .ro-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .ro-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (max-width: 768px) {
    .ro-grid-3 { grid-template-columns: 1fr; }
    .ro-grid-2 { grid-template-columns: 1fr; }
  }
`

/* ─── FORM ────────────────────────────────────────────────── */

interface RestaurantForm {
  name: string
  restaurant: string
  tables: string
  email: string
  phone: string
}

function RestaurantContactForm() {
  const [form, setForm] = useState<RestaurantForm>({
    name: '', restaurant: '', tables: '', email: '', phone: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof RestaurantForm) {
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
          organisation: form.restaurant,
          message: `Tables: ${form.tables}${form.phone ? `\nPhone: ${form.phone}` : ''}`,
          automation: 'restaurant-os',
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
          { field: 'name',       type: 'text',  label: 'Your name',            required: true  },
          { field: 'restaurant', type: 'text',  label: 'Restaurant name',      required: true  },
          { field: 'tables',     type: 'text',  label: 'Number of tables',     required: true  },
          { field: 'email',      type: 'email', label: 'Email address',         required: true  },
          { field: 'phone',      type: 'tel',   label: 'Phone (optional)',      required: false },
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
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET RESTAURANT OS →'}
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

/* ─── DATA ────────────────────────────────────────────────── */

const PROBLEMS = [
  { icon: '🗒', text: 'Waiter takes orders on paper. Kitchen gets it wrong. Table 4 complains. Every service.' },
  { icon: '🧮', text: 'Group of 8 wants separate bills. Waiter spends 15 minutes with a calculator at the end of the night.' },
  { icon: '📱', text: 'WhatsApp group for kitchen orders. Rush hour = unread messages, missed orders, angry chefs.' },
]

const STEPS = [
  { title: 'Scan QR Code', desc: 'Each table has a printed QR. Opens the full menu in the browser. No app install. No account needed. Works on every phone.' },
  { title: 'Choose Dining Mode', desc: 'First scan asks: dining solo or as a group? Sets the payment split logic for the entire table session.' },
  { title: 'Get a Fruit Seat Code', desc: 'System assigns a fruit — APPLE, KIWI, ORANGE. Visible all session. Waiter calls by fruit name. Zero table confusion.' },
  { title: 'Browse & Order', desc: 'Full menu with categories, prices, and popular badges. Add to cart. Place order. Order more rounds any time.' },
  { title: 'Staff Notified on Telegram', desc: 'Every order fires instantly to the staff Telegram group — free, works on any phone. Table, seat, items, total. No tablet watching required.' },
  { title: 'Flexible Payment', desc: 'Pay solo. Cover the whole table. Split equally. Or select exactly which seats to group. All four modes built in.' },
]

const FEATURES = [
  { icon: '[ SEAT ]',    name: 'Fruit Seat Identity',        desc: '20 unique fruit codes per session. Each person tracked individually across the entire visit. Waiter-friendly — call by fruit, not seat number.' },
  { icon: '[ PAY ]',     name: '4 Payment Modes',            desc: 'Pay solo. Cover the table. Split equally. Or select exactly which seats to combine. No calculator. No arguments.' },
  { icon: '[ ALERT ]',   name: 'Telegram Alerts — Free',     desc: 'Instant order notifications to your staff group. Works on any phone. No dedicated tablet, no monthly alert software subscription.' },
  { icon: '[ ADMIN ]',   name: 'Live Menu Editor',           desc: 'Add, edit, delete items. Toggle availability instantly. No code. Works on any device. Menu changes go live in seconds.' },
  { icon: '[ SESSION ]', name: 'Session Types',              desc: 'Set solo or group at first scan. Staff dashboard shows session type per table. Waiter knows the payment expectation before the bill is asked for.' },
  { icon: '[ SAAS ]',    name: 'Multi-Tenant Architecture',  desc: 'One codebase. Each restaurant gets their own slug, menu, tables, and branding. Built to scale to unlimited venues from day one.' },
]

const TECH_STACK = ['NEXT.JS 16', 'NEON POSTGRESQL', 'VERCEL', 'TELEGRAM BOT', 'TYPESCRIPT', 'STRIPE']

/* ─── PAGE ────────────────────────────────────────────────── */

export default function RestaurantOSPage() {
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
              color: '#FF4D4D',
              marginBottom: '1.5rem',
            }}>
              LIVE IN PRODUCTION · MULTI-TENANT READY
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
              {'Your entire restaurant.\nRuns on a QR code.'}
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: '#666666',
              maxWidth: '600px',
              lineHeight: 1.8,
            }}>
              Restaurant OS replaces your POS system, your WhatsApp order groups, and your split-bill calculator. Customers scan, order, and pay from their phone. Staff get instant Telegram alerts. No app. No tablet. No per-feature monthly fees.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <a
                href="https://restaurant-os-one.vercel.app/demo/staff"
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
                Try Staff Dashboard →
              </a>
              <a
                href="https://restaurant-os-one.vercel.app/demo/admin"
                target="_blank"
                rel="noopener noreferrer"
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
                Try Admin Panel →
              </a>
              <a
                href="https://restaurant-os-one.vercel.app/demo"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: '#666666',
                  padding: '14px 0',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0F0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
              >
                See customer view →
              </a>
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
              What your service looks like tonight
            </h2>
            <div className="ro-grid-3">
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

        {/* ── HOW IT WORKS ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              USER JOURNEY
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Six steps. Zero friction.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid #1A1A1A' }}>
              {STEPS.map((step, idx) => (
                <div
                  key={step.title}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '24px',
                    padding: '24px 0',
                    borderBottom: '1px solid #1A1A1A',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#E8FF00',
                    minWidth: '32px',
                    flexShrink: 0,
                    paddingTop: '2px',
                  }}>
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ background: '#0F0F0F', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
              WHAT&apos;S BUILT
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Everything the system includes.
            </h2>
            <div className="ro-grid-2">
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

        {/* ── TECH STRIP ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '20px 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333333', marginBottom: '12px' }}>
              BUILT ON
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    border: '1px solid #1A1A1A',
                    padding: '5px 14px',
                    color: '#333333',
                    letterSpacing: '0.05em',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ── */}
        <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '20px 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0 }}>
              Live demo at restaurant-os-one.vercel.app — 6 tables, full ordering flow
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
              Your restaurant. Online in 48 hours.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              We configure your menu, set up your tables, connect your Telegram group, and hand you the QR codes. You are live in 48 hours.
            </p>
            <RestaurantContactForm />
          </div>
        </section>

      </main>
    </>
  )
}
