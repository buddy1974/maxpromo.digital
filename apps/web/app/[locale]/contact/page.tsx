'use client'
import { FormStatus, Icon } from '@maxpromo/ui'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import VoiceInputWidget from '@/components/voice/VoiceInputWidget'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { CAPABILITIES } from '@/lib/capabilities'
import type { ContactPainPoint, PreferredContactMethod } from '@/lib/contact-options'

/**
 * app/[locale]/contact/page.tsx
 *
 * Rewritten in the public presentation pass.
 *
 * What it was: name, company, email, phone, a contact-method select, then
 * FIFTEEN checkboxes asking the visitor to diagnose themselves — "too many
 * emails", "excel chaos", "slow reporting", "ai agents", "website" — and only
 * then a message box. It asked a buyer to learn Maxpromo's service catalogue
 * and classify their own business against it before they were allowed to say
 * what was actually wrong. That is an intake form for a clinic, not the first
 * step of a business conversation, and the company's own position is that the
 * visitor knows the problem while diagnosing the system is our job.
 *
 * What it is: who you are, how to reach you, one optional question about the
 * broad area, and a large box for the actual problem.
 *
 * THE BACKEND IS UNTOUCHED. `/api/contact` requires name, email, company,
 * message and a valid `preferredContactMethod`, and treats `painPoints` as an
 * optional array whose members must come from CONTACT_PAIN_POINTS. All five
 * choices below are existing members of that list, sent as a single-element
 * array, so the route, its validation, the email template, the Telegram
 * message and any row already stored keep working unchanged. No API change,
 * no migration, no new enum value.
 */

/**
 * Five broad areas, each mapped to a slug the API already accepts. The mapping
 * is explicit rather than derived: a label and a stored value that drift apart
 * silently are exactly what the naming standard exists to prevent.
 */
const CONTEXTS: readonly { key: string; value: ContactPainPoint }[] = [
  { key: 'contextOperations',    value: 'repetitive-tasks' },
  { key: 'contextCommunication', value: 'lost-customer-enquiries' },
  { key: 'contextWorkflow',      value: 'workflow-automation' },
  { key: 'contextSystems',       value: 'disconnected-systems' },
  { key: 'contextUnsure',        value: 'other' },
]

/**
 * Where a visitor arriving from a capability section lands among the five
 * broad areas above.
 *
 * The mapping is onto the five values the chip set offers, deliberately, and
 * not onto the closest-sounding member of CONTACT_PAIN_POINTS. Preselecting
 * 'website' — a real value the API accepts — would submit a choice the visitor
 * could see no chip for and could not unselect by clicking it off. A preset
 * the reader cannot see is a preset they cannot correct.
 *
 * Every capability id must appear here; the type makes leaving one out a build
 * error rather than a silently unselected chip.
 */
const CAPABILITY_CONTEXT: Record<string, ContactPainPoint> = {
  'workflow-automation': 'workflow-automation',
  'custom-applications': 'disconnected-systems',
  'web-development':     'lost-customer-enquiries',
  'content-operations':  'repetitive-tasks',
  'product-operations':  'disconnected-systems',
}

/**
 * Known ?system= values, each mapping to a `contact.systems.<slug>` entry in
 * the message catalogues. Keep in sync with `contactSlug` on every
 * ProductEntry in lib/registry/products.ts.
 */
const KNOWN_CONTACT_SYSTEMS = [
  'agent-bureau', 'restaurant-os', 'handwerk-os', 'praxis-os', 'printshop-os',
  'care-os', 'real-estate-os', 'publishing-os', 'taxkontrol', 'drive24',
] as const

interface FormData {
  name: string
  company: string
  email: string
  phone: string
  preferredContactMethod: PreferredContactMethod
  painPoints: ContactPainPoint[]
  message: string
  system: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const initialForm: FormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  preferredContactMethod: 'email',
  painPoints: [],
  message: '',
  system: '',
}

export default function ContactPage() {
  const t = useTranslations('contact')
  const tScene = useTranslations('scenes')
  const tCap = useTranslations('capabilities')
  const searchParams = useSearchParams()
  const presetSystem = searchParams.get('system') ?? ''

  /* Two kinds of context arrive here besides ?system=. Both are read once, on
     the first render, and both only ever preselect something the visitor can
     see and change:

       ?capability=<id>  from the rail, a capability section, or the home page
       ?intent=demo      from /work, where somebody asked to see something run

     Neither is trusted as an identifier. An unknown value is simply ignored,
     which is why the lookups below are `find` and not an assertion. */
  const capability = CAPABILITIES.find((c) => c.id === searchParams.get('capability'))
  const isDemoRequest = searchParams.get('intent') === 'demo'

  /* ?automation=<name>  from a "Request this" card on /automation-lab.
     Eighteen cards built this parameter and nothing here read it, so every one
     of those requests arrived indistinguishable from a blank enquiry — the
     visitor had told us exactly which automation they wanted and the form
     dropped it on the floor. It travels the same way `capability` does, in
     `system`, which the API already puts in the subject line and the lead
     source. Free text from a URL, so it is length-capped and never trusted as
     an identifier; it is shown back to the visitor rather than used to look
     anything up. */
  const automation = (searchParams.get('automation') ?? '').trim().slice(0, 80)

  const [form, setForm] = useState<FormData>(() => {
    /* The product systems keep priority: a visitor who arrived from a product
       domain is asking about that product, whatever else the URL carries.
       Below that, the origin travels in `system`, which the API already puts
       in the subject line and the lead source — so a demonstration request
       arrives looking like one, with no API change. */
    const system = presetSystem
      || (isDemoRequest ? 'demo-request' : '')
      || (capability ? `capability/${capability.id}` : '')
      || (automation ? `automation/${automation}` : '')
    return {
      ...initialForm,
      system,
      painPoints: capability ? [CAPABILITY_CONTEXT[capability.id]] : [],
    }
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const contextSystem = KNOWN_CONTACT_SYSTEMS.find((slug) => slug === form.system)

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const isValid =
    form.name.trim() !== '' &&
    form.company.trim() !== '' &&
    form.email.trim() !== '' &&
    form.message.trim() !== ''

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = (await response.json()) as { error?: string; code?: string }
      if (!response.ok) {
        throw new Error(
          result.code === 'CONTACT_DELIVERY_UNAVAILABLE'
            ? t('errorDeliveryUnavailable')
            : t('errorGeneric'),
        )
      }
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : t('errorGeneric'))
    }
  }

  if (status === 'success') {
    return (
      <section className="section-feature surface-plain">
        <div className="container">
          <div role="status" style={{ maxWidth: '34rem', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ margin: '0 0 var(--space-4)', color: 'var(--semantic-success)' }}>
              <Icon name="check" size="lg" />
            </p>
            <h1 style={{ margin: '0 auto var(--space-3)' }}>{t('successTitle')}</h1>
            <p style={{ margin: '0 auto var(--space-8)', color: 'var(--brand-text-secondary)' }}>{t('successDesc')}</p>
            <button
              type="button"
              onClick={() => {
                setForm({ ...initialForm, system: form.system })
                setStatus('idle')
              }}
              className="link"
              style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 'var(--text-small)' }}
            >
              {t('successAnother')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            {contextSystem ? (
              <>
                <p className="section-label">{t(`systems.${contextSystem}.eyebrow`)}</p>
                <h1 style={{ margin: '0 0 var(--space-5)' }}>{t(`systems.${contextSystem}.title`)}</h1>
                <p className="sec-lede" style={{ margin: 0 }}>{t(`systems.${contextSystem}.subtitle`)}</p>
              </>
            ) : isDemoRequest ? (
              /* Arrived from /work asking to see something run. The page says
                 so, and says plainly how access works, because the honest
                 answer — each demonstration is released individually — is also
                 the reassuring one. */
              <>
                <p className="section-label">{t('demoEyebrow')}</p>
                <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('demoTitle')}</h1>
                <p className="sec-lede" style={{ margin: 0 }}>{t('demoSubtitle')}</p>
              </>
            ) : (
              <>
                <p className="section-label">{t('eyebrow')}</p>
                <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('title')}</h1>
                <p className="sec-lede" style={{ margin: 0 }}>{t('subtitle')}</p>
                {capability && (
                  /* Visible, because the form below arrives with a chip already
                     chosen on the strength of it. */
                  <p className="contact-origin">
                    <span className="contact-origin-label">{t('originLabel')}</span>
                    {tCap(`${capability.key}Name`)}
                  </p>
                )}
                {!capability && automation && (
                  <p className="contact-origin">
                    <span className="contact-origin-label">{t('originLabel')}</span>
                    {automation}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* What actually happens after someone gets in touch. Shown before the
          form, so the reader knows what they are entering. */}
      <section className="section surface-operational">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{tScene('conSceneEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{tScene('conSceneTitle')}</h2>
          </div>
          <ProcessSequence
            a11yIntro={tScene('conA11y')}
            note={tScene('conNote')}
            steps={[
              { label: tScene('con1'), detail: tScene('con1d'), icon: 'inbox' },
              { label: tScene('con2'), detail: tScene('con2d'), icon: 'clients' },
              { label: tScene('con3'), detail: tScene('con3d'), icon: 'audit' },
              { label: tScene('con4'), detail: tScene('con4d'), icon: 'operatingModel' },
              { label: tScene('con5'), detail: tScene('con5d'), icon: 'approvals', human: true },
            ]}
          />
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{t('formSideLabel')}</p>
              <p style={{ margin: 0, fontSize: 'var(--text-small)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {t('formSideNote')}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '38rem' }}>
              <FormStatus tone="critical">{status === 'error' ? errorMessage : null}</FormStatus>

              <div className="field-row">
                <Field label={t('formName')} required>
                  <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="input" autoComplete="name" />
                </Field>
                <Field label={t('formCompany')} required>
                  <input required value={form.company} onChange={(e) => update('company', e.target.value)} className="input" autoComplete="organization" />
                </Field>
              </div>

              <div className="field-row">
                <Field label={t('formEmail')} required>
                  <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" autoComplete="email" />
                </Field>
                <Field label={`${t('formPhone')} ${t('formOptional')}`}>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" autoComplete="tel" />
                </Field>
              </div>

              <Field label={t('formPreferredContact')}>
                <select
                  value={form.preferredContactMethod}
                  onChange={(e) => update('preferredContactMethod', e.target.value as PreferredContactMethod)}
                  className="select"
                >
                  <option value="email">{t('contactMethodEmail')}</option>
                  <option value="phone">{t('contactMethodPhone')}</option>
                  <option value="whatsapp">{t('contactMethodWhatsApp')}</option>
                </select>
              </Field>

              {/* One optional question, five broad areas. It exists to route
                  the message, not to make the reader classify themselves. */}
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="label" style={{ padding: 0 }}>{t('formContext')}</legend>
                <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)' }}>
                  {t('formContextHint')}
                </p>
                <div className="chip-set">
                  {CONTEXTS.map((c) => {
                    const selected = form.painPoints[0] === c.value
                    return (
                      <label key={c.value} className={selected ? 'chip chip-on' : 'chip'}>
                        <input
                          type="radio"
                          name="context"
                          value={c.value}
                          checked={selected}
                          onChange={() => update('painPoints', [c.value])}
                          className="sr-only"
                        />
                        {t(c.key)}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <Field label={t('formMessage')} required>
                <VoiceInputWidget
                  required
                  value={form.message}
                  onChange={(value) => update('message', value)}
                  rows={7}
                  placeholder={t('formMessagePlaceholder')}
                  context="Contact message"
                  textareaStyle={{
                    width: '100%',
                    border: '1px solid var(--brand-border-control)',
                    background: 'var(--brand-background)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    color: 'var(--brand-text)',
                  }}
                />
              </Field>

              <div>
                <button
                  type="submit"
                  disabled={!isValid || status === 'loading'}
                  aria-busy={status === 'loading'}
                  className="btn btn-primary"
                  style={{ opacity: !isValid || status === 'loading' ? 0.4 : 1 }}
                >
                  {status === 'loading' ? t('formCtaSending') : t('formCta')}
                </button>
                <p style={{ margin: 'var(--space-4) 0 0', fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)' }}>
                  {t('formPrivacy')}
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span className="label">
        {label} {required && <span style={{ color: 'var(--semantic-danger)' }} aria-hidden="true">*</span>}
      </span>
      {children}
    </label>
  )
}
