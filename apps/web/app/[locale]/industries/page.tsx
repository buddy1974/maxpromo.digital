import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { INDUSTRIES, asLocale } from '@/lib/industries'
import { ArchitectureMap } from '@/components/ui/ArchitectureMap'
import type { IconName } from '@maxpromo/ui'

/**
 * app/[locale]/industries/page.tsx
 *
 * Rebuilt in the public presentation pass.
 *
 * What it was: six equal rows, name, summary, "Read →". The same directory
 * pattern as Solutions and Resources, and it made the page's actual argument
 * invisible. The argument is not "here are six sectors". It is that the same
 * three operational breakdowns appear in every one of them, in a different
 * vocabulary each time.
 *
 * So the breakdowns are the columns and the sectors are the rows. A reader
 * scanning down their own row recognises their business; a reader scanning
 * across a column sees that it is not just their business. That is the
 * sentence the page is trying to say, and now the structure says it.
 *
 * Every cell is distilled from that sector's own `problem` text in
 * lib/industries.ts. No sector knowledge is claimed here that the record does
 * not already carry.
 *
 * The table scrolls horizontally on a narrow screen rather than collapsing:
 * a matrix that stacks into eighteen labelled paragraphs is no longer a
 * matrix. `.matrix-wrap` is the scrolling container the responsive audit
 * requires for that.
 */

/** Governed icon per sector. Chosen for the operation each one runs, not for
 *  a picture of the trade: a practice and a clinic both run appointments. */
const INDUSTRY_ICON: Record<string, IconName> = {
  healthcare: 'calendar',
  construction: 'tasks',
  property: 'clients',
  hospitality: 'inbox',
  publishing: 'documents',
  'professional-services': 'briefing',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Branchen' : 'Industries',
    description: isDE
      ? 'Sechs Branchen, drei wiederkehrende Betriebsprobleme. Wo Arbeit ankommt, wo Informationen auseinanderfallen und was eine Entscheidung aufhält.'
      : 'Six sectors, three recurring operational problems. Where work arrives, where information splits up, and what holds a decision.',
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
  const tScene = await getTranslations('scenes')

  const columns = isDE
    ? ['Wo Arbeit ankommt', 'Wo Informationen auseinanderfallen', 'Was eine Entscheidung aufhält']
    : ['Where work arrives', 'Where information splits up', 'What holds a decision']

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{isDE ? 'Branchen' : 'Industries'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE
                ? 'Wir arbeiten dort, wo wir den Betrieb verstehen.'
                : 'We work where we understand the operation.'}
            </h1>
            <p className="sec-lede" style={{ margin: 0 }}>
              {isDE
                ? 'Sechs Branchen, die wir gebaut haben und weiter betreiben. Die Sprache ist in jeder eine andere. Die drei Stellen, an denen es klemmt, sind überall dieselben.'
                : 'Six sectors we have built for and still run. The vocabulary is different in every one. The three places it breaks down are the same everywhere.'}
            </p>
          </div>

          {/* One backbone, six sectors attached to it. The page's argument,
              before the table that proves it. */}
          <div className="scene-on-dark">
            <ArchitectureMap
              layout="hub"
              centre={{ label: tScene('indCentre') }}
              nodes={INDUSTRIES.map((i) => ({ label: i.name[l], icon: INDUSTRY_ICON[i.slug] }))}
              caption={tScene('indCaption')}
              a11yIntro={tScene('indA11y')}
            />
          </div>
        </div>
      </section>

      <section className="section surface-operational">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{isDE ? 'Das wiederkehrende Muster' : 'The recurring pattern'}</p>
            <h2 style={{ margin: 0 }}>
              {isDE ? 'Andere Branche. Dieselben drei Brüche.' : 'Different sector. The same three breaks.'}
            </h2>
          </div>

          <div className="matrix-wrap">
            <table className="matrix">
              <caption className="sr-only">
                {isDE
                  ? 'Sechs Branchen und die drei betrieblichen Brüche, die in jeder auftreten.'
                  : 'Six sectors and the three operational breakdowns that occur in each.'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{isDE ? 'Branche' : 'Sector'}</th>
                  {columns.map((c) => <th key={c} scope="col">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {INDUSTRIES.map((ind) => (
                  <tr key={ind.slug}>
                    <th scope="row">
                      {ind.name[l]}
                      <br />
                      <Link href={`/industries/${ind.slug}`} className="matrix-link">
                        {isDE ? 'Ansehen' : 'Open'} &rarr;
                      </Link>
                    </th>
                    <td>{ind.pattern.arrives[l]}</td>
                    <td>{ind.pattern.fragments[l]}</td>
                    <td>{ind.pattern.slows[l]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: 'var(--space-6) 0 0', maxWidth: '52rem', fontSize: 'var(--text-small)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
            {isDE
              ? 'Die Spalten wiederholen sich, weil das Problem betrieblich ist und nicht fachlich. Deshalb passt dasselbe Betriebsmodell in sechs Branchen, ohne in einer davon generisch zu werden.'
              : 'The columns repeat because the problem is operational rather than specialist. That is why one operating model fits six sectors without becoming generic in any of them.'}
          </p>
        </div>
      </section>

      <section className="section surface-plain">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{isDE ? 'Was wir mitbringen' : 'What we bring'}</p>
              <h2 style={{ margin: 0 }}>
                {isDE ? 'Kenntnis des Ablaufs, nicht des Fachgebiets.' : 'Knowledge of the operation, not of the profession.'}
              </h2>
            </div>
            <div>
              <p style={{ margin: '0 0 var(--space-5)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
                {isDE
                  ? 'Wir sagen Ihnen nicht, wie man eine Praxis führt, ein Dach deckt oder ein Buch verlegt. Das können Sie. Wir wissen, wie Arbeit durch einen Betrieb läuft, wo sie stehen bleibt und was es kostet, wenn sie zweimal erfasst wird.'
                  : 'We will not tell you how to run a practice, roof a building or publish a book. You can do that. What we know is how work moves through a business, where it stops, and what it costs when it gets captured twice.'}
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
                {isDE
                  ? 'Ihre Branche ist nicht dabei? Das ist kein Nein. Die Arbeit ist in jedem Betrieb dieselbe: herausfinden, wo Informationen doppelt erfasst werden, und die Lücke schließen. Die Branche bestimmt nur, wie die Lücke aussieht.'
                  : 'Not your sector? That is not a no. The work is the same in every business: find where information is captured twice, and close the gap. The sector only determines what the gap looks like.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '40rem' }}>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Erzählen Sie uns, wie es bei Ihnen läuft.' : 'Tell us how it runs where you are.'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {isDE
                ? 'Dreißig Minuten über Ihren Ablauf. Danach wissen Sie, wo die Zeit hingeht, ob wir zusammenarbeiten oder nicht.'
                : 'Thirty minutes on your workflow. Afterwards you will know where the time is going, whether or not we work together.'}
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
