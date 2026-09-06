/**
 * packages/config/domains.ts
 *
 * The Domain Registry: every public host the company operates, declared once.
 *
 * WHY THIS EXISTS
 *
 * Before v13.0 a host resolved to four facts — mode, slug, default locale and
 * whether the URL carries a locale prefix — and everything else about a domain
 * was decided somewhere downstream. That worked for the page body and failed
 * for everything else. RC1 measured the result: nine product domains emitted
 * the consultancy's <title>, the consultancy's OpenGraph card and a canonical
 * URL pointing at the consultancy; their robots.txt named the consultancy as
 * their host; all fifteen consultancy pages answered 200 on every one of them;
 * and two of them served English product copy inside German page furniture.
 *
 * None of those were separate bugs. They were one missing idea: a domain is an
 * identity, and presentation inherits from it. Where that idea is missing,
 * every surface invents its own answer, and every surface invents the same
 * wrong one — the answer that was true when there was only one site.
 *
 * So: identity first, everything else derived.
 *
 *     Host → DomainEntry → metadata, routes, languages, legal, robots, sitemap
 *
 * WHAT BELONGS HERE
 *
 * Facts that are true about a *property*: who it is, what it may serve, which
 * languages it speaks, how it identifies itself to a crawler. Company-level, so
 * it lives in the shared package and both applications read the same record —
 * `agents.maxpromo.digital` is served by `apps/bureau` and the other ten hosts
 * by `apps/web`, and a registry that only one of them could see would be the
 * same mistake one level down.
 *
 * WHAT DOES NOT BELONG HERE
 *
 * Marketing copy. A product's headline and description live once, in
 * `apps/web/lib/registry/products.ts`, and the metadata builder reads them from
 * there. Copying them into this file would create the second copy that this
 * repository's first rule exists to prevent. This registry declares *where a
 * domain's metadata comes from*, not what it says.
 *
 * Presentation. Colours, spacing and components are inherited unchanged from
 * the design system by every domain. Only identity varies.
 */

import { resolveBrand } from './brands.ts'

// ── Vocabulary ──────────────────────────────────────────────────────────────

/** Which application serves this host. */
export type DomainApp = 'web' | 'bureau'

/**
 * hub       the consultancy site
 * showcase  a protected product on its own domain
 * bureau    the Agent Bureau marketing site + dashboard
 */
export type DomainMode = 'hub' | 'showcase' | 'bureau'

export type DomainLocale = 'de' | 'en'

/**
 * self  this domain is the canonical home of its own pages
 * hub   this domain's pages are duplicates of the hub's and say so
 *
 * Declared per domain rather than assumed, because both are legitimate and the
 * wrong one is invisible. Every showcase domain is `self`: a product domain
 * that canonicalises to the consultancy is asking search engines not to show
 * it, which is what nine of them were doing.
 */
export type CanonicalStrategy = 'self' | 'hub'

/** Whether a crawler may index this property at all. */
export type RobotsPolicy = 'index' | 'noindex'

/**
 * own   this domain publishes a sitemap of its own pages
 * hub   this domain points at the hub's sitemap
 * none  nothing to submit
 */
export type SitemapPolicy = 'own' | 'hub' | 'none'

/** Which navigation and footer a domain wears. Identity, not layout. */
export type ChromeMode = 'hub' | 'product' | 'bureau'

/**
 * Where this domain's calls to action lead.
 *
 * product      a consultation about this one product
 * consultancy  the general business conversation
 */
export type CtaScope = 'product' | 'consultancy'

export interface DomainOpenGraph {
  /**
   * Where the social card lives: a path under the serving application's own
   * public directory, or an absolute URL on another registry host that serves
   * it.
   *
   * Both forms are checked against a file on disk. The absolute form exists
   * because `apps/bureau` ships no images of its own — Agent Bureau's card is
   * one of the product cards in `apps/web/public`, and og:image is resolved by
   * a crawler from a bare URL, so pointing at the copy that already exists is
   * honest where duplicating the binary into a second public directory would
   * create the second copy this repository keeps paying for.
   *
   * Since v14.0 this is derived from the Brand Registry rather than restated:
   * the card belongs to the product, and a domain is one surface the product
   * reaches a visitor through. Two declarations of one image is how the
   * hyphenation of `real-estate-os` gets right in one place and wrong in the
   * other.
   */
  readonly path: string
  /** True pixel dimensions of the asset on disk — asserted by audit-domains. */
  readonly width: number
  readonly height: number
  /**
   * Whether this is a purpose-built social card (1.91:1) or a product image
   * standing in for one. Declared so the gap is visible rather than assumed
   * away; social platforms crop a 3:2 image, they do not reject it.
   */
  readonly purposeBuilt: boolean
}

export interface DomainEntry {
  // ── Identity
  /** Normalised host: lowercase, no port, no `www.` prefix. The primary key. */
  readonly host: string
  readonly app: DomainApp
  readonly mode: DomainMode
  /** Product name as written in prose. */
  readonly product: string
  /** Wordmark as it appears in the navigation. */
  readonly brand: string
  readonly parentCompany: string
  /** Registry key in products.ts, or null for the consultancy itself. */
  readonly productSlug: string | null

  // ── Language
  readonly primaryLanguage: DomainLocale
  /**
   * Every language this domain serves. A locale outside this set is redirected
   * to the primary language, never rendered.
   *
   * This is the whole of the language governance rule. The product registry
   * falls back from German to English field by field, silently, which is how
   * publishers24.org came to serve English product copy inside German section
   * headings under `lang="de"`. A domain that does not have complete copy in a
   * language does not list that language, and the fallback can never fire.
   */
  readonly languages: readonly DomainLocale[]
  /** Whether the visible URL carries /de or /en. Hub yes; product domains no. */
  readonly useLocalePrefix: boolean

  // ── Addressing
  /** Origin this domain calls itself, including scheme and any www. */
  readonly origin: string
  readonly canonicalStrategy: CanonicalStrategy

  // ── Metadata
  /**
   * Where the title and description come from.
   *
   * product  built from this domain's entry in products.ts
   * hub      the consultancy's own page metadata
   * bureau   the Agent Bureau's own page metadata
   *
   * The text itself is not repeated here — see the file header.
   */
  readonly metadataSource: 'product' | 'hub' | 'bureau'
  /** og:site_name, and the suffix in the `%s | …` title template. */
  readonly siteName: string
  /**
   * Whether this property names Maxpromo Digital in its own page titles.
   *
   * False for every protected product: a product domain reading
   * "… | Maxpromo Digital" in the browser tab is RC1-01, and the whole reason
   * those domains exist is that the operating systems are not marketed from
   * the consultancy site.
   *
   * True for Agent Bureau, which is the one product marketed publicly from the
   * hub as well as from its own host. This records what that page already did
   * before v13.0 rather than deciding it — see the v13.0 report's business
   * decisions.
   */
  readonly parentInTitle: boolean
  readonly openGraph: DomainOpenGraph
  /**
   * Path to this domain's favicon. Eight domains currently share the company
   * mark because no product icon exists yet; audit-domains reports every one
   * that does, so the gap is counted rather than discovered later.
   */
  readonly favicon: string
  /** Whether this domain publishes a web app manifest. */
  readonly manifest: boolean

  // ── Crawling
  readonly robots: RobotsPolicy
  readonly sitemap: SitemapPolicy

  // ── Experience
  readonly navigation: ChromeMode
  readonly footer: ChromeMode
  /**
   * Path, without locale prefix, that every call to action on this domain
   * arrives at. Carries the product context the contact form reads.
   */
  readonly contactPath: string
  readonly ctaScope: CtaScope

  /**
   * Every path this domain serves, without a locale prefix. `*` means all.
   *
   * A request for a path outside this list is redirected to the same path on
   * the hub — not 404'd. The page exists and is worth reading; it just is not
   * this domain's page. Redirecting keeps inbound links alive and puts the
   * consultancy's content back on the consultancy's domain.
   */
  readonly routes: readonly string[]

  // ── Instrumentation
  /** Stable key this property reports under. Declared; not yet wired up. */
  readonly analyticsId: string
  /** Context Max is given on this domain. See ADR-0008 and RC1-08. */
  readonly chatIdentity: string
}

// ── Shared constants ────────────────────────────────────────────────────────

const PARENT = 'Maxpromo Digital'

/**
 * What a product domain serves: its product, the conversation about it, and
 * the legal pages of the company that operates it.
 *
 * Nothing else. Before v13.0 every one of these domains also served /about,
 * /solutions, /industries, /blog, /case-studies, /resources, /portfolio,
 * /agent-bureau, /automation-lab and /data-deletion — the entire consultancy
 * site, stripped of its own navigation and footer.
 */
const PRODUCT_ROUTES = ['/', '/contact', '/impressum', '/privacy'] as const

/**
 * A domain's social card and favicon, read from the product's brand.
 *
 * `purposeBuilt` is derived rather than declared: a 1.91:1 asset is a social
 * card, anything else is a product image standing in for one. Deriving it
 * means it cannot be asserted and be wrong.
 */
function brandOpenGraph(slug: string): DomainOpenGraph {
  const brand = resolveBrand(slug)
  const asset = brand.openGraphImage
  if (!asset.path || asset.width === undefined || asset.height === undefined) {
    throw new Error(`Brand Registry: ${slug} has no OpenGraph image with dimensions`)
  }
  const ratio = asset.width / asset.height
  return {
    path:         asset.path,
    width:        asset.width,
    height:       asset.height,
    purposeBuilt: Math.abs(ratio - 1200 / 630) < 0.02,
  }
}

function brandFavicon(slug: string): string {
  const path = resolveBrand(slug).favicon.path
  if (!path) throw new Error(`Brand Registry: ${slug} has no favicon`)
  return path
}

/**
 * One product domain. Everything these nine share is stated once here; what
 * differs is passed in.
 */
function productDomain(e: {
  host: string
  product: string
  brand: string
  slug: string
  primaryLanguage: DomainLocale
  languages: readonly DomainLocale[]
  origin: string
  /**
   * The `?system=` value the contact page recognises, when it differs from the
   * registry key.
   *
   * It differs for exactly one product: RealEstateOS is keyed `realestate-os`
   * and its contact slug is `real-estate-os`, a divergence recorded in
   * products.ts and easy to derive wrongly — which the first draft of this file
   * did, sending easy-immo24.de's calls to action to a `?system=` value the
   * contact page does not know, where they would have fallen back to generic
   * copy without erroring. audit-domains now checks this value against the
   * contact page's own list.
   */
  contactSlug?: string
}): DomainEntry {
  return {
    host:              e.host,
    app:               'web',
    mode:              'showcase',
    product:           e.product,
    brand:             e.brand,
    parentCompany:     PARENT,
    productSlug:       e.slug,
    primaryLanguage:   e.primaryLanguage,
    languages:         e.languages,
    useLocalePrefix:   false,
    origin:            e.origin,
    canonicalStrategy: 'self',
    metadataSource:    'product',
    siteName:          e.product,
    parentInTitle:     false,
    openGraph:         brandOpenGraph(e.slug),
    favicon:           brandFavicon(e.slug),
    manifest:          true,
    robots:            'index',
    sitemap:           'own',
    navigation:        'product',
    footer:            'product',
    contactPath:       `/contact?system=${e.contactSlug ?? e.slug}`,
    ctaScope:          'product',
    routes:            PRODUCT_ROUTES,
    analyticsId:       e.slug,
    chatIdentity:      e.slug,
  }
}

// ── The registry ────────────────────────────────────────────────────────────

export const DOMAIN_REGISTRY: readonly DomainEntry[] = [

  // ── The consultancy ───────────────────────────────────────────────────────
  {
    host:              'maxpromo.digital',
    app:               'web',
    mode:              'hub',
    product:           'Maxpromo Digital',
    brand:             'Maxpromo Digital',
    parentCompany:     PARENT,
    productSlug:       null,
    primaryLanguage:   'de',
    languages:         ['de', 'en'],
    useLocalePrefix:   true,
    origin:            'https://www.maxpromo.digital',
    canonicalStrategy: 'self',
    metadataSource:    'hub',
    siteName:          'Maxpromo Digital',
    parentInTitle:     true,
    openGraph:         brandOpenGraph('maxpromo'),
    favicon:           brandFavicon('maxpromo'),
    manifest:          true,
    robots:            'index',
    sitemap:           'own',
    navigation:        'hub',
    footer:            'hub',
    contactPath:       '/contact',
    ctaScope:          'consultancy',
    routes:            ['*'],
    analyticsId:       'maxpromo-hub',
    chatIdentity:      'hub',
  },

  // ── Agent Bureau ──────────────────────────────────────────────────────────
  // Served by apps/bureau. The one product marketed publicly from the hub as
  // well as from its own host, so its routes are its own application's.
  {
    host:              'agents.maxpromo.digital',
    app:               'bureau',
    mode:              'bureau',
    product:           'Max Agent Bureau',
    brand:             'MAX AGENT BUREAU',
    parentCompany:     PARENT,
    productSlug:       'agent-bureau',
    primaryLanguage:   'de',
    languages:         ['de'],
    useLocalePrefix:   false,
    origin:            'https://agents.maxpromo.digital',
    canonicalStrategy: 'self',
    metadataSource:    'bureau',
    siteName:          'Max Agent Bureau',
    parentInTitle:     true,
    // apps/bureau has no images of its own; the Brand Registry names the card
    // apps/web already serves, absolutely, so a crawler resolves it against
    // the host that has it. audit-domains follows the URL back to that host's
    // public directory and checks the file.
    openGraph:         brandOpenGraph('agent-bureau'),
    favicon:           brandFavicon('agent-bureau'),
    manifest:          true,
    robots:            'index',
    sitemap:           'own',
    navigation:        'bureau',
    footer:            'bureau',
    contactPath:       '/kontakt',
    ctaScope:          'product',
    routes:            ['*'],
    analyticsId:       'agent-bureau',
    chatIdentity:      'agent-bureau',
  },

  // ── Product domains, German-speaking market, complete EN/DE copy ──────────
  productDomain({
    host: 'restaurant-os.de',  product: 'RestaurantOS', brand: 'RESTAURANT OS',
    slug: 'restaurant-os',     primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.restaurant-os.de',
  }),
  productDomain({
    host: 'superhandwerk.de',  product: 'HandwerkOS',   brand: 'HANDWERK OS',
    slug: 'handwerk-os',       primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.superhandwerk.de',
  }),
  productDomain({
    host: 'super-praxis.de',   product: 'PraxisOS',     brand: 'PRAXIS OS',
    slug: 'praxis-os',         primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.super-praxis.de',
  }),
  productDomain({
    host: 'smartprintshop.de', product: 'PrintShopOS',  brand: 'PRINTSHOP OS',
    slug: 'printshop-os',      primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.smartprintshop.de',
  }),
  productDomain({
    host: 'easy-immo24.de',    product: 'RealEstateOS', brand: 'EASY-IMMO24',
    slug: 'realestate-os',     primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.easy-immo24.de',
    // The contact slug is hyphenated where the registry key is not — a known,
    // deliberate divergence recorded in products.ts. Stated explicitly rather
    // than derived, so it cannot silently miss. The card image directory is
    // hyphenated the same way and is stated once, in the Brand Registry.
    contactSlug: 'real-estate-os',
  }),
  productDomain({
    host: 'pflege-care24.de',  product: 'CareOS',       brand: 'PFLEGE-CARE24',
    slug: 'care-os',           primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.pflege-care24.de',
  }),
  productDomain({
    host: 'taxkontrol.de',     product: 'TaxKontrol',   brand: 'TaxKontrol',
    slug: 'taxkontrol',        primaryLanguage: 'de',   languages: ['de', 'en'],
    origin: 'https://www.taxkontrol.de',
  }),

  // ── Product domains, English only ─────────────────────────────────────────
  // These two list one language because they have one. PublishingOS has German
  // for 1 of its 16 localised fields and Drive24 for none, so a German route
  // could only ever have produced the mixed-language page RC1 found. The
  // missing copy is recorded in docs/governance/known-risks.md; when it is
  // written, adding 'de' here is the whole of the change.
  productDomain({
    host: 'publishers24.org',  product: 'PublishingOS', brand: 'PUBLISHERS24',
    slug: 'publishing-os',     primaryLanguage: 'en',   languages: ['en'],
    origin: 'https://www.publishers24.org',
  }),
  productDomain({
    host: 'drive24.live',      product: 'Drive24',      brand: 'DRIVE24.LIVE',
    slug: 'drive24',           primaryLanguage: 'en',   languages: ['en'],
    origin: 'https://www.drive24.live',
  }),
]

// ── Resolution ──────────────────────────────────────────────────────────────

const BY_HOST: ReadonlyMap<string, DomainEntry> = new Map(
  DOMAIN_REGISTRY.map((d) => [d.host, d]),
)

/** The entry an unrecognised host falls back to. Development, previews, direct IP. */
export const FALLBACK_DOMAIN: DomainEntry = BY_HOST.get('maxpromo.digital')!

/**
 * Normalise a raw Host header to a registry key.
 *
 * Lowercase, drop the port, drop a leading `www.`. `localhost:3020` and
 * `www.Restaurant-OS.de:443` both reduce to something the map can answer.
 */
export function normaliseHost(hostHeader: string | null | undefined): string {
  if (!hostHeader) return ''
  return hostHeader
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
}

/**
 * Resolve a Host header to its domain record.
 *
 * Unknown hosts resolve to the hub: local development (`localhost`), Vercel
 * preview deployments (`*.vercel.app`) and anything pointed at the deployment
 * by accident all behave as the consultancy site rather than as nothing.
 */
export function resolveDomain(hostHeader: string | null | undefined): DomainEntry {
  return BY_HOST.get(normaliseHost(hostHeader)) ?? FALLBACK_DOMAIN
}

/** Every host the registry knows, in declaration order. */
export function allDomainHosts(): readonly string[] {
  return DOMAIN_REGISTRY.map((d) => d.host)
}

// ── Policy helpers ──────────────────────────────────────────────────────────

/**
 * Whether this domain serves `pathname`, which must not carry a locale prefix.
 *
 * Matching is exact for `/` and prefix-based below it, so `/contact` admits
 * `/contact/danke` but `/contacts-list` is not `/contact`.
 */
export function servesRoute(domain: DomainEntry, pathname: string): boolean {
  if (domain.routes.includes('*')) return true
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return domain.routes.some((r) => (r === '/' ? path === '/' : path === r || path.startsWith(r + '/')))
}

/** Whether this domain speaks `locale`. */
export function servesLocale(domain: DomainEntry, locale: string): boolean {
  return (domain.languages as readonly string[]).includes(locale)
}

/**
 * The canonical URL for a path on this domain.
 *
 * `strategy: 'hub'` would point at the consultancy; every domain in the
 * registry is `self`, and the parameter exists so that choosing otherwise
 * would have to be written down.
 */
export function canonicalUrl(domain: DomainEntry, locale: string, pathname: string): string {
  const target = domain.canonicalStrategy === 'hub' ? FALLBACK_DOMAIN : domain
  const path = pathname === '/' ? '' : pathname
  // The hub prefixes every locale. A product domain shows no prefix for the
  // language it leads with and prefixes any second one, which is what the
  // middleware serves: restaurant-os.de/contact and restaurant-os.de/en/contact
  // are the two addresses of one page.
  const needsPrefix = target.useLocalePrefix || locale !== target.primaryLanguage
  const prefix = needsPrefix ? `/${locale}` : ''
  return `${target.origin}${prefix}${path}` || target.origin
}

/** Every public URL this domain publishes, one per supported language. */
export function domainUrls(domain: DomainEntry, paths: readonly string[]): Array<{ url: string; locale: DomainLocale; path: string }> {
  const out: Array<{ url: string; locale: DomainLocale; path: string }> = []
  for (const path of paths) {
    for (const locale of domain.languages) {
      out.push({ url: canonicalUrl(domain, locale, path), locale, path })
    }
  }
  return out
}
