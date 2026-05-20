'use client'

/**
 * components/systems/interactions/TrackableLink.tsx
 *
 * Minimal client island for analytics-tracked anchor links.
 *
 * Two modes — enforced at the type level:
 *
 *   Default (content link):
 *     children required, aria-label optional.
 *     Used for: CTA buttons, domain links, headline text links.
 *
 *   Overlay (click zone):
 *     overlay={true}, children forbidden (children?: never).
 *     Renders aria-hidden="true" — visual click zone only.
 *     Accessible navigation is provided by a sibling content link (e.g. headline).
 *     Used for: image area click zones.
 *
 * Server/client boundary contract:
 *   - Parent (server) passes static event fields — no timestamp.
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
 * Distributive Omit — removes K from each union member independently.
 * Standard Omit<A | B, K> only keeps common keys; this preserves all fields.
 */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

/** Event payload without timestamp — TrackableLink injects it at click time. */
export type TrackableEventPayload = DistributiveOmit<AnalyticsEvent, 'timestamp'>

// Shared props across both modes
interface TrackableLinkBaseProps {
  readonly href: string | undefined
  readonly event: TrackableEventPayload
  readonly className?: string
  readonly target?: string
  readonly rel?: string
  readonly 'aria-label'?: string
  readonly 'data-event-source'?: string
}

// Overlay mode — visual click zone, no content, aria-hidden
interface OverlayMode {
  readonly overlay: true
  readonly children?: never
}

// Content mode — requires visible children
interface ContentMode {
  readonly overlay?: false
  readonly children: React.ReactNode
}

export type TrackableLinkProps = TrackableLinkBaseProps & (OverlayMode | ContentMode)

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
  overlay,
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
      aria-hidden={overlay ? true : undefined}
      tabIndex={overlay ? -1 : undefined}
      data-event-source={dataEventSource}
      onClick={() => {
        trackEvent({ ...event, timestamp: Date.now() } as AnalyticsEvent)
      }}
    >
      {children}
    </a>
  )
}
