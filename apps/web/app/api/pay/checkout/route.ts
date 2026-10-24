import { NextResponse, type NextRequest } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { rateLimit } from '@/lib/rate-limit'
import { isPayToken, payUrl, startCheckout } from '@/lib/money/links'
import { stripeRail } from '@/lib/money/stripe/client'

/**
 * Starts a card payment for one invoice (ADR-0025). Only the pay page's form posts here.
 * It names the token, never an amount: the amount is the invoice's open balance at this moment,
 * computed by the OS. Success → 303 to the provider's hosted checkout. Anything else → 303 back to
 * the pay page with a fixed reason code. No detail, no record data, no provider error leaves.
 */
export const dynamic = 'force-dynamic'
const MAX_FORM_BYTES = 2048

export function GET() { return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } }) }

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_FORM_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  let token = '', lang: 'de' | 'en' = 'de'
  try {
    const form = await req.formData()
    token = String(form.get('token') ?? '')
    lang = form.get('lang') === 'en' ? 'en' : 'de'
  } catch { return NextResponse.json({ error: 'invalid_form' }, { status: 400 }) }
  if (!isPayToken(token)) return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  const back = (reason: string) => NextResponse.redirect(`${payUrl(token, lang)}?e=${reason}`, { status: 303, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
  // Per client and per link: a link cannot be used to hammer the provider.
  if (!rateLimit(req, { scope: 'pay-checkout', limit: 10, windowMs: 10 * 60_000 }).allowed) return back('limited')
  if (!isDatabaseConfigured()) return back('not_connected')
  try {
    const result = await startCheckout(getDb(), token, stripeRail(), berlinDate())
    if (!result.ok) return back(result.reason)
    return NextResponse.redirect(result.url, { status: 303, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
  } catch {
    console.error(JSON.stringify({ event: 'pay.checkout.failed' }))
    return back('refused')
  }
}
