import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Services',
  description:
    '8 AI automation services — agentic workflows, process automation, web and app development, document intelligence, social media, chatbots, and systems integration.',
}

const SERVICES = [
  {
    num: '01',
    title: 'AI Agentic Workflows',
    desc: 'Autonomous agents that read incoming data, apply your business rules, make decisions, and take action — 24/7 without human input. Lead scoring, contract review, approval chains, exception handling.',
    who: 'Teams with repetitive decision-making that follows defined rules but consumes significant staff time.',
    result: '60–80% reduction in processing time',
    timeline: '2–4 weeks',
    useCases: [
      'Lead scoring and qualification',
      'Contract review and extraction',
      'Customer support triage',
      'Expense and invoice approval',
      'Compliance checking',
    ],
  },
  {
    num: '02',
    title: 'Process & Workflow Automation',
    desc: 'End-to-end automation of operational workflows using n8n, Make, and Zapier. Invoice processing, onboarding sequences, CRM sync, reporting pipelines — manual steps eliminated permanently.',
    who: 'Teams using multiple tools that don\'t talk to each other — causing manual data transfer, duplication, and errors.',
    result: '15–40 hours saved per week',
    timeline: '1–3 weeks per workflow',
    useCases: [
      'CRM to accounting sync',
      'Email to task routing',
      'Sales pipeline automation',
      'HR onboarding flows',
      'Inventory management',
    ],
  },
  {
    num: '03',
    title: 'Web Development + AI',
    desc: 'Full-stack web platforms built on Next.js with embedded AI capabilities. Intelligent lead capture, live chat agents, automated qualification, and real-time proposal generation built in from day one.',
    who: 'Businesses that need their website to qualify and capture leads automatically.',
    result: '3–5x more qualified leads captured',
    timeline: '2–6 weeks',
    useCases: [
      'AI chat qualification agents',
      'Smart contact forms',
      'Personalised content delivery',
      'Instant quote generation',
      'Knowledge base automation',
    ],
  },
  {
    num: '04',
    title: 'App Development + Automation',
    desc: 'Custom web apps and internal tools with automation at the core. Dashboards, client portals, workflow management systems, and AI-powered internal tools — built to your exact specification.',
    who: 'Organisations that need custom internal tools their off-the-shelf software cannot provide.',
    result: 'Replaces 2–3 separate tools',
    timeline: '3–8 weeks',
    useCases: [
      'Client portals',
      'Internal dashboards',
      'Workflow management systems',
      'Approval and review tools',
      'AI-powered reporting apps',
    ],
  },
  {
    num: '05',
    title: 'Document & Data Intelligence',
    desc: 'AI that reads, extracts, classifies, and routes documents without manual handling. Contracts, invoices, applications, reports — processed using Claude\'s advanced document understanding.',
    who: 'Operations teams processing high volumes of documents manually.',
    result: '90%+ of documents processed without human touch',
    timeline: '2–3 weeks',
    useCases: [
      'Invoice and PO processing',
      'Contract data extraction',
      'Application form processing',
      'Compliance document review',
      'Report generation',
    ],
  },
  {
    num: '06',
    title: 'Social Media Automation',
    desc: 'AI-driven content pipelines that generate on-brand posts, schedule across platforms, monitor mentions, respond to comments, and deliver weekly performance reports — fully automated.',
    who: 'Marketing teams spending hours weekly on content creation and scheduling.',
    result: '80% reduction in content creation time',
    timeline: '1–2 weeks',
    useCases: [
      'Multi-platform scheduling',
      'AI content generation',
      'Engagement monitoring',
      'Competitor tracking',
      'Performance reporting',
    ],
  },
  {
    num: '07',
    title: 'AI Chatbots & Assistants',
    desc: 'Custom AI assistants trained on your business data. Customer support agents, internal knowledge bases, sales qualification bots, and booking assistants — powered by Claude, deployed anywhere.',
    who: 'Businesses handling repetitive queries across support, sales, or internal ops.',
    result: '70% of queries resolved without human intervention',
    timeline: '1–3 weeks',
    useCases: [
      'Customer support agents',
      'Sales qualification bots',
      'Internal HR assistants',
      'IT helpdesk automation',
      'Booking and scheduling agents',
    ],
  },
  {
    num: '08',
    title: 'Systems Integration & APIs',
    desc: 'We connect your entire tool stack via API and webhook. CRM, ERP, accounting, support, and communication platforms — synchronised, automated, and monitored in real time.',
    who: 'Organisations running 5+ disconnected tools requiring manual data management.',
    result: 'Eliminates 10–20 hrs/week of manual data entry',
    timeline: '1–4 weeks per integration',
    useCases: [
      'CRM + accounting unification',
      'ERP and e-commerce sync',
      'Multi-platform reporting',
      'API connector architecture',
      'Webhook pipeline design',
    ],
  },
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
            Eight service lines — each designed to reduce manual work, increase
            operational capacity, and deliver measurable ROI.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section style={{ background: '#FAFAFA', padding: '4rem 2rem', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '1px', background: '#E5E5E5' }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            {SERVICES.map((s) => (
              <div
                key={s.num}
                style={{
                  background: '#FFFFFF',
                  padding: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                }}
              >
                {/* Number + title */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                    {s.num}
                  </span>
                  <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '22px', color: '#0A0A0A', letterSpacing: '-0.03em' }}>
                    {s.title}
                  </h2>
                </div>

                {/* Description */}
                <p style={{ ...sans, fontSize: '15px', color: '#555555', lineHeight: 1.75, marginBottom: '24px' }}>
                  {s.desc}
                </p>

                {/* Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                  <span style={{
                    ...mono, fontSize: '11px', color: '#F97316',
                    background: '#FFF4ED', border: '1px solid rgba(249,115,22,0.2)',
                    padding: '4px 10px', letterSpacing: '0.04em',
                  }}>
                    ↑ {s.result}
                  </span>
                  <span style={{
                    ...mono, fontSize: '11px', color: '#666666',
                    background: '#F5F5F5', border: '1px solid #E5E5E5',
                    padding: '4px 10px', letterSpacing: '0.04em',
                  }}>
                    ⏱ {s.timeline}
                  </span>
                </div>

                {/* Who this is for */}
                <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  // who this is for
                </p>
                <p style={{ ...sans, fontSize: '14px', color: '#666666', lineHeight: 1.6, marginBottom: '20px' }}>
                  {s.who}
                </p>

                {/* Use cases */}
                <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  // use cases
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {s.useCases.map((uc) => (
                    <li key={uc} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '14px', color: '#444444' }}>
                      <span style={{ width: '4px', height: '4px', background: '#F97316', flexShrink: 0, display: 'inline-block' }} />
                      {uc}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/automation-audit"
                  style={{
                    ...mono,
                    fontSize: '13px',
                    color: '#F97316',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    alignSelf: 'flex-start',
                    marginTop: 'auto',
                  }}
                >
                  Get an audit →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3.5rem' }}>
            <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              How It Works
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A' }}>
              From idea to automated
            </h2>
          </div>

          <div
            style={{ display: 'grid', gap: '1px', background: '#E5E5E5' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { step: '01', title: 'Process Analysis', desc: 'We map your current workflows and identify the highest-value automation opportunities.' },
              { step: '02', title: 'System Design', desc: 'Our architects design the full automation architecture, API integrations, and agent logic.' },
              { step: '03', title: 'Build & Integration', desc: 'We build and integrate the automation system with your existing tools and platforms.' },
              { step: '04', title: 'Deployment & Monitoring', desc: 'We deploy to production and set up dashboards to monitor performance and reliability.' },
            ].map((s) => (
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
            can deliver the highest impact for your business.
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
