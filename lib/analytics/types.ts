/**
 * lib/analytics/types.ts
 *
 * Core analytics type contracts.
 * No implementation here — types only.
 */

// =============================================================================
// EVENT SOURCE
// Matches ProductEntry.eventSource values in the registry.
// =============================================================================

export type EventSource =
  | 'homepage_compact'
  | 'systems_featured'
  | 'products_featured'
  | 'os_admin'
  | string  // allows future ad-hoc sources without breaking existing consumers

// =============================================================================
// CARD EVENT TYPES
// =============================================================================

export type CardEventType =
  | 'card_clicked'
  | 'domain_clicked'
  | 'cta_primary_clicked'
  | 'cta_secondary_clicked'
  | 'demo_started'
  | 'demo_submitted'        // future

// =============================================================================
// ANALYTICS EVENT
// Envelope sent to trackEvent().
// =============================================================================

export interface AnalyticsEvent {
  /** The action that occurred. */
  readonly type: CardEventType
  /** Registry slug of the product involved. */
  readonly slug: string
  /** Surface where the event originated. */
  readonly source: EventSource
  /**
   * Freeform properties bag — keep values serialisable (string | number | boolean).
   * Used for dimensions that vary per event type (e.g. ctaLabel, demoType).
   */
  readonly properties?: Readonly<Record<string, string | number | boolean>>
}
