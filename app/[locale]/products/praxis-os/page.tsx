'use client'

import { useState } from 'react'
import Image from 'next/image'

const BLUE   = '#60A5FA'
const ORANGE = '#F97316'
const BG     = '#080808'
const CARD   = '#0F0F0F'
const BORDER = '#1A1A1A'

const STYLES = `
  .px-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: ${BORDER}; }
  .px-flow   { display: flex; gap: 2px; background: ${BORDER}; overflow-x: auto; }
  .px-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 768px) {
    .px-grid-2 { grid-template-columns: 1fr; }
    .px-flow   { flex-direction: column; }
    .px-hero   { grid-template-columns: 1fr; gap: 2rem; }
  }
`

interface PraxisForm { name: string; practice: string; specialty: string; email: string; phone: string }

function PraxisContactForm() {
  const [form, setForm] = useState<PraxisForm>({ name: '', practice: '', specialty: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof PraxisForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('loading')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, organisation: form.practice,
          message: `Specialty: ${form.specialty}${form.phone ? `\nPhone: ${form.phone}` : ''}`, automation: 'praxis-os' }) })
      if (!res.ok) throw new Error('failed'); setStatus('success')
    } catch { setStatus('error') }
  }

  const inp: React.CSSProperties = { background: '#0A0A0A', border: `1px solid ${BORDER}`, color: '#F0F0F0', padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px', width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease' }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {([
        { field: 'name',      type: 'text',  label: 'Your name',         required: true  },
        { field: 'practice',  type: 'text',  label: 'Practice name',     required: true  },
        { field: 'specialty', type: 'text',  label: 'Medical specialty', required: true  },
        { field: 'email',     type: 'email', label: 'Email address',     required: true  },
        { field: 'phone',     type: 'tel',   label: 'Phone (optional)',  required: false },
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

export default function PraxisOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: BG }}>

        {/* 1. HERO */}
        <section style={{ padding: '5rem 2rem', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="px-hero">
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1.5rem' }}>PRACTICE OPERATIONS SYSTEM</p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '760px' }}>
              Stop turning patient communication<br />into a phone chain.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '580px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              PraxisOS keeps patient bookings, lab results, records and follow-ups connected in one practice flow — without changing how the clinical team already works.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2.5rem' }}>
              {['Patients book online — no phone required', 'Lab results in patient portal directly', 'GDPR-compliant records retrievable instantly', 'Automated appointment confirmations'].map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F0F0F0', border: `1px solid ${BORDER}`, padding: '6px 14px', letterSpacing: '0.04em' }}>→ {p}</span>
              ))}
            </div>
            <a href="#walkthrough" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: BG, background: ORANGE, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA6A00')}
              onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}>Schedule walkthrough →</a>
          </div>
          <div>
            <Image
              src="/images/systems/praxis-os/card/praxis-os-en.png"
              alt="Medical practice reception — patient booking and appointment management workflow"
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
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>The same phone calls. Every day.</h2>
            <div className="px-grid-2">
              {[
                { label: 'THE BOOKING CALL', text: "Patient calls to book. Reception checks the calendar. Calls back to confirm the slot is still available. Patient calls again two days before the appointment to confirm. The phone rings again." },
                { label: 'THE LAB RESULTS', text: "Lab results arrive. Patient calls to ask. Reception takes a message. Doctor is with a patient. Doctor calls back when available. Patient missed the call. Patient calls again." },
                { label: 'THE DOUBLE BOOKING', text: "Two patients scheduled for the same slot through different channels. Discovered the morning of. One appointment moved. One patient contacted last minute. One appointment leaves an empty slot." },
                { label: 'THE GDPR REQUEST', text: "Patient requests access to their records. Records exist across different systems — some digital, some paper. Compiling the complete file takes two days. Deadline is seven." },
              ].map(item => (
                <div key={item.label} style={{ background: '#141414', padding: '36px', borderTop: `3px solid ${BLUE}` }}>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW PATIENT COMMUNICATION MOVES RIGHT NOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '2.5rem' }}>Every relay is a place where time is lost and information can be missed.</h2>
            <div className="px-flow">
              {[
                { step: '01', label: 'Patient calls',    note: 'For booking or results' },
                { step: '02', label: 'Reception takes',  note: 'Message or calendar check' },
                { step: '03', label: 'Doctor informed',  note: 'When available' },
                { step: '04', label: 'Callback',         note: 'If patient is available' },
                { step: '05', label: 'Patient calls',    note: 'Again, if missed' },
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
                  PraxisOS removes the phone from the middle of patient communication.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#666666', lineHeight: 1.8 }}>
                  Patients book online. Confirmation arrives automatically. Lab results uploaded and visible in the patient portal. GDPR-compliant records retrievable instantly. The practice team focuses on clinical work — not coordination calls.
                </p>
              </div>
              <div style={{ borderLeft: `3px solid ${BLUE}`, paddingLeft: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>WHAT CHANGES</p>
                {['Online booking — no phone call required to schedule', 'Automatic confirmation — patient notified instantly', 'Lab results in patient portal — no callback chain', 'GDPR records — instantly retrievable, not compiled on request', 'Appointment reminders — automatic, no staff involvement'].map(line => (
                  <div key={line} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: BLUE, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '2px', fontWeight: 700 }}>→</span>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '1rem' }}>HOW A PATIENT JOURNEY MOVES</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>From the first booking to the follow-up — connected.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDER}` }}>
              {[
                { num: '01', title: 'Patient books online',   desc: 'Selects appointment type and available slot. Confirmation sent automatically. No reception involvement required for standard bookings.' },
                { num: '02', title: 'Visit completed',         desc: 'Clinical notes recorded in the patient record. No paper. No transcription to a second system.' },
                { num: '03', title: 'Lab results uploaded',    desc: 'Results arrive and are added to the patient portal directly. Patient notified. No callback chain required.' },
                { num: '04', title: 'Patient accesses portal', desc: 'Patient sees results, appointment history and any practice communications. GDPR-compliant. Accessible from any device.' },
                { num: '05', title: 'Follow-up scheduled',    desc: 'Follow-up appointment booked from the portal if needed. Reminder sent automatically before the appointment date.' },
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
            <div style={{ background: BORDER, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#141414' }}>
                <div style={{ padding: '14px 28px', borderRight: `1px solid ${BORDER}` }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>BEFORE</p></div>
                <div style={{ padding: '14px 28px' }}><p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: ORANGE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>AFTER</p></div>
              </div>
              {[
                { before: 'Patients call to book — reception coordinates', after: 'Patients book online — confirmation automatic'     },
                { before: 'Lab results via phone callback chain',           after: 'Lab results in patient portal — no callbacks'    },
                { before: 'Double bookings from multiple channels',         after: 'Single calendar — no scheduling conflicts'       },
                { before: 'GDPR records compiled on request over days',    after: 'GDPR records retrievable instantly'              },
                { before: 'Appointment reminders made by phone',           after: 'Automatic reminders — no staff involvement'      },
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
            <div className="px-grid-2">
              <div style={{ background: CARD, padding: '40px', borderTop: `3px solid ${BLUE}` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '1rem' }}>A real practice workflow — from booking to patient portal.</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.8 }}>The walkthrough covers online booking, appointment management, lab result upload, patient portal access, and GDPR record retrieval. The full system — not a feature presentation.</p>
              </div>
              <div style={{ background: CARD, padding: '40px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>WHAT HAPPENS NEXT</p>
                {[
                  { num: '01', t: 'Short conversation', d: 'We learn about the practice — specialty, team size, current booking and record flow.' },
                  { num: '02', t: 'Workflow reviewed',  d: 'We map how patients currently move through the practice before configuring anything.' },
                  { num: '03', t: 'System configured',  d: 'PraxisOS set up for the specific specialty — booking types, portal access, GDPR settings.' },
                  { num: '04', t: 'Start with booking', d: 'Begin with online scheduling. Add portal, lab results and records as the team gets comfortable.' },
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
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>See PraxisOS working for your specialty.</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>Tell us about the practice. We walk through the live system and show how PraxisOS fits the way patients and the clinical team already interact.</p>
            <PraxisContactForm />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#444', letterSpacing: '0.08em', margin: '16px 0 0' }}>// No commitment · Reply within 24 hours · German healthcare standards · DSGVO compliant</p>
          </div>
        </section>

      </main>
    </>
  )
}
