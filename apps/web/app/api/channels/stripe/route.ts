import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { readBoundedPayload } from '@/lib/mail/provider'
import { getDb } from '@/lib/db'
import { stripeRail } from '@/lib/money/stripe/client'
import { verifyStripeSignature, webhookSecrets } from '@/lib/money/stripe/signature'
import { parseStripeEvent, receiveStripeEvent } from '@/lib/money/stripe/events'
import { scheduleOwnerNotices } from '@/lib/owner/schedule'

/**
 * Stripe → Maxpromo OS (ADR-0025). The only way a card payment, refund, dispute or payout reaches
 * the OS. Fails closed: no signing secret configured → 401 for everything.
 *
 * Responses carry no detail. Logs carry only fixed codes and the opaque event id/type.
 * 200: recorded (or a duplicate of a recorded event). 409: the same event is being processed right
 * now — Stripe retries. 500: processing failed — Stripe retries; the event row says `failed`.
 */
export const dynamic = 'force-dynamic'
const MAX_EVENT_BYTES = 512 * 1024
const noStore = { 'Cache-Control': 'no-store' }
const answer = (body: Record<string, unknown>, status: number) => NextResponse.json(body, { status, headers: noStore })
const log = (level: 'info' | 'warn' | 'error', entry: Record<string, unknown>) => console[level](JSON.stringify(entry))

export function GET() { return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST', ...noStore } }) }

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { scope: 'stripe-webhook', limit: 300, windowMs: 60_000 })
  if (limited) return limited
  const secrets = webhookSecrets(process.env.STRIPE_WEBHOOK_SECRET)
  if (!secrets.length) return answer({ error: 'unauthorized' }, 401)
  let raw: string
  try { raw = await readBoundedPayload(req, MAX_EVENT_BYTES) } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'Payload too large'
    return answer({ error: 'invalid_payload' }, tooLarge ? 413 : 400)
  }
  const verified = verifyStripeSignature(raw, req.headers.get('stripe-signature'), secrets, Math.floor(Date.now() / 1000))
  if (!verified.ok) {
    log('warn', { event: 'stripe.webhook.rejected', reason: verified.problem })
    return answer({ error: 'unauthorized' }, 401)
  }
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return answer({ error: 'invalid_event' }, 400) }
  const event = parseStripeEvent(parsed)
  if (!event) {
    const version = (parsed as { api_version?: unknown } | null)?.api_version
    log('warn', { event: 'stripe.webhook.invalid', api_version: typeof version === 'string' ? version.slice(0, 40) : null })
    return answer({ error: 'invalid_event' }, 400)
  }
  try {
    const sql = getDb()
    const result = await receiveStripeEvent(sql, event, { rail: stripeRail(), now: new Date() })
    log('info', { event: 'stripe.webhook', id: event.id, type: event.type, status: result.status, outcome: result.outcome ?? null })
    if (result.status === 'busy') return answer({ error: 'in_progress' }, 409)
    // Disputes, unapplied money and payout failures reach Marcel through the owner-notice policy.
    if (result.status === 'processed' && result.outcome !== 'ignored') scheduleOwnerNotices('stripe')
    return answer({ received: true }, 200)
  } catch {
    log('error', { event: 'stripe.webhook.failed', id: event.id, type: event.type })
    return answer({ error: 'processing_failed' }, 500)
  }
}
