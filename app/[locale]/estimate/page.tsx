'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

/* ─── Locale helper ───────────────────────────────────────────────────────────
 * Same inline pattern the sibling funnel page (/discovery) uses, so both tool
 * pages localize the same way. Marketing content pages use the next-intl
 * catalog; these interactive calculators read the locale and pick one language.
 */
type Loc = 'de' | 'en'
const pick = (loc: Loc, de: string, en: string) => (loc === 'de' ? de : en)

// ─── Types ────────────────────────────────────────────────────────────────────

type PackageId = 'starter' | 'business' | 'professional'
type DomainOpt = 'own' | 'de' | 'com' | 'both'
type HostingOpt = 'own' | 'shared' | 'premium'
type MaintenanceOpt = 'none' | 'basic' | 'full'
type BusinessType = 'cleaning' | 'handwerk' | 'both'

// ─── Pricing data (locale-aware) ──────────────────────────────────────────────

interface Package {
  label: string
  price: number
  delivery: { de: string; en: string }
  recommended?: boolean
  includes: { de: string; en: string }[]
}

const PACKAGES: Record<PackageId, Package> = {
  starter: {
    label: 'STARTER',
    price: 799,
    delivery: { de: '7-10 Tage', en: '7-10 days' },
    includes: [
      { de: '3 Seiten (Home, Leistungen, Kontakt)', en: '3 pages (home, services, contact)' },
      { de: 'Mobil-optimiert', en: 'Mobile-optimised' },
      { de: 'Kontaktformular', en: 'Contact form' },
      { de: 'Google Maps', en: 'Google Maps' },
      { de: 'SSL + DSGVO', en: 'SSL + GDPR' },
      { de: '1 Korrektur-Runde', en: '1 revision round' },
    ],
  },
  business: {
    label: 'BUSINESS',
    price: 1499,
    delivery: { de: '14-21 Tage', en: '14-21 days' },
    recommended: true,
    includes: [
      { de: 'Alles aus Starter, plus:', en: 'Everything in Starter, plus:' },
      { de: 'Bis zu 8 Seiten', en: 'Up to 8 pages' },
      { de: 'Angebots-/Buchungsformular', en: 'Quote / booking form' },
      { de: 'Galerie (Vorher & Nachher)', en: 'Gallery (before & after)' },
      { de: 'Kundenstimmen', en: 'Testimonials' },
      { de: 'Google Reviews Integration', en: 'Google Reviews integration' },
      { de: 'Blog-Einrichtung', en: 'Blog setup' },
      { de: '2 Korrektur-Runden', en: '2 revision rounds' },
    ],
  },
  professional: {
    label: 'PROFESSIONAL',
    price: 2999,
    delivery: { de: '3-5 Wochen', en: '3-5 weeks' },
    includes: [
      { de: 'Alles aus Business, plus:', en: 'Everything in Business, plus:' },
      { de: 'Bis zu 20 Seiten', en: 'Up to 20 pages' },
      { de: 'Online-Buchungssystem', en: 'Online booking system' },
      { de: 'Kundenportal / Login', en: 'Customer portal / login' },
      { de: 'KI-Chatbot (Max)', en: 'AI chatbot (Max)' },
      { de: 'Mehrsprachig (DE + EN)', en: 'Multilingual (DE + EN)' },
      { de: 'SEO-Optimierung', en: 'SEO optimisation' },
      { de: '3 Korrektur-Runden', en: '3 revision rounds' },
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
  label: { de: string; en: string }
  price: number
  period: { de: string; en: string }
}

const noPeriod = { de: '', en: '' }

const DOMAIN_OPTS: Record<DomainOpt, OptEntry> = {
  own:  { label: { de: 'Ich habe eine Domain', en: 'I have a domain' }, price: 0,  period: noPeriod },
  de:   { label: { de: '.de Domain', en: '.de domain' },               price: 15, period: { de: '/Jahr', en: '/year' } },
  com:  { label: { de: '.com Domain', en: '.com domain' },             price: 18, period: { de: '/Jahr', en: '/year' } },
  both: { label: { de: '.de + .com Domain', en: '.de + .com domain' }, price: 30, period: { de: '/Jahr', en: '/year' } },
}

const HOSTING_OPTS: Record<HostingOpt, OptEntry> = {
  own:     { label: { de: 'Ich habe Hosting', en: 'I have hosting' },                                          price: 0,  period: noPeriod },
  shared:  { label: { de: 'Shared Hosting (empfohlen für Starter)', en: 'Shared hosting (good for Starter)' }, price: 9,  period: { de: '/Monat', en: '/month' } },
  premium: { label: { de: 'Premium Hosting (empfohlen für Business+)', en: 'Premium hosting (Business+)' },     price: 19, period: { de: '/Monat', en: '/month' } },
}

const MAINTENANCE_OPTS: Record<MaintenanceOpt, OptEntry> = {
  none:  { label: { de: 'Kein Wartungsvertrag', en: 'No maintenance plan' },                                          price: 0,   period: noPeriod },
  basic: { label: { de: 'Basis: Updates + Backups', en: 'Basic: updates + backups' },                                 price: 59,  period: { de: '/Monat', en: '/month' } },
  full:  { label: { de: 'Komplett: Updates + Support + monatl. Änderungen', en: 'Full: updates + support + monthly changes' }, price: 149, period: { de: '/Monat', en: '/month' } },
}

const DOMAIN_ORDER: DomainOpt[] = ['own', 'de', 'com', 'both']
const HOSTING_ORDER: HostingOpt[] = ['own', 'shared', 'premium']
const MAINTENANCE_ORDER: MaintenanceOpt[] = ['none', 'basic', 'full']

const makeFmt = (loc: Loc) => (n: number) =>
  `€${n.toLocaleString(loc === 'de' ? 'de-DE' : 'en-GB')}`

// ─── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 20px' }}>
      {children}
    </p>
  )
}

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111111', borderTop: '2px solid #F97316', padding: '28px', marginBottom: '20px' }}>
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
      <label style={{ fontFamily: mono, fontSize: '10px', color: '#888', display: 'block', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label} {required && <span style={{ color: '#F97316' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: sans, fontSize: '11px', color: '#F97316', margin: '4px 0 0' }}>{error}</p>
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
      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontFamily: sans, fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' }}
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
      style={{ background: selected ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.02)', border: selected ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.08)', color: selected ? '#FFF' : '#888', fontFamily: sans, fontSize: '13px', padding: '10px 14px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 150ms' }}
    >
      {label}
    </button>
  )
}

// ─── Price Panel ──────────────────────────────────────────────────────────────

interface PricePanelProps {
  loc: Loc
  selectedPkg: PackageId | null
  activeAddons: Set<string>
  copyPages: number
  domainOpt: DomainOpt
  hostingOpt: HostingOpt
  maintenanceOpt: MaintenanceOpt
}

function PricePanel({
  loc,
  selectedPkg,
  activeAddons,
  copyPages,
  domainOpt,
  hostingOpt,
  maintenanceOpt,
}: PricePanelProps) {
  const fmt = makeFmt(loc)
  const pkg = selectedPkg ? PACKAGES[selectedPkg] : null
  const pkgPrice = pkg?.price ?? 0

  const addonTotal = ADDONS.reduce((sum, a) => {
    if (!activeAddons.has(a.id)) return sum
    return sum + (a.perPage ? a.price * copyPages : a.price)
  }, 0)

  const oneTime = pkgPrice + addonTotal
  const monthly = HOSTING_OPTS[hostingOpt].price + MAINTENANCE_OPTS[maintenanceOpt].price
  const annual = DOMAIN_OPTS[domainOpt].price
  const perMonth = pick(loc, '/Mon', '/mo')
  const perYear = pick(loc, '/Jahr', '/year')

  interface LineItem { label: string; value: string }
  const lineItems: LineItem[] = []

  if (pkg) lineItems.push({ label: `${pick(loc, 'Paket', 'Package')}: ${pkg.label}`, value: fmt(pkg.price) })

  ADDONS.forEach((a) => {
    if (!activeAddons.has(a.id)) return
    const price = a.perPage ? a.price * copyPages : a.price
    lineItems.push({ label: pick(loc, a.de, a.en), value: `+${fmt(price)}` })
  })

  if (DOMAIN_OPTS[domainOpt].price > 0) {
    const tag = domainOpt === 'both' ? '.de + .com' : `.${domainOpt}`
    lineItems.push({ label: `Domain (${tag})`, value: `${fmt(annual)}${perYear}` })
  }

  if (HOSTING_OPTS[hostingOpt].price > 0) {
    const hLabel = hostingOpt === 'shared' ? 'Shared Hosting' : 'Premium Hosting'
    lineItems.push({ label: hLabel, value: `${fmt(HOSTING_OPTS[hostingOpt].price)}${perMonth}` })
  }

  if (MAINTENANCE_OPTS[maintenanceOpt].price > 0) {
    const mLabel = maintenanceOpt === 'basic'
      ? pick(loc, 'Wartung Basis', 'Maintenance Basic')
      : pick(loc, 'Wartung Komplett', 'Maintenance Full')
    lineItems.push({ label: mLabel, value: `${fmt(MAINTENANCE_OPTS[maintenanceOpt].price)}${perMonth}` })
  }

  const delivery = pkg ? pick(loc, pkg.delivery.de, pkg.delivery.en) : '-'

  return (
    <div className="price-panel" style={{ background: '#111111', borderTop: '2px solid #F97316', padding: '24px', boxShadow: '0 0 40px rgba(249,115,22,0.06)' }}>
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>
        {pick(loc, 'IHR ANGEBOT', 'YOUR ESTIMATE')}
      </p>
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#444', margin: '0 0 20px' }}>
        {pick(loc, '// Preis wird sofort berechnet', '// price updates instantly')}
      </p>

      {lineItems.length === 0 ? (
        <p style={{ fontFamily: sans, fontSize: '13px', color: '#444', margin: '0 0 20px', lineHeight: 1.5 }}>
          {pick(loc, 'Wählen Sie ein Paket,', 'Choose a package')}<br />
          {pick(loc, 'um Ihr Angebot zu sehen.', 'to see your estimate.')}
        </p>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {lineItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '7px 0', borderBottom: i < lineItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontFamily: sans, fontSize: '12px', color: '#888', flex: 1 }}>{item.label}</span>
              <span style={{ fontFamily: mono, fontSize: '12px', color: '#FFF', flexShrink: 0 }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>{pick(loc, 'Einmalig:', 'One-time:')}</span>
          <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>{fmt(oneTime)}</span>
        </div>
        {monthly > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>{pick(loc, 'Monatlich:', 'Monthly:')}</span>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>{fmt(monthly)}{perMonth}</span>
          </div>
        )}
        {annual > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>{pick(loc, 'Jährlich:', 'Annual:')}</span>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF' }}>{fmt(annual)}{perYear}</span>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
        <p style={{ fontFamily: grotesk, fontSize: '36px', fontWeight: 700, color: '#F97316', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{fmt(oneTime)}</p>
        <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: 0 }}>{pick(loc, 'einmalig', 'one-time')}</p>
        {monthly > 0 && (
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: '6px 0 0' }}>
            +{fmt(monthly)}{pick(loc, '/Monat laufend', '/month ongoing')}
          </p>
        )}
      </div>

      {pkg && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 12px', fontFamily: mono, fontSize: '11px', color: '#666' }}>
          ⏱ {pick(loc, 'Lieferzeit', 'Delivery')}: {delivery}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EstimatePage() {
  const params = useParams<{ locale: string }>()
  const loc: Loc = params?.locale === 'de' ? 'de' : 'en'
  const fmt = makeFmt(loc)

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
    if (!businessName.trim()) errs.businessName = pick(loc, 'Firmenname erforderlich', 'Business name required')
    if (!contactName.trim()) errs.contactName = pick(loc, 'Name erforderlich', 'Name required')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = pick(loc, 'Gültige E-Mail erforderlich', 'Valid email required')
    if (!selectedPkg) errs.pkg = pick(loc, 'Bitte wählen Sie ein Paket aus', 'Please choose a package')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const addonSummary = ADDONS.filter((a) => activeAddons.has(a.id))
    .map((a) => {
      const price = a.perPage ? a.price * copyPages : a.price
      return `${pick(loc, a.de, a.en)} (${fmt(price)})`
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
            label: pick(loc, a.de, a.en),
            price: a.perPage ? a.price * copyPages : a.price,
          })),
          domain: {
            label: pick(loc, DOMAIN_OPTS[domainOpt].label.de, DOMAIN_OPTS[domainOpt].label.en),
            price: DOMAIN_OPTS[domainOpt].price,
            period: pick(loc, DOMAIN_OPTS[domainOpt].period.de, DOMAIN_OPTS[domainOpt].period.en),
          },
          hosting: {
            label: pick(loc, HOSTING_OPTS[hostingOpt].label.de, HOSTING_OPTS[hostingOpt].label.en),
            price: HOSTING_OPTS[hostingOpt].price,
            period: pick(loc, HOSTING_OPTS[hostingOpt].period.de, HOSTING_OPTS[hostingOpt].period.en),
          },
          maintenance: {
            label: pick(loc, MAINTENANCE_OPTS[maintenanceOpt].label.de, MAINTENANCE_OPTS[maintenanceOpt].label.en),
            price: MAINTENANCE_OPTS[maintenanceOpt].price,
            period: pick(loc, MAINTENANCE_OPTS[maintenanceOpt].period.de, MAINTENANCE_OPTS[maintenanceOpt].period.en),
          },
          totals: { oneTime, monthly, annual },
          locale: loc,
        }),
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
    } catch {
      setErrors((prev) => ({
        ...prev,
        send: pick(loc, 'E-Mail konnte nicht gesendet werden. Bitte erneut versuchen.', 'Could not send the email. Please try again.'),
      }))
    } finally {
      setSending(false)
    }
  }

  const handleWhatsApp = () => {
    if (!validate()) return
    const pkgLabel = selectedPkg ? PACKAGES[selectedPkg].label : '-'
    const msg = pick(loc,
      `Hallo Marcel,

ich habe gerade das Angebot auf maxpromo.digital ausgefüllt.

Firmenname: ${businessName}
Paket: ${pkgLabel}
Add-ons: ${addonSummary || 'keine'}

Gesamtkosten einmalig: ${fmt(oneTime)}${monthly > 0 ? `\nMonatlich: ${fmt(monthly)}${pick(loc, '/Mon', '/mo')}` : ''}

Bitte melde dich bei mir.

${contactName}, ${phone || email}`,
      `Hi Marcel,

I just filled in the estimate on maxpromo.digital.

Business: ${businessName}
Package: ${pkgLabel}
Add-ons: ${addonSummary || 'none'}

One-time total: ${fmt(oneTime)}${monthly > 0 ? `\nMonthly: ${fmt(monthly)}/mo` : ''}

Please get back to me.

${contactName}, ${phone || email}`)
    window.open(`https://wa.me/491733645698?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: '#0A0A0A' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '2px solid #F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#F97316', marginBottom: '24px' }}>
          ✓
        </div>
        <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '24px', color: '#FFF', margin: '0 0 8px', textAlign: 'center' }}>
          {pick(loc, `Vielen Dank, ${contactName}!`, `Thank you, ${contactName}!`)}
        </h2>
        <p style={{ fontFamily: sans, fontSize: '15px', color: '#888', textAlign: 'center', maxWidth: '380px', margin: '0 0 6px' }}>
          {pick(loc, 'Ihr Angebot wurde gesendet.', 'Your estimate has been sent.')}
        </p>
        <p style={{ fontFamily: sans, fontSize: '14px', color: '#555', textAlign: 'center' }}>
          {pick(loc, 'Wir melden uns innerhalb von 24 Stunden.', 'We will get back to you within 24 hours.')}
        </p>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .est-grid { display: grid; grid-template-columns: 60% 1fr; gap: 32px; align-items: start; }
        .price-panel { position: sticky; top: 80px; }
        @media (max-width: 820px) {
          .est-grid { grid-template-columns: 1fr; }
          .price-panel { position: static; order: 99; }
        }
        @media (max-width: 480px) {
          .est-contact-grid { grid-template-columns: 1fr !important; }
          .est-package-grid { grid-template-columns: 1fr !important; }
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
        <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '18px', color: '#FFF', margin: 0 }}>
            MaxPromo<span style={{ color: '#F97316' }}>.</span>Digital
          </p>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#666', margin: 0, letterSpacing: '0.08em' }}>
            {pick(loc, 'Sofortangebot', 'Instant Estimate')}
          </p>
        </div>

        {/* Orange divider */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #F97316 0%, rgba(249,115,22,0.15) 100%)', maxWidth: '1200px', margin: '16px auto 0' }} />

        {/* Subtitle */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px 8px' }}>
          <p style={{ fontFamily: sans, fontSize: '14px', color: '#666', margin: 0, lineHeight: 1.7 }}>
            {pick(loc,
              'Füllen Sie das Formular aus. Ihr Preis wird sofort berechnet.',
              'Fill in the form. Your price is calculated instantly.')}
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px 80px' }}>
          <div className="est-grid">
            {/* ── Left: form sections ── */}
            <div>
              {/* Section A, Contact */}
              <SectionCard label={pick(loc, 'KONTAKT', 'CONTACT')}>
                <div className="est-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label={pick(loc, 'Firmenname', 'Business Name')} required error={errors.businessName}>
                    <TextInput value={businessName} onChange={setBusinessName} placeholder="Muster GmbH" />
                  </Field>
                  <Field label={pick(loc, 'Ansprechpartner', 'Contact Name')} required error={errors.contactName}>
                    <TextInput value={contactName} onChange={setContactName} placeholder="Max Mustermann" />
                  </Field>
                  <Field label={pick(loc, 'E-Mail', 'Email')} required error={errors.email}>
                    <TextInput value={email} onChange={setEmail} placeholder="max@firma.de" type="email" />
                  </Field>
                  <Field label={pick(loc, 'Telefon / WhatsApp', 'Phone / WhatsApp')}>
                    <TextInput value={phone} onChange={setPhone} placeholder="+49 123 456789" type="tel" />
                  </Field>
                  <Field label={pick(loc, 'Stadt', 'City')}>
                    <TextInput value={city} onChange={setCity} placeholder="Essen" />
                  </Field>
                </div>

                {/* Business type radio cards */}
                <div style={{ marginTop: '4px' }}>
                  <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                    {pick(loc, 'Branche', 'Business Type')}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(
                      [
                        { id: 'cleaning' as BusinessType, label: pick(loc, 'Reinigung', 'Cleaning') },
                        { id: 'handwerk' as BusinessType, label: pick(loc, 'Handwerk', 'Trade') },
                        { id: 'both' as BusinessType, label: pick(loc, 'Beides', 'Both') },
                      ] as const
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBusinessType(b.id)}
                        style={{ flex: 1, background: businessType === b.id ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.02)', border: businessType === b.id ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.08)', color: businessType === b.id ? '#FFF' : '#888', fontFamily: sans, fontSize: '12px', padding: '10px 6px', cursor: 'pointer', transition: 'all 150ms' }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Section B, Package */}
              <SectionCard label={pick(loc, 'PAKET', 'PACKAGE')}>
                {errors.pkg && (
                  <p style={{ fontFamily: sans, fontSize: '11px', color: '#F97316', margin: '0 0 12px' }}>{errors.pkg}</p>
                )}
                <div className="est-package-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {PACKAGE_ORDER.map((id) => {
                    const pkg = PACKAGES[id]
                    const priceLabel = pick(loc, `ab ${fmt(pkg.price)}`, `from ${fmt(pkg.price)}`)
                    const contFrom = pick(loc, 'Alles aus', 'Everything in')
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedPkg(id)}
                        style={{ background: selectedPkg === id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.02)', border: selectedPkg === id ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.08)', padding: '16px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms', position: 'relative', boxShadow: selectedPkg === id ? '0 0 24px rgba(249,115,22,0.1)' : 'none' }}
                      >
                        {pkg.recommended && (
                          <span style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: '#F97316', color: '#000', fontFamily: mono, fontSize: '8px', padding: '2px 8px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                            {pick(loc, 'EMPFOHLEN', 'RECOMMENDED')}
                          </span>
                        )}
                        <p style={{ fontFamily: mono, fontSize: '10px', color: selectedPkg === id ? '#F97316' : '#888', letterSpacing: '0.15em', margin: '0 0 6px' }}>
                          {pkg.label}
                        </p>
                        <p style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '20px', color: '#FFF', margin: '0 0 12px' }}>
                          {priceLabel}
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                          {pkg.includes.map((item, i) => {
                            const text = pick(loc, item.de, item.en)
                            const isCont = text.startsWith(contFrom)
                            return (
                              <li key={i} style={{ fontFamily: sans, fontSize: '11px', color: isCont ? '#F97316' : '#666', padding: '2px 0', paddingLeft: isCont ? '0' : '14px', position: 'relative', fontWeight: isCont ? 500 : 400 }}>
                                {!isCont && (
                                  <span style={{ position: 'absolute', left: 0, color: '#F97316', fontSize: '10px' }}>✓</span>
                                )}
                                {text}
                              </li>
                            )
                          })}
                        </ul>
                        <p style={{ fontFamily: mono, fontSize: '9px', color: '#444', margin: 0, letterSpacing: '0.08em' }}>
                          ⏱ {pick(loc, pkg.delivery.de, pkg.delivery.en)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>

              {/* Section C, Add-ons */}
              <SectionCard label={pick(loc, 'EXTRAS', 'ADD-ONS')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {ADDONS.map((addon) => {
                    const active = activeAddons.has(addon.id)
                    const name = pick(loc, addon.de, addon.en)
                    return (
                      <div key={addon.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Toggle switch */}
                            <button
                              type="button"
                              onClick={() => toggleAddon(addon.id)}
                              aria-pressed={active}
                              aria-label={`${pick(loc, 'Umschalten', 'Toggle')} ${name}`}
                              style={{ width: '40px', height: '22px', borderRadius: '11px', background: active ? '#F97316' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 150ms' }}
                            >
                              <span style={{ position: 'absolute', top: '3px', left: active ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#FFF', transition: 'left 150ms', display: 'block' }} />
                            </button>
                            <p style={{ fontFamily: sans, fontSize: '13px', color: active ? '#FFF' : '#777', margin: 0, transition: 'color 150ms' }}>
                              {name}
                            </p>
                          </div>
                          <span style={{ fontFamily: mono, fontSize: '12px', color: active ? '#F97316' : '#444', flexShrink: 0, transition: 'color 150ms' }}>
                            +{fmt(addon.price)}{addon.perPage ? pick(loc, '/Seite', '/page') : ''}
                          </span>
                        </div>

                        {/* Copywriting page stepper */}
                        {addon.perPage && active && (
                          <div style={{ padding: '8px 0 10px 52px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontFamily: mono, fontSize: '10px', color: '#888' }}>{pick(loc, 'Anzahl Seiten:', 'Pages:')}</span>
                            <button type="button" onClick={() => setCopyPages((p) => Math.max(1, p - 1))} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFF', width: '26px', height: '26px', cursor: 'pointer', fontFamily: mono, fontSize: '16px' }}>−</button>
                            <span style={{ fontFamily: mono, fontSize: '15px', color: '#FFF', minWidth: '24px', textAlign: 'center' }}>{copyPages}</span>
                            <button type="button" onClick={() => setCopyPages((p) => Math.min(10, p + 1))} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFF', width: '26px', height: '26px', cursor: 'pointer', fontFamily: mono, fontSize: '16px' }}>+</button>
                            <span style={{ fontFamily: mono, fontSize: '11px', color: '#F97316' }}>= {fmt(addon.price * copyPages)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              {/* Section D, Hosting & Domain */}
              <SectionCard label="HOSTING & DOMAIN">
                {/* Domain */}
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>Domain</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                  {DOMAIN_ORDER.map((id) => {
                    const opt = DOMAIN_OPTS[id]
                    const label = pick(loc, opt.label.de, opt.label.en)
                    const period = pick(loc, opt.period.de, opt.period.en)
                    return (
                      <div key={id}>
                        <RadioOption
                          label={opt.price > 0 ? `${label}, +${fmt(opt.price)}${period}` : label}
                          selected={domainOpt === id}
                          onClick={() => setDomainOpt(id)}
                        />
                        {id === 'own' && domainOpt === 'own' && (
                          <div style={{ marginTop: '6px', paddingLeft: '6px' }}>
                            <TextInput value={ownDomain} onChange={setOwnDomain} placeholder="meinefirma.de" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Hosting */}
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>Hosting</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                  {HOSTING_ORDER.map((id) => {
                    const opt = HOSTING_OPTS[id]
                    const label = pick(loc, opt.label.de, opt.label.en)
                    const period = pick(loc, opt.period.de, opt.period.en)
                    return (
                      <RadioOption
                        key={id}
                        label={opt.price > 0 ? `${label}, +${fmt(opt.price)}${period}` : label}
                        selected={hostingOpt === id}
                        onClick={() => setHostingOpt(id)}
                      />
                    )
                  })}
                </div>

                {/* Maintenance */}
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  {pick(loc, 'Wartung', 'Maintenance')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {MAINTENANCE_ORDER.map((id) => {
                    const opt = MAINTENANCE_OPTS[id]
                    const label = pick(loc, opt.label.de, opt.label.en)
                    const period = pick(loc, opt.period.de, opt.period.en)
                    return (
                      <RadioOption
                        key={id}
                        label={opt.price > 0 ? `${label}, +${fmt(opt.price)}${period}` : label}
                        selected={maintenanceOpt === id}
                        onClick={() => setMaintenanceOpt(id)}
                      />
                    )
                  })}
                </div>
              </SectionCard>

              {/* Section E, Send */}
              <SectionCard label={pick(loc, 'ANGEBOT SENDEN', 'SEND ESTIMATE')}>
                {errors.send && (
                  <p style={{ fontFamily: sans, fontSize: '12px', color: '#F97316', margin: '0 0 12px' }}>{errors.send}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => void handleEmailSend()}
                    disabled={sending}
                    style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', padding: '15px 20px', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1, textAlign: 'left', transition: 'opacity 150ms', boxShadow: '0 4px 20px rgba(249,115,22,0.2)' }}
                  >
                    {sending ? pick(loc, 'Wird gesendet…', 'Sending…') : pick(loc, '✉  Per E-Mail senden', '✉  Send by Email')}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', fontFamily: mono, fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', padding: '15px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms' }}
                  >
                    {pick(loc, 'Per WhatsApp senden', 'Send via WhatsApp')}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="no-print"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#666', fontFamily: mono, fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', padding: '15px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms' }}
                  >
                    {pick(loc, 'Als PDF speichern', 'Save as PDF')}
                  </button>
                </div>

                <p style={{ fontFamily: mono, fontSize: '10px', color: '#333', margin: '16px 0 0', letterSpacing: '0.06em' }}>
                  {pick(loc, '// Angebot gilt 30 Tage · Zahlung 50/50', '// estimate valid 30 days · 50/50 payment')}
                </p>
              </SectionCard>
            </div>

            {/* ── Right: sticky price panel ── */}
            <div>
              <PricePanel
                loc={loc}
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
