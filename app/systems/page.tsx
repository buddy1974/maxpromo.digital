import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Systems We Have Built',
  description:
    'Real platforms. Real clients. All live, all in production — AI-powered systems built by MAXPROMO DIGITAL.',
}

const APPS = [
  {
    name: 'Restaurant OS',
    category: 'Restaurant & Hospitality',
    desc: 'QR-based table ordering system with group bill splitting and integrated payments. Customers scan, order, pay — no app download. Kitchen gets live order display.',
    features: [
      'QR code table ordering',
      'Group bill splitting & individual payments',
      'Live kitchen display system',
      'Analytics dashboard',
    ],
    tags: ['Next.js', 'Stripe', 'Real-time'],
    demo: 'https://restaurant-os-one.vercel.app',
    demoNote: 'Test card: 4242 4242 4242 4242',
  },
  {
    name: 'PraxisOS',
    category: 'Medical Practice',
    desc: 'Complete digital operating system for a urology practice in Germany. 16 modules covering the entire practice workflow from appointment to billing.',
    features: [
      '16 operational modules',
      'Patient records & lab results',
      'Appointment & billing management',
      'DSGVO-compliant data handling',
    ],
    tags: ['Next.js', 'Neon', 'Claude AI'],
    demo: 'https://urologie-six.vercel.app',
    demoNote: 'Demo login available',
  },
  {
    name: 'HandwerkOS',
    category: 'Trade & Construction',
    desc: 'SaaS platform for trade businesses — electricians, builders, plumbers. Workers photograph handwritten job notes and AI reads them, filling all fields automatically.',
    features: [
      'AI reads handwritten job notes',
      'Job management & scheduling',
      'Customer & invoice management',
      'Works in German and English',
    ],
    tags: ['Next.js', 'Claude AI', 'TypeScript'],
    demo: 'https://handwerkos.vercel.app',
    demoNote: 'Demo login available',
  },
  {
    name: 'Envico CareOS',
    category: 'Care & Healthcare',
    desc: 'Full operating system for a registered care provider. Includes AI assistant Donna running 24/7, family portal, automated workflows, and a complete care management suite.',
    features: [
      'AI assistant Donna (24/7)',
      'Family portal for relatives',
      '16 operational modules',
      'Automated compliance workflows',
    ],
    tags: ['Next.js', 'Claude AI', 'Neon'],
    demo: 'https://envico.maxpromo.digital',
    demoNote: 'Demo login available',
  },
  {
    name: 'PrintShop',
    category: 'Print & Production',
    desc: 'AI-powered print shop management platform. Customers configure products, upload files, and the AI validates them in real time. Full order and admin system.',
    features: [
      'AI file validation on upload',
      'Product configurator & checkout',
      'Order & production management',
      'White-label ready',
    ],
    tags: ['Next.js', 'Claude AI', 'Stripe'],
    demo: 'https://printshop.maxpromo.digital',
    demoNote: 'Demo login available',
  },
  {
    name: 'NMI Automation OS',
    category: 'Education & Training',
    desc: 'Business operating system for an education company with 8 autonomous AI agents running 24/7. Invoice chasing, stock monitoring, staff performance, revenue forecasting, WhatsApp — all automated.',
    features: [
      '8 autonomous AI agents',
      'CEO morning briefing (daily, automated)',
      'WhatsApp agent (FR + EN)',
      'Revenue forecasting & competitor monitoring',
    ],
    tags: ['Next.js', 'Claude AI', 'n8n', 'Neon'],
    demo: 'https://nmi.maxpromo.digital',
    demoNote: 'Demo login available',
  },
  {
    name: 'Midas OS',
    category: 'Property & Investment',
    desc: 'Private AI-powered property intelligence platform for a UK property auction company. Manages 2,847 investor contacts, analyses any deal in 8 seconds, runs email campaigns.',
    features: [
      'AI property deal analysis (8 seconds)',
      '2,847 investor CRM',
      'Campaign studio with AI subject lines',
      '5 financial calculators',
    ],
    tags: ['Next.js', 'Claude AI', 'Drizzle ORM'],
    demo: 'https://midas-property-sam.vercel.app',
    demoNote: 'Demo access on request',
  },
]

const mono    = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans    = { fontFamily: 'var(--font-inter)' } as const

export default function SystemsPage() {
  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>

      {/* Header */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // LIVE IN PRODUCTION
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
            Systems We Have Built
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '40rem', margin: '0 auto', lineHeight: 1.8 }}>
            Real platforms. Real clients. All live, all in production. Click to explore.
          </p>
        </div>
      </section>

      {/* App cards — 2-column grid */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '16px' }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            {APPS.map((app) => (
              <div
                key={app.name}
                className="dark-card"
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '12px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, hsl(28 100% 58% / 0.5) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Category badge */}
                <span
                  style={{
                    ...mono,
                    fontSize: '10px',
                    color: 'hsl(28 100% 58%)',
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '16px',
                    alignSelf: 'flex-start',
                  }}
                >
                  {app.category}
                </span>

                {/* Name */}
                <h2
                  style={{
                    ...grotesk,
                    fontWeight: 700,
                    fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
                    letterSpacing: '-0.03em',
                    color: 'hsl(40 30% 96%)',
                    marginBottom: '12px',
                  }}
                >
                  {app.name}
                </h2>

                {/* Description */}
                <p
                  style={{
                    ...sans,
                    fontSize: '15px',
                    color: 'hsl(40 12% 65%)',
                    lineHeight: 1.75,
                    marginBottom: '20px',
                  }}
                >
                  {app.desc}
                </p>

                {/* Features */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1,
                  }}
                >
                  {app.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        ...sans,
                        fontSize: '14px',
                        color: 'hsl(40 30% 96% / 0.75)',
                      }}
                    >
                      <span
                        style={{
                          color: 'hsl(28 100% 58%)',
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: '12px',
                          marginTop: '1px',
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        ...mono,
                        fontSize: '10px',
                        color: 'hsl(40 12% 65%)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href={app.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sys-cta"
                  >
                    View Live →
                  </a>
                  <Link href="/portfolio" className="sys-cta-ghost">
                    View in Portfolio →
                  </Link>
                </div>

                {/* Demo note */}
                {app.demoNote && (
                  <p
                    style={{
                      ...mono,
                      fontSize: '10px',
                      color: 'hsl(240 8% 35%)',
                      margin: '10px 0 0',
                      letterSpacing: '0.04em',
                    }}
                  >
                    // {app.demoNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            // BUILD YOURS
          </p>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '16px',
            }}
          >
            Want a system like this
            <br />built for your business?
          </h2>
          <p
            style={{
              ...sans,
              fontSize: '17px',
              color: 'hsl(40 12% 65%)',
              marginBottom: '2.5rem',
              lineHeight: 1.8,
            }}
          >
            Every system above was built from scratch. Yours is next.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/discovery"
              className="shine"
              style={{
                ...mono,
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
              Start Discovery →
            </Link>
            <Link
              href="/estimate"
              className="glass"
              style={{
                ...sans,
                fontWeight: 500,
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              Get Instant Estimate →
            </Link>
          </div>
          <p
            style={{
              ...mono,
              fontSize: '11px',
              color: 'hsl(240 8% 35%)',
              marginTop: '20px',
              letterSpacing: '0.05em',
            }}
          >
            // Average delivery: 14 days · 3 onboarding slots open this month
          </p>
        </div>
      </section>

    </main>
  )
}
