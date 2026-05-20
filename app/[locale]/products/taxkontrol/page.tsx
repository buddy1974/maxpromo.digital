'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── DESIGN TOKENS ───────────────────────────────────────── */
const NAVY   = '#1E3A5F'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .tk-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .tk-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${BORDER}; }
  .tk-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: ${BORDER}; }
  @media (max-width: 768px) {
    .tk-grid-2, .tk-grid-3, .tk-grid-5 { grid-template-columns: 1fr; }
  }
`

/* ─── FORM ────────────────────────────────────────────────── */

interface AccessForm {
  name: string
  business: string
  type: string
  email: string
}

function AccessRequestForm() {
  const [form, setForm] = useState<AccessForm>({ name: '', business: '', type: '', email: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof AccessForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
          message:      `Business type: ${form.type || 'not specified'}`,
          automation:   'taxkontrol',
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0A0A0A',
    border: `1px solid ${BORDER}`,
    color: '#F0F0F0',
    padding: '14px 16px',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    width: '100%',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 150ms ease',
  }

  const BUSINESS_TYPES = [
    'Self-employed / Freelancer',
    'Studio or salon',
    'Clinic or medical practice',
    'Consulting or advisory',
    'Small service business',
    'Other',
  ]

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
          style={inputStyle}
          onFocus={e  => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e   => (e.currentTarget.style.borderColor = BORDER)}
        />
      ))}
      <select
        name="type"
        value={form.type}
        onChange={update('type')}
        style={{ ...inputStyle, cursor: 'pointer' }}
        onFocus={e  => (e.currentTarget.style.borderColor = ORANGE)}
        onBlur={e   => (e.currentTarget.style.borderColor = BORDER)}
      >
        <option value="">Business type (optional)</option>
        {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        style={{
          background: ORANGE, color: BG, fontFamily: 'var(--font-mono)',
          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
          fontWeight: 700, padding: '16px', width: '100%', border: 'none',
          cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Request received' : 'Request access →'}
      </button>
      {status === 'success' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>
          We will be in touch within 24 hours to schedule a short conversation.
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>
          Something went wrong. Email us at info@maxpromo.digital
        </p>
      )}
    </form>
  )
}

/* ─── PAGE DATA ───────────────────────────────────────────── */

const PRESSURE_MOMENTS = [
  {
    label: 'YEAR-END DISCOVERY',
    text:  'Tax season arrives. The calculation is done. The number is larger than expected — and the account balance is not. Paying in installments while running the business is how the year ends.',
  },
  {
    label: 'QUARTERLY BLIND SPOT',
    text:  'Quarterly filings are due. The account looks roughly right. The submission goes in and you hope the estimate holds. You will find out if it did three months from now.',
  },
  {
    label: 'THE RECEIPT SITUATION',
    text:  'There is a folder. The folder contains receipts from several months ago. It will be handled before the deadline. This has been the plan for two years.',
  },
]

const WHAT_IT_COSTS = [
  {
    label: 'Cash flow disruption',
    text:  'An unexpected tax bill — even a correct one — creates a cash flow problem that takes months to absorb. Businesses that track reserves avoid this entirely.',
  },
  {
    label: 'Late filing penalties',
    text:  'The German tax authority applies automatic penalties for missed quarterly and annual deadlines. These are avoidable with basic deadline visibility.',
  },
  {
    label: 'Unnecessary accountant time',
    text:  'Handing disorganized records to an accountant is billed by the hour. Structured records reduce that engagement cost every year.',
  },
]

const WHO_FOR = [
  { type: 'Self-employed professionals',  pain: 'Tracking income and deductible expenses without a dedicated system.' },
  { type: 'Studio and salon operators',   pain: 'Running a full business while keeping tax reserves visible day to day.' },
  { type: 'Consultants and advisors',     pain: 'Clear on income. Less clear on what that income means for quarterly obligations.' },
  { type: 'Small clinics and practices',  pain: 'Managing operations alongside quarterly filings and annual tax preparation.' },
  { type: 'Growing service businesses',   pain: 'Revenue increasing faster than the system for understanding the tax position.' },
]

const STEPS = [
  { num: '01', title: 'Connect or enter',   desc: 'Connect your business bank account or add income and expenses manually. The initial setup takes under two minutes.' },
  { num: '02', title: 'Track as you go',    desc: 'Capture receipts and log transactions when they happen. No folder-at-year-end approach required.' },
  { num: '03', title: 'See your reserve',   desc: 'Your estimated tax reserve updates in real time. Know what to set aside today — not when the filing arrives.' },
  { num: '04', title: 'Follow deadlines',   desc: 'All relevant filing dates in one place. No checking across multiple government websites to know what is due next.' },
  { num: '05', title: 'Export when ready',  desc: 'Prepare ELSTER-ready exports for your accountant or for direct submission. No reformatting or manual data transfer.' },
]

const BEFORE_AFTER: { before: string; after: string }[] = [
  { before: 'Receipts collected in a folder until filing season',   after: 'Expenses captured when they happen'         },
  { before: 'Tax position discovered at year-end',                  after: 'Reserve visible every day'                 },
  { before: 'Quarterly deadlines tracked across a calendar',        after: 'All deadlines in one view'                 },
  { before: 'Accountant receives unorganized records',              after: 'ELSTER-ready export prepared in advance'   },
  { before: 'Unexpected cash flow pressure in spring',              after: 'Known financial position every month'      },
]

const TRUST_ITEMS = [
  { label: 'DSGVO compliant',               desc: 'Data handled in line with German privacy law. No third-party processing.' },
  { label: 'Hosted in Germany',             desc: 'Business financial data stays in Germany. No US cloud providers in the processing chain.' },
  { label: 'ELSTER-ready preparation',      desc: 'Exports prepared in the format German tax authorities expect — ready for direct submission or accountant handover.' },
  { label: 'Built for German requirements', desc: 'Quarterly and annual filing cycles, VAT tracking, and reserve calculations aligned to how German businesses actually operate.' },
]

const AFTER_YES = [
  { step: '01', title: 'Short conversation',  desc: 'We learn about your current process — what you track, what creates the most pressure, and where the gaps are.' },
  { step: '02', title: 'Review your workflow', desc: 'We map what a working setup looks like for your type of business before anything is configured.' },
  { step: '03', title: 'Configure around you', desc: 'TaxKontrol is set up to match how your business already operates — not a generic starting template.' },
  { step: '04', title: 'Start small',         desc: 'Begin with core tracking. Add reporting, deadline management and exports as the process becomes familiar.' },
]

const FAQ: { q: string; a: string }[] = [
  { q: 'Who is TaxKontrol built for?',
    a: 'Self-employed professionals, studio and salon operators, consultants, small clinics, and growing service businesses in Germany that do not have a dedicated accounting team.' },
  { q: 'Does this replace my accountant?',
    a: 'No — and it is not designed to. TaxKontrol organizes your financial position so that when you do work with an accountant, the process is faster and less expensive.' },
  { q: 'Where is my data stored?',
    a: 'On servers based in Germany. DSGVO compliant. No US cloud providers are involved in processing your business financial data.' },
  { q: 'What is the ELSTER export?',
    a: 'ELSTER is the German tax submission system. TaxKontrol prepares exports in the format ELSTER expects — reducing manual data transfer and reformatting.' },
  { q: 'How long does the initial setup take?',
    a: 'The connection step takes under two minutes. A working setup matched to your business workflow is configured during the onboarding conversation.' },
  { q: 'What does access cost?',
    a: 'Pricing is confirmed during the access conversation and depends on the size and type of business. No commitment is made before that conversation.' },
  { q: 'Can I start without moving my entire process?',
    a: 'Yes. Most businesses start with basic tracking and add more structured reporting and exports once the core workflow is running.' },
  { q: 'I already work with a Steuerberater. Does this still apply?',
    a: 'Yes. TaxKontrol reduces the preparation work before your Steuerberater engagement — organized records, cleaner exports, fewer back-and-forth requests, lower billable hours.' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function TaxKontrolPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem 5rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              FINANCIAL CLARITY FOR BUSINESSES IN GERMANY
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '720px' }}>
              Know where your business stands —<br />before tax season tells you.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              TaxKontrol helps businesses keep taxes, deadlines and reserves in view — without adding another complicated finance process to an already full day.
            </p>

            {/* CTA pair */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="#request-access"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}
              >
                Request access →
              </a>
              <a
                href="#how-it-works"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                See how it works →
              </a>
            </div>

            {/* Trust strip */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '2.5rem', paddingTop: '2rem', borderTop: `1px solid ${BORDER}` }}>
              {['DSGVO compliant', 'Hosted in Germany', 'ELSTER-ready preparation', 'Built for German businesses'].map(item => (
                <span key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  — {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── RECOGNIZABLE PRESSURE ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              SITUATIONS THAT HAPPEN TO MOST BUSINESSES
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              The pressure points that come with running a business in Germany.
            </h2>
            <div className="tk-grid-3">
              {PRESSURE_MOMENTS.map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '32px', borderTop: `3px solid ${NAVY}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT IT COSTS ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT LACK OF VISIBILITY COSTS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              These are preventable. Most businesses only realize that in hindsight.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: `1px solid ${BORDER}` }}>
              {WHAT_IT_COSTS.map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '32px', padding: '24px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: '160px', flexShrink: 0, paddingTop: '3px' }}>
                    {item.label}
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO THIS IS FOR ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHO THIS IS FOR
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              Built for businesses that operate without a finance team.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: BORDER }}>
              {WHO_FOR.map(item => (
                <div key={item.type} style={{ background: '#141414', padding: '24px 32px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#F0F0F0', fontWeight: 700, minWidth: '220px', flexShrink: 0 }}>
                    {item.type}
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>
                    {item.pain}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              HOW IT WORKS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Five steps. Works with the process you already have.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: `1px solid ${BORDER}` }}>
              {STEPS.map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '32px', padding: '28px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, minWidth: '32px', flexShrink: 0, paddingTop: '2px' }}>
                    {step.num}
                  </span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '6px' }}>
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

        {/* ── BEFORE / AFTER ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              BEFORE AND AFTER
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>
              What changes when the financial position is visible every day.
            </h2>
            <div style={{ background: BORDER, gap: '1px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '16px 28px', borderRight: `1px solid ${BORDER}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>BEFORE</p>
                </div>
                <div style={{ padding: '16px 28px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>AFTER</p>
                </div>
              </div>
              {BEFORE_AFTER.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                  <div style={{ padding: '18px 28px', borderRight: `1px solid ${BORDER}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#FF4D4D', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>✕</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{row.before}</p>
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

        {/* ── BUILT FOR GERMANY ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              BUILT FOR GERMANY
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              Structured for how businesses actually operate in Germany.
            </h2>
            <div className="tk-grid-2">
              {TRUST_ITEMS.map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 700 }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT HAPPENS NEXT ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT HAPPENS AFTER YOU REQUEST ACCESS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              Four steps. Starts with a short conversation — not a commitment.
            </h2>
            <div className="tk-grid-2">
              {AFTER_YES.map(item => (
                <div key={item.step} style={{ background: '#141414', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '48px', color: `${NAVY}40`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>
                    {item.step}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px' }}>
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

        {/* ── FAQ ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              COMMON QUESTIONS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>
              What most businesses ask before requesting access.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {FAQ.map((item, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                      padding: '20px 0', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#F0F0F0', lineHeight: 1.5 }}>
                      {item.q}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: ORANGE, flexShrink: 0 }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: '0 0 20px', maxWidth: '640px' }}>
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section id="request-access" style={{ background: CARD, padding: '6rem 2rem', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              REQUEST ACCESS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              Know where your business stands. Every day.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Tell us about your business. We will review your current workflow, configure TaxKontrol around how you already operate, and have you running within days.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: `1px solid ${BORDER}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {[
                'Short onboarding conversation — no commitment.',
                'Configured to your business workflow.',
                'Start with what creates the most pressure first.',
              ].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666', margin: '4px 0', letterSpacing: '0.05em' }}>
                  — {line}
                </p>
              ))}
            </div>
            <AccessRequestForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>
              // No commitment · We reply within 24 hours · DSGVO compliant
            </p>
          </div>
        </section>

        {/* ── NOT A TOOL ── */}
        <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT THIS IS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'A financial visibility system — not another finance app to configure yourself.',
                'Installed and configured to match your business — not a generic template.',
                'Built around real German business requirements — not repurposed international software.',
              ].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.6, margin: 0, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: ORANGE, flexShrink: 0 }}>→</span>{line}
                </p>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
