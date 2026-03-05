import Link from 'next/link'

const SERVICES = [
  {
    icon: '🤖',
    title: 'AI Agentic Workflows',
    description:
      'Intelligent AI agents that handle complex tasks autonomously — from customer support and email triage to lead qualification and document processing.',
    href: '/services',
    tags: ['Claude AI', 'OpenAI', 'n8n'],
  },
  {
    icon: '🌐',
    title: 'AI Websites',
    description:
      'Websites enhanced with AI capabilities: embedded chat assistants, automated lead capture, knowledge bots, and smart search systems.',
    href: '/ai-websites',
    tags: ['Next.js', 'Claude API', 'Vercel'],
  },
  {
    icon: '⚙️',
    title: 'Custom Automation Systems',
    description:
      'End-to-end automation architecture including process analysis, system integration, deployment, and monitoring for your organisation.',
    href: '/services',
    tags: ['Make', 'Zapier', 'API Integration'],
  },
]

export default function ServiceCards() {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
          What We Build
        </h2>
        <p className="text-slate-600 text-center mb-14 max-w-2xl mx-auto text-lg">
          From intelligent agents to full automation systems — we design solutions that save
          time and scale with your organisation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-slate-100 flex flex-col"
            >
              <div className="text-4xl mb-5">{s.icon}</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1">{s.description}</p>
              <div className="flex flex-wrap gap-2 mt-6 mb-4">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-indigo-600 text-sm font-semibold group-hover:underline mt-auto">
                Learn more →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
