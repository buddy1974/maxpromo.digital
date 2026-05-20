/**
 * lib/analytics/track.ts
 *
 * Event dispatch layer.
 * Swap the internals here to wire any analytics provider — callers never change.
 *
 * Current state:
 *   development — collects events in window.__MP_EVENTS__, prints console.table
 *   production  — no-op until a provider is wired below
 *
 * TODO: wire Posthog — posthog.capture(event.type, { slug, source, ...properties })
 * TODO: wire Plausible — plausible(event.type, { props: { slug, source } })
 * TODO: wire /api/track — fetch('/api/track', { method: 'POST', body: JSON.stringify(event) })
 * TODO: wire Maxpromo OS insights pipeline once /api/track route exists
 */

import type { AnalyticsEvent } from './types'

// =============================================================================
// DEV INSPECTOR — window.__MP_EVENTS__
// Only active in development. Dead-code-eliminated in production builds.
// Access via browser console: window.__MP_EVENTS__
// =============================================================================

declare global {
  interface Window {
    /** Maxpromo analytics event log — development only. */
    __MP_EVENTS__?: AnalyticsEvent[]
  }
}

function collectDevEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return
  window.__MP_EVENTS__ ??= []
  window.__MP_EVENTS__.push(event)
  // Print updated log as a table after each event for quick visual inspection.
  console.table(window.__MP_EVENTS__.map(e => ({
    type:      e.type,
    slug:      e.slug,
    source:    e.source,
    locale:    e.locale,
    timestamp: new Date(e.timestamp).toISOString(),
  })))
}

// =============================================================================
// DISPATCH
// =============================================================================

/**
 * Dispatch an analytics event.
 * In development: logs to console + accumulates in window.__MP_EVENTS__
 * In production: no-op (wire a provider above)
 *
 * @example
 * trackEvent({ type: CTA_PRIMARY_CLICKED, slug: 'taxkontrol', source: 'homepage_compact',
 *              timestamp: Date.now(), locale: 'de', ctaLabel: 'System ansehen →' })
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    collectDevEvent(event)
  }
  // Production: no-op until a provider is wired above.
}
