import { NextRequest, NextResponse } from 'next/server'
import { signSession, buildSessionCookie, SESSION_TTL_SECONDS } from '@/lib/auth'

interface LoginBody { password?: string }

/**
 * POST /api/os/login
 * Server-side OS login. Compares against OS_PASSWORD env var (NEVER ship
 * the password to the client). On success, sets a signed httpOnly cookie.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.OS_PASSWORD
  if (!expected) {
    console.error('[/api/os/login] OS_PASSWORD env var is not set')
    return NextResponse.json({ error: 'Login not configured' }, { status: 503 })
  }

  let body: LoginBody
  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  // Constant-time compare
  if (body.password.length !== expected.length) {
    return NextResponse.json({ error: 'Incorrect access code' }, { status: 401 })
  }
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ body.password.charCodeAt(i)
  }
  if (diff !== 0) {
    return NextResponse.json({ error: 'Incorrect access code' }, { status: 401 })
  }

  // Issue session — sub is hardcoded "marcel" until multi-user lands in Stage 3.
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const token = await signSession({ sub: 'marcel', exp })

  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', buildSessionCookie(token))
  return res
}
