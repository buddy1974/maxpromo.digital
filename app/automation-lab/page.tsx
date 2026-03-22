import type { Metadata } from 'next'
import AutomationCard from '@/components/AutomationCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Automation Systems Library',
  description:
    '18 production-ready AI agents and automation systems — custom-built to your stack and business logic.',
}

const CATEGORIES = [
  {
    heading: 'AI Agents',
    automations: [
      {
        title: 'Lead Qualification Agent',
        description:
          'Evaluates inbound leads against your ICP, scores them, enriches with data, and routes hot leads to sales with a personalised summary.',
        tools: ['Claude AI', 'HubSpot', 'Apollo.io', 'Slack'],
      },
      {
        title: 'Customer Support AI Agent',
        description:
          'Answers queries 24/7 using your knowledge base. Handles tier-1 support, processes FAQs, escalates complex issues with full conversation context.',
        tools: ['Claude AI', 'Zendesk', 'Slack', 'n8n'],
      },
      {
        title: 'Contract Review Agent',
        description:
          'Reads contracts, extracts key clauses, flags non-standard terms, and produces a structured summary for legal or commercial review.',
        tools: ['Claude AI', 'Google Drive', 'Notion', 'Slack'],
      },
      {
        title: 'Research & Briefing Agent',
        description:
          'Given a topic or company, autonomously researches multiple sources, synthesises findings, and delivers a structured briefing document in minutes.',
        tools: ['Claude AI', 'Notion', 'Resend', 'n8n'],
      },
      {
        title: 'Proposal Generation Agent',
        description:
          'Takes a client brief and drafts a formatted proposal including scope, timeline, and pricing — ready for human review and send.',
        tools: ['Claude AI', 'HubSpot', 'Google Docs', 'Make'],
      },
      {
        title: 'Internal Knowledge Assistant',
        description:
          'AI assistant trained on your internal docs, SOPs, and policies. Staff ask questions in plain English and get accurate answers instantly.',
        tools: ['Claude AI', 'Notion', 'Confluence', 'Slack'],
      },
    ],
  },
  {
    heading: 'Workflow Automation',
    automations: [
      {
        title: 'Invoice Processing Automation',
        description:
          'Extracts invoice data from email attachments, validates against purchase orders, posts to your accounting system, flags exceptions.',
        tools: ['Claude AI', 'Xero', 'Make', 'Gmail'],
      },
      {
        title: 'CRM Lead Routing Automation',
        description:
          'Routes inbound leads to the right rep based on criteria — with automatic task creation and personalised email notification.',
        tools: ['HubSpot', 'Salesforce', 'Zapier', 'Slack'],
      },
      {
        title: 'Meeting Summarisation Workflow',
        description:
          'Transcribes meetings, extracts decisions and action items, sends structured summaries, and creates tasks in your project management tool.',
        tools: ['Whisper AI', 'Notion', 'Slack', 'n8n'],
      },
      {
        title: 'Employee Onboarding Automation',
        description:
          'Triggers a full onboarding sequence on new hire creation — provisioning, welcome emails, document requests, training assignments, manager notifications.',
        tools: ['BambooHR', 'Slack', 'Google Workspace', 'Make'],
      },
      {
        title: 'Reporting & Analytics Pipeline',
        description:
          'Pulls data from multiple sources on a schedule, applies formatting rules, and distributes finished reports to stakeholders automatically.',
        tools: ['Supabase', 'Google Sheets', 'Claude AI', 'Resend'],
      },
      {
        title: 'Appointment Booking Automation',
        description:
          'Lets prospects book calls from your site, checks availability, sends confirmations, adds to CRM, and triggers pre-call preparation sequences.',
        tools: ['Calendly', 'HubSpot', 'Make', 'Gmail'],
      },
    ],
  },
  {
    heading: 'Content & Social',
    automations: [
      {
        title: 'Social Media Content Pipeline',
        description:
          'Generates on-brand content from briefs, formats for each platform, schedules publishing, monitors engagement, and delivers weekly performance reports.',
        tools: ['Claude AI', 'Buffer', 'Airtable', 'n8n'],
      },
      {
        title: 'Blog & SEO Content Automation',
        description:
          'Researches keywords, drafts long-form posts in your brand voice, optimises for SEO, and publishes on schedule — end to end.',
        tools: ['Claude AI', 'WordPress', 'Airtable', 'Make'],
      },
      {
        title: 'Email Marketing Automation',
        description:
          'Behaviour-triggered email sequences that adapt based on recipient actions. Welcome flows, nurture sequences, re-engagement campaigns — personalised by Claude.',
        tools: ['Claude AI', 'Mailchimp', 'HubSpot', 'Make'],
      },
      {
        title: 'Brand Monitoring & Response Agent',
        description:
          'Monitors mentions across social platforms and review sites, classifies sentiment, drafts response suggestions, and alerts the team to high-priority mentions.',
        tools: ['Claude AI', 'Airtable', 'Slack', 'n8n'],
      },
      {
        title: 'Video & Content Repurposing',
        description:
          'Takes a video transcript or blog post and repurposes it into LinkedIn posts, X threads, email newsletters, and short-form scripts.',
        tools: ['Claude AI', 'Notion', 'Buffer', 'Make'],
      },
      {
        title: 'Product Description AI',
        description:
          'Generates SEO-optimised product descriptions in your brand voice at scale. Input product data, output publish-ready copy for every SKU in your catalogue.',
        tools: ['Claude AI', 'Shopify', 'Airtable', 'Make'],
      },
    ],
  },
]

const mono = { fontFamily: 'var(--font-space-mono)' } as const
const grotesk = { fontFamily: 'var(--font-space-grotesk)' } as const
const sans = { fontFamily: 'var(--font-dm-sans)' } as const

export default function AutomationLabPage() {
  return (
    <main style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <section style={{ background: '#FFFFFF', padding: '5rem 2rem', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Automation Lab
          </p>
          <h1
            style={{
              ...grotesk,
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              letterSpacing: '-0.04em',
              color: '#0A0A0A',
              marginBottom: '20px',
            }}
          >
            Automation Systems Library
          </h1>
          <p
            style={{
              ...sans,
              fontSize: '17px',
              color: '#555555',
              maxWidth: '44rem',
              margin: '0 auto 2rem',
              lineHeight: 1.8,
            }}
          >
            18 production-ready automation systems. Each is custom-built to your stack and
            business logic — not a template, not a plugin.
          </p>
          {/* Stat bar */}
          <div
            style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              gap: '0',
              border: '1px solid #E5E5E5',
              background: '#FAFAFA',
            }}
          >
            {['18 systems', 'Built on Claude AI', 'Typically live in 1–4 weeks'].map((stat, i, arr) => (
              <span
                key={stat}
                style={{
                  ...mono,
                  fontSize: '11px',
                  color: '#666666',
                  letterSpacing: '0.08em',
                  padding: '10px 20px',
                  borderRight: i < arr.length - 1 ? '1px solid #E5E5E5' : 'none',
                }}
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category sections */}
      {CATEGORIES.map((cat) => (
        <section key={cat.heading} style={{ background: '#0A0A0A', padding: '4rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
            <p
              style={{
                ...mono,
                fontSize: '11px',
                color: '#F97316',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              // {cat.heading}
            </p>
            <h2
              style={{
                ...grotesk,
                fontWeight: 700,
                fontSize: '28px',
                color: '#FAFAFF',
                letterSpacing: '-0.03em',
                marginBottom: '2rem',
              }}
            >
              {cat.heading}
            </h2>
            <div
              style={{ display: 'grid', gap: '1px', background: 'rgba(255,255,255,0.06)' }}
              className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {cat.automations.map((a) => (
                <AutomationCard key={a.title} {...a} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              ...mono,
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
              ...grotesk,
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
              ...sans,
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
              Free Automation Audit →
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
              Discuss Your Project
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
