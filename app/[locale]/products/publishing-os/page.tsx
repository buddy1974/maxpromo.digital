'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Reveal } from '@/components/ui/Reveal'

const PURPLE = '#A78BFA'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .pb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .pb-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .pb-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .pb-grid-2 { grid-template-columns: 1fr; }
    .pb-flow   { flex-direction: column; }
    .pb-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

interface PublishingForm { name: string; company: string; email: string; phone: string }

function PublishingContactForm() {
  const [form, setForm] = useState<PublishingForm>({ name: '', company: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof PublishingForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('loading')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, organisation: form.company,
          message: form.phone ? `Phone: ${form.phone}` : 'PublishingOS enquiry', automation: 'publishing-os' }) })
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
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Request received' : 'Schedule walkthrough →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>We will contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at info@maxpromo.digital</p>}
    </form>
  )
}

export default function PublishingOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="pb-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>PUBLISHING OPERATIONS SYSTEM</p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              A manuscript arrives.<br />Five systems later:<br />still no complete picture.
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              PublishingOS keeps orders, manuscripts, stock, royalties and distribution connected in one operational view — without replacing the editorial process that already works.
            </p>
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {['Orders and invoices in one flow', 'Manuscripts tracked through production stages', 'Royalties calculated automatically at period end', '8 AI agents running overnight'].map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
              onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>Schedule walkthrough →</a>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src="/images/systems/publishing-os/card/publishing-os-en.png"
              alt="Publishing editorial workflow — manuscripts, production tracking and distribution"
              width={760}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
          </div>
        </section>

        {/* 2. THIS KEEPS HAPPENING */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>THIS KEEPS HAPPENING</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>The same operational gaps. Every season.</h2>
            <div className="pb-grid-2">
              {[
                { label: 'THE SPREADSHEET ROYALTY', text: "Royalty period ends. Calculations begin in Excel — sales figures from one source, rights terms from another, deductions from a third. Author receives the statement two months after the period closes." },
                { label: 'THE MANUSCRIPT VERSION', text: "Manuscript goes to three editors. Each works in their own copy. Changes tracked in comments. The final version assembled by email. Version history exists in seven different files." },
                { label: 'THE STOCK GAP', text: "Order arrives. Invoice raised in one system. Stock updated in another — at the end of the day, or the end of the week. Stock level visible to the team is always slightly behind the actual stock level." },
                { label: 'THE DISTRIBUTION CHAIN', text: "Book is ready. Distribution requires data in a format that no current system exports directly. Someone reformats the file. Someone else checks the reformat. Distribution delayed by three days." },
              ].map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${PURPLE}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW PUBLISHING OPERATIONS MOVE RIGHT NOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>Every system boundary is a place where data must be re-entered or re-formatted.</h2>
            <div className="pb-flow">
              {[
                { step: '01', label: 'Order arrives',      note: 'Logged in system one' },
                { step: '02', label: 'Invoice raised',     note: 'In system two' },
                { step: '03', label: 'Stock updated',      note: 'System three, end of day' },
                { step: '04', label: 'Manuscript tracked', note: 'Spreadsheet, separate' },
                { step: '05', label: 'Royalty calculated', note: 'Excel, end of period' },
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
                  Orders, manuscripts, stock, royalties and distribution — connected in one system.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  Order arrives. Invoice generated automatically. Stock updated immediately. Manuscript tracked through production stages. Royalties calculated at period end — not assembled manually. Eight AI agents run overnight handling data processing, distribution updates and communications.
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${PURPLE}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>WHAT CONNECTS</p>
                {['Orders — invoice and stock updated automatically on receipt', 'Manuscripts — production stages tracked in one view', 'Stock — live, not updated at end of day', 'Royalties — calculated at period end, no manual Excel', 'Distribution — formatted and sent without reformatting', '8 AI agents — overnight processing, updates and communications'].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: PURPLE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW PUBLISHING OPERATIONS MOVE</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>From order receipt to royalty statement — in one system.</h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {[
                { num: '01', title: 'Order received',         desc: 'Order enters the system. Invoice generated automatically. Stock level updated immediately — not at end of day.' },
                { num: '02', title: 'Manuscript in production', desc: 'Manuscript tracked through editorial, design and production stages. All versions in one place. No email-based version control.' },
                { num: '03', title: 'Distribution prepared',   desc: 'Distribution data formatted automatically when the title is ready. No manual reformatting required for distribution partners.' },
                { num: '04', title: 'Royalty period closes',   desc: 'Sales figures compiled automatically. Royalties calculated against the rights terms already in the system. Statement generated — no Excel required.' },
                { num: '05', title: 'AI agents overnight',     desc: 'Eight agents run overnight — updating stock positions, processing distribution confirmations, sending communications and preparing reports for the next day.' },
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '32px', padding: '28px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, minWidth: '32px', flexShrink: 0, paddingTop: '2px' }}>{step.num}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal delay={200} style={{ marginTop: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', marginBottom: '1rem' }}>THE SYSTEM IN OPERATION</p>
              <Image
                src="/images/systems/publishing-os/card/publishing-os-de.png"
                alt="PublishingOS in operation — orders, manuscripts, royalties and distribution connected"
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #1A1A1A', display: 'block' }}
              />
            </Reveal>
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
                { before: 'Orders logged in one system, invoiced in another',    after: 'Order and invoice in one step — automated'           },
                { before: 'Stock updated at end of day from a separate system',  after: 'Stock live — updated immediately on order receipt'   },
                { before: 'Royalties calculated in Excel at period end',         after: 'Royalties calculated automatically when period closes' },
                { before: 'Manuscripts tracked across email versions',           after: 'Production stages visible in one view'               },
                { before: 'Distribution data reformatted manually each time',   after: 'Distribution formatted automatically — no manual step' },
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
            <div className="pb-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${PURPLE}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>A real publishing workflow — from order to royalty statement.</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>The walkthrough covers order management, manuscript production tracking, stock visibility, royalty calculation and the overnight AI agent view. The full system — not a feature list.</p>
              </div>
              <div style={{ background: CARD, padding: '40px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>WHAT HAPPENS NEXT</p>
                {[
                  { num: '01', t: 'Short conversation',    d: 'We learn about the company — catalogue size, team structure, current systems and the biggest operational gaps.' },
                  { num: '02', t: 'Workflow reviewed',     d: 'We map how orders, manuscripts, royalties and distribution currently move before configuring anything.' },
                  { num: '03', t: 'System configured',     d: 'PublishingOS set up for the specific catalogue and rights structure — royalty terms, distribution partners, production stages.' },
                  { num: '04', t: 'Start with orders',     d: 'Begin with order and invoice flow. Add manuscripts, stock and royalties as the team builds confidence in the system.' },
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>SCHEDULE A WALKTHROUGH</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>See PublishingOS working for your operation.</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>Tell us about the company. We walk through the live system and show how PublishingOS fits the way your team manages orders, production and author relationships.</p>
            <PublishingContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>// No commitment · Reply within 24 hours · System operational for publishing companies</p>
          </div>
        </section>

      </main>
    </>
  )
}
