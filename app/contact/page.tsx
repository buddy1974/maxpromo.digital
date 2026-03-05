'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FormData {
  name: string
  email: string
  organisation: string
  message: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    organisation: '',
    message: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isValid = form.name && form.email && form.organisation && form.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <main>
      {/* Header */}
      <section className="bg-white py-20 px-6 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">Contact Us</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Tell us about your project or automation challenge. We&apos;ll respond within one
            business day.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">MaxPromo Digital</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                AI agents and automation systems for businesses, NGOs, and government
                organisations.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">⚡</span>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Free Automation Audit</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Start with our free audit to identify your top opportunities.
                  </p>
                  <Link href="/automation-audit" className="text-indigo-600 text-xs font-medium hover:underline mt-1 inline-block">
                    Run the audit →
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">🤖</span>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Chat with Max</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Quick questions? Our AI assistant can answer immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📋</span>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Response time</p>
                  <p className="text-slate-500 text-xs mt-0.5">Within 1 business day.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {status === 'success' ? (
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
                <div className="text-5xl mb-5">✅</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Message sent!</h2>
                <p className="text-slate-600 mb-6">
                  Thank you for getting in touch. We&apos;ll get back to you within one business day.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ name: '', email: '', organisation: '', message: '' }) }}
                  className="text-indigo-600 font-semibold text-sm hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-5"
              >
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Organisation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.organisation}
                    onChange={(e) => update('organisation', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Company or organisation name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your project, the processes you'd like to automate, or the challenges you're facing..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Message →'}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Your information is kept private and never shared with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
