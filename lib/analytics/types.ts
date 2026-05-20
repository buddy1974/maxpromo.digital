/**
 * lib/analytics/types.ts
 *
 * Strict event payload contracts for all analytics events.
 * No implementation here — types only.
 *
 * Pattern: discriminated union.
 *   AnalyticsEvent = CardClickedEvent | DomainClickedEvent | ...
 *   Discriminant:   event.type (literal string on each concrete type)
 *
 * Adding a new event:
 *   1. Add the literal to CardEventType
 *   2. Create a new interface extending BaseEvent with readonly type: '<new-literal>'
 *   3. Add it to the AnalyticsEvent union
 *
 * TODO: future conversion attribution — add sessionId, referrer to BaseEvent
 * TODO: future funnel stages       — add funnelStep, funnelName to BaseEvent
 * TODO: future SystemAdmin dashboards — pipe AnalyticsEvent[] to /api/track
 */

// =============================================================================
// PRIMITIVES
// =============================================================================

/**
 * All surfaces that can emit analytics events.
 * Matches ProductEntry.eventSource values in the registry.
 */
export type EventSource =
  | 'homepage_compact'
  | 'systems_featured'
  | 'products_featured'
  | 'os_admin'
  | string  // open for future ad-hoc surfaces without breaking consumers

/**
 * Exhaustive list of event type discriminants.
 * Each value corresponds to exactly one concrete event interface below.
 */
export type CardEventType =
  | 'card_clicked'
  | 'domain_clicked'
  | 'cta_primary_clicked'
  | 'cta_secondary_clicked'
  | 'demo_started'
  | 'demo_submitted'        // future

// =============================================================================
// BASE EVENT
// Fields required on every event regardless of type.
// =============================================================================

export interface BaseEvent {
  /** Registry slug of the product involved. */
  readonly slug: string
  /** Surface where the event originated. */
  readonly source: EventSource
  /** Unix timestamp in milliseconds — Date.now() at the moment of dispatch. */
  readonly timestamp: number
  /** Active locale at the time of the event (en | de). */
  readonly locale: string
}

// =============================================================================
// CONCRETE EVENT CONTRACTS
// Each interface adds only the fields specific to that event type.
// =============================================================================

/** User clicked anywhere on the card surface (not a specific CTA). */
export interface CardClickedEvent extends BaseEvent {
  readonly type: 'card_clicked'
}

/** User clicked the product domain link in the card footer. */
export interface DomainClickedEvent extends BaseEvent {
  readonly type: 'domain_clicked'
  /** The domain that was clicked (e.g. "restaurant-os.maxpromo.digital"). */
  readonly domain: string
}

/** User clicked the primary CTA button. */
export interface CTAPrimaryEvent extends BaseEvent {
  readonly type: 'cta_primary_clicked'
  /** Resolved label of the button at click time (locale-aware). */
  readonly ctaLabel: string
}

/** User clicked the secondary CTA button. */
export interface CTASecondaryEvent extends BaseEvent {
  readonly type: 'cta_secondary_clicked'
  /** Resolved label of the button at click time (locale-aware). */
  readonly ctaLabel: string
}

/** User clicked a CTA that navigates to a live demo environment. */
export interface DemoStartedEvent extends BaseEvent {
  readonly type: 'demo_started'
  /** URL of the demo destination. */
  readonly destination: string
}

// =============================================================================
// UNION — the type accepted by trackEvent()
// =============================================================================

export type AnalyticsEvent =
  | CardClickedEvent
  | DomainClickedEvent
  | CTAPrimaryEvent
  | CTASecondaryEvent
  | DemoStartedEvent
