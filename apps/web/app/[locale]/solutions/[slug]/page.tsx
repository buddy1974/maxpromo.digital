import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SOLUTIONS, getSolution, asLocale } from '@/lib/solutions'

/**
 * app/[locale]/solutions/[slug]/page.tsx
 *
 * One business problem per page, one page shape for all of them.
 *
 * Replaces six hand-authored routes that each solved this layout separately
 * and, predictably, ended up with six different section orders and six
 * translation namespaces using different key names for identical concepts.
 *
 * The order is fixed and deliberate: the problem in the reader's own words,
 * then why it happens, then what we do, then what changes, then the honest
 * boundary, then one next step. The scope section states what is *not*
 * included, which is the part a buyer actually needs and the part a marketing
 * page never prints.
 */

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await params
  const sol = getSolution(slug)
  if (!sol) return {}
  const l = asLocale(locale)
  return {
    title: sol.name[l],
    description: sol.summary[l],
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/solutions/${slug}`,
      languages: {
        de: `https://www.maxpromo.digital/de/solutions/${slug}`,
        en: `https://www.maxpromo.digital/en/solutions/${slug}`,
      },
    },
  }
}

export default async function SolutionPage(
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const sol = getSolution(slug)
  if (!sol) notFound()

  const l = asLocale(locale)
  const isDE = l === 'de'
  const others = SOLUTIONS.filter((s) => s.slug !== slug)

  return (
    <>
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: 'var(--measure)' }}>
            <p className="section-label">
              <Link href="/solutions" className="nav-link">{isDE ? 'Leistungen' : 'Solutions'}</Link>
            </p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{sol.name[l]}</h1>
            <p className="lede" style={{ marginBottom: 'var(--space-8)' }}>{sol.summary[l]}</p>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {sol.problem[l]}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderBlock: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div><p className="section-label">{isDE ? 'Warum das passiert' : 'Why this happens'}</p></div>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-lede)', lineHeight: 1.65 }}>{sol.reality[l]}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Vorgehen' : 'Approach'}</p>
              <h2 style={{ margin: 0 }}>{isDE ? 'Was wir tatsächlich tun' : 'What we actually do'}</h2>
            </div>
            <div>
              <ol className="step-list">
                {sol.approach[l].map((step, i) => (
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

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Ergebnis' : 'Outcome'}</p>
              <h2 style={{ margin: 0 }}>{isDE ? 'Was sich danach ändert' : 'What changes afterwards'}</h2>
            </div>
            <div>
              <ul className="outcome-list">
                {sol.outcome[l].map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Scope. The boundary is the part a buyer needs and a marketing page
          never prints, so it gets equal weight to the promise. */}
      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Umfang' : 'Scope'}</p>
              <h2 style={{ margin: 0 }}>{isDE ? 'Was dazugehört — und was nicht' : 'What is included, and what is not'}</h2>
            </div>
            <div className="scope-grid">
              <div>
                <p className="scope-heading">{isDE ? 'Enthalten' : 'Included'}</p>
                <ul className="plain-list">
                  {sol.included[l].map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div>
                <p className="scope-heading">{isDE ? 'Nicht enthalten' : 'Not included'}</p>
                <ul className="plain-list plain-list-muted">
                  {sol.notIncluded[l].map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div style={{ maxWidth: 'var(--measure-narrow)' }}>
            <p className="section-label">{isDE ? 'Nächster Schritt' : 'Next step'}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Ein Gespräch, kein Angebot' : 'A conversation, not a pitch'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {sol.next[l]}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link href="/contact" className="btn btn-primary">
                {isDE ? 'Gespräch vereinbaren' : 'Start a conversation'}
              </Link>
              <Link href="/industries" className="btn btn-secondary">
                {isDE ? 'Branchen ansehen' : 'See industries'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-compact" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <p className="section-label">{isDE ? 'Weitere Leistungen' : 'Other solutions'}</p>
          <div className="chip-row">
            {others.map((o) => (
              <Link key={o.slug} href={`/solutions/${o.slug}`} className="chip">{o.name[l]}</Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
