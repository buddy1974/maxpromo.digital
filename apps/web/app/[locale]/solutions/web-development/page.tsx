import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import '../solutions.css'

/**
 * app/[locale]/solutions/web-development/page.tsx
 *
 * Phase E commercial page (ADR-0016). The third capability to get a page of
 * its own, using the same argument shape as the first two.
 *
 * THE ARGUMENT, IN ORDER
 *
 * The reader arrives because their website is not pulling its weight. So the
 * page names that in operational terms rather than aesthetic ones: an enquiry
 * that has to be retyped, a question that keeps arriving because the answer is
 * in the wrong place, no difference between urgent and casual.
 *
 * Then the section that earns the page, before the catalogue rather than
 * after it: most businesses do not need a new website. They need the one they
 * have to do something. A rebuild is the most visible intervention and rarely
 * the most effective, and saying so on the page that sells rebuilds is the
 * only version a sceptical reader believes.
 *
 * Then what we build — all four items framed as the site doing work, not the
 * site looking a way. Then where people stay involved, which on this page has
 * a sharper edge than elsewhere: an automatic acknowledgement is useful, an
 * automatic reply to a complaint is not.
 *
 * WHAT IS NOT HERE, AND WHY
 *
 * No conversion percentages, no "sites like this typically see". There is no
 * measured figure this company may publish about a website it built, and
 * inventing one for a band would be the exact failure the claims registry
 * exists to catch. The proof position is built and reserved, as on the other
 * two capability pages.
 *
 * No framework names, no technology list, no "modern stack". The reader's
 * problem is that an enquiry gets retyped; which renderer produces the page is
 * not an answer to it, and leading with one is how this becomes a web agency
 * page. It is not one.
 */

const FAMILIAR = ['c3f1', 'c3f2', 'c3f3', 'c3f4', 'c3f5', 'c3f6'] as const
const BUILDS = ['c3b1', 'c3b2', 'c3b3', 'c3b4'] as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Webentwicklung' : 'Web development',
    description: isDE
      ? 'Eine Website, die einen Teil der Arbeit übernimmt: Anfragen, die ankommen, Weiterleitung nach Inhalt und Verbindung zu den Systemen, die Sie ohnehin nutzen.'
      : 'A website that does some of the work: enquiries that arrive properly, routing by what they are, and a connection to the systems you already run.',
    alternates: {
      canonical: `/${locale}/solutions/web-development`,
      languages: {
        de: '/de/solutions/web-development',
        en: '/en/solutions/web-development',
      },
    },
  }
}

export default async function WebDevelopmentPage({
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
            <p className="section-label">{t('c3Eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('c3Title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{t('c3Lede')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="familiar">
        <div className="container">
          <SectionHeader label={t('c3FamiliarEyebrow')}>{t('c3FamiliarTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-6)' }}>{t('c3FamiliarLede')}</p>
          <ul className="cp-familiar">
            {FAMILIAR.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </div>
      </section>

      {/* Before the catalogue, not after. A reader should meet "you probably do
          not need a new website" before being shown what we would build. */}
      <section className="section surface-operational" data-section="honest">
        <div className="container">
          <SectionHeader label={t('c3HonestEyebrow')}>{t('c3HonestTitle')}</SectionHeader>
          <div className="cp-honest">
            <p>{t('c3HonestBody')}</p>
            <p>{t('c3HonestClose')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="what-we-build">
        <div className="container">
          <SectionHeader label={t('c3BuildEyebrow')}>{t('c3BuildTitle')}</SectionHeader>
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
              a11yIntro={`${tCap('c3Name')}:`}
              humanLabel={isDE ? 'Mensch entscheidet' : 'Person decides'}
              steps={(tCap.raw('c3Scene') as string[]).map((label, i) => ({
                label,
                icon: (['leads', 'inbox', 'clients'] as const)[i] ?? 'system',
              }))}
            />
          </div>
        </div>
      </section>

      <section className="section-compact surface-evidence" data-section="human">
        <div className="container">
          <div className="cp-human">
            <SectionHeader label={t('c3HumanEyebrow')}>{t('c3HumanTitle')}</SectionHeader>
            <p className="cp-human-body">{t('c3HumanBody')}</p>
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
              alt={t('c3Title')}
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
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('c3CtaTitle')}</h2>
            <p className="wwd-close-body">{t('c3CtaBody')}</p>
            <div className="wwd-cta-row">
              <Link
                href="/contact?capability=web-development&source=web-development"
                className="btn btn-primary"
              >
                {t('c3Cta')}
              </Link>
              {/* The guide rather than Work: this page's reader is deciding
                  whether they need anything at all, and the guide is the thing
                  that helps with that. */}
              <Link href="/resources/what-to-automate-first" className="btn">
                {t('c3CtaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
