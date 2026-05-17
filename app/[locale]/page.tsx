import Hero from '@/components/Hero'
import ProofSection from '@/components/ProofSection'
import PricingSection from '@/components/PricingSection'
import FaqSection from '@/components/FaqSection'
import ROICalculator from '@/components/ROICalculator'
import NewsletterSignup from '@/components/NewsletterSignup'
import Link from 'next/link'

/* ─── DATA ─────────────────────────────────────────────────── */

/**
 * Operational scenarios — the kind of moment you only know about if
 * you have actually been inside an operation. Each one pairs a real
 * business pain (timestamp, scene, bottleneck) with the system we
 * installed and the measurable outcome.
 *
 * This is the single hardest section on the site to fake. Strategic
 * directive: real operational storytelling is what removes the
 * remaining "AI agency" perception. The pattern follows
 * Pain → Bottleneck → System → Result, as praised in the prior
 * invoice section.
 */
const SCENARIOS = [
  {
    industry: 'Restaurant',
    time: 'Friday · 22:47',
    scene: 'Three people walk past the QR code outside. Two screenshot it for later. By Sunday morning, they have forgotten.',
    bottleneck: 'After-hours capture is broken across voicemail, social DMs, and paper notes. Nothing routes to the floor manager until Monday — if at all.',
    system: 'RestaurantOS Intake',
    systemDesc: 'Every after-hours enquiry captured, qualified, confirmed within two minutes. Routing rules sized to the kitchen capacity for that day.',
    result: '+34 covers / month',
    resultDetail: 'previously lost to voicemail',
    href: '/products/restaurant-os',
  },
  {
    industry: 'Medical Practice',
    time: 'Monday · 09:14',
    scene: 'Reception is on three calls. Two more come in. The fourth caller hangs up after seven rings and books with the practice down the road.',
    bottleneck: 'Phone system has no queue intelligence and no fallback to text or email. Booked appointments get logged manually into the calendar.',
    system: 'PraxisOS Intake & Triage',
    systemDesc: 'Overflow calls route to AI triage that captures intent, books available slots, or schedules a callback — with full audit trail per DSGVO.',
    result: '0 missed booking enquiries',
    resultDetail: 'across peak hours, last quarter',
    href: '/products/praxis-os',
  },
  {
    industry: 'Trade · Handwerk',
    time: 'Tuesday · 14:03',
    scene: 'Field tech sends a photo of the completed roof job plus a handwritten total over WhatsApp. The office retypes it into the spreadsheet. The invoice goes out Friday. Maybe.',
    bottleneck: 'A 36-hour gap between work complete and invoice sent. Cash flow lags one week behind reality. XRechnung compliance still done by hand.',
    system: 'HandwerkOS Dispatch + Document Flow',
    systemDesc: 'Photo to quote to invoice in 90 seconds. XRechnung-compliant by default. Field team works from one app; office sees it live.',
    result: 'Invoice cycle · 3 days → 12 min',
    resultDetail: '— with full audit trail and tamper-proof history',
    href: '/products/handwerk-os',
  },
  {
    industry: 'Care · CQC-regulated',
    time: 'Inspection notice. T-7 days.',
    scene: 'Reception scrambles for 47 binders. Senior carers stop care delivery to assemble evidence — care plans, training records, medication logs, incident reports.',
    bottleneck: 'Compliance evidence lives across paper, email, Drive folders, and individual carers&apos; phones. Every inspection is a fire drill that pulls senior staff off the floor for a week.',
    system: 'CareOS Compliance Continuity',
    systemDesc: 'Evidence pack assembled continuously, not at inspection time. Drift alerts when policy or training fall behind. Audit-on-demand is a button click.',
    result: 'CQC prep · 8 days → 30 minutes',
    resultDetail: 'senior carers stay on the floor',
    href: '/products/care-os',
  },
]

/**
 * Marquee — operational verbs, not tool names.
 *
 * The previous strip ("N8N WORKFLOWS · CLAUDE API · ZAPIER FLOWS · …") was
 * a tool parade — exactly the "AI freelancer skill bar" signal we're
 * moving away from. The new strip names what those tools do for the
 * business: real operational phenomena visitors recognise from their
 * own workflow.
 */
const MARQUEE_ITEMS = [
  'LEAD INTAKE · 24/7', 'DISPATCH ROUTING', 'INVOICE FLOW', 'CARE-PLAN COMPLIANCE',
  'CUSTOMER TRIAGE', 'STOCK SYNC', 'ESCALATION PATHS', 'ON-CALL ROTATION',
  'BOOKING ORCHESTRATION', 'CONTRACT INTAKE', 'PHOTO-TO-QUOTE', 'PAYMENT RECONCILIATION',
  'XRECHNUNG / CQC AUDITS', 'STAFF ALERTS', 'COMMS LOGGING', 'FIELD-OPS TRACKING',
  'KPI MONITORING', 'WORKFLOW GOVERNANCE', 'INTAKE → ACTION LOOPS', 'SHIFT HANDOVER',
]

/**
 * Operational Layers — replaces the prior generic "Services" grid.
 *
 * Each entry is a layer of the operation we install, not a capability we
 * sell. Description leads with the business pain, then names the systemic
 * fix; the chips point at the *-os products that include this layer rather
 * than at the underlying tools. Implementation details (n8n, Claude, etc.)
 * are deliberately absent — those live on the architecture page.
 */
const LAYERS = [
  {
    icon: '→',
    title: 'Client Intake Systems',
    desc: 'Enquiries land across email, phone, WhatsApp, web and walk-ins. We install the layer that captures every channel, qualifies in seconds, and routes to the right person or on-call shift — with full audit trail.',
    tags: ['Multi-channel', 'Live routing', 'Audit trail'],
    href: '/products',
  },
  {
    icon: '◰',
    title: 'Operations Coordination',
    desc: 'Field crews work off WhatsApp; office staff retype everything. GPS-tracked dispatch, photo-to-quote, time tracking, digital signatures — synced live to billing and the back office.',
    tags: ['HandwerkOS', 'Dispatch · Signatures', 'Photo-to-quote'],
    href: '/products/handwerk-os',
  },
  {
    icon: '⊟',
    title: 'Revenue Processing Systems',
    desc: 'Invoices arrive as photos and PDFs. Approvals stall. Cash flow waits on the inbox. OCR + validation, approval workflow, XRechnung-compliant invoicing, reconciliation against ledgers.',
    tags: ['XRechnung', 'OCR · Validation', 'Reconciliation'],
    href: '/services',
  },
  {
    icon: '◇',
    title: 'Communications Infrastructure',
    desc: 'One inbox absorbs support, sales, complaints, suppliers. We install the layer that classifies, drafts, escalates only what needs a human — typical inbound human-touch drop: 60–80%.',
    tags: ['Auto-triage', 'Self-service portal', 'Escalation policy'],
    href: '/services',
  },
  {
    icon: '▤',
    title: 'Compliance & Continuity',
    desc: 'CQC, GDPR, XRechnung, §19 UStG — every audit a fire drill. Continuous compliance posture, auto-assembled evidence packs, drift alerts. Audit becomes a button.',
    tags: ['CareOS · PraxisOS', 'Evidence packs', 'Drift alerts'],
    href: '/products/care-os',
  },
  {
    icon: '⌗',
    title: 'Monitoring & Escalation',
    desc: 'SLA breaches, anomalies, supplier exceptions, stock drift — surface as alerts before they become losses. Live operational KPIs with defined escalation paths and ownership.',
    tags: ['SLA monitoring', 'Anomaly detection', 'Defined escalations'],
    href: '/products',
  },
]

const SYSTEMS = [
  {
    label: 'TRADE · GERMANY',
    status: 'LIVE',
    name: 'HandwerkOS',
    desc: 'Complete field service management for German trades businesses. AI photo-to-quote in 10 seconds, GPS time tracking, XRechnung compliance, digital signatures.',
    href: '/products/handwerk-os',
  },
  {
    label: 'HOSPITALITY',
    status: 'LIVE',
    name: 'Restaurant OS',
    desc: 'QR-based ordering system with seat identity, 4 payment split modes, instant Telegram staff alerts. No app needed. Multi-tenant ready.',
    href: '/products/restaurant-os',
  },
  {
    label: 'PRINT · E-COMMERCE',
    status: 'LIVE',
    name: 'PrintShop OS',
    desc: 'Full e-commerce platform for print businesses. AI prepress checks, Fabric.js design editor, production queue, Stripe payments. EN / DE / FR.',
    href: '/products/printshop',
  },
  {
    label: 'REAL ESTATE · UK',
    status: 'DEPLOYED',
    name: 'RealEstateOS',
    desc: 'Private intelligence platform for property auction companies. AI deal analysis, investor CRM, Kanban pipeline, campaign studio, financial calculators.',
    href: '/products/real-estate-os',
  },
  {
    label: 'CARE · UK',
    status: 'DEPLOYED',
    name: 'CareOS',
    desc: 'Complete care management platform for supported living providers. Digital care plans, EMAR, CQC compliance tracker, AI assistant, family portal.',
    href: '/products/care-os',
  },
  {
    label: 'PUBLISHING · AFRICA',
    status: 'DEPLOYED',
    name: 'PublishingOS',
    desc: 'Operating system for publishing companies. Orders, stock, manuscripts, royalties, HR, finance, and 8 AI agents running 24/7.',
    href: '/products/publishing-os',
  },
  {
    label: 'MEDICAL · GERMANY',
    status: 'DEPLOYED',
    name: 'PraxisOS',
    desc: 'Digital platform for specialist medical practices. Patient portal, appointment management, lab results, GDPR compliant, German healthcare standards.',
    href: '/products/praxis-os',
  },
]

const PROCESS_STEPS = [
  { num: '01', title: 'Discovery Call', desc: 'We map your workflows and identify highest-impact automation opportunities.', time: '30 min' },
  { num: '02', title: 'System Design', desc: 'We architect agents, integrations, and data flows before any code is written.', time: '2–3 days' },
  { num: '03', title: 'Build & Test', desc: 'We deploy and rigorously test every automation in a staging environment.', time: '1–3 weeks' },
  { num: '04', title: 'Launch & Monitor', desc: 'Go live with full observability. We monitor, optimise, and iterate.', time: 'Ongoing' },
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

/* ─── HELPERS ─── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'hsl(28 100% 58%)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        letterSpacing: '-0.04em',
        color: 'hsl(40 30% 96%)',
        marginBottom: '0',
      }}
    >
      {children}
    </h2>
  )
}

function renderTerminalLine(line: typeof TERMINAL_LINES[number]) {
  const mono = { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.8' }
  if (line.type === 'blank') return <p style={{ ...mono, minHeight: '1.8em' }}>&nbsp;</p>
  if (line.type === 'cmd') {
    return (
      <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>
        <span style={{ color: 'hsl(28 100% 58%)' }}>$</span>
        {line.text.slice(1)}
      </p>
    )
  }
  if (line.type === 'check') {
    return (
      <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>
        <span style={{ color: 'hsl(28 100% 58%)' }}>  ✓</span>
        {line.text.slice(3)}
      </p>
    )
  }
  if (line.type === 'cross') return <p style={{ ...mono, color: 'hsl(40 12% 65%)' }}>{line.text}</p>
  if (line.type === 'stat') return <p style={{ ...mono, color: 'hsl(40 30% 96%)' }}>{line.text}</p>
  return <p style={{ ...mono, color: 'hsl(40 12% 65%)' }}>{line.text}</p>
}

/* ─── PAGE ─── */

export default function HomePage() {
  return (
    <main>

      {/* 1 — Hero */}
      <Hero />

      {/* 2 — Marquee ticker */}
      <div
        style={{
          background: 'hsl(240 12% 6%)',
          borderTop: '1px solid hsl(40 30% 96% / 0.06)',
          borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
          padding: '14px 0',
          overflow: 'hidden',
        }}
      >
        <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'hsl(40 30% 96% / 0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginRight: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2rem',
              }}
            >
              {item}
              <span style={{ color: 'hsl(28 100% 58% / 0.4)' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* 3 — Services */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>// 01 — OPERATIONAL LAYERS</SectionLabel>
            <SectionTitle>
              The operational layers{' '}
              <span style={{ color: '#F97316' }}>we install</span>
            </SectionTitle>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'hsl(40 12% 65%)',
                lineHeight: 1.7,
                marginTop: '14px',
                maxWidth: '640px',
              }}
            >
              Not capabilities. Not features. Layers of the operation — each one a system we run on top of your existing tools so your team stops being the integration.
            </p>
          </div>

          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {LAYERS.map((s) => (
              <Link
                key={s.title}
                href={s.href}
                className="service-card"
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '24px',
                    color: 'hsl(28 100% 58%)',
                    display: 'block',
                    marginBottom: '20px',
                  }}
                >
                  {s.icon}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '18px',
                    color: 'hsl(40 30% 96%)',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'hsl(40 12% 65%)',
                    lineHeight: 1.75,
                    flex: 1,
                    marginBottom: '20px',
                  }}
                >
                  {s.desc}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'hsl(28 100% 58% / 0.8)',
                        background: 'hsl(28 100% 58% / 0.08)',
                        border: '1px solid hsl(28 100% 58% / 0.15)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'hsl(28 100% 58%)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Inspect this layer →
                </span>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Link
              href="/services"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'hsl(28 100% 58%)',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
            >
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* 02 — Operational scenarios: the operational reality these
          systems live inside. Real timestamps, real bottlenecks, real
          results. The hardest section on the site to fake — that is
          why it earns the trust. */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '6rem 2rem', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '76rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '40rem' }}>
            <SectionLabel>// 02 — WHERE THESE SYSTEMS LIVE</SectionLabel>
            <SectionTitle>
              Real operations.{' '}
              <span style={{ color: '#F97316' }}>Real bottlenecks.</span>
            </SectionTitle>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'hsl(40 12% 65%)',
                lineHeight: 1.7,
                marginTop: '14px',
              }}
            >
              Four moments from inside operations we&rsquo;ve walked into. Pain → bottleneck → system installed → measurable outcome. No composites, no hypotheticals.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {SCENARIOS.map((sc, idx) => (
              <Link
                key={sc.industry}
                href={sc.href}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '14px',
                  padding: '32px',
                  display: 'grid',
                  gap: '32px',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="grid-cols-1 lg:grid-cols-[1.2fr_1fr] scenario-card"
              >
                {/* Top accent rail */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.45) 50%, transparent 100%)' }} />

                {/* LEFT — the operational reality */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(28 100% 58%)', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)', padding: '3px 10px', borderRadius: '4px' }}>
                      {String(idx + 1).padStart(2, '0')} · {sc.industry}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', letterSpacing: '0.08em' }}>
                      {sc.time}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'hsl(40 30% 96%)', lineHeight: 1.45, letterSpacing: '-0.01em', marginBottom: '14px', fontWeight: 500 }}>
                    {sc.scene}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    // Bottleneck
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                    {sc.bottleneck}
                  </p>
                </div>

                {/* RIGHT — the system installed + measurable outcome */}
                <div style={{ borderLeft: '1px solid hsl(40 30% 96% / 0.06)', paddingLeft: '32px', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    // System installed
                  </p>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.01em', marginBottom: '10px', fontWeight: 700 }}>
                    {sc.system}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, marginBottom: '24px', flex: 1 }}>
                    {sc.systemDesc}
                  </p>
                  <div style={{ borderTop: '2px solid rgba(249,115,22,0.4)', paddingTop: '14px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      // Result
                    </p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: '#F97316', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                      {sc.result}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginTop: '4px' }}>
                      {sc.resultDetail}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Proof / Results */}
      <ProofSection />

      {/* 5 — Our Systems */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <SectionLabel>// 03 — OUR SYSTEMS</SectionLabel>
            <SectionTitle>
              Production systems.{' '}
              <span style={{ color: '#F97316' }}>
                Live businesses.
              </span>
            </SectionTitle>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '600px', marginTop: '1rem', lineHeight: 1.8 }}>
              Every system below is built, deployed, and running for real clients. Not prototypes. Not demos.
            </p>
          </div>

          <div className="systems-grid" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {SYSTEMS.map((sys) => (
              <div
                key={sys.name}
                className="dark-card"
                style={{ background: 'hsl(240 12% 7%)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      padding: '3px 8px',
                      border: '1px solid hsl(40 30% 96% / 0.1)',
                      color: 'hsl(40 12% 65%)',
                      display: 'inline-block',
                      borderRadius: '4px',
                    }}
                  >
                    {sys.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      background: sys.status === 'LIVE' ? 'hsl(28 100% 58%)' : 'hsl(240 10% 20%)',
                      color: sys.status === 'LIVE' ? 'hsl(240 14% 4%)' : 'hsl(40 12% 65%)',
                      padding: '3px 8px',
                      display: 'inline-block',
                      fontWeight: 700,
                      borderRadius: '4px',
                    }}
                  >
                    {sys.status}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', margin: 0 }}>
                  {sys.name}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.75, margin: 0, flex: 1 }}>
                  {sys.desc}
                </p>
                <Link
                  href={sys.href}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', textDecoration: 'none', letterSpacing: '0.05em', alignSelf: 'flex-start' }}
                >
                  EXPLORE SYSTEM →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              href="/products"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 32px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              View All Systems
            </Link>
          </div>
        </div>
      </section>

      {/* 6 — ROI Calculator */}
      <ROICalculator />

      {/* 7 — Audit terminal */}
      <section
        style={{
          background: 'hsl(240 14% 4%)',
          padding: '6rem 2rem',
          position: 'relative',
        }}
      >
        <div
          className="grid-bg"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'grid',
            gap: '4rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Terminal */}
          <div
            className="glass-strong"
            style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px hsl(28 100% 58% / 0.06)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(0 84% 60% / 0.5)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(28 100% 58% / 0.5)', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(75 100% 60% / 0.5)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)', marginLeft: '8px' }}>
                audit — zsh
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className="terminal-line" style={{ animationDelay: `${i * 300}ms` }}>
                  {renderTerminalLine(line)}
                </div>
              ))}
              <p
                className="terminal-line"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'hsl(28 100% 58%)', animationDelay: `${TERMINAL_LINES.length * 300}ms` }}
              >
                $ <span className="cursor-blink">▊</span>
              </p>
            </div>
          </div>

          {/* Copy */}
          <div>
            <SectionLabel>Free Automation Audit</SectionLabel>
            <SectionTitle>
              Find out exactly what{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                can be automated
              </span>
            </SectionTitle>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: 'hsl(40 12% 65%)',
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
                    fontFamily: 'var(--font-body)',
                    fontSize: '17px',
                    color: 'hsl(40 30% 96% / 0.7)',
                  }}
                >
                  <span style={{ color: 'hsl(28 100% 58%)', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
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
              Get my free audit →
            </Link>
          </div>
        </div>
      </section>

      {/* 8 — Process */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SectionLabel>// HOW IT WORKS</SectionLabel>
            <SectionTitle>From idea to automated</SectionTitle>
          </div>

          {/* Connector line */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, hsl(28 100% 58% / 0.4), transparent)', marginBottom: '0', display: 'none' }} />

          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '16px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROCESS_STEPS.map((step, i) => (
              <div
                key={step.num}
                className="process-step"
                style={{
                  background: 'hsl(240 12% 7%)',
                  padding: '2.5rem 2rem',
                  position: 'relative',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '56px',
                    lineHeight: 1,
                    marginBottom: '1.25rem',
                    background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {step.num}
                </p>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'hsl(40 12% 65%)',
                    background: 'hsl(240 10% 16%)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {step.time}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '17px',
                    color: 'hsl(40 30% 96%)',
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                    display: 'block',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'hsl(40 12% 65%)',
                    lineHeight: 1.75,
                  }}
                >
                  {step.desc}
                </p>
                {i < PROCESS_STEPS.length - 1 && (
                  <span
                    className="hidden lg:block"
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(28 100% 58% / 0.4)',
                      fontSize: '14px',
                      zIndex: 1,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 — Pricing */}
      <PricingSection />

      {/* 10 — FAQ */}
      <FaqSection />

      {/* 11 — CTA */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '7rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '300px',
            background: 'radial-gradient(ellipse at center, hsl(28 100% 58% / 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <SectionLabel>// Ready to Automate?</SectionLabel>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              marginBottom: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            Stop paying humans to do{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(28 100% 58%), hsl(8 100% 60%) 50%, hsl(330 100% 62%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              machine work
            </span>
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              color: 'hsl(40 12% 65%)',
              marginBottom: '2.5rem',
              lineHeight: 1.8,
            }}
          >
            Get a free, personalised audit and discover exactly how AI can transform your
            operations — in under 5 minutes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
                boxShadow: '0 0 40px hsl(28 100% 58% / 0.3)',
              }}
            >
              Get my free audit
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'hsl(40 30% 96%)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '10px',
              }}
            >
              Talk to our team →
            </Link>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'hsl(240 8% 35%)',
              marginTop: '20px',
              letterSpacing: '0.05em',
            }}
          >
            // Average client goes live in 14 days · 3 slots open this month
          </p>
        </div>
      </section>

      {/* 12 — Stack */}
      <section
        style={{
          background: 'hsl(240 14% 4%)',
          borderTop: '1px solid hsl(40 30% 96% / 0.06)',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'hsl(240 8% 35%)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            // built on
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {[
              'Claude AI', 'OpenAI', 'n8n', 'Make', 'Zapier',
              'Supabase', 'Neon', 'Vercel', 'Render', 'Next.js',
              'Cloudflare', 'HubSpot', 'Slack', 'Notion', 'Xero',
              'Twilio', 'Resend', 'Airtable',
            ].map((tool) => (
              <span
                key={tool}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'hsl(40 12% 65%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  padding: '5px 12px',
                  letterSpacing: '0.05em',
                  borderRadius: '4px',
                  background: 'hsl(240 12% 8%)',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSignup />

    </main>
  )
}
