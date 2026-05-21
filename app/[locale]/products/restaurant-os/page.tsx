'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Reveal } from '@/components/ui/Reveal'

/* ─── TOKENS ──────────────────────────────────────────────── */
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .ro-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .ro-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${BORDER}; }
  .ro-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .ro-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .ro-grid-2, .ro-grid-3 { grid-template-columns: 1fr; }
    .ro-flow   { flex-direction: column; }
    .ro-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

/* ─── FORM ────────────────────────────────────────────────── */

interface RestaurantForm {
  name: string; restaurant: string; tables: string; email: string; phone: string
}

function RestaurantContactForm() {
  const [form, setForm] = useState<RestaurantForm>({ name: '', restaurant: '', tables: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof RestaurantForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, organisation: form.restaurant,
          message: `Tables: ${form.tables}${form.phone ? `\nPhone: ${form.phone}` : ''}`,
          automation: 'restaurant-os',
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch { setStatus('error') }
  }

  const input: React.CSSProperties = {
    background: '#0A0A0A', border: `1px solid ${BORDER}`, color: '#F0F0F0',
    padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px',
    width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease',
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {([
        { field: 'name',       type: 'text',  label: 'Your name',        required: true  },
        { field: 'restaurant', type: 'text',  label: 'Restaurant name',  required: true  },
        { field: 'tables',     type: 'text',  label: 'Number of tables', required: true  },
        { field: 'email',      type: 'email', label: 'Email address',    required: true  },
        { field: 'phone',      type: 'tel',   label: 'Phone (optional)', required: false },
      ] as const).map(({ field, type, label, required }) => (
        <input key={field} name={field} type={type} placeholder={label} required={required}
          value={form[field]} onChange={update(field)} style={input}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: ORANGE, color: BG, fontFamily: 'var(--font-mono)', fontSize: '11px',
          textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px',
          width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Request received' : 'Schedule walkthrough →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>We will contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at info@maxpromo.digital</p>}
    </form>
  )
}

/* ─── PAGE ────────────────────────────────────────────────── */

export default function RestaurantOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* ── 1. HERO WORLD ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="ro-hero">
          <div>
            <p className="mp-hero-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              RESTAURANT OPERATIONS SYSTEM
            </p>
            <h1 className="mp-hero-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              Stop losing orders between calls,<br />paper notes and WhatsApp.
            </h1>
            <p className="mp-hero-3" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              RestaurantOS keeps reservations, orders and daily service moving in one operational flow — without changing how your team already works.
            </p>

            {/* Proof */}
            <div className="mp-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {['Reservations visible to the whole team', 'Orders go directly to the kitchen', 'Bills split automatically in any mode', 'No app required for guests'].map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>
                  → {p}
                </span>
              ))}
            </div>

            <div className="mp-hero-5" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>
                Schedule walkthrough →
              </a>
              <a href="https://restaurant-os-one.vercel.app/demo" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
                See the system in action →
              </a>
            </div>
          </div>
          <div className="mp-img-wrap mp-hero-2" style={{ borderRadius: '16px', border: '1px solid #1A1A1A', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}>
            <Image
              src="/images/systems/restaurant-os/card/restaurant-os-en.png"
              alt="Restaurant service in operation — orders moving from table to kitchen"
              width={760}
              height={400}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
          </div>
        </section>

        {/* ── 2. THIS KEEPS HAPPENING ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              THIS KEEPS HAPPENING
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              The same situations. Every service.
            </h2>
            <div className="ro-grid-2">
              {[
                {
                  label: 'THE RESERVATION',
                  text:  'A reservation was written in the notebook. The page was turned. Tonight someone arrives for a table that no longer appears in the record. The team apologises. The guest remembers.',
                },
                {
                  label: 'THE WHATSAPP ORDER',
                  text:  'A table sends their order via message. It arrives during a rush. By the time it is read, three more messages have come in on top of it. The kitchen receives one of the orders. The rest wait.',
                },
                {
                  label: 'THE KITCHEN RELAY',
                  text:  'A waiter calls the order across to the pass. The information is correct when it leaves. It arrives different. A dish goes out that no one ordered. The correct one follows ten minutes later.',
                },
                {
                  label: 'END OF THE NIGHT',
                  text:  'Eight guests. Four want to pay separately. Two split one course. One needs a receipt for work. The waiter works through it with a phone calculator while the next table waits to order.',
                },
              ].map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${ORANGE}` }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>{item.label}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. OPERATIONAL CHAOS ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              HOW ORDERS MOVE RIGHT NOW
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              Every step between the guest and the kitchen is a place where something goes wrong.
            </h2>
            <div className="ro-flow">
              {[
                { step: '01', label: 'Guest requests',     note: 'Call, walk-in, or message' },
                { step: '02', label: 'Paper record',       note: 'Notebook or verbal note'  },
                { step: '03', label: 'Staff relay',        note: 'Information moves by voice' },
                { step: '04', label: 'Kitchen receives',   note: 'Interpretation required'  },
                { step: '05', label: 'Error or delay',     note: 'Correction costs service'  },
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

        {/* ── 4. SYSTEM INSTALLED ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>
              SYSTEM INSTALLED
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                  RestaurantOS connects the request to the kitchen. The chain runs without a relay.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  Guests scan a QR code at the table. No app install. No staff member taking the order. The order goes directly to the kitchen the moment it is placed. Bills split in seconds — by seat, by item, by share, or all at once.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8, marginTop: '1rem' }}>
                  Reservations visible to every team member. Kitchen notified per order. No relay. No interpretation gap.
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${ORANGE}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>WHAT CONNECTS</p>
                {[
                  'Guest to kitchen — no verbal relay required',
                  'Reservation to table — visible to the whole team',
                  'Order to bill — tracked per seat from the start',
                  'Payment to receipt — any split mode, instantly',
                ].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.65 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. WORKFLOW ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              HOW A SERVICE RUNS
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              From the first scan to the settled bill.
            </h2>
            <Reveal style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {[
                { num: '01', title: 'Guest scans the table QR',     desc: 'Opens the full menu in the browser. No app install. No account. Works on every phone. The table session begins.' },
                { num: '02', title: 'Seat identity assigned',         desc: 'A fruit name — APPLE, KIWI, ORANGE — ties the guest to their seat for the full visit. The team knows who is where without any coordination.' },
                { num: '03', title: 'Order placed from the phone',   desc: 'Guest browses, selects, confirms. The order goes directly to the kitchen the moment it is submitted. No waiter involvement required.' },
                { num: '04', title: 'Kitchen notified instantly',    desc: 'A notification arrives per order — table, seat, items, any modifications. No relay. No voice call. No WhatsApp message.' },
                { num: '05', title: 'Bill settled in any mode',      desc: 'Solo, full table, equal split, or by selected seats. All four modes are built in. The waiter is not involved in the calculation.' },
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

            {/* ── SYSTEM IN ACTION ── */}
            <Reveal delay={200} style={{ marginTop: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#444', marginBottom: '1rem' }}>
                THE SYSTEM IN OPERATION
              </p>
              <Image
                src="/images/systems/restaurant-os/card/restaurant-os-de.png"
                alt="RestaurantOS live — order flow from guest scan to kitchen notification"
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #1A1A1A', display: 'block' }}
              />
            </Reveal>
          </div>
        </section>

        {/* ── 6. WHAT CHANGED ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT CHANGED AFTER INSTALLATION
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2rem' }}>
              The team works the same way. The flow behind it does not.
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
              {[
                { before: 'Orders relayed by voice or paper',            after: 'Orders go directly from guest to kitchen'      },
                { before: 'Reservations in a notebook — sometimes lost', after: 'Reservations visible to every team member'    },
                { before: 'Bill splits calculated by hand',              after: 'Bills settled in any mode — instantly'        },
                { before: 'Kitchen notified by call or WhatsApp',        after: 'Kitchen notified per order — automatically'  },
                { before: 'Order errors corrected at the table',         after: 'Order errors eliminated at the source'        },
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

        {/* ── 7. PROOF ── */}
        <section style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              SEE THE SYSTEM WORKING
            </p>
            <div className="ro-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${ORANGE}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                  A real venue. A real service flow.
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  The system walkthrough covers a live venue session — from the first QR scan to the final payment. You see how reservations, orders, kitchen notifications and bill splits work together in real time.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>
                  No slides. No demo account built for a presentation. The operational system, in the environment it runs in.
                </p>
              </div>
              <div style={{ background: CARD, padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>WHAT THE WALKTHROUGH COVERS</p>
                {[
                  'Guest scan → seat identity → order flow',
                  'Kitchen notification per order — live',
                  'Bill settlement — all four split modes',
                  'Reservation view across the team',
                  'Admin view — active sessions and order history',
                ].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px' }}>→</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.6 }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. WHAT HAPPENS NEXT ── */}
        <section style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              WHAT HAPPENS NEXT
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>
              From the first conversation to a running system.
            </h2>
            <div className="ro-grid-2">
              {[
                { num: '01', title: 'Short conversation',    desc: 'We learn about the venue — table count, current order flow, where the friction is. This takes 20 minutes.' },
                { num: '02', title: 'Venue workflow mapped', desc: 'We map how reservations, orders and payments currently move through the team — before changing anything.' },
                { num: '03', title: 'System configured',    desc: 'RestaurantOS is set up for the venue — tables, QR codes, kitchen notification method, payment modes.' },
                { num: '04', title: 'Go live gradually',    desc: 'Start with one section of the venue. Expand as the team gets comfortable. No overnight switchover required.' },
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

        {/* ── 9. CTA ── */}
        <section id="walkthrough" style={{ background: BG, padding: '6rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>
              SCHEDULE A WALKTHROUGH
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              See the system working in your type of venue.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Tell us about the venue and how orders currently move. We walk through the live system and show how RestaurantOS fits the specific way your team already operates.
            </p>
            <div style={{ marginTop: '1.5rem', background: '#141414', border: `1px solid ${BORDER}`, padding: '20px 24px', maxWidth: '400px', display: 'inline-block' }}>
              {['Short conversation first — no commitment.', 'Configured to your venue and workflow.', 'Start with one section. Expand when ready.'].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666', margin: '4px 0', letterSpacing: '0.05em' }}>— {line}</p>
              ))}
            </div>
            <RestaurantContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>
              // No commitment · We reply within 24 hours · System live in 5–10 days from sign-off
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
