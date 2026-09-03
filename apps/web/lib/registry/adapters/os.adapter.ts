/**
 * lib/registry/adapters/os.adapter.ts
 *
 * Transforms ALL PRODUCTS registry entries into the data shape the
 * /os/systems admin registry view needs.
 *
 * SECURITY: this adapter surfaces internal fields including status, maturity,
 * priority_score, visibility, owner, track, and demoCredentials.
 * It must ONLY be imported by protected /os routes.
 * Never import this adapter from any public page or API route.
 *
 * Data flow:
 *   PRODUCTS (full registry, 10 entries)
 *     → toOSRegistryRow() (transform)
 *     → OSRegistryRow (output)
 *     → SystemCardAdmin (component)
 *     → app/os/systems/page.tsx (consumer — TODO)
 *
 * TODO: future analytics  — attach lead count per product from Supabase events table
 * TODO: future tracking   — attach last-click timestamp per product
 * TODO: future permissions — filter demoCredentials by user role (OWNER only)
 * TODO: future health     — attach system_health row per product from Supabase
 */

import type {
  ProductEntry,
  ProductCategory,
  ProductTrack,
  ProductOwner,
  ProductStatus,
  ProductMaturity,
  ProductVisibility,
  ProductLayout,
  RevenueModel,
  ProductIndustry,
} from '@/lib/registry/types'
import { PRODUCTS } from '@/lib/registry/products'

// =============================================================================
// OUTPUT TYPE
// =============================================================================

/**
 * Admin registry row — all fields, including internal.
 * Surfaces everything needed for the /os/systems management table.
 *
 * SECURITY: never serialize this type into a public API response.
 * The /api/os/* routes are auth-protected; public routes must never import this.
 */
export interface OSRegistryRow {
  // ── Identity
  readonly slug: string
  readonly name: string
  readonly domainBrand: string
  readonly domain: string

  // ── Classification — ALL internal fields exposed for admin use
  readonly category: ProductCategory
  readonly track: ProductTrack
  readonly owner: ProductOwner
  readonly status: ProductStatus
  readonly maturity: ProductMaturity
  readonly visibility: ProductVisibility
  readonly priority_score: number | null
  readonly featured: boolean
  readonly revenueModel: RevenueModel | null
  readonly industry: ProductIndustry

  // ── Market
  readonly market: ReadonlyArray<string>
  readonly marketPriority: number
  readonly locales: ReadonlyArray<string>

  // ── Links
  readonly demoUrl: string | null
  readonly landingUrl: string
  readonly systemUrl: string
  readonly bookDemoUrl: string
  readonly hasDemoLogin: boolean
  /**
   * Demo credentials — OWNER role only.
   * TODO: future permissions — omit or redact when user role !== 'OWNER'
   */
  readonly demoCredentials?: {
    readonly url: string
    readonly email: string
    readonly password: string
  }

  // ── Visual
  readonly brandColor: string
  readonly layoutVariant: ProductLayout

  // ── Analytics
  readonly eventSource: string
  readonly trackingEnabled: boolean

  // ── Computed convenience flags (derived at transform time, not in registry)
  /** True when visibility === 'public'. Quick filter for public listing eligibility. */
  readonly isPublic: boolean
  /** True when track === 'commercial'. Quick filter for pipeline inclusion. */
  readonly isCommercial: boolean
  /** True when track === 'internal'. Quick filter to exclude OS itself from commercial logic. */
  readonly isInternalOnly: boolean
  /** True when track === 'founder'. Quick filter for founder-track products. */
  readonly isFounderTrack: boolean
  /** True when demoUrl is not null. Quick check before rendering "Open system" action. */
  readonly hasDemo: boolean
  /**
   * True when status === 'live'. Determines whether the LIVE badge
   * renders in the admin table (same rule as public cards).
   */
  readonly isLive: boolean
}

// =============================================================================
// TRANSFORM
// =============================================================================

/**
 * Transforms a single ProductEntry into an OSRegistryRow.
 * No locale param — the OS admin view is always in English.
 * Pure function — no side effects.
 */
export function toOSRegistryRow(product: ProductEntry): OSRegistryRow {
  return {
    // ── Identity
    slug:        product.slug,
    name:        product.name,
    domainBrand: product.domainBrand,
    domain:      product.domain,

    // ── Classification
    category:       product.category,
    track:          product.track,
    owner:          product.owner,
    status:         product.status,
    maturity:       product.maturity,
    visibility:     product.visibility,
    priority_score: product.priority_score,
    featured:       product.featured,
    revenueModel:   product.revenueModel,
    industry:       product.industry,

    // ── Market
    market:          product.market,
    marketPriority:  product.marketPriority,
    locales:         product.locales,

    // ── Links
    demoUrl:         product.demoUrl,
    landingUrl:      product.landingUrl,
    systemUrl:       product.systemUrl,
    bookDemoUrl:     product.bookDemoUrl,
    hasDemoLogin:    product.hasDemoLogin,
    demoCredentials: product.demoCredentials,

    // ── Visual
    brandColor:    product.brandColor,
    layoutVariant: product.layoutVariant,

    // ── Analytics
    eventSource:     product.eventSource,
    trackingEnabled: product.trackingEnabled,

    // ── Computed flags
    isPublic:       product.visibility === 'public',
    isCommercial:   product.track === 'commercial',
    isInternalOnly: product.track === 'internal',
    isFounderTrack: product.track === 'founder',
    hasDemo:        product.demoUrl !== null,
    isLive:         product.status === 'live',
  }
}

// =============================================================================
// GETTERS
// =============================================================================

/**
 * Returns all 10 registry rows for the /os/systems admin table.
 * Includes internal and founder-track products.
 *
 * Consumer: app/os/systems/page.tsx
 *
 * @example
 * const rows = getOSRegistry()
 */
export function getOSRegistry(): ReadonlyArray<OSRegistryRow> {
  return PRODUCTS.map(toOSRegistryRow)
}

/**
 * Returns rows filtered by track.
 * Used for tabbed views in the admin registry.
 *
 * @example
 * const commercial = getOSRegistryByTrack('commercial')
 * const founders   = getOSRegistryByTrack('founder')
 * const internal   = getOSRegistryByTrack('internal')
 */
export function getOSRegistryByTrack(
  track: ProductTrack,
): ReadonlyArray<OSRegistryRow> {
  return PRODUCTS
    .filter(p => p.track === track)
    .map(toOSRegistryRow)
}

/**
 * Returns a single registry row by slug.
 * Used when loading a product detail view in the admin.
 * Returns undefined if the slug is not in the registry.
 *
 * @example
 * const row = getOSRegistryRow('handwerk-os')
 */
export function getOSRegistryRow(slug: string): OSRegistryRow | undefined {
  const product = PRODUCTS.find(p => p.slug === slug)
  return product ? toOSRegistryRow(product) : undefined
}
