import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BUSINESS } from '@maxpromo/config'

/**
 * app/[locale]/about/page.tsx
 *
 * Answers one business question: "why should I trust these people?"
 *
 * Rebuilt in v5.1. The previous page opened with "Built before AI became
 * fashion", which is a startup posture — it defines the company against a
 * trend rather than by what it does — and closed with "Today we install
 * AI-powered business systems", which leads with the technology and uses
 * banned vocabulary in the same sentence.
 *
 * Trust here comes from specifics: named platforms, named years, and a
 * statement of how we work that a client could hold us to. No team photos, no
 * founder portrait, no timeline graphic.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/about`,
      languages: {
        de: 'https://www.maxpromo.digital/de/about',
        en: 'https://www.maxpromo.digital/en/about',
      },
    },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('about')
  const isDE = locale === 'de'

  const todayList = t.raw('todayList') as string[]
  const principles = t.raw('principles') as { t: string; d: string }[]

  return (
    <>
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: 'var(--measure)' }}>
            <p className="section-label">{t('eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('title')}</h1>
            <p className="lede">{t('intro')}</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderBlock: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{t('storyEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('storyTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-lede)', lineHeight: 1.65 }}>{t('storyBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{t('transformEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('transformTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
                {t('transformBody')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{t('todayEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('todayTitle')}</h2>
            </div>
            <div>
              <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {t('todayIntro')}
              </p>
              <ul className="plain-list">
                {todayList.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How we work. Stated as commitments a client could hold us to, which
          is the only kind of "values" section worth printing. */}
      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{t('principlesEyebrow')}</p>
              <h2 style={{ margin: 0 }}>{t('principlesTitle')}</h2>
            </div>
            <div>
              <dl className="spec">
                {principles.map((p) => (
                  <div key={p.t}>
                    <dt>{p.t}</dt>
                    <dd>{p.d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Unternehmen' : 'The company'}</p>
            </div>
            <div>
              <dl className="spec">
                <div>
                  <dt>{isDE ? 'Firma' : 'Legal entity'}</dt>
                  <dd>{BUSINESS.legalName} · {BUSINESS.brand}</dd>
                </div>
                <div>
                  <dt>{isDE ? 'Sitz' : 'Based in'}</dt>
                  <dd>{BUSINESS.street}, {BUSINESS.city}, {BUSINESS.country}</dd>
                </div>
                <div>
                  <dt>{isDE ? 'Sprachen' : 'Languages'}</dt>
                  <dd>{isDE ? 'Deutsch, Englisch' : 'German, English'}</dd>
                </div>
                <div>
                  <dt>{isDE ? 'Kontakt' : 'Contact'}</dt>
                  <dd><a href={`mailto:${BUSINESS.email}`} className="link">{BUSINESS.email}</a></dd>
                </div>
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
              <Link href="/solutions" className="btn btn-secondary">{t('ctaSecondary')}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
