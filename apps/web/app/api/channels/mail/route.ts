import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { MAX_MAIL_BYTES } from '@/lib/mail/normalization'
import { readBoundedPayload, verifyWebhookBearer } from '@/lib/mail/provider'

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { scope: 'mail-webhook', limit: 120, windowMs: 60_000 })
  if (limited) return limited
  const secret = process.env.HOSTINGER_MAIL_WEBHOOK_SECRET
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  if (!verifyWebhookBearer(req.headers.get('authorization'), secret)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try { await readBoundedPayload(req, MAX_MAIL_BYTES) } catch (error) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: error instanceof Error && error.message === 'Payload too large' ? 413 : 400 })
  }
  // Official docs do not establish payload identity/retry contract. Do not accept,
  // parse, persist private content or acknowledge delivery until a fixture proves it.
  return NextResponse.json({ error: 'webhook_contract_not_verified' }, { status: 503 })
}
