/**
 * lib/auth.ts
 *
 * Cookie-based session for the OS. No new dependencies — we sign a
 * compact JSON payload with HMAC-SHA-256 using Web Crypto so it works
 * on both the Node and Edge runtimes (middleware needs Edge).
 *
 * Why not JWT?
 *   We don't need claims, key rotation, or third-party verification —
 *   only "did the server issue this cookie". A signed payload is enough.
 *
 * The cookie carries:
 *   - sub: user id ("marcel" today, real user id later)
 *   - exp: expiry as unix seconds
 *
 * Stage-3 note: When we move to multi-tenant orgs, add `org` here and
 * read it inside withAuth() so per-org row filtering becomes trivial.
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const COOKIE_NAME = 'maxpromo_os_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface Session {
  sub: string
  exp: number
}

/* ── Encoding helpers ─────────────────────────────────────────────────── */

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64uEncode(bytes: ArrayBuffer | Uint8Array): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64uDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  const raw = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function getSecret(): string {
  const secret = process.env.OS_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      '[auth] OS_SESSION_SECRET must be set to a 32+ character random string',
    )
  }
  return secret
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return b64uEncode(sig)
}

/* ── Sign / verify ────────────────────────────────────────────────────── */

export async function signSession(session: Session): Promise<string> {
  const payloadB64 = b64uEncode(enc.encode(JSON.stringify(session)))
  const sig = await hmac(payloadB64, getSecret())
  return `${payloadB64}.${sig}`
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null

  let secret: string
  try { secret = getSecret() } catch { return null }

  const expected = await hmac(payloadB64, secret)
  // Constant-time-ish compare — both strings are equal length here
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  if (diff !== 0) return null

  let session: Session
  try {
    session = JSON.parse(dec.decode(b64uDecode(payloadB64))) as Session
  } catch {
    return null
  }
  if (typeof session.exp !== 'number' || session.exp < Math.floor(Date.now() / 1000)) {
    return null
  }
  return session
}

/* ── Server-side helpers (App Router) ─────────────────────────────────── */

/**
 * For use inside server components and route handlers — reads the session
 * cookie via next/headers.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  return verifySession(token)
}

/**
 * Throws (returns 401 response when used in route wrappers below) if no
 * valid session is present.
 */
export async function requireUser(): Promise<Session> {
  const s = await getSession()
  if (!s) throw new AuthError()
  return s
}

export class AuthError extends Error {
  constructor(public statusCode = 401) {
    super('Unauthorized')
    this.name = 'AuthError'
  }
}

/* ── withAuth route wrapper ───────────────────────────────────────────── */

export type AuthedHandler<T = unknown> = (
  request: NextRequest,
  ctx: { session: Session; params: T },
) => Promise<NextResponse> | NextResponse

/**
 * Wrap a route handler so it 401s when the session cookie is missing or
 * expired. Use in app/api/os/* routes:
 *
 *     export const POST = withAuth(async (req, { session }) => { ... })
 */
export function withAuth<T = unknown>(handler: AuthedHandler<T>) {
  return async (request: NextRequest, routeCtx: { params: Promise<T> } | { params: T }) => {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Next 16: route ctx params can be a Promise. Resolve so handlers can use them sync.
    const params = (await Promise.resolve(
      (routeCtx as { params: Promise<T> | T }).params,
    )) as T
    return handler(request, { session, params })
  }
}

/* ── Cookie helpers used by login/logout routes ───────────────────────── */

export function buildSessionCookie(token: string, maxAgeSec = SESSION_TTL_SECONDS): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookie(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}
