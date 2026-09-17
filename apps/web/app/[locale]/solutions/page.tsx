import type { Metadata } from 'next'
import type { IconName } from '@maxpromo/ui'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SOLUTIONS, SOLUTION_FAMILIES, asLocale } from '@/lib/solutions'
import { CAPABILITIES } from '@/lib/capabilities'
import { OperatingFlow } from '@/components/ui/OperatingFlow'
import { ArchitectureMap } from '@/components/ui/ArchitectureMap'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { CapabilityRail } from '@/components/ui/CapabilityRail'

/**
 * app/[locale]/solutions/page.tsx
 *
 * Rebuilt twice, and the second rebuild reversed part of the first.
 *
 * It began as six equal rows — a name, a summary and "Read →" — which said
 * that modernising a website and designing the system a company runs on are
 * the same size of thing, and put the reader to work choosing before anyone
 * had explained what Maxpromo does.
 *
 * The presentation pass replaced that with three families: operating systems,
 * workflow, supervised operations. Correct, and the way this company thinks.
 * It also meant a visitor who arrived searching for a web developer, an
 * automation, or someone to build an internal tool could read the entire page
 * without meeting the word they came for. The site was organised around the
 * answer instead of around the question.
 *
 * So the page now leads with the five things the work is called when a
 * business asks for it (lib/capabilities.ts): a rail of five under the
 * statement, then one section each, each with its own scene. Web development
 * is findable in seconds, from the top of the page, in both locales.
 *
 * The three families are not deleted — they are the argument that these five
 * are one practice rather than a menu, and they keep their section, their
 * diagram and their example links, below the five. The order is the change:
 * the concrete is the door, the operating view is the room behind it.
 */

const FLOW_KEYS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'] as const

/** Governed icon per family, so the scene and the list below it agree. */
const FAMILY_ICON: Record<string, IconName> = {
  'operating-systems': 'system',
  workflow: 'agents',
  supervised: 'approvals',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Leistungen' : 'Solutions',
    // Names the five, in the words a business searches with. The previous
    // description named the three operating families, which are accurate and
    // which nobody types into a search box.
    description: isDE
      ? 'Prozessautomatisierung, individuelle Anwendungen, Webentwicklung, Content- und Social-Abläufe, Produkt- und Commerce-Abläufe. Was wir bauen und an welcher Stelle im Betrieb es ansetzt.'
      : 'Workflow automation, custom applications, web development, content and social operations, product and commerce operations. What we build, and where in the business it goes.',
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/solutions`,
      languages: {
        de: 'https://www.maxpromo.digital/de/solutions',
        en: 'https://www.maxpromo.digital/en/solutions',
      },
    },
  }
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = asLocale(locale)
  const isDE = l === 'de'
  const tFlow = await getTranslations('flow')
  const tScene = await getTranslations('scenes')
  const tCap = await getTranslations('capabilities')

  const solution = (slug: string) => SOLUTIONS.find((s) => s.slug === slug)

  return (
    <>
      {/* Opening statement, on the authority surface. */}
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{isDE ? 'Leistungen' : 'Solutions'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE ? 'Wir arbeiten am Ablauf, nicht am Werkzeug.' : 'We work on the process, not the tool.'}
            </h1>
            <p className="sec-lede" style={{ margin: 0 }}>
              {isDE
                ? 'Fünf Arten von Arbeit, und darunter ein Betrieb. Fangen Sie mit der an, wegen der Sie hier sind.'
                : 'Five kinds of work, and one operation underneath them. Start with the one you came for.'}
            </p>
          </div>
        </div>
      </section>

      {/* The five, as jump links, directly under the statement. This is the
          page's table of contents and its answer to "do you do the thing I
          need" at the same time. */}
      <CapabilityRail
        label={tCap('railLabel')}
        items={CAPABILITIES.map((c) => ({ id: c.id, icon: c.icon, name: tCap(`${c.key}Name`) }))}
      />

      {/* One section per capability, alternating surfaces so the five read as
          five rather than as a wall. Each carries its own scene: the same
          grammar — discs, connectors, one accented human step where there is
          one — drawing a different route each time. */}
      {CAPABILITIES.map((c, i) => (
        <section
          key={c.id}
          id={c.id}
          data-section={c.id}
          className={i % 2 === 0 ? 'section cap-section surface-plain' : 'section cap-section surface-operational'}
        >
          <div className="container">
            <div className="cap-head">
              <div>
                <p className="family-index">{String(i + 1).padStart(2, '0')}</p>
                <h2 style={{ margin: '0 0 var(--space-2)' }}>{tCap(`${c.key}Name`)}</h2>
                <p className="cap-short">{tCap(`${c.key}Short`)}</p>
              </div>
              <div>
                <p className="cap-pain">{tCap(`${c.key}Pain`)}</p>
                <p className="cap-does">{tCap(`${c.key}Does`)}</p>
                {/* Carries which capability the reader was looking at into the
                    contact page, so the first conversation starts from it. */}
                <Link href={`/contact?capability=${c.id}`} className="quiet-link">
                  {isDE ? 'Darüber sprechen' : 'Talk about this'}
                </Link>
              </div>
            </div>

            <div className="cap-scene">
              <ProcessSequence
                numbered={false}
                a11yIntro={`${tCap(`${c.key}Name`)}:`}
                humanLabel={isDE ? 'Mensch entscheidet' : 'Person decides'}
                steps={c.scene.map((icon, s) => ({
                  label: tCap.raw(`${c.key}Scene`)[s] as string,
                  icon,
                  human: c.humanAt === s,
                }))}
              />
            </div>
          </div>
        </section>
      ))}

      {/* The operating view, kept and demoted. It explains why the five above
          are one practice, which is a question a reader only asks once they
          have found the one they came for. */}
      <section className="section surface-evidence">
        <div className="container">
          <div className="sec-head sec-head-wide">
            <p className="section-label">{isDE ? 'Wie das zusammengehört' : 'How these group together'}</p>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Fünf Leistungen, drei Arten von System.' : 'Five capabilities, three kinds of system.'}
            </h2>
            <p className="sec-lede">
              {isDE
                ? 'Die fünf oben sind das, wonach gefragt wird. Gebaut werden sie aus drei Arten von System, und jede setzt an einer anderen Stelle des Wegs an, den Arbeit durch ein Unternehmen nimmt.'
                : 'The five above are what gets asked for. They are built out of three kinds of system, and each one goes to a different part of the route work takes through a business.'}
            </p>
          </div>

          <ArchitectureMap
            layout="fan"
            centre={{ label: tScene('solCentre') }}
            nodes={SOLUTION_FAMILIES.map((f) => ({
              label: f.name[l],
              detail: f.stages[l],
              icon: FAMILY_ICON[f.id],
            }))}
            outcome={{ label: tScene('solOutcome') }}
            caption={tScene('solCaption')}
            a11yIntro={tScene('solA11y')}
          />
        </div>
      </section>

      {/* The three families in full, with the six solution pages as their
          examples. */}
      <section className="section surface-plain">
        <div className="container">
          {SOLUTION_FAMILIES.map((f, i) => (
            <div key={f.id} className="family">
              <div>
                <p className="family-index">{String(i + 1).padStart(2, '0')}</p>
                <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-h3)' }}>{f.name[l]}</h3>
                <p className="ruled-desc">{f.stages[l]}</p>
              </div>
              <div>
                <p className="family-claim">{f.claim[l]}</p>
                <p style={{ margin: '0 0 var(--space-5)', fontSize: 'var(--text-small)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)', maxWidth: '58ch' }}>
                  {f.detail[l]}
                </p>
                <ul className="family-examples">
                  {f.examples.map((slug) => {
                    const s = solution(slug)
                    if (!s) return null
                    return (
                      <li key={slug}>
                        <Link href={`/solutions/${slug}`} className="family-example">{s.name[l]}</Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Where the three families meet the flow. */}
      <section className="section surface-operational">
        <div className="container">
          <div className="sec-head sec-head-wide">
            <p className="section-label">{isDE ? 'Wo das ansetzt' : 'Where this goes'}</p>
            <h2 style={{ margin: 0 }}>
              {isDE ? 'Dieselben sieben Stufen, in jedem Betrieb.' : 'The same seven stages, in every business.'}
            </h2>
            <p className="sec-lede">
              {isDE
                ? 'Betriebssysteme tragen Erfassung und Datenbestand. Abläufe tragen Entscheidung und Weiterverarbeitung. Begleitete Abläufe tragen die Stellen, an denen Menschen zustimmen müssen.'
                : 'Operating systems carry intake and the record. Workflow carries decisions and what follows them. Supervised operations carry the points where people have to agree.'}
            </p>
          </div>

          <OperatingFlow
            stages={FLOW_KEYS.map((k) => ({ name: tFlow(`${k}Name`), detail: tFlow(`${k}Detail`) }))}
            feedback={tFlow('feedback')}
            caption={tFlow('caption')}
            a11yIntro={tFlow('a11yIntro')}
          />
        </div>
      </section>

      {/* How the work is done. Beside its heading, not under it. */}
      <section className="section surface-plain">
        <div className="container">
          <div className="sec-split">
            <div>
              <p className="section-label">{isDE ? 'Wie wir arbeiten' : 'How we work'}</p>
              <h2 style={{ margin: 0 }}>
                {isDE ? 'Fünf Schritte, in dieser Reihenfolge.' : 'Five steps, in this order.'}
              </h2>
            </div>
            <div>
              <ol className="step-list">
                {(isDE
                  ? [
                      'Wir sehen uns an, wie der Betrieb heute tatsächlich arbeitet, nicht wie er arbeiten sollte.',
                      'Wir rechnen nach, was die manuellen Schritte pro Monat kosten. Das entscheidet die Reihenfolge.',
                      'Wir bauen das kleinste System, das das Problem löst, und stellen es in Betrieb.',
                      'Wir arbeiten Ihr Team ein, bis es ohne uns läuft.',
                      'Wir pflegen es danach weiter. Ein System ohne Betreuung verfällt.',
                    ]
                  : [
                      'We look at how the business actually works today, not how it is supposed to.',
                      'We put a monthly cost on the manual steps. That decides the order of work.',
                      'We build the smallest system that solves the problem, and put it into service.',
                      'We train your team until it runs without us.',
                      'We maintain it afterwards. A system nobody looks after decays.',
                    ]
                ).map((step, i) => (
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

      <section className="section surface-authority">
        <div className="container">
          <div style={{ maxWidth: '40rem' }}>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Nicht sicher, was davon passt?' : 'Not sure which of these applies?'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
              {isDE
                ? 'Das ist normal. Meistens ist das genannte Problem ein Symptom eines anderen. Ein Gespräch klärt das schneller als eine Auswahl auf einer Website.'
                : 'That is normal. The problem people name is usually a symptom of a different one. A conversation settles that faster than a menu on a website.'}
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
