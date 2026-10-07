/**
 * lib/commercial/types.ts
 *
 * The capability contract between the OS and every interface that drives it:
 * the agent API today, the OS screens and other clients later. A capability
 * is business behaviour with a declared risk; an interface decides how to ask
 * for it, never what it does.
 */

import type { getDb } from '@/lib/db'
import type { Validator } from './validate'

export type Sql = ReturnType<typeof getDb>

/** GREEN runs. AMBER is prepared, shown, confirmed, then executed once. RED is never offered. */
export type Risk = 'GREEN' | 'AMBER' | 'RED'

export const INTENT_FAMILIES = [
  'RESEARCH', 'CRM', 'LEAD', 'OUTREACH', 'FOLLOW_UP', 'PIPELINE', 'PROPOSAL', 'INVOICE',
  'PAYMENT', 'PROJECT', 'TASK', 'SUPPORT', 'EMAIL', 'FILES', 'DEVELOPMENT', 'DEPLOYMENT',
  'INFRASTRUCTURE', 'DOMAIN', 'MONITORING', 'REPORTING', 'FINANCE', 'BUSINESS_STATUS',
  'AUTOMATION', 'SCHEDULING',
] as const
export type IntentFamily = typeof INTENT_FAMILIES[number]

export interface CapabilityContext {
  sql: Sql
  /** Who asked, e.g. "telegram:123456789". Bound by the caller, recorded by us. */
  actor: string
  /** Which interface carried the request, e.g. "telegram". */
  channel: string
  /** Today in Berlin, YYYY-MM-DD. Injected so a proof can fix the clock. */
  today: string
  now: Date
}

/** What a capability returns to an interface. Text first, structure for buttons. */
export interface CapabilityResult {
  /** One short paragraph a phone can show. */
  summary: string
  /** Lines under the summary, already ordered by importance. */
  lines?: string[]
  /** Structured data for an interface that renders its own view. */
  data?: unknown
  /** Records this result is about, so an interface can keep conversational focus. */
  focus?: FocusRef[]
  /** Short suggested next steps, phrased as things Marcel could say. */
  next?: string[]
  /** Several records matched; the interface must ask which one. Never guessed. */
  choices?: { id: string; kind: FocusRef['kind']; label: string }[]
}

export interface FocusRef {
  kind: 'lead' | 'client' | 'angebot' | 'invoice' | 'job' | 'incident' | 'approval' | 'draft'
  id: string
  label: string
}

/** What a preparation hands back: the exact thing that will happen. */
export interface Prepared {
  summary: string
  /** Field → value, rendered as the one-screen approval (WHAT / WHO / IMPACT …). */
  preview: Record<string, string>
  /** Everything execution needs, and nothing it will look up again. Hashed. */
  payload: Record<string, unknown>
  /** Two preparations of the same action are one approval. */
  dedupeKey?: string
  /** Minutes the approval stays valid. Default 30. */
  expiresInMinutes?: number
}

export interface CapabilityDefinition<I = unknown> {
  id: string
  family: IntentFamily
  title: string
  description: string
  risk: Risk
  input: Validator<I>
  /** GREEN: do it. */
  run?: (ctx: CapabilityContext, input: I) => Promise<CapabilityResult>
  /** AMBER: fix the target and payload, change nothing. */
  prepare?: (ctx: CapabilityContext, input: I) => Promise<Prepared | CapabilityResult>
  /** AMBER: perform exactly the prepared payload. */
  execute?: (ctx: CapabilityContext, payload: Record<string, unknown>, approvalId: string) => Promise<CapabilityResult>
}

/** A registry holds capabilities of different input shapes; each validates its own. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCapability = CapabilityDefinition<any>

export class CapabilityRefusal extends Error {
  constructor(message: string, public readonly code: 'not_found' | 'conflict' | 'unsupported' | 'precondition' = 'precondition') {
    super(message)
    this.name = 'CapabilityRefusal'
  }
}

export function isPrepared(x: Prepared | CapabilityResult): x is Prepared {
  return 'payload' in x && 'preview' in x
}

/**
 * Thrown when an external effect may or may not have happened — the request
 * reached the provider and no answer came back. Never retried automatically,
 * never reported as done, never reported as not done.
 */
export class UncertainOutcome extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UncertainOutcome'
  }
}
