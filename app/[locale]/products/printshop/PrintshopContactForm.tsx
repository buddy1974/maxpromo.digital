'use client'

import { useState } from 'react'

const ORANGE = '#F97316'
const INK    = '#1A1A1A'

interface PrintshopForm { name: string; business: string; email: string; phone: string }

export function PrintshopContactForm({ locale }: { locale: string }) {
  const [form, setForm] = useState<PrintshopForm>({ name: '', business: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof PrintshopForm) {
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
          name: form.name, email: form.email, organisation: form.business,
          message: form.phone ? `Phone: ${form.phone}` : 'Print shop walkthrough request',
          automation: 'printshop-os',
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch { setStatus('error') }
  }

  const input: React.CSSProperties = {
    background: '#FFFFFF', border: `2px solid ${INK}`, color: INK,
    padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: '15px',
    width: '100%', outline: 'none', borderRadius: 0, transition: 'border-color 150ms ease',
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}>
      {([
        { field: 'name',     type: 'text',  labelEn: 'Your name',        labelDe: 'Ihr Name',        required: true  },
        { field: 'business', type: 'text',  labelEn: 'Print shop name',  labelDe: 'Druckereiname',   required: true  },
        { field: 'email',    type: 'email', labelEn: 'Email address',    labelDe: 'E-Mail-Adresse',  required: true  },
        { field: 'phone',    type: 'tel',   labelEn: 'Phone (optional)', labelDe: 'Telefon (optional)', required: false },
      ] as const).map(({ field, type, labelEn, labelDe, required }) => (
        <input key={field} name={field} type={type} placeholder={locale === 'de' ? labelDe : labelEn} required={required}
          value={form[field]} onChange={update(field)} style={input}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = INK)} />
      ))}
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        style={{ background: INK, color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '11px',
          textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '16px',
          width: '100%', border: 'none', cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? (locale === 'de' ? 'Wird gesendet...' : 'Sending...') : status === 'success' ? (locale === 'de' ? '✓ Anfrage erhalten' : '✓ Request received') : (locale === 'de' ? 'Walkthrough anfragen →' : 'Request walkthrough →')}
      </button>
      {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>{locale === 'de' ? 'Wir melden uns innerhalb von 24 Stunden.' : 'We will contact you within 24 hours.'}</p>}
      {status === 'error'   && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#CC0000', margin: 0 }}>{locale === 'de' ? 'Etwas ist schiefgelaufen. Schreiben Sie uns direkt an info@maxpromo.digital' : 'Something went wrong. Email us at info@maxpromo.digital'}</p>}
    </form>
  )
}
