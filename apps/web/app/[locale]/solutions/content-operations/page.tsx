import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import '../solutions.css'

/**
 * app/[locale]/solutions/content-operations/page.tsx
 *
 * Phase E commercial page (ADR-0016). Same argument shape as the other four.
 *
 * THE ARGUMENT
 *
 * The reader arrives because publishing keeps stalling. The page says the
 * unglamorous true thing: the problem is rarely the writing, it is the
 * capturing. A system that generates text without recording what actually
 * happened during the work produces a lot of content with nothing in it, and
 * it shows.
 *
 * So the flow is capture, prepare, review, publish, record — and "prepare"
 * deliberately produces a draft rather than a post. A draft that already knows
 * what happened is a different thing from an empty box, and that difference is
 * the entire value.
 *
 * WHERE THIS PAGE IS SHARPEST
 *
 * The human section. A model cannot know which customer is annoyed this week
 * or which phrasing lands badly locally, so every flow ends at an approval
 * somebody actually reads. This page sells preparation and explicitly refuses
 * to promise autonomous brand publishing, which is the thing this category is
 * usually sold on.
 *
 * WHAT IS NOT HERE
 *
 * No reach figures, no engagement percentages, no posting cadence promises.
 * There is no measured figure this company may publish about content it
 * produced. The proof position is reserved, as everywhere else.
 */

const FAMILIAR = ['c4f1', 'c4f2', 'c4f3', 'c4f4', 'c4f5', 'c4f6'] as const
const BUILDS = ['c4b1', 'c4b2', 'c4b3', 'c4b4'] as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Inhalte und Social Media' : 'Content and social operations',
    description: isDE
      ? 'Erfassen, vorbereiten, prüfen, veröffentlichen, festhalten. Die Maschine bereitet vor, ein Mensch entscheidet, wie der Betrieb nach außen klingt.'
      : 'Capture, prepare, review, publish, record. The machine prepares; a person decides how the business sounds.',
    alternates: {
      canonical: `/${locale}/solutions/content-operations`,
      languages: {
        de: '/de/solutions/content-operations',
        en: '/en/solutions/content-operations',
      },
    },
  }
}

export default async function CapabilityPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isDE = locale === 'de'
  const t = await getTranslations('capabilityPages')
  const tCap = await getTranslations('capabilities')

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <p className="cp-back">
            <Link href="/solutions" className="quiet-link">{t('backToAll')}</Link>
          </p>
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{t('c4Eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('c4Title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{t('c4Lede')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="familiar">
        <div className="container">
          <SectionHeader label={t('c4FamiliarEyebrow')}>{t('c4FamiliarTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-6)' }}>{t('c4FamiliarLede')}</p>
          <ul className="cp-familiar">
            {FAMILIAR.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </div>
      </section>

      {/* Before the catalogue, not after. A reader should meet "you probably do
          not need a new website" before being shown what we would build. */}
      <section className="section surface-operational" data-section="honest">
        <div className="container">
          <SectionHeader label={t('c4HonestEyebrow')}>{t('c4HonestTitle')}</SectionHeader>
          <div className="cp-honest">
            <p>{t('c4HonestBody')}</p>
            <p>{t('c4HonestClose')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="what-we-build">
        <div className="container">
          <SectionHeader label={t('c4BuildEyebrow')}>{t('c4BuildTitle')}</SectionHeader>
          <ul className="cp-build">
            {BUILDS.map((k) => (
              <li key={k} className="cp-build-item">
                <h3 className="cp-build-title">{t(`${k}Title`)}</h3>
                <p className="cp-build-body">{t(`${k}Body`)}</p>
              </li>
            ))}
          </ul>

          {/* The same scene grammar the homepage bench and the other capability
              pages use, drawn from lib/capabilities.ts so all three draw the
              same thing rather than three near-identical things. */}
          <div className="cap-scene" style={{ marginTop: 'var(--space-8)' }}>
            <ProcessSequence
              numbered={false}
              a11yIntro={`${tCap('c4Name')}:`}
              humanLabel={isDE ? 'Mensch entscheidet' : 'Person decides'}
              steps={(tCap.raw('c4Scene') as string[]).map((label, i) => ({
                label,
                icon: (['newsletter', 'documents', 'approvals'] as const)[i] ?? 'system',
              }))}
            />
          </div>
        </div>
      </section>

      <section className="section-compact surface-evidence" data-section="human">
        <div className="container">
          <div className="cp-human">
            <SectionHeader label={t('c4HumanEyebrow')}>{t('c4HumanTitle')}</SectionHeader>
            <p className="cp-human-body">{t('c4HumanBody')}</p>
          </div>
        </div>
      </section>

      {/* Reserved, not filled. There is no published evidence of a website this
          company built doing this, and a stock screenshot would be worse than
          an honest empty position. */}
      <section className="section surface-plain" data-section="proof">
        <div className="container">
          <div className="cp-proof">
            <ScreenshotSlot
              alt={t('c4Title')}
              width={1200}
              height={750}
              pendingLabel={t('proofPendingLabel')}
            />
            <p className="cp-proof-note">{t('proofPendingNote')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-authority" data-section="closing">
        <div className="container">
          <div className="wwd-close-block">
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('c4CtaTitle')}</h2>
            <p className="wwd-close-body">{t('c4CtaBody')}</p>
            <div className="wwd-cta-row">
              <Link
                href="/contact?capability=content-operations&source=content-operations"
                className="btn btn-primary"
              >
                {t('c4Cta')}
              </Link>
              {/* The guide rather than Work: this page's reader is deciding
                  whether they need anything at all, and the guide is the thing
                  that helps with that. */}
              <Link href="/work" className="btn">
                {t('c4CtaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
