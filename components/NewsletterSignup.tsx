'use client'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslations } from 'next-intl'

export default function NewsletterSignup() {
  const t = useTranslations('newsletter')
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')

    try {
      const res  = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json() as { success?: boolean; status?: string; error?: string }

      if (data.success) {
        setStatus('success')
        setMessage(t('successDesc'))
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? t('errorGeneric'))
      }
    } catch {
      setStatus('error')
      setMessage(t('errorGeneric'))
    }
  }

  return (
    <section
      style={{
        background: '#0A0A0A',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '80px 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: '#111111',
          border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)',
          borderTop: '2px solid var(--brand-primary)',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-roboto-mono)',
            fontSize: '11px',
            color: 'var(--brand-primary)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            margin: '0 0 16px',
          }}
        >
          {t('eyebrow')}
        </p>

        <h2 style={{ color: '#FFFFFF', margin: '0 0 12px' }}>
          {t('title')}
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '15px',
            color: '#888888',
            lineHeight: 1.7,
            margin: '0 0 32px',
          }}
        >
          {t('subtitle')}
        </p>

        {status === 'success' ? (
          <div
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              padding: '16px 24px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '12px', color: '#22c55e', margin: 0, letterSpacing: '0.08em' }}>
              ✓ {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0', maxWidth: '440px', margin: '0 auto' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              required
              style={{
                flex: 1,
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRight: 'none',
                color: '#FFFFFF',
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
                padding: '13px 18px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              style={{
                background: 'var(--brand-primary)',
                border: 'none',
                color: '#000000',
                fontFamily: 'var(--font-roboto-mono)',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.1em',
                padding: '13px 24px',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {status === 'loading' ? '...' : t('cta')}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p style={{ fontFamily: 'var(--font-roboto-mono)', fontSize: '11px', color: '#ef4444', margin: '12px 0 0', letterSpacing: '0.05em' }}>
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
