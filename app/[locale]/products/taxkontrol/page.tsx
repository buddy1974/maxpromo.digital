'use client'

import { useState } from 'react'
import Image from 'next/image'

/* ─── TOKENS ──────────────────────────────────────────────── */
const NAVY   = '#1E3A5F'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .tk-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .tk-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .tk-grid-2 { grid-template-columns: 1fr; }
    .tk-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

/* ─── CONTACT FORM ────────────────────────────────────────── */

function AccessRequestForm() {
  const [form, setForm] = useState({ name: '', business: '', email: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name,
          email:        form.email,
          organisation: form.business,
          message:      'TaxKontrol access request',
          automation:   'taxkontrol',
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const input: React.CSSProperties = {
    background: '#0A0A0A', border: `1px solid ${BORDER}`, color: '#F0F0F0',
    padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px',
    width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease',
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {(['name', 'business', 'email'] as const).map(field => (
        <input
          key={field}
          name={field}
          type={field === 'email' ? 'email' : 'text'}
          placeholder={field === 'name' ? 'Your name' : field === 'business' ? 'Business name' : 'Email address'}
          required
          value={form[field]}
          onChange={update(field)}
          style={input}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
        />
      ))}
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        style={{
          background: ORANGE, color: BG, fontFamily: 'var(--font-mono)', fontSize: '11px',
          textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px',
          width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Request received' : 'Request walkthrough →'}
      </button>
      {status === 'success' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>
          We will be in touch within 24 hours to schedule a short conversation.
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>
          Something went wrong. Email us directly at info@maxpromo.digital
        </p>
      )}
    </form>
  )
}

/* ─── PAGE DATA ───────────────────────────────────────────── */

const WORKFLOW = [
  { num: '01', title: 'Connect the business',  desc: 'Bank account connected or transactions entered manually. The system begins building a picture of income, expenses and the tax position in real time.' },
  { num: '02', title: 'Expenses captured daily', desc: 'Receipts photographed when they happen. Nothing saved for later. The folder at the end of the year stops being a problem.' },
  { num: '03', title: 'Reserve visible at all times', desc: 'What needs to be set aside for taxes is calculated continuously. The business owner does not have to estimate — the number is already there.' },
  { num: '04', title: 'Deadlines tracked automatically', desc: 'All filing dates for the business type are tracked in one place. No searching across government websites for what is due and when.' },
  { num: '05', title: 'Export ready when needed', desc: 'ELSTER-ready data prepared and available whenever the accountant or the owner needs it. No manual reformatting before submission.' },
]

const WHAT_CHANGES = [
  { before: 'Tax position unknown until filing season',  after: 'Reserve visible every day — no surprises'   },
  { before: 'Receipts collected in a folder for months', after: 'Expenses captured when they happen'         },
  { before: 'Quarterly deadlines missed or guessed at',  after: 'All deadlines tracked in one view'          },
  { before: 'Accountant receives disorganized records',  after: 'ELSTER-ready data handed over immediately'  },
]

const AFTER_YES = [
  { step: '01', title: 'Short conversation',   desc: 'We learn about the business — how income arrives, what expenses look like, where the pressure is currently coming from.' },
  { step: '02', title: 'Map the current flow', desc: 'We look at what is already being tracked and what is not. The setup is built around the real workflow, not a template.' },
  { step: '03', title: 'System configured',    desc: 'TaxKontrol is set up for the specific business type, filing cycle, and reserve requirements — ready to use from the first day.' },
  { step: '04', title: 'Running from day one', desc: 'The business owner has a live view of income, expenses, reserve and deadlines from the day the system is configured.' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function TaxKontrolPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="tk-hero">
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              TAXKONTROL · FINANCIAL VISIBILITY SYSTEM
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '2rem', maxWidth: '720px' }}>
              Know where your business stands —<br />before tax season tells you.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '560px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              TaxKontrol keeps taxes, reserves and obligations visible — without changing how your business already operates.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="#walkthrough"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}
              >
                Request walkthrough →
              </a>
              <a
                href="#workflow"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                See how it works →
              </a>
            </div>

            {/* Trust strip */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '2.5rem', paddingTop: '2rem', borderTop: `1px solid ${BORDER}` }}>
              {['DSGVO compliant', 'Hosted in Germany', 'ELSTER-ready preparation', 'Built for German businesses'].map(t => (
                <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>— {t}</span>
              ))}
            </div>
          </div>
          <div>
            <Image
              src="/images/systems/taxkontrol/card/taxkontrol-en.png"
              alt="Business owner reviewing financial position — tax reserve and obligations visible"
              width={760}
              height={400}
              style={{ width: '100%', height: 'auto', borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}
              priority
            />
          </div>
          </div>
        </section>

        {/* ── INDUSTRY PAIN ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
                THE SITUATION
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                Most businesses in Germany operate without a clear view of their tax position. Not because the owners are careless. Because the tools were not built for how they actually work.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                Tax obligations in Germany are quarterly and annual. They involve VAT, income tax, trade tax, and advance payments — often on different schedules, submitted to different authorities. Most business owners find out what they owe when the calculation is already done. By then, the options are limited.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: BORDER }}>
              {[
                { label: 'QUARTERLY FILING', text: 'Due four times a year. Business owners estimate what to submit. They find out if the estimate held three months later.' },
                { label: 'ANNUAL CALCULATION', text: 'The full picture arrives in spring. Revenue was strong. The tax liability is also strong. The timing rarely aligns with cash.' },
                { label: 'RECEIPT BACKLOG', text: 'Receipts and records accumulate across the year. They become a filing problem when the deadline is close. Then an urgent problem.' },
              ].map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '28px 32px', borderTop: `3px solid ${NAVY}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REAL SCENE ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '2rem' }}>
              WHAT THIS LOOKS LIKE IN PRACTICE
            </p>
            <div style={{ maxWidth: '640px' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.35, marginBottom: '1.5rem' }}>
                March arrives.<br />
                Invoices were paid. Business looked healthy.<br />
                Then: "How much of this actually belongs to me?"
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                The Steuerbescheid arrives. The number is correct — the business earned it. But the Steuerrücklage was not tracked. The money moved through the account and was spent on operations. The owner pays the Nachzahlung in instalments and resolves to start the year differently. The pattern repeats.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                The quarterly Vorauszahlung arrives. The business files it based on last year's figure. The business has grown. The estimate is too low. The Finanzamt adjusts it upward. A letter arrives explaining the new amount.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                These are not failures of discipline. The German tax system was not designed for businesses without accounting departments. TaxKontrol is the system that fills that gap — daily visibility, not annual discovery.
              </p>
            </div>
          </div>
        </section>

        {/* ── SYSTEM INSTALLED ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              SYSTEM INSTALLED
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                  TaxKontrol is installed into the business. The tax position becomes visible — every day.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  Income tracked as it arrives. Expenses recorded when they happen. The reserve calculated in real time. Filing deadlines visible before they become urgent.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  The business owner does not become a tax specialist. They get a clear number — what is theirs, what belongs to the Finanzamt, what needs to be submitted and when. That is the entire scope of the system.
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${NAVY}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  WHAT BECOMES VISIBLE
                </p>
                {[
                  'Tax reserve — updated in real time as income arrives',
                  'Quarterly filing deadlines — for the specific business type',
                  'Annual tax position — not a year-end calculation but a running total',
                  'Expense record — captured daily, not collected at filing time',
                  'ELSTER-ready export — available when the accountant or submission needs it',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section id="workflow" style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              HOW THE SYSTEM WORKS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Five steps. Starts with the current process.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {WORKFLOW.map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '32px', padding: '28px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, minWidth: '32px', flexShrink: 0, paddingTop: '2px' }}>{step.num}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── SYSTEM IN ACTION ── */}
            <div style={{ marginTop: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', marginBottom: '1rem' }}>
                THE SYSTEM IN OPERATION
              </p>
              <Image
                src="/images/systems/taxkontrol/card/taxkontrol-de.png"
                alt="TaxKontrol dashboard — tax reserve, deadlines and expense tracking visible daily"
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #1A1A1A', display: 'block' }}
              />
            </div>
          </div>
        </section>

        {/* ── WHAT CHANGES ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT CHANGES AFTER INSTALLATION
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>
              The business does not change. What the owner can see does.
            </h2>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>BEFORE</p>
                </div>
                <div style={{ padding: '14px 28px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>AFTER</p>
                </div>
              </div>
              {WHAT_CHANGES.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                  <div style={{ padding: '18px 28px', borderRight: `1px solid ${BORDER}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#555', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>✕</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555555', margin: 0, lineHeight: 1.6 }}>{row.before}</p>
                  </div>
                  <div style={{ padding: '18px 28px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>✓</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F0F0F0', margin: 0, lineHeight: 1.6 }}>{row.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO / PROOF ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              SEE THE SYSTEM
            </p>
            <div className="tk-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${NAVY}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                  What the system shows every day
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'Tax reserve — current balance set aside for obligations',
                    'Income this period — tracked against last period',
                    'Deductible expenses — captured and categorized',
                    'Next filing deadline — date and type, always visible',
                  ].map(line => (
                    <div key={line} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>→</span>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{line}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: CARD, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                <div style={{ background: '#141414', border: `1px dashed ${BORDER}`, minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2A2A2A', margin: 0, textAlign: 'center' }}>
                    [ LIVE SYSTEM VIEW<br />WALKTHROUGH SCHEDULED ON REQUEST ]
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#444', margin: 0, lineHeight: 1.6 }}>
                  The system walkthrough covers the live view — reserve tracking, deadline calendar, expense capture and ELSTER export — configured for your business type.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT HAPPENS NEXT ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT HAPPENS NEXT
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              From the first conversation to a running system. No commitment required upfront.
            </h2>
            <div className="tk-grid-2">
              {AFTER_YES.map(item => (
                <div key={item.step} style={{ background: '#141414', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '40px', color: `${NAVY}50`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>
                    {item.step}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              REQUEST A WALKTHROUGH
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              See the system working in your type of business.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              We walk through the live system — reserve tracking, deadline view, expense capture and export — configured for your specific business and filing requirements.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: `1px solid ${BORDER}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Short conversation first — no commitment.', 'System configured around your business.', 'Running from the first day.'].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666', margin: '4px 0', letterSpacing: '0.05em' }}>— {line}</p>
              ))}
            </div>
            <AccessRequestForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>
              // DSGVO compliant · Hosted in Germany · Reply within 24 hours
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
