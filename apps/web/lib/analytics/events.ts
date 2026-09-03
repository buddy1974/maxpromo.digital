/**
 * lib/analytics/events.ts
 *
 * Named event constants — single source of truth for event type strings.
 * Import these instead of using raw strings to prevent typos and enable
 * grep-based usage tracking across the codebase.
 *
 * Constants use `as const` (not explicit CardEventType annotation) so TypeScript
 * preserves their literal type. This is required for discriminated union narrowing
 * in trackEvent() — without it TS can't match the payload shape to the event type.
 *
 * TODO: future funnel tracking — group events into FUNNEL_EVENTS map
 * TODO: future Posthog — these names become Posthog event names directly
 * TODO: future Maxpromo OS insights — pipe events to /api/track route
 */

export const CARD_CLICKED          = 'card_clicked'          as const
export const DOMAIN_CLICKED        = 'domain_clicked'        as const
export const CTA_PRIMARY_CLICKED   = 'cta_primary_clicked'   as const
export const CTA_SECONDARY_CLICKED = 'cta_secondary_clicked' as const
export const DEMO_STARTED          = 'demo_started'          as const
