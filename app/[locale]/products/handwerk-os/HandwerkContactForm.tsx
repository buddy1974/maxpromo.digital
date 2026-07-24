'use client'

import { useState } from 'react'

const ORANGE = '#F97316'
const BG     = '#080808'
const BORDER = '#1A1A1A'

interface HandwerkForm { name: string; business: string; trade: string; email: string; phone: string }

export function HandwerkContactForm({ locale }: { locale: string }) {
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
        { field: 'name',     type: 'text',  labelEn: 'Your name',        labelDe: 'Ihr Name',             required: true  },
        { field: 'business', type: 'text',  labelEn: 'Business name',    labelDe: 'Firmenname',           required: true  },
        { field: 'trade',    type: 'text',  labelEn: 'Trade or sector',  labelDe: 'Branche oder Gewerk',  required: true  },
        { field: 'email',    type: 'email', labelEn: 'Email address',    labelDe: 'E-Mail-Adresse',       required: true  },
        { field: 'phone',    type: 'tel',   labelEn: 'Phone (optional)', labelDe: 'Telefon (optional)',   required: false },
      ] as const).map(({ field, type, labelEn, labelDe, required }) => (
        <input key={field} name={field} type={type} placeholder={locale === 'de' ? labelDe : labelEn} required={required}
          value={form[field]} onChange={update(field)} style={inp}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: ORANGE, color: BG, fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px', width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? (locale === 'de' ? 'Wird gesendet...' : 'Sending...') : status === 'success' ? (locale === 'de' ? '✓ Anfrage erhalten' : '✓ Request received') : (locale === 'de' ? 'Walkthrough planen →' : 'Schedule walkthrough →')}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>{locale === 'de' ? 'Wir melden uns innerhalb von 24 Stunden.' : 'We will contact you within 24 hours.'}</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>{locale === 'de' ? 'Etwas ist schiefgelaufen. Schreiben Sie uns direkt an info@maxpromo.digital' : 'Something went wrong. Email us at info@maxpromo.digital'}</p>}
    </form>
  )
}
