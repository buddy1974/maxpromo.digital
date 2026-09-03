'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const mono = { fontFamily: 'var(--font-mono)' } as const
const sans = { fontFamily: 'var(--font-body)' } as const

const inputBase: React.CSSProperties = {
  ...sans,
  fontSize: '16px',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  padding: '14px 16px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

/* ─── LOCALE HELPER ───────────────────────────────────────── */
function t(locale: string, de: string, en: string): string {
  return locale === 'de' ? de : en
}

interface PortfolioItem {
  title: string
  client: string
  type: string
  summary: string
  metrics: string[]
}

function getPortfolio(locale: string): PortfolioItem[] {
  return [
    {
      title: t(locale, 'Lead-Qualifizierungs-Agent', 'Lead Qualification Agent'),
      client: t(locale, 'B2B-Immobilienagentur · Düsseldorf', 'B2B Real Estate Agency · Düsseldorf'),
      type: t(locale, 'KI-Agent', 'AI Agent'),
      summary: t(locale,
        'Eingehende Anfragen werden bewertet, weitergeleitet und innerhalb von Minuten beantwortet, im Marcel-Stil, deutscher Tonfall.',
        'Inbound enquiries are scored, routed, and replied to within minutes, Marcel-style style guide, German tone.'),
      metrics: [
        t(locale, '18 Std./Woche gespart', '18h/week saved'),
        t(locale, '3x schnellere Antwortzeit', '3x faster response'),
        t(locale, '+24 % Qualifizierungsrate', '+24% qualification rate'),
      ],
    },
    {
      title: 'Praxis Anmeldungs-Bot',
      client: t(locale, 'Arztpraxis · Essen', 'Medical Practice · Essen'),
      type: t(locale, 'Workflow-Automatisierung', 'Workflow Automation'),
      summary: t(locale,
        'WhatsApp- + E-Mail-Aufnahme → Triage → Kalender → Bestätigung. Die Rezeption leitet neue Patientenanfragen nicht mehr manuell weiter.',
        'WhatsApp + email intake → triage → calendar → confirmation. Receptionist no longer manually routes new patient enquiries.'),
      metrics: [
        t(locale, '~12 Std./Woche gespart', '~12h/week saved'),
        t(locale, '99 % Aufnahme innerhalb 1 Std.', '99% intake within 1h'),
        t(locale, 'Keine verpassten Termine seit dem Start', 'Zero missed bookings since launch'),
      ],
    },
    {
      title: t(locale, 'Restaurant-Bestelldigitalisierung', 'Restaurant Bestelldigitalisierung'),
      client: t(locale, 'Unabhängige Restaurantgruppe', 'Independent Restaurant Group'),
      type: t(locale, 'KI-Website + Betriebssystem', 'AI Website + OS'),
      summary: t(locale,
        'Menü-Digitalisierung, Online-Bestellung, Gutschein-Engine, rotierender Social-Content, alles in einer Betreiberkonsole.',
        'Menu digitisation, online ordering, voucher engine, social-content rotation, all under one operator console.'),
      metrics: [
        t(locale, '+38 % Online-Bestellungen', '+38% online orders'),
        t(locale, '4 Social-Posts/Woche automatisiert', '4 social posts/week automated'),
        t(locale, '1.200 €/Monat Agenturkosten ersetzt', '€1.2k/mo agency fee replaced'),
      ],
    },
    {
      title: 'Handwerk Rechnungs-AI',
      client: t(locale, 'Handwerksbetrieb, mehrere Standorte', 'Skilled Trades, Multi-Site'),
      type: t(locale, 'Dokumenten-KI', 'Document AI'),
      summary: t(locale,
        'Sprachnotizen und Fotos vom Außendienst → getippte Rechnung auf Deutsch, versandfertig. 90 Sekunden vollständig durchgängig.',
        'Field-engineer voice notes & photos → typed Rechnung in German, ready to send. 90s end-to-end.'),
      metrics: [
        t(locale, '~9 Std./Woche pro Team gespart', '~9h/week saved per crew'),
        t(locale, '100 % rechtskonform', '100% legally compliant'),
        t(locale, 'Keine Nacherfassungsfehler', 'Zero re-entry errors'),
      ],
    },
  ]
}

export default function PortfolioPage() {
  const params = useParams<{ locale: string }>()
  const locale = params?.locale === 'de' ? 'de' : 'en'
  const PORTFOLIO = getPortfolio(locale)

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
        setError(t(locale, 'Falscher Zugangscode', 'Incorrect access code'))
        setLoading(false)
        return
      }
      setUnlocked(true)
    } catch {
      setError(t(locale, 'Netzwerkfehler, bitte erneut versuchen', 'Network error, please try again'))
    } finally {
      setLoading(false)
    }
  }

  if (unlocked) {
    return (
      <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: 'clamp(5rem, 10vw, 8.75rem) 24px clamp(4.5rem, 8vw, 6.25rem)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {t(locale, 'Portfolio &middot; Vertraulich', 'Portfolio &middot; Confidential')}
          </p>
          <h1 style={{ margin: '0 0 16px' }}>
            {t(locale, 'Ausgewählte Arbeiten.', 'Selected work.')}
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'var(--color-text-secondary)', margin: '0 0 48px', maxWidth: '640px', lineHeight: 1.7 }}>
            {t(locale,
              'Jedes System unten wurde gebaut und ist im produktiven Einsatz. Kundennamen unter NDA geschwärzt, auf Anfrage stellen wir gerne einen Kontakt her.',
              'Each system below was built and is in production. Client names redacted under NDA, happy to make an intro on request.')}
          </p>

          <div style={{ display: 'grid', gap: '16px' }}>
            {PORTFOLIO.map((item, i) => (
              <article key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ ...mono, fontSize: '11px', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>{item.type}</p>
                    <h2 className="h-card" style={{ margin: '0 0 4px' }}>{item.title}</h2>
                    <p style={{ ...sans, fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>{item.client}</p>
                  </div>
                </div>
                <p style={{ ...sans, fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.65 }}>{item.summary}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {item.metrics.map(m => (
                    <span key={m} style={{ ...mono, fontSize: '12px', color: 'var(--brand-text-secondary)', background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.03em' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <Link href="/contact" className="btn btn-primary">
              {t(locale, 'Ihr Projekt besprechen →', 'Discuss your build →')}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: 'clamp(5rem, 10vw, 8.75rem) 24px clamp(4.5rem, 8vw, 6.25rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: '420px' }}>
        <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px', textAlign: 'center' }}>
          {t(locale, 'Portfolio &middot; Zugang erforderlich', 'Portfolio &middot; Access Required')}
        </p>
        <h1 style={{ margin: '0 0 14px', textAlign: 'center' }}>
          {t(locale, 'Vertraulich.', 'Confidential.')}
        </h1>
        <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 }}>
          {t(locale, 'Kundenprojekte unterliegen einer NDA. Wenn wir Ihnen einen Zugangscode mitgeteilt haben, geben Sie ihn unten ein. Andernfalls', 'Client work is under NDA. If we’ve shared an access code with you, enter it below. Otherwise,')}{' '}
          <Link href="/contact" style={{ color: 'var(--brand-text-secondary)' }}>{t(locale, 'kontaktieren Sie uns', 'reach out')}</Link>.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t(locale, 'Zugangscode', 'Access code')}
          style={inputBase}
        />
        {error && (
          <p style={{ ...mono, fontSize: '13px', color: '#DC2626', margin: '12px 0 0' }}>⚠ {error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="btn btn-primary"
          style={{
            marginTop: '16px', width: '100%',
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            opacity: loading || !password ? 0.5 : 1,
          }}
        >
          {loading ? t(locale, 'Wird geprüft…', 'Verifying…') : t(locale, 'Portfolio freischalten →', 'Unlock portfolio →')}
        </button>
      </form>
    </main>
  )
}
