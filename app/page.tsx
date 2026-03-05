import Hero from '@/components/Hero'
import ServiceCards from '@/components/ServiceCards'
import AutomationCard from '@/components/AutomationCard'
import Link from 'next/link'

const FEATURED_AUTOMATIONS = [
  {
    title: 'Lead Qualification Agent',
    description:
      'AI agent that evaluates incoming leads, scores them against your criteria, and routes qualified prospects to your sales team with a personalised summary.',
    tools: ['Claude AI', 'HubSpot', 'n8n', 'Slack'],
  },
  {
    title: 'Invoice Processing Automation',
    description:
      'Automatically extract, validate, and reconcile invoice data from emails and attachments directly into your accounting system — zero manual data entry.',
    tools: ['Document AI', 'Xero', 'Make', 'Gmail'],
  },
  {
    title: 'Customer Support AI Agent',
    description:
      'Intelligent support agent that answers customer queries 24/7, resolves common issues autonomously, and escalates complex cases to your human team.',
    tools: ['Claude AI', 'Zendesk', 'Slack', 'OpenAI'],
  },
]

const INDUSTRIES = [
  { name: 'Business & Enterprise', icon: '🏢' },
  { name: 'NGOs & Charities', icon: '🤝' },
  { name: 'Government & Public Sector', icon: '🏛️' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Legal & Professional Services', icon: '⚖️' },
  { name: 'E-commerce & Retail', icon: '🛒' },
]

const PLATFORMS = [
  'Claude AI',
  'OpenAI',
  'n8n',
  'Make',
  'Zapier',
  'Supabase',
  'Vercel',
  'HubSpot',
  'Slack',
  'Notion',
]

export default function HomePage() {
  return (
    <main>
      <Hero />

      <ServiceCards />

      {/* Featured Automations */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
            Automation Examples
          </h2>
          <p className="text-slate-600 text-center mb-14 max-w-2xl mx-auto text-lg">
            Real-world automation systems we design and deploy for our clients.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_AUTOMATIONS.map((a) => (
              <AutomationCard key={a.title} {...a} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/automation-lab"
              className="inline-block bg-slate-900 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-slate-700 transition-colors"
            >
              View All Automations →
            </Link>
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
            Industries Served
          </h2>
          <p className="text-slate-600 text-center mb-14 max-w-2xl mx-auto text-lg">
            We deliver AI automation solutions across sectors and organisation types.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{ind.icon}</div>
                <p className="text-xs font-medium text-slate-700 leading-snug">{ind.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Platforms &amp; Technologies We Use
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">Ready to automate?</h2>
          <p className="text-indigo-200 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Get a free, personalised automation audit and discover exactly how AI can
            transform your operations — in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/automation-audit"
              className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-full hover:bg-indigo-50 transition-colors text-sm"
            >
              Run Free Automation Audit
            </Link>
            <Link
              href="/contact"
              className="border-2 border-indigo-400 text-white font-bold px-8 py-4 rounded-full hover:bg-indigo-700 transition-colors text-sm"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
