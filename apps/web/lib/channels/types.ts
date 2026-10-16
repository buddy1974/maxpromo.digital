/**
 * lib/channels/types.ts
 *
 * The channel-neutral vocabulary of the conversation gateway.
 *
 * A channel adapter (WhatsApp today; Instagram, Messenger, web chat later)
 * turns its provider's payloads into these shapes and turns an outbound reply
 * back into a provider call. Nothing past the adapter knows which provider a
 * message came from — the orchestrator, the policy, the guard and the OS bridge
 * speak only this file.
 *
 * Pure: no imports with side effects, loadable by Node directly so the offline
 * proof drives the same code the route runs.
 */

export type ChannelId = 'whatsapp'

/** What a person sent, reduced to what the conversation needs. */
export type InboundKind =
  | 'text'
  | 'interactive'   // a button or list reply; `text` carries its title
  | 'voice'
  | 'image'
  | 'video'
  | 'document'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'reaction'
  | 'unsupported'

export interface ContactRef {
  /** Digits only, with country code, no '+'. Absent for username-only contacts. */
  phone?: string
  /** Business-scoped user id (Meta BSUID), when the provider gives one. */
  userId?: string
  /** The name the person set in their own profile. Unverified, display only. */
  profileName?: string
}

export interface InboundMessage {
  type: 'message'
  channel: ChannelId
  /** The business account/number the message arrived on. */
  account: string
  /** Provider message id (wamid). The idempotency key for everything downstream. */
  externalId: string
  contact: ContactRef
  kind: InboundKind
  /** The words, already length-capped. Empty for kinds that carry none. */
  text: string
  /** Provider timestamp. */
  sentAt: Date
}

/** A message the business sent from its own app (WhatsApp Business App, coexistence). */
export interface EchoMessage {
  type: 'echo'
  channel: ChannelId
  account: string
  externalId: string
  /** The customer it was sent to. */
  contact: ContactRef
  kind: InboundKind
  text: string
  sentAt: Date
}

export type DeliveryState = 'sent' | 'delivered' | 'read' | 'failed'

export interface DeliveryStatus {
  type: 'status'
  channel: ChannelId
  account: string
  /** The provider id of the message this status is about (one we sent). */
  externalId: string
  state: DeliveryState
  at: Date
  errorCode?: number
}

export type ChannelEvent = InboundMessage | EchoMessage | DeliveryStatus

/** Why a payload or part of one was not turned into an event. Counted, never echoed back. */
export interface Rejection {
  reason: string
}

export interface NormalizeResult {
  events: ChannelEvent[]
  ignored: Rejection[]
}

/* ── outbound ─────────────────────────────────────────────────────────── */

export type SendFailureKind =
  /** Outside the free-form window; only a template could be sent. */
  | 'window_closed'
  | 'rate_limited'
  /** Credential missing, expired or refused. An operator problem. */
  | 'auth'
  /** The recipient cannot receive (blocked, not on WhatsApp, unsupported id). */
  | 'recipient'
  /** Our request was malformed. A code problem. */
  | 'invalid'
  /** The provider failed on its side; it did not accept the message. */
  | 'provider_down'
  /** The request may have reached the provider and no answer came back. Never retried. */
  | 'uncertain'
  /** Refused before any network call: evidence mode, configuration, policy. */
  | 'blocked'

export type SendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; kind: SendFailureKind; retryable: boolean; code?: number; detail: string }

export interface ChannelProvider {
  readonly channel: ChannelId
  /** Send one free-form text reply. The caller has already decided it is allowed. */
  sendText(to: ContactRef, text: string): Promise<SendResult>
}
