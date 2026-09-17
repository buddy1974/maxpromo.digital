/**
 * lib/demo/access.ts
 *
 * Authorisation for the private demonstration room.
 *
 * THE SHAPE
 *   1. Marcel adds a grant to the registry and sends the recipient a link
 *      carrying the grant id and its token.
 *   2. The token is verified server-side and exchanged for a signed httpOnly
 *      cookie scoped to /demo.
 *   3. Every private route re-reads the cookie, re-resolves the grant from the
 *      registry, and re-checks it on every request.
 *
 * Step three is the important one. Authorisation is never carried in the
 * cookie beyond an identity: revoking a grant in the registry takes effect on
 * the next request, and an expired grant stops working on its own date even if
 * a valid cookie is still in the browser.
 *
 * IT FAILS CLOSED.
 * With no DEMO_ACCESS_SECRET configured, `demoSecret()` returns null and every
 * function here denies. That is deliberate for this release: production ships
 * without the secret set, so the room is reachable, empty and shut. It opens
 * when Marcel sets the secret, not before, and a missing secret can never be
 * mistaken for permission.
 *
 * NO NEW DEPENDENCY. Web Crypto HMAC-SHA-256, the same primitive and the same
 * reasoning as lib/auth.ts, so this works in middleware on the Edge runtime.
 */

import { getGrant, grantIsUsable, grantAuthorises, type Grant } from './registry'

export const DEMO_COOKIE = 'maxpromo_demo_access'
/** Short by design: a demonstration link is not a standing login. */
export const DEMO_TTL_SECONDS = 60 * 60 * 12

const enc = new TextEncoder()

function b64u(bytes: ArrayBuffer | Uint8Array): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * The signing secret, or null when the room is shut.
 *
 * Deliberately not read through `lib/env.ts`: that module throws on a missing
 * required variable at import time, which would take the whole public site
 * down rather than leaving one optional room closed.
 */
function demoSecret(): string | null {
  const s = process.env.DEMO_ACCESS_SECRET
  if (!s || s.length < 32) return null
  return s
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
}

/**
 * How a grant id is turned into a grant.
 *
 * The default is the real registry, and every caller in the application uses
 * it. The parameter exists so packages/tooling/prove-demo-access.mjs can put a
 * revoked grant, an expired grant and an unknown grant through the real code
 * without editing the registry to do it — the same reason `grantIsUsable`
 * already takes a `now`. A gate that has only ever been seen passing is not
 * known to block (ADR-0004), and this one is the only thing between a stranger
 * and a client's system.
 *
 * It cannot widen access: whatever it returns still has to survive
 * `grantIsUsable` and, for a specific demo, `grantAuthorises`.
 */
type GrantLookup = (id: string) => Grant | undefined

/** Constant-time compare, so a token cannot be discovered a byte at a time. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * The token for a grant. Marcel runs this to build an access link; it is never
 * sent to a browser that has not already proved it holds the token.
 */
export async function demoToken(grantId: string): Promise<string | null> {
  const secret = demoSecret()
  if (!secret) return null
  return hmac(secret, `demo:${grantId}`)
}

/** Exchange a link's token for a session. Returns null on any failure. */
export async function verifyDemoToken(
  grantId: string,
  token: string | undefined,
  lookup: GrantLookup = getGrant,
): Promise<Grant | null> {
  if (!token) return null
  const grant = lookup(grantId)
  // Check the grant before the token so a revoked grant cannot be reopened by
  // a link that was valid when it was sent.
  if (!grant || !grantIsUsable(grant)) return null
  const expected = await demoToken(grantId)
  if (!expected) return null
  return sameString(expected, token) ? grant : null
}

/* ── The session cookie ──────────────────────────────────────────────────── */

interface DemoSession { g: string; exp: number }

export async function signDemoSession(grantId: string): Promise<string | null> {
  const secret = demoSecret()
  if (!secret) return null
  const payload: DemoSession = { g: grantId, exp: Math.floor(Date.now() / 1000) + DEMO_TTL_SECONDS }
  const body = b64u(enc.encode(JSON.stringify(payload)))
  return `${body}.${await hmac(secret, body)}`
}

/**
 * Resolve a cookie to a grant that is still good.
 *
 * Re-reads the registry every time rather than trusting the cookie's contents,
 * which is what makes revocation and expiry take effect immediately.
 */
export async function resolveDemoSession(
  cookie: string | undefined,
  lookup: GrantLookup = getGrant,
): Promise<Grant | null> {
  const secret = demoSecret()
  if (!secret || !cookie) return null

  const [body, sig] = cookie.split('.')
  if (!body || !sig) return null
  if (!sameString(await hmac(secret, body), sig)) return null

  let payload: DemoSession
  try {
    payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/'))) as DemoSession
  } catch {
    return null
  }
  if (!payload?.g || typeof payload.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null

  const grant = lookup(payload.g)
  if (!grant || !grantIsUsable(grant)) return null
  return grant
}

/** Whether this cookie may open this specific demo. Scoped, never "all". */
export async function sessionAuthorises(
  cookie: string | undefined,
  demoId: string,
  lookup: GrantLookup = getGrant,
): Promise<boolean> {
  const grant = await resolveDemoSession(cookie, lookup)
  return grant ? grantAuthorises(grant, demoId) : false
}

export function buildDemoCookie(token: string): string {
  const parts = [
    `${DEMO_COOKIE}=${token}`,
    'Path=/demo',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${DEMO_TTL_SECONDS}`,
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function clearDemoCookie(): string {
  const parts = [`${DEMO_COOKIE}=`, 'Path=/demo', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

/** True when no secret is configured, i.e. the room is shut to everyone. */
export function demoRoomIsClosed(): boolean {
  return demoSecret() === null
}
