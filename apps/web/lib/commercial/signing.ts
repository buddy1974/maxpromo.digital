/**
 * lib/commercial/signing.ts
 *
 * How a machine caller proves it may use the commercial agent API, and how a
 * captured request is kept from being used twice.
 *
 * WHY NOT THE SESSION COOKIE
 *
 * `/api/os/*` admits a browser holding Marcel's signed session cookie. The
 * mobile layer is not a browser: OpenClaw Mission Control calls the OS on
 * Marcel's behalf after it has identified him by his numeric Telegram id and,
 * for anything consequential, after he has pressed Confirm. Handing it the
 * login password or a long-lived session cookie would give it every screen
 * of the OS. A separate, narrower credential gives it exactly one door.
 *
 * THE CONTRACT (ADR-0018) — Mission Control implements the same bytes
 *
 *   canonical = `${timestamp}\n${nonce}\n${METHOD}\n${path}\n${sha256hex(body)}`
 *   signature = base64url(HMAC-SHA256(OS_AGENT_SECRET, canonical))
 *
 *   x-maxpromo-agent-timestamp   unix seconds
 *   x-maxpromo-agent-nonce       16+ random bytes, base64url
 *   x-maxpromo-agent-signature   the signature above
 *
 * The body is part of the signature, so a captured request cannot be replayed
 * with a different payload; the nonce is stored on first use, so it cannot be
 * replayed with the same one; the timestamp bounds how long a nonce must be
 * remembered. The secret never travels.
 *
 * Fail closed: no secret configured, or one shorter than 32 characters, means
 * every request is refused, never accepted.
 *
 * Pure apart from Node's crypto, so the proof imports it directly.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const AGENT_HEADERS = {
  timestamp: 'x-maxpromo-agent-timestamp',
  nonce: 'x-maxpromo-agent-nonce',
  signature: 'x-maxpromo-agent-signature',
} as const

/** How far a request's clock may be from ours, either way. */
export const SIGNATURE_WINDOW_SECONDS = 300

export const MIN_SECRET_LENGTH = 32

export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex')
}

export function canonicalRequest(p: {
  timestamp: string
  nonce: string
  method: string
  path: string
  body: string
}): string {
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
