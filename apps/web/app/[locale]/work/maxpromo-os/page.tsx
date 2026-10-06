import type { Metadata } from 'next'
import Image from 'next/image'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { pageMetadata } from '@/lib/seo/og'
import { breadcrumbs, graph } from '@/lib/seo/schema'
import { JsonLd } from '@/components/seo/JsonLd'
import { OsWorkflowDiagram } from '@/components/proof/OsWorkflowDiagram'
import './story.css'

/**
 * app/[locale]/work/maxpromo-os/page.tsx
 *
 * The flagship proof story: one quotation, from a loosely written customer
 * email to a saved draft, shown in the system we run our own paperwork on.
 *
 * WHERE EVERY SENTENCE COMES FROM
 *
 * The proof package `maxpromo-os-capture-to-document` in
 * packages/config/proof.ts. ADR-0017: a derived surface may not state a fact
 * that is not in a package. The stages map onto its statements —
 * capture-accepts-real-input, structure-by-schema, extraction-checked-against-
 * source, extraction-creates-nothing, human-saves, number-issued-on-save,
 * human-sends, record-changes-state — and the disclosure is
 * demonstration-data-is-invented. The package's open questions are honoured
 * by omission: there is no before-and-after, because how quotations were
 * produced before is unknown, and no outcome of any kind, because none has
 * been measured. The "what this does not show" list says so in the visitor's
 * words.
 *
 * WHERE EVERY IMAGE COMES FROM
 *
 * apps/web/public/images/systems/maxpromo-os/, made by `evidence:derive` from
 * the five ingested captures and verified by check:proof rule 8. Frames 3 and
 * 4 carry visible redaction blocks over the bank details and tax number, and
 * the page says so rather than hoping nobody notices.
 *
 * WHAT IT IS NOT
 *
 * Not a product page. The OS is the company's own back office, not one of the
 * protected products marketed on their own domains (docs/architecture/
 * platform.md), and nothing here offers it for sale. It is evidence that the
 * kind of workflow the capability pages describe exists and runs.
 */

const IMG = '/images/systems/maxpromo-os'
/* The viewport the five captures were cropped to. One size for all of them,
   so the stages read as one system rather than five screenshots. */
const W = 1311
const H = 752

const STAGES = [
  { id: 'st1', src: `${IMG}/01-source-note.png` },
  { id: 'st2', src: `${IMG}/02-extraction-result.png` },
  { id: 'st3', src: `${IMG}/03-form-before-save.png` },
  { id: 'st4', src: `${IMG}/04-draft-record.png` },
  { id: 'st5', src: `${IMG}/05-lifecycle-list.png` },
] as const

const SHOWS = ['shows1', 'shows2', 'shows3'] as const
const NOT_SHOWN = ['not1', 'not2', 'not3'] as const

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'osStory' })
  return pageMetadata({
    locale,
    path: '/work/maxpromo-os',
    title: t('metaTitle'),
    description: t('metaDesc'),
    family: 'work',
    // The story's own evidence travels with the link: the extraction result,
    // the public redacted derivative, rather than a generic card.
    image: { path: `${IMG}/02-extraction-result.png`, width: 1311, height: 752, alt: t('st2Alt') },
  })
}

export default async function OsStoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('osStory')

  return (
    <>
      <JsonLd data={graph(breadcrumbs(locale, [
        { name: t('crumb'), path: '/work' },
        { name: t('metaTitle'), path: '/work/maxpromo-os' },
      ]))} />
      <section className="hero-band">
        <div className="hero-panel hero-panel-inner">
          <div className="hero-copy">
            <p className="section-label">
              <Link href="/work" className="story-crumb">{t('crumb')}</Link>
            </p>
            <h1 className="story-title">{t('title')}</h1>
            <p className="hero-sub">{t('lede')}</p>
            <p className="story-disclosure">{t('disclosure')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="stages">
        <div className="container">
          <ol className="story-stages">
            {STAGES.map((s, i) => (
              <li key={s.id} className="story-stage">
                <div className="story-say">
                  <p className="story-step">{t('step', { n: i + 1 })}</p>
                  <h2 className="story-stage-title">{t(`${s.id}Title`)}</h2>
                  <p className="story-body">{t(`${s.id}Body`)}</p>
                </div>
                <figure className="story-shot">
                  <div className="story-frame">
                    <Image
                      src={s.src}
                      alt={t(`${s.id}Alt`)}
                      width={W}
                      height={H}
                      sizes="(max-width: 1100px) 100vw, 1060px"
                      priority={i === 0}
                    />
                  </div>
                  <figcaption className="story-caption">
                    <span>{t(`${s.id}Caption`)}</span>
                    <a href={s.src} className="quiet-link story-full">{t('openFull')}</a>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>

          <p className="story-redaction">{t('redactionNote')}</p>
        </div>
      </section>

      {/* The rule, then the drawing that shows it. The diagram is read from
          the code (components/proof/OsWorkflowDiagram.tsx); its provenance
          caption names source files and is for internal surfaces only. */}
      <section className="section surface-evidence" data-section="who-decides">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={t('ruleEyebrow')}>{t('ruleTitle')}</SectionHeader>
            <p className="sec-lede">{t('ruleBody')}</p>
          </div>
          <OsWorkflowDiagram locale={locale === 'en' ? 'en' : 'de'} />
        </div>
      </section>

      <section className="section surface-plain" data-section="scope">
        <div className="container">
          <div className="sec-head">
            <SectionHeader label={t('scopeEyebrow')}>{t('scopeTitle')}</SectionHeader>
          </div>
          <div className="story-scope">
            <div>
              <h3 className="story-scope-label">{t('showsLabel')}</h3>
              <ul className="story-scope-list">
                {SHOWS.map((k) => <li key={k}>{t(k)}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="story-scope-label">{t('notLabel')}</h3>
              <ul className="story-scope-list story-scope-not">
                {NOT_SHOWN.map((k) => <li key={k}>{t(k)}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section surface-authority" data-section="closing">
        <div className="container">
          <div className="story-close">
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('ctaTitle')}</h2>
            <p className="story-close-body">{t('ctaBody')}</p>
            <div className="story-cta-row">
              <Link
                href="/contact?capability=workflow-automation&source=os-story"
                className="btn btn-primary"
              >
                {t('cta')}
              </Link>
              <Link href="/contact?intent=demo&project=maxpromo-os&source=os-story" className="btn">
                {t('ctaDemo')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
