'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import VoiceInputWidget from '@/components/voice/VoiceInputWidget'

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

/* ─── LOCALE HELPER ───────────────────────────────────────── */
function t(locale: string, de: string, en: string): string {
  return locale === 'de' ? de : en
}

type Status = 'idle' | 'enhancing' | 'sending' | 'success' | 'error'

export default function DiscoveryPage() {
  const params = useParams<{ locale: string }>()
  const locale = params?.locale === 'de' ? 'de' : 'en'

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
      if (!res.ok) throw new Error(t(locale, 'KI-Extraktion fehlgeschlagen', 'AI extraction failed'))
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
      setErrorMsg(e instanceof Error ? e.message : t(locale, 'Verarbeitung fehlgeschlagen', 'Failed to enhance'))
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
          organisation: company.trim() || t(locale, 'Discovery (kein Unternehmen)', 'Discovery (no company)'),
          automation: 'Discovery Call',
          message: enhanced
            ? `DISCOVERY BRIEF\n\n${brief.trim()}\n\nAI-STRUCTURED PREVIEW:\n${
                enhanced.items.map(i => `• ${i.description}: €${i.finalPrice}`).join('\n')
              }${
                enhanced.paymentTerms ? `\n\nPayment: ${enhanced.paymentTerms}` : ''
              }${
                enhanced.includedItems?.length ? `\n\nIncluded: ${enhanced.includedItems.join(', ')}` : ''
              }`
            : brief.trim(),
        }),
      })
      if (!res.ok) throw new Error(t(locale, 'Konnte nicht gesendet werden. Bitte erneut versuchen.', 'Could not send. Please try again.'))
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t(locale, 'Senden fehlgeschlagen', 'Failed to send'))
      setStatus('error')
    }
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', padding: '120px 24px 80px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          {t(locale, '// Erstgespräch', '// Discovery Call')}
        </p>
        <h1 style={{ ...grotesk, fontSize: 'clamp(32px, 5vw, 48px)', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.1 }}>
          {t(locale, 'Sagen Sie uns, was Sie brauchen.', 'Tell us what you need.')}<br />
          <span style={{ color: '#888888' }}>{t(locale, 'Wir strukturieren es für Sie.', "We'll structure it for you.")}</span>
        </h1>
        <p style={{ ...sans, fontSize: '17px', color: '#888888', lineHeight: 1.6, margin: '0 0 48px', maxWidth: '600px' }}>
          {t(locale,
            'Fügen Sie Ihr Rohbriefing ein: Notizen, eine weitergeleitete E-Mail, eine Liste, auch unordentliche Stichpunkte. Unser Extraktor macht daraus in Sekunden einen strukturierten Ausgangspunkt. Wir melden uns innerhalb von 24 Stunden mit einem echten Angebot.',
            "Paste your raw brief: notes, a forwarded email, a list, even messy bullet points. Our extractor turns it into a structured starting point in seconds. We'll follow up with a real proposal within 24 hours.")}
        </p>

        {status === 'success' ? (
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', padding: '32px', borderRadius: '2px', textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              {t(locale, '✓ Briefing erhalten', '✓ Brief received')}
            </p>
            <p style={{ ...sans, fontSize: '16px', color: '#FFFFFF', margin: '0 0 8px' }}>
              {t(locale, 'Danke, wir melden uns innerhalb von 24 Stunden.', 'Thanks, we will reply within 24 hours.')}
            </p>
            <p style={{ ...sans, fontSize: '14px', color: '#888888', margin: 0 }}>
              {t(locale, 'In der Zwischenzeit können Sie die', 'In the meantime, take the')}{' '}
              <Link href="/automation-audit" style={{ color: '#F97316' }}>
                {t(locale, 'kostenlose Automatisierungs-Analyse', 'free automation audit')}
              </Link>
              {t(locale, ' machen.', '.')}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input style={inputBase} placeholder={t(locale, 'Ihr Name', 'Your name')} value={name} onChange={e => setName(e.target.value)} />
              <input style={inputBase} type="email" placeholder={t(locale, 'E-Mail', 'Email')} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <input style={{ ...inputBase, marginBottom: '12px' }} placeholder={t(locale, 'Unternehmen (optional)', 'Company (optional)')} value={company} onChange={e => setCompany(e.target.value)} />

            <VoiceInputWidget
              value={brief}
              onChange={(v) => { setBrief(v); setEnhanced(null) }}
              rows={9}
              placeholder={t(locale,
                `Fügen Sie Ihr Briefing ein, z. B.:\n\nAMAKA CITY: VERBESSERUNGSPLAN\nWebsite + Hosting + Domain → 600 €\nBuchungssystem → 100 €\nSocial-Media-Einrichtung + erster Content → 150 €\nFlyer- + Visitenkartendesign → 120 €\nDruck (2.500 Flyer + 1.000 Karten) → 185 €\n\nKostenlos inklusive: Gutscheinsystem, Paketpreise, Einführungsangebote.\n\nZahlung in 2 Raten möglich. Schrittweise ist ok.`,
                `Paste your brief, e.g.:\n\nAMAKA CITY: IMPROVEMENT PLAN\nWebsite + hosting + domain → 600 €\nBooking system → 100 €\nSocial media setup + first content → 150 €\nFlyer + business card design → 120 €\nPrinting (2,500 flyers + 1,000 cards) → 185 €\n\nIncluded for free: voucher system, package pricing, intro offers.\n\nPayment in 2 parts possible. Step by step OK.`)}
              context="Discovery brief describing a client project scope and budget for Maxpromo Digital"
              textareaStyle={{ ...inputBase, minHeight: '220px', resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--font-roboto-mono)', fontSize: '13px' }}
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
                {status === 'enhancing' ? t(locale, '⟳ Lese…', '⟳ Reading…') : t(locale, '◈ Mit KI strukturieren', '◈ Structure with AI')}
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
                {status === 'sending' ? t(locale, 'Wird gesendet…', 'Sending…') : t(locale, 'Briefing senden →', 'Send brief →')}
              </button>
            </div>

            {errorMsg && (
              <p style={{ ...mono, fontSize: '12px', color: '#ef4444', margin: '14px 0 0' }}>⚠ {errorMsg}</p>
            )}

            {enhanced && (
              <div style={{ marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px' }}>
                <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  {t(locale, '// KI-strukturierte Vorschau', '// AI-structured preview')} &middot; {enhanced.overallConfidence} {t(locale, 'Konfidenz', 'confidence')}
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
                    <span style={{ ...mono, fontSize: '12px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t(locale, 'Geschätzt', 'Estimated')}</span>
                    <span style={{ ...mono, fontSize: '18px', color: '#FFF', fontWeight: 700 }}>
                      €{enhanced.items.reduce((s, i) => s + Number(i.finalPrice || 0), 0).toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>

                {enhanced.includedItems && enhanced.includedItems.length > 0 && (
                  <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '3px solid #22c55e', padding: '12px 16px', marginTop: '12px', borderRadius: '2px' }}>
                    <p style={{ ...mono, fontSize: '10px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                      {t(locale, 'Kostenlos inklusive', 'Included free')}
                    </p>
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
                  {t(locale,
                    'Dies ist eine indikative Aufschlüsselung, extrahiert aus Ihrem Text. Wir senden Ihnen ein richtiges Angebot, sobald Sie es einreichen.',
                    "This is an indicative breakdown extracted from your text. We'll send a proper proposal once you submit.")}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
