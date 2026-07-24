import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * Constant-time string comparison. timingSafeEqual throws if buffer lengths
 * differ, so both inputs are first hashed to a fixed-length SHA-256 digest --
 * this avoids leaking length information via early-exit comparisons while
 * staying safe for inputs of arbitrary/unequal length.
 */
function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit(req, {
    scope: 'portfolio-auth',
    limit: 5,
    windowMs: 10 * 60_000,
  })
  if (blocked) return blocked

  let password: unknown
  try {
    const body = await req.json()
    password = body?.password
  } catch {
    return NextResponse.json({ success: false, error: 'invalid credentials' }, { status: 401 })
  }

  const expected = process.env.PORTFOLIO_PASSWORD
  if (typeof password !== 'string' || !expected || !safeCompare(password, expected)) {
    return NextResponse.json({ success: false, error: 'invalid credentials' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
