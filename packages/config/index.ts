/**
 * @maxpromo/config
 *
 * Constants that are true for the company rather than for one application:
 * legal identity, the domain registry, and anything else every surface must
 * state identically.
 *
 * Deliberately narrow. A shared package that accumulates whatever is
 * convenient becomes a second place to look for everything, which is the
 * problem it was created to solve.
 *
 * The domain and brand registries are here rather than in `apps/web` because
 * `agents.maxpromo.digital` is served by `apps/bureau`. A registry only one
 * application could see would be the same duplication one level down.
 *
 * Domain answers "which property is this request for"; brand answers "what does
 * this product look like". They are keyed differently on purpose — a domain by
 * host, a brand by product slug — because one product can reach a visitor
 * through more than one surface.
 */

export { BUSINESS, UST_CLAUSE } from './legal.ts'

export {
  DOMAIN_REGISTRY,
  FALLBACK_DOMAIN,
  normaliseHost,
  resolveDomain,
  allDomainHosts,
  servesRoute,
  servesLocale,
  canonicalUrl,
  contactUrl,
  domainUrls,
} from './domains.ts'

export {
  BRAND_REGISTRY,
  COMPANY_BRAND,
  resolveBrand,
  findBrand,
  brandAssets,
} from './brands.ts'

export type {
  BrandEntry,
  BrandAsset,
  BrandColours,
  AssetState,
} from './brands.ts'

export type {
  DomainApp,
  DomainMode,
  DomainLocale,
  DomainEntry,
  DomainOpenGraph,
  CanonicalStrategy,
  ContactStrategy,
  RobotsPolicy,
  SitemapPolicy,
  ChromeMode,
  CtaScope,
} from './domains.ts'

export {
  ACCEPTED_RISKS,
  acceptanceFor,
  expiredAcceptances,
  blocksRelease,
} from './security.ts'

export type { AcceptedRisk, Severity } from './security.ts'
