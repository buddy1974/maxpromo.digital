import type { Metadata } from 'next'
import AutomationCard from '@/components/AutomationCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Automation Lab',
  description:
    'Browse our library of AI agents and automation systems — from lead qualification to document processing.',
}

const AUTOMATIONS = [
  {
    title: 'Customer Support AI Agent',
    description:
      'Answers customer queries 24/7 using your knowledge base. Handles returns, FAQs, and order tracking — escalating only complex issues to human agents.',
    tools: ['Claude AI', 'Zendesk', 'Slack', 'n8n'],
  },
  {
    title: 'Invoice Processing Automation',
    description:
      'Extracts invoice data from email attachments, validates it against purchase orders, and posts approved invoices to your accounting system automatically.',
    tools: ['Document AI', 'Xero', 'QuickBooks', 'Make'],
  },
  {
    title: 'Lead Qualification Agent',
    description:
      'Evaluates inbound leads against your ICP, scores them, enriches with company data, and routes hot leads to sales with a personalised summary.',
    tools: ['Claude AI', 'HubSpot', 'Apollo.io', 'Slack'],
  },
  {
    title: 'Meeting Summarisation Workflow',
    description:
      'Transcribes meetings, extracts key decisions and action items, and sends structured summaries to participants with tasks assigned in your project tool.',
    tools: ['Whisper AI', 'Notion', 'Slack', 'n8n'],
  },
  {
    title: 'Document Classification AI',
    description:
      'Automatically classifies, tags, and routes incoming documents — contracts, applications, reports — into the correct folders and workflows.',
    tools: ['Claude AI', 'Google Drive', 'SharePoint', 'Make'],
  },
  {
    title: 'CRM Lead Routing Automation',
    description:
      'Routes inbound leads to the right sales rep based on territory, industry, or deal size — with automatic task creation and email notification.',
    tools: ['HubSpot', 'Salesforce', 'Zapier', 'Slack'],
  },
  {
    title: 'Appointment Booking Automation',
    description:
      'Lets prospects book calls directly from your website, checks calendar availability, sends confirmations, and adds meetings to your CRM automatically.',
    tools: ['Calendly', 'HubSpot', 'Make', 'Gmail'],
  },
  {
    title: 'Social Media Automation',
    description:
      'Generates on-brand social content from your blog posts, schedules across platforms, monitors mentions, and reports on engagement weekly.',
    tools: ['Claude AI', 'Buffer', 'n8n', 'Airtable'],
  },
  {
    title: 'Internal Knowledge Assistant',
    description:
      'AI assistant trained on your internal docs, policies, and SOPs that answers staff questions instantly — reducing time spent searching for information.',
    tools: ['Claude AI', 'Notion', 'Confluence', 'Slack'],
  },
]

export default function AutomationLabPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '12px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Automation Lab
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: '#0A0A0A',
              marginBottom: '20px',
            }}
          >
            Automation Examples
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '17px',
              color: '#555555',
              maxWidth: '44rem',
              margin: '0 auto',
              lineHeight: 1.8,
            }}
          >
            A growing library of AI agents and automation systems we design and deploy for
            clients. Each can be customised to your tools and processes.
          </p>
        </div>
      </section>

      {/* Automation grid */}
      <section style={{ background: '#0A0A0A', padding: '4rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '1px', background: 'rgba(255,255,255,0.06)' }}
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {AUTOMATIONS.map((a) => (
              <AutomationCard key={a.title} {...a} />
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section style={{ background: '#FAFAFA', padding: '3rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '11px',
              color: '#AAAAAA',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            // coming soon
          </p>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '15px', color: '#888888', lineHeight: 1.6 }}>
            Automation Template Marketplace — browse, customise, and deploy pre-built automations for your industry.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '12px',
              color: '#F97316',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Build Something Custom
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.04em',
              color: '#FAFAFF',
              marginBottom: '20px',
            }}
          >
            Don&apos;t see what you need?
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '17px',
              color: '#6B6B7A',
              marginBottom: '2.5rem',
              lineHeight: 1.8,
            }}
          >
            We build custom automations from scratch. Run our free audit to identify your
            specific opportunities.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/automation-audit"
              style={{
                fontFamily: 'var(--font-space-mono)',
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
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '15px',
                color: '#FAFAFF',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '14px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Discuss Your Project
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
