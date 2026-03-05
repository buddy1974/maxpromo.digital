import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'AI agentic workflows, AI websites, and custom automation systems for modern organisations.',
}

const AGENT_EXAMPLES = [
  'Customer support agents',
  'Email triage & routing agents',
  'Lead qualification agents',
  'Document processing AI',
  'Data extraction agents',
  'Meeting summarisation',
  'Internal knowledge assistants',
  'Proposal generation agents',
]

const WEBSITE_FEATURES = [
  'AI chat assistants embedded in your site',
  'Automated lead capture and qualification',
  'Knowledge bots trained on your content',
  'Smart search systems',
  'Dynamic content personalisation',
  'CRM integration and lead routing',
]

const AUTOMATION_STEPS = [
  { step: '01', title: 'Process Analysis', desc: 'We map your current workflows and identify the highest-value automation opportunities.' },
  { step: '02', title: 'System Design', desc: 'Our architects design the full automation architecture, API integrations, and agent logic.' },
  { step: '03', title: 'Build & Integration', desc: 'We build and integrate the automation system with your existing tools and platforms.' },
  { step: '04', title: 'Deployment & Monitoring', desc: 'We deploy to production and set up dashboards to monitor performance and reliability.' },
]

export default function ServicesPage() {
  return (
    <main>
      {/* Page header */}
      <section className="bg-white py-20 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            Services
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
            What We Build
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Three core service lines — each designed to reduce manual work, increase
            operational capacity, and deliver measurable ROI.
          </p>
        </div>
      </section>

      {/* Service 1: AI Agentic Workflows */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-4xl mb-6 block">🤖</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-5">AI Agentic Workflows</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              We design and deploy autonomous AI agents that handle complex, multi-step tasks
              without human intervention. These agents connect to your existing tools via APIs
              and act on real data in real time.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              Built on Claude AI and OpenAI models, integrated with your CRM, email, and
              communication platforms using n8n, Make, and custom API connections.
            </p>
            <Link
              href="/automation-audit"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors text-sm"
            >
              Get Your Free Audit →
            </Link>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-5">
              Agent Examples
            </p>
            <ul className="space-y-3">
              {AGENT_EXAMPLES.map((ex) => (
                <li key={ex} className="flex items-center gap-3 text-slate-700 text-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Service 2: AI Websites */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-5">
              AI Website Features
            </p>
            <ul className="space-y-3">
              {WEBSITE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-700 text-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-4xl mb-6 block">🌐</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-5">AI Websites</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              We build websites that actively work for your business. Not static brochure
              sites — dynamic platforms with embedded AI that engages visitors, answers
              questions, qualifies leads, and routes them automatically.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              Built with Next.js and deployed on Vercel, with AI capabilities powered by
              Claude and OpenAI APIs, and backend automation via Supabase and n8n.
            </p>
            <Link
              href="/ai-websites"
              className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors text-sm"
            >
              Explore AI Websites →
            </Link>
          </div>
        </div>
      </section>

      {/* Service 3: Custom Automation Systems */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <span className="text-4xl mb-6 block">⚙️</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-5">
              Custom Automation Systems
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              End-to-end automation architecture for organisations that need more than
              off-the-shelf tools. We analyse, design, build, and maintain complete
              automation ecosystems tailored to your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUTOMATION_STEPS.map((s) => (
              <div key={s.step} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-3xl font-bold text-indigo-200 mb-4">{s.step}</p>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Not sure which service is right for you?
          </h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Run our free Automation Audit and we&apos;ll identify exactly where automation
            can deliver the highest impact for your organisation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/automation-audit"
              className="bg-white text-indigo-600 font-bold px-7 py-3.5 rounded-full hover:bg-indigo-50 transition-colors text-sm"
            >
              Free Automation Audit
            </Link>
            <Link
              href="/contact"
              className="border-2 border-indigo-400 text-white font-bold px-7 py-3.5 rounded-full hover:bg-indigo-700 transition-colors text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
