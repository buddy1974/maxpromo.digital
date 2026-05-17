'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── DATA ────────────────────────────────────────────────── */

interface System {
  label: string
  status: 'LIVE' | 'DEPLOYED'
  name: string
  desc: string
  features: string[]
  href: string
  demo: boolean
}

const SYSTEMS: System[] = [
  {
    label: 'TRADE · GERMANY',
    status: 'LIVE',
    name: 'HandwerkOS',
    desc: 'Complete field service management for German trades businesses. AI photo-to-quote in 10 seconds, GPS time tracking, XRechnung compliance, digital signatures.',
    features: [
      '— AI photo-to-quote in 10 seconds',
      '— GPS time tracking with proof',
      '— XRechnung XML export built in',
    ],
    href: '/products/handwerk-os',
    demo: true,
  },
  {
    label: 'HOSPITALITY',
    status: 'LIVE',
    name: 'Restaurant OS',
    desc: 'QR-based ordering system with fruit seat identity, 4 payment split modes, instant Telegram staff alerts. No app needed. Multi-tenant ready.',
    features: [
      '— QR ordering, no app needed',
      '— Fruit seat identity system',
      '— 4 payment split modes',
    ],
    href: '/products/restaurant-os',
    demo: true,
  },
  {
    label: 'PRINT · E-COMMERCE',
    status: 'LIVE',
    name: 'PrintShop OS',
    desc: 'Full e-commerce platform for print businesses. AI prepress checks, Fabric.js design editor, production queue, Stripe payments. EN / DE / FR.',
    features: [
      '— AI prepress file validation',
      '— Fabric.js design editor',
      '— EN / DE / FR multilingual',
    ],
    href: '/products/printshop',
    demo: true,
  },
  {
    label: 'REAL ESTATE · UK',
    status: 'DEPLOYED',
    name: 'RealEstateOS',
    desc: 'Private intelligence platform for property auction companies. AI deal analysis, investor CRM, Kanban pipeline, campaign studio, financial calculators.',
    features: [
      '— AI deal analyser with score + ROI',
      '— Investor CRM with lead scoring',
      '— Campaign studio with AI subject lines',
    ],
    href: '/products/real-estate-os',
    demo: false,
  },
  {
    label: 'CARE · UK',
    status: 'DEPLOYED',
    name: 'CareOS',
    desc: 'Complete care management platform for supported living providers. Digital care plans, EMAR, CQC compliance tracker, AI assistant, family portal.',
    features: [
      '— CQC-compliant incident reporting',
      '— EMAR medication records',
      '— 8 n8n automation agents 24/7',
    ],
    href: '/products/care-os',
    demo: false,
  },
  {
    label: 'PUBLISHING · AFRICA',
    status: 'DEPLOYED',
    name: 'PublishingOS',
    desc: 'Operating system for publishing companies. Orders, stock, manuscripts, royalties, HR, finance, and 8 AI agents running 24/7.',
    features: [
      '— Orders, stock, manuscripts in one system',
      '— Royalties calculated automatically',
      '— AI agents running overnight',
    ],
    href: '/products/publishing-os',
    demo: false,
  },
  {
    label: 'MEDICAL · GERMANY',
    status: 'DEPLOYED',
    name: 'PraxisOS',
    desc: 'Digital platform for specialist medical practices. Patient portal, appointment management, lab results, GDPR compliant, German healthcare standards.',
    features: [
      '— Patient portal with lab results',
      '— Appointment automation workflows',
      '— GDPR compliant, German standards',
    ],
    href: '/products/praxis-os',
    demo: false,
  },
]

const STATUS_FILTERS = ['ALL', 'LIVE', 'DEPLOYED'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const CATEGORY_CHIPS = ['TRADE', 'HOSPITALITY', 'PRINT', 'REAL ESTATE', 'CARE', 'PUBLISHING', 'MEDICAL']

/* ─── STYLES ──────────────────────────────────────────────── */

const chipBase: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '6px 14px',
  cursor: 'pointer',
  border: '1px solid #1A1A1A',
  background: 'transparent',
  color: '#666666',
  transition: 'all 150ms ease',
}

const chipActive: React.CSSProperties = {
  ...chipBase,
  background: '#F97316',
  color: '#080808',
  borderColor: '#F97316',
}

/* ─── PAGE ────────────────────────────────────────────────── */

export default function ProductsPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL')

  const filtered = activeFilter === 'ALL'
    ? SYSTEMS
    : SYSTEMS.filter((s) => s.status === activeFilter)

  return (
    <main style={{ background: '#080808' }}>

      {/* ── HERO ── */}
      <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1.5rem' }}>
            ALL SYSTEMS
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '0', whiteSpace: 'pre-line' }}>
            {'Seven operating systems.\nBuilt. Deployed. Running.'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '560px', marginTop: '1rem', lineHeight: 1.8 }}>
            Every system on this page is live and running for a real business. Not prototypes. Not MVPs. Production systems that replace spreadsheets, paper records, and disconnected tools.
          </p>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={activeFilter === f ? chipActive : chipBase}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Visual separator */}
          <div style={{ width: '1px', height: '20px', background: '#1A1A1A', flexShrink: 0 }} />

          {/* Category chips — visual only */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORY_CHIPS.map((cat) => (
              <span key={cat} style={{ ...chipBase, cursor: 'default' }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEMS GRID ── */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div className="systems-grid">
            {filtered.map((sys) => (
              <div
                key={sys.name}
                style={{ background: '#141414', border: '1px solid #1A1A1A', padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Label + status */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '3px 8px', border: '1px solid #1A1A1A', color: '#666666', display: 'inline-block' }}>
                    {sys.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', background: '#F97316', color: '#080808', padding: '3px 8px', display: 'inline-block', fontWeight: 700 }}>
                    {sys.status}
                  </span>
                </div>

                {/* Name */}
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '24px', color: '#F0F0F0', letterSpacing: '-0.03em', margin: 0 }}>
                  {sys.name}
                </h2>

                {/* Desc */}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#666666', lineHeight: 1.75, margin: 0 }}>
                  {sys.desc}
                </p>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sys.features.map((f) => (
                    <li key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#333333' }}>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Bottom row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                  <Link
                    href={sys.href}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#F97316', textDecoration: 'none', letterSpacing: '0.05em', transition: 'opacity 150ms ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    EXPLORE SYSTEM →
                  </Link>
                  {sys.demo && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="status-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', background: '#F97316', borderRadius: '50%' }} />
                      LIVE DEMO
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#333333', textAlign: 'center', padding: '4rem 0' }}>
              No systems match that filter.
            </p>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
            CUSTOM SYSTEMS
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', margin: 0 }}>
            Need something that isn&apos;t listed?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', maxWidth: '500px', margin: '1rem auto 2rem', lineHeight: 1.8 }}>
            Every system above started as a custom brief. If your business has a specific operational problem, we build the system that solves it.
          </p>
          <Link
            href="/contact"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, background: '#F97316', color: '#080808', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', transition: 'background 150ms ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
          >
            DISCUSS YOUR SYSTEM →
          </Link>
        </div>
      </section>

    </main>
  )
}
