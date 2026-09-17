import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ComparisonPanel } from '@/components/ui/ComparisonPanel'

/**
 * app/[locale]/case-studies/page.tsx
 *
 * Rebuilt in the public presentation pass.
 *
 * The material here was already the strongest evidence on the site: three real
 * projects with a situation, an approach, four results and a delivery time.
 * The presentation buried it in a large pale card with a green edge, a row of
 * tool badges and two columns of grey prose, so the page read as three
 * brochures rather than three changes.
 *
 * It now shows a transformation: what the business was doing before, what the
 * system does instead, and what changed after. The figure stays in the case
 * headline, where it already was, at heading size and on its own rule.
 *
 * WHAT WAS NOT CHANGED, DELIBERATELY. Every figure, every result line, every
 * timeline and the NDA statement are the repository's existing strings. No
 * number was strengthened, rounded, generalised or moved from one project to
 * another, and the £14,000 figure stays in pounds here because this is the
 * page that states the currency. ADR-0007: a claim is checked like a token,
 * never corrected like one.
 *
 * The "before" column is not new evidence either. Each line is drawn from that
 * case's own `Challenge` text, which is already published on this page.
 */

const mono = { fontFamily: 'var(--brand-font-mono)' } as const

const CASES = [
  {
    id: 'cs1',
    beforeKeys: ['b1', 'b2', 'b3'],
    systemKeys: ['s1', 's2', 's3'],
    resultKeys: ['Result1', 'Result2', 'Result3', 'Result4'],
  },
  {
    id: 'cs2',
    beforeKeys: ['b1', 'b2', 'b3'],
    systemKeys: ['s1', 's2', 's3'],
    resultKeys: ['Result1', 'Result2', 'Result3', 'Result4'],
  },
  {
    id: 'cs3',
    beforeKeys: ['b1', 'b2', 'b3'],
    systemKeys: ['s1', 's2', 's3'],
    resultKeys: ['Result1', 'Result2', 'Result3', 'Result4'],
  },
] as const

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('caseStudies')
  return { title: t('metaTitle'), description: t('metaDesc') }
}

export default async function CaseStudiesPage() {
  const t = await getTranslations('caseStudies')
  const locale = await getLocale()
  const isDE = locale === 'de'
  const tScene = await getTranslations('scenes')

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{t('eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('heroTitle')}</h1>
            <p className="sec-lede" style={{ margin: '0 0 var(--space-5)' }}>{t('heroDesc')}</p>
            <p style={{ ...mono, margin: 0, fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--brand-text-inverted-secondary)' }}>
              {t('ndaNote')}
            </p>
          </div>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          {CASES.map((cs) => (
            <article key={cs.id} className="case">
              <div className="case-head">
                <div>
                  <p className="case-meta">{t(`${cs.id}Tag`)}</p>
                  <h2 style={{ margin: 'var(--space-3) 0 0' }}>{t(`${cs.id}Headline`)}</h2>
                </div>
                <p className="case-meta">{t('deliveredIn')} {t(`${cs.id}Timeline`)}</p>
              </div>

              {/* The change, as a comparison. Both columns are this case's own
                  published strings: the left from its Challenge, the right
                  from its Results. Nothing here is a claim the page did not
                  already carry (ADR-0007). */}
              <ComparisonPanel
                beforeTitle={tScene('cmpBefore')}
                beforeItems={cs.beforeKeys.map((k) => t(`${cs.id}${k}`))}
                afterTitle={tScene('cmpAfter')}
                afterItems={cs.resultKeys.map((k) => t(`${cs.id}${k}`))}
              />

              {/* What the system does between the two. */}
              <div className="case-system">
                <p className="transform-label">{isDE ? 'Was das System übernimmt' : 'What the system does'}</p>
                <ul className="case-system-list">
                  {cs.systemKeys.map((k) => <li key={k}>{t(`${cs.id}${k}`)}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '40rem' }}>
            <p className="section-label">{t('ctaEyebrow')}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('ctaTitle')}</h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {t('ctaDesc')}
            </p>
            <Link href="/contact" className="btn btn-primary">{t('ctaPrimary')}</Link>
          </div>
        </div>
      </section>
    </>
  )
}
