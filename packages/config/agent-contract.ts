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

/* ── The work door: OS → Agent Bureau (ADR-0030) ─────────────────────────────
 *
 * The other direction of the same contract. The OS delegates specialist work
 * to a Bureau agent; the Bureau executes it and hands the result back through
 * the OS door above (`run` agentwork.result), where the OS applies it.
 *
 *   POST {bureau}/api/work/v1/request   WorkRequest          → WorkView (202 queued, or the existing item)
 *   POST {bureau}/api/work/v1/status    { workId }           → WorkView
 *   POST {bureau}/api/work/v1/cancel    { workId }           → WorkView
 *
 * Signed exactly like the OS door, with its own key (workDoorSecret below) and
 * client id `os`. The OS credential is bound to one Bureau tenant (the business
 * linked by BUREAU_OS_BUSINESS_ID): the body never chooses the tenant. The work
 * id is chosen by the OS and is the idempotency key — a repeated request returns
 * the item that exists and never starts it twice.
 */
export const WORK_CONTRACT_VERSION = 'v1'
export const WORK_CLIENT = 'os' as const

/**
 * The work door's signing key. BUREAU_WORK_SECRET when it is set; otherwise a key DERIVED from the
 * Bureau credential both planes already hold (OS_BUREAU_AGENT_SECRET) with a fixed purpose label:
 * HMAC-SHA256(credential, "maxpromo/work-door/v1"). One stored secret, two keys — a signature made
 * for one door can never verify at the other, and rotating the credential rotates both. Both sides
 * call this function; neither derives its own.
 */
export function workDoorSecret(env: Record<string, string | undefined>): string | undefined {
  const explicit = env.BUREAU_WORK_SECRET
  if (explicit && explicit.length >= MIN_SECRET_LENGTH) return explicit
  const credential = env.OS_BUREAU_AGENT_SECRET
  if (!credential || credential.length < MIN_SECRET_LENGTH) return undefined
  return createHmac('sha256', credential).update('maxpromo/work-door/v1').digest('base64url')
}

/** Agents that accept delegated work, and what each one does. Nothing else is accepted. */
export const WORK_AGENTS = {
  research: { capability: 'lead.research', title: 'Research Agent' },
} as const
export type WorkAgent = keyof typeof WORK_AGENTS

/* ── Owner handoff: one login (ADR-0030) ─────────────────────────────────────
 *
 * Marcel is signed in to Maxpromo OS; opening the Bureau admin from the OS must
 * not ask for a second password. The OS issues a one-time ticket for the OWNER
 * only, the Bureau checks it once and starts its own session for its owner user
 * in the OS-linked tenant. Not a shared cookie: each application keeps its own
 * session; the ticket is the bridge.
 *
 *   ticket = base64url(payload JSON) "." base64url(HMAC-SHA256(key, payload part))
 *   key    = HMAC-SHA256(OS_BUREAU_AGENT_SECRET, "maxpromo/owner-handoff/v1")
 *   payload = { v: 1, aud: "bureau", sub: "os:marcel", iat, exp (≤ 60 s later), nonce }
 *
 * Its own derived key: a work-door signature or an agent credential is never a
 * login. The nonce is recorded by the Bureau, so a ticket works once.
 */
export const HANDOFF_TTL_SECONDS = 60
export interface HandoffTicket { v: 1; aud: 'bureau'; sub: string; iat: number; exp: number; nonce: string }

function handoffKey(env: Record<string, string | undefined>): string | undefined {
  const credential = env.OS_BUREAU_AGENT_SECRET
  if (!credential || credential.length < MIN_SECRET_LENGTH) return undefined
  return createHmac('sha256', credential).update('maxpromo/owner-handoff/v1').digest('base64url')
}

export function signHandoff(env: Record<string, string | undefined>, sub: string, nowSeconds = Math.floor(Date.now() / 1000)): string | null {
  const key = handoffKey(env)
  if (!key) return null
  const payload: HandoffTicket = { v: 1, aud: 'bureau', sub, iat: nowSeconds, exp: nowSeconds + HANDOFF_TTL_SECONDS, nonce: randomBytes(18).toString('base64url') }
  const part = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${part}.${createHmac('sha256', key).update(part).digest('base64url')}`
}

export type HandoffVerdict = { ok: true; ticket: HandoffTicket } | { ok: false; reason: 'not_configured' | 'malformed' | 'bad_signature' | 'expired' | 'wrong_audience' }

export function verifyHandoff(env: Record<string, string | undefined>, token: string, nowSeconds = Math.floor(Date.now() / 1000)): HandoffVerdict {
  const key = handoffKey(env)
  if (!key) return { ok: false, reason: 'not_configured' }
  const m = /^([A-Za-z0-9_-]{20,600})\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!m) return { ok: false, reason: 'malformed' }
  const expected = Buffer.from(createHmac('sha256', key).update(m[1]).digest('base64url'))
  const given = Buffer.from(m[2])
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'bad_signature' }
  let t: HandoffTicket
  try { t = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8')) as HandoffTicket } catch { return { ok: false, reason: 'malformed' } }
  if (t.v !== 1 || typeof t.sub !== 'string' || typeof t.nonce !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(t.nonce)) return { ok: false, reason: 'malformed' }
  if (t.aud !== 'bureau') return { ok: false, reason: 'wrong_audience' }
  if (typeof t.exp !== 'number' || typeof t.iat !== 'number' || t.exp - t.iat > HANDOFF_TTL_SECONDS || nowSeconds > t.exp || t.iat > nowSeconds + 30) return { ok: false, reason: 'expired' }
  return { ok: true, ticket: t }
}

export const WORK_STATES =['queued', 'running', 'completed', 'failed', 'cancelled'] as const
export type WorkState = typeof WORK_STATES[number]
export const isTerminalWork = (s: WorkState) => s === 'completed' || s === 'failed' || s === 'cancelled'

/** Why work failed. A category Marcel can act on; details stay in the logs. */
export const WORK_FAILURES = ['site', 'model', 'timeout', 'delivery', 'invalid', 'internal', 'cancelled'] as const
export type WorkFailureCategory = typeof WORK_FAILURES[number]

export interface WorkRequest {
  workId: string
  agent: WorkAgent
  /** Who asked in the OS (os:marcel) and through what (max, lead-screen). */
  requestedBy: string
  source: string
  /** The OS record the work is about. The Bureau keeps the reference, never the record. */
  subject: { kind: 'lead'; id: string; label: string }
  /** A bounded snapshot: exactly what the agent needs, nothing more. */
  input: { website: string; language?: 'de' | 'en' }
  objective: string
  /** Policy the agent runs under. Research reads one public site and acts on nothing. */
  constraints: { publicWebsiteOnly: true; sendsNothing: true }
}

export interface WorkFailure { category: WorkFailureCategory; reason: string; detail: string; retryable: boolean }

export interface WorkView {
  workId: string
  agent: WorkAgent
  state: WorkState
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  /** Present when completed: the agent's structured result (see the agent's own result type). */
  result?: unknown
  failure?: WorkFailure
  /** Runtime metadata: model, the gateway route that answered (ADR-0033 A4), latency. No reasoning, no prompts. */
  runtime?: { model?: string | null; route?: string | null; latencyMs?: number | null; attempt: number }
}

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
export function signedHeaders(p: { client: AgentClientId | typeof WORK_CLIENT; secret: string; method: string; path: string; body: string; nowSeconds?: number }): Record<string, string> {
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
