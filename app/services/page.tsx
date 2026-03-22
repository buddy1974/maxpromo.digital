import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'AI agentic workflows, AI websites, and custom automation systems for modern organisations.',
}

const AGENT_EXAMPLES = [
  'Customer support agents',
  'Email triage & routing agents',
  'Lead qualification agents',
  'Document processing AI',
  'Data extraction agents',
  'Meeting summarisation',
  'Internal knowledge assistants',
  'Proposal generation agents',
]

const WEBSITE_FEATURES = [
  'AI chat assistants embedded in your site',
  'Automated lead capture and qualification',
  'Knowledge bots trained on your content',
  'Smart search systems',
  'Dynamic content personalisation',
  'CRM integration and lead routing',
]

const AUTOMATION_STEPS = [
  { step: '01', title: 'Process Analysis', desc: 'We map your current workflows and identify the highest-value automation opportunities.' },
  { step: '02', title: 'System Design', desc: 'Our architects design the full automation architecture, API integrations, and agent logic.' },
  { step: '03', title: 'Build & Integration', desc: 'We build and integrate the automation system with your existing tools and platforms.' },
  { step: '04', title: 'Deployment & Monitoring', desc: 'We deploy to production and set up dashboards to monitor performance and reliability.' },
]

const mono = { fontFamily: 'var(--font-space-mono)' } as const
const grotesk = { fontFamily: 'var(--font-space-grotesk)' } as const
const sans = { fontFamily: 'var(--font-dm-sans)' } as const

export default function ServicesPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Page header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Services
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
            What We Build
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: '#555555', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.8 }}>
            Three core service lines — each designed to reduce manual work, increase
            operational capacity, and deliver measurable ROI.
          </p>
        </div>
      </section>

      {/* Service 1: AI Agentic Workflows */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div
          style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '4rem', alignItems: 'center' }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          <div>
            <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
              01 / AI Agents
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
              AI Agentic Workflows
            </h2>
            <p style={{ ...sans, fontSize: '17px', color: '#555555', lineHeight: 1.8, marginBottom: '16px' }}>
              We design and deploy autonomous AI agents that handle complex, multi-step tasks
              without human intervention. These agents connect to your existing tools via APIs
              and act on real data in real time.
            </p>
            <p style={{ ...sans, fontSize: '17px', color: '#555555', lineHeight: 1.8, marginBottom: '2rem' }}>
              Built on Claude AI and OpenAI models, integrated with your CRM, email, and
              communication platforms using n8n, Make, and custom API connections.
            </p>
            <Link
              href="/automation-audit"
              style={{
                ...mono,
                fontWeight: 700,
                fontSize: '15px',
                color: '#0A0A0A',
                background: '#F97316',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Get Your Free Audit →
            </Link>
          </div>
          <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', padding: '36px' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
              // agent examples
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {AGENT_EXAMPLES.map((ex) => (
                <li key={ex} style={{ display: 'flex', alignItems: 'center', gap: '12px', ...sans, fontSize: '15px', color: '#333333' }}>
                  <span style={{ width: '4px', height: '4px', background: '#F97316', flexShrink: 0, display: 'inline-block' }} />
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Service 2: AI Websites */}
      <section style={{ background: '#FAFAFA', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div
          style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gap: '4rem', alignItems: 'center' }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', padding: '36px', order: 2 }} className="lg:order-1">
            <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
              // website features
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {WEBSITE_FEATURES.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', ...sans, fontSize: '15px', color: '#333333' }}>
                  <span style={{ width: '4px', height: '4px', background: '#F97316', flexShrink: 0, display: 'inline-block' }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ order: 1 }} className="lg:order-2">
            <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
              02 / AI Websites
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
              AI Websites
            </h2>
            <p style={{ ...sans, fontSize: '17px', color: '#555555', lineHeight: 1.8, marginBottom: '16px' }}>
              We build websites that actively work for your business. Not static brochure
              sites — dynamic platforms with embedded AI that engages visitors, answers
              questions, qualifies leads, and routes them automatically.
            </p>
            <p style={{ ...sans, fontSize: '17px', color: '#555555', lineHeight: 1.8, marginBottom: '2rem' }}>
              Built with Next.js and deployed on Vercel, with AI capabilities powered by
              Claude and OpenAI APIs, and backend automation via Supabase and n8n.
            </p>
            <Link
              href="/ai-websites"
              style={{
                ...mono,
                fontWeight: 700,
                fontSize: '15px',
                color: '#0A0A0A',
                background: '#F97316',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Explore AI Websites →
            </Link>
          </div>
        </div>
      </section>

      {/* Service 3: Custom Automation Systems */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
              03 / Custom Systems
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
              Custom Automation Systems
            </h2>
            <p style={{ ...sans, fontSize: '17px', color: '#555555', lineHeight: 1.8 }}>
              End-to-end automation architecture for organisations that need more than
              off-the-shelf tools. We analyse, design, build, and maintain complete
              automation ecosystems tailored to your operations.
            </p>
          </div>

          <div
            style={{ display: 'grid', gap: '1px', background: '#E5E5E5' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {AUTOMATION_STEPS.map((s) => (
              <div key={s.step} style={{ background: '#FAFAFA', padding: '32px' }}>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '48px', color: 'rgba(249,115,22,0.12)', letterSpacing: '-0.04em', marginBottom: '12px', lineHeight: 1 }}>
                  {s.step}
                </p>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '18px', color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: '10px' }}>
                  {s.title}
                </h3>
                <p style={{ ...sans, fontSize: '15px', color: '#666666', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Get Started
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#FAFAFF', marginBottom: '20px' }}>
            Not sure which service is right for you?
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: '#6B6B7A', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            Run our free Automation Audit and we&apos;ll identify exactly where automation
            can deliver the highest impact for your organisation.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              style={{
                ...mono,
                fontWeight: 700,
                fontSize: '15px',
                color: '#0A0A0A',
                background: '#F97316',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Free Automation Audit
            </Link>
            <Link
              href="/contact"
              style={{
                ...sans,
                fontWeight: 500,
                fontSize: '15px',
                color: '#FAFAFF',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
