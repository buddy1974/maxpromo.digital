'use client'

import { useState } from 'react'
import Link from 'next/link'

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

const inputBase: React.CSSProperties = {
  ...sans,
  fontSize: '15px',
  color: '#FFFFFF',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '2px',
  padding: '14px 16px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

interface PortfolioItem {
  title: string
  client: string
  type: string
  summary: string
  metrics: string[]
}

const PORTFOLIO: PortfolioItem[] = [
  {
    title: 'Lead Qualification Agent',
    client: 'B2B Real Estate Agency · Düsseldorf',
    type: 'AI Agent',
    summary: 'Inbound enquiries are scored, routed, and replied to within minutes — Marcel-style style guide, German tone.',
    metrics: ['18h/week saved', '3x faster response', '+24% qualification rate'],
  },
  {
    title: 'Praxis Anmeldungs-Bot',
    client: 'Medical Practice · Essen',
    type: 'Workflow Automation',
    summary: 'WhatsApp + email intake → triage → calendar → confirmation. Receptionist no longer manually routes new patient enquiries.',
    metrics: ['~12h/week saved', '99% intake within 1h', 'Zero missed bookings since launch'],
  },
  {
    title: 'Restaurant Bestelldigitalisierung',
    client: 'Independent Restaurant Group',
    type: 'AI Website + OS',
    summary: 'Menu digitisation, online ordering, voucher engine, social-content rotation, all under one operator console.',
    metrics: ['+38% online orders', '4 social posts/week automated', '€1.2k/mo agency fee replaced'],
  },
  {
    title: 'Handwerk Rechnungs-AI',
    client: 'Skilled Trades — Multi-Site',
    type: 'Document AI',
    summary: 'Field-engineer voice notes & photos → typed Rechnung in German, ready to send. 90s end-to-end.',
    metrics: ['~9h/week saved per crew', '100% legally compliant', 'Zero re-entry errors'],
  },
]

export default function PortfolioPage() {
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/portfolio/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Incorrect access code')
        setLoading(false)
        return
      }
      setUnlocked(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (unlocked) {
    return (
      <main style={{ background: '#0A0A0A', minHeight: '100vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            // Portfolio &middot; Confidential
          </p>
          <h1 style={{ ...grotesk, fontSize: 'clamp(32px, 5vw, 48px)', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            Selected work.
          </h1>
          <p style={{ ...sans, fontSize: '16px', color: '#888888', margin: '0 0 48px', maxWidth: '640px', lineHeight: 1.6 }}>
            Each system below was built and is in production. Client names redacted under NDA — happy to make an intro on request.
          </p>

          <div style={{ display: 'grid', gap: '16px' }}>
            {PORTFOLIO.map((item, i) => (
              <article key={i} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ ...mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>{item.type}</p>
                    <h2 style={{ ...grotesk, fontSize: '20px', color: '#FFFFFF', fontWeight: 700, margin: '0 0 4px' }}>{item.title}</h2>
                    <p style={{ ...sans, fontSize: '13px', color: '#666', margin: 0 }}>{item.client}</p>
                  </div>
                </div>
                <p style={{ ...sans, fontSize: '15px', color: '#CCC', margin: '0 0 16px', lineHeight: 1.6 }}>{item.summary}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {item.metrics.map(m => (
                    <span key={m} style={{ ...mono, fontSize: '11px', color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '4px 10px', borderRadius: '2px', letterSpacing: '0.04em' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <Link
              href="/discovery"
              style={{
                ...mono, fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#F97316', color: '#000', border: 'none', borderRadius: '2px',
                padding: '14px 22px', textDecoration: 'none', display: 'inline-block',
              }}
            >
              Discuss your build →
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', padding: '140px 24px 100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: '420px' }}>
        <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px', textAlign: 'center' }}>
          // Portfolio &middot; Access Required
        </p>
        <h1 style={{ ...grotesk, fontSize: '32px', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px', textAlign: 'center' }}>
          Confidential.
        </h1>
        <p style={{ ...sans, fontSize: '14px', color: '#888888', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.5 }}>
          Client work is under NDA. If we&rsquo;ve shared an access code with you, enter it below. Otherwise, <Link href="/contact" style={{ color: '#F97316' }}>reach out</Link>.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Access code"
          style={inputBase}
        />
        {error && (
          <p style={{ ...mono, fontSize: '12px', color: '#ef4444', margin: '12px 0 0' }}>⚠ {error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            ...mono, fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
            background: '#F97316', color: '#000', border: 'none', borderRadius: '2px',
            padding: '14px 22px', cursor: loading || !password ? 'not-allowed' : 'pointer',
            opacity: loading || !password ? 0.5 : 1, marginTop: '16px', width: '100%',
          }}
        >
          {loading ? 'Verifying…' : 'Unlock portfolio →'}
        </button>
      </form>
    </main>
  )
}
