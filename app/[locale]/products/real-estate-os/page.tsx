import { redirect } from '@/i18n/navigation'

/**
 * RETIRED — LANDINGENGINE CONSOLIDATION, 2026-07-26.
 *
 * This file cannot be deleted from this environment: the device bridge
 * connected to this session has no filesystem-delete permission
 * (confirmed repeatedly — `rm` and cross-filesystem `mv` both fail with
 * "Operation not permitted" on every file tested, not just this one).
 * It is neutralised in place instead.
 *
 * next.config.ts's `redirects()` already sends /products/real-estate-os
 * → /systems/real-estate-os at the routing layer, before Next.js would
 * ever reach this page component — that config redirect is the
 * primary, canonical mechanism. This file is a defensive fallback only,
 * in case that config entry is ever removed or misconfigured. It
 * intentionally contains zero marketing copy, zero registry
 * duplication, and no contact form — just a locale-preserving redirect
 * using next-intl's navigation helper (auto-prefixes the current
 * locale, same as every <Link> in this codebase).
 *
 * Canonical route: /systems/real-estate-os (see that page.tsx + the
 * REAL_ESTATE_OS entry in lib/registry/products.ts for the actual
 * public content — registry `slug` there is 'realestate-os', no
 * hyphen; this route path is hyphenated to match contactSlug, see that
 * entry's Links comment for the full explanation).
 *
 * This codebase's `redirect()` (from next-intl's createNavigation)
 * requires an explicit `locale` — it does not infer it from context —
 * so `locale` is read from `params` and passed through, preserving it.
 */
export default async function LegacyRealEstateOSProductPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect({ href: '/systems/real-estate-os', locale })
}
