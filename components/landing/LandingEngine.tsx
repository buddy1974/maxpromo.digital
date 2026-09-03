import { LandingThemeProvider } from './LandingThemeProvider'
import { ProductNav }            from './sections/ProductNav'
import { ProductHero }           from './sections/ProductHero'
import { AudienceFit }           from './sections/AudienceFit'
import { OutcomeStrip }          from './sections/OutcomeStrip'
import { ProblemSolution }       from './sections/ProblemSolution'
import { WorkflowTimeline }      from './sections/WorkflowTimeline'
import { FeatureArchitecture }   from './sections/FeatureArchitecture'
import { ProductOverviewVisual } from './sections/ProductOverviewVisual'
import { ProductGallery }        from './sections/ProductGallery'
import { BeforeAfter }           from './sections/BeforeAfter'
import { UseCases }              from './sections/UseCases'
import { TrustAndSecurity }      from './sections/TrustAndSecurity'
import { Onboarding }            from './sections/Onboarding'
import { Faq }                   from './sections/Faq'
import { Conversion }            from './sections/Conversion'
import { ProductFooter }         from './sections/ProductFooter'
import type { LandingData } from '@/lib/registry/adapters/landing.adapter'

interface LandingEngineProps {
  data:    LandingData
  bridge?: boolean
}

/**
 * V2 registry-driven product showcase engine.
 *
 * The V1 engine (HeroWorld / Pain / HowItWorks / Features / InAction /
 * AIImport / Installation) was retired 2026-07-25 and its section files
 * were deleted in the v4.0 platform transformation (batch B0) — they had
 * been left on disk unused since then.
 *
 * showcase mode (bridge=false, default):
 *   Full page: nav, hero, and every content block, footer. Used on
 *   dedicated product domains (superhandwerk.de, etc.) — this is where
 *   app/[locale]/layout.tsx suppresses ALL Maxpromo chrome, so ProductNav
 *   and ProductFooter here are the page's ONLY navigation and footer.
 *
 * bridge mode (bridge=true):
 *   ProductHero + Conversion only, no nav/footer (the surrounding hub
 *   page already has Navbar/Footer via layout.tsx). Used on
 *   maxpromo.digital/products/[slug] as a compact product summary card.
 *   Conversion's secondary CTA points to the product's own domain in
 *   this mode — see Conversion.tsx's bridge-specific branch.
 *
 * Every block below is registry-driven and renders nothing when its
 * backing data is absent (progressive per-product rollout — HandwerkOS
 * is the only product with targetAudience/trustCue/outcomeStats/
 * problemStatement/finalCta populated as of this pilot; the other 5
 * showcase products fall back to pre-V2 defaults where applicable and
 * simply omit AudienceFit/OutcomeStrip/UseCases where the data doesn't
 * exist yet, rather than rendering a weak or invented placeholder).
 *
 * ProductOverviewVisual vs ProductGallery, split 2026-07-25 (Marcel's V2
 * review, item 1): V1 of this split let the marketing card image stand in
 * for a "gallery" with a "more screens coming soon" caption — exactly the
 * fake-interface-tour pattern the original brief banned. Now:
 *   ProductOverviewVisual — always renders (every product has `media.card`
 *     at baseline), honestly labelled as a marketing/overview visual, no
 *     screenshot or gallery language, no future-promise copy.
 *   ProductGallery — renders ONLY when at least one `seeInAction` tab has
 *     a real, non-null imageUrl. Empty/no-screenshots state is `null`, not
 *     an empty frame or a placeholder message.
 *
 * Visual-polish pass, 2026-07-25 (Marcel — HandwerkOS as the V2 Showcase
 * Baseline): every child section below now sources its spacing/radius/
 * typography/button styling from components/landing/showcaseTokens.ts
 * instead of one-off inline values. FeatureArchitecture dropped an
 * unsupported "runs without failure" claim; TrustAndSecurity's heading no
 * longer contradicts Onboarding's hosting copy; WorkflowTimeline/
 * OutcomeStrip/TrustAndSecurity/Onboarding grids no longer jump straight
 * to their max column count at 640px. LandingEngine.tsx itself has no
 * functional changes this pass — every fix lives in the child components.
 *
 * RestaurantOS correction pass, 2026-07-25 (Marcel): one functional change
 * here — FeatureArchitecture now also receives `data.featureBenefits`
 * (null-safe, resolves to `bullets` inside the component when absent).
 * `data.demoAccess` is also now available on LandingData but not yet
 * consumed by any section here — forward-compatible plumbing for the
 * explicit demo-access model (see DemoAccess in lib/registry/types.ts),
 * which currently drives CTA copy at the registry-authoring layer via
 * resolveDemoAccessLabel() in cta.ts.
 */
export function LandingEngine({ data, bridge = false }: LandingEngineProps) {
  const ctaPrimaryLabel = data.finalCta?.primaryLabel ?? data.ctaPrimary
  const ctaPrimaryHref  = data.finalCta?.primaryUrl   ?? data.bookDemoUrl

  // Secondary CTA correction, 2026-07-25 (Marcel's V2 review, item 3): a
  // secondary button is only real when the registry defines a genuinely
  // distinct action AND URL. The old logic fell back to the generic
  // ctaSecondary/bookDemoUrl pair whenever finalCta was absent or partial
  // — which produced two different-looking buttons ("Demo anfragen" /
  // "Beratung buchen") pointing at the exact same contact-form URL. A
  // product with no migrated finalCta (or a migrated one with no distinct
  // secondary — HandwerkOS as of this correction) now shows ONE CTA,
  // consistently in both ProductHero and Conversion, until a real second
  // action exists.
  const hasDistinctSecondary =
    !!data.finalCta?.secondaryLabel &&
    !!data.finalCta?.secondaryUrl &&
    data.finalCta.secondaryUrl !== ctaPrimaryHref
  const ctaSecondaryLabel = hasDistinctSecondary ? data.finalCta!.secondaryLabel! : null
  const ctaSecondaryHref  = hasDistinctSecondary ? data.finalCta!.secondaryUrl!   : null

  return (
    <LandingThemeProvider brandColor={data.brandColor} backgroundDark={data.backgroundDark}>

      {!bridge && (
        <ProductNav
          domainBrand={data.domainBrand}
          domain={data.domain}
          ctaLabel={ctaPrimaryLabel}
          ctaHref={ctaPrimaryHref}
        />
      )}

      <ProductHero
        domainBrand={data.domainBrand}
        headline={data.headline}
        subline={data.subline}
        bullets={data.bullets}
        cardImageSrc={data.cardImageSrc}
        targetAudience={data.targetAudience}
        trustCue={data.trustCue}
        ctaPrimaryLabel={ctaPrimaryLabel}
        ctaPrimaryHref={ctaPrimaryHref}
        ctaSecondaryLabel={ctaSecondaryLabel}
        ctaSecondaryHref={ctaSecondaryHref}
        locale={data.locale}
      />

      {!bridge && (
        <AudienceFit
          targetAudience={data.targetAudience}
          problemStatement={data.problemStatement}
          locale={data.locale}
        />
      )}

      {!bridge && <OutcomeStrip outcomeStats={data.outcomeStats} />}

      {!bridge && (
        <ProblemSolution
          problemStatement={data.problemStatement}
          description={data.description}
          domainBrand={data.domainBrand}
          painImages={data.painImages}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <WorkflowTimeline
          workflow={data.workflow}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <FeatureArchitecture
          bullets={data.bullets}
          featureBenefits={data.featureBenefits}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <ProductOverviewVisual
          cardImageSrc={data.cardImageSrc}
          domainBrand={data.domainBrand}
          locale={data.locale}
        />
      )}

      {/* Renders nothing until at least one seeInAction tab has a real imageUrl. */}
      {!bridge && (
        <ProductGallery
          seeInAction={data.seeInAction}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <BeforeAfter
          bullets={data.bullets}
          problemStatement={data.problemStatement}
          lastStep={data.workflow[4]}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <UseCases
          seeInAction={data.seeInAction}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <TrustAndSecurity
          complianceNote={data.complianceNote}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <Onboarding
          locale={data.locale}
          contactHref={data.bookDemoUrl}
        />
      )}

      {/* Faq: show only when data exists and not in bridge mode */}
      {!bridge && data.faq && data.faq.length > 0 && (
        <Faq
          faq={data.faq}
          locale={data.locale}
        />
      )}

      <Conversion
        name={data.name}
        bookDemoUrl={data.bookDemoUrl}
        domain={data.domain}
        ctaPrimary={data.ctaPrimary}
        locale={data.locale}
        bridge={bridge}
        finalCta={data.finalCta}
      />

      {!bridge && (
        <ProductFooter
          domainBrand={data.domainBrand}
          locale={data.locale}
          contactHref={data.bookDemoUrl}
        />
      )}

    </LandingThemeProvider>
  )
}
