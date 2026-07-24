'use client'

/**
 * AuditForm.tsx — Universal Business Diagnostic
 *
 * Architecture: pain-first, product-agnostic.
 * Sections, options, and scoring live in lib/audit-diagnostic.ts (structure,
 * ids, and category→option mapping — locale-independent).
 * Display copy (headlines, subheadlines, options, category labels) is
 * localized via the `automationAudit` namespace in messages/*.json,
 * looked up by section id / category id. This component is responsible
 * only for UI state, flow, and rendering translated copy.
 *
 * Flow:
 *  questions (steps 1–10) → loading → received (diagnostic feedback)
 */

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  AUDIT_SECTIONS,
  computeDiagnosticCategories,
  type DiagnosticCategoryId,
  type DiagnosticPayload,
  type DiagnosticContactData,
} from '@/lib/audit-diagnostic'
import VoiceInputWidget from '@/components/voice/VoiceInputWidget'

// ── Font tokens ──────────────────────────────────────────────────────────────
const mono = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans = 'var(--font-inter)'

// ── Stage / step config ──────────────────────────────────────────────────────
type Stage = 'questions' | 'loading' | 'received'
const TOTAL_STEPS = AUDIT_SECTIONS.length + 1 // 9 sections + 1 contact step
const CONTACT_STEP = TOTAL_STEPS

// ── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const t = useTranslations('automationAudit')
  const pct = Math.round(((current - 1) / (total - 1)) * 100)
  return (
    <div style={{ marginBottom: '36px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: '#F97316',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {t('progressSectionLabel', { current, total })}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: '#444444',
            letterSpacing: '0.1em',
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '2px',
          background: 'rgba(255,255,255,0.07)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${pct}%`,
            background: '#F97316',
            boxShadow: '0 0 8px rgba(249,115,22,0.5)',
            transition: 'width 350ms ease',
          }}
        />
      </div>
    </div>
  )
}

function OptionBtn({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: mono,
        fontSize: '12px',
        letterSpacing: '0.03em',
        padding: '10px 14px',
        border: selected ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.1)',
        background: selected ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.02)',
        color: selected ? '#F97316' : '#888888',
        cursor: 'pointer',
        transition: 'all 140ms ease',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: '13px',
          height: '13px',
          border: selected ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.18)',
          background: selected ? '#F97316' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: '#000',
          flexShrink: 0,
        }}
      >
        {selected ? '✓' : ''}
      </span>
      {label}
    </button>
  )
}

function LoadingScreen() {
  const t = useTranslations('automationAudit')
  const loadingMessages = t.raw('loadingMessages') as string[]
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // One-time effect — safe here because component only mounts once
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, loadingMessages.length - 1))
    }, 1400)
    const start = Date.now()
    const progInterval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(92, (elapsed / 6000) * 92)
      setProgress(pct)
      if (pct >= 92) clearInterval(progInterval)
    }, 80)
    return () => {
      clearInterval(msgInterval)
      clearInterval(progInterval)
    }
  }, [loadingMessages.length])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        className="audit-pulse"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: '#F97316',
          marginBottom: '36px',
          boxShadow: '0 0 28px rgba(249,115,22,0.45)',
        }}
      />
      <p
        style={{
          fontFamily: mono,
          fontSize: '13px',
          color: '#FFFFFF',
          letterSpacing: '0.04em',
          marginBottom: '6px',
          minHeight: '20px',
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        {loadingMessages[msgIndex]}
      </p>
      <p
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#3A3A3A',
          letterSpacing: '0.1em',
          marginBottom: '44px',
        }}
      >
        {t('loadingCaption')}
      </p>
      <div
        style={{
          width: '260px',
          height: '2px',
          background: 'rgba(255,255,255,0.07)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: '#F97316',
            transition: 'width 80ms linear',
            boxShadow: '0 0 8px rgba(249,115,22,0.6)',
          }}
        />
      </div>
      <p
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#333333',
          marginTop: '10px',
          letterSpacing: '0.1em',
        }}
      >
        {Math.round(progress)}%
      </p>
    </div>
  )
}

function DiagnosticReceived({
  categories,
  company,
  name,
}: {
  categories: DiagnosticCategoryId[]
  company: string
  name: string
}) {
  const t = useTranslations('automationAudit')
  const displayName = company || name || t('receivedFallbackName')

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 16px' }}>
      {/* Header */}
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: '3px solid #F97316',
          padding: '48px',
          marginBottom: '2px',
        }}
        className="px-6 md:px-12"
      >
        <p
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: '#F97316',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          {t('receivedLabel')}
        </p>
        <h2
          style={{
            fontFamily: grotesk,
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            letterSpacing: '-0.04em',
            color: '#FFFFFF',
            marginBottom: '12px',
          }}
        >
          {t('receivedTitle', { name: displayName })}
        </h2>
        <p
          style={{
            fontFamily: sans,
            fontSize: '15px',
            color: '#666666',
            lineHeight: 1.7,
            maxWidth: '520px',
            marginBottom: '0',
          }}
        >
          {t('receivedSummary', {
            count: categories.length,
            plural: categories.length !== 1 ? 's' : '',
          })}
        </p>
      </div>

      {/* Category cards */}
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: 'none',
          padding: '40px 48px',
          marginBottom: '2px',
        }}
        className="px-6 md:px-12"
      >
        <p
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: '#444444',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          {t('opportunitiesLabel')}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          {categories.map((catId, i) => (
            <div
              key={catId}
              style={{
                background: 'rgba(249,115,22,0.04)',
                border: '1px solid rgba(249,115,22,0.18)',
                padding: '20px',
                position: 'relative',
              }}
            >
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '9px',
                  color: '#F97316',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  opacity: 0.6,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <p
                style={{
                  fontFamily: grotesk,
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  marginBottom: '6px',
                }}
              >
                {t(`categories.${catId}.label`)}
              </p>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: '12px',
                  color: '#666666',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {t(`categories.${catId}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: 'none',
          padding: '32px 48px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        className="px-6 md:px-12"
      >
        <div>
          <p
            style={{
              fontFamily: grotesk,
              fontWeight: 600,
              fontSize: '15px',
              color: '#FFFFFF',
              marginBottom: '4px',
            }}
          >
            {t('discussTitle')}
          </p>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#555555', letterSpacing: '0.05em' }}>
            {t('discussCaption')}
          </p>
        </div>
        <Link
          href="/contact"
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: '12px',
            color: '#000000',
            background: '#F97316',
            padding: '13px 24px',
            textDecoration: 'none',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'inline-block',
            boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
            transition: 'opacity 150ms ease',
            flexShrink: 0,
          }}
        >
          {t('talkToUsCta')}
        </Link>
      </div>
    </div>
  )
}

// ── Field input ──────────────────────────────────────────────────────────────

function FieldInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
}) {
  return (
    <div>
      <label
        style={{
          fontFamily: mono,
          fontSize: '10px',
          color: '#888888',
          display: 'block',
          marginBottom: '8px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}{' '}
        {required && <span style={{ color: '#F97316' }}>*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#FFFFFF',
          fontFamily: sans,
          fontSize: '15px',
          padding: '13px 16px',
          outline: 'none',
          boxSizing: 'border-box',
          borderRadius: '2px',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.08)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AuditForm() {
  const t = useTranslations('automationAudit')
  const [step, setStep] = useState(1)
  const [stage, setStage] = useState<Stage>('questions')

  // Multi-select state keyed by section id
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  // CEO question (section 9, type textarea)
  const [ceoQuestion, setCeoQuestion] = useState('')
  // Contact fields
  const [contact, setContact] = useState<DiagnosticContactData>({
    name: '',
    company: '',
    email: '',
    phone: '',
  })
  // Post-submission
  const [detectedCategories, setDetectedCategories] = useState<DiagnosticCategoryId[]>([])
  const [error, setError] = useState('')

  // ── Section helpers ──────────────────────────────────────────────────────

  const currentSection = AUDIT_SECTIONS.find((s) => s.step === step)
  const isContactStep = step === CONTACT_STEP

  // Translated copy for the current section, looked up by section id.
  // Options are pulled from messages/*.json (automationAudit.sections.<id>)
  // rather than lib/audit-diagnostic.ts, so display copy is localized while
  // the scoring keys (option strings used in OPTION_SCORES) stay locale-
  // independent — the English option strings remain the canonical scoring
  // keys, and the translated labels shown to the user map 1:1 by array index.
  const sectionOptionKeys = currentSection?.options ?? []
  const translatedOptions = currentSection
    ? (t.raw(`sections.${currentSection.id}.options`) as string[] | undefined) ?? sectionOptionKeys
    : []

  const toggleOption = (sectionId: string, optionKey: string) => {
    setSelections((prev) => {
      const current = prev[sectionId] ?? []
      return {
        ...prev,
        [sectionId]: current.includes(optionKey)
          ? current.filter((o) => o !== optionKey)
          : [...current, optionKey],
      }
    })
  }

  // ── Validation ───────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (!currentSection && !isContactStep) return false
    if (isContactStep) {
      return (
        contact.name.trim().length > 0 &&
        contact.email.trim().length > 0 &&
        contact.company.trim().length > 0
      )
    }
    if (currentSection?.type === 'textarea') {
      return ceoQuestion.trim().length >= (currentSection.textareaMinLength ?? 10)
    }
    // multi-select: at least one selection required
    const sectionSelections = selections[currentSection!.id] ?? []
    return sectionSelections.length > 0
  }

  // ── Submission ───────────────────────────────────────────────────────────

  const submit = async () => {
    setStage('loading')
    setError('')

    // Collect all selected options across all sections.
    // Selections are stored keyed by the canonical (English) option string
    // from lib/audit-diagnostic.ts, so scoring is locale-independent.
    const allSelections = Object.values(selections).flat()
    const categories = computeDiagnosticCategories(allSelections)
    setDetectedCategories(categories)

    const payload: DiagnosticPayload = {
      selections,
      ceoQuestion,
      contact,
      detectedCategories: categories,
    }

    // Fire API call non-blocking — lead saved + email sent in background
    fetch('/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silent fail — diagnostic display is client-computed, not API-dependent
    })

    // Brief analytical pause for UX before showing results
    await new Promise((resolve) => setTimeout(resolve, 2800))
    setStage('received')
  }

  const next = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
    } else {
      void submit()
    }
  }

  const back = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  // ── Render: loading ──────────────────────────────────────────────────────

  if (stage === 'loading') return <LoadingScreen />

  // ── Render: received ─────────────────────────────────────────────────────

  if (stage === 'received') {
    return (
      <DiagnosticReceived
        categories={detectedCategories}
        company={contact.company}
        name={contact.name}
      />
    )
  }

  // ── Render: questions ────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 16px' }}>
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '48px',
        }}
        className="px-6 md:px-12"
      >
        <ProgressBar current={step} total={TOTAL_STEPS} />

        {error && (
          <div
            style={{
              background: 'rgba(204,0,0,0.1)',
              border: '1px solid rgba(204,0,0,0.3)',
              padding: '12px 16px',
              marginBottom: '24px',
              fontFamily: sans,
              fontSize: '13px',
              color: '#FF6666',
            }}
          >
            {error}
          </div>
        )}

        {/* ── Sections 1–8: multi-select ── */}
        {currentSection && currentSection.type === 'multi-select' && (
          <div>
            <h2
              style={{
                fontFamily: grotesk,
                fontWeight: 700,
                fontSize: 'clamp(1.3rem, 3vw, 1.65rem)',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
                marginBottom: '8px',
              }}
            >
              {t(`sections.${currentSection.id}.headline`)}
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: '14px',
                color: '#555555',
                marginBottom: '28px',
                lineHeight: 1.6,
              }}
            >
              {t(`sections.${currentSection.id}.subheadline`)}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}
            >
              {sectionOptionKeys.map((optionKey, i) => (
                <OptionBtn
                  key={optionKey}
                  label={translatedOptions[i] ?? optionKey}
                  selected={(selections[currentSection.id] ?? []).includes(optionKey)}
                  onClick={() => toggleOption(currentSection.id, optionKey)}
                />
              ))}
            </div>
            {(selections[currentSection.id] ?? []).length > 0 && (
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '10px',
                  color: '#F97316',
                  letterSpacing: '0.1em',
                  marginTop: '16px',
                  opacity: 0.7,
                }}
              >
                {t('selectedCount', { count: (selections[currentSection.id] ?? []).length })}
              </p>
            )}
          </div>
        )}

        {/* ── Section 9: CEO question (textarea) ── */}
        {currentSection && currentSection.type === 'textarea' && (
          <div>
            <h2
              style={{
                fontFamily: grotesk,
                fontWeight: 700,
                fontSize: 'clamp(1.3rem, 3vw, 1.65rem)',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
                marginBottom: '8px',
              }}
            >
              {t(`sections.${currentSection.id}.headline`)}
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: '14px',
                color: '#555555',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}
            >
              {t(`sections.${currentSection.id}.subheadline`)}
            </p>
            <VoiceInputWidget
              value={ceoQuestion}
              onChange={setCeoQuestion}
              rows={7}
              placeholder={t(`sections.${currentSection.id}.textareaPlaceholder`)}
              context="CEO strategic question about business operations and challenges"
              lang="de-DE"
              textareaStyle={{
                color: '#FFFFFF',
                fontFamily: sans,
                fontSize: '14px',
                padding: '16px',
                lineHeight: 1.75,
                minHeight: '140px',
              }}
            />
            <p
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: ceoQuestion.length >= 20 ? '#F97316' : '#444444',
                letterSpacing: '0.08em',
                marginTop: '8px',
                transition: 'color 200ms ease',
              }}
            >
              {t('charactersCount', { count: ceoQuestion.length })}
              {ceoQuestion.length < 20 && (
                <span style={{ color: '#444444' }}>{t('charactersMinimum')}</span>
              )}
            </p>
          </div>
        )}

        {/* ── Step 10: Contact ── */}
        {isContactStep && (
          <div>
            <h2
              style={{
                fontFamily: grotesk,
                fontWeight: 700,
                fontSize: 'clamp(1.3rem, 3vw, 1.65rem)',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
                marginBottom: '8px',
              }}
            >
              {t('contactHeadline')}
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: '14px',
                color: '#555555',
                marginBottom: '32px',
                lineHeight: 1.6,
              }}
            >
              {t('contactSubheadline')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <FieldInput
                label={t('fieldNameLabel')}
                type="text"
                value={contact.name}
                onChange={(v) => setContact((p) => ({ ...p, name: v }))}
                placeholder={t('fieldNamePlaceholder')}
                required
              />
              <FieldInput
                label={t('fieldCompanyLabel')}
                type="text"
                value={contact.company}
                onChange={(v) => setContact((p) => ({ ...p, company: v }))}
                placeholder={t('fieldCompanyPlaceholder')}
                required
              />
              <FieldInput
                label={t('fieldEmailLabel')}
                type="email"
                value={contact.email}
                onChange={(v) => setContact((p) => ({ ...p, email: v }))}
                placeholder={t('fieldEmailPlaceholder')}
                required
              />
              <FieldInput
                label={t('fieldPhoneLabel')}
                type="tel"
                value={contact.phone}
                onChange={(v) => setContact((p) => ({ ...p, phone: v }))}
                placeholder={t('fieldPhonePlaceholder')}
              />
            </div>
            <p
              style={{
                fontFamily: mono,
                fontSize: '10px',
                color: '#3A3A3A',
                letterSpacing: '0.06em',
              }}
            >
              {t('contactFootnote')}
            </p>
          </div>
        )}

        {/* ── Navigation ── */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: '14px',
                color: '#666666',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '13px 24px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.color = '#CCCCCC'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#666666'
              }}
            >
              {t('backButton')}
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canProceed()}
            style={{
              fontFamily: mono,
              fontWeight: 700,
              fontSize: '12px',
              color: '#000000',
              background: '#F97316',
              padding: '13px 28px',
              border: 'none',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              opacity: canProceed() ? 1 : 0.4,
              flex: 1,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition: 'opacity 150ms ease, box-shadow 150ms ease',
              boxShadow: canProceed() ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            {step === TOTAL_STEPS ? t('submitButton') : t('continueButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
