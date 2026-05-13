import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Operational Layers · The Systems We Install',
  description:
    'Six operational layers we install between your team and their tools — intake, dispatch, document flow, communications triage, compliance, inventory. Architected, installed, monitored, recoverable.',
}

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

/**
 * The six operational layers we install — replacing the prior generic
 * service grid (AI Agentic Workflows / Process Automation / Social Media
 * Automation / AI Chatbots / Systems Integration / …). Each entry follows
 * Pain → Bottleneck → System → Result and points at the *-os products
 * that include it in production.
 *
 * Implementation tools (n8n, Claude, Make, Stripe, etc.) are intentionally
 * not surfaced here. Those live on the architecture page so this page
 * stays operational, not technical.
 */
interface Layer {
  num: string
  name: string
  /** What it is in one operational sentence. */
  oneLiner: string
  /** What's failing in the org today. */
  pain: string
  /** What we install to fix it. */
  system: string
  /** Measurable change after install. */
  result: string
  /** Sub-systems / orchestration components inside the layer. */
  components: string[]
  /** Where this layer is running in production. */
  shipsIn: { name: string; href: string }[]
}

const LAYERS: Layer[] = [
  {
    num: '01',
    name: 'Client Intake Systems',
    oneLiner: 'The layer that turns every channel a customer reaches you on into one structured, qualified, routed stream.',
    pain: 'Enquiries leak through email, phone, WhatsApp, web, walk-ins. Response times slip from minutes to hours. Hot leads cool while staff bounce between inboxes.',
    system: 'Multi-channel intake landing in a single queue. Auto-qualification against your ICP. Routing to the right person or on-call shift, with full audit trail. After-hours capture without losing context.',
    result: 'Avg first response: from 4 hours to under 10 minutes. Zero leads lost between channels.',
    components: ['Unified channel ingestion', 'Qualification scoring', 'Shift-aware routing', 'After-hours capture', 'Audit log + recovery'],
    shipsIn: [
      { name: 'RestaurantOS', href: '/products/restaurant-os' },
      { name: 'PraxisOS', href: '/products/praxis-os' },
      { name: 'RealEstateOS', href: '/products/real-estate-os' },
    ],
  },
  {
    num: '02',
    name: 'Operations Coordination',
    oneLiner: 'The orchestration layer that connects field crews to the back office without paper, WhatsApp threads, or evening re-keying.',
    pain: 'Field crews work off WhatsApp and clipboards. Office staff retype job notes into invoicing the next day. Photos sit in private camera rolls. Time logs are guessed at month-end.',
    system: 'GPS-tracked dispatch and time logging. Photo-to-quote on site, becoming structured invoice drafts. Digital customer signatures. Live sync between field actions and back-office systems.',
    result: '~9 hours/week reclaimed per crew. Zero re-entry errors. Invoicing cycle from 2 weeks to same-day.',
    components: ['GPS dispatch + time tracking', 'Photo-to-quote on-site', 'Digital signatures', 'Field-to-office event bus', 'Job-state machine'],
    shipsIn: [
      { name: 'HandwerkOS', href: '/products/handwerk-os' },
    ],
  },
  {
    num: '03',
    name: 'Revenue Processing Systems',
    oneLiner: 'The layer that runs everything between work-completed and cash-collected — without retyping, chasing, or month-end fire drills.',
    pain: 'Invoices arrive as photos, PDFs, paper. Approvals stall in inboxes. XRechnung compliance is an afterthought. Cash flow waits on whoever has time tonight.',
    system: 'OCR + extraction with validation rules. Approval workflows with role boundaries. XRechnung-compliant outbound invoicing. Reconciliation against POs and ledgers. Payment tracking with overdue logic.',
    result: '90%+ of inbound documents processed without human touch. Approval cycle hours instead of days. DSO measurably shorter.',
    components: ['Inbound document classification', 'Extraction + validation', 'Approval workflow', 'XRechnung / e-invoicing', 'Reconciliation + DSO tracking'],
    shipsIn: [
      { name: 'HandwerkOS', href: '/products/handwerk-os' },
      { name: 'PublishingOS', href: '/products/publishing-os' },
    ],
  },
  {
    num: '04',
    name: 'Communications Infrastructure',
    oneLiner: 'The layer that absorbs inbound volume — support email, chat, social, voicemail — and only surfaces what genuinely needs a human.',
    pain: 'One shared inbox carries support, sales, complaints and supplier questions. The same fifteen questions get answered fifty times a week. Threads die mid-conversation when nobody owns them.',
    system: 'Auto-classification of inbound traffic. Draft replies for FAQs. Self-service portal for repeat questions. Routing + escalation policy. Conversation ownership tracking with SLAs.',
    result: 'Inbound human-handled volume drops 60–80%. SLA breaches surface as alerts, not surprises. Same-day response on what matters.',
    components: ['Auto-classification', 'Drafted replies for FAQs', 'Self-service portal', 'Escalation rules', 'SLA + ownership tracking'],
    shipsIn: [
      { name: 'CareOS', href: '/products/care-os' },
      { name: 'PraxisOS', href: '/products/praxis-os' },
    ],
  },
  {
    num: '05',
    name: 'Compliance & Continuity',
    oneLiner: 'The layer that keeps you continuously audit-ready — instead of treating every audit as a fire drill.',
    pain: 'CQC, GDPR, XRechnung, §19 UStG, internal QA — every audit means three days of evidence-hunting. Drift between policy and reality only surfaces when an inspector arrives.',
    system: 'Continuous compliance posture across every system you run. Auto-assembled evidence packs on demand. Drift alerts when policy and operational reality diverge. Tamper-proof activity log.',
    result: 'Audit prep from days to button-press. Drift events caught before they become findings. Continuous posture report for leadership.',
    components: ['Continuous posture monitoring', 'On-demand evidence pack', 'Drift detection + alerting', 'Tamper-proof activity log', 'Per-regulation rule sets'],
    shipsIn: [
      { name: 'CareOS', href: '/products/care-os' },
      { name: 'PraxisOS', href: '/products/praxis-os' },
      { name: 'HandwerkOS', href: '/products/handwerk-os' },
    ],
  },
  {
    num: '06',
    name: 'Monitoring & Escalation',
    oneLiner: 'The operational watchtower — KPIs, anomalies, SLA breaches, supplier exceptions, stock drift — surfaced as alerts before they become losses.',
    pain: 'Operational pain is usually noticed too late. Stockouts after they happen. Missed bookings after the client phones to complain. Supplier exceptions when payroll arrives short.',
    system: 'Live KPI watch across every system you run. Anomaly detection per channel. Defined escalation paths with owners. Exception alerts that route to the right desk, not the team chat.',
    result: 'Operational surprises drop. SLA breaches caught while they’re still reversible. Leadership sees real-time operational health, not weekly snapshots.',
    components: ['Live KPI watch', 'Anomaly detection', 'Escalation routing', 'Exception alerts', 'Operational health dashboard'],
    shipsIn: [
      { name: 'PublishingOS', href: '/products/publishing-os' },
      { name: 'PrintShop OS', href: '/products/printshop' },
      { name: 'RestaurantOS', href: '/products/restaurant-os' },
    ],
  },
]

/**
 * Delivery lifecycle — replaces the previous "From idea to automated"
 * which read like an agency engagement. This reads like a software
 * deployment: architecture, install, monitor, recover.
 */
const LIFECYCLE = [
  {
    step: '01',
    title: 'Discovery & Operational Mapping',
    desc: 'We map every channel, every handover, every bottleneck. Outputs: a working diagram of how your operation runs today and where it leaks.',
  },
  {
    step: '02',
    title: 'System Architecture & Boundaries',
    desc: 'We design the layer: what it owns, what it doesn’t, where it escalates, how it recovers when something upstream fails. Reviewed with you before any code.',
  },
  {
    step: '03',
    title: 'Install & Integration',
    desc: 'We build, integrate, and run in staging against real traffic. Switchover with a documented rollback path — not a hope-and-pray go-live.',
  },
  {
    step: '04',
    title: 'Continuous Monitoring & Recovery',
    desc: 'Live observability. Drift alerts. Defined recovery procedures. Monthly operational review. The system is yours; we keep it healthy.',
  },
]

export default function ServicesPage() {
  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem 3rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // The Systems We Install
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px', lineHeight: 1.1 }}>
            Six operational layers.<br />
            <span style={{ color: '#F97316' }}>One continuous operation.</span>
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.7 }}>
            We don&rsquo;t sell automations. We install operational layers — each one
            a system that runs continuously between your team and their tools.
            Architected, installed, monitored, recoverable.
          </p>
        </div>
      </section>

      {/* ── Operational layers ──────────────────────────────────────── */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            {LAYERS.map((layer) => (
              <article
                key={layer.num}
                className="dark-card"
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.08)',
                  borderRadius: '12px',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Single accent rule on top — no rainbow gradients */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#F97316', opacity: 0.5 }} />

                {/* Number + name */}
                <header style={{ marginBottom: '16px' }}>
                  <span style={{ ...mono, fontSize: '11px', color: 'hsl(40 12% 65% / 0.7)', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                    {layer.num} · OPERATIONAL LAYER
                  </span>
                  <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '24px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                    {layer.name}
                  </h2>
                </header>

                <p style={{ ...sans, fontSize: '15px', color: '#F97316', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic' }}>
                  {layer.oneLiner}
                </p>

                {/* Pain → System → Result narrative */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    // operational pain
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96% / 0.8)', lineHeight: 1.7, marginBottom: '14px' }}>
                    {layer.pain}
                  </p>

                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    // what we install
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96% / 0.8)', lineHeight: 1.7, marginBottom: '14px' }}>
                    {layer.system}
                  </p>

                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    // operational result
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: '#F97316', lineHeight: 1.7, fontWeight: 600 }}>
                    {layer.result}
                  </p>
                </div>

                {/* Components */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65% / 0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    // what&rsquo;s inside the layer
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {layer.components.map((c) => (
                      <li key={c} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '13px', color: 'hsl(40 30% 96% / 0.75)' }}>
                        <span style={{ width: '4px', height: '4px', background: '#F97316', flexShrink: 0, display: 'inline-block' }} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Where it ships */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
                  <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65% / 0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    // shipping in production
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {layer.shipsIn.map((p) => (
                      <Link
                        key={p.name}
                        href={p.href}
                        style={{ ...mono, fontSize: '11px', color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '4px 10px', letterSpacing: '0.04em', borderRadius: '2px', textDecoration: 'none' }}
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we don't do ─────────────────────────────────────────── */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // Scope · Boundaries
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '24px' }}>
            What we deliberately don&rsquo;t do.
          </h2>
          <p style={{ ...sans, fontSize: '16px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, marginBottom: '32px' }}>
            Saying yes to everything is how agencies become forgettable. These are the things we turn down — every time, on purpose.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            {[
              {
                no: 'One-shot automations with no operational ownership',
                why: 'A workflow that nobody monitors decays. We only build systems we (or your team, trained by us) keep running.',
              },
              {
                no: 'Generic marketing-content automation',
                why: 'Scheduling 12 posts a week from a content prompt isn’t infrastructure. It’s a side feature inside Communications Triage, not a service line.',
              },
              {
                no: 'GPT-wrapper chatbots without grounded data and escalation policy',
                why: 'A chatbot without a self-service knowledge base, escalation rules, and audit trail is a liability dressed as a feature.',
              },
              {
                no: 'No-code prototypes presented as production systems',
                why: 'Zaps and Make scenarios are fine prototypes. They’re not infrastructure unless they’re wrapped in monitoring, recovery, and ownership.',
              },
              {
                no: '"Migrate everything to AI" engagements',
                why: 'Most operational pain isn’t solved by AI. It’s solved by removing handovers, defining ownership, and installing the missing layer.',
              },
            ].map((row) => (
              <li
                key={row.no}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.06)',
                  borderLeft: '3px solid hsl(0 84% 60% / 0.6)',
                  padding: '18px 22px',
                  borderRadius: '6px',
                }}
              >
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '15px', color: 'hsl(40 30% 96%)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  {row.no}
                </p>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                  {row.why}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Delivery lifecycle ───────────────────────────────────────── */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              // Delivery Lifecycle
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)' }}>
              How a layer goes from missing to monitored.
            </h2>
          </div>
          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {LIFECYCLE.map((s) => (
              <div key={s.step} style={{ background: 'hsl(240 12% 7%)', padding: '32px' }}>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '48px', color: '#F97316', letterSpacing: '-0.04em', marginBottom: '12px', lineHeight: 1 }}>
                  {s.step}
                </p>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── See live systems link ────────────────────────────────────── */}
      <div style={{ background: 'hsl(240 14% 4%)', padding: '2rem', textAlign: 'center', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <Link href="/systems" className="sys-cta">
          See these layers running in production →
        </Link>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Get Started
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            Not sure which layer your operation is missing?
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Run the free Automation Audit. We map your current operation, identify the
            highest-leverage layer to install first, and return a one-page architecture sketch.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/automation-audit" className="shine" style={{ ...mono, fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              Map my operation
            </Link>
            <Link href="/contact" className="glass" style={{ ...sans, fontWeight: 500, fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              Talk to Marcel
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
