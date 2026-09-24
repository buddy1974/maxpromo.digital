'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import {
  FRICTION_QUESTIONS,
  scoreFriction,
  type FrictionAnswers,
  type FrictionPattern,
} from '@/lib/friction-check'
import './friction-check.css'

/**
 * app/[locale]/friction-check/page.tsx
 *
 * The Business Friction Check (ADR-0016, Phase C).
 *
 * Six questions, one screen each, and a result that names the shape of the
 * friction instead of scoring the business.
 *
 * THREE DECISIONS THAT ARE THE POINT OF THE PAGE
 *
 * The result comes first and comes free. No email gate, no "enter your address
 * to see your report". A diagnostic held hostage is not a diagnostic, and the
 * repository's own rule against persuading with unsupported numbers applies
 * just as much when the number would be about the visitor.
 *
 * There is no score. `scoreFriction` returns patterns and tallies, and the
 * tallies exist so the page can show its working — the reader can see which
 * of their own answers produced the result. "Your automation score is 87%"
 * would be inventing precision about a business we have never seen.
 *
 * It can say no. Answer the low-friction option throughout and the page says
 * this company is probably not what you need. That outcome is reachable on
 * purpose: a check that always finds a problem is a sales script.
 *
 * WHY ONE QUESTION PER SCREEN
 *
 * Six questions on one page look like a form and get abandoned like one. One
 * at a time with a visible count reads as a conversation, and it keeps every
 * option legible at 320px without a grid that has to collapse.
 */

const PATTERN_KEYS: Record<FrictionPattern, { title: string; looks: string; first: string; watch: string }> = {
  repeatedWork: { title: 'repeatedWorkTitle', looks: 'repeatedWorkLooks', first: 'repeatedWorkFirst', watch: 'repeatedWorkWatch' },
  disconnected: { title: 'disconnectedTitle', looks: 'disconnectedLooks', first: 'disconnectedFirst', watch: 'disconnectedWatch' },
  waiting:      { title: 'waitingTitle',      looks: 'waitingLooks',      first: 'waitingFirst',      watch: 'waitingWatch' },
  documents:    { title: 'documentsTitle',    looks: 'documentsLooks',    first: 'documentsFirst',    watch: 'documentsWatch' },
  followUp:     { title: 'followUpTitle',     looks: 'followUpLooks',     first: 'followUpFirst',     watch: 'followUpWatch' },
}

type Stage = 'intro' | 'questions' | 'result'

export default function FrictionCheckPage() {
  const t = useTranslations('frictionCheck')
  const [stage, setStage] = useState<Stage>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<FrictionAnswers>({})

  const question = FRICTION_QUESTIONS[index]
  const total = FRICTION_QUESTIONS.length
  const result = useMemo(() => scoreFriction(answers), [answers])
  const chosen = question ? answers[question.id] : undefined
  const isLast = index === total - 1

  function choose(optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
  }

  function advance() {
    if (isLast) setStage('result')
    else setIndex((i) => i + 1)
  }

  function restart() {
    setAnswers({})
    setIndex(0)
    setStage('intro')
  }

  return (
    <main className="fc">
      {/* ── Intro ──────────────────────────────────────────────────────── */}
      {stage === 'intro' && (
        <section className="fc-panel">
          <p className="section-label">{t('eyebrow')}</p>
          <h1 className="fc-title">{t('title')}</h1>
          <p className="fc-lede">{t('lede')}</p>
          <p className="fc-meta">{t('meta')}</p>
          <p className="fc-note">{t('startNote')}</p>
          <button type="button" className="btn btn-primary fc-start" onClick={() => setStage('questions')}>
            {t('next')}
          </button>
        </section>
      )}

      {/* ── Questions ──────────────────────────────────────────────────── */}
      {stage === 'questions' && question && (
        <section className="fc-panel">
          {/* A live region so the question change is announced, not just painted. */}
          <p className="fc-progress" aria-live="polite">
            {t('progress', { current: index + 1, total })}
          </p>
          <div className="fc-bar" aria-hidden="true">
            <span className="fc-bar-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>

          <fieldset className="fc-fieldset">
            <legend className="fc-question">{t(question.id)}</legend>
            <div className="fc-options">
              {question.options.map((o) => {
                const id = `${question.id}-${o.id}`
                return (
                  <label key={o.id} className={`fc-option${chosen === o.id ? ' fc-option-on' : ''}`} htmlFor={id}>
                    <input
                      id={id}
                      type="radio"
                      name={question.id}
                      value={o.id}
                      checked={chosen === o.id}
                      onChange={() => choose(o.id)}
                      className="fc-radio"
                    />
                    <span className="fc-option-text">{t(`${question.id}${o.id}`)}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="fc-actions">
            <button
              type="button"
              className="btn btn-ghost fc-back"
              onClick={() => (index === 0 ? setStage('intro') : setIndex((i) => i - 1))}
            >
              {t('back')}
            </button>
            <button type="button" className="btn btn-primary" onClick={advance} disabled={!chosen}>
              {isLast ? t('seeResult') : t('next')}
            </button>
          </div>
        </section>
      )}

      {/* ── Result ─────────────────────────────────────────────────────── */}
      {stage === 'result' && (
        <section className="fc-panel">
          <p className="section-label">{t('resultEyebrow')}</p>

          {result.lowFriction ? (
            <>
              <h1 className="fc-title">{t('lowTitle')}</h1>
              <p className="fc-lede">{t('lowBody')}</p>
              {/* The honest outcome, given the same weight as any other. */}
              <p className="fc-honest">{t('lowHonest')}</p>
              <p className="fc-note">{t('lowNext')}</p>
            </>
          ) : (
            <>
              <h1 className="fc-title">
                {result.patterns.length > 1 ? t('patternsIntroPlural') : t('patternsIntro')}
              </h1>
              {result.patterns.map((p) => {
                const k = PATTERN_KEYS[p]
                return (
                  <article key={p} className="fc-pattern">
                    <h2 className="fc-pattern-title">{t(k.title)}</h2>
                    <div className="fc-pattern-part">
                      <p className="fc-pattern-label">{t('looksLike')}</p>
                      <p className="fc-pattern-body">{t(k.looks)}</p>
                    </div>
                    <div className="fc-pattern-part">
                      <p className="fc-pattern-label">{t('firstStep')}</p>
                      <p className="fc-pattern-body">{t(k.first)}</p>
                    </div>
                    <div className="fc-pattern-part">
                      <p className="fc-pattern-label">{t('watchOut')}</p>
                      <p className="fc-pattern-body">{t(k.watch)}</p>
                    </div>
                  </article>
                )
              })}
            </>
          )}

          <p className="fc-disclaimer">{t('disclaimer')}</p>

          <div className="fc-after">
            <SectionHeader label={t('ctaTitle')}>{t('ctaBody')}</SectionHeader>
            {/* `source` is the parameter the contact form already reads as its
                weakest signal, so this needs no change at the other end. */}
            <Link href="/contact?source=friction-check" className="btn btn-primary fc-cta">
              {t('ctaButton')}
            </Link>
            <p className="fc-note">{t('ctaNoEmail')}</p>
          </div>

          <div className="fc-after">
            <p className="fc-pattern-label">{t('learnTitle')}</p>
            <p className="fc-pattern-body">{t('learnBody')}</p>
            <Link href="/solutions/workflow-automation" className="quiet-link">{t('learnLink')}</Link>
          </div>

          <button type="button" className="btn btn-ghost fc-restart" onClick={restart}>
            {t('restart')}
          </button>
        </section>
      )}
    </main>
  )
}
