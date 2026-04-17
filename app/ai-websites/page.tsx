import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Websites',
  description:
    'Websites enhanced with AI capabilities — chat assistants, automated lead capture, knowledge bots, and smart search systems built with Next.js.',
}

const FEATURES = [
  {
    icon: '◻',
    title: 'AI Chat Assistants',
    description:
      'Embed an AI assistant trained on your business content that answers visitor questions, qualifies leads, and books calls — 24 hours a day.',
  },
  {
    icon: '↗',
    title: 'Automated Lead Capture',
    description:
      'Intelligently capture and qualify visitors through conversational flows. Only the best leads reach your inbox, pre-qualified and ready to close.',
  },
  {
    icon: '⬡',
    title: 'Knowledge Bots',
    description:
      'Deploy a bot trained on your documentation, FAQs, and product information — reducing support volume and improving customer self-service.',
  },
  {
    icon: '⟳',
    title: 'Smart Search Systems',
    description:
      'Replace keyword search with semantic AI search that understands intent, surfacing the right content even when visitors use different phrasing.',
  },
  {
    icon: '▸',
    title: 'Automated Email Sequences',
    description:
      'Trigger personalised email sequences based on visitor behaviour, form submissions, or chatbot interactions — connected to your CRM.',
  },
  {
    icon: '◆',
    title: 'Analytics & Reporting',
    description:
      'Track AI interaction metrics, lead conversion rates, and chatbot performance from a central dashboard.',
  },
]

const TECH_STACK = [
  { name: 'Next.js 14', desc: 'App Router, server components, edge functions' },
  { name: 'Claude / OpenAI', desc: 'AI models for chat and content generation' },
  { name: 'Vercel', desc: 'Global CDN deployment with zero config' },
  { name: 'Supabase', desc: 'Database, auth, and real-time data' },
  { name: 'Resend', desc: 'Transactional email and lead notifications' },
  { name: 'n8n / Make', desc: 'Backend workflow automation and CRM sync' },
]

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

export default function AIWebsitesPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            AI Websites
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
            Websites That Work For You
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: '#555555', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.8 }}>
            Not brochure sites. Dynamic AI-powered platforms that engage visitors,
            answer questions, qualify leads, and drive conversions — automatically.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ background: '#FAFAFA', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
            Capabilities
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#0A0A0A', textAlign: 'center', marginBottom: '3.5rem' }}>
            AI-Enhanced Capabilities
          </h2>
          <div
            style={{ display: 'grid', gap: '1px', background: '#E5E5E5' }}
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{ background: '#FFFFFF', padding: '36px' }}
              >
                <span style={{ ...mono, fontSize: '20px', color: '#F97316', display: 'block', marginBottom: '16px' }}>
                  {f.icon}
                </span>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '18px', color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: '10px' }}>
                  {f.title}
                </h3>
                <p style={{ ...sans, fontSize: '15px', color: '#666666', lineHeight: 1.7 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
            Tech Stack
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#0A0A0A', textAlign: 'center', marginBottom: '12px' }}>
            Our Technology Stack
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: '#666666', textAlign: 'center', marginBottom: '3.5rem', lineHeight: 1.7 }}>
            Production-grade technologies chosen for performance, scalability, and AI capability.
          </p>
          <div
            style={{ display: 'grid', gap: '1px', background: '#E5E5E5' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TECH_STACK.map((t) => (
              <div key={t.name} style={{ background: '#FAFAFA', padding: '28px' }}>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '16px', color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  {t.name}
                </p>
                <p style={{ ...sans, fontSize: '14px', color: '#888888', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* This site as a demo */}
      <section style={{ background: '#FFF4ED', padding: '3.5rem 2rem', borderTop: '1px solid #FFE0CC', borderBottom: '1px solid #FFE0CC' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Live Demo
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '24px', color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            This website is an AI website
          </h2>
          <p style={{ ...sans, fontSize: '15px', color: '#555555', lineHeight: 1.7 }}>
            MaxPromo.digital itself demonstrates the capabilities we build. The chat assistant
            in the bottom right, the automation audit tool, and the contact form are all powered
            by the same AI infrastructure we deploy for clients.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Start a Project
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#FAFAFF', marginBottom: '20px' }}>
            Ready for an AI-powered website?
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: '#6B6B7A', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            Let&apos;s discuss what your site could do with AI built in from the ground up.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/contact"
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
              Start a Project
            </Link>
            <Link
              href="/automation-audit"
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
              Free Automation Audit
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
