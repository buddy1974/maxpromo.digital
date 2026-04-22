'use client'

import { useState } from 'react'
import Link from 'next/link'

const STYLES = `
  .px-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .px-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (max-width: 768px) {
    .px-grid-3 { grid-template-columns: 1fr; }
    .px-grid-2 { grid-template-columns: 1fr; }
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
          onFocus={(e) => (e.currentTarget.style.borderColor = '#E8FF00')}
          onBlur={(e)  => (e.currentTarget.style.borderColor = '#1A1A1A')}
        />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: '#E8FF00', color: '#080808', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px', width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
      >
        {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Sent' : 'REQUEST A DEMO →'}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#E8FF00', margin: 0 }}>✓ Request received. We&apos;ll contact you within 24 hours.</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>Something went wrong. Email us at hello@maxpromo.digital</p>}
    </form>
  )
}

const PROBLEMS = [
  { icon: '📞', text: 'Appointment requests by phone. Reminders sent manually. No-shows not tracked. Recall letters done by hand.' },
  { icon: '📄', text: 'Patient intake on paper forms. Lab results posted or faxed. No patient portal. No digital access.' },
  { icon: '🗂', text: 'Staff working across disconnected systems. No single view. Audit trail incomplete. Compliance risk growing.' },
]

const FEATURES = [
  { icon: '[ PORTAL ]', name: 'Patient Portal',              desc: 'Patients book appointments, view lab results, complete intake forms, and receive reminders — all online. No phone calls needed for routine interactions.' },
  { icon: '[ APPT ]',   name: 'Appointment Management',      desc: 'Full booking system with reminder automation. No-show logging. PSA recall workflows. Specialist procedure scheduling built in.' },
  { icon: '[ LAB ]',    name: 'Lab Results — Digital Delivery', desc: 'Results delivered securely to the patient portal. Automated notifications when results are ready. Full audit trail.' },
  { icon: '[ DASH ]',   name: 'Staff Dashboard',             desc: 'Role-based access for doctors, MFA staff, and admin. Each role sees exactly what they need — nothing more.' },
  { icon: '[ AUTO ]',   name: 'n8n Automation Workflows',    desc: 'Appointment reminders, lab notifications, no-show logging, PSA recall, and procedure-specific follow-ups — all automated.' },
  { icon: '[ GDPR ]',   name: 'GDPR & German Standards',     desc: 'Built to German healthcare data standards. Multilingual — German and English. Audit log on every patient record action.' },
]

const STEPS = [
  { num: '01', title: 'Patients self-serve online',       desc: 'Book appointments, complete intake forms, receive reminders, and view results — without calling the practice.' },
  { num: '02', title: 'Staff work from one dashboard',    desc: 'All patient data, appointments, and lab results in one place. Role-based — each staff member sees their relevant view.' },
  { num: '03', title: 'Automation handles follow-ups',    desc: 'Reminders fire automatically. Recalls triggered by protocol. No-shows logged. Nothing falls through the cracks.' },
]

export default function PraxisOSPage() {
  return (
    <>
      <style>{STYLES}</style>
      <main style={{ background: '#080808' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1.5rem' }}>
              ENTERPRISE SYSTEM · GDPR COMPLIANT
            </p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {'A digital operating system\nfor medical practices.'}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '600px', lineHeight: 1.8 }}>
              PraxisOS is a complete platform for specialist medical practices — patient portal, appointment management, lab results, digital intake forms, staff dashboard, and AI-assisted documentation. Built to German healthcare standards. GDPR compliant.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '2.5rem', alignItems: 'center' }}>
              <Link href="/contact?system=praxis-os"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#080808', background: '#E8FF00', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#D4EB00')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E8FF00')}
              >
                Request a Demo
              </Link>
              <Link href="/contact?system=praxis-os"
                style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: '1px solid #1A1A1A', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333333')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1A1A1A')}
              >
                See What&apos;s Built
              </Link>
            </div>
          </div>
        </section>

        {/* ── PROBLEM STRIP ── */}
        <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>THE PROBLEM</p>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>WHAT&apos;S BUILT</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              Everything a specialist practice needs.
            </h2>
            <div className="px-grid-2">
              {FEATURES.map((f) => (
                <div key={f.name} style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: '#E8FF00', marginBottom: '16px' }}>{f.icon}</p>
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>WORKFLOW</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '3rem' }}>
              From paper to platform.
            </h2>
            <div style={{ borderTop: '1px solid #1A1A1A', display: 'flex', flexDirection: 'row' }}>
              {STEPS.map((step, idx) => (
                <div key={step.num} style={{ flex: 1, padding: '40px 32px', borderRight: idx < STEPS.length - 1 ? '1px solid #1A1A1A' : 'none', borderBottom: '1px solid #1A1A1A', position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '80px', color: 'rgba(232,255,0,0.06)', lineHeight: 1, position: 'absolute', top: '16px', right: '24px', margin: 0, letterSpacing: '-0.04em', pointerEvents: 'none' }}>{step.num}</p>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: '10px', position: 'relative' }}>{step.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0, position: 'relative' }}>{step.desc}</p>
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', background: '#E8FF00', color: '#080808', padding: '4px 10px', fontWeight: 700 }}>
              ENTERPRISE · DEPLOYED
            </span>
          </div>
        </section>

        {/* ── CONVERSION ── */}
        <section style={{ background: '#080808', padding: '6rem 2rem', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>GET THIS SYSTEM</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0', marginBottom: '1rem' }}>
              Your practice. Running digitally.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', lineHeight: 1.8, maxWidth: '520px' }}>
              Configured for your specialty, your workflows, and your team. GDPR compliant. Built to German healthcare standards.
            </p>
            <PraxisContactForm />
          </div>
        </section>

      </main>
    </>
  )
}
