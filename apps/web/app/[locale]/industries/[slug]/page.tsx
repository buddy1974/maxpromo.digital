import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { INDUSTRIES, getIndustry, asLocale } from '@/lib/industries'

/**
 * app/[locale]/industries/[slug]/page.tsx
 *
 * One sector, one business question: "do you understand a business like mine,
 * and what would you actually do?"
 *
 * The page follows the fixed five-part structure from lib/industries.ts —
 * problem, reality, approach, outcome, next step — in that order and no other.
 * It is deliberately typographic: no icons, no cards, no statistics we cannot
 * source. The reality section exists because it is the part that earns trust;
 * telling an operator why the problem is structural rather than their fault is
 * what a consultant does and a marketing page does not.
 */

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await params
  const ind = getIndustry(slug)
  if (!ind) return {}
  const l = asLocale(locale)
  return {
    title: ind.name[l],
    description: ind.summary[l],
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/industries/${slug}`,
      languages: {
        de: `https://www.maxpromo.digital/de/industries/${slug}`,
        en: `https://www.maxpromo.digital/en/industries/${slug}`,
      },
    },
  }
}

export default async function IndustryPage(
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const ind = getIndustry(slug)
  if (!ind) notFound()

  const l = asLocale(locale)
  const isDE = l === 'de'
  const others = INDUSTRIES.filter((i) => i.slug !== slug)

  return (
    <>
      {/* Problem */}
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: '44rem' }}>
            <p className="section-label">
              <Link href="/industries" className="nav-link">{isDE ? 'Branchen' : 'Industries'}</Link>
            </p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{ind.name[l]}</h1>
            <p className="lede" style={{ marginBottom: 'var(--space-8)' }}>{ind.summary[l]}</p>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text)', maxWidth: '42rem' }}>
              {ind.problem[l]}
            </p>
          </div>
        </div>
      </section>

      {/* Reality — why it happens. The part that earns trust. */}
      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderBlock: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Warum das passiert' : 'Why this happens'}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.6, color: 'var(--brand-text)' }}>
                {ind.reality[l]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="section">
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Vorgehen' : 'Approach'}</p>
              <h2 style={{ margin: 0 }}>
                {isDE ? 'Was wir tatsächlich tun' : 'What we actually do'}
              </h2>
            </div>
            <div>
              <ol className="step-list">
                {ind.approach[l].map((step, i) => (
                  <li key={i}>
                    <span className="step-list-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome */}
      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Ergebnis' : 'Outcome'}</p>
              <h2 style={{ margin: 0 }}>
                {isDE ? 'Was sich danach ändert' : 'What changes afterwards'}
              </h2>
            </div>
            <div>
              <ul className="outcome-list">
                {ind.outcome[l].map((o, i) => <li key={i}>{o}</li>)}
              </ul>

              <dl className="spec" style={{ marginTop: 'var(--space-8)' }}>
                <div>
                  <dt>{isDE ? 'Wir arbeiten mit' : 'We work with'}</dt>
                  <dd>{ind.whoWeWorkWith[l].join(' · ')}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Next step */}
      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div style={{ maxWidth: '38rem' }}>
            <p className="section-label">{isDE ? 'Nächster Schritt' : 'Next step'}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Ein Gespräch, kein Angebot' : 'A conversation, not a pitch'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {ind.next[l]}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link href="/contact" className="btn btn-primary">
                {isDE ? 'Gespräch vereinbaren' : 'Start a conversation'}
              </Link>
              <Link href="/solutions" className="btn btn-secondary">
                {isDE ? 'Leistungen ansehen' : 'See what we do'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other sectors */}
      <section className="section-compact" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <p className="section-label">{isDE ? 'Andere Branchen' : 'Other sectors'}</p>
          <div className="chip-row">
            {others.map((o) => (
              <Link key={o.slug} href={`/industries/${o.slug}`} className="chip">
                {o.name[l]}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
