import Hero from '@/components/Hero'
import ProofSection from '@/components/ProofSection'
import PricingSection from '@/components/PricingSection'
import FaqSection from '@/components/FaqSection'
import ROICalculator from '@/components/ROICalculator'
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
    tags: ['Claude API', 'n8n', 'Webhooks'],
    href: '/services',
  },
  {
    icon: '⟳',
    title: 'Process & Workflow Automation',
    desc: 'End-to-end automation using n8n, Make, and Zapier. Invoice processing, onboarding, CRM sync — manual steps eliminated permanently.',
    tags: ['n8n', 'Make', 'Zapier'],
    href: '/services',
  },
  {
    icon: '◻',
    title: 'Web Development + AI',
    desc: 'Full-stack Next.js platforms with embedded AI — intelligent lead capture, live chat agents, automated qualification built in from day one.',
    tags: ['Next.js', 'Claude API', 'Vercel'],
    href: '/ai-websites',
  },
  {
    icon: '⬡',
    title: 'App Development + Automation',
    desc: 'Custom web apps and internal tools with automation at the core — dashboards, client portals, workflow management systems.',
    tags: ['Next.js', 'Supabase', 'Neon'],
    href: '/services',
  },
  {
    icon: '▦',
    title: 'Document & Data Intelligence',
    desc: 'AI that reads, extracts, classifies, and routes documents without manual handling. Contracts, invoices, applications — processed by Claude.',
    tags: ['Claude AI', 'Neon', 'Webhooks'],
    href: '/services',
  },
  {
    icon: '◈',
    title: 'Systems Integration & APIs',
    desc: 'We connect your entire tool stack via API and webhook. CRM, ERP, accounting, support — synchronised, automated, monitored in real time.',
    tags: ['REST APIs', 'Webhooks', 'Make'],
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
    desc: 'QR-based ordering system with seat identity, 4 payment split modes, instant Telegram staff alerts. No app needed. Multi-tenant ready.',
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

const PROCESS_STEPS = [
  { num: '01', title: 'Discovery Call', desc: 'We map your workflows and identify highest-impact automation opportunities.', time: '30 min' },
  { num: '02', title: 'System Design', desc: 'We architect agents, integrations, and data flows before any code is written.', time: '2–3 days' },
  { num: '03', title: 'Build & Test', desc: 'We deploy and rigorously test every automation in a staging environment.', time: '1–3 weeks' },
  { num: '04', title: 'Launch & Monitor', desc: 'Go live with full observability. We monitor, optimise, and iterate.', time: 'Ongoing' },
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

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'hsl(28 100% 58%)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        letterSpacing: '-0.04em',
        color: 'hsl(40 30% 96%)',
        marginBottom: '0',
      }}
    >
      {children}
    </h2>
  )
}

function renderTerminalLine(line: typeof TERMINAL_LINES[number]) {
  const mono = { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.8' }
  if (line.type === 'blank') return <p style={{ ...mono, minHeight: '1.8em' }}>&nbsp;</p>
  if (line.type === 'cmd') {
    return (
      <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>
        <span style={{ color: 'hsl(28 100% 58%)' }}>$</span>
        {line.text.slice(1)}
      </p>
    )
  }
  if (line.type === 'check') {
    return (
      <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>
        <span style={{ color: 'hsl(28 100% 58%)' }}>  ✓</span>
        {line.text.slice(3)}
      </p>
    )
  }
  if (line.type === 'cross') return <p style={{ ...mono, color: 'hsl(40 12% 65%)' }}>{line.text}</p>
  if (line.type === 'stat') return <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>{line.text}</p>
  return <p style={{ ...mono, color: 'hsl(40 12% 65%)' }}>{line.text}</p>
}

/* ─── PAGE ─── */

export default function HomePage() {
  return (
    <main>

      {/* 1 — Hero */}
      <Hero />

      {/* 2 — Marquee ticker */}
      <div
        style={{
          background: 'hsl(240 12% 6%)',
          borderTop: '1px solid hsl(40 30% 96% / 0.06)',
          borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
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
                color: 'hsl(40 30% 96% / 0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginRight: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2rem',
              }}
            >
              {item}
              <span style={{ color: 'hsl(28 100% 58% / 0.4)' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* 3 — Services */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>// 01 — WHAT WE BUILD</SectionLabel>
            <SectionTitle>
              Services that{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                eliminate
              </span>{' '}
              manual work
            </SectionTitle>
          </div>

          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map((s) => (
              <Link
                key={s.title}
                href={s.href}
                className="service-card"
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '24px',
                    color: 'hsl(28 100% 58%)',
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
                    color: 'hsl(40 30% 96%)',
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
                    color: 'hsl(40 12% 65%)',
                    lineHeight: 1.75,
                    flex: 1,
                    marginBottom: '20px',
                  }}
                >
                  {s.desc}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'hsl(28 100% 58% / 0.8)',
                        background: 'hsl(28 100% 58% / 0.08)',
                        border: '1px solid hsl(28 100% 58% / 0.15)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'hsl(28 100% 58%)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Learn more →
                </span>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Link
              href="/services"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'hsl(28 100% 58%)',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
            >
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* 4 — Proof / Results */}
      <ProofSection />

      {/* 5 — Our Systems */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <SectionLabel>// 03 — OUR SYSTEMS</SectionLabel>
            <SectionTitle>
              Production systems.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Live businesses.
              </span>
            </SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '600px', marginTop: '1rem', lineHeight: 1.8 }}>
              Every system below is built, deployed, and running for real clients. Not prototypes. Not demos.
            </p>
          </div>

          <div className="systems-grid" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {SYSTEMS.map((sys) => (
              <div
                key={sys.name}
                className="dark-card"
                style={{ background: 'hsl(240 12% 7%)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      padding: '3px 8px',
                      border: '1px solid hsl(40 30% 96% / 0.1)',
                      color: 'hsl(40 12% 65%)',
                      display: 'inline-block',
                      borderRadius: '4px',
                    }}
                  >
                    {sys.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      background: sys.status === 'LIVE' ? 'hsl(28 100% 58%)' : 'hsl(240 10% 20%)',
                      color: sys.status === 'LIVE' ? 'hsl(240 14% 4%)' : 'hsl(40 12% 65%)',
                      padding: '3px 8px',
                      display: 'inline-block',
                      fontWeight: 700,
                      borderRadius: '4px',
                    }}
                  >
                    {sys.status}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', margin: 0 }}>
                  {sys.name}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0, flex: 1 }}>
                  {sys.desc}
                </p>
                <Link
                  href={sys.href}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', textDecoration: 'none', letterSpacing: '0.05em', alignSelf: 'flex-start' }}
                >
                  EXPLORE SYSTEM →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              href="/products"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 32px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              View All Systems
            </Link>
          </div>
        </div>
      </section>

      {/* 6 — ROI Calculator */}
      <ROICalculator />

      {/* 7 — Audit terminal */}
      <section
        style={{
          background: 'hsl(240 14% 4%)',
          padding: '6rem 2rem',
          position: 'relative',
        }}
      >
        <div
          className="grid-bg"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'grid',
            gap: '4rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Terminal */}
          <div
            className="glass-strong"
            style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px hsl(28 100% 58% / 0.06)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(0 84% 60% / 0.5)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(28 100% 58% / 0.5)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(75 100% 60% / 0.5)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginLeft: '8px' }}>
                audit — zsh
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className="terminal-line" style={{ animationDelay: `${i * 300}ms` }}>
                  {renderTerminalLine(line)}
                </div>
              ))}
              <p
                className="terminal-line"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', animationDelay: `${TERMINAL_LINES.length * 300}ms` }}
              >
                $ <span className="cursor-blink">▊</span>
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <SectionLabel>Free Automation Audit</SectionLabel>
            <SectionTitle>
              Find out exactly what{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                can be automated
              </span>
            </SectionTitle>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: 'hsl(40 12% 65%)',
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
                    color: 'hsl(40 30% 96% / 0.7)',
                  }}
                >
                  <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 30px hsl(28 100% 58% / 0.25)',
              }}
            >
              Get my free audit →
            </Link>
          </div>
        </div>
      </section>

      {/* 8 — Process */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>// HOW IT WORKS</SectionLabel>
            <SectionTitle>From idea to automated</SectionTitle>
          </div>

          {/* Connector line */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, hsl(28 100% 58% / 0.4), transparent)', marginBottom: '0', display: 'none' }} />

          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROCESS_STEPS.map((step, i) => (
              <div
                key={step.num}
                className="process-step"
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '2.5rem 2rem',
                  position: 'relative',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '56px',
                    lineHeight: 1,
                    marginBottom: '1.25rem',
                    background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {step.num}
                </p>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'hsl(40 12% 65%)',
                    background: 'hsl(240 10% 16%)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {step.time}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '17px',
                    color: 'hsl(40 30% 96%)',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                    display: 'block',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'hsl(40 12% 65%)',
                    lineHeight: 1.75,
                  }}
                >
                  {step.desc}
                </p>
                {i < PROCESS_STEPS.length - 1 && (
                  <span
                    className="hidden lg:block"
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(28 100% 58% / 0.4)',
                      fontSize: '14px',
                      zIndex: 1,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 — Pricing */}
      <PricingSection />

      {/* 10 — FAQ */}
      <FaqSection />

      {/* 11 — CTA */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '7rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '300px',
            background: 'radial-gradient(ellipse at center, hsl(28 100% 58% / 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>// Ready to Automate?</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            Stop paying humans to do{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              machine work
            </span>
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              color: 'hsl(40 12% 65%)',
              marginBottom: '2.5rem',
              lineHeight: 1.8,
            }}
          >
            Get a free, personalised audit and discover exactly how AI can transform your
            operations — in under 5 minutes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 40px hsl(28 100% 58% / 0.3)',
              }}
            >
              Get my free audit
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              Talk to our team →
            </Link>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'hsl(240 8% 35%)',
              marginTop: '20px',
              letterSpacing: '0.05em',
            }}
          >
            // Average client goes live in 14 days · 3 slots open this month
          </p>
        </div>
      </section>

      {/* 12 — Stack */}
      <section
        style={{
          background: 'hsl(240 14% 4%)',
          borderTop: '1px solid hsl(40 30% 96% / 0.06)',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'hsl(240 8% 35%)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            // built on
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
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
                  color: 'hsl(40 12% 65%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  padding: '5px 12px',
                  letterSpacing: '0.05em',
                  borderRadius: '4px',
                  background: 'hsl(240 12% 8%)',
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
