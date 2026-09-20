import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import '../solutions.css'

/**
 * app/[locale]/solutions/custom-applications/page.tsx
 *
 * Phase A commercial page (ADR-0016). A new URL: there was no page for this
 * capability before, only a section on What We Do.
 *
 * WHY THE SHAPE DIFFERS FROM THE WORKFLOW PAGE
 * They are deliberately not the same page with different words. Workflow
 * automation is about a *route*, so its centre is a before and after of how
 * work travels. Custom applications is about a *fit*, so its centre is the
 * admission that building something new is often the wrong answer. That
 * section is the most commercially useful thing on the page: a supplier who
 * will say "you do not need this" is the one worth calling.
 *
 * It also means this page carries no before-and-after figure. Drawing one
 * would imply that replacing software always improves the route, which is the
 * claim the honest section exists to refuse.
 *
 * WHAT IS NOT HERE
 * No fake dashboard. The scene is the existing process-sequence grammar
 * showing a process, an application and the people and record around it,
 * which is an architecture rather than a screenshot of software that does not
 * exist yet. The real interface capture has a reserved position below it.
 */

const FAMILIAR = ['c2f1', 'c2f2', 'c2f3', 'c2f4', 'c2f5', 'c2f6'] as const
const BUILDS = ['c2b1', 'c2b2', 'c2b3', 'c2b4'] as const

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Individuelle Anwendungen' : 'Custom applications',
    description: isDE
      ? 'Wenn Tabellen und Standardsoftware nicht mehr passen: interne Anwendungen, Portale und operative Systeme, gebaut um den Ablauf, den Ihr Betrieb wirklich hat.'
      : 'When spreadsheets and off-the-shelf software stop fitting: internal applications, portals and operational systems built around the process your business actually has.',
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/solutions/custom-applications`,
      languages: {
        de: 'https://www.maxpromo.digital/de/solutions/custom-applications',
        en: 'https://www.maxpromo.digital/en/solutions/custom-applications',
      },
    },
  }
}

export default async function CustomApplicationsPage(
  { params }: { params: Promise<{ locale: string }> },
) {
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
            <p className="section-label">{t('c2Eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('c2Title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{t('c2Lede')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="familiar">
        <div className="container">
          <SectionHeader label={t('c2FamiliarEyebrow')}>{t('c2FamiliarTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-6)' }}>{t('c2FamiliarLede')}</p>
          <ul className="cp-familiar">
            {FAMILIAR.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </div>
      </section>

      {/* The section that earns the page. Placed before "what we build" on
          purpose: a reader should meet the caveat before the catalogue, not
          after they have already been sold. */}
      <section className="section surface-operational" data-section="honest">
        <div className="container">
          <SectionHeader label={t('c2HonestEyebrow')}>{t('c2HonestTitle')}</SectionHeader>
          <div className="cp-honest">
            <p>{t('c2HonestBody')}</p>
            <p>{t('c2HonestClose')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="what-we-build">
        <div className="container">
          <SectionHeader label={t('c2BuildEyebrow')}>{t('c2BuildTitle')}</SectionHeader>
          <ul className="cp-build">
            {BUILDS.map((k) => (
              <li key={k} className="cp-build-item">
                <h3 className="cp-build-title">{t(`${k}Title`)}</h3>
                <p className="cp-build-body">{t(`${k}Body`)}</p>
              </li>
            ))}
          </ul>

          {/* The architecture, in the site's existing scene grammar: the
              process, the application built around it, and the people and the
              record on the other side. Three nodes, from lib/capabilities.ts,
              so this page and the homepage bench draw the same thing. */}
          <div className="cap-scene" style={{ marginTop: 'var(--space-8)' }}>
            <ProcessSequence
              numbered={false}
              a11yIntro={`${tCap('c2Name')}:`}
              humanLabel={isDE ? 'Mensch entscheidet' : 'Person decides'}
              steps={(tCap.raw('c2Scene') as string[]).map((label, i) => ({
                label,
                icon: (['operatingModel', 'dashboard', 'clients'] as const)[i],
              }))}
            />
          </div>
        </div>
      </section>

      <section className="section-compact surface-evidence" data-section="human">
        <div className="container">
          <div className="cp-human">
            <SectionHeader label={t('c2HumanEyebrow')}>{t('c2HumanTitle')}</SectionHeader>
            <p className="cp-human-body">{t('c2HumanBody')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="proof">
        <div className="container">
          <div className="cp-proof">
            <ScreenshotSlot
              alt={t('c2Title')}
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
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('c2CtaTitle')}</h2>
            <p className="wwd-close-body">{t('c2CtaBody')}</p>
            <div className="wwd-cta-row">
              <Link
                href="/contact?capability=custom-applications&source=custom-applications"
                className="btn btn-primary"
              >
                {t('c2Cta')}
              </Link>
              <Link href="/work" className="btn">{t('c2CtaSecondary')}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
