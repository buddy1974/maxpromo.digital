'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── CMYK DESIGN TOKENS ──────────────────────────────────── */
const C      = '#00AEEF'
const M      = '#EC008C'
const Y      = '#FFF200'
const K      = '#1A1A1A'
const INK    = '#0A0A0A'
const ORANGE = '#F97316'
const CMYK_CYCLE = [Y, M, C, ORANGE, K, C] as const

const STYLES = `
  .ps-grid-3  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${INK}; }
  .ps-grid-2  { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: ${INK}; }
  .ps-why     { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${INK}; border: 2px solid ${INK}; }
  .ps-proof   { display: grid; grid-template-columns: 3fr 2fr; gap: 1px; background: ${INK}; border: 2px solid ${INK}; }
  .ink-card   { background: #FFFFFF; padding: 28px 32px; }
  .cmyk-dot   { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  @media (max-width: 768px) {
    .ps-grid-3, .ps-why { grid-template-columns: 1fr; }
    .ps-grid-2  { grid-template-columns: 1fr; }
    .ps-steps   { flex-direction: column; }
    .ps-steps > div { border-right: none !important; }
    .ps-proof   { grid-template-columns: 1fr; }
  }
`

/* ─── CONTACT FORM ────────────────────────────────────────── */

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
    background: '#FFFFFF',
    border: `2px solid ${INK}`,
    color: INK,
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
          onFocus={(e) => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={(e)  => (e.currentTarget.style.borderColor = INK)}
        />
      ))}
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        style={{
          background: INK, color: '#FFFFFF', fontFamily: 'var(--font-mono)',
          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
          fontWeight: 700, padding: '16px', width: '100%', border: 'none',
          cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET YOUR SYSTEM SETUP →'}
      </button>
      {status === 'success' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>
          ✓ Request received. We&apos;ll contact you within 24 hours.
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#CC0000', margin: 0 }}>
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

const WHY_CARDS = [
  { bg: Y,      fgDark: true,  icon: '[ ⚡ ]', title: 'Fast production',      desc: 'Orders processed automatically from upload to production queue.' },
  { bg: M,      fgDark: false, icon: '[ AI ]', title: 'AI file validation',   desc: 'Claude reads every uploaded file and advises on quality, bleed, resolution in real time.' },
  { bg: C,      fgDark: true,  icon: '[ ∀ ]',  title: 'Any product, any size', desc: 'Configurable product builder. Flyers, banners, business cards, custom sizes — all in one platform.' },
  { bg: ORANGE, fgDark: true,  icon: '[ ≡ ]',  title: 'Order management',     desc: 'Full admin panel — production queue, order status, invoicing, customer management.' },
  { bg: K,      fgDark: false, icon: '[ Aa ]', title: 'Multi-language',        desc: 'Platform runs in English, German, and French. Reaches more customers.' },
  { bg: C,      fgDark: true,  icon: '[ $ ]',  title: 'Stripe payments',       desc: 'Secure checkout, order confirmation, and automated invoice generation on every order.' },
]

const FEATURES = [
  { icon: '[ SHOP ]',   name: 'Customers Order and Pay Without Emailing You',  desc: 'Configure quantity and size — price calculates live. Customers pay via Stripe. No quote request, no back-and-forth.' },
  { icon: '[ AI ]',     name: 'Catch Bad Files Before They Hit the Press',      desc: 'Wrong DPI, bleed, dimensions, or colour profile caught instantly before printing. No costly reprints. No margin lost.' },
  { icon: '[ EDIT ]',   name: 'In-Browser Design — No Back-and-Forth',          desc: 'Text, shapes, logos designed online and saved to the order. Fewer revision requests. Fewer emails. Faster to press.' },
  { icon: '[ PROD ]',   name: 'Every Order Tracked From Payment to Delivery',   desc: 'Queued → In Progress → Done. Print sheet generated per job. Nothing falls through the cracks. No spreadsheet.' },
  { icon: '[ STRIPE ]', name: 'Get Paid Upfront — No Invoice Chasing',          desc: 'Full checkout with tax, multi-item cart, and automatic PDF invoice. Get paid before printing starts. Every time.' },
  { icon: '[ i18n ]',   name: 'Three Markets, One Platform',                    desc: 'Shop, checkout, admin, and all email templates fully translated. Three markets. One platform. Zero extra configuration.' },
]

const STEPS = [
  { num: '01', color: C,      title: 'Customer configures and pays',  desc: 'Selects product, size, quantity. Uploads artwork. AI validates the file. Pays via Stripe. All in one flow.' },
  { num: '02', color: M,      title: 'Order enters production',       desc: 'Admin panel shows new order instantly. Print sheet generated. Job moves through production stages with one click.' },
  { num: '03', color: Y,      title: 'Invoice and delivery',          desc: 'PDF invoice auto-generated. Customer receives confirmation email. Order history available in their account.' },
]

const FLOW = [
  { step: '01', label: 'Customer configures product',  note: 'No quoting required',            color: C },
  { step: '02', label: 'Uploads artwork file',          note: 'AI validates instantly',          color: M },
  { step: '03', label: 'AI validates file instantly',   note: 'No prepress staff needed',        color: Y },
  { step: '04', label: 'Pays via Stripe',               note: 'Payment confirmed automatically', color: ORANGE },
  { step: '05', label: 'Enters production queue',       note: 'Orders move without staff',       color: C },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function PrintshopPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#FFFFFF' }}>

        {/* ── HERO ── */}
        <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              // PRINTSHOP OS
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.04em', color: INK, lineHeight: 1.05, marginBottom: '1.5rem', maxWidth: '680px' }}>
              The print shop that<br />runs itself.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#444444', maxWidth: '560px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              AI-powered print management platform.
              Customers configure, upload, pay.
              AI validates files in real time.
              You print. The system handles everything else.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
              <a
                href="https://printshop.maxpromo.digital/en"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFFFFF', background: INK, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', border: `2px solid ${INK}`, transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
                onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
              >
                Watch It Run Live →
              </a>
              <Link
                href="/contact?system=printshop-os"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: INK, border: `2px solid ${INK}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.color = '#FFF' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK }}
              >
                Request This System →
              </Link>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', background: Y, color: INK, padding: '6px 14px', border: `2px solid ${INK}` }}>
                LIVE IN PRODUCTION
              </span>
            </div>

            {/* Demo access */}
            <div style={{ background: '#FAFAF8', border: `2px solid ${INK}`, padding: '20px 24px', maxWidth: '380px', display: 'inline-block' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888', margin: '0 0 12px' }}>
                DEMO ACCESS
              </p>
              {['URL: printshop.maxpromo.digital', 'Admin: admin@printshop.com / admin123'].map((line) => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#444', margin: '4px 0' }}>{line}</p>
              ))}
            </div>

            {/* CMYK dot row */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2rem', alignItems: 'center' }}>
              {[C, M, Y, K].map((col, i) => (
                <span key={i} className="cmyk-dot" style={{ background: col, border: `1px solid ${INK}` }} />
              ))}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', marginLeft: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ISO 12647 · Colour managed
              </span>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '14px 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#444', margin: 0 }}>
              Live at printshop.maxpromo.digital · EN / DE / FR · Stripe payments active
            </p>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[C, M, Y].map((col, i) => (
                <span key={i} className="cmyk-dot" style={{ background: col, border: `1px solid ${INK}` }} />
              ))}
            </div>
          </div>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <section style={{ background: '#FFFFFF', borderBottom: `2px solid ${INK}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>
              BEFORE / AFTER THIS SYSTEM
            </p>
            <div className="ps-grid-2" style={{ border: `2px solid ${INK}` }}>
              <div className="ink-card" style={{ borderLeft: `4px solid #CC0000` }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#CC0000', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>BEFORE</p>
                {['Quotes sent by email — slow, manual', 'File checks done by hand', 'Order tracking in spreadsheets', 'Customer updates by phone or email', 'Production errors from bad files'].map(item => (
                  <p key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#444', lineHeight: 1.6, margin: '0 0 8px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#CC0000', flexShrink: 0 }}>✕</span>{item}
                  </p>
                ))}
              </div>
              <div className="ink-card" style={{ borderLeft: `4px solid ${C}` }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: C, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>AFTER</p>
                {['Customers configure and pay without contacting you', 'AI validates files before production', 'Orders move through queue automatically', 'Invoices sent without manual work', '0 production errors from bad files'].map(item => (
                  <p key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: INK, lineHeight: 1.6, margin: '0 0 8px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: C, flexShrink: 0, fontWeight: 700 }}>✓</span>{item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO THIS IS FOR ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHO THIS IS FOR
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: INK, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Built for your type of print business.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {WHO_FOR.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#444', lineHeight: 1.75, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: M, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px', fontWeight: 700 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── WHY US — 6 CMYK CARDS ── */}
        <section style={{ background: '#FFFFFF', borderBottom: `2px solid ${INK}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '0.75rem' }}>
              Why this system
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '1rem' }}>
              The print shop that{' '}
              <em style={{ color: M, fontStyle: 'italic' }}>answers.</em>
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#555', maxWidth: '520px', lineHeight: 1.7, marginBottom: '3rem' }}>
              AI validates files, handles orders, and manages production — so your team focuses on printing.
            </p>
            <div className="ps-why">
              {WHY_CARDS.map((card) => (
                <div key={card.title} className="ink-card" style={{ borderTop: `4px solid ${card.bg}` }}>
                  <div style={{ border: `2px solid ${INK}`, padding: '7px 12px', background: card.bg, display: 'inline-flex', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: card.fgDark ? INK : '#FFF', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {card.icon}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: INK, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', lineHeight: 1.75, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CMYK COLOUR STRIP ── */}
        <div style={{ display: 'flex', width: '100%', borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
          {([
            { bg: C, label: 'C', dark: false },
            { bg: M, label: 'M', dark: false },
            { bg: Y, label: 'Y', dark: true  },
            { bg: K, label: 'K', dark: false },
          ] as const).map(({ bg, label, dark }, i, arr) => (
            <div
              key={label}
              style={{
                flex: 1, background: bg, height: '80px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: i < arr.length - 1 ? `1px solid ${INK}` : 'none',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '22px', color: dark ? INK : '#FFFFFF', letterSpacing: '0.2em' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── WORKFLOW — DARK ── */}
        <section style={{ background: INK, padding: '6rem 2rem', borderBottom: '2px solid #333' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WORKFLOW
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#FFFFFF', marginBottom: '3rem' }}>
              From order to production.
            </h2>

            {/* 5-step flow */}
            <div style={{ display: 'flex', gap: '2px', background: '#333', overflowX: 'auto', marginBottom: '3rem' }}>
              {FLOW.map((item) => (
                <div key={item.step} style={{ background: '#141414', padding: '24px 20px', flex: 1, minWidth: '150px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '20px', color: item.color, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                    {item.step}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#F0F0F0', margin: '0 0 4px', lineHeight: 1.4, fontWeight: 600 }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.05em' }}>
                    {item.note}
                  </p>
                </div>
              ))}
            </div>

            {/* 3-step detail */}
            <div style={{ borderTop: '1px solid #1A1A1A', display: 'flex', flexDirection: 'row' }} className="ps-steps">
              {STEPS.map((step, idx) => (
                <div key={step.num} style={{ flex: 1, padding: '40px 32px', borderRight: idx < STEPS.length - 1 ? '1px solid #1A1A1A' : 'none', borderBottom: '1px solid #1A1A1A', position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '52px', color: step.color, lineHeight: 1, marginBottom: '12px', letterSpacing: '-0.04em' }}>
                    {step.num}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM STRIP ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              THE PROBLEM
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px', color: INK, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              How print shops operate today
            </h2>
            <div className="ps-grid-3" style={{ border: `2px solid ${INK}` }}>
              {PROBLEMS.map((p, i) => (
                <div key={p.icon} className="ink-card" style={{ borderTop: `4px solid ${CMYK_CYCLE[i]}` }}>
                  <p style={{ fontSize: '28px', marginBottom: '16px' }}>{p.icon}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#444', lineHeight: 1.75, margin: 0 }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AFTER STATE ── */}
        <section style={{ background: '#FFFFFF', borderBottom: `2px solid ${INK}`, padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              AFTER THIS SYSTEM IS INSTALLED
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: INK, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              What your print business looks like on week two.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AFTER_STATE.map((item) => (
                <li key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: INK, lineHeight: 1.6, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: C, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', paddingTop: '3px', fontWeight: 700 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: C, letterSpacing: '0.1em', margin: '1.5rem 0 0' }}>
              → 0 missed orders · Files validated automatically · No manual coordination required · Running in live print shops
            </p>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ background: '#FFFFFF', padding: '6rem 2rem', borderBottom: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT&apos;S BUILT
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '3rem' }}>
              Everything a print business needs.
            </h2>
            <div className="ps-grid-2" style={{ border: `2px solid ${INK}` }}>
              {FEATURES.map((f, i) => {
                const accentBg = CMYK_CYCLE[i % CMYK_CYCLE.length]
                const iconDark = accentBg === Y || accentBg === C || accentBg === ORANGE
                return (
                  <div key={f.name} className="ink-card" style={{ borderTop: `4px solid ${accentBg}` }}>
                    <div style={{ border: `2px solid ${INK}`, padding: '6px 12px', background: accentBg, display: 'inline-flex', marginBottom: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: iconDark ? INK : '#FFF', fontWeight: 700, letterSpacing: '0.05em' }}>
                        {f.icon}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: INK, letterSpacing: '-0.02em', marginBottom: '10px' }}>
                      {f.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', lineHeight: 1.75, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── SYSTEM IN ACTION ── */}
        <section style={{ background: '#FAFAF8', padding: '6rem 2rem', borderBottom: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT HAPPENS AFTER INSTALLATION
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '3rem', maxWidth: '640px' }}>
              File uploaded. AI validates. Order queued for production. Invoice sent automatically.
            </h2>
            <div className="ps-proof">
              <div className="ink-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#F0F0F0', border: `1px dashed ${K}`, minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#AAAAAA', margin: 0 }}>
                    [ DASHBOARD SCREENSHOT ]
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.6 }}>
                  Order queue — prepress status, production stage, and Stripe payment confirmation per job.
                </p>
              </div>
              <div className="ink-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                {[
                  { label: 'Prepress check',    text: 'AI file validation result shown per order before it enters production.', color: C },
                  { label: 'Stage tracking',    text: 'Queued → In Progress → Done. Print sheet attached to every job.',        color: M },
                  { label: 'Payment confirmed', text: 'Stripe status visible per order. PDF invoice auto-generated and sent.',  color: Y },
                ].map((item) => (
                  <div key={item.label} style={{ borderLeft: `3px solid ${item.color}`, paddingLeft: '16px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: item.color === Y ? '#888' : item.color, margin: '0 0 6px', fontWeight: 700 }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#444', margin: 0, lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CONVERSION ── */}
        <section style={{ background: '#FFFFFF', padding: '6rem 2rem', borderBottom: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              INSTALL THIS SYSTEM
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '1rem' }}>
              PrintShop OS. Installed into your print business.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#555', lineHeight: 1.8, maxWidth: '520px' }}>
              We configure your product catalogue, connect Stripe, and hand you a running platform. Your brand, your pricing, your domain.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <div style={{ background: '#FAFAF8', border: `2px solid ${INK}`, padding: '20px 24px', maxWidth: '320px' }}>
                {['Setup in 5–10 days.', 'Configured for your products and pricing.', 'No upfront commitment.'].map((line) => (
                  <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#444', margin: '4px 0', letterSpacing: '0.05em' }}>
                    — {line}
                  </p>
                ))}
              </div>
              <div style={{ background: '#FAFAF8', border: `2px solid ${C}`, padding: '16px 24px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: C, margin: '0 0 6px', fontWeight: 700 }}>
                  AVAILABILITY
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#444', margin: 0, lineHeight: 1.6 }}>
                  We onboard a limited number of print shops per month.<br />
                  Next available slot: <span style={{ color: INK, fontWeight: 600 }}>May 2026</span>
                </p>
              </div>
            </div>
            <PrintshopContactForm />
          </div>
        </section>

        {/* ── WHY MAXPROMO ── */}
        <section style={{ background: '#FAFAF8', borderBottom: `2px solid ${INK}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHY MAXPROMO
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '2rem' }}>
              Not theory. Real systems, running now.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: INK, border: `2px solid ${INK}` }}>
              {[
                { num: '01', text: 'Built from real client briefs — not feature lists', color: C },
                { num: '02', text: 'Already deployed in production, not in staging',    color: M },
                { num: '03', text: 'Configured to your workflow — not a generic template', color: Y },
                { num: '04', text: 'We hand you a running system, not a prototype',      color: ORANGE },
              ].map((item) => (
                <div key={item.num} className="ink-card">
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '36px', color: item.color, letterSpacing: '-0.04em', margin: '0 0 12px' }}>
                    {item.num}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#444', lineHeight: 1.75, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA — YELLOW ── */}
        <section style={{ background: Y, padding: '6rem 2rem', borderTop: `2px solid ${INK}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
              {[C, M, Y, K].map((col, i) => (
                <span key={i} className="cmyk-dot" style={{ background: col, border: `2px solid ${INK}`, width: '12px', height: '12px' }} />
              ))}
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: INK, marginBottom: '2rem', lineHeight: 1.1 }}>
              Want this system for<br />your print shop?
            </h2>
            <Link
              href="/contact?system=printshop-os"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFFFFF', background: INK, padding: '16px 36px', textDecoration: 'none', display: 'inline-block', border: `2px solid ${INK}`, transition: 'background 150ms ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
            >
              Request This System →
            </Link>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: INK, opacity: 0.5, marginTop: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Limited slots · Setup in 5–10 days · Your brand, your domain
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
