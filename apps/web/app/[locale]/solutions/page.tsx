import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { pageMetadata } from '@/lib/seo/og'
import { CAPABILITIES } from '@/lib/capabilities'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { FlowSteps } from '@/components/ui/FlowSteps'
import { CapabilityRail } from '@/components/ui/CapabilityRail'
import './solutions.css'

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
 * 2026-10-06: all five capabilities have their own page, so each section links
 * straight to it. The operating view that sat below the five — three system
 * families, a seven-stage flow, the six legacy solution pages as examples, and
 * a five-step method that disagreed with the homepage's four — is gone. It
 * asked a visitor to learn the company's internal taxonomy after they had
 * already found what they came for. The legacy pages redirect to the
 * capability that replaced them (next.config.ts).
 */

/** Every capability has its own page (ADR-0016, Phases A and E). */
const CAPABILITY_PAGE: Record<string, string> = {
  'workflow-automation': '/solutions/workflow-automation',
  'custom-applications': '/solutions/custom-applications',
  'web-development':     '/solutions/web-development',
  'content-operations':  '/solutions/content-operations',
  'product-operations':  '/solutions/product-operations',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return pageMetadata({
    locale,
    path: '/solutions',
    title: isDE ? 'Leistungen: Automatisierung, Anwendungen, Web' : 'What we do: automation, applications, web',
    cardTitle: isDE ? 'Was wir machen' : 'What we do',
    // Names the five, in the words a business searches with.
    description: isDE
      ? 'Prozessautomatisierung, individuelle Anwendungen, Webentwicklung, Content- und Produktabläufe. Wir fangen bei dem an, was Ihren Betrieb ausbremst.'
      : 'Workflow automation, custom applications, web development, content and product operations. We start with what is slowing the business down.',
    family: 'company',
  })
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isDE = locale === 'de'
  const tCap = await getTranslations('capabilities')
  const tWwd = await getTranslations('whatWeDo')

  return (
    <>
      {/* Opening statement, on the authority surface.
          Problem-led, not a catalogue. The previous version opened with "five
          kinds of work", which asks the reader to choose a category before
          anyone has acknowledged what brought them here. Naming the five is
          still this page's job; it is just not its first sentence. */}
      <section className="section-feature surface-authority">
        <div className="container">
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{tWwd('eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{tWwd('title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{tWwd('lede')}</p>
          </div>
        </div>
      </section>

      {/* The argument the page is actually making, before the menu.
          Five sentences, each a different shape of problem, so a reader who
          does not know what they need recognises their situation rather than
          picking a service. The closing line takes the choosing off them. */}
      <section className="section surface-plain" data-section="different-answers">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{tWwd('diffEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{tWwd('diffTitle')}</h2>
          </div>
          <ul className="wwd-cases">
            {(['d1', 'd2', 'd3', 'd4', 'd5'] as const).map((k) => (
              <li key={k} className="wwd-case">{tWwd(k)}</li>
            ))}
          </ul>
          <p className="wwd-close">{tWwd('diffClose')}</p>
        </div>
      </section>

      {/* The five, as jump links. This is the page's table of contents and its
          answer to "do you do the thing I need" at the same time. */}
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

                <div className="cap-actions">
                  <Link href={CAPABILITY_PAGE[c.id]} className="btn btn-sm">
                    {tCap(`${c.key}Cta`)}
                  </Link>
                  {/* Carries which capability the reader was looking at into
                      the contact page, so the first conversation starts from
                      it rather than from a blank form. */}
                  <Link href={`/contact?capability=${c.id}&source=what-we-do`} className="quiet-link">
                    {isDE ? 'Darüber sprechen' : 'Talk about this'}
                  </Link>
                </div>
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

      {/* Automation or system? The question most visitors cannot answer for
          themselves, and the one that decides between the first two
          capabilities above. Drawn side by side: one reliable connection, and
          one reliable operating flow with its approval and its record visible.
          Neither is presented as the better one, and nothing here is priced.
          Linked from the homepage, both capability pages and Resources. */}
      <section id="automation-or-system" data-section="automation-or-system" className="section surface-evidence aos-section">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{tWwd('aosEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{tWwd('aosTitle')}</h2>
            <p className="sec-lede">{tWwd('aosIntro')}</p>
          </div>

          <div className="aos">
            {([
              { side: 'A', href: '/solutions/workflow-automation', personAt: -1, recordAt: -1 },
              { side: 'B', href: '/solutions/custom-applications', personAt: 4, recordAt: 6 },
            ] as const).map((c) => (
              <article key={c.side} className={`aos-side aos-side-${c.side.toLowerCase()}`}>
                <h3 className="aos-kind">{tWwd(`aos${c.side}`)}</h3>
                <FlowSteps
                  label={tWwd(`aos${c.side}`)}
                  steps={(tWwd.raw(`aos${c.side}Steps`) as string[]).map((label, i) => ({
                    label,
                    person: i === c.personAt ? tWwd('aosPersonTag') : undefined,
                    record: i === c.recordAt ? tWwd('aosRecordTag') : undefined,
                  }))}
                />
                <p className="aos-body">{tWwd(`aos${c.side}Body`)}</p>
                <p className="aos-fit-label">{tWwd(`aos${c.side}FitLabel`)}</p>
                <ul className="aos-fit">
                  {(tWwd.raw(`aos${c.side}Fit`) as string[]).map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link href={c.href} className="quiet-link">{tWwd(`aos${c.side}Link`)} &rarr;</Link>
              </article>
            ))}
          </div>

          <div className="aos-bridge">
            <p className="aos-bridge-text">{tWwd('aosBridge1')}<br />{tWwd('aosBridge2')}</p>
            <Link href="/contact?source=what-we-do-aos" className="btn btn-primary">{tWwd('aosCta')}</Link>
          </div>
        </div>
      </section>

      {/* What happens after someone writes in. Three steps, and the third one
          says out loud that the answer can be "you do not need us". A page
          that cannot say that is a brochure. */}
      <section className="section surface-plain" data-section="how-it-starts">
        <div className="container">
          <div className="sec-head">
            <p className="section-label">{tWwd('startEyebrow')}</p>
            <h2 style={{ margin: 0 }}>{tWwd('startTitle')}</h2>
          </div>
          <ol className="wwd-steps">
            {(['s1', 's2', 's3'] as const).map((k, i) => (
              <li key={k} className="wwd-step">
                <p className="family-index">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="wwd-step-title">{tWwd(`${k}Title`)}</h3>
                <p className="wwd-step-body">{tWwd(`${k}Body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section surface-authority" data-section="closing">
        <div className="container">
          <div className="wwd-close-block">
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{tWwd('closeTitle')}</h2>
            <p className="wwd-close-body">{tWwd('closeBody')}</p>
            <div className="wwd-cta-row">
              <Link href="/contact?source=what-we-do" className="btn btn-primary">
                {tWwd('closeCta')}
              </Link>
              <Link href="/work" className="btn">
                {tWwd('closeSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
