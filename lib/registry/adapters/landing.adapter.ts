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
  readonly workflow:     WorkflowTuple
  readonly faq:          ReadonlyArray<FaqItem> | null

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

  // CTA labels (locale-resolved)
  readonly ctaPrimary:   string
  readonly ctaSecondary: string
}

// ── Transform ──────────────────────────────────────────────────────────────────

function toLandingData(product: ProductEntry, locale: string): LandingData {
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
    workflow:      resolveWorkflow(product.workflow, locale),
    faq:           product.faq ? pickLocale(product.faq, locale) : null,
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
