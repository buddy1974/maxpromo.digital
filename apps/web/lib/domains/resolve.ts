import { resolveDomain, FALLBACK_DOMAIN, type DomainEntry } from '@maxpromo/config'

/**
 * apps/web/lib/domains/resolve.ts
 *
 * This application's view of the Domain Registry.
 *
 * `lib/host/` used to hold a second host map with four fields. It is gone; the
 * registry in `@maxpromo/config` is the only one, and this module is the thin
 * layer that answers the one question `apps/web` has to ask it: which of the
 * hosts I serve is this?
 *
 * `agents.maxpromo.digital` is in the registry and is served by `apps/bureau`.
 * If DNS or a preview URL ever points it at this deployment, it must not
 * inherit a product domain's route isolation from a record this application
 * cannot honour — it falls back to the hub, which serves everything.
 */
export function resolveWebDomain(hostHeader: string | null | undefined): DomainEntry {
  const domain = resolveDomain(hostHeader)
  return domain.app === 'web' ? domain : FALLBACK_DOMAIN
}
