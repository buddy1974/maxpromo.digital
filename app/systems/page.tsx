import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Industry Operating Systems We Install',
  description:
    'Configurable business operating systems derived from real deployments — for restaurants, trades, clinics, care providers, publishers, print shops, and property companies.',
}

interface App {
  name: string
  category: string
  desc: string
  features: string[]
  tags: string[]
  productPage: string
  contactSlug: string
  publicDemo?: string
  demoNote: string
}

const APPS: App[] = [
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
    productPage: '/products/restaurant-os',
    contactSlug: 'restaurant-os',
    publicDemo: 'https://restaurant-os-one.vercel.app',
    demoNote: 'Test card: 4242 4242 4242 4242',
  },
  {
    name: 'PraxisOS',
    category: 'Medical Practice',
    desc: 'Complete digital operating system for specialist medical practices in Germany. 16 modules covering the entire practice workflow from appointment to billing.',
    features: [
      '16 operational modules',
      'Patient records & lab results',
      'Appointment & billing management',
      'DSGVO-compliant data handling',
    ],
    tags: ['Next.js', 'Neon', 'Claude AI'],
    productPage: '/products/praxis-os',
    contactSlug: 'praxis-os',
    demoNote: 'Demo available on request',
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
    productPage: '/products/handwerk-os',
    contactSlug: 'handwerk-os',
    publicDemo: 'https://handwerkos.vercel.app',
    demoNote: 'Demo login available',
  },
  {
    name: 'CareOS',
    category: 'Care & Healthcare',
    desc: 'Full operating system for registered care providers, built from a live UK care provider deployment. Includes a 24/7 AI care assistant, family portal, automated compliance workflows, and a complete care management suite.',
    features: [
      '24/7 AI care assistant',
      'Family portal for relatives',
      '16 operational modules',
      'Automated compliance workflows',
    ],
    tags: ['Next.js', 'Claude AI', 'Neon'],
    productPage: '/products/care-os',
    contactSlug: 'care-os',
    demoNote: 'Demo available on request',
  },
  {
    name: 'PrintShop OS',
    category: 'Print & Production',
    desc: 'AI-powered print shop management platform. Customers configure products, upload files, and the AI validates them in real time. Full order and admin system, white-label ready.',
    features: [
      'AI file validation on upload',
      'Product configurator & checkout',
      'Order & production management',
      'White-label ready',
    ],
    tags: ['Next.js', 'Claude AI', 'Stripe'],
    productPage: '/products/printshop',
    contactSlug: 'printshop-os',
    publicDemo: 'https://printshop.maxpromo.digital',
    demoNote: 'Demo login available',
  },
  {
    name: 'PublishingOS',
    category: 'Publishing & Media',
    desc: 'Business operating system built from a live publishing company deployment, running 8 autonomous AI agents 24/7. Invoice chasing, stock monitoring, staff performance, revenue forecasting, and multilingual WhatsApp — all automated.',
    features: [
      '8 autonomous AI agents',
      'Daily automated reporting & briefings',
      'Multilingual WhatsApp agent',
      'Revenue forecasting & competitor monitoring',
    ],
    tags: ['Next.js', 'Claude AI', 'n8n', 'Neon'],
    productPage: '/products/publishing-os',
    contactSlug: 'publishing-os',
    demoNote: 'Demo available on request',
  },
  {
    name: 'RealEstateOS',
    category: 'Property & Investment',
    desc: 'Private AI-powered property intelligence platform built from a live UK property auction deployment. Manages large investor databases, analyses any deal in seconds, and runs targeted email campaigns.',
    features: [
      'AI property deal analysis (seconds)',
      'Full investor CRM',
      'Campaign studio with AI subject lines',
      '5 financial calculators',
    ],
    tags: ['Next.js', 'Claude AI', 'Drizzle ORM'],
    productPage: '/products/real-estate-os',
    contactSlug: 'real-estate-os',
    demoNote: 'Demo available on request',
  },
]

const mono    = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans    = { fontFamily: 'var(--font-inter)' } as const

const BEFORE = ['Spreadsheets', 'WhatsApp', 'Paper records', 'Manual chasing', 'Disconnected tools']
const AFTER  = ['AI agents', 'Automated workflows', 'Live dashboards', 'Centralised records', 'One operating system']

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
            Industry Operating Systems We Install
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '48rem', margin: '0 auto', lineHeight: 1.8 }}>
            These systems started as real deployments. Now they form the foundation of configurable business operating systems for restaurants, trades, clinics, care providers, publishers, print shops, and property companies.
          </p>
        </div>
      </section>

      {/* Before / After */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '3.5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <h2
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              letterSpacing: '-0.03em',
              color: 'hsl(40 30% 96%)',
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            From manual operations to installed systems.
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '0',
              background: 'hsl(240 12% 7%)',
              border: '1px solid hsl(40 30% 96% / 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            {/* Before */}
            <div style={{ padding: '28px 32px', borderRight: '1px solid hsl(40 30% 96% / 0.06)' }}>
              <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Before
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {BEFORE.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)' }}>
                    <span style={{ color: 'hsl(0 84% 60%)', flexShrink: 0, fontSize: '13px' }}>✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* After */}
            <div style={{ padding: '28px 32px' }}>
              <p style={{ ...mono, fontSize: '10px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
                After
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {AFTER.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '15px', color: 'hsl(40 30% 96%)' }}>
                    <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0, fontSize: '13px', fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* App cards — 2-column grid */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '3rem 2rem 4rem' }}>
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
                      <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0, fontWeight: 700, fontSize: '12px', marginTop: '1px' }}>
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
                  <Link href={app.productPage} className="sys-cta">
                    Explore System →
                  </Link>
                  <Link href={`/contact?system=${app.contactSlug}`} className="sys-cta-ghost">
                    Request Similar System →
                  </Link>
                </div>

                {/* Demo note */}
                <p
                  style={{
                    ...mono,
                    fontSize: '10px',
                    color: 'hsl(240 8% 35%)',
                    margin: '12px 0 0',
                    letterSpacing: '0.04em',
                  }}
                >
                  {app.publicDemo ? (
                    <>
                      {'// '}
                      <a
                        href={app.publicDemo}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'hsl(28 100% 58%)', textDecoration: 'none' }}
                      >
                        View Live →
                      </a>
                      {app.demoNote !== 'Demo login available' && ` · ${app.demoNote}`}
                    </>
                  ) : (
                    `// ${app.demoNote}`
                  )}
                </p>
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
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
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
          <p style={{ ...mono, fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em' }}>
            // Average delivery: 14 days · 3 onboarding slots open this month
          </p>
        </div>
      </section>

    </main>
  )
}
