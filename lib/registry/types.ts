/**
 * lib/registry/types.ts
 *
 * Single type contract for all products in the Maxpromo ecosystem.
 * Registry version: 1.1  |  Schema frozen: 2026-05-19
 *
 * All registry entries in lib/registry/products.ts must satisfy ProductEntry.
 * All components and pages that consume registry data import types from here.
 * No runtime code lives in this file — types only.
 */

// =============================================================================
// ENUM TYPES
// =============================================================================

/**
 * Operational state of the product.
 * NEVER exposed on public pages — internal control only.
 * Only 'live' produces a visible LIVE badge on product cards.
 */
export type ProductStatus = 'live' | 'demo-ready' | 'beta' | 'internal'

/**
 * Product lifecycle maturity stage.
 * Internal decision signal — drives marketing priority and dashboard insights.
 *
 * mvp    → first version, proof of concept, minimal features
 * pilot  → demo-ready, being tested or presented
 * growth → multiple active demos or clients, actively refined
 * scale  → stable, repeatable, ready for broad deployment
 */
export type ProductMaturity = 'mvp' | 'pilot' | 'growth' | 'scale'

/**
 * Commercial ownership of the product.
 * Determines whether leads are generated and how they are routed.
 *
 * maxpromo → built and owned by Maxpromo; fully marketable
 * client   → built for a specific client; not independently sold
 * partner  → co-owned with revenue share; marketable with conditions
 * internal → operational tooling; never sold or publicly listed
 */
export type ProductOwner = 'maxpromo' | 'client' | 'partner' | 'internal'

/**
 * Strategic revenue track.
 *
 * commercial → active sales pipeline, marketing investment, full OS visibility
 * founder    → personal project, not commercial priority (e.g. Drive24)
 * internal   → operational infrastructure only (e.g. Maxpromo OS)
 */
export type ProductTrack = 'commercial' | 'founder' | 'internal'

/**
 * Systems page filter tab placement and homepage eligibility.
 *
 * business-system  → German SME installation products (main grid)
 * platform         → Consumer or agent networks (Drive24)
 * personal-finance → Individual app products (TaxKontrol)
 * ecosystem        → Internal Maxpromo infrastructure; NEVER shown publicly
 */
export type ProductCategory =
  | 'business-system'
  | 'platform'
  | 'personal-finance'
  | 'ecosystem'

/**
 * Public listing visibility. Governs where the product appears in grids.
 * A product with status 'internal' is always hidden regardless of this field.
 *
 * public    → visible everywhere allowed by registry rules
 * protected → gated access: password-protected, investor preview, beta staging
 * private   → direct link only; hidden from all discovery grids and listings
 * internal  → /os admin only; never rendered on any public page
 */
export type ProductVisibility = 'public' | 'protected' | 'private' | 'internal'

/**
 * Geographic market focus.
 * A product may serve multiple markets simultaneously.
 */
export type ProductMarket = 'de' | 'cm' | 'uk' | 'us' | 'global' | 'internal'

/**
 * Industry vertical.
 * Used for systems page filtering, SEO metadata, and lead routing.
 * 'infrastructure' is reserved for internal Maxpromo tools (Maxpromo OS).
 */
export type ProductIndustry =
  | 'hospitality'
  | 'trade'
  | 'healthcare'
  | 'care'
  | 'publishing'
  | 'print'
  | 'real-estate'
  | 'mobility'
  | 'finance'
  | 'beauty'
  | 'logistics'
  | 'agriculture'
  | 'education'
  | 'legal'
  | 'infrastructure'

/**
 * Visual card and landing page layout variant.
 * Governance rule VG-07.
 *
 * A → human scene RIGHT, dashboard overlay CENTER-RIGHT
 *     Used for: RestaurantOS, CareOS, PraxisOS, RealEstateOS
 * B → scene or setting LEFT, dashboard RIGHT
 *     Used for: HandwerkOS, PrintShopOS, PublishingOS, TaxKontrol
 * C → full-scene centered with side entry-point panels
 *     Used exclusively for: Drive24 and future consumer platforms
 */
export type ProductLayout = 'A' | 'B' | 'C'

/**
 * CTA rendering pattern. Governance rule Section 3.
 *
 * standard         → "View system →" + "Book free setup →"
 * platform         → custom labels; ctaPrimary and ctaSecondary are required
 * personal-finance → standard pattern for now; app-store flow deferred
 */
export type CTAType = 'standard' | 'platform' | 'personal-finance'

/**
 * Product revenue model. Null until confirmed per product.
 * Internal only — never serialised into any public API response.
 *
 * installation → one-time system installation (RestaurantOS, HandwerkOS)
 * subscription → recurring monthly revenue (future SaaS products)
 * commission   → revenue per transaction (Drive24 model)
 * licensing    → white-label or licensed deployment model
 * internal     → no external monetization (Maxpromo OS)
 * hybrid       → mixed revenue strategy (TaxKontrol: installation + subscription)
 */
export type RevenueModel =
  | 'installation'
  | 'subscription'
  | 'commission'
  | 'licensing'
  | 'internal'
  | 'hybrid'

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

/**
 * A single step in the HOW IT WORKS workflow strip.
 * Governance rule VG-10: exactly 5 steps per product.
 */
export interface WorkflowStep {
  readonly label: string
  readonly description: string
}

/**
 * Tuple of exactly 5 workflow steps.
 * TypeScript enforces the count at compile time — governance rule VG-10.
 */
export type WorkflowTuple = readonly [
  WorkflowStep,
  WorkflowStep,
  WorkflowStep,
  WorkflowStep,
  WorkflowStep,
]

/**
 * Tuple of exactly 3 benefit bullets.
 * TypeScript enforces the count at compile time — governance rule VG-09.
 */
export type BulletTuple = readonly [string, string, string]

/** A single FAQ item for the product landing page. */
export interface FaqItem {
  readonly question: string
  readonly answer: string
}

/**
 * Locale-aware string pair.
 * `de` is optional — products serving non-German markets (Drive24) may omit it.
 * The `en` value is always required as the canonical fallback.
 */
export interface LocalisedString {
  readonly en: string
  readonly de?: string
}

/**
 * Locale-aware bullet triple.
 * `de` is optional for products without a German market.
 */
export interface LocalisedBullets {
  readonly en: BulletTuple
  readonly de?: BulletTuple
}

/**
 * Locale-aware workflow tuple.
 * `de` is optional for products without a German market.
 */
export interface LocalisedWorkflow {
  readonly en: WorkflowTuple
  readonly de?: WorkflowTuple
}

/** Locale-aware FAQ list for the product landing page. */
export interface LocalisedFaq {
  readonly en: ReadonlyArray<FaqItem>
  readonly de?: ReadonlyArray<FaqItem>
}

/** A single tab in the See In Action section. imageUrl is null until screenshots are captured. */
export interface SeeInActionTab {
  readonly tab:         string
  readonly headline:    string
  readonly description: string
  readonly imageUrl:    string | null
}

/** Locale-aware See In Action tab list. */
export interface LocalisedSeeInAction {
  readonly en: ReadonlyArray<SeeInActionTab>
  readonly de?: ReadonlyArray<SeeInActionTab>
}

/**
 * A single media asset with an optional locale variant.
 * Paths are relative to /public — do not include a leading slash.
 *
 * Convention: images/systems/[slug]/[type]/[slug]-[locale].png
 * Example:    images/systems/restaurant-os/card/restaurant-os-en.png
 */
export interface LocalisedAsset {
  readonly en: string
  readonly de?: string
}

/**
 * All visual assets for a product.
 * `card` is the only field required at baseline.
 * Other asset types are populated as landing page production progresses.
 *
 * Asset type definitions:
 *   card     → landscape source card (1200×630) — used on systems page
 *   thumb    → cropped top half (800×500) — used on homepage compact grid
 *   hero     → full-width hero for the product domain landing page
 *   social   → social sharing card (1200×630, may equal card)
 *   workflow → HOW IT WORKS strip image
 */
export interface MediaAssets {
  readonly card: LocalisedAsset
  readonly thumb?: LocalisedAsset
  readonly hero?: LocalisedAsset
  readonly social?: LocalisedAsset
  readonly workflow?: LocalisedAsset
}

// =============================================================================
// PRIMARY EXPORT
// =============================================================================

export interface ProductEntry {

  // ── IDENTITY ──────────────────────────────────────────────────────────────

  /**
   * URL-safe identifier. Lowercase, hyphen-separated.
   * Must match the /products/[slug] route segment.
   * Used as the primary key across all registry lookups.
   */
  readonly slug: string

  /** Display name as shown to users. Example: 'RestaurantOS', 'HandwerkOS' */
  readonly name: string

  /**
   * Consumer-facing brand name on the product domain.
   * May differ from `name`.
   *
   * Example: name = 'CareOS', domainBrand = 'PFLEGE-CARE24'
   */
  readonly domainBrand: string

  /**
   * Branded product domain. Stored bare — no protocol prefix.
   * Example: 'restaurant-os.de' NOT 'https://restaurant-os.de'
   *
   * REQUIRED. validateRegistry() throws and the build fails if this
   * field is an empty string or contains 'http'.
   */
  readonly domain: string

  /** Systems page filter tab placement. Determines public listing eligibility. */
  readonly category: ProductCategory

  /** Commercial ownership. Determines lead generation and routing. */
  readonly owner: ProductOwner

  /**
   * Strategic track. Determines commercial pipeline inclusion
   * and marketing investment eligibility.
   */
  readonly track: ProductTrack

  // ── CLASSIFICATION ────────────────────────────────────────────────────────

  /**
   * Operational state. NEVER exposed on public pages.
   * Only 'live' produces a visible status badge on product cards.
   * All other values are invisible to the public user.
   */
  readonly status: ProductStatus

  /**
   * Product lifecycle stage. Internal signal only.
   * Used in /os/systems to indicate maturity alongside priority_score.
   */
  readonly maturity: ProductMaturity

  /**
   * Strategic commercial priority. Range: 1–100. Higher = more important.
   * Null for internal or founder-track products (no commercial scoring).
   *
   * Used to:
   *   — weight leads in /os/leads (high-priority leads surface first)
   *   — identify priority gaps in /os/analytics (high score + low lead volume)
   *
   * NOTE: snake_case intentional — mirrors the Supabase column name.
   */
  readonly priority_score: number | null

  /**
   * Homepage featured grid inclusion.
   * Only products with featured: true appear in the homepage SystemCardCompact grid.
   * Independent of status — any demo-ready product may be featured.
   */
  readonly featured: boolean

  /**
   * Public listing visibility. Governs where the product appears in grids.
   * A product with status 'internal' is always hidden regardless of this field.
   */
  readonly visibility: ProductVisibility

  // ── MARKET ────────────────────────────────────────────────────────────────

  /** Geographic markets this product actively serves. */
  readonly market: ReadonlyArray<ProductMarket>

  /**
   * Market-level priority rank. Range: 1–10 (lower = higher priority).
   * Orders products within their primary market context for rendering.
   *
   * Distinct from priority_score:
   *   priority_score = commercial pipeline weight (1–100, global)
   *   marketPriority = display ordering within a market (1–10)
   */
  readonly marketPriority: number

  /**
   * Locales for which copy is provided.
   * Example: ['de', 'en'] | ['en'] | ['fr', 'en']
   */
  readonly locales: ReadonlyArray<string>

  /** Industry vertical. Used for systems page filtering and SEO. */
  readonly industry: ProductIndustry

  // ── CONTENT ───────────────────────────────────────────────────────────────

  /**
   * Primary headline. Governance rule VG-04.
   * Pattern: 2-line contrast pair ("Orders move. Staff doesn't.")
   *       or 3-word outcome ("More time. Better care.")
   * Max 6 words total. One word takes brandColor in the rendered component.
   */
  readonly headline: LocalisedString

  /**
   * One-line subline beneath the headline. Governance rule VG-05.
   * Standard: "We automate [domain]. You focus on [purpose]."
   * Platform and personal-finance products may use alternate patterns
   * per the documented exceptions in VG-06.
   */
  readonly subline: LocalisedString

  /**
   * 1–2 sentence description for SEO meta tags and card body text.
   * Plain language. No jargon. Passes the "grandmother test".
   */
  readonly description: LocalisedString

  /**
   * Exactly 3 benefit bullets. Governance rule VG-09.
   * Short, plain, SME language. Max 6 words each.
   * TypeScript enforces the count via BulletTuple.
   */
  readonly bullets: LocalisedBullets

  /**
   * Exactly 5 HOW IT WORKS steps. Governance rule VG-10.
   * Rendered as a horizontal numbered strip.
   * TypeScript enforces the count via WorkflowTuple.
   */
  readonly workflow: LocalisedWorkflow

  /**
   * Per-product FAQ for the landing page.
   * Distinct from the site-wide FAQ in messages/{en,de}.json.
   * Optional at baseline — populated as landing pages are built.
   */
  readonly faq?: LocalisedFaq

  /**
   * See In Action tab structure. Defines module preview tabs for Phase 5 SeeInAction section.
   * imageUrl is null until screenshots are captured from the live system.
   * Optional — populated per-product as landing pages are built.
   */
  readonly seeInAction?: LocalisedSeeInAction

  // ── MEDIA ─────────────────────────────────────────────────────────────────

  /**
   * All visual assets. Paths relative to /public (no leading slash).
   * `card` is required at baseline. Other types populated during
   * landing page production per landing-pages.md tracking.
   */
  readonly media: MediaAssets

  /**
   * Brand accent hex color. Governance rule VG-02.
   * Applied to: logo mark, one headline accent word, bullet icons,
   * section dividers. NEVER used for the CTA button.
   * CTA button is always #F97316 per governance rule VG-03.
   */
  readonly brandColor: string

  /**
   * Visual layout variant. Governance rule VG-07.
   * Determines position of human scene vs dashboard overlay.
   */
  readonly layoutVariant: ProductLayout

  /**
   * Dark (#080808) background when true.
   * False only for clinical/wellness products (PraxisOS, VeterinarOS).
   * Governance rule VG-01.
   */
  readonly backgroundDark: boolean

  // ── LINKS ─────────────────────────────────────────────────────────────────

  /**
   * Live testable demo URL. May be a Vercel preview, subdomain, or domain.
   * Null if no public demo is currently accessible.
   */
  readonly demoUrl: string | null

  /**
   * Internal product page path on maxpromo.digital.
   * Always '/products/[slug]'. Stored explicitly for type-safe linking.
   */
  readonly landingUrl: string

  /**
   * Canonical product URL with protocol.
   * Example: 'https://restaurant-os.de'
   *
   * For internal products (Maxpromo OS) this is the admin path:
   * 'https://maxpromo.digital/os'
   */
  readonly systemUrl: string

  /**
   * URL for the primary booking CTA on the product card.
   * Typically '/contact?system=[contactSlug]' or '/automation-audit'.
   */
  readonly bookDemoUrl: string

  /**
   * Contact form automation field value.
   * Pre-fills the `automation` field in /api/contact submissions.
   *
   * May differ from `slug` — for example:
   *   slug = 'printshop', contactSlug = 'printshop-os'
   *
   * Used to identify which product generated a lead in the leads table.
   */
  readonly contactSlug: string

  /** Whether the demo requires login credentials to access. */
  readonly hasDemoLogin: boolean

  /**
   * Demo login credentials for products with a protected demo environment.
   * INTERNAL ONLY — surfaced in /os/systems admin view only.
   * Must never appear in any public API response or client-side bundle.
   * The /api/os/* routes are auth-protected; public routes must never read this.
   */
  readonly demoCredentials?: {
    readonly url: string
    readonly email: string
    readonly password: string
  }

  // ── CTA ───────────────────────────────────────────────────────────────────

  /**
   * CTA rendering pattern. Governance rule Section 3.
   * Determines which label defaults render on the product card and page.
   */
  readonly ctaType: CTAType

  /**
   * CTA label overrides. Null = use the default label for the ctaType.
   * Required when ctaType is 'platform' (Drive24: "Explore platform →").
   * Optional for 'standard' and 'personal-finance' types.
   */
  readonly ctaPrimary?: LocalisedString
  readonly ctaSecondary?: LocalisedString

  // ── ANALYTICS ─────────────────────────────────────────────────────────────

  /**
   * Event source identifier in tracking payloads.
   * Typically equals `slug`. Stored separately so that if `slug` is
   * ever changed (route rename), existing event data remains queryable
   * under the original eventSource without a data migration.
   */
  readonly eventSource: string

  /**
   * Whether click and conversion tracking is active for this product.
   * Internal and founder-track products may disable tracking.
   */
  readonly trackingEnabled: boolean

  // ── FUTURE ────────────────────────────────────────────────────────────────

  /**
   * Revenue model. Null until confirmed per product.
   * INTERNAL ONLY — must never be serialised into any public API response.
   * Used for internal business planning and /os dashboard revenue insights.
   */
  readonly revenueModel: RevenueModel | null
}
