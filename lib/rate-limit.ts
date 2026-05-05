/**
 * lib/rate-limit.ts
 *
 * In-memory sliding-window limiter per (key, scope). No new dependency.
 *
 * Scope = the endpoint name. Key = client IP.
 *
 * On Vercel each function instance has its own memory, so this is approximate
 * per-instance rate limiting — good enough to stop a single abuser from
 * draining your Anthropic credit, but NOT a substitute for Cloudflare/Upstash
 * at scale. When traffic justifies it, swap the body for an Upstash call —
 * the public API of `enforceRateLimit` is stable.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface Bucket { hits: number[] }

const STORE = new Map<string, Bucket>()
const MAX_KEYS = 5000 // simple cap to prevent runaway memory

function clientIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for as a comma-separated list. First entry is the
  // original client. Fall back to a constant string in dev so local testing
  // still triggers the limit.
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'local'
}

function prune(bucket: Bucket, windowMs: number) {
  const cutoff = Date.now() - windowMs
  while (bucket.hits.length > 0 && bucket.hits[0] < cutoff) {
    bucket.hits.shift()
  }
}

export interface RateLimitOptions {
  scope: string
  /** Max hits in the rolling window. */
  limit: number
  /** Window length in ms. Default 60_000 (1 min). */
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): RateLimitResult {
  const window = opts.windowMs ?? 60_000
  const key = `${opts.scope}:${clientIp(req)}`

  // Cap memory in pathological scenarios.
  if (STORE.size > MAX_KEYS && !STORE.has(key)) STORE.clear()

  let bucket = STORE.get(key)
  if (!bucket) { bucket = { hits: [] }; STORE.set(key, bucket) }
  prune(bucket, window)

  if (bucket.hits.length >= opts.limit) {
    const oldest = bucket.hits[0]
    const retryAfterMs = Math.max(0, window - (Date.now() - oldest))
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    }
  }

  bucket.hits.push(Date.now())
  return {
    allowed: true,
    remaining: opts.limit - bucket.hits.length,
    retryAfterSec: 0,
  }
}

/**
 * Convenience: returns a 429 response if over limit, else null.
 *
 *     const blocked = enforceRateLimit(req, { scope: 'contact', limit: 5 })
 *     if (blocked) return blocked
 */
export function enforceRateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const result = rateLimit(req, opts)
  if (result.allowed) return null
  return NextResponse.json(
    {
      error: 'Too many requests',
      detail: `Try again in ${result.retryAfterSec}s.`,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfterSec) },
    },
  )
}
