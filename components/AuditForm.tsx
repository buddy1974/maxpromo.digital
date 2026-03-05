'use client'

import { useState } from 'react'
import AuditResults, { AuditResult } from './AuditResults'

type Stage = 'questions' | 'lead' | 'loading' | 'results'

interface QuestionnaireData {
  businessType: string
  companySize: string
  timeConsumingTasks: string
  currentTools: string
  processToAutomate: string
}

interface LeadData {
  name: string
  email: string
  company: string
}

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+']
const TOTAL_STEPS = 5

export default function AuditForm() {
  const [step, setStep] = useState(1)
  const [stage, setStage] = useState<Stage>('questions')
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    businessType: '',
    companySize: '',
    timeConsumingTasks: '',
    currentTools: '',
    processToAutomate: '',
  })
  const [lead, setLead] = useState<LeadData>({ name: '', email: '', company: '' })
  const [results, setResults] = useState<AuditResult[]>([])
  const [error, setError] = useState('')

  const update = (field: keyof QuestionnaireData, value: string) =>
    setQuestionnaire((prev) => ({ ...prev, [field]: value }))

  const updateLead = (field: keyof LeadData, value: string) =>
    setLead((prev) => ({ ...prev, [field]: value }))

  const canProceed = (): boolean => {
    if (step === 1) return questionnaire.businessType.trim().length > 0
    if (step === 2) return questionnaire.companySize.length > 0
    if (step === 3) return questionnaire.timeConsumingTasks.trim().length > 0
    if (step === 4) return questionnaire.currentTools.trim().length > 0
    if (step === 5) return questionnaire.processToAutomate.trim().length > 0
    return true
  }

  const next = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
    else setStage('lead')
  }

  const back = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const submitLead = async () => {
    if (!lead.name || !lead.email || !lead.company) return
    setStage('loading')
    setError('')

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire, lead }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      setResults(data.results)
      setStage('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStage('lead')
    }
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-slate-900 font-semibold text-lg mb-1">Analysing your operations...</p>
          <p className="text-slate-500 text-sm">Our AI is identifying your automation opportunities.</p>
        </div>
      </div>
    )
  }

  if (stage === 'results') {
    return <AuditResults results={results} />
  }

  if (stage === 'lead') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Almost There
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Your report is ready
          </h2>
          <p className="text-slate-600 text-sm">
            Enter your details to receive your personalised automation report.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={lead.name}
              onChange={(e) => updateLead('name', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
            <input
              type="email"
              value={lead.email}
              onChange={(e) => updateLead('email', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="jane@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Company / Organisation
            </label>
            <input
              type="text"
              value={lead.company}
              onChange={(e) => updateLead('company', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Acme Corporation"
            />
          </div>
          <button
            onClick={submitLead}
            disabled={!lead.name || !lead.email || !lead.company}
            className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm mt-2"
          >
            Generate My Automation Report →
          </button>
          <p className="text-xs text-slate-400 text-center">
            We&apos;ll never spam you. Your data is used only to generate your report.
          </p>
        </div>
      </div>
    )
  }

  // Questions stage
  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <label className="block text-xl font-semibold text-slate-900 mb-2">
            What type of business do you run?
          </label>
          <p className="text-slate-500 text-sm mb-5">
            This helps us tailor automation suggestions to your industry and context.
          </p>
          <textarea
            value={questionnaire.businessType}
            onChange={(e) => update('businessType', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="e.g. Digital marketing agency serving SMEs in retail and hospitality..."
          />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <label className="block text-xl font-semibold text-slate-900 mb-2">
            How large is your team?
          </label>
          <p className="text-slate-500 text-sm mb-5">
            Team size helps us recommend the right scale of automation.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {COMPANY_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => update('companySize', size)}
                className={`py-3.5 px-4 rounded-xl border text-sm font-medium transition-colors ${
                  questionnaire.companySize === size
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {size} people
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <label className="block text-xl font-semibold text-slate-900 mb-2">
            What tasks take up the most time?
          </label>
          <p className="text-slate-500 text-sm mb-5">
            Describe the repetitive or manual tasks your team spends time on each week.
          </p>
          <textarea
            value={questionnaire.timeConsumingTasks}
            onChange={(e) => update('timeConsumingTasks', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={5}
            placeholder="e.g. Manually sorting emails, copying data between spreadsheets, chasing invoices, scheduling meetings..."
          />
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div>
          <label className="block text-xl font-semibold text-slate-900 mb-2">
            What tools do you currently use?
          </label>
          <p className="text-slate-500 text-sm mb-5">
            List the software, platforms, or systems your team relies on day-to-day.
          </p>
          <textarea
            value={questionnaire.currentTools}
            onChange={(e) => update('currentTools', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="e.g. Slack, HubSpot CRM, Google Workspace, Xero, Shopify, Notion..."
          />
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div>
          <label className="block text-xl font-semibold text-slate-900 mb-2">
            What would you most like to automate?
          </label>
          <p className="text-slate-500 text-sm mb-5">
            Describe your ideal outcome if a key process was running on autopilot.
          </p>
          <textarea
            value={questionnaire.processToAutomate}
            onChange={(e) => update('processToAutomate', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={5}
            placeholder="e.g. Automatically qualify incoming leads, score them, and add to HubSpot with a personalised follow-up email..."
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={back}
            className="flex-1 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
        )}
        <button
          onClick={next}
          disabled={!canProceed()}
          className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === TOTAL_STEPS ? 'See My Results →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
