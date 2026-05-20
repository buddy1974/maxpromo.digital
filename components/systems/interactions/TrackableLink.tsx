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
 *   - Parent (server) passes static event fields only — no timestamp.
 *   - TrackableLink stamps Date.now() at actual click time.
 *   - All event fields are primitives — fully serializable across the boundary.
 *   - Anchor behavior is unchanged: onClick fires analytics, browser follows href.
 */

import type { AnalyticsEvent } from '@/lib/analytics/types'
import { trackEvent } from '@/lib/analytics/track'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Distributive Omit — removes K from each member of a union independently.
 *
 * Standard `Omit<A | B, K>` does NOT distribute: it computes
 * `Pick<A | B, Exclude<keyof (A | B), K>>` which only keeps common keys,
 * stripping type-specific fields like `ctaLabel` or `domain`.
 *
 * Distributive version: `T extends any` triggers conditional type distribution,
 * applying `Omit` to each union member separately and preserving all fields.
 */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

/**
 * Analytics event payload without timestamp.
 * Server components pass this — TrackableLink injects timestamp at click time.
 */
export type TrackableEventPayload = DistributiveOmit<AnalyticsEvent, 'timestamp'>

export interface TrackableLinkProps {
  /** Navigation destination — passed to the anchor href. */
  readonly href: string | undefined
  /**
   * Event payload without timestamp. TrackableLink stamps Date.now() on click.
   * Server components never need to know about runtime timing.
   */
  readonly event: TrackableEventPayload
  readonly children?: React.ReactNode
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
