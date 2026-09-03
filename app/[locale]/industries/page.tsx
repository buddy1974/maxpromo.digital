import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { INDUSTRIES, asLocale } from '@/lib/industries'

/**
 * app/[locale]/industries/page.tsx
 *
 * The Industries index. Answers exactly one business question: "do you
 * understand a business like mine?"
 *
 * Deliberately not a card grid of icons. Each sector is a row in a reference
 * list: name, the problem in the operator's own words, and a way in. A reader
 * scanning for their own sector finds it in one pass; a reader who wants to
 * know whether we understand them reads the problem line and decides.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Branchen' : 'Industries',
    description: isDE
      ? 'Sektoren, für die wir gebaut haben: Gesundheitswesen, Handwerk und Bau, Immobilien, Gastronomie, Verlage und Dienstleistung.'
      : 'Sectors we have built for: healthcare, construction and trades, property, hospitality, publishing and professional services.',
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/industries`,
      languages: {
        de: 'https://www.maxpromo.digital/de/industries',
        en: 'https://www.maxpromo.digital/en/industries',
      },
    },
  }
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = asLocale(locale)
  const isDE = l === 'de'

  return (
    <>
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: '46rem' }}>
            <p className="section-label">{isDE ? 'Branchen' : 'Industries'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE
                ? 'Wir arbeiten dort, wo wir den Betrieb verstehen.'
                : 'We work where we understand the operation.'}
            </h1>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {isDE
                ? 'Diese sechs Sektoren haben wir gebaut und betreiben sie weiter. Wenn Ihre Branche nicht dabei ist, heißt das nicht nein — es heißt, dass wir zuerst zuhören.'
                : 'These are the six sectors we have built for and still run. If yours is not listed, that is not a no. It means we would listen first.'}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="industry-list">
            {INDUSTRIES.map((ind) => (
              <Link key={ind.slug} href={`/industries/${ind.slug}`} className="industry-row">
                <div className="industry-row-name">
                  <h2 className="h-card" style={{ margin: 0 }}>{ind.name[l]}</h2>
                </div>
                <div className="industry-row-body">
                  <p className="industry-row-summary">{ind.summary[l]}</p>
                  <span className="industry-row-cta">
                    {isDE ? 'Ansehen' : 'Read'} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div style={{ maxWidth: '38rem' }}>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Ihre Branche ist nicht dabei?' : 'Not your sector?'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {isDE
                ? 'Die Arbeit ist in jedem Betrieb dieselbe: herausfinden, wo Informationen zweimal erfasst werden, und die Lücke schließen. Die Branche bestimmt nur, wie die Lücke aussieht.'
                : 'The work is the same in every business: find where information is captured twice, and close the gap. The sector only determines what the gap looks like.'}
            </p>
            <Link href="/contact" className="btn btn-primary">
              {isDE ? 'Gespräch vereinbaren' : 'Start a conversation'}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
