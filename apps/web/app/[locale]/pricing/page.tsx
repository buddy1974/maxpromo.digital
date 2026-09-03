import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

/**
 * app/[locale]/pricing/page.tsx
 *
 * Answers one business question: "what will this cost me?"
 *
 * Rebuilt in v5.1. The previous page was a three-card SaaS pricing grid: a
 * "✦ most popular" pill floating over the middle card, prices set at 48px in
 * weight 800, drop shadows, an accent-tinted featured card, and a tick beside
 * every line. Every one of those is on the retire list, and together they are
 * the single most template-looking screen on the site.
 *
 * It is now a plan table. Plans are compared in columns because that is what a
 * reader is actually doing — comparing — and a table compares better than
 * three cards do. Nothing is "most popular"; if one plan suits most people we
 * can say so in a sentence rather than decorate it.
 *
 * Build work gets its own section rather than a fourth card, because it is
 * quoted rather than listed and pretending otherwise helps nobody.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pricing' })
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/pricing`,
      languages: {
        de: 'https://www.maxpromo.digital/de/pricing',
        en: 'https://www.maxpromo.digital/en/pricing',
      },
    },
  }
}

const TIERS = ['t1', 't2', 't3'] as const
const INCLUDE_KEYS = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8'] as const
const FAQ_IDS = ['q1', 'q2', 'q3', 'q4'] as const

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('pricing')
  const tTiers = await getTranslations('pricing.tiers')
  const tFaq = await getTranslations('pricing.faq')
  const isDE = locale === 'de'

  // Each plan lists what it includes. Missing keys simply are not in that plan.
  const tierIncludes: Record<string, string[]> = {
    t1: ['I1', 'I2', 'I3', 'I4', 'I5', 'I6'],
    t2: [...INCLUDE_KEYS],
    t3: [...INCLUDE_KEYS],
  }

  return (
    <>
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: 'var(--measure)' }}>
            <p className="section-label">{t('eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('title')}</h1>
            <p className="lede">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="plan-grid">
            {TIERS.map((id) => (
              <div key={id} className="plan">
                <p className="plan-name">{tTiers(`${id}Name`)}</p>
                <p className="plan-price">
                  {tTiers(`${id}Price`)}
                  <span className="plan-period">{tTiers(`${id}Period`)}</span>
                </p>
                <p className="plan-desc">{tTiers(`${id}Desc`)}</p>
                <ul className="plain-list plan-includes">
                  {tierIncludes[id].map((ik) => (
                    <li key={ik}>{tTiers(`${id}${ik}`)}</li>
                  ))}
                </ul>
                <Link href="/contact" className="btn btn-secondary plan-cta">
                  {tTiers(`${id}Cta`)}
                </Link>
              </div>
            ))}
          </div>
          <p className="plan-footnote">{t('footnote')}</p>
        </div>
      </section>

      {/* Build work is quoted, not listed. */}
      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderBlock: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{t('buildEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('buildTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
                {t('buildDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{t('faqEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('faqTitle')}</h2>
            </div>
            <div>
              <dl className="spec">
                {FAQ_IDS.map((qid) => (
                  <div key={qid}>
                    <dt>{tFaq(qid)}</dt>
                    <dd>{tFaq(`a${qid.substring(1)}`)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div style={{ maxWidth: 'var(--measure-narrow)' }}>
            <p className="section-label">{t('ctaEyebrow')}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('ctaTitle')}</h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {t('ctaDesc')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link href="/contact" className="btn btn-primary">{t('ctaPrimary')}</Link>
              <Link href="/solutions" className="btn btn-secondary">
                {isDE ? 'Leistungen ansehen' : 'See what we do'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
