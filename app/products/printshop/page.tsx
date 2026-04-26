'use client'

import { useState } from 'react'
import Link from 'next/link'

const STYLES = `
  .ps-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .ps-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .ps-proof  { display: grid; grid-template-columns: 3fr 2fr; gap: 1px; background: #1A1A1A; }
  @media (max-width: 768px) {
    .ps-grid-3 { grid-template-columns: 1fr; }
    .ps-grid-2 { grid-template-columns: 1fr; }
    .ps-steps { flex-direction: column; }
    .ps-steps > div { border-right: none !important; }
    .ps-proof  { grid-template-columns: 1fr; }
  }
`

interface PrintshopForm {
  name: string
  business: string
  email: string
  phone: string
}

function PrintshopContactForm() {
  const [form, setForm] = useState<PrintshopForm>({ name: '', business: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof PrintshopForm) {
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
          message: form.phone ? `Phone: ${form.phone}` : 'Print shop enquiry',
          automation: 'printshop-os',
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
          { field: 'name',     type: 'text',  label: 'Your name',        required: true  },
          { field: 'business', type: 'text',  label: 'Print shop name',  required: true  },
          { field: 'email',    type: 'email', label: 'Email address',    required: true  },
          { field: 'phone',    type: 'tel',   label: 'Phone (optional)', required: false },
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
          background: '#F97316', color: '#080808', fontFamily: 'var(--font-mono)',
          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
          fontWeight: 700, padding: '16px', width: '100%', border: 'none',
          cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET MY FREE SETUP →'}
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
  'Customers configure, upload, and pay without contacting you',
  'Bad files caught before printing — no costly reprints',
  'Production queue updates automatically with every order',
  'PDF invoices generated and delivered without manual work',
  'EN, DE, and FR customers served 24/7 — no extra staff needed',
]

const WHO_FOR = [
  'Print businesses currently taking orders by email, WhatsApp, or phone',
  'Quoting every job manually — no self-service, no live pricing for customers',
  'Losing money on reprints because bad files are only caught after printing',
  'Managing the production queue in spreadsheets or shared WhatsApp groups',
  'Want to sell online 24/7 without hiring extra sales or admin staff',
]

const PROBLEMS = [
  { icon: '📧', text: 'Customer emails specs. You quote manually. They reply with changes. Four days pass. No order yet.' },
  { icon: '📁', text: 'File arrives. Wrong DPI. Wrong bleed. You catch it after printing. Reprint cost comes out of margin.' },
  { icon: '🗂', text: 'Production tracked in a spreadsheet. Shared via WhatsApp. Rush jobs get lost. Deadlines missed.' },
]

const FEATURES = [
  { icon: '[ SHOP ]',   name: 'Customers Order and Pay Without Emailing You',      desc: 'Configure quantity and size — price calculates live. Customers pay via Stripe. No quote request, no back-and-forth.' },
  { icon: '[ AI ]',     name: 'Catch Bad Files Before They Hit the Press',          desc: 'Wrong DPI, bleed, dimensions, or colour profile caught instantly before printing. No costly reprints. No margin lost.' },
  { icon: '[ EDIT ]',   name: 'In-Browser Design — No Back-and-Forth', desc: 'Text, shapes, logos designed online and saved to the order. Fewer revision requests. Fewer emails. Faster to press.' },
  { icon: '[ PROD ]',   name: 'Every Order Tracked From Payment to Delivery',       desc: 'Queued → In Progress → Done. Print sheet generated per job. Nothing falls through the cracks. No spreadsheet.' },
  { icon: '[ STRIPE ]', name: 'Get Paid Upfront — No Invoice Chasing',              desc: 'Full checkout with tax, multi-item cart, and automatic PDF invoice. Get paid before printing starts. Every time.' },
  { icon: '[ i18n ]',   name: 'Three Markets, One Platform',  desc: 'Shop, checkout, admin, and all email templates fully translated. Three markets. One platform. Zero extra configuration.' },
]

const STEPS = [
  { num: '01', title: 'Customer configures and pays',  desc: 'Selects product, size, quantity. Uploads artwork. AI validates the file. Pays via Stripe. All in one flow.' },
  { num: '02', title: 'Order enters production',       desc: 'Admin panel shows new order instantly. Print sheet generated. Job moves through production stages with one click.' },
  { num: '03', title: 'Invoice and delivery',          desc: 'PDF invoice auto-generated. Customer receives confirmation email. Order history available in their account.' },
]

const FLOW = [
  { step: '01', label: 'Customer configures product → No quoting required' },
  { step: '02', label: 'Uploads artwork file → AI validates instantly' },
  { step: '03', label: 'AI validates file instantly → No prepress staff needed' },
  { step: '04', label: 'Pays via Stripe → Payment confirmed automatically' },
  { step: '05', label: 'Enters production queue → Orders move without staff involvement' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function PrintshopPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#080808' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1.5rem' }}>
              LIVE PLATFORM · MULTI-LANGUAGE
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              PrintShop OS
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '600px', lineHeight: 1.8 }}>
              PrintShop OS replaces email quote requests, manual file checking, and disconnected order tracking with a fully automated print production workflow. Customers configure, upload, and pay — AI validates their files before they reach production. Orders move through your queue without staff involvement. For print businesses ready to stop quoting by email.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Built from real deployment logic', 'Handles real-world edge cases', 'Designed for production environments', 'No prototype logic'].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.08em', margin: 0, opacity: 0.85 }}>
                  <span style={{ marginRight: '8px', opacity: 0.5 }}>•</span>{line}
                </p>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <a
                href="https://printshop.maxpromo.digital/en"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080808', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
              >
                Watch It Run Live →
              </a>
              <Link
                href="/contact?system=printshop-os"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: '1px solid #1A1A1A', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333333')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1A1A1A')}
              >
                Get This System Installed →
              </Link>
            </div>
            <div style={{ marginTop: '2rem', background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '20px 24px', maxWidth: '360px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333333', marginBottom: '12px' }}>
                DEMO ACCESS
              </p>
              {['URL: printshop.maxpromo.digital', 'Admin: admin@printshop.com / admin123'].map((line) => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#666666', margin: '4px 0' }}>{line}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '2rem' }}>BEFORE / AFTER THIS SYSTEM</p>
            <div style={{ display: 'grid', gap: '1px', background: '#1A1A1A' }} className="ps-grid-2">
              <div style={{ background: '#141414', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>BEFORE</p>
                {['Quotes sent by email — slow, manual', 'File checks done by hand', 'Order tracking in spreadsheets', 'Customer updates by phone or email', 'Production errors from bad files'].map(item => (
                  <p key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 8px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#FF4D4D', flexShrink: 0 }}>✕</span>{item}
                  </p>
                ))}
              </div>
              <div style={{ background: '#141414', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>AFTER</p>
                {['Customers configure and pay without contacting you', 'AI validates files before production', 'Orders move through queue automatically', 'Invoices sent without manual work', '0 production errors from bad files'].map(item => (
                  <p key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F0F0F0', lineHeight: 1.6, margin: '0 0 8px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#F97316', flexShrink: 0, fontWeight: 700 }}>✓</span>{item}
                  </p>
                ))}
              </div>
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
              Built for your type of print business.
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
              What your print business looks like on week two.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AFTER_STATE.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', lineHeight: 1.6, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#F97316', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.1em', margin: '1.5rem 0 0' }}>
              → 0 missed orders · Files validated automatically · No manual coordination required · Running in live print shops
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', letterSpacing: '0.1em', margin: '6px 0 0' }}>
              Server-side validated · API-protected · No client-side critical logic
            </p>
          </div>
        </section>

        {/* ── PROBLEM STRIP ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>THE PROBLEM</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              How print shops operate today
            </h2>
            <div className="ps-grid-3">
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>WHAT&apos;S BUILT</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Everything a print business needs.
            </h2>
            <div className="ps-grid-2">
              {FEATURES.map((f) => (
                <div key={f.name} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#F97316', marginBottom: '16px' }}>{f.icon}</p>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>WORKFLOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              From order to production.
            </h2>
            <div style={{ borderTop: '1px solid #1A1A1A', display: 'flex', flexDirection: 'row' }} className="ps-steps">
              {STEPS.map((step, idx) => (
                <div key={step.num} style={{ flex: 1, padding: '40px 32px', borderRight: idx < STEPS.length - 1 ? '1px solid #1A1A1A' : 'none', borderBottom: '1px solid #1A1A1A', position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '80px', color: 'rgba(249,115,22,0.08)', lineHeight: 1, position: 'absolute', top: '16px', right: '24px', margin: 0, letterSpacing: '-0.04em', pointerEvents: 'none' }}>{step.num}</p>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>WHAT HAPPENS AFTER INSTALLATION</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              File uploaded. AI validates. Order queued for production. Invoice sent automatically.
            </h2>
            <div className="ps-proof">
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#141414', border: '1px dashed #2A2A2A', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2A2A2A', margin: 0 }}>[ DASHBOARD SCREENSHOT ]</p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#444444', margin: 0, lineHeight: 1.6 }}>
                  Order queue — prepress status, production stage, and Stripe payment confirmation per job.
                </p>
              </div>
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                {[
                  { label: 'Prepress check', text: 'AI file validation result shown per order before it enters production.' },
                  { label: 'Stage tracking', text: 'Queued → In Progress → Done. Print sheet attached to every job.' },
                  { label: 'Payment confirmed', text: 'Stripe status visible per order. PDF invoice auto-generated and sent.' },
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
              Failed uploads retried automatically · Payment errors handled by Stripe retry logic · File validation errors flagged before production
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              From customer upload to production — no manual steps.
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

        {/* ── SOCIAL PROOF BAR ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '20px 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0 }}>
              Live at printshop.maxpromo.digital · EN / DE / FR · Stripe payments active
            </p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', background: '#F97316', color: '#080808', padding: '4px 10px', fontWeight: 700 }}>
              LIVE IN PRODUCTION
            </span>
          </div>
        </section>

        {/* ── WHAT THIS IS NOT ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>NOT A TOOL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              {['Not a dashboard you configure yourself', 'Not another SaaS subscription', 'Not a template built for a different business'].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.6, margin: 0, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#FF4D4D', flexShrink: 0 }}>✕</span>{line}
                </p>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F0F0F0', letterSpacing: '0.04em', margin: 0 }}>
              → This is a system installed into your business.
            </p>
          </div>
        </section>

        {/* ── CONVERSION ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>INSTALL THIS SYSTEM</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              Get a free PrintShop OS setup for your print business.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Tell us about your product catalogue and workflow. We configure a free demo with your products, show you how it runs end to end, and send a no-obligation proposal. No commitment. We reply within 24 hours.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Free setup consultation — no charge.', 'Live in 5–10 days from sign-off.', 'No commitment until you are ready.'].map((line) => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666', margin: '4px 0', letterSpacing: '0.05em' }}>
                  — {line}
                </p>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: '1px solid rgba(249,115,22,0.2)', padding: '16px 24px', maxWidth: '400px', display: 'inline-block' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', margin: '0 0 6px' }}>AVAILABILITY</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>
                We onboard a limited number of print shops per month.<br />Next available slot: <span style={{ color: '#F0F0F0', fontWeight: 600 }}>May 2026</span>
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F0F0F0', letterSpacing: '0.05em', marginTop: '2.5rem', marginBottom: '8px' }}>
              We only install a limited number of systems per month.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', letterSpacing: '0.05em', marginBottom: '0' }}>
              We install this system for you.
            </p>
            <PrintshopContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#555', letterSpacing: '0.08em', margin: '12px 0 0' }}>
              // No obligation · Free setup consultation · We reply within 24 hours
            </p>
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
