'use client'

import { useState } from 'react'
import Link from 'next/link'

const STYLES = `
  .pb-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .pb-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (max-width: 768px) {
    .pb-grid-3 { grid-template-columns: 1fr; }
    .pb-grid-2 { grid-template-columns: 1fr; }
    .pb-steps { flex-direction: column; }
    .pb-steps > div { border-right: none !important; }
  }
`

interface PublishingForm {
  name: string
  company: string
  email: string
  phone: string
}

function PublishingContactForm() {
  const [form, setForm] = useState<PublishingForm>({ name: '', company: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof PublishingForm) {
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
          organisation: form.company,
          message: form.phone ? `Phone: ${form.phone}` : 'PublishingOS enquiry',
          automation: 'publishing-os',
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0F0F0F', border: '1px solid #1A1A1A', color: '#F0F0F0',
    padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px',
    width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease',
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {(
        [
          { field: 'name',    type: 'text',  label: 'Your name',        required: true  },
          { field: 'company', type: 'text',  label: 'Company name',     required: true  },
          { field: 'email',   type: 'email', label: 'Email address',    required: true  },
          { field: 'phone',   type: 'tel',   label: 'Phone (optional)', required: false },
        ] as const
      ).map(({ field, type, label, required }) => (
        <input key={field} name={field} type={type} placeholder={label} required={required}
          value={form[field]} onChange={update(field)} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#E8FF00')}
          onBlur={(e)  => (e.currentTarget.style.borderColor = '#1A1A1A')}
        />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: '#E8FF00', color: '#080808', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px', width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET YOUR SYSTEM SETUP →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#E8FF00', margin: 0 }}>✓ Request received. We&apos;ll contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at hello@maxpromo.digital</p>}
    </form>
  )
}

/* ─── PAGE DATA ───────────────────────────────────────────── */

const AFTER_STATE = [
  'Orders in, invoices out — no manual entry, no missed steps',
  'Stock levels monitored 24/7 — automatic low-stock alerts',
  'Royalties calculated and paid without a spreadsheet',
  '8 AI agents running overnight — chasing invoices, flagging risks',
  'Leadership briefed every morning before the first meeting',
]

const WHO_FOR = [
  'Publishing companies managing orders, stock, and authors across disconnected tools',
  'Finance tracked in spreadsheets, royalties calculated manually in Excel',
  'Manuscripts tracked by email — no single view of the editorial pipeline',
  'Invoices created in Word, chased by phone, paid late without visibility',
  'Leadership with no real-time view of revenue, stock, or outstanding payments',
]

const PROBLEMS = [
  { icon: '📦', text: 'Stock levels in a spreadsheet. Orders arrive by WhatsApp. Someone manually updates the sheet. Errors everywhere.' },
  { icon: '📚', text: 'Manuscripts tracked by email. Royalties calculated manually in Excel. Authors chase payments with no visibility.' },
  { icon: '🧾', text: 'Invoices created in Word. Chased by phone. Finance tracked across three different places. Nothing connects.' },
]

const FEATURES = [
  { icon: '[ ORDER ]', name: 'Orders In, Invoices Out — No Manual Entry',                           desc: 'Order in → invoice auto-generated → stock updated → customer notified. No manual steps, no missed follow-ups.' },
  { icon: '[ STOCK ]', name: 'Know Your Stock Level Before a Customer Asks',                         desc: 'Automatic alerts when stock falls below minimum. Print job requests triggered automatically. No surprises, no stockouts.' },
  { icon: '[ PUB ]',   name: 'Royalties Calculated and Paid Without a Spreadsheet',                 desc: 'Manuscripts tracked from submission to publication. Royalties calculated automatically. Authors paid on time, every time.' },
  { icon: '[ AI ]',    name: 'Ask Your Business a Question — Get an Answer in Seconds',             desc: 'How many books in stock? Who owes us money? What shipped today? AI answers instantly. No pulling reports.' },
  { icon: '[ AUTO ]',  name: 'Invoices Chased. Stock Monitored. Reports Written. While You Sleep.', desc: '8 AI agents running overnight — chasing unpaid invoices, flagging low stock, forecasting revenue. No one has to ask.' },
  { icon: '[ HR ]',    name: 'Staff Records, Leave, and Salaries — One Place',                      desc: 'Staff records, leave, performance, and salary reviews all managed in one platform. AI suggests adjustments based on scores.' },
]

const STEPS = [
  { num: '01', title: 'Order arrives',              desc: 'Staff creates the order in two minutes. Invoice generated automatically. Stock deducted. Finance updated. CEO briefed at 8am.' },
  { num: '02', title: 'Agents run overnight',       desc: 'Unpaid invoices chased automatically. Low stock triggers print job alerts. Dormant customers flagged for follow-up.' },
  { num: '03', title: 'Leadership stays informed',  desc: 'AI executive briefing every morning — revenue, unpaid invoices, overdue tasks, low stock, staff alerts. Before the first meeting.' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function PublishingOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#080808' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1.5rem' }}>
              ENTERPRISE SYSTEM · AI POWERED
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {'Still running your publishing operation\nin Excel and WhatsApp?'}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '600px', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              PublishingOS manages your entire operation from a single login.
              Orders, invoices, stock, manuscripts, royalties, HR, finance, and 8 AI agents running 24/7.
              Built to replace spreadsheets permanently. This system is now available for selected clients.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <Link href="/contact?system=publishing-os"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080808', background: '#E8FF00', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#D4EB00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E8FF00')}
              >
                See How This Runs Your Business →
              </Link>
              <Link href="/contact?system=publishing-os"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: '1px solid #1A1A1A', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333333')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1A1A1A')}
              >
                See What&apos;s Built
              </Link>
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
              Built for publishing businesses like yours.
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>THE PROBLEM</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              How publishing companies run today
            </h2>
            <div className="pb-grid-3">
              {PROBLEMS.map((p) => (
                <div key={p.icon} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontSize: '28px', marginBottom: '16px' }}>{p.icon}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>WHAT&apos;S BUILT</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              15 modules. Your entire operation.
            </h2>
            <div className="pb-grid-2">
              {FEATURES.map((f) => (
                <div key={f.name} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#E8FF00', marginBottom: '16px' }}>{f.icon}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px' }}>{f.name}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ background: '#0F0F0F', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>WORKFLOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              One system. Everything connected.
            </h2>
            <div style={{ borderTop: '1px solid #1A1A1A', display: 'flex', flexDirection: 'row' }} className="pb-steps">
              {STEPS.map((step, idx) => (
                <div key={step.num} style={{ flex: 1, padding: '40px 32px', borderRight: idx < STEPS.length - 1 ? '1px solid #1A1A1A' : 'none', borderBottom: '1px solid #1A1A1A', position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '80px', color: 'rgba(232,255,0,0.06)', lineHeight: 1, position: 'absolute', top: '16px', right: '24px', margin: 0, letterSpacing: '-0.04em', pointerEvents: 'none' }}>{step.num}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px', position: 'relative' }}>{step.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0, position: 'relative' }}>{step.desc}</p>
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
            <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '220px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333333', margin: 0 }}>[ WORKFLOW / DASHBOARD PREVIEW ]</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#333333', margin: 0 }}>Screenshots and workflow diagrams — coming soon</p>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '20px 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0 }}>
              Built and delivered for a publishing company in Central Africa · Live since 2026
            </p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', background: '#E8FF00', color: '#080808', padding: '4px 10px', fontWeight: 700 }}>
              ENTERPRISE · DEPLOYED
            </span>
          </div>
        </section>

        {/* ── CONVERSION ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>GET THIS SYSTEM</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              Get Your System Setup
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Custom-built for your catalogue, your team, and your workflows. Replaces spreadsheets, paper records, and disconnected tools permanently.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Setup in 5–10 days.', 'Configured for your business.', 'No upfront commitment.'].map((line) => (
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
            <PublishingContactForm />
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
