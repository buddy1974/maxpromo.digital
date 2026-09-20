import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@maxpromo/ui'
import { FlowContrast } from '@/components/capability/FlowContrast'
import { ScreenshotSlot } from '@/components/ui/ScreenshotSlot'
import '../solutions.css'

/**
 * app/[locale]/solutions/workflow-automation/page.tsx
 *
 * Phase A commercial page (ADR-0016).
 *
 * This URL already existed, served by `solutions/[slug]`, describing workflow
 * automation as one of six solution entries. It is now a page of its own at
 * the same address, so nobody's link breaks and the dynamic route no longer
 * generates this slug.
 *
 * THE ARGUMENT, IN ORDER
 * The reader arrives because something repeats. So: name the repetition in
 * their words, show that we know what it costs, then say what automation
 * actually is, because most people arrive expecting either magic or job
 * losses and it is neither. The before-and-after is the centre of the page.
 * Then the part that matters most commercially and is usually left out: the
 * decisions stay with people.
 *
 * WHAT IS NOT HERE, AND WHY
 * No percentages. There is exactly one delivered workflow system this company
 * can currently describe in public, and its figures belong on the homepage
 * and in the case studies where their source is named. A capability page that
 * invents a "70% faster" to fill a band is the thing the claims audit exists
 * to catch. The proof position is built and reserved instead.
 */

const FAMILIAR = ['c1f1', 'c1f2', 'c1f3', 'c1f4', 'c1f5', 'c1f6'] as const
const MEANS = ['c1m1', 'c1m2', 'c1m3', 'c1m4', 'c1m5'] as const

const BEFORE = [
  { key: 'c1b1', icon: 'inbox' },
  { key: 'c1b2', icon: 'message' },
  { key: 'c1b3', icon: 'documents' },
  { key: 'c1b4', icon: 'send' },
  { key: 'c1b5', icon: 'projects' },
] as const

const AFTER = [
  { key: 'c1a1', icon: 'inbox' },
  { key: 'c1a2', icon: 'agents' },
  { key: 'c1a3', icon: 'documents' },
  { key: 'c1a4', icon: 'approvals' },
  { key: 'c1a5', icon: 'system' },
] as const

/** The approval step. Index 3 of AFTER, and the only accent in the figure. */
const HUMAN_AT = 3

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Prozessautomatisierung' : 'Workflow automation',
    description: isDE
      ? 'Dieselben Angaben nicht mehr von Hand weiterreichen. Einmal erfassen, richtig weiterleiten, Arbeit vorbereiten, Ergebnis festhalten. Entscheidungen bleiben bei Menschen.'
      : 'Stop moving the same information by hand. Capture once, route correctly, prepare the work, record the outcome. Decisions stay with people.',
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/solutions/workflow-automation`,
      languages: {
        de: 'https://www.maxpromo.digital/de/solutions/workflow-automation',
        en: 'https://www.maxpromo.digital/en/solutions/workflow-automation',
      },
    },
  }
}

export default async function WorkflowAutomationPage(
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('capabilityPages')

  return (
    <>
      <section className="section-feature surface-authority">
        <div className="container">
          <p className="cp-back">
            <Link href="/solutions" className="quiet-link">{t('backToAll')}</Link>
          </p>
          <div className="sec-head sec-head-wide" style={{ marginBottom: 0 }}>
            <p className="section-label">{t('c1Eyebrow')}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>{t('c1Title')}</h1>
            <p className="sec-lede" style={{ margin: 0 }}>{t('c1Lede')}</p>
          </div>
        </div>
      </section>

      {/* Recognition first. Six situations, and the lede says plainly that not
          every business has all six, because a list that claims to describe
          everyone describes nobody. */}
      <section className="section surface-plain" data-section="familiar">
        <div className="container">
          <SectionHeader label={t('c1FamiliarEyebrow')}>{t('c1FamiliarTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-6)' }}>{t('c1FamiliarLede')}</p>
          <ul className="cp-familiar">
            {FAMILIAR.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </div>
      </section>

      {/* The definition, because "automation" arrives loaded. Five plain
          things, the last of which is that a person still decides. */}
      <section className="section surface-operational" data-section="what-it-means">
        <div className="container">
          <SectionHeader label={t('c1MeansEyebrow')}>{t('c1MeansTitle')}</SectionHeader>
          <p className="sec-lede" style={{ margin: '0 0 var(--space-6)' }}>{t('c1MeansLede')}</p>
          <ul className="cp-means">
            {MEANS.map((k, i) => (
              <li key={k} className={`cp-mean${i === MEANS.length - 1 ? ' cp-mean-human' : ''}`}>
                <h3 className="cp-mean-title">{t(`${k}Title`)}</h3>
                <p className="cp-mean-body">{t(`${k}Body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The centre of the page. */}
      <section className="section surface-plain" data-section="before-after">
        <div className="container">
          <SectionHeader label={t('c1BeforeAfterEyebrow')}>{t('c1BeforeAfterTitle')}</SectionHeader>
          <FlowContrast
            beforeLabel={t('c1BeforeLabel')}
            beforeA11y={t('c1BeforeA11y')}
            beforeSteps={BEFORE.map((s) => ({ label: t(s.key), icon: s.icon }))}
            afterLabel={t('c1AfterLabel')}
            afterA11y={t('c1AfterA11y')}
            afterSteps={AFTER.map((s) => ({ label: t(s.key), icon: s.icon }))}
            humanAt={HUMAN_AT}
          />
        </div>
      </section>

      {/* Human control, said once, where it means something. */}
      <section className="section-compact surface-evidence" data-section="human">
        <div className="container">
          <div className="cp-human">
            <SectionHeader label={t('c1HumanEyebrow')}>{t('c1HumanTitle')}</SectionHeader>
            <p className="cp-human-body">{t('c1HumanBody')}</p>
          </div>
        </div>
      </section>

      {/* The proof position, reserved rather than filled. The container, its
          ratio and the composition around it are final; the screenshot drops
          in when a client has approved what can be shown. Placeholders rule,
          docs/governance/standards.md. */}
      <section className="section surface-plain" data-section="proof">
        <div className="container">
          <div className="cp-proof">
            <ScreenshotSlot
              alt={t('c1Title')}
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
            <h2 style={{ margin: '0 0 var(--space-4)' }}>{t('c1CtaTitle')}</h2>
            <p className="wwd-close-body">{t('c1CtaBody')}</p>
            <div className="wwd-cta-row">
              <Link
                href="/contact?capability=workflow-automation&source=workflow-automation"
                className="btn btn-primary"
              >
                {t('c1Cta')}
              </Link>
              <Link href="/work" className="btn">{t('c1CtaSecondary')}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
