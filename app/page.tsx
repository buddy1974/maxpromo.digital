import Hero from '@/components/Hero'
import SocialProof from '@/components/SocialProof'
import ROICalculator from '@/components/ROICalculator'
import BeforeAfter from '@/components/BeforeAfter'
import NewsletterSignup from '@/components/NewsletterSignup'
import Link from 'next/link'

/* ─── DATA ─────────────────────────────────────────────────── */

const MARQUEE_ITEMS = [
  'AI AGENTS', 'N8N WORKFLOWS', 'PROCESS AUTOMATION', 'LEAD ROUTING',
  'CLAUDE API', 'DOCUMENT AI', 'CHATBOTS', 'INVOICE AUTOMATION',
  'CRM INTEGRATION', 'MAKE WORKFLOWS', 'AIRTABLE AUTOMATIONS', 'SMART FORMS',
  'SCHEDULING AI', 'DATA PIPELINES', 'CLOUDFLARE WORKERS', 'NEON POSTGRES',
  'RENDER DEPLOYS', 'TWILIO SMS', 'SUPABASE', 'ZAPIER FLOWS',
]

const SERVICES = [
  {
    icon: '↗',
    title: 'AI Agentic Workflows',
    desc: 'Autonomous agents that read incoming data, apply your business rules, make decisions, and take action — 24/7 without human input.',
    href: '/services',
  },
  {
    icon: '⟳',
    title: 'Process & Workflow Automation',
    desc: 'End-to-end automation using n8n, Make, and Zapier. Invoice processing, onboarding, CRM sync — manual steps eliminated permanently.',
    href: '/services',
  },
  {
    icon: '◻',
    title: 'Web Development + AI',
    desc: 'Full-stack Next.js platforms with embedded AI — intelligent lead capture, live chat agents, automated qualification built in from day one.',
    href: '/ai-websites',
  },
  {
    icon: '⬡',
    title: 'App Development + Automation',
    desc: 'Custom web apps and internal tools with automation at the core — dashboards, client portals, workflow management systems.',
    href: '/services',
  },
  {
    icon: '▦',
    title: 'Document & Data Intelligence',
    desc: 'AI that reads, extracts, classifies, and routes documents without manual handling. Contracts, invoices, applications — processed by Claude.',
    href: '/services',
  },
  {
    icon: '◈',
    title: 'Social Media Automation',
    desc: 'AI-driven content pipelines — on-brand posts, multi-platform scheduling, mention monitoring, and weekly performance reports. Fully automated.',
    href: '/services',
  },
  {
    icon: '●',
    title: 'AI Chatbots & Assistants',
    desc: 'Custom AI assistants trained on your business data — support agents, sales bots, internal knowledge bases, booking assistants.',
    href: '/services',
  },
  {
    icon: '⊞',
    title: 'Systems Integration & APIs',
    desc: 'We connect your entire tool stack via API and webhook. CRM, ERP, accounting, support — synchronised, automated, monitored in real time.',
    href: '/services',
  },
]

const SYSTEMS = [
  {
    label: 'TRADE · GERMANY',
    status: 'LIVE',
    name: 'HandwerkOS',
    desc: 'Complete field service management for German trades businesses. AI photo-to-quote in 10 seconds, GPS time tracking, XRechnung compliance, digital signatures.',
    href: '/products/handwerk-os',
  },
  {
    label: 'HOSPITALITY',
    status: 'LIVE',
    name: 'Restaurant OS',
    desc: 'QR-based ordering system with fruit seat identity, 4 payment split modes, instant Telegram staff alerts. No app needed. Multi-tenant ready.',
    href: '/products/restaurant-os',
  },
  {
    label: 'PRINT · E-COMMERCE',
    status: 'LIVE',
    name: 'PrintShop OS',
    desc: 'Full e-commerce platform for print businesses. AI prepress checks, Fabric.js design editor, production queue, Stripe payments. EN / DE / FR.',
    href: '/products/printshop',
  },
  {
    label: 'REAL ESTATE · UK',
    status: 'DEPLOYED',
    name: 'RealEstateOS',
    desc: 'Private intelligence platform for property auction companies. AI deal analysis, investor CRM, Kanban pipeline, campaign studio, financial calculators.',
    href: '/products/real-estate-os',
  },
  {
    label: 'CARE · UK',
    status: 'DEPLOYED',
    name: 'CareOS',
    desc: 'Complete care management platform for supported living providers. Digital care plans, EMAR, CQC compliance tracker, AI assistant, family portal.',
    href: '/products/care-os',
  },
  {
    label: 'PUBLISHING · AFRICA',
    status: 'DEPLOYED',
    name: 'PublishingOS',
    desc: 'Operating system for publishing companies. Orders, stock, manuscripts, royalties, HR, finance, and 8 AI agents running 24/7.',
    href: '/products/publishing-os',
  },
  {
    label: 'MEDICAL · GERMANY',
    status: 'DEPLOYED',
    name: 'PraxisOS',
    desc: 'Digital platform for specialist medical practices. Patient portal, appointment management, lab results, GDPR compliant, German healthcare standards.',
    href: '/products/praxis-os',
  },
]

const TERMINAL_LINES: { text: string; type: 'cmd' | 'muted' | 'check' | 'cross' | 'stat' | 'blank' }[] = [
  { text: '$ maxpromo audit --org "Acme Ltd"',           type: 'cmd'   },
  { text: '  scanning 12 operational workflows...',      type: 'muted' },
  { text: '  ✓  lead qualification    [automatable]',    type: 'check' },
  { text: '  ✓  invoice processing    [automatable]',    type: 'check' },
  { text: '  ✗  complex negotiation   [human required]', type: 'cross' },
  { text: '  ✓  support triage        [automatable]',    type: 'check' },
  { text: '',                                             type: 'blank' },
  { text: '  Automation potential:  78%',                type: 'stat'  },
  { text: '  Est. time saved:       32 hrs / week',      type: 'stat'  },
]

const PROCESS_STEPS = [
  { num: '01', title: 'Discovery Call',    desc: 'We map your workflows and identify highest-impact automation opportunities.' },
  { num: '02', title: 'System Design',     desc: 'We architect agents, integrations, and data flows before any code is written.' },
  { num: '03', title: 'Build & Test',      desc: 'We deploy and rigorously test every automation in a staging environment.' },
  { num: '04', title: 'Launch & Monitor',  desc: 'Go live with full observability. We monitor, optimise, and iterate.' },
]

/* ─── HELPERS ───────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: '#E8FF00',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children, dark: _dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        letterSpacing: '-0.04em',
        color: '#F0F0F0',
        marginBottom: '0',
      }}
    >
      {children}
    </h2>
  )
}

function CtaButton({ href, primary, children }: { href: string; primary?: boolean; children: React.ReactNode }) {
  if (primary) {
    return (
      <Link
        href={href}
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '15px',
          color: '#080808',
          background: '#E8FF00',
          padding: '14px 28px',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        {children}
      </Link>
    )
  }
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: '15px',
        color: '#F0F0F0',
        background: 'transparent',
        border: '1px solid #1A1A1A',
        padding: '14px 28px',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Link>
  )
}

function renderTerminalLine(line: typeof TERMINAL_LINES[number]) {
  const mono = { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.8' }

  if (line.type === 'blank') return <p style={{ ...mono, minHeight: '1.8em' }}>&nbsp;</p>

  if (line.type === 'cmd') {
    return (
      <p style={{ ...mono, color: '#F0F0F0' }}>
        <span style={{ color: '#E8FF00' }}>$</span>
        {line.text.slice(1)}
      </p>
    )
  }
  if (line.type === 'check') {
    return (
      <p style={{ ...mono, color: '#F0F0F0' }}>
        <span style={{ color: '#E8FF00' }}>  ✓</span>
        {line.text.slice(3)}
      </p>
    )
  }
  if (line.type === 'cross') {
    return <p style={{ ...mono, color: '#666666' }}>{line.text}</p>
  }
  if (line.type === 'stat') {
    return <p style={{ ...mono, color: '#F0F0F0' }}>{line.text}</p>
  }
  return <p style={{ ...mono, color: '#666666' }}>{line.text}</p>
}

/* ─── PAGE ──────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main>

      {/* 1 — Hero (dark gradient, SYS.AGENTS panel) */}
      <Hero />

      {/* 2 — Social proof */}
      <SocialProof />

      {/* 3 — Marquee ticker */}
      <div
        style={{
          background: '#080808',
          borderTop: '1px solid #1A1A1A',
          borderBottom: '1px solid #1A1A1A',
          padding: '14px 0',
          overflow: 'hidden',
        }}
      >
        <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(240,240,240,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginRight: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2rem',
              }}
            >
              {item}
              <span style={{ color: '#E8FF00', opacity: 0.4 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4 — Services */}
      <section style={{ background: '#0F0F0F', padding: '6rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>What We Build</SectionLabel>
            <SectionTitle>Services</SectionTitle>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            {SERVICES.slice(0, 6).map((s) => (
              <div
                key={s.title}
                className="dark-card"
                style={{
                  background: '#141414',
                  border: '1px solid #1A1A1A',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(232,255,0,0.5) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '24px',
                    color: '#E8FF00',
                    display: 'block',
                    marginBottom: '20px',
                  }}
                >
                  {s.icon}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '18px',
                    color: '#F0F0F0',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: '#666666',
                    lineHeight: 1.75,
                    flex: 1,
                    marginBottom: '20px',
                  }}
                >
                  {s.desc}
                </p>
                <Link
                  href={s.href}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#E8FF00',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    alignSelf: 'flex-start',
                  }}
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <Link
              href="/services"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#E8FF00',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
            >
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* 5 — Our Systems */}
      <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E8FF00', marginBottom: '1rem' }}>
            OUR SYSTEMS
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#F0F0F0' }}>
            Production systems. Live businesses. Real results.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', maxWidth: '600px', marginTop: '1rem', marginBottom: '3rem', lineHeight: 1.8 }}>
            Every system below is built, deployed, and running for real clients. Not prototypes. Not demos. Operating systems that run businesses.
          </p>

          <div className="systems-grid">
            {SYSTEMS.map((sys) => (
              <div
                key={sys.name}
                style={{ background: '#141414', padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '3px 8px', border: '1px solid #1A1A1A', color: '#666666', display: 'inline-block' }}>
                    {sys.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', background: '#E8FF00', color: '#080808', padding: '3px 8px', display: 'inline-block', fontWeight: 700 }}>
                    {sys.status}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#F0F0F0', letterSpacing: '-0.03em', margin: 0 }}>
                  {sys.name}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#666666', lineHeight: 1.75, margin: 0, flex: 1 }}>
                  {sys.desc}
                </p>
                <Link
                  href={sys.href}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#E8FF00', textDecoration: 'none', letterSpacing: '0.05em', alignSelf: 'flex-start' }}
                >
                  EXPLORE SYSTEM →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link
              href="/products"
              style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#F0F0F0', border: '1px solid #1A1A1A', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', background: 'transparent', transition: 'border-color 150ms ease' }}
            >
              View All Systems
            </Link>
          </div>
        </div>
      </section>

      {/* 6 — Before/After */}
      <BeforeAfter />

      {/* 5 — ROI Calculator */}
      <ROICalculator />

      {/* 6 — Industries */}
      <section style={{ background: '#0F0F0F', padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <SectionLabel>Industries We Serve</SectionLabel>
            <SectionTitle>Built for every sector</SectionTitle>
          </div>
          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"
          >
            {[
              { label: 'Professional Services', icon: 'M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM8 7V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2' },
              { label: 'Financial Services', icon: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
              { label: 'Logistics', icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12' },
              { label: 'Marketing & Media', icon: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07' },
              { label: 'Retail & E-Commerce', icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
              { label: 'Tech & SaaS', icon: 'M16 18l6-6-6-6M8 6l-6 6 6 6' },
              { label: 'Healthcare', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
              { label: 'Legal & Compliance', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
            ].map((ind) => (
              <div
                key={ind.label}
                className="industry-card"
                style={{
                  background: '#141414',
                  border: '1px solid #1A1A1A',
                  padding: '28px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ind.icon} />
                </svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#666666', lineHeight: 1.4, textAlign: 'center' }}>
                  {ind.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — Audit terminal */}
      <section
        style={{
          background: '#080808',
          padding: '6rem 2rem',
          position: 'relative',
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(232,255,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(232,255,0,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Terminal window */}
          <div
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(232,255,0,0.12)',
              overflow: 'hidden',
            }}
          >
            {/* Title bar */}
            <div
              style={{
                background: '#141414',
                borderBottom: '1px solid #1A1A1A',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />
              <span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.07)', display: 'inline-block' }} />
              <span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.04)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666666', marginLeft: '8px' }}>
                audit — zsh
              </span>
            </div>
            {/* Body */}
            <div style={{ background: '#080808', padding: '20px' }}>
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className="terminal-line" style={{ animationDelay: `${i * 300}ms` }}>
                  {renderTerminalLine(line)}
                </div>
              ))}
              <p
                className="terminal-line"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#E8FF00', animationDelay: `${TERMINAL_LINES.length * 300}ms` }}
              >
                $ <span className="cursor-blink">▊</span>
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <SectionLabel>Free Automation Audit</SectionLabel>
            <SectionTitle dark>Find out exactly what can be automated</SectionTitle>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: '#666666',
                lineHeight: 1.8,
                marginTop: '1.25rem',
                marginBottom: '1.75rem',
                maxWidth: '440px',
              }}
            >
              Our AI scans your workflows and delivers a prioritised action plan in under 5 minutes.
              No calls. No commitments.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Identifies your highest-ROI automation targets',
                'Estimates time saved per week',
                'Recommends the right tools for your stack',
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '17px',
                    color: 'rgba(240,240,240,0.7)',
                  }}
                >
                  <span style={{ color: '#E8FF00', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <CtaButton href="/automation-audit" primary>$ run --free-audit →</CtaButton>
          </div>
        </div>
      </section>

      {/* 8 — Process */}
      <section
        style={{
          background: '#080808',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>How It Works</SectionLabel>
            <SectionTitle dark>From idea to automated</SectionTitle>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
            }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.num}
                className="process-step"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid #1A1A1A',
                  padding: '40px 32px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '56px',
                    color: '#E8FF00',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    marginBottom: '20px',
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '17px',
                    color: '#F0F0F0',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: '#666666',
                    lineHeight: 1.75,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — CTA */}
      <section style={{ background: '#080808', padding: '7rem 2rem', position: 'relative', overflow: 'hidden' }}>
        {/* Accent glow behind heading */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '300px',
            background: 'radial-gradient(ellipse at center, rgba(232,255,0,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>Ready to Automate?</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: '#F0F0F0',
              marginBottom: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            Stop doing work{' '}
            <span style={{ color: '#E8FF00' }}>machines</span> can do
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              color: '#666666',
              marginBottom: '2.5rem',
              lineHeight: 1.8,
            }}
          >
            Get a free, personalised audit and discover exactly how AI can transform your
            operations — in under 5 minutes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <CtaButton href="/automation-audit" primary>$ run --free-audit</CtaButton>
            <CtaButton href="/contact">Talk to our team →</CtaButton>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#333333',
              marginTop: '20px',
              letterSpacing: '0.05em',
            }}
          >
            // Average client goes live in 14 days. Next cohort starts soon.
          </p>
        </div>
      </section>


      {/* 9 — Stack */}
      <section
        style={{
          background: '#080808',
          borderTop: '1px solid #1A1A1A',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#333333',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            // built on
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            {[
              'Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier',
              'Supabase', 'Neon', 'Vercel', 'Render', 'Next.js',
              'Cloudflare', 'HubSpot', 'Slack', 'Notion', 'Xero',
              'Twilio', 'Resend', 'Airtable',
            ].map((tool) => (
              <span
                key={tool}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: '#333333',
                  border: '1px solid #1A1A1A',
                  padding: '5px 12px',
                  letterSpacing: '0.05em',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSignup />

    </main>
  )
}
