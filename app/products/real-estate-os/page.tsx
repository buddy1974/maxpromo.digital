'use client'

import { useState } from 'react'
import Link from 'next/link'

const STYLES = `
  .re-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .re-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .re-proof  { display: grid; grid-template-columns: 3fr 2fr; gap: 1px; background: #1A1A1A; }
  @media (max-width: 768px) {
    .re-grid-3 { grid-template-columns: 1fr; }
    .re-grid-2 { grid-template-columns: 1fr; }
    .re-steps { flex-direction: column; }
    .re-steps > div { border-right: none !important; }
    .re-proof  { grid-template-columns: 1fr; }
  }
`

interface RealEstateForm {
  name: string
  company: string
  email: string
  phone: string
}

function RealEstateContactForm() {
  const [form, setForm] = useState<RealEstateForm>({ name: '', company: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof RealEstateForm) {
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
          message: form.phone ? `Phone: ${form.phone}` : 'Real estate OS enquiry',
          automation: 'real-estate-os',
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
          onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
          onBlur={(e)  => (e.currentTarget.style.borderColor = '#1A1A1A')}
        />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: '#F97316', color: '#080808', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px', width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'GET MY FREE AUDIT →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', margin: 0 }}>✓ Request received. We&apos;ll contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at hello@maxpromo.digital</p>}
    </form>
  )
}

/* ─── PAGE DATA ───────────────────────────────────────────── */

const AFTER_STATE = [
  'Every lot visible from Sourcing to Completion — no spreadsheets',
  'Deal verdict in seconds — ROI, risk, yield, and recommendation',
  'Investors receive the right deals automatically — no manual sending',
  'Pipeline grows without adding headcount',
  'Leadership sees revenue, pipeline, and market data in one place',
]

const WHO_FOR = [
  'Property auction companies in the UK managing 20–200+ lots at any given time',
  'Currently tracking pipeline in spreadsheets, investor database in email folders',
  'Doing deal analysis manually — different spreadsheet for every lot, every time',
  'Running email campaigns without segmentation, tracking, or AI subject lines',
  'Looking to scale deal flow and investor communications without adding headcount',
]

const PROBLEMS = [
  { icon: '📊', text: 'Lots tracked in spreadsheets. Pipeline invisible. Deals fall through the gaps between sales calls.' },
  { icon: '📧', text: '2,000+ investor subscribers. Campaigns sent manually. No segmentation. No tracking. Leads go cold.' },
  { icon: '🧮', text: 'Deal analysis done in Excel. ROI, yield, SDLT — calculated separately for every single lot.' },
]

const FEATURES = [
  { icon: '[ PIPE ]',  name: 'Full Pipeline Visibility', desc: 'Every lot tracked from Sourcing to Completion on a Kanban board. One click to move stages. No spreadsheet, no email chains.' },
  { icon: '[ AI ]',    name: 'Know If a Deal Is Worth It In Seconds',                  desc: 'Full deal verdict instantly — ROI, risk, yield, after-refurb value, and recommendation. Up to 10x faster than manual analysis.' },
  { icon: '[ CRM ]',   name: 'Hot Leads Stay Hot — Automatically',                     desc: 'Every investor scored by activity, budget, and engagement. Cold leads warmed automatically. Pipeline grows without manual work.' },
  { icon: '[ CALC ]',  name: 'Instant Deal Calculations', desc: 'ROI, SDLT 2026, bridging loan, monthly cashflow, creative finance — calculated in real time. Not estimated, not approximated.' },
  { icon: '[ EMAIL ]', name: 'Send Deals To The Right Investors Automatically',         desc: 'AI writes the subject line. Segment by investor type. Track opens and clicks. Right deal, right investor, right time.' },
  { icon: '[ INTEL ]', name: 'All KPIs In One View',   desc: 'Revenue, pipeline, investor activity, and market data in one dashboard. Nothing split across three systems.' },
]

const STEPS = [
  { num: '01', title: 'Pipeline in view',                    desc: 'Every lot from sourcing to completion tracked on a Kanban board. No spreadsheet. No email chains.' },
  { num: '02', title: 'AI analyses every deal',              desc: 'Enter address and guide price. AI verdict in seconds — score, ROI, risks, and recommendation.' },
  { num: '03', title: 'Investors managed automatically',     desc: 'Campaigns fire to the right segments. Leads scored. Follow-ups triggered. Pipeline grows without manual work.' },
]

const FLOW = [
  { step: '01', label: 'Lot sourced and added → Pipeline updated instantly' },
  { step: '02', label: 'AI analyses the deal → Score, ROI, and risk in seconds' },
  { step: '03', label: 'Score, ROI, risk visible → No manual calculation' },
  { step: '04', label: 'Matching investors selected → Zero manual research' },
  { step: '05', label: 'Campaign sent automatically → No staff involvement' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function RealEstateOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#080808' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1.5rem' }}>
              ENTERPRISE SYSTEM · AI POWERED
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              RealEstateOS
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '600px', lineHeight: 1.8 }}>
              Complete operating system for property auction companies — built from a live UK auction deployment.
              Lot pipeline, AI deal analysis, investor CRM, financial calculators, and campaign studio, all connected.
              Configured for your brand and investor database. Available to selected operators.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Built from real deployment logic', 'Handles real-world edge cases', 'Designed for production environments', 'No prototype logic'].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.08em', margin: 0, opacity: 0.85 }}>
                  <span style={{ marginRight: '8px', opacity: 0.5 }}>•</span>{line}
                </p>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <Link href="/contact?system=real-estate-os"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080808', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
              >
                Explore System →
              </Link>
              <Link href="/contact?system=real-estate-os"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: '1px solid #1A1A1A', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333333')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1A1A1A')}
              >
                Request Similar System →
              </Link>
            </div>
          </div>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '2rem' }}>BEFORE / AFTER THIS SYSTEM</p>
            <div style={{ display: 'grid', gap: '1px', background: '#1A1A1A' }} className="re-grid-2">
              <div style={{ background: '#141414', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>BEFORE</p>
                {['Lots tracked in spreadsheets', 'Deal analysis done manually in Excel', 'Campaigns sent without segmentation or tracking', 'Investor database in email folders', 'No real-time view of pipeline or revenue'].map(item => (
                  <p key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 8px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#FF4D4D', flexShrink: 0 }}>✕</span>{item}
                  </p>
                ))}
              </div>
              <div style={{ background: '#141414', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>AFTER</p>
                {['Pipeline visible from sourcing to completion', 'AI deal verdict in seconds — no calculation', 'Right investors matched and contacted automatically', 'Zero manual sending or follow-up', 'All KPIs, revenue, and pipeline in one dashboard'].map(item => (
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
              Built for property auction operators.
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
              What your auction business looks like on week two.
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
              → No manual input required · Running in live production deployments · Zero missed deals
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
              How auction businesses operate without it
            </h2>
            <div className="re-grid-3">
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
              8 modules. Your entire auction operation.
            </h2>
            <div className="re-grid-2">
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>WHAT THIS SYSTEM REPLACES</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Every lot. Every deal. Every investor. One platform.
            </h2>
            <div style={{ borderTop: '1px solid #1A1A1A', display: 'flex', flexDirection: 'row' }} className="re-steps">
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
              Lot sourced. Deal scored by AI. Investors notified. Zero manual steps.
            </h2>
            <div className="re-proof">
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#141414', border: '1px dashed #2A2A2A', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2A2A2A', margin: 0 }}>[ DASHBOARD SCREENSHOT ]</p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#444444', margin: 0, lineHeight: 1.6 }}>
                  Lot pipeline — every deal from sourcing to completion with AI verdict and financial calculations attached.
                </p>
              </div>
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                {[
                  { label: 'AI score', text: 'Deal score, ROI, risk level, and recommendation visible per lot in one click.' },
                  { label: 'Investor match', text: 'Matching investors shown per deal. Campaign sent directly from the lot record.' },
                  { label: 'Financial calc', text: 'SDLT, yield, cashflow, and bridging finance calculated inline — not on a spreadsheet.' },
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>FROM SOURCE TO SIGNED DEAL — NO MANUAL STEPS</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
              Failed API calls retried automatically · Payment errors handled server-side · Error states managed without staff input
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              From lot sourcing to investor campaign — fully automated.
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
              Built and delivered for a London property auction company · Live since 2026
            </p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', background: '#F97316', color: '#080808', padding: '4px 10px', fontWeight: 700 }}>
              ENTERPRISE · DEPLOYED
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
              Get a free RealEstateOS audit for your auction business.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Tell us about your lot pipeline and investor database. We run a free audit, show you exactly how RealEstateOS maps to your operation, and send a no-obligation proposal. No commitment. We reply within 24 hours.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#0F0F0F', border: '1px solid #1A1A1A', padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Free system audit — no charge.', 'Live in 5–10 days from sign-off.', 'No commitment until you are ready.'].map((line) => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666', margin: '4px 0', letterSpacing: '0.05em' }}>
                  — {line}
                </p>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: '1px solid rgba(249,115,22,0.2)', padding: '16px 24px', maxWidth: '400px', display: 'inline-block' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', margin: '0 0 6px' }}>AVAILABILITY</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>
                We onboard a limited number of clients per month.<br />Next available slot: <span style={{ color: '#F0F0F0', fontWeight: 600 }}>May 2026</span>
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F0F0F0', letterSpacing: '0.05em', marginTop: '2.5rem', marginBottom: '8px' }}>
              We only install a limited number of systems per month.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', letterSpacing: '0.05em', marginBottom: '0' }}>
              We install this system for you.
            </p>
            <RealEstateContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#555', letterSpacing: '0.08em', margin: '12px 0 0' }}>
              // No obligation · Free system audit · We reply within 24 hours
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
