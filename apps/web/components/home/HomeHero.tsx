import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { OperatingFlow, type FlowStage } from '@/components/ui/OperatingFlow'
import type { IconName } from '@maxpromo/ui'

/**
 * components/home/HomeHero.tsx
 *
 * The homepage hero for the content reset.
 *
 * WHAT IS KEPT
 * The approved contained-hero family, unchanged: black navigation, white
 * breathing space, a contained rounded dark panel, white breathing space after
 * it. The panel's proportions, its gutters and its radius are the ones already
 * governed in `.hero-band` / `.hero-panel`, and the flow inside it is the same
 * `OperatingFlow` primitive the platform already uses, in its `nodes`
 * presentation, with the mobile recomposition it already carries.
 *
 * WHAT CHANGED
 * The copy leads with the reader's business rather than with ours, and the
 * flow is five steps instead of seven:
 *
 *     Enquiry -> Information -> Work -> Decision -> Done
 *
 * Seven stages named the operating model. Five name what happens to a job. A
 * cold visitor should not have to decode "Business operating systems" before
 * they recognise their own week, so that phrase is not here; it belongs deeper
 * in the site where a reader has already decided to understand how we think.
 *
 * Decision carries the human-control pill, because a person approving is the
 * one part of this picture that is a promise rather than a mechanism. Done
 * carries a check, because the work being recorded is the outcome the copy
 * claims.
 *
 * The two decorative curves from the previous hero are gone with the outcome
 * node they pointed at. They were drawing the eye to a message this hero no
 * longer makes.
 */

const STAGES: readonly { key: string; icon: IconName; human?: boolean }[] = [
  { key: 'f1', icon: 'inbox' },
  { key: 'f2', icon: 'documents' },
  { key: 'f3', icon: 'agents' },
  { key: 'f4', icon: 'approvals', human: true },
  { key: 'f5', icon: 'check' },
]

export default async function HomeHero() {
  const t = await getTranslations('home.hero')

  const stages: FlowStage[] = STAGES.map((s) => ({
    name: t(s.key),
    detail: t(`${s.key}d`),
    human: s.human,
    icon: s.icon,
  }))

  return (
    <section data-section="hero" className="hero-band">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="section-label mp-hero-1">{t('eyebrow')}</p>
          <h1 className="mp-hero-2 home-hero-headline">{t('title')}</h1>
          <p className="mp-hero-3 hero-sub">{t('body1')}</p>
          <p className="mp-hero-3 hero-sub home-hero-sub-2">{t('body2')}</p>
          <div className="mp-hero-4 hero-actions">
            <Link href="/contact" className="btn btn-primary hero-cta">
              {t('ctaPrimary')}
              <span className="hero-cta-arrow" aria-hidden="true" />
            </Link>
            <Link href="/work" className="btn hero-cta hero-cta-secondary">
              {t('ctaSecondary')}
              <span className="hero-cta-arrow" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="hero-flow mp-hero-4">
          <OperatingFlow
            presentation="nodes"
            tone="dark"
            stages={stages}
            humanLabel={t('humanLabel')}
            caption={t('caption')}
            a11yIntro={t('a11yIntro')}
          />
        </div>
      </div>
    </section>
  )
}
