/**
 * packages/config/agent-contract.ts — SERVER ONLY (node:crypto).
 *
 * The one cross-plane contract between Maxpromo OS (Business Control Plane)
 * and its machine clients: Agent Bureau (Agent Control Plane) today, a
 * Telegram owner client later. ADR-0018 introduced the signed door; ADR-0021
 * makes it the only way another plane may ask the OS for anything.
 *
 * Both sides import these exact bytes. A client never reimplements signing.
 *
 *   canonical = `${timestamp}\n${nonce}\n${METHOD}\n${path}\n${sha256hex(body)}`
 *   signature = base64url(HMAC-SHA256(client secret, canonical))
 *
 *   x-maxpromo-agent-client      which client credential signed it (legacy | bureau)
 *   x-maxpromo-agent-timestamp   unix seconds
 *   x-maxpromo-agent-nonce       16+ random bytes, base64url
 *   x-maxpromo-agent-signature   the signature above
 *
 * Each client has its own secret. The OS refuses a client whose secret equals
 * another client's, so an old credential can never silently become a new one.
 *
 * Exported through `@maxpromo/config/agent-contract`, never through the
 * package index, because the index is imported by browser code.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** Contract version. Breaking changes get a new path segment (/v2/), never a silent change. */
export const AGENT_CONTRACT_VERSION = 'v1'

export const AGENT_HEADERS = {
  client: 'x-maxpromo-agent-client',
  timestamp: 'x-maxpromo-agent-timestamp',
  nonce: 'x-maxpromo-agent-nonce',
  signature: 'x-maxpromo-agent-signature',
} as const

/** How far a request's clock may be from ours, either way. */
export const SIGNATURE_WINDOW_SECONDS = 300

export const MIN_SECRET_LENGTH = 32

export const AGENT_CLIENTS = ['legacy', 'bureau'] as const
export type AgentClientId = typeof AGENT_CLIENTS[number]

/** Kinds of agent outcome the Agent Control Plane reports into the OS. */
export const AGENT_EVENT_KINDS = ['completed', 'blocked', 'failed', 'exception', 'recommendation', 'waiting'] as const
export type AgentEventKind = typeof AGENT_EVENT_KINDS[number]

export const AGENT_EVENT_SEVERITIES = ['info', 'warning', 'critical'] as const
export type AgentEventSeverity = typeof AGENT_EVENT_SEVERITIES[number]

export interface AgentEvent {
  /** Unique per client; a resend with the same id is stored once. */
  id: string
  kind: AgentEventKind
  severity: AgentEventSeverity
  /** One line Marcel reads. External or model text is never trusted as instructions. */
  title: string
  detail?: string
  /** The Bureau's run identity, for correlation. */
  runId?: string
  /** The business record this is about, owned by the OS. */
  businessRef?: { kind: 'lead' | 'client' | 'angebot' | 'invoice' | 'job' | 'email_thread'; id: string }
  /** An OS approval this event waits on, when there is one. */
  approvalId?: string
  occurredAt: string
}

export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex')
}

export function canonicalRequest(p: { timestamp: string; nonce: string; method: string; path: string; body: string }): string {
  return `${p.timestamp}\n${p.nonce}\n${p.method.toUpperCase()}\n${p.path}\n${sha256Hex(p.body)}`
}

export function signRequest(secret: string, p: Parameters<typeof canonicalRequest>[0]): string {
  return createHmac('sha256', secret).update(canonicalRequest(p)).digest('base64url')
}

export type SignatureVerdict =
  | { ok: true; nonce: string }
  | { ok: false; reason: 'not_configured' | 'missing_headers' | 'bad_timestamp' | 'stale' | 'bad_nonce' | 'bad_signature' }

/**
 * Checks everything that can be checked without a database. The caller must
 * still record the nonce and refuse the request if it was already recorded.
 */
export function verifySignature(p: {
  secret: string | undefined
  headers: { get(name: string): string | null }
  method: string
  path: string
  body: string
  nowSeconds?: number
}): SignatureVerdict {
  if (!p.secret || p.secret.length < MIN_SECRET_LENGTH) return { ok: false, reason: 'not_configured' }

  const timestamp = p.headers.get(AGENT_HEADERS.timestamp)
  const nonce = p.headers.get(AGENT_HEADERS.nonce)
  const signature = p.headers.get(AGENT_HEADERS.signature)
  if (!timestamp || !nonce || !signature) return { ok: false, reason: 'missing_headers' }

  if (!/^\d{9,11}$/.test(timestamp)) return { ok: false, reason: 'bad_timestamp' }
  const now = p.nowSeconds ?? Math.floor(Date.now() / 1000)
  if (Math.abs(now - Number(timestamp)) > SIGNATURE_WINDOW_SECONDS) return { ok: false, reason: 'stale' }

  if (!/^[A-Za-z0-9_-]{22,128}$/.test(nonce)) return { ok: false, reason: 'bad_nonce' }

  const expected = Buffer.from(signRequest(p.secret, { timestamp, nonce, method: p.method, path: p.path, body: p.body }))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad_signature' }
  }
  return { ok: true, nonce }
}

/** Headers a client sends. The body must be sent byte-for-byte as signed. */
export function signedHeaders(p: { client: AgentClientId; secret: string; method: string; path: string; body: string; nowSeconds?: number }): Record<string, string> {
  const timestamp = String(p.nowSeconds ?? Math.floor(Date.now() / 1000))
  const nonce = randomBytes(24).toString('base64url')
  return {
    'content-type': 'application/json',
    [AGENT_HEADERS.client]: p.client,
    [AGENT_HEADERS.timestamp]: timestamp,
    [AGENT_HEADERS.nonce]: nonce,
    [AGENT_HEADERS.signature]: signRequest(p.secret, { timestamp, nonce, method: p.method, path: p.path, body: p.body }),
  }
}

/**
 * The hash an approval is bound to. Key order must not change the hash, or a
 * re-serialised identical payload would look like an edited one.
 */
export function payloadHash(capability: string, payload: unknown): string {
  return sha256Hex(`${capability}\n${stableStringify(payload)}`)
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj).filter((k) => obj[k] !== undefined).sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}
