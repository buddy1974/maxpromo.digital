import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Maxpromo Digital',
  description:
    'Maxpromo Digital is an AI automation agency — building agents, workflows, and intelligent platforms that eliminate manual work and drive measurable ROI.',
}

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

const STACK_ROWS = [
  {
    label: '// AI & AUTOMATION',
    tools: ['Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier', 'LangChain', 'Airtable'],
  },
  {
    label: '// INFRASTRUCTURE',
    tools: ['Supabase', 'Neon', 'Vercel', 'Render', 'Next.js', 'Cloudflare', 'Resend', 'Twilio'],
  },
  {
    label: '// INTEGRATIONS',
    tools: ['HubSpot', 'Notion', 'Slack', 'Xero', 'Google Workspace', 'Shopify', 'Zendesk'],
  },
]

const VALUES = [
  {
    num: '01',
    title: 'Results before aesthetics',
    desc: 'Every system we build is measured by what it saves or earns — not how impressive the architecture looks on a diagram.',
  },
  {
    num: '02',
    title: 'Minimum viable complexity',
    desc: 'The simplest automation that solves the problem is always the right automation. We resist over-engineering by default.',
  },
  {
    num: '03',
    title: 'Production-first mindset',
    desc: 'We build for live systems from day one. Staging environments, error handling, monitoring — not an afterthought.',
  },
  {
    num: '04',
    title: 'Transparent delivery',
    desc: 'Fixed-price scopes, clear milestones, and no surprises. You know exactly what you are getting before we write a line of code.',
  },
]

export default function AboutPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>

      {/* ── Header ── */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            About
          </p>
          <h1
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: '#0A0A0A',
              marginBottom: '20px',
              maxWidth: '44rem',
            }}
          >
            We build the systems that eliminate manual work
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: '#555555', maxWidth: '44rem', lineHeight: 1.8 }}>
            Maxpromo Digital is the AI arm of MaxPromo — an automation agency
            specialising in AI agents, workflow automation, and intelligent platforms.
            We work with organisations that are serious about operational efficiency.
          </p>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={{ background: '#FAFAFA', padding: '5rem 2rem', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              How We Work
            </p>
            <h2
              style={{
                ...grotesk,
                fontWeight: 700,
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                letterSpacing: '-0.04em',
                color: '#0A0A0A',
              }}
            >
              Principles we build by
            </h2>
          </div>

          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {VALUES.map((v) => (
              <div
                key={v.num}
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '36px 32px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.5) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ ...mono, fontSize: '11px', color: '#444444', letterSpacing: '0.1em', display: 'block', marginBottom: '16px' }}>
                  {v.num}
                </span>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '16px', color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                  {v.title}
                </h3>
                <p style={{ ...sans, fontSize: '14px', color: '#888888', lineHeight: 1.75 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Tech Stack
            </p>
            <h2
              style={{
                ...grotesk,
                fontWeight: 700,
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
              }}
            >
              The tools we deploy
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {STACK_ROWS.map((row) => (
              <div key={row.label}>
                <p style={{ ...mono, fontSize: '10px', color: '#444444', letterSpacing: '0.15em', marginBottom: '12px' }}>
                  {row.label}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {row.tools.map((tool) => (
                    <span
                      key={tool}
                      style={{
                        ...mono,
                        fontSize: '12px',
                        color: '#CCCCCC',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '7px 16px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Work With Us
          </p>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.04em',
              color: '#FAFAFF',
              marginBottom: '20px',
            }}
          >
            Ready to automate your operations?
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: '#6B6B7A', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            Start with a free audit. We identify your highest-impact automation
            opportunities before any commitment is made.
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
              Free Automation Audit →
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
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
