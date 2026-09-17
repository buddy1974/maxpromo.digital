import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { OperatingFlow, type FlowStage } from '@/components/ui/OperatingFlow'
import type { IconName } from '@maxpromo/ui'

/**
 * components/Hero.tsx
 *
 * A reproduction of the approved hero reference, not an interpretation of it.
 *
 * Every element here is in the reference and none of it is decoration that can
 * be dropped for being decoration: the upper-right outcome message and its
 * lime node, the two architectural curves rising from the Workflows and Teams
 * area toward it, the seven discrete icon nodes, the lime route through the
 * gaps, the human-control pills attached beneath Decisions and Oversight, the
 * scroll cue centred at the foot, and the signature at the lower right. The
 * earlier pass removed several of these as "decorative" and was wrong to: they
 * are what makes the composition read as designed rather than as a row of
 * process boxes.
 *
 * WHAT THE COMPOSITION IS
 * A wide, shallow landscape panel — roughly 2.15:1 at desktop — inset on a
 * white page with the black navigation bar above it. Copy occupies the upper
 * left, the outcome message the upper right, the flow the middle band, and the
 * scroll cue and signature the foot.
 *
 * THE RULE THAT KEEPS IT HONEST
 * The panel's proportions are the specification. Internal layout problems are
 * solved by sizing the elements, never by making the panel taller. A hero that
 * grows to fit its contents is how the previous version became a tall block.
 *
 * Server component. No client JavaScript.
 */

/**
 * The seven stages, with the governed icon each one carries.
 *
 * `clients` appears twice, for Customer and for Teams. That is the reference:
 * both are groups of people and both show the same glyph. Recorded here rather
 * than silently varied, because ADR-0003 asks that a shared icon be a visible
 * decision instead of an accident.
 *
 * Two are the closest governed match rather than an exact one: Workflows takes
 * `agents` (a connected node graph) where the reference draws a hierarchy, and
 * Business record takes `system` (a stacked datastore) where the reference
 * draws a cylinder. Adding two icons to `packages/ui` would be a change
 * outside this correction's scope.
 */
const STAGES: readonly { key: string; icon: IconName; human?: boolean }[] = [
  { key: 'f1', icon: 'clients' },
  { key: 'f2', icon: 'documents' },
  { key: 'f3', icon: 'user', human: true },
  { key: 'f4', icon: 'agents' },
  { key: 'f5', icon: 'clients' },
  { key: 'f6', icon: 'system' },
  { key: 'f7', icon: 'approvals', human: true },
]

export default async function Hero() {
  const t = await getTranslations('hero')
  const tFlow = await getTranslations('flow')

  const outcome = t.raw('outcome') as string[]
  const signature = t.raw('signature') as string[]

  const stages: FlowStage[] = STAGES.map((s) => ({
    name: tFlow(`${s.key}Name`),
    detail: tFlow(`${s.key}Short`),
    human: s.human,
    icon: s.icon,
  }))

  return (
    <section data-section="hero" className="hero-band">
      <div className="hero-panel">
        {/* Two architectural curves rising from the flow toward the outcome
            node. Decorative and behind everything, so aria-hidden. They are
            stretched with preserveAspectRatio="none" because what matters is
            where their ends sit relative to the composition, not that the
            arcs stay circular; the stroke is pinned by vector-effect. */}
        <svg
          className="hero-curves"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M50 60 C 70 52, 86 34, 87 13 C 87 7, 85 3, 83 0" />
          <path d="M64 56 C 76 49, 86 30, 87 13" />
        </svg>

        <div className="hero-copy">
          <p className="section-label mp-hero-1">{t('eyebrow')}</p>
          <h1 className="mp-hero-2 hero-headline">{t('headline')}</h1>
          <p className="mp-hero-3 hero-sub">{t('sub')}</p>
          <div className="mp-hero-4 hero-actions">
            <Link href="/contact" className="btn btn-primary hero-cta">
              {t('ctaPrimary')}
              <span className="hero-cta-arrow" aria-hidden="true" />
            </Link>
            <Link href="/solutions" className="btn hero-cta hero-cta-secondary">
              {t('ctaSecondary')}
              <span className="hero-cta-arrow" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Upper right: the business outcome the flow leads to. */}
        <div className="hero-outcome mp-hero-3">
          <span className="hero-outcome-node" aria-hidden="true" />
          <p className="hero-outcome-text">
            {outcome.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <span className="hero-outcome-rule" aria-hidden="true" />
        </div>

        <div className="hero-flow mp-hero-4">
          <OperatingFlow
            presentation="nodes"
            tone="dark"
            stages={stages}
            humanLabel={tFlow('humanLabel')}
            caption={tFlow('caption')}
            a11yIntro={tFlow('a11yIntro')}
          />
        </div>

        <div className="hero-foot">
          <p className="hero-scroll" aria-hidden="true">
            <span className="hero-scroll-mouse" />
            <span className="hero-scroll-label">{t('scroll')}</span>
            <span className="hero-scroll-tail" />
          </p>
          <p className="hero-signature">
            {signature.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className="hero-signature-rule" aria-hidden="true" />
          </p>
        </div>
      </div>
    </section>
  )
}
