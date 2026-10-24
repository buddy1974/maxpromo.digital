/**
 * Verified Stripe events → OS Money (ADR-0025). SERVER ONLY.
 *
 * The webhook route verifies the signature; this module records each event once and applies it.
 *
 *   receiveStripeEvent   insert into money.provider_events (primary key = event id). A duplicate
 *                        of a finished event does nothing. A redelivery of an event whose
 *                        processing never finished is processed again; one still in flight is
 *                        answered `busy` (the route says 409, Stripe retries later).
 *   processStripeEvent   applies one event. Every effect is idempotent on its own (unique
 *                        provider references), so processing an event twice changes nothing.
 *
 * Rules that protect the OS as the source of truth:
 *   - Money settles an invoice only through recordPaymentLocked, and only when the payment can be
 *     tied to a checkout session the OS created for that invoice, in that invoice's currency, in the
 *     same mode (test/live), without overpaying. Anything else is stored as an UNAPPLIED charge and
 *     surfaced for reconciliation — never written silently, never dropped.
 *   - Refunds and lost disputes become reversals (lib/money/ledger.ts), which reopen the invoice.
 *   - Stripe's own invoices, customers and products are never created or read as truth.
 *   - Only ids and amounts are stored from an event. Card details never reach the OS.
 */
import { recordPaymentLocked } from '@/lib/commercial/capabilities/documents'
import { writeAudit } from '@/lib/commercial/audit'
import { berlinDate } from '@/lib/commercial/money'
import { eur, logActivity } from '@/lib/commercial/records'
import type { Sql } from '@/lib/commercial/types'
import { recordReversal, reversalStatusFromStripe } from '../ledger'
import { fromMinor, type StripeRail } from './client'

export const STRIPE_ACTOR = 'stripe:webhook'
const CHANNEL = 'stripe'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** A processing attempt older than this is presumed dead and may be taken over. */
const CLAIM_STALE_SECONDS = 120

export interface StripeEvent { id: string; type: string; livemode: boolean; created: number; data: { object: Record<string, unknown> } }
export type EventOutcome = 'applied' | 'ignored' | 'reconcile' | 'failed'
export interface Applied { outcome: EventOutcome; invoiceId?: string | null; objectId?: string | null; note?: string; detail?: Record<string, unknown> }
export interface EventDeps { rail: StripeRail | null; now: Date }

const str = (v: unknown): string | null => (typeof v === 'string' && v.length <= 255 ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null)

/** Shape check of a parsed event body. Anything else is refused before it touches the database. */
export function parseStripeEvent(value: unknown): StripeEvent | null {
  const e = obj(value)
  if (!e || e.object !== 'event') return null
  const id = str(e.id), type = str(e.type), created = num(e.created), data = obj(e.data), object = obj(data?.object)
  if (!id || !/^evt_[A-Za-z0-9]{8,}$/.test(id) || !type || !/^[a-z_.]{3,80}$/.test(type) || created === null || !object || typeof e.livemode !== 'boolean') return null
  return { id, type, livemode: e.livemode, created, data: { object } }
}

export async function receiveStripeEvent(sql: Sql, event: StripeEvent, deps: EventDeps): Promise<{ status: 'processed' | 'duplicate' | 'busy'; outcome?: EventOutcome }> {
  const objectId = str(event.data.object.id)
  const inserted = await sql`
    INSERT INTO money.provider_events (provider, event_id, type, livemode, object_id)
    VALUES ('stripe', ${event.id}, ${event.type}, ${event.livemode}, ${objectId})
    ON CONFLICT (provider, event_id) DO NOTHING RETURNING event_id` as unknown[]
  if (!inserted.length) {
    const claimed = await sql`
      UPDATE money.provider_events SET attempts = attempts + 1, claimed_at = now(), outcome = 'received', error = NULL
      WHERE provider = 'stripe' AND event_id = ${event.id}
        AND (outcome = 'failed' OR (outcome = 'received' AND claimed_at < now() - make_interval(secs => ${CLAIM_STALE_SECONDS})))
      RETURNING event_id` as unknown[]
    if (!claimed.length) {
      const state = await sql`SELECT outcome FROM money.provider_events WHERE provider = 'stripe' AND event_id = ${event.id}` as { outcome: string }[]
      return state[0]?.outcome === 'received' ? { status: 'busy' } : { status: 'duplicate', outcome: state[0]?.outcome as EventOutcome }
    }
  }
  let result: Applied
  try {
    result = await processStripeEvent(sql, event, deps)
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : 'error'
    await sql`UPDATE money.provider_events SET outcome = 'failed', error = ${message} WHERE provider = 'stripe' AND event_id = ${event.id}`
    throw error
  }
  await sql`
    UPDATE money.provider_events SET outcome = ${result.outcome}, invoice_id = ${result.invoiceId ?? null}::uuid,
           object_id = coalesce(${result.objectId ?? null}, object_id), applied_at = now(),
           detail = ${JSON.stringify({ ...(result.detail ?? {}), ...(result.note ? { note: result.note } : {}) })}::jsonb
    WHERE provider = 'stripe' AND event_id = ${event.id}`
  return { status: 'processed', outcome: result.outcome }
}

export async function processStripeEvent(sql: Sql, event: StripeEvent, deps: EventDeps): Promise<Applied> {
  const o = event.data.object
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      return sessionEvent(sql, event, o)
    case 'charge.succeeded':
      return chargeSucceeded(sql, event, o, deps)
    case 'charge.updated':
      return chargeUpdated(sql, o, deps)
    case 'payment_intent.succeeded':
      return intentSucceeded(sql, event, o)
    case 'payment_intent.payment_failed':
      return intentFailed(sql, o)
    case 'refund.created': case 'refund.updated': case 'refund.failed': case 'charge.refund.updated':
      return refundEvent(sql, event, o)
    case 'charge.refunded':
      return chargeRefunded(sql, event, o, deps)
    case 'charge.dispute.created': case 'charge.dispute.updated': case 'charge.dispute.closed':
    case 'charge.dispute.funds_withdrawn': case 'charge.dispute.funds_reinstated':
      return disputeEvent(sql, event, o)
    case 'payout.created': case 'payout.updated': case 'payout.paid': case 'payout.failed': case 'payout.canceled':
      return payoutEvent(sql, event, o, deps)
    default:
      return { outcome: 'ignored', note: 'event type not used by Maxpromo' }
  }
}

/* ── sessions ─────────────────────────────────────────────────────────── */

interface SessionRow { id: string; invoice_id: string; amount: string; currency: string; livemode: boolean; status: string; payment_intent: string | null }

async function sessionFor(sql: Sql, ref: { session?: string | null; intent?: string | null; row?: string | null }): Promise<SessionRow | null> {
  if (ref.session) {
    const r = await sql`SELECT id, invoice_id, amount, currency, livemode, status, payment_intent FROM money.checkout_sessions WHERE provider_session = ${ref.session}` as SessionRow[]
    if (r[0]) return r[0]
  }
  if (ref.intent) {
    const r = await sql`SELECT id, invoice_id, amount, currency, livemode, status, payment_intent FROM money.checkout_sessions WHERE payment_intent = ${ref.intent}` as SessionRow[]
    if (r[0]) return r[0]
  }
  if (ref.row && UUID.test(ref.row)) {
    const r = await sql`SELECT id, invoice_id, amount, currency, livemode, status, payment_intent FROM money.checkout_sessions WHERE id = ${ref.row}::uuid` as SessionRow[]
    if (r[0]) return r[0]
  }
  return null
}

const metadataOf = (o: Record<string, unknown>) => obj(o.metadata) ?? {}

async function sessionEvent(sql: Sql, event: StripeEvent, o: Record<string, unknown>): Promise<Applied> {
  const sessionId = str(o.id), intent = str(o.payment_intent), meta = metadataOf(o)
  const s = await sessionFor(sql, { session: sessionId, intent, row: str(meta.session_row) })
  if (!s) return { outcome: 'reconcile', objectId: sessionId, note: 'checkout session not created by Maxpromo OS', detail: { session: sessionId, invoice_ref: str(meta.invoice_id) } }
  if (s.livemode !== event.livemode) return { outcome: 'reconcile', invoiceId: s.invoice_id, objectId: sessionId, note: 'mode mismatch' }
  await sql`UPDATE money.checkout_sessions SET provider_session = coalesce(provider_session, ${sessionId}), payment_intent = coalesce(payment_intent, ${intent}), updated_at = now() WHERE id = ${s.id}::uuid`
  const paymentStatus = str(o.payment_status)
  if (event.type === 'checkout.session.expired') {
    await sql`UPDATE money.checkout_sessions SET status = 'expired', updated_at = now() WHERE id = ${s.id}::uuid AND status IN ('open', 'creating', 'uncertain')`
    return { outcome: 'applied', invoiceId: s.invoice_id, objectId: sessionId }
  }
  if (event.type === 'checkout.session.async_payment_failed') {
    await sql`UPDATE money.checkout_sessions SET status = 'failed', failure_code = 'async_payment_failed', updated_at = now() WHERE id = ${s.id}::uuid AND status <> 'paid'`
    return { outcome: 'applied', invoiceId: s.invoice_id, objectId: sessionId, note: 'delayed payment failed' }
  }
  if (paymentStatus !== 'paid') {
    // Completed but not yet paid: a delayed method (e.g. SEPA debit) is processing.
    await sql`UPDATE money.checkout_sessions SET status = 'processing', updated_at = now() WHERE id = ${s.id}::uuid AND status IN ('open', 'creating', 'uncertain')`
    return { outcome: 'applied', invoiceId: s.invoice_id, objectId: sessionId, note: 'payment processing' }
  }
  const amount = num(o.amount_total), currency = str(o.currency)?.toUpperCase() ?? null
  if (!intent || amount === null || !currency) return { outcome: 'reconcile', invoiceId: s.invoice_id, objectId: sessionId, note: 'paid session without amount or payment intent' }
  return applyPayment(sql, event, { session: s, intent, chargeId: null, amount: fromMinor(amount), currency, methodType: null, invoiceRef: str(meta.invoice_id) })
}

/* ── payments ─────────────────────────────────────────────────────────── */

interface PaymentFacts { session: SessionRow | null; intent: string; chargeId: string | null; amount: number; currency: string; methodType: string | null; invoiceRef: string | null; balanceTxn?: string | null }

async function unapplied(sql: Sql, event: StripeEvent, f: PaymentFacts, invoiceId: string | null, reason: string): Promise<Applied> {
  if (f.chargeId) {
    await sql`
      INSERT INTO money.charges (provider_charge, payment_intent, session_id, invoice_id, gross, currency, method_type, livemode, state, unapplied_reason)
      VALUES (${f.chargeId}, ${f.intent}, ${f.session?.id ?? null}::uuid, ${invoiceId}::uuid, ${f.amount}, ${f.currency}, ${f.methodType}, ${event.livemode}, 'unapplied', ${reason})
      ON CONFLICT (provider_charge) DO NOTHING`
  }
  await writeAudit(sql, { actor: STRIPE_ACTOR, channel: CHANNEL, operation: 'payment.provider.unapplied', entityType: 'invoice', entityId: invoiceId ?? undefined,
    after: { amount: f.amount, currency: f.currency, reason }, outcome: 'refused', externalRef: f.intent })
  return { outcome: 'reconcile', invoiceId, objectId: f.intent, note: reason, detail: { amount: f.amount, currency: f.currency } }
}

async function applyPayment(sql: Sql, event: StripeEvent, f: PaymentFacts): Promise<Applied> {
  const s = f.session
  if (!s) return unapplied(sql, event, f, f.invoiceRef && UUID.test(f.invoiceRef) ? f.invoiceRef : null, 'payment not tied to a Maxpromo checkout session')
  if (f.invoiceRef && f.invoiceRef !== s.invoice_id) return unapplied(sql, event, f, s.invoice_id, 'payment names a different invoice than its session')
  if (s.livemode !== event.livemode) return unapplied(sql, event, f, s.invoice_id, 'test/live mode mismatch')

  const existing = await sql`SELECT id FROM os_payments WHERE provider = 'stripe' AND provider_ref = ${f.intent}` as { id: string }[]
  let paymentId: string | null = existing[0]?.id ?? null
  const invRows = await sql`SELECT id, invoice_number, client_id, job_id, currency, status, total, anzahlung, restbetrag FROM os_invoices WHERE id = ${s.invoice_id}::uuid` as
    { id: string; invoice_number: string; client_id: string | null; job_id: string | null; currency: string; status: string; total: string; anzahlung: string | null; restbetrag: string | null }[]
  const inv = invRows[0]
  if (!inv) return unapplied(sql, event, f, null, 'invoice no longer exists')

  if (!paymentId) {
    if (inv.currency !== f.currency) return unapplied(sql, event, f, inv.id, `currency ${f.currency} differs from invoice currency ${inv.currency}`)
    if (inv.status === 'cancelled') return unapplied(sql, event, f, inv.id, 'invoice is cancelled')
    const receivedOn = berlinDate(new Date(event.created * 1000))
    paymentId = await recordPaymentLocked(sql, inv, {
      amount: f.amount, currency: f.currency, receivedOn, method: 'Stripe', reference: `Stripe ${f.intent}`,
      actor: STRIPE_ACTOR, approvalId: null, provider: 'stripe', providerRef: f.intent,
    })
    if (!paymentId) {
      const raced = await sql`SELECT id FROM os_payments WHERE provider = 'stripe' AND provider_ref = ${f.intent}` as { id: string }[]
      paymentId = raced[0]?.id ?? null
      if (!paymentId) return unapplied(sql, event, f, inv.id, 'payment would overpay the invoice (already paid another way?)')
    } else {
      await logActivity(sql, { client_id: inv.client_id, job_id: inv.job_id, invoice_id: inv.id, kind: 'payment_received', channel: 'stripe', actor: STRIPE_ACTOR,
        summary: `${eur(f.amount, f.currency)} received by card on ${inv.invoice_number}`, external_ref: f.intent }).catch(() => undefined)
      await writeAudit(sql, { actor: STRIPE_ACTOR, channel: CHANNEL, operation: 'payment.provider.record', entityType: 'invoice', entityId: inv.id,
        before: { status: inv.status }, after: { amount: f.amount, currency: f.currency, payment_id: paymentId }, outcome: 'succeeded', externalRef: f.intent })
    }
  }
  await sql`UPDATE money.checkout_sessions SET status = 'paid', payment_intent = coalesce(payment_intent, ${f.intent}), method_type = coalesce(${f.methodType}, method_type), updated_at = now()
            WHERE id = ${s.id}::uuid AND status <> 'paid'`
  if (f.chargeId) {
    await sql`
      INSERT INTO money.charges (provider_charge, payment_intent, session_id, invoice_id, payment_id, gross, currency, method_type, balance_txn, livemode, state)
      VALUES (${f.chargeId}, ${f.intent}, ${s.id}::uuid, ${inv.id}::uuid, ${paymentId}::uuid, ${f.amount}, ${f.currency}, ${f.methodType}, ${f.balanceTxn ?? null}, ${event.livemode}, 'applied')
      ON CONFLICT (provider_charge) DO UPDATE SET payment_id = coalesce(money.charges.payment_id, EXCLUDED.payment_id),
        state = CASE WHEN coalesce(money.charges.payment_id, EXCLUDED.payment_id) IS NOT NULL THEN 'applied' ELSE money.charges.state END,
        balance_txn = coalesce(money.charges.balance_txn, EXCLUDED.balance_txn), method_type = coalesce(money.charges.method_type, EXCLUDED.method_type), updated_at = now()`
  }
  return { outcome: 'applied', invoiceId: inv.id, objectId: f.chargeId ?? f.intent, detail: { amount: f.amount, currency: f.currency } }
}

/** Fee, net and availability from the balance transaction, when the rail can be asked. */
async function fillFee(sql: Sql, chargeId: string, balanceTxn: string | null, rail: StripeRail | null): Promise<void> {
  if (!balanceTxn || !rail) return
  try {
    const t = await rail.retrieveBalanceTransaction(balanceTxn)
    await sql`UPDATE money.charges SET balance_txn = ${t.id}, fee = ${fromMinor(t.fee)}, net = ${fromMinor(t.amount - t.fee)},
              available_on = to_timestamp(${t.available_on})::date, updated_at = now()
              WHERE provider_charge = ${chargeId} AND fee IS NULL AND gross = ${fromMinor(t.amount)}`
  } catch { /* the fee stays unknown until the next charge.updated or payout sync */ }
}

function chargeFacts(o: Record<string, unknown>): { chargeId: string | null; intent: string | null; amount: number | null; currency: string | null; methodType: string | null; balanceTxn: string | null; meta: Record<string, unknown> } {
  return {
    chargeId: str(o.id), intent: str(o.payment_intent), amount: num(o.amount), currency: str(o.currency)?.toUpperCase() ?? null,
    methodType: str(obj(o.payment_method_details)?.type), balanceTxn: str(o.balance_transaction), meta: metadataOf(o),
  }
}

async function chargeSucceeded(sql: Sql, event: StripeEvent, o: Record<string, unknown>, deps: EventDeps): Promise<Applied> {
  const c = chargeFacts(o)
  if (!c.chargeId || !c.intent || c.amount === null || !c.currency) return { outcome: 'reconcile', objectId: c.chargeId, note: 'charge without payment intent or amount' }
  const s = await sessionFor(sql, { intent: c.intent, row: str(c.meta.session_row) })
  const r = await applyPayment(sql, event, { session: s, intent: c.intent, chargeId: c.chargeId, amount: fromMinor(c.amount), currency: c.currency, methodType: c.methodType, invoiceRef: str(c.meta.invoice_id), balanceTxn: c.balanceTxn })
  await fillFee(sql, c.chargeId, c.balanceTxn, deps.rail)
  return r
}

async function chargeUpdated(sql: Sql, o: Record<string, unknown>, deps: EventDeps): Promise<Applied> {
  const c = chargeFacts(o)
  if (!c.chargeId) return { outcome: 'ignored' }
  const known = await sql`SELECT invoice_id FROM money.charges WHERE provider_charge = ${c.chargeId}` as { invoice_id: string | null }[]
  if (!known[0]) return { outcome: 'ignored', objectId: c.chargeId, note: 'charge not known yet' }
  await fillFee(sql, c.chargeId, c.balanceTxn, deps.rail)
  return { outcome: 'applied', invoiceId: known[0].invoice_id, objectId: c.chargeId }
}

async function intentSucceeded(sql: Sql, event: StripeEvent, o: Record<string, unknown>): Promise<Applied> {
  const intent = str(o.id), amount = num(o.amount_received), currency = str(o.currency)?.toUpperCase() ?? null, meta = metadataOf(o)
  const chargeId = str(o.latest_charge)
  if (!intent || amount === null || !currency) return { outcome: 'reconcile', objectId: intent, note: 'payment intent without amount' }
  const s = await sessionFor(sql, { intent, row: str(meta.session_row) })
  return applyPayment(sql, event, { session: s, intent, chargeId, amount: fromMinor(amount), currency, methodType: null, invoiceRef: str(meta.invoice_id) })
}

async function intentFailed(sql: Sql, o: Record<string, unknown>): Promise<Applied> {
  const intent = str(o.id), meta = metadataOf(o)
  const code = str(obj(o.last_payment_error)?.code) ?? str(obj(o.last_payment_error)?.decline_code) ?? 'payment_failed'
  const s = await sessionFor(sql, { intent, row: str(meta.session_row) })
  if (!s) return { outcome: 'ignored', objectId: intent, note: 'failed attempt outside Maxpromo checkout' }
  // The client may try another card in the same session; the attempt is recorded, the session stays open.
  await sql`UPDATE money.checkout_sessions SET failure_code = ${code.slice(0, 80)}, payment_intent = coalesce(payment_intent, ${intent}), updated_at = now() WHERE id = ${s.id}::uuid`
  return { outcome: 'applied', invoiceId: s.invoice_id, objectId: intent, note: `attempt failed: ${code}` }
}

/* ── refunds ──────────────────────────────────────────────────────────── */

async function applyRefund(sql: Sql, event: StripeEvent, r: { id: string; amount: number; currency: string; status: string; intent: string | null; reason: string | null }): Promise<Applied> {
  const pay = r.intent ? await sql`SELECT id, invoice_id FROM os_payments WHERE provider = 'stripe' AND provider_ref = ${r.intent}` as { id: string; invoice_id: string }[] : []
  if (!pay[0]) return { outcome: 'reconcile', objectId: r.id, note: 'refund of a payment the OS did not record', detail: { amount: fromMinor(r.amount), currency: r.currency } }
  const out = await recordReversal(sql, {
    paymentId: pay[0].id, kind: 'refund', amount: fromMinor(r.amount), currency: r.currency, status: reversalStatusFromStripe(r.status),
    provider: 'stripe', providerRef: r.id, reason: r.reason, effectiveOn: berlinDate(new Date(event.created * 1000)), actor: STRIPE_ACTOR,
  })
  if (!out.id) return { outcome: 'reconcile', invoiceId: pay[0].invoice_id, objectId: r.id, note: `refund not applied: ${out.refused}` }
  await writeAudit(sql, { actor: STRIPE_ACTOR, channel: CHANNEL, operation: 'payment.provider.refund', entityType: 'invoice', entityId: pay[0].invoice_id,
    after: { amount: fromMinor(r.amount), currency: r.currency, status: r.status, reopened: out.reopened }, outcome: 'succeeded', externalRef: r.id })
  return { outcome: 'applied', invoiceId: pay[0].invoice_id, objectId: r.id, detail: { amount: fromMinor(r.amount), status: r.status, reopened: out.reopened } }
}

async function refundEvent(sql: Sql, event: StripeEvent, o: Record<string, unknown>): Promise<Applied> {
  const id = str(o.id), amount = num(o.amount), currency = str(o.currency)?.toUpperCase() ?? null
  if (!id || !id.startsWith('re_') || amount === null || !currency) return { outcome: 'reconcile', objectId: id, note: 'refund without id or amount' }
  return applyRefund(sql, event, { id, amount, currency, status: str(o.status) ?? 'pending', intent: str(o.payment_intent), reason: str(o.reason) })
}

async function chargeRefunded(sql: Sql, event: StripeEvent, o: Record<string, unknown>, deps: EventDeps): Promise<Applied> {
  const c = chargeFacts(o)
  // The refund objects are not part of this event since API 2022-11-15; ask for them.
  if (!c.chargeId || !deps.rail) return { outcome: 'reconcile', objectId: c.chargeId, note: 'charge refunded; refunds could not be listed', detail: { amount_refunded: num(o.amount_refunded) } }
  const refunds = await deps.rail.listRefunds(c.chargeId)
  let last: Applied = { outcome: 'ignored', objectId: c.chargeId }
  for (const r of refunds) last = await applyRefund(sql, event, { id: r.id, amount: r.amount, currency: r.currency, status: r.status, intent: r.payment_intent ?? c.intent, reason: null })
  return last
}

/* ── disputes ─────────────────────────────────────────────────────────── */

async function disputeEvent(sql: Sql, event: StripeEvent, o: Record<string, unknown>): Promise<Applied> {
  const id = str(o.id), charge = str(o.charge), amount = num(o.amount), currency = str(o.currency)?.toUpperCase() ?? null, status = str(o.status) ?? 'needs_response'
  if (!id || !charge || amount === null || !currency) return { outcome: 'reconcile', objectId: id, note: 'dispute without charge or amount' }
  const known = await sql`SELECT invoice_id, payment_id, payment_intent FROM money.charges WHERE provider_charge = ${charge}` as { invoice_id: string | null; payment_id: string | null; payment_intent: string }[]
  const invoiceId = known[0]?.invoice_id ?? null
  const due = num(obj(o.evidence_details)?.due_by)
  await sql`
    INSERT INTO money.disputes (provider_dispute, provider_charge, invoice_id, amount, currency, reason, status, evidence_due, livemode)
    VALUES (${id}, ${charge}, ${invoiceId}::uuid, ${fromMinor(amount)}, ${currency}, ${str(o.reason)}, ${status}, ${due ? new Date(due * 1000).toISOString() : null}::timestamptz, ${event.livemode})
    ON CONFLICT (provider_dispute) DO UPDATE SET status = EXCLUDED.status, evidence_due = coalesce(EXCLUDED.evidence_due, money.disputes.evidence_due),
      invoice_id = coalesce(money.disputes.invoice_id, EXCLUDED.invoice_id), updated_at = now()`
  let reopened = false
  if (status === 'lost' && known[0]?.payment_id) {
    const out = await recordReversal(sql, {
      paymentId: known[0].payment_id, kind: 'chargeback', amount: fromMinor(amount), currency, status: 'succeeded', provider: 'stripe', providerRef: id,
      reason: str(o.reason), effectiveOn: berlinDate(new Date(event.created * 1000)), actor: STRIPE_ACTOR,
    })
    reopened = out.reopened
  }
  await writeAudit(sql, { actor: STRIPE_ACTOR, channel: CHANNEL, operation: 'payment.provider.dispute', entityType: 'invoice', entityId: invoiceId ?? undefined,
    after: { status, amount: fromMinor(amount), currency, reopened }, outcome: 'succeeded', externalRef: id })
  if (!known[0]) return { outcome: 'reconcile', objectId: id, note: 'dispute on a charge the OS does not know' }
  return { outcome: 'applied', invoiceId, objectId: id, detail: { status, reopened } }
}

/* ── payouts ──────────────────────────────────────────────────────────── */

const PAYOUT_STATUS = new Set(['pending', 'in_transit', 'paid', 'failed', 'canceled'])

async function payoutEvent(sql: Sql, event: StripeEvent, o: Record<string, unknown>, deps: EventDeps): Promise<Applied> {
  const id = str(o.id), amount = num(o.amount), currency = str(o.currency)?.toUpperCase() ?? null, status = str(o.status) ?? ''
  if (!id || !id.startsWith('po_') || amount === null || !currency || !PAYOUT_STATUS.has(status)) return { outcome: 'reconcile', objectId: id, note: 'payout without id, amount or known status' }
  const arrival = num(o.arrival_date)
  await sql`
    INSERT INTO money.payouts (provider_payout, amount, currency, arrival_date, status, failure_code, livemode)
    VALUES (${id}, ${fromMinor(amount)}, ${currency}, ${arrival ? new Date(arrival * 1000).toISOString().slice(0, 10) : null}::date, ${status}, ${str(o.failure_code)}, ${event.livemode})
    ON CONFLICT (provider_payout) DO UPDATE SET status = EXCLUDED.status, arrival_date = coalesce(EXCLUDED.arrival_date, money.payouts.arrival_date),
      failure_code = EXCLUDED.failure_code, updated_at = now()`
  if (status === 'paid' && deps.rail) {
    // Which charges this payout carried: the bridge from a card payment to the Revolut statement.
    try {
      for (const t of await deps.rail.listPayoutTransactions(id)) {
        if (t.source) await sql`UPDATE money.charges SET payout_id = ${id}, fee = coalesce(fee, ${fromMinor(t.fee)}),
                                net = coalesce(net, ${fromMinor(t.amount - t.fee)}), balance_txn = coalesce(balance_txn, ${t.id}), updated_at = now()
                                WHERE provider_charge = ${t.source} AND (fee IS NOT NULL OR gross = ${fromMinor(t.amount)})`
      }
    } catch { /* linking is retried by the next payout.updated or by the owner's reconcile view */ }
  }
  return { outcome: 'applied', objectId: id, detail: { status, amount: fromMinor(amount), currency } }
}
