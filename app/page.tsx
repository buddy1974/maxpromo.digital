import Hero from '@/components/Hero'
import Link from 'next/link'

/* ─── DATA ──────────────────────────────────────────────────── */

const MARQUEE_TERMS = [
  'Claude AI', 'n8n', 'Make', 'Zapier', 'OpenAI', 'Supabase',
  'Vercel', 'HubSpot', 'Notion', 'Slack', 'Xero', 'Twilio',
  'Cloudflare', 'Resend', 'Airtable', 'LangChain',
]

const SERVICES = [
  {
    icon: '↗',
    title: 'AI Agentic Workflows',
    desc: 'Autonomous agents that perceive, decide, and act — replacing repetitive human tasks end-to-end.',
  },
  {
    icon: '⟳',
    title: 'Process Automation',
    desc: 'Connect your tools and eliminate manual steps. From lead routing to invoice reconciliation.',
  },
  {
    icon: '◻',
    title: 'AI-Powered Websites',
    desc: 'Next.js sites with embedded AI features — chat agents, smart forms, personalised content.',
  },
  {
    icon: '⬡',
    title: 'Integration Architecture',
    desc: 'Design the data layer that connects every tool in your stack with zero friction.',
  },
]

const TERMINAL_LINES = [
  { text: '$ maxpromo audit --org "Acme Ltd"',              accent: true  },
  { text: '  scanning 12 operational workflows...',         accent: false },
  { text: '  ✓  lead qualification    [automatable]',       accent: true  },
  { text: '  ✓  invoice processing    [automatable]',       accent: true  },
  { text: '  ✗  complex negotiation   [human required]',    accent: false },
  { text: '  ✓  support triage        [automatable]',       accent: true  },
  { text: '',                                                accent: false },
  { text: '  Automation potential:  78%',                   accent: false },
  { text: '  Est. time saved:       32 hrs / week',         accent: false },
]

const PROCESS_STEPS = [
  { num: '01', title: 'Discovery Call',   desc: 'We map your current workflows and identify the highest-impact automation opportunities.' },
  { num: '02', title: 'System Design',    desc: 'We architect the solution — agents, integrations, and data flows — before a line of code is written.' },
  { num: '03', title: 'Build & Test',     desc: 'We deploy, connect, and rigorously test every automation in a staging environment.' },
  { num: '04', title: 'Launch & Monitor', desc: 'Go live with full observability. We monitor, optimise, and iterate based on real performance data.' },
]

const INDUSTRIES = [
  { name: 'Business & Enterprise',      icon: '🏢' },
  { name: 'NGOs & Charities',           icon: '🤝' },
  { name: 'Government & Public Sector', icon: '🏛️' },
  { name: 'Healthcare',                 icon: '🏥' },
  { name: 'Legal & Professional',       icon: '⚖️' },
  { name: 'E-commerce & Retail',        icon: '🛒' },
]

const STACK = [
  'Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier',
  'Supabase', 'Vercel', 'HubSpot', 'Slack', 'Notion',
  'Xero', 'Twilio', 'Cloudflare', 'Resend',
]

/* ─── DIVIDER ────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
}

/* ─── PAGE ──────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main style={{ background: '#0A0A0A' }}>

      {/* 1. Hero */}
      <Hero />

      <Divider />

      {/* 2. Marquee ticker */}
      <div className="py-4 overflow-hidden" style={{ background: '#0A0A0A' }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_TERMS, ...MARQUEE_TERMS].map((term, i) => (
            <span
              key={i}
              className="flex items-center gap-3 mx-7 text-xs"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(255,255,255,0.4)' }}
            >
              <span style={{ color: '#F97316', fontSize: '0.45rem' }}>●</span>
              {term}
            </span>
          ))}
        </div>
      </div>

      <Divider />

      {/* 3. Services grid — 2×2 */}
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase mb-3 block"
                style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
              >
                What We Build
              </span>
              <h2
                className="text-4xl md:text-5xl font-extrabold"
                style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
              >
                Services
              </h2>
            </div>
            <Link
              href="/services"
              className="text-sm font-medium transition-colors"
              style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>

          {/* 2×2 grid — thin white dividers */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-px"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {SERVICES.map((s) => (
              <div key={s.title} className="service-card p-10">
                <span
                  className="text-base font-bold mb-5 block"
                  style={{ color: '#F97316', fontFamily: 'var(--font-ibm-mono)' }}
                >
                  {s.icon}
                </span>
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* 4. Audit terminal section */}
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Terminal window */}
          <div
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <span
                className="text-xs ml-3"
                style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(255,255,255,0.25)' }}
              >
                automation-audit — zsh
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-6 space-y-1.5">
              {TERMINAL_LINES.map((l, i) => (
                <p
                  key={i}
                  className="text-xs leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-ibm-mono)',
                    color: l.accent ? '#FFFFFF' : '#888888',
                    minHeight: '1.25rem',
                  }}
                >
                  {l.text.startsWith('$') ? (
                    <>
                      <span style={{ color: '#F97316' }}>$</span>
                      {l.text.slice(1)}
                    </>
                  ) : l.text.includes('✓') ? (
                    <>
                      <span style={{ color: '#F97316' }}>  ✓</span>
                      {l.text.slice(3)}
                    </>
                  ) : (
                    l.text
                  )}
                </p>
              ))}
              <p className="text-xs mt-2" style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}>
                $ <span className="cursor-blink">▊</span>
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-4 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
            >
              Free Automation Audit
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
              style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
            >
              Find out exactly what can be automated
            </h2>
            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)' }}
            >
              Our AI audit scans your workflows, identifies automation
              opportunities, and delivers a prioritised action plan —
              in under 5 minutes. No calls, no commitments.
            </p>
            <ul className="space-y-3 mb-10">
              {[
                'Identifies your highest-ROI automation targets',
                'Estimates time saved per week',
                'Recommends the right tools for your stack',
                'Completely free — no strings attached',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm"
                  style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm-sans)' }}
                >
                  <span style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/automation-audit"
              className="inline-block text-sm font-semibold px-7 py-3.5 transition-opacity hover:opacity-85"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                background: '#F97316',
                color: '#0A0A0A',
                borderRadius: '2px',
              }}
            >
              Run My Free Audit →
            </Link>
          </div>
        </div>
      </section>

      <Divider />

      {/* 5. Process steps */}
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-3 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
            >
              How It Works
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold"
              style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
            >
              From idea to automated
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="p-8" style={{ background: '#0A0A0A' }}>
                <span
                  className="text-3xl font-extrabold block mb-6"
                  style={{ fontFamily: 'var(--font-syne)', color: '#F97316' }}
                >
                  {step.num}
                </span>
                <h3
                  className="text-base font-bold mb-3"
                  style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* 6. Industries */}
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-3 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
            >
              Who We Serve
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold"
              style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
            >
              Industries Served
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="industry-card p-6 text-center"
                style={{ background: '#111111', borderRadius: '2px' }}
              >
                <div className="text-2xl mb-3">{ind.icon}</div>
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ fontFamily: 'var(--font-dm-sans)', color: '#888888' }}
                >
                  {ind.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* 7. Stack pills */}
      <section className="py-14 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-7"
            style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(255,255,255,0.25)' }}
          >
            Platforms &amp; Technologies
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {STACK.map((p) => (
              <span
                key={p}
                className="stack-pill text-xs font-medium px-4 py-2"
                style={{ fontFamily: 'var(--font-ibm-mono)', borderRadius: '2px' }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* 8. CTA */}
      <section className="py-32 px-6" style={{ background: '#111111' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="text-xs font-semibold tracking-widest uppercase mb-5 block"
            style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
          >
            Ready to Automate?
          </span>
          <h2
            className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight"
            style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
          >
            Stop doing work{' '}
            <span style={{ color: '#F97316' }}>machines</span> can do
          </h2>
          <p
            className="text-base mb-12 max-w-xl mx-auto leading-relaxed"
            style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)' }}
          >
            Get a free, personalised automation audit and discover exactly how AI
            can transform your operations — in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/automation-audit"
              className="text-sm font-semibold px-8 py-4 transition-opacity hover:opacity-85"
              style={{ fontFamily: 'var(--font-dm-sans)', background: '#F97316', color: '#0A0A0A', borderRadius: '2px' }}
            >
              Run Free Automation Audit
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold px-8 py-4"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '2px',
                background: 'transparent',
              }}
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
