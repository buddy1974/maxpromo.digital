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

/**
 * Architecture composition — the four layers every system we install
 * sits on. Reads bottom-up the way infrastructure stacks normally do:
 * sources at the bottom, outcomes at the top, orchestration in between.
 *
 * The point of this section is not to teach the visitor systems
 * engineering. It is to demonstrate that we think about an operation
 * as a layered architecture, not as a pile of automations. That is
 * the signal that separates infrastructure companies from agencies.
 */
const ARCHITECTURE_LAYERS = [
  {
    no: '04',
    name: 'OUTCOME',
    desc: 'Your team. Your tools. Your customer.',
    items: ['Confirmation sent', 'Calendar updated', 'Invoice posted', 'Slack notified', 'Audit logged'],
  },
  {
    no: '03',
    name: 'ORCHESTRATION',
    desc: 'The control plane. Routing logic, escalation policy, audit trail, governance — runs the operation.',
    items: ['Routing rules', 'Escalation chains', 'Audit trail', 'Drift alerts', 'Governance policy'],
  },
  {
    no: '02',
    name: 'INTAKE',
    desc: 'Every channel captured, qualified, normalised. The operation no longer cares where the request came from.',
    items: ['Multi-channel capture', 'Identity resolution', 'Qualification', 'Normalisation', 'Deduplication'],
  },
  {
    no: '01',
    name: 'SOURCES',
    desc: 'Where work enters your operation today — most of it untracked.',
    items: ['Email', 'Phone', 'WhatsApp', 'Web forms', 'Walk-ins', 'CRM events'],
  },
]

/**
 * Lifecycle pipeline — what happens to a single piece of work as it
 * passes through the system. Five stages, named the way operations
 * teams name them, not the way developers name them.
 */
const LIFECYCLE = [
  { no: '01', name: 'Intake',   desc: 'Request arrives. Channel-agnostic. Captured with timestamp + context.' },
  { no: '02', name: 'Qualify',  desc: 'Score against business rules. Confidence noted. Below threshold → review.' },
  { no: '03', name: 'Route',    desc: 'Send to the right team, shift, or runtime. Escalation rules applied.' },
  { no: '04', name: 'Act',      desc: 'System or person executes. State machine tracks progress + SLA.' },
  { no: '05', name: 'Audit',    desc: 'Outcome logged. Tamper-proof history. Drift signal recorded.' },
]

/**
 * Escalation policy — the moments where the system deliberately
 * stops and hands control back to a person. Naming these moments
 * out loud is the trust signal: it says the system is governed,
 * not autonomous-because-it-feels-modern.
 */
const ESCALATION_RULES = [
  { trigger: 'Confidence below threshold',  to: 'Human review queue · senior reviewer',  reason: 'AI uncertain — never act, always escalate.' },
  { trigger: 'Value above threshold',       to: 'Senior team · with full context',      reason: 'High-value decisions stay human.' },
  { trigger: 'After SLA breach',            to: 'On-call escalation chain',             reason: 'Time-sensitive requests must not silently age.' },
  { trigger: 'Compliance flag raised',      to: 'Audit reviewer · with evidence pack',  reason: 'Regulated work always has a named accountable human.' },
  { trigger: 'Outside business rules',      to: 'Owner notification + work paused',     reason: 'Edge cases are surfaced, not absorbed silently.' },
]

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

      {/* Architecture composition — the 4-layer stack every system sits on */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '40rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              // ARCHITECTURE
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              How a system is composed
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              Every operational runtime we install sits on the same four-layer stack — sources at the bottom, outcomes at the top, the control plane in between.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ARCHITECTURE_LAYERS.map((layer, i) => (
              <div
                key={layer.no}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderLeft: `3px solid ${i === 1 ? '#F97316' : 'hsl(40 30% 96% / 0.15)'}`,
                  borderRadius: '8px',
                  padding: '20px 24px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                }}
                className="grid-cols-1 md:grid-cols-[180px_1fr_auto]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65%)', letterSpacing: '0.15em', marginBottom: '4px' }}>
                    LAYER {layer.no}
                  </p>
                  <p style={{ ...mono, fontSize: '14px', color: 'hsl(40 30% 96%)', letterSpacing: '0.08em', fontWeight: 700, margin: 0 }}>
                    {layer.name}
                  </p>
                </div>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                  {layer.desc}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '320px' }}>
                  {layer.items.map((it) => (
                    <span key={it} style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65%)', background: 'hsl(240 14% 4%)', border: '1px solid hsl(40 30% 96% / 0.08)', padding: '4px 10px', borderRadius: '3px', letterSpacing: '0.04em' }}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...mono, fontSize: '11px', color: 'hsl(240 8% 35%)', marginTop: '20px', letterSpacing: '0.05em', textAlign: 'center' }}>
            // Flow: SOURCES → INTAKE → ORCHESTRATION → OUTCOME — every request traced end to end
          </p>
        </div>
      </section>

      {/* Lifecycle pipeline — five stages a request passes through */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '40rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              // LIFECYCLE
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              How a request passes through
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              Five stages, named the way an operations team names them. Each stage produces audit signal — nothing happens silently.
            </p>
          </div>

          <div
            style={{ display: 'grid', gap: '0', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }}
            className="grid-cols-1 md:grid-cols-5"
          >
            {LIFECYCLE.map((step, i) => (
              <div
                key={step.no}
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '24px 22px',
                  borderTop: `2px solid ${i === LIFECYCLE.length - 1 ? 'rgba(34,197,94,0.5)' : 'rgba(249,115,22,0.4)'}`,
                  position: 'relative',
                }}
              >
                <p style={{ ...mono, fontSize: '10px', color: 'hsl(28 100% 58%)', letterSpacing: '0.15em', marginBottom: '6px' }}>
                  {step.no}
                </p>
                <p style={{ ...grotesk, fontSize: '16px', fontWeight: 700, color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                  {step.name}
                </p>
                <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 12% 65%)', lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation policy — the moments where the system stops and a human takes over */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '44rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              // ESCALATION POLICY
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', margin: '0 0 14px' }}>
              When the system steps back
            </h2>
            <p style={{ ...sans, fontSize: '15px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
              A governed system names its boundaries out loud. These are the moments where the runtime deliberately stops, surfaces context, and hands control to a named human.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ESCALATION_RULES.map((rule, i) => (
              <div
                key={rule.trigger}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '8px',
                  padding: '18px 22px',
                  display: 'grid',
                  gap: '20px',
                  alignItems: 'start',
                }}
                className="grid-cols-1 md:grid-cols-[200px_1fr_2fr]"
              >
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Trigger
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96%)', fontWeight: 600, margin: 0 }}>
                    {rule.trigger}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Hands to
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96%)', margin: 0 }}>
                    {rule.to}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Why
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.55, margin: 0 }}>
                    {rule.reason}
                  </p>
                </div>
              </div>
            ))}
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
