'use client'

import { useState } from 'react'

const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

// ─── Types ────────────────────────────────────────────────────────────────────

type PackageId = 'starter' | 'business' | 'professional'
type DomainOpt = 'own' | 'de' | 'com' | 'both'
type HostingOpt = 'own' | 'shared' | 'premium'
type MaintenanceOpt = 'none' | 'basic' | 'full'
type BusinessType = 'cleaning' | 'handwerk' | 'both'

// ─── Pricing data ─────────────────────────────────────────────────────────────

interface Package {
  label: string
  price: number
  priceLabel: string
  delivery: string
  recommended?: boolean
  includes: string[]
}

const PACKAGES: Record<PackageId, Package> = {
  starter: {
    label: 'STARTER',
    price: 799,
    priceLabel: 'ab €799',
    delivery: '7–10 Tage',
    includes: [
      '3 Seiten (Home, Leistungen, Kontakt)',
      'Mobil-optimiert',
      'Kontaktformular',
      'Google Maps',
      'SSL + DSGVO',
      '1 Korrektur-Runde',
    ],
  },
  business: {
    label: 'BUSINESS',
    price: 1499,
    priceLabel: 'ab €1.499',
    delivery: '14–21 Tage',
    recommended: true,
    includes: [
      'Alles aus Starter, plus:',
      'Bis zu 8 Seiten',
      'Angebots-/Buchungsformular',
      'Galerie (Vorher & Nachher)',
      'Kundenstimmen',
      'Google Reviews Integration',
      'Blog-Einrichtung',
      '2 Korrektur-Runden',
    ],
  },
  professional: {
    label: 'PROFESSIONAL',
    price: 2999,
    priceLabel: 'ab €2.999',
    delivery: '3–5 Wochen',
    includes: [
      'Alles aus Business, plus:',
      'Bis zu 20 Seiten',
      'Online-Buchungssystem',
      'Kundenportal / Login',
      'KI-Chatbot (Max)',
      'Mehrsprachig (DE + EN)',
      'SEO-Optimierung',
      '3 Korrektur-Runden',
    ],
  },
}

const PACKAGE_ORDER: PackageId[] = ['starter', 'business', 'professional']

interface Addon {
  id: string
  de: string
  en: string
  price: number
  perPage?: boolean
}

const ADDONS: Addon[] = [
  { id: 'logo', de: 'Logoerstellung', en: 'Logo Design', price: 349 },
  { id: 'brand', de: 'Markenfarben & Schriften', en: 'Brand Colours & Typography', price: 199 },
  { id: 'copy', de: 'Texterstellung', en: 'Professional Copywriting', price: 89, perPage: true },
  { id: 'lang', de: 'Zusätzliche Sprache', en: 'Extra Language (DE/EN/FR)', price: 399 },
  { id: 'booking', de: 'Online-Buchungssystem', en: 'Online Booking System', price: 599 },
  { id: 'calculator', de: 'Sofort-Preisrechner', en: 'Instant Quote Calculator', price: 349 },
  { id: 'whatsapp', de: 'WhatsApp Chat Button', en: 'WhatsApp Chat Button', price: 99 },
  { id: 'chatbot', de: 'KI-Chatbot (Max)', en: 'AI Chatbot (Max)', price: 899 },
  { id: 'social', de: 'Social-Media-Einrichtung', en: 'Social Media Setup (3 platforms)', price: 249 },
  { id: 'gmb', de: 'Google My Business Setup', en: 'Google My Business Setup', price: 149 },
  { id: 'seo', de: 'SEO-Grundpaket', en: 'Basic SEO Package', price: 399 },
  { id: 'speed', de: 'Geschwindigkeitsoptimierung', en: 'Speed Optimisation', price: 199 },
]

interface OptEntry {
  label: string
  price: number
  period: string
}

const DOMAIN_OPTS: Record<DomainOpt, OptEntry> = {
  own:  { label: 'Ich habe eine Domain / I have a domain', price: 0,  period: '' },
  de:   { label: '.de Domain',                             price: 15, period: '/Jahr' },
  com:  { label: '.com Domain',                            price: 18, period: '/Jahr' },
  both: { label: '.de + .com Domain',                      price: 30, period: '/Jahr' },
}

const HOSTING_OPTS: Record<HostingOpt, OptEntry> = {
  own:     { label: 'Ich habe Hosting / I have hosting',              price: 0,  period: '' },
  shared:  { label: 'Shared Hosting (empfohlen für Starter)',         price: 9,  period: '/Monat' },
  premium: { label: 'Premium Hosting (empfohlen für Business+)',      price: 19, period: '/Monat' },
}

const MAINTENANCE_OPTS: Record<MaintenanceOpt, OptEntry> = {
  none:  { label: 'Kein Wartungsvertrag',                             price: 0,   period: '' },
  basic: { label: 'Basis: Updates + Backups',                         price: 59,  period: '/Monat' },
  full:  { label: 'Komplett: Updates + Support + monatl. Änderungen', price: 149, period: '/Monat' },
}

const DOMAIN_ORDER: DomainOpt[] = ['own', 'de', 'com', 'both']
const HOSTING_ORDER: HostingOpt[] = ['own', 'shared', 'premium']
const MAINTENANCE_ORDER: MaintenanceOpt[] = ['none', 'basic', 'full']

const fmt = (n: number) => `€${n.toLocaleString('de-DE')}`

// ─── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: mono,
        fontSize: '10px',
        color: '#F97316',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        margin: '0 0 20px',
      }}
    >
      {children}
    </p>
  )
}

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#111111',
        borderTop: '2px solid #F97316',
        padding: '28px',
        marginBottom: '20px',
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#888',
          display: 'block',
          marginBottom: '6px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label} {required && <span style={{ color: '#F97316' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: sans, fontSize: '11px', color: '#F97316', margin: '4px 0 0' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#FFF',
        fontFamily: sans,
        fontSize: '14px',
        padding: '10px 14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 150ms',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.06)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  )
}

function RadioOption({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.02)',
        border: selected ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.08)',
        color: selected ? '#FFF' : '#888',
        fontFamily: sans,
        fontSize: '13px',
        padding: '10px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 150ms',
      }}
    >
      {label}
    </button>
  )
}

// ─── Price Panel ──────────────────────────────────────────────────────────────

interface PricePanelProps {
  selectedPkg: PackageId | null
  activeAddons: Set<string>
  copyPages: number
  domainOpt: DomainOpt
  hostingOpt: HostingOpt
  maintenanceOpt: MaintenanceOpt
}

function PricePanel({
  selectedPkg,
  activeAddons,
  copyPages,
  domainOpt,
  hostingOpt,
  maintenanceOpt,
}: PricePanelProps) {
  const pkg = selectedPkg ? PACKAGES[selectedPkg] : null
  const pkgPrice = pkg?.price ?? 0

  const addonTotal = ADDONS.reduce((sum, a) => {
    if (!activeAddons.has(a.id)) return sum
    return sum + (a.perPage ? a.price * copyPages : a.price)
  }, 0)

  const oneTime = pkgPrice + addonTotal
  const monthly = HOSTING_OPTS[hostingOpt].price + MAINTENANCE_OPTS[maintenanceOpt].price
  const annual = DOMAIN_OPTS[domainOpt].price

  interface LineItem { label: string; value: string }
  const lineItems: LineItem[] = []

  if (pkg) lineItems.push({ label: `Paket: ${pkg.label}`, value: fmt(pkg.price) })

  ADDONS.forEach((a) => {
    if (!activeAddons.has(a.id)) return
    const price = a.perPage ? a.price * copyPages : a.price
    lineItems.push({ label: a.de, value: `+${fmt(price)}` })
  })

  if (DOMAIN_OPTS[domainOpt].price > 0) {
    const tag = domainOpt === 'both' ? '.de + .com' : `.${domainOpt}`
    lineItems.push({ label: `Domain (${tag})`, value: `${fmt(annual)}/Jahr` })
  }

  if (HOSTING_OPTS[hostingOpt].price > 0) {
    const hLabel = hostingOpt === 'shared' ? 'Shared Hosting' : 'Premium Hosting'
    lineItems.push({ label: hLabel, value: `${fmt(HOSTING_OPTS[hostingOpt].price)}/Mon` })
  }

  if (MAINTENANCE_OPTS[maintenanceOpt].price > 0) {
    const mLabel = maintenanceOpt === 'basic' ? 'Wartung Basis' : 'Wartung Komplett'
    lineItems.push({ label: mLabel, value: `${fmt(MAINTENANCE_OPTS[maintenanceOpt].price)}/Mon` })
  }

  const delivery = pkg?.delivery ?? '—'

  return (
    <div
      className="price-panel"
      style={{
        background: '#111111',
        borderTop: '2px solid #F97316',
        padding: '24px',
        boxShadow: '0 0 40px rgba(249,115,22,0.06)',
      }}
    >
      <p
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#F97316',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          margin: '0 0 4px',
        }}
      >
        IHR ANGEBOT / YOUR ESTIMATE
      </p>
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#444', margin: '0 0 20px' }}>
        // Preis wird sofort berechnet
      </p>

      {lineItems.length === 0 ? (
        <p style={{ fontFamily: sans, fontSize: '13px', color: '#444', margin: '0 0 20px', lineHeight: 1.5 }}>
          Wählen Sie ein Paket,<br />um Ihr Angebot zu sehen.
        </p>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {lineItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '7px 0',
                borderBottom:
                  i < lineItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <span style={{ fontFamily: sans, fontSize: '12px', color: '#888', flex: 1 }}>
                {item.label}
              </span>
              <span
                style={{ fontFamily: mono, fontSize: '12px', color: '#FFF', flexShrink: 0 }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
        >
          <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>
            Einmalig / One-time:
          </span>
          <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>
            {fmt(oneTime)}
          </span>
        </div>
        {monthly > 0 && (
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
          >
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>
              Monatlich / Monthly:
            </span>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>
              {fmt(monthly)}/Mon
            </span>
          </div>
        )}
        {annual > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>
              Jährlich / Annual:
            </span>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>
              {fmt(annual)}/Jahr
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.25)',
          padding: '20px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: grotesk,
            fontSize: '36px',
            fontWeight: 700,
            color: '#F97316',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          {fmt(oneTime)}
        </p>
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: 0 }}>
          einmalig / one-time
        </p>
        {monthly > 0 && (
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: '6px 0 0' }}>
            +{fmt(monthly)}/Monat laufend
          </p>
        )}
      </div>

      {pkg && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '8px 12px',
            fontFamily: mono,
            fontSize: '11px',
            color: '#666',
          }}
        >
          ⏱ Lieferzeit: {delivery}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EstimatePage() {
  // Contact
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType | ''>('')
  const [ownDomain, setOwnDomain] = useState('')

  // Package
  const [selectedPkg, setSelectedPkg] = useState<PackageId | null>(null)

  // Add-ons
  const [activeAddons, setActiveAddons] = useState<Set<string>>(new Set())
  const [copyPages, setCopyPages] = useState(1)

  // Hosting & Domain
  const [domainOpt, setDomainOpt] = useState<DomainOpt>('own')
  const [hostingOpt, setHostingOpt] = useState<HostingOpt>('own')
  const [maintenanceOpt, setMaintenanceOpt] = useState<MaintenanceOpt>('none')

  // UI
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleAddon = (id: string) => {
    setActiveAddons((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Computed totals
  const pkgPrice = selectedPkg ? PACKAGES[selectedPkg].price : 0
  const addonTotal = ADDONS.reduce((sum, a) => {
    if (!activeAddons.has(a.id)) return sum
    return sum + (a.perPage ? a.price * copyPages : a.price)
  }, 0)
  const oneTime = pkgPrice + addonTotal
  const monthly = HOSTING_OPTS[hostingOpt].price + MAINTENANCE_OPTS[maintenanceOpt].price
  const annual = DOMAIN_OPTS[domainOpt].price

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!businessName.trim()) errs.businessName = 'Firmenname erforderlich'
    if (!contactName.trim()) errs.contactName = 'Name erforderlich'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Gültige E-Mail erforderlich'
    if (!selectedPkg) errs.pkg = 'Bitte wählen Sie ein Paket aus'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const addonSummary = ADDONS.filter((a) => activeAddons.has(a.id))
    .map((a) => {
      const price = a.perPage ? a.price * copyPages : a.price
      return `${a.de} (${fmt(price)})`
    })
    .join(', ')

  const handleEmailSend = async () => {
    if (!validate()) return
    setSending(true)
    setErrors({})
    try {
      const res = await fetch('/api/estimate/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: contactName,
          clientEmail: email,
          clientPhone: phone,
          businessName,
          businessType,
          city,
          pkg: selectedPkg ? PACKAGES[selectedPkg].label : '',
          pkgPrice,
          addons: ADDONS.filter((a) => activeAddons.has(a.id)).map((a) => ({
            label: a.de,
            price: a.perPage ? a.price * copyPages : a.price,
          })),
          domain: {
            label: DOMAIN_OPTS[domainOpt].label,
            price: DOMAIN_OPTS[domainOpt].price,
            period: DOMAIN_OPTS[domainOpt].period,
          },
          hosting: {
            label: HOSTING_OPTS[hostingOpt].label,
            price: HOSTING_OPTS[hostingOpt].price,
            period: HOSTING_OPTS[hostingOpt].period,
          },
          maintenance: {
            label: MAINTENANCE_OPTS[maintenanceOpt].label,
            price: MAINTENANCE_OPTS[maintenanceOpt].price,
            period: MAINTENANCE_OPTS[maintenanceOpt].period,
          },
          totals: { oneTime, monthly, annual },
        }),
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
    } catch {
      setErrors((prev) => ({
        ...prev,
        send: 'E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.',
      }))
    } finally {
      setSending(false)
    }
  }

  const handleWhatsApp = () => {
    if (!validate()) return
    const pkgLabel = selectedPkg ? PACKAGES[selectedPkg].label : '—'
    const msg = `Hallo Marcel,

ich habe gerade das Angebot auf maxpromo.digital ausgefüllt.

Firmenname: ${businessName}
Paket: ${pkgLabel}
Add-ons: ${addonSummary || 'keine'}

Gesamtkosten einmalig: ${fmt(oneTime)}${monthly > 0 ? `\nMonatlich: ${fmt(monthly)}/Mon` : ''}

Bitte melde dich bei mir.

${contactName} — ${phone || email}`
    window.open(`https://wa.me/491733645698?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          background: '#0A0A0A',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(249,115,22,0.12)',
            border: '2px solid #F97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: '#F97316',
            marginBottom: '24px',
          }}
        >
          ✓
        </div>
        <h2
          style={{
            fontFamily: grotesk,
            fontWeight: 700,
            fontSize: '24px',
            color: '#FFF',
            margin: '0 0 8px',
            textAlign: 'center',
          }}
        >
          Vielen Dank, {contactName}!
        </h2>
        <p
          style={{
            fontFamily: sans,
            fontSize: '15px',
            color: '#888',
            textAlign: 'center',
            maxWidth: '380px',
            margin: '0 0 6px',
          }}
        >
          Ihr Angebot wurde gesendet.
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: '14px',
            color: '#555',
            textAlign: 'center',
          }}
        >
          Marcel meldet sich innerhalb von 24 Stunden.
        </p>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .est-grid {
          display: grid;
          grid-template-columns: 60% 1fr;
          gap: 32px;
          align-items: start;
        }
        .price-panel {
          position: sticky;
          top: 80px;
        }
        @media (max-width: 820px) {
          .est-grid {
            grid-template-columns: 1fr;
          }
          .price-panel {
            position: static;
            order: 99;
          }
        }
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .est-grid { display: block !important; }
          .price-panel { position: static !important; }
          nav, footer { display: none !important; }
        }
        input::placeholder { color: #444; }
      `}</style>

      <main style={{ background: '#0A0A0A', minHeight: '100vh' }}>
        {/* Page header */}
        <div
          className="no-print"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '28px 32px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              fontFamily: grotesk,
              fontWeight: 700,
              fontSize: '18px',
              color: '#FFF',
              margin: 0,
            }}
          >
            MaxPromo<span style={{ color: '#F97316' }}>.</span>Digital
          </p>
          <p
            style={{
              fontFamily: mono,
              fontSize: '11px',
              color: '#666',
              margin: 0,
              letterSpacing: '0.08em',
            }}
          >
            Sofortangebot / Instant Estimate
          </p>
        </div>

        {/* Orange divider */}
        <div
          style={{
            height: '2px',
            background: 'linear-gradient(90deg, #F97316 0%, rgba(249,115,22,0.15) 100%)',
            maxWidth: '1200px',
            margin: '16px auto 0',
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px 32px 8px',
          }}
        >
          <p
            style={{
              fontFamily: sans,
              fontSize: '14px',
              color: '#666',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Füllen Sie das Formular aus — Ihr Preis wird sofort berechnet.
            <br />
            Fill in the form — your price is calculated instantly.
          </p>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px 32px 80px',
          }}
        >
          <div className="est-grid">
            {/* ── Left: form sections ── */}
            <div>
              {/* Section A — Contact */}
              <SectionCard label="KONTAKT / CONTACT INFO">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0 16px',
                  }}
                >
                  <Field
                    label="Firmenname / Business Name"
                    required
                    error={errors.businessName}
                  >
                    <TextInput
                      value={businessName}
                      onChange={setBusinessName}
                      placeholder="Muster GmbH"
                    />
                  </Field>
                  <Field
                    label="Ansprechpartner / Contact Name"
                    required
                    error={errors.contactName}
                  >
                    <TextInput
                      value={contactName}
                      onChange={setContactName}
                      placeholder="Max Mustermann"
                    />
                  </Field>
                  <Field label="E-Mail" required error={errors.email}>
                    <TextInput
                      value={email}
                      onChange={setEmail}
                      placeholder="max@firma.de"
                      type="email"
                    />
                  </Field>
                  <Field label="Telefon / WhatsApp">
                    <TextInput
                      value={phone}
                      onChange={setPhone}
                      placeholder="+49 123 456789"
                      type="tel"
                    />
                  </Field>
                  <Field label="Stadt / City">
                    <TextInput value={city} onChange={setCity} placeholder="Essen" />
                  </Field>
                </div>

                {/* Business type radio cards */}
                <div style={{ marginTop: '4px' }}>
                  <p
                    style={{
                      fontFamily: mono,
                      fontSize: '10px',
                      color: '#888',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      margin: '0 0 8px',
                    }}
                  >
                    Branche / Business Type
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(
                      [
                        { id: 'cleaning' as BusinessType, label: 'Reinigung / Cleaning' },
                        { id: 'handwerk' as BusinessType, label: 'Handwerk / Trade' },
                        { id: 'both' as BusinessType, label: 'Beides / Both' },
                      ] as const
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBusinessType(b.id)}
                        style={{
                          flex: 1,
                          background:
                            businessType === b.id
                              ? 'rgba(249,115,22,0.12)'
                              : 'rgba(255,255,255,0.02)',
                          border:
                            businessType === b.id
                              ? '1px solid #F97316'
                              : '1px solid rgba(255,255,255,0.08)',
                          color: businessType === b.id ? '#FFF' : '#888',
                          fontFamily: sans,
                          fontSize: '12px',
                          padding: '10px 6px',
                          cursor: 'pointer',
                          transition: 'all 150ms',
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Section B — Package */}
              <SectionCard label="PAKET / PACKAGE">
                {errors.pkg && (
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: '11px',
                      color: '#F97316',
                      margin: '0 0 12px',
                    }}
                  >
                    {errors.pkg}
                  </p>
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                  }}
                >
                  {PACKAGE_ORDER.map((id) => {
                    const pkg = PACKAGES[id]
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedPkg(id)}
                        style={{
                          background:
                            selectedPkg === id
                              ? 'rgba(249,115,22,0.1)'
                              : 'rgba(255,255,255,0.02)',
                          border:
                            selectedPkg === id
                              ? '1px solid #F97316'
                              : '1px solid rgba(255,255,255,0.08)',
                          padding: '16px 14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 150ms',
                          position: 'relative',
                          boxShadow:
                            selectedPkg === id
                              ? '0 0 24px rgba(249,115,22,0.1)'
                              : 'none',
                        }}
                      >
                        {pkg.recommended && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-9px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#F97316',
                              color: '#000',
                              fontFamily: mono,
                              fontSize: '8px',
                              padding: '2px 8px',
                              letterSpacing: '0.1em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            EMPFOHLEN
                          </span>
                        )}
                        <p
                          style={{
                            fontFamily: mono,
                            fontSize: '10px',
                            color: selectedPkg === id ? '#F97316' : '#888',
                            letterSpacing: '0.15em',
                            margin: '0 0 6px',
                          }}
                        >
                          {pkg.label}
                        </p>
                        <p
                          style={{
                            fontFamily: grotesk,
                            fontWeight: 700,
                            fontSize: '20px',
                            color: '#FFF',
                            margin: '0 0 12px',
                          }}
                        >
                          {pkg.priceLabel}
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                          {pkg.includes.map((item, i) => (
                            <li
                              key={i}
                              style={{
                                fontFamily: sans,
                                fontSize: '11px',
                                color: item.startsWith('Alles') ? '#F97316' : '#666',
                                padding: '2px 0',
                                paddingLeft: item.startsWith('Alles') ? '0' : '14px',
                                position: 'relative',
                                fontWeight: item.startsWith('Alles') ? 500 : 400,
                              }}
                            >
                              {!item.startsWith('Alles') && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    color: '#F97316',
                                    fontSize: '10px',
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                              {item}
                            </li>
                          ))}
                        </ul>
                        <p
                          style={{
                            fontFamily: mono,
                            fontSize: '9px',
                            color: '#444',
                            margin: 0,
                            letterSpacing: '0.08em',
                          }}
                        >
                          ⏱ {pkg.delivery}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>

              {/* Section C — Add-ons */}
              <SectionCard label="EXTRAS / ADD-ONS">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {ADDONS.map((addon) => {
                    const active = activeAddons.has(addon.id)
                    return (
                      <div key={addon.id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                          >
                            {/* Toggle switch */}
                            <button
                              type="button"
                              onClick={() => toggleAddon(addon.id)}
                              aria-pressed={active}
                              aria-label={`Toggle ${addon.de}`}
                              style={{
                                width: '40px',
                                height: '22px',
                                borderRadius: '11px',
                                background: active
                                  ? '#F97316'
                                  : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                position: 'relative',
                                flexShrink: 0,
                                transition: 'background 150ms',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '3px',
                                  left: active ? '21px' : '3px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: '#FFF',
                                  transition: 'left 150ms',
                                  display: 'block',
                                }}
                              />
                            </button>
                            <p
                              style={{
                                fontFamily: sans,
                                fontSize: '13px',
                                color: active ? '#FFF' : '#777',
                                margin: 0,
                                transition: 'color 150ms',
                              }}
                            >
                              {addon.de}{' '}
                              <span style={{ color: '#444', fontSize: '11px' }}>
                                / {addon.en}
                              </span>
                            </p>
                          </div>
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: '12px',
                              color: active ? '#F97316' : '#444',
                              flexShrink: 0,
                              transition: 'color 150ms',
                            }}
                          >
                            +{fmt(addon.price)}
                            {addon.perPage ? '/Seite' : ''}
                          </span>
                        </div>

                        {/* Copywriting page stepper */}
                        {addon.perPage && active && (
                          <div
                            style={{
                              padding: '8px 0 10px 52px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: mono,
                                fontSize: '10px',
                                color: '#888',
                              }}
                            >
                              Anzahl Seiten:
                            </span>
                            <button
                              type="button"
                              onClick={() => setCopyPages((p) => Math.max(1, p - 1))}
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: 'none',
                                color: '#FFF',
                                width: '26px',
                                height: '26px',
                                cursor: 'pointer',
                                fontFamily: mono,
                                fontSize: '16px',
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontFamily: mono,
                                fontSize: '15px',
                                color: '#FFF',
                                minWidth: '24px',
                                textAlign: 'center',
                              }}
                            >
                              {copyPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCopyPages((p) => Math.min(10, p + 1))}
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: 'none',
                                color: '#FFF',
                                width: '26px',
                                height: '26px',
                                cursor: 'pointer',
                                fontFamily: mono,
                                fontSize: '16px',
                              }}
                            >
                              +
                            </button>
                            <span
                              style={{
                                fontFamily: mono,
                                fontSize: '11px',
                                color: '#F97316',
                              }}
                            >
                              = {fmt(addon.price * copyPages)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              {/* Section D — Hosting & Domain */}
              <SectionCard label="HOSTING & DOMAIN">
                {/* Domain */}
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: '10px',
                    color: '#888',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px',
                  }}
                >
                  Domain
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '24px',
                  }}
                >
                  {DOMAIN_ORDER.map((id) => {
                    const opt = DOMAIN_OPTS[id]
                    return (
                      <div key={id}>
                        <RadioOption
                          label={
                            opt.price > 0
                              ? `${opt.label} — +${fmt(opt.price)}${opt.period}`
                              : opt.label
                          }
                          selected={domainOpt === id}
                          onClick={() => setDomainOpt(id)}
                        />
                        {id === 'own' && domainOpt === 'own' && (
                          <div style={{ marginTop: '6px', paddingLeft: '6px' }}>
                            <TextInput
                              value={ownDomain}
                              onChange={setOwnDomain}
                              placeholder="meinefirma.de"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Hosting */}
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: '10px',
                    color: '#888',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px',
                  }}
                >
                  Hosting
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '24px',
                  }}
                >
                  {HOSTING_ORDER.map((id) => {
                    const opt = HOSTING_OPTS[id]
                    return (
                      <RadioOption
                        key={id}
                        label={
                          opt.price > 0
                            ? `${opt.label} — +${fmt(opt.price)}${opt.period}`
                            : opt.label
                        }
                        selected={hostingOpt === id}
                        onClick={() => setHostingOpt(id)}
                      />
                    )
                  })}
                </div>

                {/* Maintenance */}
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: '10px',
                    color: '#888',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px',
                  }}
                >
                  Wartung / Maintenance
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {MAINTENANCE_ORDER.map((id) => {
                    const opt = MAINTENANCE_OPTS[id]
                    return (
                      <RadioOption
                        key={id}
                        label={
                          opt.price > 0
                            ? `${opt.label} — +${fmt(opt.price)}${opt.period}`
                            : opt.label
                        }
                        selected={maintenanceOpt === id}
                        onClick={() => setMaintenanceOpt(id)}
                      />
                    )
                  })}
                </div>
              </SectionCard>

              {/* Section E — Send */}
              <SectionCard label="ANGEBOT SENDEN / SEND ESTIMATE">
                {errors.send && (
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: '12px',
                      color: '#F97316',
                      margin: '0 0 12px',
                    }}
                  >
                    {errors.send}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => void handleEmailSend()}
                    disabled={sending}
                    style={{
                      background: '#F97316',
                      border: 'none',
                      color: '#000',
                      fontFamily: mono,
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.08em',
                      padding: '15px 20px',
                      cursor: sending ? 'not-allowed' : 'pointer',
                      opacity: sending ? 0.6 : 1,
                      textAlign: 'left',
                      transition: 'opacity 150ms',
                      boxShadow: '0 4px 20px rgba(249,115,22,0.2)',
                    }}
                  >
                    {sending ? 'Wird gesendet…' : '✉  Per E-Mail senden / Send by Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    style={{
                      background: 'rgba(37,211,102,0.08)',
                      border: '1px solid rgba(37,211,102,0.25)',
                      color: '#25D366',
                      fontFamily: mono,
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.08em',
                      padding: '15px 20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                  >
                    Per WhatsApp senden / Send via WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="no-print"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#666',
                      fontFamily: mono,
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.08em',
                      padding: '15px 20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                  >
                    Als PDF speichern / Save as PDF
                  </button>
                </div>

                <p
                  style={{
                    fontFamily: mono,
                    fontSize: '10px',
                    color: '#333',
                    margin: '16px 0 0',
                    letterSpacing: '0.06em',
                  }}
                >
                  // Angebot gilt 30 Tage · Zahlung 50/50
                </p>
              </SectionCard>
            </div>

            {/* ── Right: sticky price panel ── */}
            <div>
              <PricePanel
                selectedPkg={selectedPkg}
                activeAddons={activeAddons}
                copyPages={copyPages}
                domainOpt={domainOpt}
                hostingOpt={hostingOpt}
                maintenanceOpt={maintenanceOpt}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
