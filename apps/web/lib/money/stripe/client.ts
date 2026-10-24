/**
 * The Stripe rail client (ADR-0025). SERVER ONLY. No SDK: a handful of form-encoded calls over
 * fetch, like every other provider in this repository.
 *
 * Gates, decided in one place:
 *   - no key, or a key of the wrong shape        → not connected (null)
 *   - STRIPE_PAYMENTS_DISABLED=1                  → owner kill switch (null)
 *   - evidence mode                               → test keys only
 *   - a LIVE key                                  → only with STRIPE_LIVE=1, Marcel's explicit go-live
 *
 * Outcomes: a refused request (4xx) is `failed` — nothing happened at Stripe. A timeout, network
 * error or 5xx on a request that CREATES something is `uncertain`: it may have happened, so the
 * caller keeps the idempotency key and asks again with the same key, never with a new one.
 * The key never appears in an error, a log line or a return value.
 */
export const STRIPE_API = 'https://api.stripe.com/v1'
/** Pinned so a dashboard default change cannot alter payloads under us. The webhook endpoint
 * must be created with the same version (owner action, see the ledger). */
export const STRIPE_API_VERSION = '2024-06-20'
const KEY = /^(sk|rk)_(test|live)_[A-Za-z0-9]{16,}$/

export type StripeMode = 'test' | 'live'
export class StripeRailError extends Error {
  constructor(public outcome: 'failed' | 'uncertain', public status?: number, public code?: string) {
    super(`stripe_${outcome}${code ? `:${code}` : ''}`)
    this.name = 'StripeRailError'
  }
}

export type { RailStatus } from '../types'
import type { RailStatus } from '../types'

export function railStatus(env: Record<string, string | undefined> = process.env): RailStatus {
  const key = env.STRIPE_SECRET_KEY?.trim()
  const webhook = Boolean(env.STRIPE_WEBHOOK_SECRET?.trim())
  const off = (reason: RailStatus['reason'], mode: StripeMode | null = null): RailStatus => ({ connected: false, mode, webhook, reason })
  if (!key) return off('no_key')
  const m = KEY.exec(key)
  if (!m) return off('bad_key')
  const mode = m[2] as StripeMode
  if (env.STRIPE_PAYMENTS_DISABLED === '1') return off('disabled', mode)
  if (mode === 'live' && env.MAXPROMO_EVIDENCE_MODE === '1') return off('evidence_live_key', mode)
  if (mode === 'live' && env.STRIPE_LIVE !== '1') return off('live_not_enabled', mode)
  return { connected: true, mode, webhook, reason: null }
}

/** Form encoding with Stripe's bracket notation for nested objects and arrays. */
export function formEncode(value: Record<string, unknown>): string {
  const out: string[] = []
  const walk = (prefix: string, v: unknown) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) v.forEach((item, i) => walk(`${prefix}[${i}]`, item))
    else if (typeof v === 'object') for (const [k, inner] of Object.entries(v as Record<string, unknown>)) walk(prefix ? `${prefix}[${k}]` : k, inner)
    else out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(v))}`)
  }
  walk('', value)
  return out.join('&')
}

export interface CheckoutSessionInput {
  amountMinor: number
  currency: 'EUR' | 'GBP'
  productName: string
  invoiceId: string
  invoiceNumber: string
  sessionRowId: string
  customerEmail?: string | null
  locale: 'de' | 'en'
  successUrl: string
  cancelUrl: string
  expiresAt: number
}
export interface CheckoutSession { id: string; url: string | null; status: string; expires_at: number; payment_intent: string | null; livemode: boolean }
export interface BalanceTransaction { id: string; amount: number; fee: number; net: number; currency: string; available_on: number; type: string; source: string | null }
export interface Refund { id: string; status: string; amount: number; currency: string; charge: string | null; payment_intent: string | null }

export interface StripeRail {
  mode: StripeMode
  livemode: boolean
  createCheckoutSession(input: CheckoutSessionInput, idempotencyKey: string): Promise<CheckoutSession>
  expireCheckoutSession(id: string): Promise<void>
  retrieveBalanceTransaction(id: string): Promise<BalanceTransaction>
  createRefund(input: { paymentIntent: string; amountMinor: number; invoiceId: string; reason?: 'requested_by_customer' | 'duplicate' }, idempotencyKey: string): Promise<Refund>
  listRefunds(chargeId: string): Promise<Refund[]>
  listPayoutTransactions(payoutId: string): Promise<BalanceTransaction[]>
}

const ID = /^[a-z]{2,6}_[A-Za-z0-9]{6,255}$/
function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }

export function stripeRail(env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch, timeoutMs = 20_000): StripeRail | null {
  const status = railStatus(env)
  if (!status.connected || !status.mode) return null
  const key = env.STRIPE_SECRET_KEY!.trim()
  const livemode = status.mode === 'live'

  async function call<T>(method: 'GET' | 'POST', path: string, body: Record<string, unknown> | null, idempotencyKey?: string): Promise<T> {
    const creating = method === 'POST'
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response: Response
    try {
      response = await fetcher(`${STRIPE_API}${path}`, {
        method, redirect: 'error', signal: controller.signal, cache: 'no-store',
        headers: {
          Authorization: `Bearer ${key}`, 'Stripe-Version': STRIPE_API_VERSION,
          ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey.slice(0, 255) } : {}),
        },
        body: body ? formEncode(body) : undefined,
      })
    } catch {
      throw new StripeRailError(creating ? 'uncertain' : 'failed')
    } finally { clearTimeout(timer) }
    let json: unknown
    try { json = await response.json() } catch { throw new StripeRailError(creating && !response.ok ? 'uncertain' : 'failed', response.status) }
    if (!response.ok) {
      const code = object(json) && object(json.error) && typeof json.error.code === 'string' ? json.error.code.slice(0, 80) : undefined
      throw new StripeRailError(creating && (response.status >= 500 || response.status === 429) ? 'uncertain' : 'failed', response.status, code)
    }
    if (!object(json)) throw new StripeRailError(creating ? 'uncertain' : 'failed', response.status)
    return json as T
  }
  const id = (v: string) => { if (!ID.test(v)) throw new StripeRailError('failed', undefined, 'invalid_id'); return encodeURIComponent(v) }
  const txn = (t: Record<string, unknown>): BalanceTransaction => ({
    id: String(t.id), amount: Number(t.amount), fee: Number(t.fee), net: Number(t.net), currency: String(t.currency).toUpperCase(),
    available_on: Number(t.available_on), type: String(t.type), source: typeof t.source === 'string' ? t.source : null,
  })
  const refund = (r: Record<string, unknown>): Refund => ({
    id: String(r.id), status: String(r.status), amount: Number(r.amount), currency: String(r.currency).toUpperCase(),
    charge: typeof r.charge === 'string' ? r.charge : null, payment_intent: typeof r.payment_intent === 'string' ? r.payment_intent : null,
  })

  return {
    mode: status.mode, livemode,
    async createCheckoutSession(i, idempotencyKey) {
      if (!Number.isInteger(i.amountMinor) || i.amountMinor < 50) throw new StripeRailError('failed', undefined, 'amount_too_small')
      const metadata = { invoice_id: i.invoiceId, invoice_number: i.invoiceNumber, session_row: i.sessionRowId }
      const s = await call<Record<string, unknown>>('POST', '/checkout/sessions', {
        mode: 'payment', submit_type: 'pay', locale: i.locale,
        line_items: [{ quantity: 1, price_data: { currency: i.currency.toLowerCase(), unit_amount: i.amountMinor, product_data: { name: i.productName.slice(0, 200) } } }],
        client_reference_id: i.invoiceId,
        ...(i.customerEmail ? { customer_email: i.customerEmail } : {}),
        success_url: i.successUrl, cancel_url: i.cancelUrl, expires_at: i.expiresAt,
        metadata, payment_intent_data: { description: i.productName.slice(0, 200), metadata },
      }, idempotencyKey)
      if (typeof s.id !== 'string' || !s.id.startsWith('cs_')) throw new StripeRailError('uncertain')
      return { id: s.id, url: typeof s.url === 'string' ? s.url : null, status: String(s.status), expires_at: Number(s.expires_at),
        payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : null, livemode: s.livemode === true }
    },
    async expireCheckoutSession(sessionId) { await call('POST', `/checkout/sessions/${id(sessionId)}/expire`, {}) },
    async retrieveBalanceTransaction(txnId) { return txn(await call<Record<string, unknown>>('GET', `/balance_transactions/${id(txnId)}`, null)) },
    async createRefund(r, idempotencyKey) {
      return refund(await call<Record<string, unknown>>('POST', '/refunds', {
        payment_intent: r.paymentIntent, amount: r.amountMinor, ...(r.reason ? { reason: r.reason } : {}), metadata: { invoice_id: r.invoiceId },
      }, idempotencyKey))
    },
    async listRefunds(chargeId) {
      const list = await call<{ data?: unknown[] }>('GET', `/refunds?charge=${id(chargeId)}&limit=100`, null)
      return (list.data ?? []).filter(object).map(refund)
    },
    async listPayoutTransactions(payoutId) {
      const list = await call<{ data?: unknown[] }>('GET', `/balance_transactions?payout=${id(payoutId)}&limit=100`, null)
      return (list.data ?? []).filter(object).map(txn)
    },
  }
}

export const toMinor = (amount: number) => Math.round(amount * 100)
export const fromMinor = (minor: number) => Math.round(minor) / 100
