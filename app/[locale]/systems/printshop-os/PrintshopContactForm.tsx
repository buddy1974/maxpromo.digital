/**
 * RETIRED — LANDINGENGINE CONSOLIDATION, 2026-07-26.
 *
 * This component is retired and permanently unreferenced (verified: no
 * import remains anywhere in the repository). It previously POSTed to
 * /api/contact with `organisation` and `automation` fields instead of
 * the API's required `company` / `system` fields, so every submission
 * through it always failed with HTTP 400 — see the LandingEngine
 * consolidation report. Every CTA now routes through the shared
 * /contact?system=printshop-os page instead.
 *
 * This file cannot be deleted from the connected environment (no
 * filesystem-delete permission on the device bridge — confirmed via
 * repeated `rm`/`mv` failures), so it is neutralised in place: no form,
 * no state, no API call, no field names from the old payload. The
 * no-op export exists only so a stray future import fails to render
 * something rather than crashing the build.
 */
export function PrintshopContactForm(): null {
  return null
}
