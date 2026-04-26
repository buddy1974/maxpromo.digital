'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── RESPONSIVE STYLES ───────────────────────────────────── */

const STYLES = `
  .ro-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .ro-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .ro-proof  { display: grid; grid-template-columns: 3fr 2fr; gap: 1px; background: #1A1A1A; }
  @media (max-width: 768px) {
    .ro-grid-3 { grid-template-columns: 1fr; }
    .ro-grid-2 { grid-template-columns: 1fr; }
    .ro-proof  { grid-template-columns: 1fr; }
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
          { field: 'name',       type: 'text',  label: 'Your name',        required: true  },
          { field: 'restaurant', type: 'text',  label: 'Restaurant name',  required: true  },
          { field: 'tables',     type: 'text',  label: 'Number of tables', required: true  },
          { field: 'email',      type: 'email', label: 'Email address',    required: true  },
          { field: 'phone',      type: 'tel',   label: 'Phone (optional)', required: false },
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
          onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
          onBlur={(e)  => (e.currentTarget.style.borderColor = '#1A1A1A')}
        />
      ))}

      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        style={{
          background: '#F97316',
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
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', margin: 0 }}>
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
  'Orders go directly to the kitchen — zero relay errors',
  'Bills split in seconds, not 15 minutes at the end of service',
  'No tablet. No app. No per-feature monthly fee.',
  'Staff free to focus on service, not taking orders',
  'Menu updates live in under 10 seconds from any device',
]

const WHO_FOR = [
  'Restaurants, cafes, and bars with 4–50 tables',
  'Currently taking orders on paper pads or relaying orders via WhatsApp to the kitchen',
  'Splitting bills manually at the end of service — losing 10–20 minutes per group',
  'Looking to reduce order errors and speed up service without replacing staff',
  'Want to avoid expensive POS hardware or per-feature monthly subscription costs',
]

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
  { icon: '[ SEAT ]',    name: 'Zero Table Confusion',           desc: 'No more "who ordered what." Every seat tracked individually by fruit code for the entire visit. Staff call by fruit — not seat number.' },
  { icon: '[ PAY ]',     name: 'Bill Splitting In Seconds',         desc: 'Solo, full table, equal split, or select seats — all four modes built in. No calculator. No awkward wait at the end of service.' },
  { icon: '[ ALERT ]',   name: 'Kitchen Notified Instantly',  desc: 'Every order fires instantly to your kitchen Telegram group. No tablet. No monthly alert software fee. Works on any phone.' },
  { icon: '[ ADMIN ]',   name: 'Live Menu Updates',         desc: 'Update prices or mark items sold out instantly — from any device. Goes live immediately. No code, no delays.' },
  { icon: '[ SESSION ]', name: 'No Bill Surprises',          desc: 'Solo or group — set at first scan. Staff see the payment mode per table before the bill arrives. No surprises.' },
  { icon: '[ SAAS ]',    name: 'Run Multiple Venues From One System',                     desc: 'One codebase runs unlimited venues. Each restaurant gets their own slug, menu, tables, and branding from day one.' },
]

const TECH_STACK = ['NEXT.JS 16', 'NEON POSTGRESQL', 'VERCEL', 'TELEGRAM BOT', 'TYPESCRIPT', 'STRIPE']

const FLOW = [
  { step: '01', label: 'Customer scans QR code' },
  { step: '02', label: 'Gets a fruit seat code' },
  { step: '03', label: 'Browses menu and orders' },
  { step: '04', label: 'Kitchen gets Telegram alert' },
  { step: '05', label: 'Bill paid by seat' },
]

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
              color: '#F97316',
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
              {'Still taking orders on paper?\nHere is how your restaurant runs on a QR code.'}
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: '#666666',
              maxWidth: '600px',
              lineHeight: 1.8,
            }}>
              Customers scan, order, and pay from their phone. Orders go directly to the kitchen. Staff focus on service, not taking orders. No app. No tablet. No per-feature monthly fees.
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
                  background: '#F97316',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
              >
                Watch It Run Live →
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
                See Admin Panel →
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

        {/* ── WHO THIS IS FOR ── */}
        <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
              WHO THIS IS FOR
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Built for your type of venue.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {WHO_FOR.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#F97316', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px' }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── AFTER STATE ── */}
        <section style={{ background: '#080808', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
              AFTER THIS SYSTEM IS INSTALLED
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              What your service looks like on week two.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AFTER_STATE.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', lineHeight: 1.6, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#F97316', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── PROBLEM STRIP ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
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
                    color: '#F97316',
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
              WHAT&apos;S BUILT
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Everything the system includes.
            </h2>
            <div className="ro-grid-2">
              {FEATURES.map((f) => (
                <div key={f.name} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#F97316', marginBottom: '16px' }}>
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

        {/* ── SYSTEM IN ACTION ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>SYSTEM IN ACTION</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              See how it runs.
            </h2>
            <div className="ro-proof">
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#141414', border: '1px dashed #2A2A2A', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2A2A2A', margin: 0 }}>[ DASHBOARD SCREENSHOT ]</p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#444444', margin: 0, lineHeight: 1.6 }}>
                  Live order view — table, seat code, items ordered, and payment status per session.
                </p>
              </div>
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                {[
                  { label: 'Active orders', text: 'Every table session visible with fruit seat assignments and full order history.' },
                  { label: 'Instant alerts', text: 'Telegram notification fired per order — table, seat, items, total.' },
                  { label: 'Bill status', text: 'Payment mode per table set at first scan. Staff briefed before the ask.' },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F97316', margin: '0 0 6px' }}>{item.label}</p>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>IN PRACTICE</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              From table scan to kitchen to settled bill.
            </h2>
            <div style={{ display: 'flex', gap: '2px', background: '#1A1A1A', overflowX: 'auto' }}>
              {FLOW.map((item) => (
                <div key={item.step} style={{ background: '#141414', padding: '24px 20px', flex: 1, minWidth: '140px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', margin: '0 0 8px', letterSpacing: '0.1em' }}>{item.step}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#F0F0F0', margin: 0, lineHeight: 1.5 }}>{item.label}</p>
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
              background: '#F97316',
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
              GET THIS SYSTEM
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              Get Your System Setup
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              We configure your menu, set up your tables, connect your Telegram group, and hand you the QR codes.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Setup in 5–10 days.', 'Configured for your venue and menu.', 'No upfront commitment.'].map((line) => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666', margin: '4px 0', letterSpacing: '0.05em' }}>
                  — {line}
                </p>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: '1px solid rgba(249,115,22,0.2)', padding: '16px 24px', maxWidth: '400px', display: 'inline-block' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', margin: '0 0 6px' }}>AVAILABILITY</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>
                We onboard a limited number of venues per month.<br />Next available slot: <span style={{ color: '#F0F0F0', fontWeight: 600 }}>May 2026</span>
              </p>
            </div>
            <RestaurantContactForm />
          </div>
        </section>

        {/* ── WHY MAXPROMO ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>WHY MAXPROMO</p>
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
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '32px', color: 'rgba(249,115,22,0.12)', letterSpacing: '-0.04em', margin: '0 0 12px' }}>{item.num}</p>
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
