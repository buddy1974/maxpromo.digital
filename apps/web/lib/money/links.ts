/**
 * Payment requests and payment attempts (ADR-0025). SERVER ONLY.
 *
 * PAYMENT REQUEST = one stable link per invoice: https://maxpromo.digital/<lang>/pay/<token>.
 *   It belongs to the OS, not to Stripe, and never expires on its own. Opening it (GET) only shows
 *   the invoice number, the CURRENT open balance and how to pay. Link scanners and mail previews
 *   fetch links, so a GET never creates anything at the provider.
 *
 * PAYMENT ATTEMPT = a Checkout Session, created only by an explicit POST from that page, for the
 *   open balance at that moment, in the invoice's currency. The session row is written BEFORE the
 *   provider is called, carrying the idempotency key the call uses; if the provider does not answer,
 *   the next click retries the same row with the same key and receives the same session.
 *   A still-valid open session for the same amount is reused instead of opening another.
 *
 * Nothing here records a payment. Money is recorded only from a verified provider event
 * (lib/money/stripe/events.ts) through the one payment path.
 */
import { randomBytes } from 'node:crypto'
import { FALLBACK_DOMAIN } from '@maxpromo/config'
import { invoiceBalance, type InvoiceState } from '@/lib/commercial/money'
import type { Sql } from '@/lib/commercial/types'
import { StripeRailError, toMinor, type StripeRail } from './stripe/client'

export const PAY_ORIGIN = FALLBACK_DOMAIN.origin
/** A session is reused while it has at least this long left; Stripe allows 30 min … 24 h. */
const REUSE_MARGIN_MS = 20 * 60_000
const SESSION_LIFETIME_S = 4 * 60 * 60
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/

export function payUrl(token: string, language: 'de' | 'en'): string {
  return `${PAY_ORIGIN}/${language}/pay/${token}`
}

export function isPayToken(value: string): boolean { return TOKEN.test(value) }

/** The invoice's active payment link, created on first use. Idempotent; never two active links. */
export async function ensurePaymentLink(sql: Sql, invoiceId: string, actor: string): Promise<{ id: string; token: string }> {
  const existing = await sql`SELECT id, token FROM money.payment_links WHERE invoice_id = ${invoiceId}::uuid AND status = 'active'` as { id: string; token: string }[]
  if (existing[0]) return existing[0]
  const token = randomBytes(24).toString('base64url')
  const created = await sql`
    INSERT INTO money.payment_links (invoice_id, token, created_by) VALUES (${invoiceId}::uuid, ${token}, ${actor})
    ON CONFLICT (invoice_id) WHERE status = 'active' DO NOTHING
    RETURNING id, token` as { id: string; token: string }[]
  if (created[0]) return created[0]
  // Created at the same moment by another request: that one is the link.
  const raced = await sql`SELECT id, token FROM money.payment_links WHERE invoice_id = ${invoiceId}::uuid AND status = 'active'` as { id: string; token: string }[]
  return raced[0]
}

export async function revokePaymentLink(sql: Sql, invoiceId: string, actor: string): Promise<boolean> {
  const rows = await sql`UPDATE money.payment_links SET status = 'revoked', revoked_at = now(), revoked_by = ${actor}
                         WHERE invoice_id = ${invoiceId}::uuid AND status = 'active' RETURNING id` as { id: string }[]
  return rows.length > 0
}

interface LinkedInvoice {
  link_id: string; link_status: string; invoice_id: string; invoice_number: string; client_name: string; client_email: string | null
  status: string; total: string; anzahlung: string | null; restbetrag: string | null; currency: string; due_date: string | null
  language: string; paid_amount: string
}

async function linkedInvoice(sql: Sql, token: string): Promise<LinkedInvoice | null> {
  if (!isPayToken(token)) return null
  const rows = await sql`
    SELECT l.id AS link_id, l.status AS link_status, i.id AS invoice_id, i.invoice_number, i.client_name, i.client_email, i.status,
           i.total, i.anzahlung, i.restbetrag, i.currency, i.due_date::text AS due_date, i.language,
           money.invoice_paid(i.id)::text AS paid_amount
    FROM money.payment_links l JOIN os_invoices i ON i.id = l.invoice_id WHERE l.token = ${token}` as LinkedInvoice[]
  return rows[0] ?? null
}

export type PayPageState =
  | { kind: 'unknown' }
  | { kind: 'unavailable'; reason: 'revoked' | 'draft' | 'cancelled'; number: string; language: 'de' | 'en' }
  | { kind: 'paid'; number: string; language: 'de' | 'en' }
  | { kind: 'open'; number: string; language: 'de' | 'en'; open: number; currency: string; dueDate: string | null; state: InvoiceState; processing: boolean }

/** What the public pay page may show. Deliberately little: number, amount, due date. */
export async function payPageState(sql: Sql, token: string, today: string, opened = false): Promise<PayPageState> {
  const inv = await linkedInvoice(sql, token)
  if (!inv) return { kind: 'unknown' }
  const language = inv.language === 'en' ? 'en' : 'de'
  if (inv.link_status !== 'active') return { kind: 'unavailable', reason: 'revoked', number: inv.invoice_number, language }
  if (inv.status === 'draft' || inv.status === 'cancelled') return { kind: 'unavailable', reason: inv.status, number: inv.invoice_number, language }
  if (opened) await sql`UPDATE money.payment_links SET opened_count = opened_count + 1, last_opened_at = now() WHERE id = ${inv.link_id}::uuid`
  const b = invoiceBalance({ ...inv, id: inv.invoice_id, paid_amount: inv.paid_amount }, today)
  if (b.open <= 0) return { kind: 'paid', number: inv.invoice_number, language }
  const processing = await sql`SELECT 1 FROM money.checkout_sessions WHERE invoice_id = ${inv.invoice_id}::uuid AND status = 'processing' LIMIT 1` as unknown[]
  return { kind: 'open', number: inv.invoice_number, language, open: b.open, currency: b.currency, dueDate: b.dueDate, state: b.state, processing: processing.length > 0 }
}

export type CheckoutResult =
  | { ok: true; url: string; reused: boolean }
  | { ok: false; reason: 'unknown' | 'unavailable' | 'paid' | 'not_connected' | 'busy' | 'uncertain' | 'refused' | 'amount' }

interface SessionRow { id: string; status: string; url: string | null; amount: string; currency: string; livemode: boolean; expires_at: Date | null; idempotency_key: string }

export async function startCheckout(sql: Sql, token: string, rail: StripeRail | null, today: string, now = new Date()): Promise<CheckoutResult> {
  const inv = await linkedInvoice(sql, token)
  if (!inv) return { ok: false, reason: 'unknown' }
  if (inv.link_status !== 'active' || inv.status === 'draft' || inv.status === 'cancelled') return { ok: false, reason: 'unavailable' }
  const b = invoiceBalance({ ...inv, id: inv.invoice_id, paid_amount: inv.paid_amount }, today)
  if (b.open <= 0) return { ok: false, reason: 'paid' }
  if (!rail) return { ok: false, reason: 'not_connected' }
  const currency = b.currency === 'GBP' ? 'GBP' : b.currency === 'EUR' ? 'EUR' : null
  if (!currency || toMinor(b.open) < 50) return { ok: false, reason: 'amount' }

  const sessions = await sql`
    SELECT id, status, url, amount, currency, livemode, expires_at, idempotency_key FROM money.checkout_sessions
    WHERE invoice_id = ${inv.invoice_id}::uuid AND status IN ('creating', 'uncertain', 'open')
    ORDER BY created_at DESC` as SessionRow[]
  const matches = (s: SessionRow) => Math.abs(Number(s.amount) - b.open) < 0.005 && s.currency === currency && s.livemode === rail.livemode
  const reusable = sessions.find(s => s.status === 'open' && s.url && matches(s) && s.expires_at && new Date(s.expires_at).getTime() - now.getTime() > REUSE_MARGIN_MS)
  if (reusable) return { ok: true, url: reusable.url!, reused: true }

  /* Sessions for an older amount (a part payment arrived, the invoice changed) are closed so the
     client cannot pay a stale amount. Best effort: Stripe also expires them on its own. */
  for (const s of sessions.filter(s => s.status === 'open' && s !== reusable)) {
    const ids = await sql`SELECT provider_session FROM money.checkout_sessions WHERE id = ${s.id}::uuid` as { provider_session: string | null }[]
    try { if (ids[0]?.provider_session) await rail.expireCheckoutSession(ids[0].provider_session) } catch { /* it expires by itself */ }
    await sql`UPDATE money.checkout_sessions SET status = 'cancelled', updated_at = now() WHERE id = ${s.id}::uuid AND status = 'open'`
  }

  // A creation still in flight (or unanswered) for the same amount is retried under its own key.
  let row = sessions.find(s => (s.status === 'creating' || s.status === 'uncertain') && matches(s))
  if (!row) {
    for (const stale of sessions.filter(s => s.status === 'creating' || s.status === 'uncertain')) {
      await sql`UPDATE money.checkout_sessions SET status = 'cancelled', updated_at = now() WHERE id = ${stale.id}::uuid AND status IN ('creating', 'uncertain')`
    }
    const id = crypto.randomUUID()
    const inserted = await sql`
      INSERT INTO money.checkout_sessions (id, link_id, invoice_id, amount, currency, livemode, idempotency_key, status)
      VALUES (${id}::uuid, ${inv.link_id}::uuid, ${inv.invoice_id}::uuid, ${b.open}, ${currency}, ${rail.livemode}, ${`mp-checkout:${id}`}, 'creating')
      ON CONFLICT (invoice_id) WHERE status IN ('creating', 'uncertain') DO NOTHING
      RETURNING id, status, url, amount, currency, livemode, expires_at, idempotency_key` as SessionRow[]
    if (!inserted[0]) return { ok: false, reason: 'busy' }
    row = inserted[0]
  }

  const language = inv.language === 'en' ? 'en' : 'de'
  const back = payUrl(token, language)
  try {
    const s = await rail.createCheckoutSession({
      amountMinor: toMinor(b.open), currency, invoiceId: inv.invoice_id, invoiceNumber: inv.invoice_number, sessionRowId: row.id,
      productName: language === 'de' ? `Rechnung ${inv.invoice_number}` : `Invoice ${inv.invoice_number}`,
      customerEmail: inv.client_email, locale: language, successUrl: `${back}?paid=1`, cancelUrl: back,
      expiresAt: Math.floor(now.getTime() / 1000) + SESSION_LIFETIME_S,
    }, row.idempotency_key)
    if (!s.url || s.livemode !== rail.livemode) throw new StripeRailError('failed', undefined, 'unexpected_session')
    await sql`UPDATE money.checkout_sessions SET status = 'open', provider_session = ${s.id}, url = ${s.url},
              expires_at = to_timestamp(${s.expires_at}), payment_intent = ${s.payment_intent}, updated_at = now()
              WHERE id = ${row.id}::uuid AND status IN ('creating', 'uncertain')`
    return { ok: true, url: s.url, reused: false }
  } catch (error) {
    if (error instanceof StripeRailError && error.outcome === 'uncertain') {
      await sql`UPDATE money.checkout_sessions SET status = 'uncertain', updated_at = now() WHERE id = ${row.id}::uuid AND status = 'creating'`
      return { ok: false, reason: 'uncertain' }
    }
    await sql`UPDATE money.checkout_sessions SET status = 'failed', failure_code = ${error instanceof StripeRailError ? error.code ?? `http_${error.status ?? 0}` : 'error'},
              updated_at = now() WHERE id = ${row.id}::uuid AND status IN ('creating', 'uncertain')`
    return { ok: false, reason: 'refused' }
  }
}
