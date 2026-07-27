/**
 * lib/registry/adapters/landing.adapter.ts
 *
 * Resolves a product slug + locale into a flat, render-ready LandingData shape.
 * Used by LandingEngine (showcase domains) and future bridge mode on /products/[slug].
 *
 * Data flow:
 *   PRODUCTS (registry)
 *     → getLandingData(slug, locale) (transform)
 *     → LandingData (output)
 *     → LandingEngine → section components
 *     → app/[locale]/page.tsx (showcase dispatch)
 */

import type {
  ProductEntry,
  ProductLayout,
  BulletTuple,
  WorkflowTuple,
  FaqItem,
  SeeInActionTab,
  DemoAccess,
} from '@/lib/registry/types'
import { PRODUCTS } from '@/lib/registry/products'
import {
  resolveString,
  resolveBullets,
  resolveWorkflow,
  resolveCardImage,
  resolvePrimaryLabel,
  resolveSecondaryLabel,
  pickLocale,
} from './utils'

// Re-export for convenience — consumers import from this module only
export type { ProductEntry }

// ── Output type ────────────────────────────────────────────────────────────────

/**
 * V2 final-CTA block, added 2026-07-25. Present only when a product has
 * been migrated to the registry's final* fields (see types.ts) — Marcel's
 * correction to Conversion.tsx's old generic hardcoded copy. Conversion.tsx
 * falls back to the pre-V2 generic copy + bookDemoUrl when this is null,
 * so un-migrated products (Phase D backlog) still render correctly.
 */
export interface FinalCtaData {
  readonly eyebrow:         string
  readonly heading:         string
  readonly description:     string
  readonly primaryLabel:    string
  readonly primaryUrl:      string
  readonly secondaryLabel?: string
  readonly secondaryUrl?:   string
}

export interface LandingData {
  // Identity
  readonly slug:         string
  readonly name:         string
  readonly domainBrand:  string
  readonly domain:       string

  // Resolved locale (for locale-aware section copy)
  readonly locale:       string

  // Content (locale-resolved strings)
  readonly headline:     string
  readonly subline:      string
  readonly description:  string
  readonly bullets:      BulletTuple
  /** Benefit-phrased bullets for FeatureArchitecture only. Null when the product hasn't set a distinct featureBenefits field — FeatureArchitecture.tsx resolves `featureBenefits ?? bullets` itself, matching every other optional-field fallback pattern in this file. Never used by ProductHero. */
  readonly featureBenefits: BulletTuple | null
  readonly workflow:     WorkflowTuple
  readonly faq:          ReadonlyArray<FaqItem> | null
  /** "Who it's for" one-liner (AudienceFit + hero). Null until populated per product. */
  readonly targetAudience: string | null
  /** Single truthful hero trust cue. Null until populated per product. */
  readonly trustCue:       string | null
  /** 3 short factual stats for OutcomeStrip. Null until populated per product. */
  readonly outcomeStats:   BulletTuple | null
  /** "Before" / problem framing, paired with `description` in ProblemSolution. Null until populated. */
  readonly problemStatement: string | null
  /** Module preview tabs for ProductGallery, imageUrl null per-tab until screenshots are captured. Null (not just empty) when the product has no seeInAction data at all. */
  readonly seeInAction:    ReadonlyArray<SeeInActionTab> | null
  /** Product-specific compliance callout for TrustAndSecurity (e.g. HandwerkOS's XRechnung note). Null until populated per product. */
  readonly complianceNote: string | null
  /** V2 registry-driven final CTA. Null when the product hasn't been migrated — Conversion.tsx falls back to generic copy. */
  readonly finalCta:       FinalCtaData | null
  /** Explicit demo-access model (see DemoAccess in types.ts). Null when not yet set on the registry entry — no section currently branches on this, it's forward-compatible plumbing for Onboarding/trust copy. */
  readonly demoAccess:     DemoAccess | null

  // Visual
  readonly brandColor:    string
  readonly layoutVariant: ProductLayout
  readonly backgroundDark: boolean
  readonly cardImageSrc:  string   // /public-relative path with leading slash
  /** Pain section images — leading-slash paths, maps 1:1 with bullets[]. Absent when not yet provided. */
  readonly painImages?:   readonly [string, string, string]

  // Links
  readonly demoUrl:      string | null
  readonly systemUrl:    string
  readonly bookDemoUrl:  string
  readonly contactSlug:  string
  readonly landingUrl:   string

  // CTA labels (locale-resolved) — pre-V2 fallback, see finalCta above
  readonly ctaPrimary:   string
  readonly ctaSecondary: string
}

// ── Transform ──────────────────────────────────────────────────────────────────

function toLandingData(product: ProductEntry, locale: string): LandingData {
  const finalCta: FinalCtaData | null =
    product.finalHeading && product.finalPrimaryLabel && product.finalPrimaryUrl
      ? {
          eyebrow:        product.finalEyebrow ? resolveString(product.finalEyebrow, locale) : '',
          heading:        resolveString(product.finalHeading, locale),
          description:    product.finalDescription ? resolveString(product.finalDescription, locale) : '',
          primaryLabel:   resolveString(product.finalPrimaryLabel, locale),
          primaryUrl:     product.finalPrimaryUrl,
          secondaryLabel: product.finalSecondaryLabel ? resolveString(product.finalSecondaryLabel, locale) : undefined,
          secondaryUrl:   product.finalSecondaryUrl,
        }
      : null

  return {
    slug:          product.slug,
    name:          product.name,
    domainBrand:   product.domainBrand,
    domain:        product.domain,
    locale,
    headline:      resolveString(product.headline, locale),
    subline:       resolveString(product.subline, locale),
    description:   resolveString(product.description, locale),
    bullets:       resolveBullets(product.bullets, locale),
    featureBenefits: product.featureBenefits ? resolveBullets(product.featureBenefits, locale) : null,
    workflow:      resolveWorkflow(product.workflow, locale),
    faq:           product.faq ? pickLocale(product.faq, locale) : null,
    targetAudience: product.targetAudience ? resolveString(product.targetAudience, locale) : null,
    trustCue:       product.trustCue ? resolveString(product.trustCue, locale) : null,
    outcomeStats:   product.outcomeStats ? resolveBullets(product.outcomeStats, locale) : null,
    problemStatement: product.problemStatement ? resolveString(product.problemStatement, locale) : null,
    seeInAction:    product.seeInAction ? pickLocale(product.seeInAction, locale) : null,
    complianceNote: product.complianceNote ? resolveString(product.complianceNote, locale) : null,
    finalCta,
    demoAccess:    product.demoAccess ?? null,
    brandColor:    product.brandColor,
    layoutVariant: product.layoutVariant,
    backgroundDark: product.backgroundDark,
    cardImageSrc:  `/${resolveCardImage(product, locale)}`,
    painImages:    product.media.pain
      ? [`/${product.media.pain[0]}`, `/${product.media.pain[1]}`, `/${product.media.pain[2]}`] as const
      : undefined,
    demoUrl:       product.demoUrl,
    systemUrl:     product.systemUrl,
    bookDemoUrl:   product.bookDemoUrl,
    contactSlug:   product.contactSlug,
    landingUrl:    product.landingUrl,
    ctaPrimary:    resolvePrimaryLabel(product, locale),
    ctaSecondary:  resolveSecondaryLabel(product, locale),
  }
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

/**
 * Resolves a slug + locale to LandingData.
 * Returns null when the slug is not found — caller should render 404.
 * Searches the full PRODUCTS registry (not only PUBLIC_PRODUCTS)
 * so that showcase hosts can serve any intentionally-mapped product.
 */
export function getLandingData(slug: string, locale: string): LandingData | null {
  const product = PRODUCTS.find(p => p.slug === slug)
  if (!product) return null
  return toLandingData(product, locale)
}
