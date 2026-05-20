'use client'

import { useState } from 'react'
import Image from 'next/image'

const AMBER  = '#F59E0B'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .re-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .re-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .re-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .re-grid-2 { grid-template-columns: 1fr; }
    .re-flow   { flex-direction: column; }
    .re-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

interface RealEstateForm { name: string; company: string; email: string; phone: string }

function RealEstateContactForm() {
  const [form, setForm] = useState<RealEstateForm>({ name: '', company: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof RealEstateForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('loading')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, organisation: form.company,
          message: form.phone ? `Phone: ${form.phone}` : 'Real estate OS enquiry', automation: 'real-estate-os' }) })
      if (!res.ok) throw new Error('failed'); setStatus('success')
    } catch { setStatus('error') }
  }

  const inp: React.CSSProperties = { background: '#0A0A0A', border: `1px solid ${BORDER}`, color: '#F0F0F0', padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px', width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease' }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {([
        { field: 'name',    type: 'text',  label: 'Your name',        required: true  },
        { field: 'company', type: 'text',  label: 'Company name',     required: true  },
        { field: 'email',   type: 'email', label: 'Email address',    required: true  },
        { field: 'phone',   type: 'tel',   label: 'Phone (optional)', required: false },
      ] as const).map(({ field, type, label, required }) => (
        <input key={field} name={field} type={type} placeholder={label} required={required}
          value={form[field]} onChange={update(field)} style={inp}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: ORANGE, color: BG, fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px', width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Request received' : 'Request walkthrough →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>We will contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at info@maxpromo.digital</p>}
    </form>
  )
}

export default function RealEstateOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="re-hero">
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>PROPERTY OPERATIONS SYSTEM</p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              A property opportunity arrives.<br />The decision window is 48 hours.<br />Everything still lives in spreadsheets.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              RealEstateOS keeps deal analysis, investor relationships and campaign activity connected in one operational view — without replacing the way your team already evaluates opportunities.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {['AI deal analysis with score and ROI', 'Investor CRM with lead scoring', 'Pipeline from opportunity to decision', 'Campaign studio with AI subject lines'].map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
              onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>Request walkthrough →</a>
          </div>
          <div>
            <Image
              src="/images/systems/real-estate-os/card/real-estate-os-en.png"
              alt="Property analyst reviewing deal — investment analysis at an auction desk"
              width={760}
              height={400}
              style={{ width: '100%', height: 'auto', borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}
              priority
            />
          </div>
          </div>
        </section>

        {/* 2. THIS KEEPS HAPPENING */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>THIS KEEPS HAPPENING</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>The same gaps in every deal cycle.</h2>
            <div className="re-grid-2">
              {[
                { label: 'THE SPREADSHEET ANALYSIS', text: "Property arrives. Analysis starts in Excel. Comparable data entered manually. ROI calculated in a formula that was built two years ago and has not been checked since." },
                { label: 'THE LOST INVESTOR', text: "Investor showed interest in a previous deal. Follow-up was noted somewhere — an email thread, a cell in a spreadsheet, a sticky note. The next relevant property goes to market. They are not contacted in time." },
                { label: 'THE EMAIL THREAD', text: "Deal decision happens across fourteen reply-all emails. Three people have different versions of the analysis. The final number used in the bid came from an email sent on Thursday that two people never opened." },
                { label: 'THE CAMPAIGN', text: "Investor campaign launched. Subject line written quickly. Open rate not tracked. Reply rate not tracked. Which investors engaged with which properties — unknown." },
              ].map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${AMBER}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW A DEAL MOVES RIGHT NOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>Every manual step in the deal cycle is a place where a decision can be delayed or an investor missed.</h2>
            <div className="re-flow">
              {[
                { step: '01', label: 'Property arrives',  note: 'Opportunity window opens' },
                { step: '02', label: 'Excel analysis',    note: 'Manual data entry' },
                { step: '03', label: 'Email chain',       note: 'Multiple versions in thread' },
                { step: '04', label: 'Investor contact',  note: 'From memory or old notes' },
                { step: '05', label: 'Bid or pass',       note: 'Decision made in email' },
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
                  Property arrives. AI analysis delivered in minutes. Investor matched automatically.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  Deal enters the system. AI produces the score, ROI projection and comparable analysis. Relevant investors matched from the CRM. Follow-up scheduled automatically. Campaign studio handles the outreach — with AI-generated subject lines and tracked results.
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${AMBER}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>WHAT THE SYSTEM DOES</p>
                {['AI deal analysis — score, ROI, comparable data in minutes', 'Investor CRM — lead scoring, interest history, automatic matching', 'Pipeline view — every deal from property to decision', 'Campaign studio — AI subject lines, open rate tracking, reply tracking', 'Follow-up automation — no investor missed between deals'].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: AMBER, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW A DEAL MOVES</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>From property to decision — without the email chain.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {[
                { num: '01', title: 'Property enters the system', desc: 'Details added. AI analysis begins immediately — comparable transactions, ROI projection, deal score. No manual spreadsheet required.' },
                { num: '02', title: 'Analysis delivered',          desc: 'Score, ROI range and key risk factors delivered in minutes. Decision-ready information in one view, not across fourteen emails.' },
                { num: '03', title: 'Investors matched',           desc: 'System identifies relevant investors from the CRM based on historical interest, investment profile and deal criteria.' },
                { num: '04', title: 'Campaign sent',               desc: 'Campaign goes to matched investors. Subject line AI-generated. Open rate and reply rate tracked per campaign.' },
                { num: '05', title: 'Decision made',               desc: 'Bid or pass recorded in the system. Deal outcome tracked. Investor interest updated for the next relevant property.' },
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

            <div style={{ marginTop: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', marginBottom: '1rem' }}>THE SYSTEM IN OPERATION</p>
              <Image
                src="/images/systems/real-estate-os/card/real-estate-os-de.png"
                alt="RealEstateOS in operation — AI deal analysis, investor CRM and pipeline view"
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #1A1A1A', display: 'block' }}
              />
            </div>
          </div>
        </section>

        {/* 6. WHAT CHANGED */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>WHAT CHANGED AFTER INSTALLATION</p>
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>BEFORE</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>AFTER</p></div>
              </div>
              {[
                { before: 'Deal analysis built in Excel manually',       after: 'AI analysis delivered in minutes'               },
                { before: 'Investor interest tracked in email threads',  after: 'Investor CRM — interest and history in one view' },
                { before: 'Campaign subject lines written quickly',      after: 'AI-generated subject lines, open rates tracked'  },
                { before: 'Follow-up from memory between deals',         after: 'Automatic follow-up — no investor missed'        },
                { before: 'Deal pipeline visible only to deal lead',     after: 'Pipeline view shared across the team'            },
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

        {/* 7–8. PROOF + NEXT */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div className="re-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${AMBER}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>A real property workflow — from deal entry to investor campaign.</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>The walkthrough covers AI deal analysis, investor CRM navigation, pipeline view, campaign studio and follow-up automation. The system working for a real property auction operation.</p>
              </div>
              <div style={{ background: CARD, padding: '40px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>WHAT HAPPENS NEXT</p>
                {[
                  { num: '01', t: 'Short conversation',   d: 'We learn about the business — deal volume, investor base, current analysis and outreach process.' },
                  { num: '02', t: 'Workflow reviewed',    d: 'We map how deals currently move from property to decision before configuring anything.' },
                  { num: '03', t: 'System configured',    d: 'RealEstateOS set up for the specific operation — deal scoring criteria, investor CRM import, campaign templates.' },
                  { num: '04', t: 'Start with one cycle', d: 'Begin with deal analysis. Add investor matching and campaigns as the team builds confidence in the system.' },
                ].map(item => (
                  <div key={item.num} style={{ marginBottom: '20px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, margin: '0 0 4px', letterSpacing: '0.1em' }}>{item.num}</p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px', color: '#F0F0F0', margin: '0 0 4px' }}>{item.t}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 9. CTA */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>REQUEST A WALKTHROUGH</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>See RealEstateOS working for your deal flow.</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>Tell us about the operation. We walk through the live system and show how RealEstateOS fits the way your team evaluates deals and manages investor relationships.</p>
            <RealEstateContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>// No commitment · Reply within 24 hours · System operational for UK property auction companies</p>
          </div>
        </section>

      </main>
    </>
  )
}
