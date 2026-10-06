import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import './guide.css'

/**
 * app/[locale]/resources/what-to-automate-first/page.tsx
 *
 * "What should you automate first?" — the first Guide (ADR-0016, Phase D).
 *
 * WHAT THIS IS FOR
 *
 * The Friction Check tells an owner what kind of friction they have. It does
 * not tell them what to do about it, and the honest answer to that is longer
 * than a result screen. This is that answer.
 *
 * It is written to be useful to somebody who never contacts this company. That
 * is not generosity, it is the only version that works: a guide that sells on
 * every third paragraph gets read as an advertisement and forwarded to nobody.
 * There are exactly two calls to action and both are at the end.
 *
 * THE ARGUMENT
 *
 * Three rules first, because they decide everything downstream. Simplify before
 * automating; automate the path information takes rather than the person; and
 * preparing is not deciding. Then two lists — what suits automation and what
 * does not — because "what should I automate" is really the question "what kind
 * of work is this". Then an order, sorted by how certain the benefit is rather
 * than by effort. Then the three mistakes that actually happen.
 *
 * WHAT IS NOT HERE
 *
 * No time savings, no percentages, no "businesses typically see". This company
 * has no measured figure it may publish, and a guide that invents one to sound
 * authoritative is the exact failure the claims registry exists to catch. The
 * argument stands on reasoning, which is what a guide is for.
 */

const SUITABLE = ['s1', 's2', 's3', 's4', 's5'] as const
const UNSUITABLE = ['u1', 'u2', 'u3', 'u4', 'u5'] as const
const ORDER = ['o1', 'o2', 'o3', 'o4', 'o5'] as const
const MISTAKES = ['m1', 'm2', 'm3'] as const
const RULES = ['rule1', 'rule2', 'rule3'] as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return pageMetadata({
    locale,
    path: '/resources/what-to-automate-first',
    title: isDE ? 'Was sollte zuerst automatisiert werden?' : 'What should you automate first?',
    description: isDE
      ? 'Welche Arbeit sich für Automatisierung eignet, welche besser bei Menschen bleibt, und in welcher Reihenfolge man anfängt. Ohne Verkaufsgespräch.'
      : 'Which work suits automation, which is better left with people, and what order to start in. Without a sales pitch.',
    family: 'guide',
  })
}

export default async function WhatToAutomateFirstPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('automationGuide')

  /* Article markup, because this page is one: a titled, authored piece of
     writing. The date is the day it was first published (509868a), the
     author and publisher are the entities the layout declares. Nothing here
     that the page does not visibly say. */
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('title'),
    description: t('lede'),
    inLanguage: locale === 'en' ? 'en-GB' : 'de-DE',
    datePublished: '2026-09-25',
    mainEntityOfPage: `https://www.maxpromo.digital/${locale}/resources/what-to-automate-first`,
    author: { '@id': 'https://www.maxpromo.digital/#founder' },
    publisher: { '@id': 'https://www.maxpromo.digital/#organization' },
  }

  return (
    <div className="guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article>
        <header className="guide-head">
          <Link href="/resources" className="quiet-link">{t('eyebrow')}</Link>
          <h1 className="guide-title">{t('title')}</h1>
          <p className="guide-lede">{t('lede')}</p>
          <p className="guide-meta">{t('readingTime')}</p>
        </header>

        {/* ── The three rules ────────────────────────────────────────────── */}
        <section className="guide-section">
          {RULES.map((r) => (
            <div key={r} className="guide-rule">
              <p className="guide-rule-label">{t(`${r}Label`)}</p>
              <h2 className="guide-rule-title">{t(`${r}Title`)}</h2>
              <p className="guide-body">{t(`${r}Body`)}</p>
              {/* The question the reader can actually use today. */}
              <p className="guide-ask">{t(`${r}Ask`)}</p>
            </div>
          ))}
        </section>

        {/* ── Suited / not suited ────────────────────────────────────────── */}
        <section className="guide-section">
          <SectionHeader label={t('eyebrow')}>{t('suitableTitle')}</SectionHeader>
          <p className="guide-body guide-body-lede">{t('suitableLede')}</p>
          <ul className="guide-list">
            {SUITABLE.map((s) => (
              <li key={s} className="guide-item guide-item-yes">
                <h3 className="guide-item-title">{t(`${s}Title`)}</h3>
                <p className="guide-item-body">{t(`${s}Body`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="guide-section">
          <SectionHeader label={t('eyebrow')}>{t('unsuitableTitle')}</SectionHeader>
          <p className="guide-body guide-body-lede">{t('unsuitableLede')}</p>
          <ul className="guide-list">
            {UNSUITABLE.map((u) => (
              <li key={u} className="guide-item guide-item-no">
                <h3 className="guide-item-title">{t(`${u}Title`)}</h3>
                <p className="guide-item-body">{t(`${u}Body`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── The order ──────────────────────────────────────────────────── */}
        <section className="guide-section">
          <SectionHeader label={t('eyebrow')}>{t('orderTitle')}</SectionHeader>
          <p className="guide-body guide-body-lede">{t('orderLede')}</p>
          <ol className="guide-order">
            {ORDER.map((o, i) => (
              <li key={o} className="guide-order-item">
                <span className="guide-order-num" aria-hidden="true">{i + 1}</span>
                <span className="guide-order-text">{t(o)}</span>
              </li>
            ))}
          </ol>
          <p className="guide-ask">{t('orderNote')}</p>
        </section>

        {/* ── Mistakes ───────────────────────────────────────────────────── */}
        <section className="guide-section">
          <SectionHeader label={t('eyebrow')}>{t('mistakesTitle')}</SectionHeader>
          {MISTAKES.map((m) => (
            <div key={m} className="guide-mistake">
              <h3 className="guide-item-title">{t(`${m}Title`)}</h3>
              <p className="guide-item-body">{t(`${m}Body`)}</p>
            </div>
          ))}
        </section>

        {/* ── The only two calls to action, both at the end ──────────────── */}
        <section className="guide-close">
          <h2 className="guide-rule-title">{t('closeTitle')}</h2>
          <p className="guide-body">{t('closeBody')}</p>
          <Link href="/friction-check" className="btn btn-primary guide-cta">{t('closeCta')}</Link>
          <p className="guide-alt">
            {t('closeAlt')}{' '}
            <Link href="/contact?source=automation-guide" className="quiet-link">{t('closeAltCta')}</Link>
          </p>
        </section>
      </article>
    </div>
  )
}
