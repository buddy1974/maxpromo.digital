/**
 * lib/registry/types.ts
 *
 * Single type contract for all products in the Maxpromo ecosystem.
 * Registry version: 1.2  |  Last extended: 2026-07-25
 *
 * "Schema frozen: 2026-05-19" (v1.1) is retired — the schema has been
 * extended twice since, both on 2026-07-25: V2 landing-page fields
 * (targetAudience, trustCue, complianceNote, outcomeStats, problemStatement,
 * final* CTA fields) and MediaAssets future-ready fields (dashboard,
 * gallery, mobile, reports, automation, integrations, comparison). All
 * additions are optional and backward-compatible — no existing
 * ProductEntry required a change to keep satisfying the type. Do not
 * describe this schema as frozen while it is actively growing; update
 * this header instead when the next field is added.
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
   * Cross-industry business operations (AI agent staffing / process automation).
   * Added 2026-07-25 for Max Agent Bureau — a horizontal product that serves
   * every vertical rather than one, so none of the existing verticals fit.
   */
  | 'operations'

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
 * Corrected 2026-07-25 — see lib/registry/adapters/utils/cta.ts for the
 * live resolver. "View system →" / "Book free setup →" (v1.1 default) is
 * retired: it is only correct on the Maxpromo hub, where the visitor is
 * choosing which system to look at. On a product's own showcase domain
 * the visitor has already arrived, so the current defaults are:
 *
 * standard         → primary "Demo anfragen →" / "Request a demo →"
 *                     secondary "Beratung buchen →" / "Book a consultation →"
 * platform         → custom labels; ctaPrimary and ctaSecondary are required
 *                     (Drive24: "Plattform erkunden →" / "Fahrer werden →")
 * personal-finance → same defaults as standard; app-store flow deferred
 *
 * The secondary default above is a fallback for hub cards and for a
 * product with two genuinely distinct final-CTA actions. It must never
 * render as a second showcase-page button pointing at the same URL as the
 * primary — LandingEngine.tsx only shows a secondary showcase CTA when
 * the registry's finalSecondaryUrl is both present and distinct from
 * finalPrimaryUrl (CTA-duplication correction, 2026-07-25).
 */
export type CTAType = 'standard' | 'platform' | 'personal-finance'

/**
 * Explicit demo-access model. Added 2026-07-25 (RestaurantOS correction) —
 * replaces inferring "public self-service demo" from `hasDemoLogin: false`.
 * That inference was wrong: `hasDemoLogin: false` only proves no login is
 * *documented* on this entry, not that anonymous access is *verified*.
 * `demoAccess` is now the single explicit source of truth for what the
 * primary CTA should say and where it should point — see
 * `resolveDemoAccessLabel()` in lib/registry/adapters/utils/cta.ts.
 *
 * public → anonymous visitors can open and use `demoUrl` directly, no
 *          request/approval step. Only set this when the codebase or
 *          repository evidence clearly establishes anonymous access —
 *          never merely because `hasDemoLogin` is false or `demoCredentials`
 *          is absent. When in doubt, use 'guided'.
 * guided → a demo exists but access is provided during a guided review
 *          (sales call, walkthrough, temporary credentials). This is
 *          HandwerkOS's and RestaurantOS's current state.
 * none   → no usable demo is currently available (e.g. `demoUrl: null`).
 *          The CTA should ask for a consultation, not a demo.
 *
 * Optional and additive — every existing entry without this field falls
 * back to the pre-existing ctaType-based default label, unchanged.
 */
export type DemoAccess = 'public' | 'guided' | 'none'

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
 *   card         → landscape source card (1200×630) — used on systems page
 *   thumb        → cropped top half (800×500) — used on homepage compact grid
 *   hero         → full-width hero for the product domain landing page
 *   social       → social sharing card (1200×630, may equal card)
 *   workflow     → HOW IT WORKS strip image
 *   dashboard    → dashboard/overview interface screenshot
 *   gallery      → real captured interface screenshots, any count — a
 *                  future/alternate data source for ProductGallery.tsx,
 *                  not yet wired in (that component currently reads
 *                  `seeInAction`). Until either source has a real image,
 *                  ProductGallery renders nothing — "no real screenshot
 *                  means no screenshot slot" (corrected 2026-07-25).
 *   mobile       → mobile/responsive interface screenshot
 *   reports      → reporting/analytics interface screenshot
 *   automation   → automation/workflow-builder interface screenshot
 *   integrations → third-party integrations interface screenshot
 *   comparison   → before/after or competitor comparison visual
 *
 * Everything below `card` is optional and additive — adding a new field
 * never requires touching an existing ProductEntry.
 */
export interface MediaAssets {
  readonly card: LocalisedAsset
  readonly thumb?: LocalisedAsset
  readonly hero?: LocalisedAsset
  readonly social?: LocalisedAsset
  readonly workflow?: LocalisedAsset
  /** Pain section: exactly 3 image paths, relative to /public (no leading slash). Maps 1:1 with bullets[]. */
  readonly pain?: readonly [string, string, string]

  // ── V2 future-ready module visuals, added 2026-07-25 per Marcel's
  // correction (item 2, media model). All optional, all backward-
  // compatible with every existing registry entry.
  readonly dashboard?: LocalisedAsset
  readonly gallery?: ReadonlyArray<LocalisedAsset>
  readonly mobile?: LocalisedAsset
  readonly reports?: LocalisedAsset
  readonly automation?: LocalisedAsset
  readonly integrations?: LocalisedAsset
  readonly comparison?: LocalisedAsset
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
   * Max 6 words total. One word takes the product accent in the rendered
   * component — see the Brand Registry.
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
   * Exactly 3 benefit-STATEMENT bullets for FeatureArchitecture.tsx only.
   * Added 2026-07-25 (RestaurantOS correction) — `bullets` above is reused
   * by both ProductHero (works as short punchy lines, questions or
   * statements) and FeatureArchitecture (needs benefit statements, since
   * it renders them under "Time / Quality / Revenue" category headers).
   * RestaurantOS's `bullets` are phrased as rhetorical questions ("Still
   * shouting for waiters?") — correct for the hero, awkward as a "Time"
   * card. Rather than force one field to serve both shapes, this optional
   * field lets FeatureArchitecture use distinct benefit-phrased copy when
   * a product needs it. FeatureArchitecture resolves `featureBenefits ??
   * bullets` — absent = identical behaviour to before this field existed.
   * ProductHero always uses `bullets`, never this field.
   * Reuses LocalisedBullets (not a new "list" type) because
   * FeatureArchitecture hard-indexes exactly 3 entries into 3 fixed
   * category cards — the same VG-09 constraint as `bullets`.
   */
  readonly featureBenefits?: LocalisedBullets

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

  /**
   * Hero "who it is for" one-liner, and the standalone "who it is for"
   * section on the external showcase landing page.
   * Optional, added 2026-07-25 for the external landing page rebuild —
   * populated per product as each showcase page is rebuilt. Renders
   * nothing when absent (see TargetAudience.tsx).
   */
  readonly targetAudience?: LocalisedString

  /**
   * Single truthful hero trust cue (e.g. "Live demo available, no sales
   * call required"). Must be directly evidenced by other registry fields
   * (demoUrl, hasDemoLogin, etc.) — never a fabricated claim (no ratings,
   * user counts, uptime, certifications — see governance Section 7).
   * Optional, added 2026-07-25. Renders nothing when absent.
   */
  readonly trustCue?: LocalisedString

  /**
   * Optional compliance/regulatory callout for the external landing page
   * (e.g. HandwerkOS's XRechnung support). Must restate a fact already
   * present elsewhere in this product's own copy (workflow/description) —
   * this field only controls prominence, it must never introduce a new,
   * unreviewed claim. Added 2026-07-25. Renders nothing when absent.
   */
  readonly complianceNote?: LocalisedString

  /**
   * 3 short, factual, quantifiable stats for the V2 OutcomeStrip section
   * (e.g. "5 Schritte" / "5 steps"). Reuses BulletTuple's exact-3-count
   * enforcement. Must be structural or directly stated elsewhere in this
   * product's own copy — never a fabricated metric (no user counts, no
   * uptime, no ratings). Added 2026-07-25. Renders nothing when absent.
   */
  readonly outcomeStats?: LocalisedBullets

  /**
   * One-sentence "before" / problem framing for the V2 ProblemSolution
   * section, paired with `description` as the "after" / solution side.
   * Added 2026-07-25. Renders nothing when absent.
   */
  readonly problemStatement?: LocalisedString

  /**
   * V2 final-CTA (Conversion section) content, registry-driven per
   * Marcel's 2026-07-25 correction — replaces the old generic hardcoded
   * "Sehen Sie es in Ihrem Betrieb." copy. All optional; Conversion.tsx
   * falls back to the pre-V2 generic copy when a product hasn't been
   * migrated yet. CTA labels/urls must reflect real, existing actions —
   * never claim a free trial or self-serve live demo that isn't real.
   */
  readonly finalEyebrow?: LocalisedString
  readonly finalHeading?: LocalisedString
  readonly finalDescription?: LocalisedString
  readonly finalPrimaryLabel?: LocalisedString
  readonly finalPrimaryUrl?: string
  readonly finalSecondaryLabel?: LocalisedString
  readonly finalSecondaryUrl?: string

  // ── MEDIA ─────────────────────────────────────────────────────────────────

  /**
   * All visual assets. Paths relative to /public (no leading slash).
   * `card` is required at baseline. Other types populated during
   * landing page production per landing-pages.md tracking.
   */
  readonly media: MediaAssets


  /*
   * `brandColor` moved to the Brand Registry (packages/config/brands.ts) in
   * v14.0. A product's accent is identity, not content, and it sat here beside
   * the FAQ answers — where two products set it to a semantic token
   * (`var(--semantic-success)`, `var(--semantic-info)`), which the design
   * system forbids because identity and meaning must not share a namespace.
   * The adapters read it from `resolveBrand(slug).colours.accent`.
   */

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

  // ── LINKS ─────────────────────────────────────────────────────────────────

  /**
   * Live testable demo URL. May be a Vercel preview, subdomain, or domain.
   * Null if no public demo is currently accessible.
   */
  readonly demoUrl: string | null

  /**
   * Internal product page path on maxpromo.digital — the canonical
   * Hub route for this product, when it has one. Empty for protected products:
   * as of the v5.0 information-architecture move the operating systems have no
   * public page on maxpromo.digital and are reached only via their own
   * domains. Historically this was the LandingEngine bridge route,
   * '/systems/[slug]', for
   * every public product; legacy '/products/[slug]' paths (care-os,
   * real-estate-os) are permanent redirects to their /systems/[slug]
   * equivalent, not this field's value. Stored explicitly for type-safe
   * linking — see resolveSystemHref() in components/systems/SystemCard/helpers/cta.ts.
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
   * Typically '/contact?system=[contactSlug]' or '/contact'.
   */
  readonly bookDemoUrl: string

  /**
   * Contact-routing identifier. Pre-fills the `?system=` query parameter
   * on bookDemoUrl/finalPrimaryUrl, which the shared /contact page reads
   * into ContactBody.system and forwards to /api/contact — NOT an
   * `automation` field (that field name does not exist in ContactBody;
   * an earlier version of this comment was wrong and several now-retired
   * hand-authored contact forms copied that wrong field name, which is
   * why their submissions always failed — see the 2026-07-26
   * LANDINGENGINE CONSOLIDATION report). Must exactly match one of
   * KNOWN_CONTACT_SYSTEMS in app/[locale]/contact/page.tsx and the
   * corresponding messages.contact.systems.<contactSlug> translation key.
   *
   * May differ from `slug` — for example:
   *   slug = 'realestate-os', contactSlug = 'real-estate-os'
   *
   * Used to identify which product generated a lead in the leads table.
   */
  readonly contactSlug: string

  /** Whether the demo requires login credentials to access. */
  readonly hasDemoLogin: boolean

  /**
   * Explicit demo-access model — see the `DemoAccess` type doc comment
   * above for full semantics. Optional; absent = fall back to the
   * pre-existing ctaType-based CTA default (unchanged behaviour for every
   * entry that doesn't set this yet).
   */
  readonly demoAccess?: DemoAccess

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
