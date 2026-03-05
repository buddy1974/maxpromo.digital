import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-white py-28 px-6 overflow-hidden relative">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-50 rounded-full opacity-60 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-7 tracking-widest uppercase">
          AI Automation Platform
        </span>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight tracking-tight mb-7">
          AI Agents &amp; Automation{' '}
          <span className="text-indigo-600">for Modern Organisations</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
          We design intelligent workflows and AI agents that automate business processes,
          reduce manual work, and improve operational efficiency.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/automation-lab"
            className="bg-slate-900 text-white font-semibold px-8 py-4 rounded-full hover:bg-slate-700 transition-colors text-sm"
          >
            Explore Automations
          </Link>
          <Link
            href="/automation-audit"
            className="bg-indigo-600 text-white font-semibold px-8 py-4 rounded-full hover:bg-indigo-700 transition-colors text-sm"
          >
            Run Automation Audit →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm mx-auto text-center">
          <div>
            <p className="text-3xl font-bold text-slate-900">50+</p>
            <p className="text-xs text-slate-500 mt-1">Automations Built</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">10x</p>
            <p className="text-xs text-slate-500 mt-1">Efficiency Gains</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">24/7</p>
            <p className="text-xs text-slate-500 mt-1">Agent Uptime</p>
          </div>
        </div>
      </div>
    </section>
  )
}
