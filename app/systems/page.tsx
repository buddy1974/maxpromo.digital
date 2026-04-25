import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Systems & Services',
  description:
    'Every AI system, automation service, and digital product we build — production-grade, AI-powered, delivered in 14 days.',
}

const SYSTEMS = [
  {
    icon: '🤖',
    title: 'AI Automation',
    desc: 'We build AI agents and autonomous systems that run business operations 24/7. Lead qualification, invoice chasing, customer support, reporting — all handled by AI.',
    tags: ['Claude AI', 'n8n', 'API'],
    cta: 'See Automation Lab →',
    href: '/automation-lab',
  },
  {
    icon: '⚙️',
    title: 'Workflow Automation',
    desc: 'Custom workflows that connect your tools and eliminate manual data entry, email sending, and repetitive task execution permanently.',
    tags: ['n8n', 'Zapier', 'API'],
    cta: 'Get Free Audit →',
    href: '/automation-audit',
  },
  {
    icon: '🏢',
    title: 'Business Automation',
    desc: 'Rebuild entire departments — invoicing, onboarding, compliance, reporting — so humans are only involved when genuinely needed.',
    tags: ['Claude AI', 'n8n', 'Custom'],
    cta: 'Start Discovery →',
    href: '/discovery',
  },
  {
    icon: '🔄',
    title: 'Digital Transformation',
    desc: 'Move from spreadsheets, paper forms, and WhatsApp groups to intelligent digital systems. We map your operations and rebuild the foundation properly.',
    tags: ['Next.js', 'AI', 'Cloud'],
    cta: 'Book Consultation →',
    href: '/contact',
  },
  {
    icon: '💻',
    title: 'Custom Software Development',
    desc: 'Admin panels, business dashboards, internal tools, client portals, booking systems and management platforms built for how your business actually works.',
    tags: ['Next.js', 'TypeScript', 'Neon'],
    cta: 'View Portfolio →',
    href: '/portfolio',
  },
  {
    icon: '🎨',
    title: 'Website Design',
    desc: 'Professional websites for businesses, organisations and startups. Mobile optimised, fast, secure, and built to convert visitors into clients.',
    tags: ['Next.js', 'Tailwind', 'Vercel'],
    cta: 'Get Instant Estimate →',
    href: '/estimate',
  },
  {
    icon: '🌐',
    title: 'Web Development',
    desc: 'Modern websites and web applications built with fast, secure and scalable technology. Custom built — no templates, no page builders.',
    tags: ['Next.js', 'TypeScript', 'Vercel'],
    cta: 'Get Instant Estimate →',
    href: '/estimate',
  },
  {
    icon: '💬',
    title: 'AI Chatbots & Assistants',
    desc: 'AI assistants trained on your business knowledge that answer customer questions, qualify leads, and handle support — 24 hours a day.',
    tags: ['Claude AI', 'Next.js', 'API'],
    cta: 'See Example →',
    href: '/#chat',
  },
  {
    icon: '🧑‍💻',
    title: 'AI Digital Twin',
    desc: 'Your AI-powered digital presence — video content created using your voice clone and avatar. Scripts by Claude, voice by ElevenLabs, face by HeyGen.',
    tags: ['ElevenLabs', 'HeyGen', 'Claude AI'],
    cta: 'Learn More →',
    href: '/ai-digital-twin',
  },
  {
    icon: '📄',
    title: 'Document Intelligence',
    desc: 'AI that reads invoices, contracts, forms and reports — extracts data, validates it, and posts it to your systems automatically.',
    tags: ['Claude AI', 'OCR', 'API'],
    cta: 'Get Free Audit →',
    href: '/automation-audit',
  },
  {
    icon: '📱',
    title: 'Social Media Automation',
    desc: 'AI-generated content published on schedule. Comment replies automated. Queue self-fills weekly. Your social presence runs without you.',
    tags: ['n8n', 'Claude AI', 'Meta API'],
    cta: 'See How It Works →',
    href: '/automation-lab',
  },
  {
    icon: '🔗',
    title: 'API Integration',
    desc: 'Connect your apps, CRM, accounting, booking system and payment gateway so data flows automatically between all your tools.',
    tags: ['REST API', 'Webhooks', 'n8n'],
    cta: 'Start Discovery →',
    href: '/discovery',
  },
  {
    icon: '☁️',
    title: 'Cloud Solutions',
    desc: 'Deploy on modern cloud infrastructure — Vercel, Neon, Cloudflare. Scalable, secure, reliable. No shared hosting that falls over under real traffic.',
    tags: ['Vercel', 'Cloudflare', 'Neon'],
    cta: 'Get Instant Estimate →',
    href: '/estimate',
  },
  {
    icon: '🎯',
    title: 'IT Consulting',
    desc: 'Technical consulting on automation strategy, software architecture, AI systems and digital infrastructure. Honest assessment — no upsell, no jargon.',
    tags: ['Strategy', 'Architecture', 'AI'],
    cta: 'Book Consultation →',
    href: '/contact',
  },
  {
    icon: '🍽️',
    title: 'Restaurant OS',
    desc: 'QR ordering, group payments, kitchen display, analytics. Customers order from their phone, split bills, pay — no app download needed.',
    tags: ['Next.js', 'Stripe', 'Real-time'],
    cta: 'View Live Demo →',
    href: '/portfolio',
  },
  {
    icon: '🏛️',
    title: 'Business Operating System',
    desc: 'Full business OS with multiple modules — CRM, invoicing, staff management, AI agents, dashboards and automated reporting all in one platform.',
    tags: ['Next.js', 'Claude AI', 'Neon'],
    cta: 'View Portfolio →',
    href: '/portfolio',
  },
]

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

export default function SystemsPage() {
  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>
      {/* Header */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // WHAT WE BUILD
          </p>
          <h1
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '20px',
            }}
          >
            Systems &amp; Services
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '40rem', margin: '0 auto', lineHeight: 1.8 }}>
            Every system we build is production-grade, AI-powered, and delivered in 14 days.
          </p>
        </div>
      </section>

      {/* Card grid */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SYSTEMS.map((sys) => (
              <div
                key={sys.title}
                className="dark-card"
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '12px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent line — always subtle, brightens via dark-card hover */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, hsl(28 100% 58% / 0.4) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Icon */}
                <span
                  style={{
                    fontSize: '32px',
                    display: 'block',
                    marginBottom: '16px',
                    lineHeight: 1,
                  }}
                >
                  {sys.icon}
                </span>

                {/* Title */}
                <h2
                  style={{
                    ...grotesk,
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'hsl(40 30% 96%)',
                    letterSpacing: '-0.02em',
                    marginBottom: '10px',
                  }}
                >
                  {sys.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    ...sans,
                    fontSize: '14px',
                    color: 'hsl(40 30% 96% / 0.65)',
                    lineHeight: 1.75,
                    flex: 1,
                    marginBottom: '20px',
                  }}
                >
                  {sys.desc}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {sys.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        ...mono,
                        fontSize: '10px',
                        color: 'hsl(28 100% 58%)',
                        background: 'rgba(249,115,22,0.1)',
                        border: '1px solid rgba(249,115,22,0.2)',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link href={sys.href} className="sys-cta">
                  {sys.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            // Not sure where to start?
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            Run the free audit first
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            5 minutes. No calls. No commitment. We identify your highest-impact
            automation opportunities and recommend exactly where to start.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{ ...mono, fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: 'hsl(28 100% 58%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px', boxShadow: '0 0 30px hsl(28 100% 58% / 0.25)' }}
            >
              Get my free audit
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{ ...sans, fontWeight: 500, fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}
            >
              Talk to our team →
            </Link>
          </div>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em' }}>
            // 3 onboarding slots open this month · Average delivery: 14 days
          </p>
        </div>
      </section>
    </main>
  )
}
