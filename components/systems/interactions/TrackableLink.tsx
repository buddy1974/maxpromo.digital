'use client'

/**
 * components/systems/interactions/TrackableLink.tsx
 *
 * Minimal client island for analytics-tracked anchor links.
 *
 * Why this exists:
 *   Cards are server components (presentation only). Adding onClick directly
 *   to a card forces the entire card into the client bundle. TrackableLink
 *   isolates the client boundary to this one small component.
 *
 * Server/client boundary contract:
 *   - Parent (server) passes `event` as a fully serializable AnalyticsEvent.
 *     All fields are primitives (string | number) — safe across the boundary.
 *   - `event.timestamp` should be passed as 0 from the server; TrackableLink
 *     always overrides it with Date.now() at actual click time.
 *   - Anchor behavior is unchanged: onClick fires analytics, browser follows href.
 */

import type { AnalyticsEvent } from '@/lib/analytics/types'
import { trackEvent } from '@/lib/analytics/track'

// =============================================================================
// TYPES
// =============================================================================

export interface TrackableLinkProps {
  /** Navigation destination — passed to the anchor href. */
  readonly href: string | undefined
  /**
   * Fully typed analytics event. Pass timestamp as 0 from the server —
   * TrackableLink replaces it with Date.now() at click time.
   */
  readonly event: AnalyticsEvent
  readonly children: React.ReactNode
  readonly className?: string
  readonly target?: string
  readonly rel?: string
  readonly 'aria-label'?: string
  readonly 'data-event-source'?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TrackableLink({
  href,
  event,
  children,
  className,
  target,
  rel,
  'aria-label': ariaLabel,
  'data-event-source': dataEventSource,
}: TrackableLinkProps) {
  return (
    <a
      href={href ?? '#'}
      className={className}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      data-event-source={dataEventSource}
      onClick={() => {
        trackEvent({ ...event, timestamp: Date.now() } as AnalyticsEvent)
      }}
    >
      {children}
    </a>
  )
}
