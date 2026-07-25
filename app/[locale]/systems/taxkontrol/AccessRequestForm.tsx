'use client'

import { useState } from 'react'

const ORANGE = '#F97316'
const BG     = '#080808'
const BORDER = '#1A1A1A'

interface FormFields {
  name:     string
  business: string
  phone:    string
  email:    string
}

interface Props {
  locale: string
}

export function AccessRequestForm({ locale }: Props) {
  const de = locale === 'de'

  const [form,   setForm]   = useState<FormFields>({ name: '', business: '', phone: '', email: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function update(field: keyof FormFields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    try {
      const phoneNote = form.phone
        ? (de ? `\nTelefon: ${form.phone}` : `\nPhone: ${form.phone}`)
        : ''
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name,
          email:        form.email,
          organisation: form.business,
          message:      de
            ? `TaxKontrol Anfrage${phoneNote}`
            : `TaxKontrol access request${phoneNote}`,
          automation:   'taxkontrol',
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inp: React.CSSProperties = {
    background:  '#0A0A0A',
    border:      `1px solid ${BORDER}`,
    color:       '#F0F0F0',
    padding:     '14px 16px',
    fontFamily:  'var(--font-body)',
    fontSize:    '15px',
    width:       '100%',
    outline:     'none',
    borderRadius: 0,
    transition:  'border-color 150ms ease',
  }

  const fields = de ? [
    { field: 'name'     as const, type: 'text',  placeholder: 'Ihr Name',           required: true  },
    { field: 'business' as const, type: 'text',  placeholder: 'Firmenname',          required: true  },
    { field: 'phone'    as const, type: 'tel',   placeholder: 'Telefon (optional)',  required: false },
    { field: 'email'    as const, type: 'email', placeholder: 'E-Mail-Adresse',      required: true  },
  ] : [
    { field: 'name'     as const, type: 'text',  placeholder: 'Your name',           required: true  },
    { field: 'business' as const, type: 'text',  placeholder: 'Business name',       required: true  },
    { field: 'phone'    as const, type: 'tel',   placeholder: 'Phone (optional)',    required: false },
    { field: 'email'    as const, type: 'email', placeholder: 'Email address',       required: true  },
  ]

  const btnLabel =
    status === 'loading' ? (de ? 'Wird gesendet...'   : 'Sending...')          :
    status === 'success' ? (de ? '✓ Anfrage erhalten' : '✓ Request received')  :
                           (de ? 'Vorführung anfragen →' : 'Request walkthrough →')

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '2.5rem' }}
    >
      {fields.map(({ field, type, placeholder, required }) => (
        <input
          key={field}
          name={field}
          type={type}
          placeholder={placeholder}
          required={required}
          value={form[field]}
          onChange={update(field)}
          style={inp}
          onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
        />
      ))}
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        style={{
          background:      ORANGE,
          color:           BG,
          fontFamily:      'var(--font-mono)',
          fontSize:        '11px',
          textTransform:   'uppercase',
          letterSpacing:   '0.1em',
          fontWeight:      700,
          padding:         '16px',
          width:           '100%',
          border:          'none',
          cursor:          status === 'loading' || status === 'success' ? 'default' : 'pointer',
          opacity:         status === 'loading' ? 0.7 : 1,
        }}
      >
        {btnLabel}
      </button>

      {status === 'success' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: ORANGE, margin: 0 }}>
          {de
            ? 'Wir melden uns innerhalb von 24 Stunden, um ein kurzes Gespräch zu vereinbaren.'
            : 'We will be in touch within 24 hours to schedule a short conversation.'}
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#FF4D4D', margin: 0 }}>
          {de
            ? 'Etwas ist schiefgelaufen. Schreiben Sie uns direkt an info@maxpromo.digital'
            : 'Something went wrong. Email us directly at info@maxpromo.digital'}
        </p>
      )}
    </form>
  )
}
