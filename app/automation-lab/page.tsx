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
    <main>
      {/* Header */}
      <section className="bg-white py-20 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            Automation Lab
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
            Automation Examples
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A growing library of AI agents and automation systems we design and deploy for
            clients. Each can be customised to your tools and processes.
          </p>
        </div>
      </section>

      {/* Automation grid */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AUTOMATIONS.map((a) => (
              <AutomationCard key={a.title} {...a} />
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="py-12 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-slate-400 mb-2 font-medium">Coming soon</p>
          <p className="text-slate-600 text-sm">
            Automation Template Marketplace — browse, customise, and deploy pre-built automations for your industry.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Don&apos;t see what you need?
          </h2>
          <p className="text-slate-600 mb-8 text-lg">
            We build custom automations from scratch. Run our free audit to identify your
            specific opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/automation-audit"
              className="bg-indigo-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-indigo-700 transition-colors text-sm"
            >
              Free Automation Audit
            </Link>
            <Link
              href="/contact"
              className="border border-slate-300 text-slate-700 font-bold px-7 py-3.5 rounded-full hover:bg-slate-50 transition-colors text-sm"
            >
              Discuss Your Project
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
