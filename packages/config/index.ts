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

export { BUSINESS, UST_CLAUSE, WHATSAPP_NUMBER } from './legal.ts'

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

/* The evidence environment: the mode flag, the outbound boundary and the
   marker every synthetic record carries. Here rather than in apps/web because
   the seed runner and the isolation proof both live outside that application
   and must agree with it on all three. */
/* The proof engine. Evidence is recorded once here; every published surface
   is a projection of what it and the permissions allow (ADR-0017). Exported
   from the config package rather than from an application because tooling,
   both applications and any future OpenClaw workflow read the same record. */
export {
  PROOF_PACKAGES,
  getProofPackage,
  mayPublish,
  publicStatements,
  NO_PERMISSIONS,
  OWN_SYSTEM_PERMISSIONS,
} from './proof.ts'
export type {
  ProofPackage,
  ProofStatement,
  MissingEvidence,
  MediaRequirement,
  Permissions,
  Permission,
  EvidenceBasis,
  ClaimKind,
  DemoState,
  Visibility,
  Verdict,
} from './proof.ts'

export {
  EVIDENCE_MODE_ENV,
  EVIDENCE_DB_ENV,
  PRODUCTION_DB_ENVS,
  EVIDENCE_MARKER,
  EVIDENCE_DOC_PREFIX,
  BLOCKED_OUTBOUND_HOSTS,
  ALLOWED_OUTBOUND_HOSTS,
  isEvidenceMode,
  evidenceDbProblem,
} from './evidence.ts'
