'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import VoiceInputWidget from '@/components/voice/VoiceInputWidget'
import {
  CONTACT_PAIN_POINTS,
  type ContactPainPoint,
  type PreferredContactMethod,
} from '@/lib/contact-options'

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

/**
 * Known ?system= values, each maps to a `contact.systems.<slug>` entry in
 * messages/{de,en}.json (eyebrow/title/subtitle). Keep in sync with the
 * `contactSlug` field on every ProductEntry in lib/registry/products.ts.
 *
 * When the query param matches, the contact page swaps its generic hero
 * copy for this small contextual banner, it does not render full product
 * content (bullets, screenshots, workflow), that lives on the system's own
 * /systems/<slug> page.
 */
const KNOWN_CONTACT_SYSTEMS = [
  'agent-bureau', 'restaurant-os', 'handwerk-os', 'praxis-os', 'printshop-os',
  'care-os', 'real-estate-os', 'publishing-os', 'taxkontrol', 'drive24',
] as const

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

const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'
const heroTitleStyle = { fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.02em' } as const

export default function ContactPage() {
  const t = useTranslations('contact')
  const [form, setForm] = useState<FormData>(initialForm)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const system = new URLSearchParams(window.location.search).get('system')
    if (system) setForm((current) => ({ ...current, system }))
  }, [])

  // Only render the contextual banner for a recognised system slug, an
  // unknown or malformed ?system= value silently falls back to the
  // generic contact copy rather than throwing on a missing translation key.
  const contextSystem = KNOWN_CONTACT_SYSTEMS.find((slug) => slug === form.system)

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const togglePainPoint = (painPoint: ContactPainPoint) => {
    update(
      'painPoints',
      form.painPoints.includes(painPoint)
        ? form.painPoints.filter((item) => item !== painPoint)
        : [...form.painPoints, painPoint],
    )
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
      <main className="min-h-[70vh] bg-[var(--color-bg)]" style={{ padding: SECTION_PADDING }}>
        <div className="mx-auto max-w-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-12 text-center rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
          <p className="mb-4 text-5xl text-[var(--color-primary)]">✓</p>
          <h1 className="mb-3 font-heading text-3xl font-bold text-[var(--color-text-primary)]">{t('successTitle')}</h1>
          <p className="mb-8 text-[var(--color-text-secondary)]">{t('successDesc')}</p>
          <button
            type="button"
            onClick={() => {
              setForm({ ...initialForm, system: form.system })
              setStatus('idle')
            }}
            className="font-mono text-sm text-[var(--color-primary)]"
          >
            {t('successAnother')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[var(--color-bg)]">
      <section className="border-b border-[var(--color-border)] text-center bg-[var(--color-bg)]" style={{ padding: SECTION_PADDING }}>
        {contextSystem ? (
          <>
            {/* Small contextual banner only, no product bullets, workflow or screenshots here.
                Full product content lives on the dedicated /systems/<slug> page. */}
            <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.15em] text-[var(--color-primary)]">
              {t(`systems.${contextSystem}.eyebrow`)}
            </p>
            <h1 className="mb-5 font-heading font-extrabold text-[var(--color-text-primary)]" style={heroTitleStyle}>
              {t(`systems.${contextSystem}.title`)}
            </h1>
            <p className="mx-auto max-w-2xl text-[17px] leading-7 text-[var(--color-text-secondary)]">
              {t(`systems.${contextSystem}.subtitle`)}
            </p>
          </>
        ) : (
          <>
            <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.15em] text-[var(--color-primary)]">
              {t('eyebrow')}
            </p>
            <h1 className="mb-5 font-heading font-extrabold text-[var(--color-text-primary)]" style={heroTitleStyle}>
              {t('title')}
            </h1>
            <p className="mx-auto max-w-2xl text-[17px] leading-7 text-[var(--color-text-secondary)]">{t('subtitle')}</p>
          </>
        )}
      </section>

      <section className="bg-[var(--color-bg-section)]" style={{ padding: SECTION_PADDING }}>
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl flex-col gap-6 border border-[var(--color-border)] bg-[var(--color-bg)] p-6 md:p-12 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
        >
          {status === 'error' && (
            <p className="border border-red-300 bg-red-50 p-3 text-sm text-red-600 rounded-[var(--radius-card)]">
              {errorMessage}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('formName')} required>
              <input
                required
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                className="input"
                autoComplete="name"
              />
            </Field>
            <Field label={t('formCompany')} required>
              <input
                required
                value={form.company}
                onChange={(event) => update('company', event.target.value)}
                className="input"
                autoComplete="organization"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('formEmail')} required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                className="input"
                autoComplete="email"
              />
            </Field>
            <Field label={`${t('formPhone')} ${t('formOptional')}`}>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                className="input"
                autoComplete="tel"
              />
            </Field>
          </div>

          <Field label={t('formPreferredContact')}>
            <select
              value={form.preferredContactMethod}
              onChange={(event) =>
                update('preferredContactMethod', event.target.value as PreferredContactMethod)
              }
              className="select"
            >
              <option value="email">{t('contactMethodEmail')}</option>
              <option value="phone">{t('contactMethodPhone')}</option>
              <option value="whatsapp">{t('contactMethodWhatsApp')}</option>
            </select>
          </Field>

          <fieldset>
            <legend className="mb-1 font-heading text-xl font-bold text-[var(--color-text-primary)]">
              {t('painPointsTitle')}
            </legend>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{t('painPointsOptional')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CONTACT_PAIN_POINTS.map((painPoint) => (
                <label
                  key={painPoint}
                  className="flex cursor-pointer items-start gap-3 text-sm text-[var(--color-text-secondary)]"
                >
                  <input
                    type="checkbox"
                    checked={form.painPoints.includes(painPoint)}
                    onChange={() => togglePainPoint(painPoint)}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  {t(`painPoints.${painPoint}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t('formMessage')} required>
            <VoiceInputWidget
              value={form.message}
              onChange={(value) => update('message', value)}
              rows={6}
              placeholder={t('formMessagePlaceholder')}
              context="Contact message"
              textareaStyle={{
                width: '100%',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-card)',
                padding: '14px 16px',
                color: 'var(--color-text-primary)',
              }}
            />
          </Field>

          <button
            type="submit"
            disabled={!isValid || status === 'loading'}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === 'loading' ? t('formCtaSending') : t('formCta')}
          </button>
          <p className="text-center font-mono text-[12px] text-[var(--color-text-secondary)]">{t('formPrivacy')}</p>
        </form>
      </section>
    </main>
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
    <label className="block">
      <span className="mb-2 block font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
        {label} {required && <span className="text-[var(--color-primary)]">*</span>}
      </span>
      {children}
    </label>
  )
}
