'use client'

import { useState } from 'react'
import Link from 'next/link'

const STYLES = `
  .px-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .px-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .px-proof  { display: grid; grid-template-columns: 3fr 2fr; gap: 1px; background: #1A1A1A; }
  @media (max-width: 768px) {
    .px-grid-3 { grid-template-columns: 1fr; }
    .px-grid-2 { grid-template-columns: 1fr; }
    .px-steps { flex-direction: column; }
    .px-steps > div { border-right: none !important; }
    .px-proof  { grid-template-columns: 1fr; }
  }
`

interface PraxisForm {
  name: string
  practice: string
  specialty: string
  email: string
  phone: string
}

function PraxisContactForm() {
  const [form, setForm] = useState<PraxisForm>({ name: '', practice: '', specialty: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof PraxisForm) {
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
          organisation: form.practice,
          message: `Specialty: ${form.specialty}${form.phone ? `\nPhone: ${form.phone}` : ''}`,
          automation: 'praxis-os',
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
          { field: 'name',      type: 'text',  label: 'Your name',          required: true  },
          { field: 'practice',  type: 'text',  label: 'Practice name',      required: true  },
          { field: 'specialty', type: 'text',  label: 'Medical specialty',  required: true  },
          { field: 'email',     type: 'email', label: 'Email address',      required: true  },
          { field: 'phone',     type: 'tel',   label: 'Phone (optional)',   required: false },
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
  'Patients book online — up to 40% fewer inbound calls',
  'Lab results delivered to the patient portal instantly — no post, no fax',
  'Appointment reminders fire automatically — no manual follow-up',
  'Every patient record auditable and GDPR compliant',
  'Staff work from one dashboard — no switching between systems',
]

const WHO_FOR = [
  'Specialist medical practices in Germany — urology, dermatology, cardiology, and more',
  'Patients currently booking by phone, receiving results by post or fax',
  'Staff working across disconnected systems with no single view and incomplete audit trails',
  'Approaching or currently under GDPR compliance obligations for patient data',
  'Practices handling 50–500+ patients per week with growing admin burden',
]

const PROBLEMS = [
  { icon: '📞', text: 'Appointment requests by phone. Reminders sent manually. No-shows not tracked. Recall letters done by hand.' },
  { icon: '📄', text: 'Patient intake on paper forms. Lab results posted or faxed. No patient portal. No digital access.' },
  { icon: '🗂', text: 'Staff working across disconnected systems. No single view. Audit trail incomplete. Compliance risk growing.' },
]

const FEATURES = [
  { icon: '[ PORTAL ]', name: 'Online Booking — 40% Fewer Calls',  desc: 'Patients book, view lab results, and complete intake forms without calling the practice. Measurable reduction in phone load.' },
  { icon: '[ APPT ]',   name: 'Reminders Fire Automatically — Nothing Falls Through',   desc: 'Reminders sent automatically. No-shows logged. Recall workflows triggered by protocol. Zero manual follow-up needed.' },
  { icon: '[ LAB ]',    name: 'Results To Patients Instantly — No Post, No Fax',        desc: 'Lab results delivered securely to the patient portal. No postal delay, no fax. Full audit trail on every result delivery.' },
  { icon: '[ DASH ]',   name: 'Every Role Sees Exactly What They Need',                 desc: 'Doctors, MFA staff, and admin each have their own view. Role-based access — no clutter, no confusion, no data leaks.' },
  { icon: '[ AUTO ]',   name: 'Cut Admin Work By Up To 50% — Automatically',            desc: 'Appointment reminders, lab notifications, no-show logging, PSA recall, and follow-ups — all automated via n8n workflows.' },
  { icon: '[ GDPR ]',   name: 'GDPR-Compliant By Design', desc: 'Audit log on every patient record action. GDPR compliant. Multilingual — German and English. Inspection-ready from day one.' },
]

const STEPS = [
  { num: '01', title: 'Patients self-serve online',       desc: 'Book appointments, complete intake forms, receive reminders, and view results — without calling the practice.' },
  { num: '02', title: 'Staff work from one dashboard',    desc: 'All patient data, appointments, and lab results in one place. Role-based — each staff member sees their relevant view.' },
  { num: '03', title: 'Automation handles follow-ups',    desc: 'Reminders fire automatically. Recalls triggered by protocol. No-shows logged. Nothing falls through the cracks.' },
]

const FLOW = [
  { step: '01', label: 'Patient books online → 0 missed appointment requests' },
  { step: '02', label: 'Confirmation sent automatically → No staff action needed' },
  { step: '03', label: 'Reminder fires 24h before → No-shows reduced' },
  { step: '04', label: 'Appointment completed → Record updated automatically' },
  { step: '05', label: 'Lab result delivered to portal → No post, no fax, no delay' },
]

/* ─── PAGE ────────────────────────────────────────────────── */

export default function PraxisOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#080808' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1.5rem' }}>
              ENTERPRISE SYSTEM · GDPR COMPLIANT
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              PraxisOS
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '600px', lineHeight: 1.8 }}>
              Complete digital operating system for specialist medical practices — built from a live German urology deployment.
              Patient portal, appointment management, digital lab results, staff dashboard, and automation workflows, all connected.
              Built to German healthcare standards. GDPR compliant. Available to selected practices.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Built from real deployment logic', 'Handles real-world edge cases', 'Designed for production environments', 'No prototype logic'].map(line => (
                <p key={line} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.08em', margin: 0, opacity: 0.85 }}>
                  <span style={{ marginRight: '8px', opacity: 0.5 }}>•</span>{line}
                </p>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <Link href="/contact?system=praxis-os"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080808', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
              >
                Explore System →
              </Link>
              <Link href="/contact?system=praxis-os"
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
            <div style={{ display: 'grid', gap: '1px', background: '#1A1A1A' }} className="px-grid-2">
              <div style={{ background: '#141414', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>BEFORE</p>
                {['Appointments booked only by phone', 'Lab results sent by post or fax', 'Reminders done manually or not at all', 'Paper intake forms and manual data entry', 'Staff working across disconnected systems'].map(item => (
                  <p key={item} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 8px', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#FF4D4D', flexShrink: 0 }}>✕</span>{item}
                  </p>
                ))}
              </div>
              <div style={{ background: '#141414', padding: '28px 32px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>AFTER</p>
                {['Patients book online 24/7 — 0 missed requests', 'Results delivered to patient portal instantly', 'Reminders automated — no missed follow-ups', 'Digital intake — no paper, no manual entry', 'One role-based dashboard per staff member'].map(item => (
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
              Built for specialist practices in Germany.
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
              What your practice looks like on week two.
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
              → 0 missed appointments · Response time: immediate · Running in live German practices
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
              How practices operate without it
            </h2>
            <div className="px-grid-3">
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
              Everything a specialist practice needs.
            </h2>
            <div className="px-grid-2">
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>WHAT THIS SYSTEM REMOVES FROM YOUR WORKLOAD</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Phone bookings. Paper intake. Faxed results. Manual reminders. All automated.
            </h2>
            <div style={{ borderTop: '1px solid #1A1A1A', display: 'flex', flexDirection: 'row' }} className="px-steps">
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
              Booked online. Reminded automatically. Results delivered to patient portal.
            </h2>
            <div className="px-proof">
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#141414', border: '1px dashed #2A2A2A', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#2A2A2A', margin: 0 }}>[ DASHBOARD SCREENSHOT ]</p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#444444', margin: 0, lineHeight: 1.6 }}>
                  Staff dashboard — appointment calendar, lab result delivery log, and automation status.
                </p>
              </div>
              <div style={{ background: '#0F0F0F', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                {[
                  { label: 'Appointment log', text: 'Every booking with reminder status — sent, delivered, confirmed per patient.' },
                  { label: 'Lab delivery', text: 'Result delivery confirmed per patient. Audit trail on every access.' },
                  { label: 'Automation log', text: 'Every n8n trigger visible — reminders fired, recalls sent, no-shows logged.' },
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
              Failed bookings handled automatically · Reminder retry logic active · Error states controlled
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '22px', color: '#F0F0F0', letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              From online booking to lab result — zero manual steps.
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
              Built and delivered for a urology specialist practice in Germany · Live since 2024
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
              Get a free PraxisOS audit for your practice.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Tell us about your practice and patient volume. We run a free audit, show how PraxisOS maps to your workflows and GDPR requirements, and send a no-obligation proposal. No commitment. We reply within 24 hours.
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
                We onboard a limited number of practices per month.<br />Next available slot: <span style={{ color: '#F0F0F0', fontWeight: 600 }}>May 2026</span>
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F0F0F0', letterSpacing: '0.05em', marginTop: '2.5rem', marginBottom: '8px' }}>
              We only install a limited number of systems per month.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F97316', letterSpacing: '0.05em', marginBottom: '0' }}>
              We install this system for you.
            </p>
            <PraxisContactForm />
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
