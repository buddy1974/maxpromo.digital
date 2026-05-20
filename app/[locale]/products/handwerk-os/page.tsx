'use client'

import { useState } from 'react'

/* ─── TOKENS ──────────────────────────────────────────────── */
const GREEN  = '#22C55E'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .hw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .hw-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  @media (max-width: 768px) {
    .hw-grid-2 { grid-template-columns: 1fr; }
    .hw-flow   { flex-direction: column; }
  }
`

/* ─── FORM ────────────────────────────────────────────────── */

interface HandwerkForm { name: string; business: string; trade: string; email: string; phone: string }

function HandwerkContactForm() {
  const [form, setForm] = useState<HandwerkForm>({ name: '', business: '', trade: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof HandwerkForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('loading')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, organisation: form.business,
          message: `Trade: ${form.trade}${form.phone ? `\nPhone: ${form.phone}` : ''}`, automation: 'handwerk-os' }) })
      if (!res.ok) throw new Error('failed'); setStatus('success')
    } catch { setStatus('error') }
  }

  const inp: React.CSSProperties = { background: '#0A0A0A', border: `1px solid ${BORDER}`, color: '#F0F0F0', padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px', width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease' }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {([
        { field: 'name',     type: 'text',  label: 'Your name',        required: true  },
        { field: 'business', type: 'text',  label: 'Business name',    required: true  },
        { field: 'trade',    type: 'text',  label: 'Trade or sector',  required: true  },
        { field: 'email',    type: 'email', label: 'Email address',    required: true  },
        { field: 'phone',    type: 'tel',   label: 'Phone (optional)', required: false },
      ] as const).map(({ field, type, label, required }) => (
        <input key={field} name={field} type={type} placeholder={label} required={required}
          value={form[field]} onChange={update(field)} style={inp}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: ORANGE, color: BG, fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px', width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Request received' : 'Schedule walkthrough →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>We will contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at info@maxpromo.digital</p>}
    </form>
  )
}

/* ─── PAGE ────────────────────────────────────────────────── */

export default function HandwerkOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>FIELD OPERATIONS SYSTEM</p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              Stop re-entering paperwork<br />after every site visit.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              HandwerkOS keeps jobs, quotes, time tracking and invoices connected from the first site visit to the paid invoice — without changing how the team already works on site.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {['Photo to job record in 10 seconds', 'Quotes generated with market rates', 'GPS time tracking from check-in', 'XRechnung XML on every invoice'].map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>Schedule walkthrough →</a>
              <a href="https://handwerkos.vercel.app" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>See the system in action →</a>
            </div>
          </div>
        </section>

        {/* 2. THIS KEEPS HAPPENING */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>THIS KEEPS HAPPENING</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>The same friction. After every job.</h2>
            <div className="hw-grid-2">
              {[
                { label: 'DOUBLE ENTRY', text: "Job is done on site. Notes written on paper. Back at the office, the same information is typed into the system — if the paper can still be read, and if there is time before the next job." },
                { label: 'THE QUOTE DELAY', text: "Customer wants a quote. Price comes from memory or a rate card that lives in a folder somewhere. Quote is sent three days later. The customer has already called someone else." },
                { label: 'TIME NOT TRACKED', text: "Technician is on site for four hours. Time is not formally recorded. Invoice is estimated at the end of the month. Estimate is usually conservative. That is the margin that disappears." },
                { label: 'XRECHNUNG BY HAND', text: "Invoice is ready. Public sector client needs XRechnung XML. Someone opens the documentation again. The XML is built manually. An hour of administration for a standard deliverable." },
              ].map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${GREEN}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. OPERATIONAL CHAOS */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW A JOB MOVES RIGHT NOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>Every re-entry is a place where time is spent and information can change.</h2>
            <div className="hw-flow">
              {[
                { step: '01', label: 'Site visit', note: 'Paper job sheet filled' },
                { step: '02', label: 'Office entry', note: 'Same data typed again' },
                { step: '03', label: 'Quote request', note: 'Pricing from memory' },
                { step: '04', label: 'Dispatch', note: 'No GPS tracking active' },
                { step: '05', label: 'Invoice', note: 'XRechnung built manually' },
              ].map(item => (
                <div key={item.step} style={{ background: '#141414', padding: '28px 24px', flex: 1, minWidth: '140px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, margin: '0 0 8px', letterSpacing: '0.1em' }}>{item.step}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F0F0F0', margin: '0 0 6px', lineHeight: 1.4, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', margin: 0, letterSpacing: '0.05em' }}>{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. SYSTEM INSTALLED */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>SYSTEM INSTALLED</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                  You photograph the job sheet. Ten seconds later, the record exists.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  AI reads the job sheet image and creates the full record — client, scope, notes, location. Quote is generated from current market rates. PDF sent to the client directly. Technician dispatched. GPS check-in starts time tracking.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginTop: '1rem' }}>
                  When the job is accepted, one click converts the quote to an invoice. XRechnung XML attached automatically.
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>WHAT RUNS AUTOMATICALLY</p>
                {['Job record from photo — in under 10 seconds', 'Quote at market rates — generated and sent', 'GPS time tracking — from check-in to check-out', 'Invoice from accepted quote — one click', 'XRechnung XML — attached automatically'].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: GREEN, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. WORKFLOW */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW A JOB MOVES</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>From the site photograph to the paid invoice.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {[
                { num: '01', title: 'Photograph the job sheet', desc: 'Taken on site with any phone. AI creates the full job record — client, scope, site details — in under 10 seconds. No manual entry.' },
                { num: '02', title: 'Quote generated',         desc: 'Market-rate pricing suggested automatically. Quote formatted and sent as a PDF to the client directly from the system.' },
                { num: '03', title: 'Technician dispatched',   desc: 'Job assigned to the right team member. GPS check-in starts time tracking when they arrive on site.' },
                { num: '04', title: 'Invoice created',         desc: 'Accepted quote converts to invoice with one click. XRechnung XML generated and attached automatically for compliance.' },
                { num: '05', title: 'Payment tracked',         desc: 'Invoice sent. Follow-up triggered automatically if payment is overdue. Status visible without checking email.' },
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '32px', padding: '28px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, minWidth: '32px', flexShrink: 0, paddingTop: '2px' }}>{step.num}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. WHAT CHANGED */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>WHAT CHANGED AFTER INSTALLATION</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>The work on site does not change. Everything around it does.</h2>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>BEFORE</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>AFTER</p></div>
              </div>
              {[
                { before: 'Paper job sheet → office re-entry',         after: 'Photo → record created in 10 seconds'         },
                { before: 'Quote from memory, sent days later',        after: 'Quote from market rates, sent immediately'    },
                { before: 'Time estimated at month-end',               after: 'GPS-tracked from check-in to check-out'       },
                { before: 'Invoice built manually per job',            after: 'One click from accepted quote'                },
                { before: 'XRechnung XML built by hand each time',    after: 'XRechnung generated automatically on invoice' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                  <div style={{ padding: '18px 28px', borderRight: `1px solid ${BORDER}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#444', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>✕</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.6 }}>{row.before}</p>
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

        {/* 7. PROOF */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>SEE THE SYSTEM WORKING</p>
            <div className="hw-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${GREEN}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>A real job workflow. From the photograph to the invoice.</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>The walkthrough covers a live session — job sheet photo, AI record creation, quote generation, technician dispatch, GPS tracking, and invoice with XRechnung. The system working, not a feature list.</p>
              </div>
              <div style={{ background: CARD, padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>WHAT THE WALKTHROUGH COVERS</p>
                {['Photo to job record — live demonstration', 'Quote generation at market rates', 'GPS dispatch and time tracking flow', 'One-click invoice with XRechnung XML', 'Payment tracking and follow-up'].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. WHAT HAPPENS NEXT */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>WHAT HAPPENS NEXT</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>From the first conversation to jobs running through the system.</h2>
            <div className="hw-grid-2">
              {[
                { num: '01', title: 'Short conversation',   desc: 'We learn about the business — trade type, team size, current job flow, and where the most time is lost.' },
                { num: '02', title: 'Workflow reviewed',    desc: 'We look at how jobs currently move from site to invoice and configure the system around the existing process.' },
                { num: '03', title: 'System configured',    desc: 'HandwerkOS set up for the specific trade — job templates, quote pricing, dispatch flow, invoice format.' },
                { num: '04', title: 'Start with one trade', desc: 'Begin with the job type that creates the most administration. Expand across the business as the team gets comfortable.' },
              ].map(item => (
                <div key={item.num} style={{ background: '#141414', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '40px', color: `${ORANGE}25`, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>{item.num}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. CTA */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>SCHEDULE A WALKTHROUGH</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>See the system working for your trade.</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>Tell us about the business and how jobs currently move through the team. We walk through the live system and show how HandwerkOS fits the way your operation already runs.</p>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: `1px solid ${BORDER}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Short conversation first — no commitment.', 'Configured to your trade and workflow.', 'Start with one job type. Expand when ready.'].map(l => (
                <p key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666', margin: '4px 0', letterSpacing: '0.05em' }}>— {l}</p>
              ))}
            </div>
            <HandwerkContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>// No commitment · Reply within 24 hours · Live demo available on request</p>
          </div>
        </section>

      </main>
    </>
  )
}
