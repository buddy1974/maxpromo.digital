/**
 * lib/analytics/track.ts
 *
 * Event dispatch layer.
 * Swap the internals here to wire any analytics provider — callers never change.
 *
 * Current state: console.debug in development only, no side effects in production.
 *
 * TODO: wire Posthog — posthog.capture(event.type, { slug, source, ...properties })
 * TODO: wire Plausible — plausible(event.type, { props: { slug, source } })
 * TODO: wire /api/track — fetch('/api/track', { method: 'POST', body: JSON.stringify(event) })
 * TODO: wire Maxpromo OS insights pipeline once /api/track route exists
 */

import type { AnalyticsEvent } from './types'

/**
 * Dispatch an analytics event.
 *
 * @example
 * trackEvent({ type: CTA_PRIMARY_CLICKED, slug: 'taxkontrol', source: 'homepage_compact' })
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event.type, event)
  }
  // Production: no-op until a provider is wired above.
}
