import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'
import { breadcrumbs, graph } from '@/lib/seo/schema'
import { JsonLd } from '@/components/seo/JsonLd'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { INDUSTRIES, getIndustry, asLocale } from '@/lib/industries'
import { getCapability } from '@/lib/capabilities'
import { Fragment } from 'react'

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
  return pageMetadata({
    locale,
    path: `/industries/${slug}`,
    title: ind.name[l],
    description: ind.summary[l],
    family: 'industry',
  })
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
  const tNav = await getTranslations('nav')
  const tCap = await getTranslations('capabilities')
  const capabilities = ind.capabilities.flatMap((id) => (id ? [getCapability(id)!] : []))

  return (
    <>
      <JsonLd data={graph(breadcrumbs(locale, [
        { name: tNav('industries'), path: '/industries' },
        { name: ind.name[l], path: `/industries/${slug}` },
      ]))} />
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

              {/* From the sector's problem to the capability that fixes it:
                  the one or two pages this reader needs next, nothing more. */}
              <dl className="spec" style={{ marginTop: 'var(--space-8)' }}>
                <div>
                  <dt>{isDE ? 'Was wir dafür bauen' : 'What we build for it'}</dt>
                  <dd>
                    {capabilities.map((c, i) => (
                      <Fragment key={c.id}>
                        {i > 0 && ' · '}
                        <Link href={`/solutions/${c.id}`} className="link">{tCap(`${c.key}Name`)}</Link>
                      </Fragment>
                    ))}
                  </dd>
                </div>
              </dl>
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
                  <dt>{isDE ? 'Gedacht für' : 'Meant for'}</dt>
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
              {/* The sector travels with the visitor, so the first conversation
                  starts from it. The secondary action is proof rather than a
                  menu: a real workflow, shown step by step. */}
              <Link href={`/contact?source=industry-${slug}`} className="btn btn-primary">
                {isDE ? 'Zeigen Sie uns, wie die Arbeit heute läuft' : 'Walk us through how work happens today'}
              </Link>
              <Link href="/work/maxpromo-os" className="btn btn-secondary">
                {isDE ? 'Einen echten Ablauf ansehen' : 'See a real workflow'}
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
