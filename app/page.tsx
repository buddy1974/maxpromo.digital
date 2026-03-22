import Hero from '@/components/Hero'
import SocialProof from '@/components/SocialProof'
import ROICalculator from '@/components/ROICalculator'
import Link from 'next/link'

/* ─── DATA ─────────────────────────────────────────────────── */

const MARQUEE_ITEMS = [
  'AI AGENTS', 'N8N WORKFLOWS', 'PROCESS AUTOMATION', 'LEAD ROUTING',
  'CLAUDE API', 'DOCUMENT AI', 'CHATBOTS', 'INVOICE AUTOMATION',
  'CRM INTEGRATION', 'SMART FORMS', 'SCHEDULING AI', 'DATA PIPELINES',
]

const SERVICES = [
  {
    icon: '↗',
    title: 'AI Agentic Workflows',
    desc: 'Autonomous agents that perceive, decide, and act — without human intervention.',
    href: '/services',
  },
  {
    icon: '⟳',
    title: 'Process Automation',
    desc: 'Connect every tool in your stack. Eliminate manual steps from end to end.',
    href: '/services',
  },
  {
    icon: '◻',
    title: 'AI-Powered Websites',
    desc: 'Next.js sites with embedded agents, smart forms, and automated lead capture.',
    href: '/ai-websites',
  },
  {
    icon: '⬡',
    title: 'Custom Integration',
    desc: 'We connect every tool in your stack via API, webhook, and event-driven logic.',
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
              gap: '1px',
              background: '#EEEEEE',
            }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="service-card"
                style={{
                  background: '#FFFFFF',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid #EEEEEE',
                }}
              >
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
                    fontSize: '20px',
                    color: '#0A0A0A',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '15px',
                    color: '#555555',
                    lineHeight: 1.7,
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
        </div>
      </section>

      {/* 5 — ROI Calculator */}
      <ROICalculator />

      {/* 6 — Audit terminal */}
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

      {/* 7 — Process */}
      <section
        style={{
          background: '#FFFFFF',
          padding: '6rem 2rem',
          borderTop: '1px solid #E5E5E5',
          borderBottom: '1px solid #E5E5E5',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>How It Works</SectionLabel>
            <SectionTitle>From idea to automated</SectionTitle>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0',
              borderTop: '1px solid #E5E5E5',
            }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROCESS_STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  padding: '2.5rem 2rem',
                  position: 'relative',
                  borderRight: i < PROCESS_STEPS.length - 1 ? '1px solid #E5E5E5' : 'none',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontWeight: 700,
                    fontSize: '64px',
                    color: '#F97316',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    marginBottom: '20px',
                    opacity: 0.9,
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: '#0A0A0A',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '16px',
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

    </main>
  )
}
