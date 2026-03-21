import Link from 'next/link'

const SERVICES = [
  {
    title: 'AI Agentic Workflows',
    description:
      'Intelligent AI agents that handle complex tasks autonomously — from customer support and email triage to lead qualification and document processing.',
    href: '/services',
    tags: ['Claude AI', 'OpenAI', 'n8n'],
  },
  {
    title: 'AI Websites',
    description:
      'Websites enhanced with AI capabilities: embedded chat assistants, automated lead capture, knowledge bots, and smart search systems.',
    href: '/ai-websites',
    tags: ['Next.js', 'Claude API', 'Vercel'],
  },
  {
    title: 'Custom Automation Systems',
    description:
      'End-to-end automation architecture including process analysis, system integration, deployment, and monitoring for your organisation.',
    href: '/services',
    tags: ['Make', 'Zapier', 'API Integration'],
  },
]

export default function ServiceCards() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-16">
          <span
            className="text-xs font-medium tracking-widest uppercase mb-4 block"
            style={{ fontFamily: 'var(--font-ibm-mono)', color: '#F97316' }}
          >
            ◈ What We Build
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold"
            style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
          >
            Services
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="service-card flex flex-col p-10 group"
            >
              {/* Orange marker */}
              <span
                className="block w-1.5 h-1.5 rounded-full mb-8 flex-shrink-0"
                style={{ background: '#F97316' }}
              />

              <h3
                className="text-xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-syne)', color: '#FFFFFF' }}
              >
                {s.title}
              </h3>

              <p
                className="text-sm leading-relaxed flex-1 mb-8"
                style={{ color: '#888888', fontFamily: 'var(--font-dm-sans)' }}
              >
                {s.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1"
                    style={{
                      fontFamily: 'var(--font-ibm-mono)',
                      background: 'rgba(249,115,22,0.08)',
                      color: 'rgba(249,115,22,0.7)',
                      border: '1px solid rgba(249,115,22,0.15)',
                      borderRadius: '2px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span
                className="text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-ibm-mono)',
                  color: 'rgba(255,255,255,0.3)',
                  transition: 'color 0.15s',
                }}
              >
                Learn more →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/services"
            className="text-sm font-semibold px-7 py-3.5"
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              border: '1px solid rgba(249,115,22,0.3)',
              color: '#F97316',
              background: 'rgba(249,115,22,0.05)',
              borderRadius: '2px',
              display: 'inline-block',
            }}
          >
            View All Services →
          </Link>
        </div>
      </div>
    </section>
  )
}
