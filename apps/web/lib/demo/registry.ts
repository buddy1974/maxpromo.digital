/**
 * lib/demo/registry.ts
 *
 * The source of truth for private demonstrations and who may see them.
 *
 * WHY A REGISTRY AND NOT A DATABASE TABLE
 * This repository already governs its other cross-cutting facts this way —
 * the Domain Registry, the Brand Registry, the accepted-risk register — and
 * each is a file a person edits and a gate checks. A demo grant is the same
 * shape of fact: rare, deliberate, and something Marcel decides. Adding a
 * table would mean a schema change and a new writable surface to secure, in a
 * release where the owner is away and nobody can review the migration.
 *
 * Marcel grants access by adding a record here and redeploying. That is the
 * "manual approval is acceptable" path the brief asks for, and it leaves the
 * automation seam open: a later agentic workflow can generate these records
 * without any of the access logic below changing.
 *
 * NO SECRET LIVES IN THIS FILE.
 * A grant's access token is derived server-side as an HMAC of its id under
 * DEMO_ACCESS_SECRET. Nothing here is sensitive if the repository leaks, and
 * a token cannot be guessed from a grant id. See lib/demo/access.ts.
 *
 * SHIPPED EMPTY, ON PURPOSE.
 * `DEMOS` and `GRANTS` are both empty at release. The room, its access
 * control and its proof harness are real; the inventory is not populated
 * until Marcel deliberately configures it. An empty protected room is the
 * safe state, and the brief explicitly allows it.
 */

export type DemoAccessMode = 'private' | 'public-link'
export type GrantStatus = 'active' | 'expired' | 'revoked'

export interface Demo {
  /** Stable id. Referenced by grants; never reused. */
  readonly id: string
  readonly name: { readonly de: string; readonly en: string }
  readonly category: { readonly de: string; readonly en: string }
  readonly description: { readonly de: string; readonly en: string }
  /** Capability families this demonstrates, for the room's labelling. */
  readonly capabilities: readonly string[]
  readonly accessMode: DemoAccessMode
  /**
   * Where the demonstration actually lives. Never rendered to a visitor who
   * is not authorised for this demo, and never included in any payload the
   * room sends before authorisation.
   */
  readonly destination: string
}

export interface Grant {
  readonly id: string
  readonly company: string
  /** Demo ids this recipient may open. Scoped: never "all". */
  readonly demos: readonly string[]
  /** ISO date. Informational. */
  readonly issued: string
  /** ISO date. Enforced. */
  readonly expires: string
  readonly status: GrantStatus
}

/**
 * The demonstrations that exist. Empty at release.
 *
 * Nothing Maxpromo owns — RestaurantOS, PrintShopOS, TaxKontrol and the rest —
 * is listed here. They are protected products under
 * `docs/architecture/platform.md` §1 and adding them to a demo inventory is a
 * product-exposure decision, not a presentation one.
 */
export const DEMOS: readonly Demo[] = []

/**
 * Who may see what, until when. Empty at release.
 */
export const GRANTS: readonly Grant[] = []

export function getDemo(id: string): Demo | undefined {
  return DEMOS.find((d) => d.id === id)
}

export function getGrant(id: string): Grant | undefined {
  return GRANTS.find((g) => g.id === id)
}

/**
 * Whether a grant is usable right now. Expiry is enforced here rather than
 * trusted from its `status`, so a record nobody has got round to editing
 * still stops working on its own date.
 */
export function grantIsUsable(grant: Grant, now: Date = new Date()): boolean {
  if (grant.status !== 'active') return false
  const expires = Date.parse(grant.expires)
  if (Number.isNaN(expires)) return false
  return expires > now.getTime()
}

/** The demos a grant actually authorises, resolved and filtered. */
export function demosFor(grant: Grant): readonly Demo[] {
  return grant.demos.map(getDemo).filter((d): d is Demo => Boolean(d))
}

/** Whether this grant may open this specific demo. */
export function grantAuthorises(grant: Grant, demoId: string, now?: Date): boolean {
  return grantIsUsable(grant, now) && grant.demos.includes(demoId)
}
