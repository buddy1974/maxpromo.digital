/**
 * packages/config/brands.ts
 *
 * The Brand Registry: every product's identity and every asset that carries it,
 * declared once.
 *
 * WHY THIS EXISTS
 *
 * ADR-0008 gave every *domain* one record. This is the same move for every
 * *product*, and it exists because brand identity was scattered across four
 * places that each knew part of it:
 *
 *   products.ts          the accent colour, as `brandColor`, mixed in with
 *                        headline copy and FAQ entries
 *   domains.ts           the OpenGraph image path and the favicon, restated
 *                        per domain rather than read from the product
 *   app/layout.tsx       the company logo URL, written into JSON-LD twice
 *   lib/documents        the wordmark, as two casings of a string
 *
 * Nothing was wrong with any single one of them. What was wrong is that
 * "what does RestaurantOS look like" had no answer you could read — and two
 * products answered it with a *semantic* token (`var(--semantic-success)`,
 * `var(--semantic-info)`), which the design system forbids precisely because
 * identity and meaning must not share a namespace.
 *
 * WHAT BELONGS HERE
 *
 * Identity and the assets that carry it: names, colours, marks, social cards.
 * Facts about how a product presents itself, on any surface — web, email, PDF,
 * a social preview, an operating-system home screen.
 *
 * WHAT DOES NOT BELONG HERE
 *
 * Marketing copy. Headlines, sublines, FAQ answers and workflow descriptions
 * stay in `apps/web/lib/registry/products.ts`, localised. The `tagline` below
 * is the one exception and it is not a second copy: it is the product's
 * standing one-line identity, in English, used where a locale is not known —
 * a manifest, an asset manifest, a report.
 *
 * Layout, spacing, typography and component behaviour. Every product inherits
 * the platform's design system unchanged. Exactly two things vary per product:
 * its accent, and the assets that carry its name.
 *
 * ── ON MISSING ASSETS ──────────────────────────────────────────────────────
 *
 * Most asset slots below are `null`, and that is the point. A registry that
 * only lists what exists cannot tell you what is missing; declaring the slot
 * and leaving it empty makes the gap countable. `audit-brand-assets.mjs`
 * classifies every slot as KEEP, REPLACE, CREATE or REMOVE and reports the
 * totals on every run, so the backlog is a number rather than a memory.
 *
 * No asset here was invented. A path that is written down is a file that
 * exists, and the audit fails the build if it stops existing.
 */

// ── Vocabulary ──────────────────────────────────────────────────────────────

/**
 * Where an asset stands.
 *
 * own     this product has its own, and it is on disk
 * shared  it uses the company's, deliberately or for now
 * absent  the slot exists and nothing fills it
 * n/a     the slot does not apply to this product
 */
export type AssetState = 'own' | 'shared' | 'absent' | 'n/a'

export interface BrandAsset {
  readonly state: AssetState
  /**
   * Path under the serving application's public directory, or an absolute URL
   * on a registry host that serves it. Null whenever `state` is not `own` or
   * `shared`.
   */
  readonly path: string | null
  /** True pixel dimensions, asserted against the file by audit-brand-assets. */
  readonly width?: number
  readonly height?: number
  /** Why this slot is in the state it is in. Required when it is not `own`. */
  readonly note?: string
}

/**
 * An empty slot, with the reason it is empty.
 *
 * The audit refuses a slot that is not `own` and carries no note, because an
 * empty slot with no reason is indistinguishable from an oversight — and the
 * first draft of this file used one shared, silent constant for thirty-five of
 * them. The check caught it on its first run.
 */
const absent = (note: string): BrandAsset => ({ state: 'absent', path: null, note })

const NO_LOGO = absent(
  'CREATE — no product mark exists. Products are identified typographically ' +
  'today, which is coherent, but it leaves nothing for a favicon, an app icon ' +
  'or a partner listing.',
)
const NO_MONO_LOGO = absent(
  'CREATE — follows the logo. Needed wherever colour is unavailable: print, ' +
  'an inked letterhead band, a stamp.',
)
const NO_APPLE_ICON = absent(
  'CREATE — 180×180. Saved to an iOS home screen, a page without one gets a ' +
  'screenshot of itself.',
)
/**
 * `n/a` rather than `absent`: the internal OS has no public domain, so a social
 * card is not a backlog item. An empty slot that will never be filled should
 * not inflate the count of ones that should be.
 */
const NO_PUBLIC_SURFACE: BrandAsset = {
  state: 'n/a',
  path: null,
  note: 'This product has no public domain to be shared from.',
}

export interface BrandColours {
  /**
   * The product's accent. A FILL — the same rule the platform accent follows.
   *
   * Always a literal colour, never a token reference. Two products carried
   * `var(--semantic-success)` and `var(--semantic-info)` here, which made a
   * product's identity change if the meaning of "success" ever did, and put
   * brand and semantics in one namespace. The values below are the exact
   * colours those tokens resolved to, so nothing renders differently.
   */
  readonly accent: string
  /**
   * The accent as TEXT, at 5:1 or better on white.
   *
   * This exists because the accent is used as a text colour in two components
   * — the FAQ toggle and the onboarding step label — and four of the eleven
   * accents cannot legally be text: lime measures 1.51:1, CareOS teal 2.49:1,
   * Drive24 green 3.68:1, PrintShopOS magenta 4.25:1. The platform has had
   * exactly this rule for its own accent since v3 (`--brand-primary-text`);
   * product accents were never held to it because `check:tokens` only knew
   * about `--brand-primary`.
   *
   * Where the accent already passes it is repeated here unchanged. Where it
   * does not, the value is the accent scaled toward black — the same hue and
   * saturation, enough darker to read. Measured, not chosen.
   */
  readonly accentText: string
  /**
   * The surface a saved shortcut and a browser chrome bar take.
   *
   * White for every product: the platform is a light system and there is no
   * dark theme. Declared per product rather than assumed so that adding one
   * later is a change to data.
   */
  readonly theme: string
  /**
   * The dark-theme surface, when there is a dark theme.
   *
   * Null for every product today. The design system has one theme; a dark
   * palette is a design decision nobody has taken, and a plausible-looking
   * near-black invented here would look exactly like one that had been.
   */
  readonly themeDark: string | null
}

export interface BrandEntry {
  /** Product slug — the key shared with products.ts and the Domain Registry. */
  readonly slug: string
  /** Full product name, as written in prose. */
  readonly name: string
  /** Short name: the wordmark, and what fits on a home screen. */
  readonly shortName: string
  readonly company: string
  /** Standing one-line identity in English. See the header on copy. */
  readonly tagline: string
  /** What the product is, in one sentence. English, locale-independent. */
  readonly description: string

  readonly colours: BrandColours

  // ── Marks
  /** Full-colour mark. */
  readonly logo: BrandAsset
  /** Single-colour mark, for print, stamps and dark surfaces. */
  readonly logoMonochrome: BrandAsset
  /**
   * The wordmark.
   *
   * `state: 'own'` with a null path where the wordmark is typographic rather
   * than an image — which is every product here. The platform sets its name in
   * Inter at a defined weight and tracking; that IS the wordmark, and an image
   * of it would be a second copy that could drift from the type it imitates.
   */
  readonly wordmark: BrandAsset

  // ── Icons
  readonly favicon: BrandAsset
  readonly appleTouchIcon: BrandAsset
  readonly manifestIcons: readonly BrandAsset[]

  // ── Social
  readonly openGraphImage: BrandAsset
  readonly twitterImage: BrandAsset

  // ── Document surfaces
  readonly pdfLogo: BrandAsset
  readonly emailLogo: BrandAsset

  /**
   * Typography.
   *
   * One value for every product, and stated rather than omitted: a brand
   * registry that is silent about type invites a product to bring its own.
   * `inherit` means the platform system — Inter and Roboto Mono, from
   * @maxpromo/design-tokens. Nothing else is permitted, and audit-brand-assets
   * fails on anything else.
   */
  readonly typography: 'inherit'
}

// ── Shared values ───────────────────────────────────────────────────────────

const COMPANY = 'Maxpromo Digital'

/** Brand Lime and its accessible text form, from @maxpromo/design-tokens. */
const LIME = '#A3E635'
const LIME_TEXT = '#4D7C0F' // lime700 — 5.00:1 on white, the platform's own

const WHITE = '#FFFFFF'

/**
 * The company favicon, in each application's public directory.
 *
 * Every product uses it. That is a real gap rather than a decision, and the
 * audit counts it every run — but a shared mark is better than the browser's
 * default page icon, which is what a null here would produce.
 */
const SHARED_FAVICON = (note: string): BrandAsset => ({
  state: 'shared', path: '/favicon.ico', note,
})

const FAVICON_NOTE =
  'REPLACE — carries the company mark because no product mark exists. Every ' +
  'product domain shows the same icon in the browser tab, which is the one ' +
  'place a visitor tells one open tab from another.'

/** A wordmark set in type rather than drawn. */
const TYPOGRAPHIC_WORDMARK: BrandAsset = {
  state: 'own',
  path: null,
  note: 'Typographic: set in Inter from the design system, not an image file.',
}

/** Product card images are 1536×1024. Measured from the files. */
const CARD = { width: 1536, height: 1024 } as const

const CARD_NOTE =
  'Product card standing in for a social card. 3:2 where 1.91:1 is wanted; ' +
  'platforms crop rather than reject. REPLACE — one 1200×630 card per product.'

const DOCUMENT_MARK_NOTE =
  'Documents and email set the wordmark in type on an inked band rather than ' +
  'placing an image. Deliberate: an emailed logo is a remote image most ' +
  'clients block by default, and a blocked logo is a blank letterhead.'

/** One product's brand. Everything the eleven share is stated once. */
function product(e: {
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  accent: string
  accentText: string
  card: string | null
  cardNote?: string
}): BrandEntry {
  return {
    slug:      e.slug,
    name:      e.name,
    shortName: e.shortName,
    company:   COMPANY,
    tagline:   e.tagline,
    description: e.description,
    colours: {
      accent:     e.accent,
      accentText: e.accentText,
      theme:      WHITE,
      themeDark:  null,
    },
    logo:           NO_LOGO,
    logoMonochrome: NO_MONO_LOGO,
    wordmark:       TYPOGRAPHIC_WORDMARK,
    favicon:        SHARED_FAVICON(FAVICON_NOTE),
    appleTouchIcon: NO_APPLE_ICON,
    manifestIcons:  [SHARED_FAVICON(FAVICON_NOTE)],
    openGraphImage: e.card
      ? { state: 'own', path: e.card, ...CARD, note: e.cardNote ?? CARD_NOTE }
      : NO_PUBLIC_SURFACE,
    twitterImage: e.card
      ? { state: 'own', path: e.card, ...CARD, note: 'Same card as the OpenGraph slot, and the same 3:2 shape. ' + CARD_NOTE }
      : NO_PUBLIC_SURFACE,
    pdfLogo:   { state: 'n/a', path: null, note: DOCUMENT_MARK_NOTE },
    emailLogo: { state: 'n/a', path: null, note: DOCUMENT_MARK_NOTE },
    typography: 'inherit',
  }
}

// ── The registry ────────────────────────────────────────────────────────────

export const BRAND_REGISTRY: readonly BrandEntry[] = [

  // ── The company itself ────────────────────────────────────────────────────
  {
    slug:      'maxpromo',
    name:      COMPANY,
    shortName: 'Maxpromo',
    company:   COMPANY,
    tagline:   'Business systems, built in Essen.',
    description:
      'A software consultancy in Essen. We design and build the systems companies run on, and maintain them afterwards.',
    colours: { accent: LIME, accentText: LIME_TEXT, theme: WHITE, themeDark: null },
    logo: {
      state: 'own',
      path: '/logo.png',
      note: 'The only image mark in the platform. Used in Organization and Article JSON-LD; no component renders it.',
    },
    logoMonochrome: NO_MONO_LOGO,
    wordmark:       TYPOGRAPHIC_WORDMARK,
    favicon:        { state: 'own', path: '/favicon.ico' },
    appleTouchIcon: NO_APPLE_ICON,
    manifestIcons:  [{ state: 'own', path: '/favicon.ico' }],
    openGraphImage: { state: 'own', path: '/images/seo/maxpromo-digital-og.png', width: 1200, height: 630, note: 'Purpose-built 1.91:1 social card.' },
    twitterImage:   { state: 'own', path: '/images/seo/maxpromo-digital-og.png', width: 1200, height: 630, note: 'Purpose-built 1.91:1 social card.' },
    pdfLogo:        { state: 'n/a', path: null, note: DOCUMENT_MARK_NOTE },
    emailLogo:      { state: 'n/a', path: null, note: DOCUMENT_MARK_NOTE },
    typography: 'inherit',
  },

  // ── Agent Bureau ──────────────────────────────────────────────────────────
  {
    slug:      'agent-bureau',
    name:      'Max Agent Bureau',
    shortName: 'Max Agent Bureau',
    company:   COMPANY,
    tagline:   'A supervised AI operations team.',
    description:
      'A supervised AI operations team that runs enquiries, follow-ups and workflows. You approve; the agents execute.',
    colours: { accent: LIME, accentText: LIME_TEXT, theme: WHITE, themeDark: null },
    logo:           NO_LOGO,
    logoMonochrome: NO_MONO_LOGO,
    wordmark:       TYPOGRAPHIC_WORDMARK,
    // apps/bureau had no public directory at all until v13.0; it now carries
    // the company mark, which is the same gap the nine product domains have.
    favicon:        SHARED_FAVICON(FAVICON_NOTE),
    appleTouchIcon: NO_APPLE_ICON,
    manifestIcons:  [SHARED_FAVICON(FAVICON_NOTE)],
    openGraphImage: {
      state: 'own',
      path: 'https://www.maxpromo.digital/images/systems/agent-bureau/card/agent-bureau-de.png',
      width: 1672, height: 941,
      note: 'Absolute because apps/bureau ships no images; apps/web serves this card. ' + CARD_NOTE,
    },
    twitterImage: {
      state: 'own',
      path: 'https://www.maxpromo.digital/images/systems/agent-bureau/card/agent-bureau-de.png',
      width: 1672, height: 941,
      note: 'Same card as the OpenGraph slot, and the same 3:2 shape. ' + CARD_NOTE,
    },
    pdfLogo:   { state: 'n/a', path: null, note: DOCUMENT_MARK_NOTE },
    emailLogo: { state: 'n/a', path: null, note: DOCUMENT_MARK_NOTE },
    typography: 'inherit',
  },

  // ── The operating systems ─────────────────────────────────────────────────
  product({
    slug: 'restaurant-os', name: 'RestaurantOS', shortName: 'RestaurantOS',
    tagline: 'Orders move. Staff doesn’t.',
    description: 'QR ordering, kitchen routing, bill splitting and payments in one system for restaurants and hospitality.',
    accent: LIME, accentText: LIME_TEXT,
    card: '/images/systems/restaurant-os/card/restaurant-os-de.png',
  }),
  product({
    slug: 'handwerk-os', name: 'HandwerkOS', shortName: 'HandwerkOS',
    tagline: 'From job to invoice, without the paperwork.',
    description: 'Job dispatch, time capture and invoicing for trades businesses, with XRechnung output.',
    // Was var(--semantic-success). This is the colour that token resolves to,
    // so nothing renders differently — it simply is not a semantic token any
    // more. 5.48:1 on white, so it is its own text colour.
    accent: '#047857', accentText: '#047857',
    card: '/images/systems/handwerk-os/card/handwerk-os-de.png',
  }),
  product({
    slug: 'praxis-os', name: 'PraxisOS', shortName: 'PraxisOS',
    tagline: 'More time for patients.',
    description: 'Appointments, reminders, check-in and documentation for specialist medical practices.',
    // Was var(--semantic-info). Same colour, no longer a semantic token.
    // 6.70:1 on white.
    accent: '#1D4ED8', accentText: '#1D4ED8',
    card: '/images/systems/praxis-os/card/praxis-os-de.png',
  }),
  product({
    slug: 'printshop-os', name: 'PrintShopOS', shortName: 'PrintShopOS',
    tagline: 'Print jobs that run themselves.',
    description: 'E-commerce, AI prepress checking, a design editor and a production queue for print businesses.',
    // 4.25:1 — passes the 3:1 non-text edge, fails 4.5:1 as text.
    accent: '#EC008C', accentText: '#D7007F',
    card: '/images/systems/printshop-os/card/printshop-os-de.png',
  }),
  product({
    slug: 'care-os', name: 'CareOS', shortName: 'CareOS',
    tagline: 'One system for care providers.',
    description: 'Digital care plans, eMAR, compliance tracking and a family portal for supported-living providers.',
    // 2.49:1 — fails both thresholds.
    accent: '#14B8A6', accentText: '#0E7D71',
    card: '/images/systems/care-os/card/care-os-de.png',
  }),
  product({
    slug: 'realestate-os', name: 'RealEstateOS', shortName: 'RealEstateOS',
    tagline: 'One system for property auctions.',
    description: 'Deal analysis, investor CRM, a pipeline board and a campaign studio for property auction businesses.',
    accent: '#7C3AED', accentText: '#7C3AED',
    // The directory is hyphenated where the slug is not — a deliberate
    // divergence recorded in products.ts, stated rather than derived.
    card: '/images/systems/real-estate-os/card/real-estate-os-de.png',
  }),
  product({
    slug: 'publishing-os', name: 'PublishingOS', shortName: 'PublishingOS',
    tagline: 'One system for your publishing business.',
    description: 'Orders, stock, editorial workflow, royalties and finance for publishing companies.',
    accent: '#8B5E3C', accentText: '#8B5E3C',
    card: '/images/systems/publishing-os/card/publishing-os-en.png',
  }),
  product({
    slug: 'taxkontrol', name: 'TaxKontrol', shortName: 'TaxKontrol',
    tagline: 'Your taxes, under control.',
    description: 'Deadlines, income and expenses, quarterly views and reserve tracking for the self-employed.',
    accent: '#1E3A5F', accentText: '#1E3A5F',
    card: '/images/systems/taxkontrol/card/taxkontrol-de.png',
  }),
  product({
    slug: 'drive24', name: 'Drive24', shortName: 'Drive24',
    tagline: 'Move people. Not problems.',
    description: 'Ride booking, drivers, agents and mobile-money payments on one platform.',
    // 3.68:1 — passes the non-text edge, fails as text.
    accent: '#009A44', accentText: '#008038',
    card: '/images/systems/drive24/card/drive24-en.png',
  }),
  product({
    slug: 'maxpromo-os', name: 'Maxpromo OS', shortName: 'Maxpromo OS',
    tagline: 'The operating system Maxpromo runs on.',
    description: 'The internal business operating system: clients, invoices, quotations, jobs, leads and inbox.',
    accent: LIME, accentText: LIME_TEXT,
    // Internal, behind authentication. No public domain, so no social card.
    card: null,
  }),
]

// ── Resolution ──────────────────────────────────────────────────────────────

const BY_SLUG: ReadonlyMap<string, BrandEntry> = new Map(
  BRAND_REGISTRY.map((b) => [b.slug, b]),
)

/** The company's own brand — the fallback for anything without a product. */
export const COMPANY_BRAND: BrandEntry = BY_SLUG.get('maxpromo')!

/** The brand for a product slug, or the company brand when there is none. */
export function resolveBrand(slug: string | null | undefined): BrandEntry {
  return (slug ? BY_SLUG.get(slug) : undefined) ?? COMPANY_BRAND
}

/** Strictly: the brand for this slug, or null. For checks that must not guess. */
export function findBrand(slug: string): BrandEntry | null {
  return BY_SLUG.get(slug) ?? null
}

/** Every asset slot on a brand, flattened for auditing and reporting. */
export function brandAssets(brand: BrandEntry): Array<{ slot: string; asset: BrandAsset }> {
  return [
    { slot: 'logo',            asset: brand.logo },
    { slot: 'logoMonochrome',  asset: brand.logoMonochrome },
    { slot: 'wordmark',        asset: brand.wordmark },
    { slot: 'favicon',         asset: brand.favicon },
    { slot: 'appleTouchIcon',  asset: brand.appleTouchIcon },
    ...brand.manifestIcons.map((asset, i) => ({ slot: `manifestIcons[${i}]`, asset })),
    { slot: 'openGraphImage',  asset: brand.openGraphImage },
    { slot: 'twitterImage',    asset: brand.twitterImage },
    { slot: 'pdfLogo',         asset: brand.pdfLogo },
    { slot: 'emailLogo',       asset: brand.emailLogo },
  ]
}
