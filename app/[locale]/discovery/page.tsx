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
  transition: 'border-color 150ms ease',
}

type Status = 'idle' | 'enhancing' | 'sending' | 'success' | 'error'

export default function DiscoveryPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [brief, setBrief] = useState('')
  const [enhanced, setEnhanced] = useState<{
    summary: string
    items: Array<{ description: string; finalPrice: number; confidence: string }>
    paymentTerms?: string
    includedItems?: string[]
    overallConfidence: string
    extractionNotes?: string
    warnings?: string[]
  } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function enhance() {
    if (!brief.trim()) return
    setStatus('enhancing'); setErrorMsg('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'angebot', text: brief }),
      })
      if (!res.ok) throw new Error('AI extraction failed')
      const json = await res.json() as {
        extracted: {
          lineItems: Array<{ description: string; finalPrice: number; confidence: string }>
          paymentTerms?: string
          includedItems?: string[]
          overallConfidence: string
          extractionNotes?: string
          warnings?: string[]
        }
      }
      setEnhanced({
        summary: brief.slice(0, 240),
        items: json.extracted.lineItems ?? [],
        paymentTerms: json.extracted.paymentTerms,
        includedItems: json.extracted.includedItems,
        overallConfidence: json.extracted.overallConfidence,
        extractionNotes: json.extracted.extractionNotes,
        warnings: json.extracted.warnings,
      })
      setStatus('idle')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to enhance')
      setStatus('error')
    }
  }

  async function sendDiscovery() {
    if (!name.trim() || !email.trim() || !brief.trim()) return
    setStatus('sending'); setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organisation: company.trim() || 'Discovery (no company)',
          automation: 'Discovery Call',
          message: enhanced
            ? `DISCOVERY BRIEF\n\n${brief.trim()}\n\n— AI-STRUCTURED PREVIEW —\n${
                enhanced.items.map(i => `• ${i.description} — €${i.finalPrice}`).join('\n')
              }${
                enhanced.paymentTerms ? `\n\nPayment: ${enhanced.paymentTerms}` : ''
              }${
                enhanced.includedItems?.length ? `\n\nIncluded: ${enhanced.includedItems.join(', ')}` : ''
              }`
            : brief.trim(),
        }),
      })
      if (!res.ok) throw new Error('Could not send. Please try again.')
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to send')
      setStatus('error')
    }
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', padding: '120px 24px 80px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          // Discovery Call
        </p>
        <h1 style={{ ...grotesk, fontSize: 'clamp(32px, 5vw, 48px)', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.1 }}>
          Tell us what you need.<br />
          <span style={{ color: '#888888' }}>We&rsquo;ll structure it for you.</span>
        </h1>
        <p style={{ ...sans, fontSize: '17px', color: '#888888', lineHeight: 1.6, margin: '0 0 48px', maxWidth: '600px' }}>
          Paste your raw brief — notes, a forwarded email, a list, even messy bullet points. Our extractor turns it into a structured starting point in seconds. We&rsquo;ll follow up with a real proposal within 24h.
        </p>

        {status === 'success' ? (
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', padding: '32px', borderRadius: '2px', textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>✓ Brief received</p>
            <p style={{ ...sans, fontSize: '16px', color: '#FFFFFF', margin: '0 0 8px' }}>Thanks — Marcel will reply within 24 hours.</p>
            <p style={{ ...sans, fontSize: '14px', color: '#888888', margin: 0 }}>
              In the meantime, take the <Link href="/automation-audit" style={{ color: '#F97316' }}>free automation audit</Link>.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input style={inputBase} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              <input style={inputBase} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <input style={{ ...inputBase, marginBottom: '12px' }} placeholder="Company (optional)" value={company} onChange={e => setCompany(e.target.value)} />

            <textarea
              style={{ ...inputBase, minHeight: '220px', resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--font-roboto-mono)', fontSize: '13px' }}
              placeholder={`Paste your brief, e.g.:\n\nAMAKA CITY — IMPROVEMENT PLAN\nWebsite + hosting + domain → 600 €\nBooking system → 100 €\nSocial media setup + first content → 150 €\nFlyer + business card design → 120 €\nPrinting (2,500 flyers + 1,000 cards) → 185 €\n\nIncluded for free: voucher system, package pricing, intro offers.\n\nPayment in 2 parts possible. Step by step OK.`}
              value={brief}
              onChange={e => { setBrief(e.target.value); setEnhanced(null) }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={enhance}
                disabled={status === 'enhancing' || !brief.trim()}
                style={{
                  ...mono, fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'rgba(249,115,22,0.1)', color: '#F97316',
                  border: '1px solid rgba(249,115,22,0.4)', borderRadius: '2px',
                  padding: '14px 22px', cursor: status === 'enhancing' || !brief.trim() ? 'not-allowed' : 'pointer',
                  opacity: status === 'enhancing' || !brief.trim() ? 0.5 : 1,
                }}
              >
                {status === 'enhancing' ? '⟳ Reading…' : '◈ Structure with AI'}
              </button>
              <button
                onClick={sendDiscovery}
                disabled={status === 'sending' || !name.trim() || !email.trim() || !brief.trim()}
                style={{
                  ...mono, fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: '#F97316', color: '#000', border: 'none', borderRadius: '2px',
                  padding: '14px 22px',
                  cursor: status === 'sending' || !name.trim() || !email.trim() || !brief.trim() ? 'not-allowed' : 'pointer',
                  opacity: status === 'sending' || !name.trim() || !email.trim() || !brief.trim() ? 0.6 : 1,
                }}
              >
                {status === 'sending' ? 'Sending…' : 'Send brief →'}
              </button>
            </div>

            {errorMsg && (
              <p style={{ ...mono, fontSize: '12px', color: '#ef4444', margin: '14px 0 0' }}>⚠ {errorMsg}</p>
            )}

            {enhanced && (
              <div style={{ marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px' }}>
                <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  // AI-structured preview &middot; {enhanced.overallConfidence} confidence
                </p>

                {enhanced.warnings && enhanced.warnings.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', marginBottom: '16px', borderRadius: '2px' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      {enhanced.warnings.map((w, i) => (
                        <li key={i} style={{ ...sans, fontSize: '13px', color: '#FCA5A5', lineHeight: 1.5 }}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '20px' }}>
                  {enhanced.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < enhanced.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ ...sans, fontSize: '14px', color: '#CCC' }}>{it.description}</span>
                      <span style={{ ...mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>€{it.finalPrice.toLocaleString('de-DE')}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #F97316' }}>
                    <span style={{ ...mono, fontSize: '12px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Geschätzt</span>
                    <span style={{ ...mono, fontSize: '18px', color: '#FFF', fontWeight: 700 }}>
                      €{enhanced.items.reduce((s, i) => s + Number(i.finalPrice || 0), 0).toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>

                {enhanced.includedItems && enhanced.includedItems.length > 0 && (
                  <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '3px solid #22c55e', padding: '12px 16px', marginTop: '12px', borderRadius: '2px' }}>
                    <p style={{ ...mono, fontSize: '10px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>Included free</p>
                    <p style={{ ...sans, fontSize: '13px', color: '#CCC', margin: 0, lineHeight: 1.5 }}>{enhanced.includedItems.join(' · ')}</p>
                  </div>
                )}

                {enhanced.paymentTerms && (
                  <p style={{ ...mono, fontSize: '12px', color: '#888', margin: '12px 0 0', letterSpacing: '0.04em' }}>
                    💳 {enhanced.paymentTerms}
                  </p>
                )}
                {enhanced.extractionNotes && (
                  <p style={{ ...mono, fontSize: '11px', color: '#666', margin: '6px 0 0' }}>ℹ️ {enhanced.extractionNotes}</p>
                )}
                <p style={{ ...sans, fontSize: '13px', color: '#666', margin: '20px 0 0', fontStyle: 'italic' }}>
                  This is an indicative breakdown extracted from your text. We&rsquo;ll send a proper proposal once you submit.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
