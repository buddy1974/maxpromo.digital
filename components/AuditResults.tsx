import Link from 'next/link'

export interface AuditResult {
  problem: string
  solution: string
  tools: string[]
}

interface AuditResultsProps {
  results: AuditResult[]
}

export default function AuditResults({ results }: AuditResultsProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          Audit Complete
        </span>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Your Automation Opportunities</h2>
        <p className="text-slate-600">
          Based on your answers, here are 3 high-impact automations we recommend for your
          organisation.
        </p>
      </div>

      <div className="space-y-6 mb-10">
        {results.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="bg-indigo-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Current Problem
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">{r.problem}</p>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Automation Solution
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">{r.solution}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Recommended Tools
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.tools.map((t) => (
                      <span
                        key={t}
                        className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 rounded-2xl p-8 text-center border border-indigo-100">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to implement these?</h3>
        <p className="text-slate-600 text-sm mb-6">
          Our team can design, build, and deploy these automations for your organisation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors text-sm"
          >
            Talk to Our Team
          </Link>
          <Link
            href="/automation-lab"
            className="border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-full hover:bg-white transition-colors text-sm"
          >
            Browse Automation Lab
          </Link>
        </div>
      </div>
    </div>
  )
}
