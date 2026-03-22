import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Real results from AI automation deployments — time saved, costs reduced, processes transformed.',
}

const CASE_STUDIES = [
  {
    id: '01',
    tag: 'NGO / Operations',
    client: 'NGO, West Africa',
    headline: '78% reduction in manual processing time',
    challenge:
      'A West African NGO managing humanitarian aid programmes was spending over 60% of operational staff time on manual data entry, report compilation, and cross-referencing donor records across multiple spreadsheets. The process was error-prone, slow, and preventing the team from focusing on programme delivery.',
    solution:
      'We deployed a document processing AI pipeline that automatically extracts, validates, and categorises incoming reports and donor records. An n8n workflow routes data into the correct Airtable bases and triggers summary reports for programme managers — without any manual intervention.',
    results: [
      '78% reduction in manual data processing time',
      '12 staff hours saved per week',
      'Error rate dropped from 8% to under 0.5%',
      'Programme managers receive auto-generated weekly summaries',
    ],
    tools: ['Claude AI', 'n8n', 'Airtable', 'Document AI'],
    timeline: '6 weeks',
  },
  {
    id: '02',
    tag: 'Consulting / Finance',
    client: 'Consulting Firm, UK',
    headline: '£14,000/month saved in operational costs',
    challenge:
      'A mid-sized UK consulting firm was manually processing client invoices, reconciling expenses, and generating monthly financial reports. Three members of the finance team spent an average of 2 days per month solely on invoice reconciliation. With a growing client base, this was becoming unsustainable.',
    solution:
      'We built a fully automated invoice processing system that ingests invoices via email, extracts line items using document AI, validates against purchase orders in their ERP, and posts approved invoices directly to Xero. A Slack notification alerts the finance lead only when human review is required.',
    results: [
      '£14,000/month saved in operational costs',
      'Invoice processing time cut from 2 days to 90 minutes/month',
      '94% of invoices processed without human intervention',
      'Finance team reallocated to higher-value client work',
    ],
    tools: ['Document AI', 'Xero API', 'Make', 'Slack'],
    timeline: '4 weeks',
  },
  {
    id: '03',
    tag: 'Logistics / SME',
    client: 'SME, Logistics Sector',
    headline: 'Invoice cycle: 3 days → 4 hours',
    challenge:
      'A logistics SME was losing competitive advantage due to a slow invoicing cycle. Invoices were manually compiled from multiple driver reports, fuel logs, and delivery confirmations — a process taking 3 full working days per billing cycle. Late invoices were causing cash flow problems and client dissatisfaction.',
    solution:
      'We integrated all data sources — driver apps, GPS systems, fuel cards, and delivery confirmation emails — into a unified data pipeline. An AI agent compiles draft invoices automatically, flags exceptions, and sends approved invoices to clients via the existing billing system. The entire cycle now runs overnight.',
    results: [
      'Invoice cycle compressed from 3 days to 4 hours',
      'Cash flow improved by approximately 18 days per quarter',
      'Zero manual compilation for 91% of invoices',
      'Client satisfaction scores increased significantly',
    ],
    tools: ['n8n', 'Claude AI', 'QuickBooks', 'Make'],
    timeline: '8 weeks',
  },
]

const mono = { fontFamily: 'var(--font-space-mono)' } as const
const grotesk = { fontFamily: 'var(--font-space-grotesk)' } as const
const sans = { fontFamily: 'var(--font-dm-sans)' } as const

export default function CaseStudiesPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Case Studies
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: '20px' }}>
            Real results, real organisations
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: '#555555', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.8 }}>
            Every number here comes from a live deployment. No demos, no projections —
            actual outcomes from clients who have automated with us.
          </p>
          <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', marginTop: '20px', letterSpacing: '0.05em' }}>
            // Client names withheld under NDA
          </p>
        </div>
      </section>

      {/* Case studies */}
      <section style={{ background: '#FFFFFF', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {CASE_STUDIES.map((cs, i) => (
            <div
              key={cs.id}
              style={{
                borderTop: '1px solid #E5E5E5',
                padding: '4rem 0',
                borderBottom: i === CASE_STUDIES.length - 1 ? '1px solid #E5E5E5' : 'none',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.1em' }}>
                      {cs.id}
                    </span>
                    <span
                      style={{
                        ...mono,
                        fontSize: '11px',
                        color: '#F97316',
                        background: '#FFF4ED',
                        border: '1px solid #FFE0CC',
                        padding: '3px 10px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {cs.tag}
                    </span>
                  </div>
                  <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#0A0A0A', maxWidth: '36rem' }}>
                    {cs.headline}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ ...mono, fontSize: '11px', color: '#AAAAAA', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    — {cs.client}
                  </p>
                  <p style={{ ...mono, fontSize: '11px', color: '#888888', letterSpacing: '0.05em' }}>
                    Delivered in {cs.timeline}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div
                style={{ display: 'grid', gap: '3rem' }}
                className="grid-cols-1 lg:grid-cols-2"
              >
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    // the challenge
                  </p>
                  <p style={{ ...sans, fontSize: '16px', color: '#555555', lineHeight: 1.8 }}>
                    {cs.challenge}
                  </p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    // the solution
                  </p>
                  <p style={{ ...sans, fontSize: '16px', color: '#555555', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                    {cs.solution}
                  </p>
                </div>
              </div>

              {/* Results */}
              <div style={{ marginTop: '2rem', padding: '24px', background: '#FAFAFA', borderLeft: '3px solid #F97316' }}>
                <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  // results
                </p>
                <div
                  style={{ display: 'grid', gap: '10px' }}
                  className="grid-cols-1 sm:grid-cols-2"
                >
                  {cs.results.map((r) => (
                    <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: '#F97316', flexShrink: 0, ...mono, fontSize: '13px' }}>✓</span>
                      <span style={{ ...sans, fontSize: '15px', color: '#333333', lineHeight: 1.6 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                {cs.tools.map((t) => (
                  <span
                    key={t}
                    style={{
                      ...mono,
                      fontSize: '11px',
                      color: '#888888',
                      background: '#F5F5F5',
                      border: '1px solid #E5E5E5',
                      padding: '4px 10px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Your Turn
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#FAFAFF', marginBottom: '20px' }}>
            Results like these are possible for your organisation
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: '#6B6B7A', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            Every engagement starts with a free audit. We identify your highest-impact
            automation opportunities before any commitment is made.
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
              Get Your Free Audit
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
              Talk to Our Team →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
