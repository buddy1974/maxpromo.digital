'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import VoiceInputWidget from '@/components/voice/VoiceInputWidget'

// ── Product-context map ──────────────────────────────────────────────────────
// Drives dynamic heading/copy when ?system= is present.
// Add entries as new products are gated.

interface SystemContext {
  name: string
  eyebrow: string
  title: string
  subtitle: string
}

const SYSTEM_CONTEXT: Record<string, SystemContext> = {
  'agent-bureau': {
    name:     'Max Agent Bureau',
    eyebrow:  '// Agent Bureau — Beratungsgespräch',
    title:    'Max Agent Bureau kennenlernen',
    subtitle: 'Sehen Sie, wie ein überwachter KI-Stabschef Ihren Betrieb unterstützt — Nachverfolgungen, Genehmigungen, Prioritäten. Kein Commitment erforderlich.',
  },
  'restaurant-os': {
    name:     'RestaurantOS',
    eyebrow:  '// RestaurantOS — Demo-Anfrage',
    title:    'RestaurantOS für Ihr Restaurant',
    subtitle: 'Zeigen Sie uns Ihren Betrieb. Wir richten eine Demo ein, die Ihrem Restaurant entspricht — QR-Bestellung, Küchenrouting und Abrechnung.',
  },
  'handwerk-os': {
    name:     'HandwerkOS',
    eyebrow:  '// HandwerkOS — Walkthrough anfragen',
    title:    'HandwerkOS für Ihren Handwerksbetrieb',
    subtitle: 'Walkthrough des Live-Systems — Auftragserfassung, Angebote, XRechnung-Export. Konfiguriert für Ihren Betriebstyp.',
  },
  'praxis-os': {
    name:     'PraxisOS',
    eyebrow:  '// PraxisOS — Beratungsgespräch',
    title:    'PraxisOS für Ihre Praxis',
    subtitle: 'Sehen Sie das System in Aktion — Terminverwaltung, Patientenakte, Abrechnung. Wir zeigen Ihnen den Ablauf live.',
  },
  'printshop': {
    name:     'PrintShopOS',
    eyebrow:  '// PrintShopOS — Demo-Anfrage',
    title:    'PrintShopOS für Ihre Druckerei',
    subtitle: 'Zeigen Sie uns Ihren Auftragsfluss. Wir konfigurieren eine Demo für Ihren spezifischen Druckbetrieb.',
  },
  'care-os': {
    name:     'CareOS',
    eyebrow:  '// CareOS — Walkthrough anfragen',
    title:    'CareOS für Ihre Pflegeeinrichtung',
    subtitle: 'Walkthrough des Live-Systems — Einsatzplanung, Dokumentation, Abrechnung. Konfiguriert für Ihren Pflegebetrieb.',
  },
  'real-estate-os': {
    name:     'RealEstateOS',
    eyebrow:  '// RealEstateOS — Beratungsgespräch',
    title:    'RealEstateOS für Ihr Immobilienunternehmen',
    subtitle: 'Sehen Sie das Verwaltungs- und Automatisierungssystem live — Exposés, Mieter, Abrechnungen.',
  },
  'publishing-os': {
    name:     'PublishingOS',
    eyebrow:  '// PublishingOS — Demo-Anfrage',
    title:    'PublishingOS für Ihren Verlag',
    subtitle: 'Zeigen Sie uns Ihren Redaktionsablauf. Wir konfigurieren das System für Ihren Verlagstyp.',
  },
  'taxkontrol': {
    name:     'TaxKontrol',
    eyebrow:  '// TaxKontrol — Walkthrough anfragen',
    title:    'TaxKontrol für Ihr Unternehmen',
    subtitle: 'Sehen Sie das System live — Steuerrücklage, Fristen, Ausgabenerfassung — konfiguriert für Ihren Unternehmenstyp.',
  },
  'drive24': {
    name:     'Drive24',
    eyebrow:  '// Drive24 — Zugang anfragen',
    title:    'Drive24 — Fahrervermittlung',
    subtitle: 'Sprechen Sie mit uns über Fahrerzugang oder Partnerschaft.',
  },
}

interface FormData {
  name: string
  email: string
  organisation: string
  message: string
  automation: string
  system: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const mono    = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans    = { fontFamily: 'var(--font-inter)' } as const

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
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

export default function ContactPage() {
  const t = useTranslations('contact')
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    organisation: '',
    message: '',
    automation: '',
    system: '',
  })
  const [systemCtx, setSystemCtx] = useState<SystemContext | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const automation = params.get('automation')
    const system = params.get('system')
    if (automation) {
      setForm((prev) => ({ ...prev, automation }))
    }
    if (system) {
      setForm((prev) => ({ ...prev, system }))
      setSystemCtx(SYSTEM_CONTEXT[system] ?? null)
    }
  }, [])

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isValid = form.name && form.email && form.organisation && form.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organisation: form.organisation,
          message: form.message,
          automation: form.automation || undefined,
          system: form.system || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('errorGeneric'))
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('errorGeneric'))
      setStatus('error')
    }
  }

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
  }
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
    e.currentTarget.style.boxShadow = 'none'
  }

  const infoCards = [
    {
      icon: '⚡',
      titleKey: 'cardAuditTitle' as const,
      descKey: 'cardAuditDesc' as const,
      href: '/automation-audit',
      ctaKey: 'cardAuditCta' as const,
    },
    {
      icon: '◻',
      titleKey: 'cardChatTitle' as const,
      descKey: 'cardChatDesc' as const,
      href: undefined,
      ctaKey: undefined,
    },
    {
      icon: '▸',
      titleKey: 'cardResponseTitle' as const,
      descKey: 'cardResponseDesc' as const,
      href: undefined,
      ctaKey: undefined,
    },
  ]

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>
      {/* Header — adapts dynamically when ?system= is present */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {systemCtx ? systemCtx.eyebrow : t('eyebrow')}
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            {systemCtx ? systemCtx.title : t('title')}
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.7 }}>
            {systemCtx ? systemCtx.subtitle : t('subtitle')}
          </p>
          {systemCtx && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '1.5rem', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '6px', padding: '6px 14px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.08em' }}>
                {systemCtx.name}
              </span>
            </div>
          )}
        </div>
      </section>

      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '44rem', margin: '0 auto' }}>

          {/* Three info cards */}
          <div
            style={{ display: 'grid', gap: '12px', marginBottom: '3rem' }}
            className="grid-cols-1 sm:grid-cols-3"
          >
            {infoCards.map((card) => (
              <div
                key={card.titleKey}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.06)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ ...mono, fontSize: '16px', color: '#F97316' }}>{card.icon}</span>
                <p style={{ ...sans, fontWeight: 600, fontSize: '14px', color: 'hsl(40 30% 96%)', margin: 0 }}>
                  {t(card.titleKey)}
                </p>
                <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 12% 65%)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                  {t(card.descKey)}
                </p>
                {card.href && card.ctaKey && (
                  <Link
                    href={card.href}
                    style={{ ...mono, fontSize: '12px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', marginTop: '6px' }}
                  >
                    {t(card.ctaKey)}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Centered form */}
          <div>
            {status === 'success' ? (
              <div
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '3rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</p>
                <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '28px', color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                  {t('successTitle')}
                </h2>
                <p style={{ ...sans, fontSize: '17px', color: '#F97316', marginBottom: '8px', lineHeight: 1.7, fontWeight: 500 }}>
                  {t('successDesc')}
                </p>
                <p style={{ ...sans, fontSize: '14px', color: '#888888', marginBottom: '1.5rem' }}>
                  {t('successDirect')}{' '}
                  <a href="mailto:info@maxpromo.digital" style={{ color: '#F97316', textDecoration: 'none' }}>
                    info@maxpromo.digital
                  </a>
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ name: '', email: '', organisation: '', message: '', automation: '', system: form.system }) }}
                  style={{ ...mono, fontSize: '13px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}
                >
                  {t('successAnother')}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {status === 'error' && (
                  <div
                    style={{
                      background: 'rgba(204,0,0,0.1)',
                      border: '1px solid rgba(204,0,0,0.3)',
                      color: '#FF6666',
                      ...sans,
                      fontSize: '14px',
                      padding: '12px 16px',
                      borderRadius: '2px',
                    }}
                  >
                    {errorMsg || t('errorGeneric')}
                  </div>
                )}

                {systemCtx && (
                  <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }} />
                    <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.05em', margin: 0 }}>
                      System: {systemCtx.name}
                    </p>
                  </div>
                )}

                {form.automation && (
                  <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '10px 14px', borderRadius: '2px' }}>
                    <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.05em' }}>
                      {t('formAutomationLabel')} {form.automation}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '20px' }} className="grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {t('formName')} <span style={{ color: '#F97316' }}>{t('formRequired')}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder={t('formNamePlaceholder')}
                      style={inputBase}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                  <div>
                    <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {t('formEmail')} <span style={{ color: '#F97316' }}>{t('formRequired')}</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder={t('formEmailPlaceholder')}
                      style={inputBase}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {t('formOrg')} <span style={{ color: '#F97316' }}>{t('formRequired')}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.organisation}
                    onChange={(e) => update('organisation', e.target.value)}
                    placeholder={t('formOrgPlaceholder')}
                    style={inputBase}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                <div>
                  <label style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#888888', display: 'block', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {t('formMessage')} <span style={{ color: '#F97316' }}>{t('formRequired')}</span>
                  </label>
                  <VoiceInputWidget
                    value={form.message}
                    onChange={(v) => update('message', v)}
                    rows={5}
                    placeholder={t('formMessagePlaceholder')}
                    context="Contact message describing the project or enquiry for Maxpromo Digital"
                    textareaStyle={{ ...inputBase, resize: 'none' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  style={{
                    ...mono,
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#000000',
                    background: !isValid || status === 'loading' ? 'rgba(249,115,22,0.3)' : '#F97316',
                    border: 'none',
                    padding: '16px 28px',
                    cursor: !isValid || status === 'loading' ? 'not-allowed' : 'pointer',
                    width: '100%',
                    borderRadius: '2px',
                    boxShadow: !isValid || status === 'loading' ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {status === 'loading' ? t('formCtaSending') : t('formCta')}
                </button>

                <p style={{ ...mono, fontSize: '11px', color: '#555555', textAlign: 'center', letterSpacing: '0.05em' }}>
                  {t('formPrivacy')}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
