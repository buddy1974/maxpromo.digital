import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Websites',
  description:
    'Websites enhanced with AI capabilities — chat assistants, automated lead capture, knowledge bots, and smart search systems built with Next.js.',
}

const FEATURES = [
  {
    icon: '💬',
    title: 'AI Chat Assistants',
    description:
      'Embed an AI assistant trained on your business content that answers visitor questions, qualifies leads, and books calls — 24 hours a day.',
  },
  {
    icon: '🎯',
    title: 'Automated Lead Capture',
    description:
      'Intelligently capture and qualify visitors through conversational flows. Only the best leads reach your inbox, pre-qualified and ready to close.',
  },
  {
    icon: '📚',
    title: 'Knowledge Bots',
    description:
      'Deploy a bot trained on your documentation, FAQs, and product information — reducing support volume and improving customer self-service.',
  },
  {
    icon: '🔍',
    title: 'Smart Search Systems',
    description:
      'Replace keyword search with semantic AI search that understands intent, surfacing the right content even when visitors use different phrasing.',
  },
  {
    icon: '✉️',
    title: 'Automated Email Sequences',
    description:
      'Trigger personalised email sequences based on visitor behaviour, form submissions, or chatbot interactions — connected to your CRM.',
  },
  {
    icon: '📊',
    title: 'Analytics & Reporting',
    description:
      'Track AI interaction metrics, lead conversion rates, and chatbot performance from a central dashboard.',
  },
]

const TECH_STACK = [
  { name: 'Next.js 14', desc: 'App Router, server components, edge functions' },
  { name: 'Claude / OpenAI', desc: 'AI models for chat and content generation' },
  { name: 'Vercel', desc: 'Global CDN deployment with zero config' },
  { name: 'Supabase', desc: 'Database, auth, and real-time data' },
  { name: 'Resend', desc: 'Transactional email and lead notifications' },
  { name: 'n8n / Make', desc: 'Backend workflow automation and CRM sync' },
]

export default function AIWebsitesPage() {
  return (
    <main>
      {/* Header */}
      <section className="bg-white py-20 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            AI Websites
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
            Websites That Work For You
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Not brochure sites. Dynamic AI-powered platforms that engage visitors,
            answer questions, qualify leads, and drive conversions — automatically.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-14">
            AI-Enhanced Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Our Technology Stack
          </h2>
          <p className="text-slate-600 text-center mb-14 max-w-xl mx-auto">
            Production-grade technologies chosen for performance, scalability, and AI capability.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TECH_STACK.map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="font-semibold text-slate-900 mb-1">{t.name}</p>
                <p className="text-slate-600 text-xs leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* This site as a demo */}
      <section className="py-16 px-6 bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-indigo-600 font-semibold text-sm mb-3">Live Demo</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            This website is an AI website
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            MaxPromo.digital itself demonstrates the capabilities we build. The chat assistant
            in the bottom right, the automation audit tool, and the contact form are all powered
            by the same AI infrastructure we deploy for clients.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready for an AI-powered website?
          </h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Let&apos;s discuss what your site could do with AI built in from the ground up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-indigo-600 font-bold px-7 py-3.5 rounded-full hover:bg-indigo-50 transition-colors text-sm"
            >
              Start a Project
            </Link>
            <Link
              href="/automation-audit"
              className="border-2 border-indigo-400 text-white font-bold px-7 py-3.5 rounded-full hover:bg-indigo-700 transition-colors text-sm"
            >
              Free Automation Audit
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
