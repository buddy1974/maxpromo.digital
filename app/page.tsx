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
    icon: '⬡',
    title: 'AI Agentic Workflows',
    desc: 'Autonomous agents that perceive, decide, and act — replacing repetitive human tasks end-to-end.',
  },
  {
    icon: '⬡',
    title: 'Process Automation',
    desc: 'Connect your tools and eliminate manual steps. From lead routing to invoice reconciliation.',
  },
  {
    icon: '⬡',
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
  { line: '> maxpromo.audit --org "Acme Ltd"', color: '#FF6A00' },
  { line: '  scanning 12 operational workflows...', color: 'rgba(240,237,232,0.5)' },
  { line: '  ✓ lead qualification  [automatable]', color: '#FF6A00' },
  { line: '  ✓ invoice processing  [automatable]', color: '#FF6A00' },
  { line: '  ✗ complex negotiation [human required]', color: 'rgba(240,237,232,0.35)' },
  { line: '  ✓ support triage      [automatable]', color: '#FF6A00' },
  { line: '', color: '' },
  { line: '  Automation potential: 78%', color: '#F0EDE8' },
  { line: '  Est. time saved: 32 hrs/week', color: '#F0EDE8' },
  { line: '  Report ready → /audit/acme-ltd', color: 'rgba(240,237,232,0.4)' },
]

const PROCESS_STEPS = [
  { num: '01', title: 'Discovery Call', desc: 'We map your current workflows and identify the highest-impact automation opportunities.' },
  { num: '02', title: 'System Design', desc: 'We architect the solution — agents, integrations, and data flows — before a line of code is written.' },
  { num: '03', title: 'Build & Test', desc: 'We deploy, connect, and rigorously test every automation in a staging environment.' },
  { num: '04', title: 'Launch & Monitor', desc: 'Go live with full observability. We monitor, optimise, and iterate based on real performance data.' },
]

const INDUSTRIES = [
  { name: 'Business & Enterprise', icon: '🏢' },
  { name: 'NGOs & Charities', icon: '🤝' },
  { name: 'Government & Public Sector', icon: '🏛️' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Legal & Professional', icon: '⚖️' },
  { name: 'E-commerce & Retail', icon: '🛒' },
]

const STACK = [
  'Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier',
  'Supabase', 'Vercel', 'HubSpot', 'Slack', 'Notion',
  'Xero', 'Twilio', 'Cloudflare', 'Resend',
]

/* ─── PAGE ──────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main style={{ background: '#06080A' }}>

      {/* 1. Hero */}
      <Hero />

      {/* 2. Marquee ticker */}
      <div
        className="py-5 overflow-hidden"
        style={{ borderTop: '1px solid rgba(255,106,0,0.1)', borderBottom: '1px solid rgba(255,106,0,0.1)', background: '#0D1014' }}
      >
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_TERMS, ...MARQUEE_TERMS].map((term, i) => (
            <span
              key={i}
              className="flex items-center gap-3 mx-6 text-xs font-medium"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.5)' }}
            >
              <span style={{ color: '#FF6A00' }}>●</span>
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Services grid — 2×2 */}
      <section
        className="py-28 px-6 grid-overlay"
        style={{ background: '#06080A' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span
              className="text-xs font-medium tracking-widest uppercase mb-4 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
            >
              ◈ What We Build
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold"
              style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
            >
              Services
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: 'rgba(255,106,0,0.1)' }}>
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="service-card p-10"
              >
                <span
                  className="text-2xl mb-6 block"
                  style={{ color: '#FF6A00' }}
                >
                  {s.icon}
                </span>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(240,237,232,0.55)' }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/services"
              className="text-sm font-semibold px-7 py-3.5 rounded-sm"
              style={{ fontFamily: 'var(--font-ibm-mono)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF6A00', background: 'rgba(255,106,0,0.05)' }}
            >
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Audit terminal section */}
      <section
        className="py-28 px-6"
        style={{ background: '#0D1014', borderTop: '1px solid rgba(255,106,0,0.1)' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Terminal */}
          <div
            className="rounded-sm overflow-hidden"
            style={{ border: '1px solid rgba(255,106,0,0.15)', background: '#06080A' }}
          >
            {/* Terminal title bar */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: '#111519', borderBottom: '1px solid rgba(255,106,0,0.1)' }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,106,0,0.4)' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,106,0,0.2)' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,106,0,0.1)' }} />
              <span
                className="text-xs ml-3"
                style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.3)' }}
              >
                automation-audit — bash
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-6 space-y-1.5">
              {TERMINAL_LINES.map((l, i) => (
                <p
                  key={i}
                  className="text-xs leading-relaxed"
                  style={{ fontFamily: 'var(--font-ibm-mono)', color: l.color || 'transparent', minHeight: '1.25rem' }}
                >
                  {l.line}
                </p>
              ))}
              <p
                className="text-xs mt-2"
                style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
              >
                &gt; _<span className="cursor-blink">▊</span>
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <span
              className="text-xs font-medium tracking-widest uppercase mb-4 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
            >
              ◈ Free Automation Audit
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-6"
              style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
            >
              Find out exactly what can be automated
            </h2>
            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: 'rgba(240,237,232,0.6)' }}
            >
              Our AI audit scans your workflows, identifies automation opportunities,
              and delivers a prioritised action plan — in under 5 minutes. No calls,
              no commitments.
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
                  style={{ color: 'rgba(240,237,232,0.7)' }}
                >
                  <span style={{ color: '#FF6A00', marginTop: '2px', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/automation-audit"
              className="inline-block text-sm font-semibold px-7 py-4 rounded-sm"
              style={{ fontFamily: 'var(--font-ibm-mono)', background: '#FF6A00', color: '#06080A' }}
            >
              Run My Free Audit →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Process steps — 4 horizontal */}
      <section
        className="py-28 px-6 grid-overlay"
        style={{ background: '#06080A', borderTop: '1px solid rgba(255,106,0,0.1)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span
              className="text-xs font-medium tracking-widest uppercase mb-4 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
            >
              ◈ How It Works
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold"
              style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
            >
              From idea to automated
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.num}
                className="p-8 rounded-sm"
                style={{ background: '#0D1014', border: '1px solid rgba(255,106,0,0.1)' }}
              >
                <span
                  className="text-4xl font-extrabold block mb-6"
                  style={{
                    fontFamily: 'var(--font-syne)',
                    color: '#FF6A00',
                    textShadow: '0 0 40px rgba(255,106,0,0.3)',
                  }}
                >
                  {step.num}
                </span>
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(240,237,232,0.5)' }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Industries grid */}
      <section
        className="py-24 px-6"
        style={{ background: '#0D1014', borderTop: '1px solid rgba(255,106,0,0.1)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="text-xs font-medium tracking-widest uppercase mb-4 block"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
            >
              ◈ Who We Serve
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold"
              style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
            >
              Industries Served
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="industry-card p-6 rounded-sm text-center"
                style={{ background: '#06080A' }}
              >
                <div className="text-3xl mb-3">{ind.icon}</div>
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.6)' }}
                >
                  {ind.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Stack pills row */}
      <section
        className="py-16 px-6"
        style={{ background: '#06080A', borderTop: '1px solid rgba(255,106,0,0.1)', borderBottom: '1px solid rgba(255,106,0,0.1)' }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-xs font-medium tracking-widest uppercase mb-8"
            style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.3)' }}
          >
            Platforms &amp; Technologies We Use
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {STACK.map((p) => (
              <span
                key={p}
                className="text-xs font-medium px-4 py-2 rounded-sm"
                style={{
                  fontFamily: 'var(--font-ibm-mono)',
                  color: 'rgba(240,237,232,0.6)',
                  background: '#0D1014',
                  border: '1px solid rgba(255,106,0,0.15)',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA section */}
      <section
        className="py-32 px-6 relative overflow-hidden"
        style={{ background: '#06080A' }}
      >
        <div className="absolute inset-0 orange-glow-bg pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span
            className="text-xs font-medium tracking-widest uppercase mb-6 block"
            style={{ fontFamily: 'var(--font-ibm-mono)', color: '#FF6A00' }}
          >
            ◈ Ready to Automate?
          </span>
          <h2
            className="text-5xl md:text-6xl font-extrabold mb-6"
            style={{ fontFamily: 'var(--font-syne)', color: '#F0EDE8' }}
          >
            Stop doing work machines can do
          </h2>
          <p
            className="text-lg mb-14 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(240,237,232,0.55)' }}
          >
            Get a free, personalised automation audit and discover exactly how AI can
            transform your operations — in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/automation-audit"
              className="text-sm font-semibold px-9 py-4 rounded-sm"
              style={{ fontFamily: 'var(--font-ibm-mono)', background: '#FF6A00', color: '#06080A' }}
            >
              Run Free Automation Audit
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold px-9 py-4 rounded-sm"
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                color: '#F0EDE8',
                border: '1px solid rgba(255,106,0,0.3)',
                background: 'rgba(255,106,0,0.05)',
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
