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
        fontFamily: 'var(--font-space-mono)',
        fontSize: '12px',
        color: '#F97316',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-space-grotesk)',
        fontWeight: 700,
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        letterSpacing: '-0.04em',
        color: dark ? '#FAFAFF' : '#0A0A0A',
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
          fontFamily: 'var(--font-space-mono)',
          fontWeight: 700,
          fontSize: '15px',
          color: '#000000',
          background: '#F97316',
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
        fontFamily: 'var(--font-dm-sans)',
        fontWeight: 500,
        fontSize: '15px',
        color: '#FAFAFF',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.25)',
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
  const mono = { fontFamily: 'var(--font-space-mono)', fontSize: '13px', lineHeight: '1.8' }

  if (line.type === 'blank') return <p style={{ ...mono, minHeight: '1.8em' }}>&nbsp;</p>

  if (line.type === 'cmd') {
    return (
      <p style={{ ...mono, color: '#FAFAFF' }}>
        <span style={{ color: '#F97316' }}>$</span>
        {line.text.slice(1)}
      </p>
    )
  }
  if (line.type === 'check') {
    return (
      <p style={{ ...mono, color: '#FAFAFF' }}>
        <span style={{ color: '#F97316' }}>  ✓</span>
        {line.text.slice(3)}
      </p>
    )
  }
  if (line.type === 'cross') {
    return <p style={{ ...mono, color: '#6B6B7A' }}>{line.text}</p>
  }
  if (line.type === 'stat') {
    return <p style={{ ...mono, color: '#FAFAFF' }}>{line.text}</p>
  }
  return <p style={{ ...mono, color: '#6B6B7A' }}>{line.text}</p>
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
          background: '#0A0A0A',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 0',
          overflow: 'hidden',
        }}
      >
        <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginRight: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2rem',
              }}
            >
              {item}
              <span style={{ color: '#F97316', opacity: 0.5 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4 — Services */}
      <section style={{ background: '#FAFAFA', padding: '6rem 2rem', borderBottom: '1px solid #E5E5E5' }}>
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
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '2px',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.6) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-space-mono)',
                    fontSize: '24px',
                    color: '#F97316',
                    display: 'block',
                    marginBottom: '20px',
                  }}
                >
                  {s.icon}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontWeight: 700,
                    fontSize: '18px',
                    color: '#FFFFFF',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '14px',
                    color: '#999999',
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
                    fontFamily: 'var(--font-space-mono)',
                    fontSize: '13px',
                    color: '#F97316',
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
                fontFamily: 'var(--font-space-mono)',
                fontSize: '13px',
                color: '#F97316',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
            >
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* 4 — Before/After */}
      <BeforeAfter />

      {/* 5 — ROI Calculator */}
      <ROICalculator />

      {/* 6 — Industries */}
      <section style={{ background: '#F5F5F5', padding: '5rem 2rem', borderBottom: '1px solid #E5E5E5' }}>
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
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '2px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ind.icon} />
                </svg>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#CCCCCC', lineHeight: 1.4, textAlign: 'center' }}>
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
          background: '#0A0A0A',
          padding: '6rem 2rem',
          position: 'relative',
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)',
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
              background: '#0E0E12',
              border: '1px solid rgba(249,115,22,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Title bar */}
            <div
              style={{
                background: '#16161C',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'inline-block' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: '#6B6B7A', marginLeft: '8px' }}>
                audit — zsh
              </span>
            </div>
            {/* Body */}
            <div style={{ background: '#030305', padding: '20px' }}>
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className="terminal-line" style={{ animationDelay: `${i * 300}ms` }}>
                  {renderTerminalLine(line)}
                </div>
              ))}
              <p
                className="terminal-line"
                style={{ fontFamily: 'var(--font-space-mono)', fontSize: '12px', color: '#F97316', animationDelay: `${TERMINAL_LINES.length * 300}ms` }}
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
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '17px',
                color: '#888888',
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
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '17px',
                    color: 'rgba(250,250,255,0.7)',
                  }}
                >
                  <span style={{ color: '#F97316', flexShrink: 0 }}>✓</span>
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
          background: '#0A0A0A',
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
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '2px',
                  padding: '40px 32px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontWeight: 700,
                    fontSize: '56px',
                    color: '#F97316',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    marginBottom: '20px',
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontWeight: 700,
                    fontSize: '17px',
                    color: '#FFFFFF',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '14px',
                    color: '#777777',
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
      <section style={{ background: '#0A0A0A', padding: '7rem 2rem', position: 'relative', overflow: 'hidden' }}>
        {/* Orange glow behind heading */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '300px',
            background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>Ready to Automate?</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: '#FAFAFF',
              marginBottom: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            Stop doing work{' '}
            <span style={{ color: '#F97316' }}>machines</span> can do
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '17px',
              color: '#888888',
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
              fontFamily: 'var(--font-space-mono)',
              fontSize: '11px',
              color: '#666666',
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
          background: '#050505',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
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
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: '11px',
                  color: '#444444',
                  border: '1px solid rgba(255,255,255,0.05)',
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
