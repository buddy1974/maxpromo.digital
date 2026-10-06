import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/og'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { ProcessSequence } from '@/components/ui/ProcessSequence'
import '../solutions.css'

/**
 * app/[locale]/solutions/product-operations/page.tsx
 *
 * Phase E commercial page (ADR-0016). Same argument shape as the other four.
 *
 * THE ARGUMENT
 *
 * The reader arrives because a price change means visiting five places. The
 * page refuses the obvious framing: this is rarely a shop problem, it is a
 * question-of-ownership problem. Until it is settled which place leads for a
 * product detail, every integration moves the contradiction somewhere new and
 * harder to see. Saying that on the page that sells integrations is the only
 * version a sceptical reader believes.
 *
 * "Leading does not mean only" is doing real work in the build section. Most
 * businesses cannot consolidate onto one system and do not need to; they need
 * one place that is authoritative while the others keep running.
 *
 * WHERE PEOPLE STAY
 *
 * Prices and promises. A system may distribute details and report
 * contradictions; what something costs and when an exception is made belongs
 * to somebody who knows the customer and the margin. Automatic price changes
 * without a release are named as the convenience that ends up expensive.
 *
 * WHAT IS NOT HERE
 *
 * No named commerce platforms and no claimed integrations. The repository has
 * no evidence of a delivered integration with any specific shop, ERP or
 * accounting system, and naming one here would be claiming experience the
 * evidence registry does not support.
 */

const FAMILIAR = ['c5f1', 'c5f2', 'c5f3', 'c5f4', 'c5f5', 'c5f6'] as const
const BUILDS = ['c5b1', 'c5b2', 'c5b3', 'c5b4'] as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return pageMetadata({
    locale,
    path: '/solutions/product-operations',
    title: isDE ? 'Produkt- und Handelsabläufe' : 'Product and commerce operations',
    description: isDE
      ? 'Ein führender Ort für Produktangaben, und Kanäle, die ihm folgen. Preise und Zusagen bleiben eine menschliche Entscheidung.'
      : 'One authoritative place for product detail, and channels that follow it. Prices and promises stay a human decision.',
    family: 'capability',
  })
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
            <p className="section-label">{t('c5Eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('c5Title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{t('c5Lede')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="familiar">
        <div className="container">
          <SectionHeader label={t('c5FamiliarEyebrow')}>{t('c5FamiliarTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-6)' }}>{t('c5FamiliarLede')}</p>
          <ul className="cp-familiar">
            {FAMILIAR.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </div>
      </section>

      {/* Before the catalogue, not after. A reader should meet "you probably do
          not need a new website" before being shown what we would build. */}
      <section className="section surface-operational" data-section="honest">
        <div className="container">
          <SectionHeader label={t('c5HonestEyebrow')}>{t('c5HonestTitle')}</SectionHeader>
          <div className="cp-honest">
            <p>{t('c5HonestBody')}</p>
            <p>{t('c5HonestClose')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-plain" data-section="what-we-build">
        <div className="container">
          <SectionHeader label={t('c5BuildEyebrow')}>{t('c5BuildTitle')}</SectionHeader>
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
              a11yIntro={`${tCap('c5Name')}:`}
              humanLabel={isDE ? 'Mensch entscheidet' : 'Person decides'}
              steps={(tCap.raw('c5Scene') as string[]).map((label, i) => ({
                label,
                icon: (['system', 'documents', 'clients'] as const)[i] ?? 'system',
              }))}
            />
          </div>
        </div>
      </section>

      <section className="section-compact surface-evidence" data-section="human">
        <div className="container">
          <div className="cp-human">
            <SectionHeader label={t('c5HumanEyebrow')}>{t('c5HumanTitle')}</SectionHeader>
            <p className="cp-human-body">{t('c5HumanBody')}</p>
          </div>
        </div>
      </section>

      <section className="section surface-authority" data-section="closing">
        <div className="container">
          <div className="wwd-close-block">
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('c5CtaTitle')}</h2>
            <p className="wwd-close-body">{t('c5CtaBody')}</p>
            <div className="wwd-cta-row">
              <Link
                href="/contact?capability=product-operations&source=product-operations"
                className="btn btn-primary"
              >
                {t('c5Cta')}
              </Link>
              {/* The guide rather than Work: this page's reader is deciding
                  whether they need anything at all, and the guide is the thing
                  that helps with that. */}
              <Link href="/work" className="btn">
                {t('c5CtaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
