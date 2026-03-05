import type { Metadata } from 'next'
import AuditForm from '@/components/AuditForm'

export const metadata: Metadata = {
  title: 'Free Automation Audit',
  description:
    'Answer 5 quick questions and receive a personalised AI automation report — 3 specific opportunities for your business, free of charge.',
}

export default function AutomationAuditPage() {
  return (
    <main>
      {/* Header */}
      <section className="bg-white py-20 px-6 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            Free — No Commitment
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
            Automation Audit
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Answer 5 quick questions about your business. Our AI will identify your top 3
            automation opportunities with specific tool recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10">
            {[
              { icon: '⚡', label: '5 minutes', sub: 'to complete' },
              { icon: '🤖', label: 'AI-powered', sub: 'analysis' },
              { icon: '🎯', label: '3 specific', sub: 'opportunities' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-left">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                  <p className="text-slate-500 text-xs">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit form */}
      <section className="py-16 px-6 bg-slate-50 min-h-[500px]">
        <AuditForm />
      </section>
    </main>
  )
}
