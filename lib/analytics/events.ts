/**
 * lib/analytics/events.ts
 *
 * Named event constants — single source of truth for event type strings.
 * Import these instead of using raw strings to prevent typos and enable
 * grep-based usage tracking across the codebase.
 *
 * TODO: future funnel tracking — group events into FUNNEL_EVENTS map
 * TODO: future Posthog — these names become Posthog event names directly
 * TODO: future Maxpromo OS insights — pipe events to /api/track route
 */

import type { CardEventType } from './types'

export const CARD_CLICKED:          CardEventType = 'card_clicked'
export const DOMAIN_CLICKED:        CardEventType = 'domain_clicked'
export const CTA_PRIMARY_CLICKED:   CardEventType = 'cta_primary_clicked'
export const CTA_SECONDARY_CLICKED: CardEventType = 'cta_secondary_clicked'
export const DEMO_STARTED:          CardEventType = 'demo_started'
