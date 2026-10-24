/**
 * Money rail against a REAL Postgres: the evidence database (ADR-0025). Every lock, unique index,
 * ON CONFLICT and money.invoice_paid() runs for real; only Stripe is a fake rail. Refuses to run
 * anywhere but the evidence database. Creates its own EVD invoices and removes what it created
 * (os_audit is append-only and keeps its rows, as it must).
 *
 *   node --env-file=apps/web/.env.local --experimental-transform-types --import ./apps/web/scripts/control-planes/alias-register.mjs apps/web/scripts/money/prove-money-evidence.ts
 */
import assert from 'node:assert/strict'
import { evidenceDbProblem, EVIDENCE_DOC_PREFIX } from '../../../../packages/config/evidence.ts'
import { getDb } from '../../lib/db.ts'
import { ensurePaymentLink, revokePaymentLink, startCheckout, payPageState } from '../../lib/money/links.ts'
import { receiveStripeEvent, type StripeEvent } from '../../lib/money/stripe/events.ts'
import { recordReversal } from '../../lib/money/ledger.ts'
import { railIssues } from '../../lib/money/attention.ts'
import { invoiceMoney, moneySnapshot } from '../../lib/money/state.ts'
import { StripeRailError, type StripeRail, type CheckoutSessionInput } from '../../lib/money/stripe/client.ts'
import { runCapability, executeApproval } from '../../lib/commercial/engine.ts'
import { invoiceBalance } from '../../lib/commercial/money.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('prove-money-evidence: refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }
const sql = getDb()
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })

let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }

/* ── fake rail: records calls, answers like Stripe test mode ── */
const railCalls: { op: string; key?: string; input?: CheckoutSessionInput }[] = []
let failNext: 'uncertain' | 'failed' | null = null
let seq = 0
const rail: StripeRail = {
  mode: 'test', livemode: false,
  async createCheckoutSession(input, key) {
    railCalls.push({ op: 'create', key, input })
    if (failNext) { const f = failNext; failNext = null; throw new StripeRailError(f, f === 'uncertain' ? 504 : 400) }
    // Stripe idempotency: the same key returns the same session.
    const prior = railCalls.find(c => c.op === 'create' && c.key === key && c !== railCalls.at(-1))
    const id = prior ? `cs_test_${key!.slice(-12).replace(/-/g, '')}` : `cs_test_${key!.slice(-12).replace(/-/g, '')}`
    return { id, url: `https://checkout.stripe.com/c/pay/${id}`, status: 'open', expires_at: input.expiresAt, payment_intent: null, livemode: false }
  },
  async expireCheckoutSession(id) { railCalls.push({ op: `expire:${id}` }) },
  async retrieveBalanceTransaction(id) { railCalls.push({ op: `txn:${id}` }); return { id, amount: 15600, fee: 243, net: 15357, currency: 'EUR', available_on: 1_800_000_000, type: 'charge', source: null } },
  async createRefund(r, key) { railCalls.push({ op: 'refund', key }); return { id: `re_test${++seq}abcdef`, status: 'succeeded', amount: r.amountMinor, currency: 'EUR', charge: null, payment_intent: r.paymentIntent } },
  async listRefunds() { return [] },
  async listPayoutTransactions(payoutId) { railCalls.push({ op: `payout:${payoutId}` }); return [{ id: 'txn_pay1abcdef', amount: 15600, fee: 243, net: 15357, currency: 'EUR', available_on: 0, type: 'charge', source: chargeId }] },
}

const created: string[] = []
const tag = Date.now().toString(36).toUpperCase()
async function invoice(n: string, total: number, currency = 'EUR', status = 'sent'): Promise<string> {
  const rows = await sql`INSERT INTO os_invoices (invoice_number, client_name, client_email, line_items, subtotal, total, restbetrag, status, due_date, currency, language)
    VALUES (${`${EVIDENCE_DOC_PREFIX}PM${tag}${n}`}, 'Proof Kunde — Proof GmbH', 'proof@example.test', ${JSON.stringify([{ description: 'Proof', qty: 1, unit_price: total, total }])}::jsonb,
            ${total}, ${total}, ${total}, ${status}, ${today}::date, ${currency}, 'de') RETURNING id` as { id: string }[]
  created.push(rows[0].id)
  return rows[0].id
}
const balance = async (id: string) => {
  const r = await sql`SELECT i.*, money.invoice_paid(i.id)::text AS paid_amount FROM os_invoices i WHERE id = ${id}::uuid` as Parameters<typeof invoiceBalance>[0][]
  return { ...invoiceBalance(r[0], today), status: r[0].status }
}
let evtN = 0
const event = (type: string, object: Record<string, unknown>, livemode = false): StripeEvent => ({ id: `evt_proof${tag}${++evtN}x`, type, livemode, created: Math.floor(Date.now() / 1000), data: { object } })
const deps = { rail, now: new Date() }
let chargeId = ''

try {
  /* ── payment request ── */
  const A = await invoice('A', 156)
  const link = await ensurePaymentLink(sql, A, 'os:marcel')
  check('one stable link per invoice: asking twice returns the same link', (await ensurePaymentLink(sql, A, 'os:marcel')).token === link.token)
  const linkRace = await Promise.all([1, 2, 3].map(() => ensurePaymentLink(sql, A, 'os:marcel')))
  check('concurrent link creation still yields one active link', new Set(linkRace.map(l => l.token)).size === 1 &&
    Number((await sql`SELECT count(*)::int AS n FROM money.payment_links WHERE invoice_id = ${A}::uuid AND status = 'active'` as { n: number }[])[0].n) === 1)
  const page = await payPageState(sql, link.token, today)
  check('the pay page shows the open balance and nothing else of the client', page.kind === 'open' && page.open === 156 && page.currency === 'EUR' && !JSON.stringify(page).includes('Proof Kunde'))
  check('an unknown token shows nothing', (await payPageState(sql, 'Z'.repeat(32), today)).kind === 'unknown')
  check('without a connected rail, checkout says "not connected" and calls nothing', (await startCheckout(sql, link.token, null, today)).ok === false && railCalls.length === 0)

  /* ── payment attempt ── */
  const c1 = await startCheckout(sql, link.token, rail, today)
  check('a checkout is created for the open balance in minor units', c1.ok && railCalls[0].input!.amountMinor === 15600 && railCalls[0].input!.currency === 'EUR')
  const c2 = await startCheckout(sql, link.token, rail, today)
  check('a second click reuses the open session instead of opening another', c2.ok && (c2 as { reused: boolean }).reused && railCalls.filter(c => c.op === 'create').length === 1)
  const sessionRow = (await sql`SELECT id, provider_session FROM money.checkout_sessions WHERE invoice_id = ${A}::uuid AND status = 'open'` as { id: string; provider_session: string }[])[0]
  check('the session row was written before the call and carries the call’s idempotency key', railCalls[0].key === `mp-checkout:${sessionRow.id}` && railCalls[0].input!.sessionRowId === sessionRow.id)

  const B = await invoice('B', 80)
  const linkB = await ensurePaymentLink(sql, B, 'os:marcel')
  failNext = 'uncertain'
  check('an unanswered create is "uncertain", nothing is shown as paid', (await startCheckout(sql, linkB.token, rail, today) as { reason?: string }).reason === 'uncertain')
  const uncertainKey = railCalls.at(-1)!.key
  const retry = await startCheckout(sql, linkB.token, rail, today)
  check('the next click retries under the SAME idempotency key (Stripe returns the same session)', retry.ok && railCalls.at(-1)!.key === uncertainKey)
  failNext = 'failed'
  await sql`UPDATE money.checkout_sessions SET status = 'expired' WHERE invoice_id = ${B}::uuid`
  check('a refused create reports "refused" and records the failure', (await startCheckout(sql, linkB.token, rail, today) as { reason?: string }).reason === 'refused' &&
    (await sql`SELECT count(*)::int AS n FROM money.checkout_sessions WHERE invoice_id = ${B}::uuid AND status = 'failed'` as { n: number }[])[0].n === 1)

  /* ── verified events → payment ── */
  chargeId = `ch_proof${tag}a`
  const pi = `pi_proof${tag}a`
  const charge = event('charge.succeeded', { id: chargeId, payment_intent: pi, amount: 15600, currency: 'eur', balance_transaction: 'txn_proof1abcdef', payment_method_details: { type: 'card' },
    metadata: { invoice_id: A, session_row: sessionRow.id, invoice_number: 'x' } })
  const r1 = await receiveStripeEvent(sql, charge, deps)
  const bA = await balance(A)
  check('a verified card payment settles the invoice through the one payment path', r1.outcome === 'applied' && bA.open === 0 && bA.status === 'paid')
  const pay = (await sql`SELECT id, provider, provider_ref, method FROM os_payments WHERE invoice_id = ${A}::uuid` as { id: string; provider: string; provider_ref: string; method: string }[])
  check('the receipt is ONE os_payments row with provider=stripe and the payment intent as reference', pay.length === 1 && pay[0].provider === 'stripe' && pay[0].provider_ref === pi)
  const ch = (await sql`SELECT state, fee, net, payment_id FROM money.charges WHERE provider_charge = ${chargeId}` as { state: string; fee: string; net: string; payment_id: string }[])[0]
  check('the charge keeps fee and net beside the payment; fees never reduce what the client owed', ch.state === 'applied' && Number(ch.fee) === 2.43 && Number(ch.net) === 153.57 && ch.payment_id === pay[0].id)
  check('a duplicate delivery of the same event does nothing', (await receiveStripeEvent(sql, charge, deps)).status === 'duplicate' && (await sql`SELECT count(*)::int AS n FROM os_payments WHERE invoice_id = ${A}::uuid` as { n: number }[])[0].n === 1)
  const sameIntent = await Promise.all([
    receiveStripeEvent(sql, event('payment_intent.succeeded', { id: pi, amount_received: 15600, currency: 'eur', latest_charge: chargeId, metadata: { invoice_id: A, session_row: sessionRow.id } }), deps),
    receiveStripeEvent(sql, event('checkout.session.completed', { id: sessionRow.provider_session, payment_intent: pi, payment_status: 'paid', amount_total: 15600, currency: 'eur', metadata: { invoice_id: A, session_row: sessionRow.id } }), deps),
  ])
  check('other events for the same payment (intent, session) arriving concurrently record nothing twice', sameIntent.every(r => r.outcome === 'applied') &&
    (await sql`SELECT count(*)::int AS n FROM os_payments WHERE invoice_id = ${A}::uuid` as { n: number }[])[0].n === 1)
  check('the session is marked paid', (await sql`SELECT status FROM money.checkout_sessions WHERE id = ${sessionRow.id}::uuid` as { status: string }[])[0].status === 'paid')
  check('the pay page now says paid', (await payPageState(sql, link.token, today)).kind === 'paid')
  check('a paid invoice opens no new checkout', (await startCheckout(sql, link.token, rail, today) as { reason?: string }).reason === 'paid')

  /* ── money that settles nothing is never written silently ── */
  const C = await invoice('C', 50)
  const stray = await receiveStripeEvent(sql, event('charge.succeeded', { id: `ch_proof${tag}stray`, payment_intent: `pi_proof${tag}stray`, amount: 5000, currency: 'eur', metadata: { invoice_id: C } }), deps)
  check('a payment not tied to a Maxpromo checkout session is "reconcile", not recorded', stray.outcome === 'reconcile' && (await balance(C)).open === 50)
  const D = await invoice('D', 40, 'GBP')
  const linkD = await ensurePaymentLink(sql, D, 'os:marcel')
  await startCheckout(sql, linkD.token, rail, today)
  const rowD = (await sql`SELECT id FROM money.checkout_sessions WHERE invoice_id = ${D}::uuid` as { id: string }[])[0]
  const wrongCur = await receiveStripeEvent(sql, event('charge.succeeded', { id: `ch_proof${tag}cur`, payment_intent: `pi_proof${tag}cur`, amount: 4000, currency: 'eur', metadata: { invoice_id: D, session_row: rowD.id } }), deps)
  check('a currency that differs from the invoice is "reconcile", never converted', wrongCur.outcome === 'reconcile' && (await balance(D)).open === 40)
  const twice = await receiveStripeEvent(sql, event('charge.succeeded', { id: `ch_proof${tag}dbl`, payment_intent: `pi_proof${tag}dbl`, amount: 15600, currency: 'eur', metadata: { invoice_id: A, session_row: sessionRow.id } }), deps)
  check('a second payment that would overpay is held as unapplied money, not recorded', twice.outcome === 'reconcile' &&
    (await sql`SELECT state FROM money.charges WHERE provider_charge = ${`ch_proof${tag}dbl`}` as { state: string }[])[0].state === 'unapplied')
  const live = await receiveStripeEvent(sql, event('charge.succeeded', { id: `ch_proof${tag}live`, payment_intent: `pi_proof${tag}live`, amount: 5000, currency: 'eur', metadata: { invoice_id: C, session_row: rowD.id } }, true), deps)
  check('a live event against a test session is "reconcile"', live.outcome === 'reconcile')
  const issues = await railIssues(sql)
  check('unapplied money appears in attention, once per charge', issues.filter(i => i.id === `ch_proof${tag}dbl`).length === 1 && issues.some(i => i.kind === 'unapplied' && i.amount === 50))

  /* ── refunds reopen the invoice ── */
  const refund = await receiveStripeEvent(sql, event('refund.updated', { id: `re_proof${tag}a`, amount: 5600, currency: 'eur', status: 'succeeded', payment_intent: pi, charge: chargeId }), deps)
  const afterRefund = await balance(A)
  check('a Stripe refund is a reversal: net received drops and the paid invoice reopens', refund.outcome === 'applied' && afterRefund.open === 56 && afterRefund.status === 'sent')
  check('the receipt row itself is untouched', (await sql`SELECT amount FROM os_payments WHERE id = ${pay[0].id}::uuid` as { amount: string }[])[0].amount === '156.00')
  await receiveStripeEvent(sql, event('refund.updated', { id: `re_proof${tag}a`, amount: 5600, currency: 'eur', status: 'pending', payment_intent: pi }), deps)
  check('an out-of-order "pending" never moves a succeeded refund back', (await sql`SELECT status FROM money.reversals WHERE provider_ref = ${`re_proof${tag}a`}` as { status: string }[])[0].status === 'succeeded')
  const tooMuch = await recordReversal(sql, { paymentId: pay[0].id, kind: 'refund', amount: 200, currency: 'EUR', status: 'succeeded', provider: 'manual', providerRef: null, effectiveOn: today, actor: 'proof' })
  check('reversals can never exceed what the payment received', tooMuch.refused === 'exceeds_payment')
  check('the reopened invoice asks for the rest on its pay page', (await payPageState(sql, link.token, today) as { open?: number }).open === 56)

  /* ── disputes ── */
  const dOpen = await receiveStripeEvent(sql, event('charge.dispute.created', { id: `dp_proof${tag}a`, charge: chargeId, amount: 10000, currency: 'eur', status: 'needs_response', reason: 'fraudulent', evidence_details: { due_by: Math.floor(Date.now() / 1000) + 86400 * 7 } }), deps)
  check('an opened dispute is recorded and is a critical attention item; the invoice is not reopened yet', dOpen.outcome === 'applied' && (await railIssues(sql)).some(i => i.kind === 'dispute' && i.id === `dp_proof${tag}a`) && (await balance(A)).open === 56)
  await receiveStripeEvent(sql, event('charge.dispute.closed', { id: `dp_proof${tag}a`, charge: chargeId, amount: 10000, currency: 'eur', status: 'lost' }), deps)
  check('a lost dispute becomes a chargeback reversal and the invoice owes the full amount again', (await balance(A)).open === 156 && !(await railIssues(sql)).some(i => i.id === `dp_proof${tag}a`))

  /* ── payouts → Revolut ── */
  await receiveStripeEvent(sql, event('payout.paid', { id: `po_proof${tag}a`, amount: 15357, currency: 'eur', status: 'paid', arrival_date: Math.floor(Date.now() / 1000) - 86400 * 5 }), deps)
  check('a paid payout links the charges it carried', (await sql`SELECT payout_id FROM money.charges WHERE provider_charge = ${chargeId}` as { payout_id: string }[])[0].payout_id === `po_proof${tag}a`)
  check('a payout paid 3+ days ago and not confirmed asks Marcel to confirm it on Revolut', (await railIssues(sql)).some(i => i.kind === 'unreconciled' && i.id === `po_proof${tag}a`))
  await receiveStripeEvent(sql, event('payout.failed', { id: `po_proof${tag}b`, amount: 900, currency: 'eur', status: 'failed', failure_code: 'account_closed' }), deps)
  check('a failed payout is a critical issue', (await railIssues(sql)).some(i => i.kind === 'payoutFailed' && i.id === `po_proof${tag}b`))

  /* ── owner capabilities through the real engine ── */
  const actor = 'os:marcel'
  const rec = await runCapability(sql, { requestId: `proof-money-${tag}-1`, actor, channel: 'os', capability: 'payout.reconcile', input: { payout_id: `po_proof${tag}a`, bank_reference: 'REVOLUT 123' } })
  check('confirming a payout prepares an approval, changes nothing yet', rec.status === 'approval_required' && !(await sql`SELECT reconciled_at FROM money.payouts WHERE provider_payout = ${`po_proof${tag}a`}` as { reconciled_at: Date | null }[])[0].reconciled_at)
  if (rec.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: rec.approval.id, payloadHash: rec.approval.payloadHash })
  check('…and Marcel’s confirmation records it with the bank reference', (await sql`SELECT bank_reference FROM money.payouts WHERE provider_payout = ${`po_proof${tag}a`} AND reconciled_at IS NOT NULL` as { bank_reference: string }[])[0]?.bank_reference === 'REVOLUT 123')
  const res = await runCapability(sql, { requestId: `proof-money-${tag}-2`, actor, channel: 'os', capability: 'money.resolve', input: { id: `ch_proof${tag}dbl`, note: 'refunded the double payment' } })
  if (res.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: res.approval.id, payloadHash: res.approval.payloadHash })
  check('resolving unapplied money closes the issue with a note and changes no amount', !(await railIssues(sql)).some(i => i.id === `ch_proof${tag}dbl`) && (await balance(A)).open === 156)

  // A bank payment Marcel recorded, then refunded by bank: the manual refund path.
  const E = await invoice('E', 100)
  const pr = await runCapability(sql, { requestId: `proof-money-${tag}-3`, actor, channel: 'os', capability: 'payment.record', input: { invoice_id: E } })
  if (pr.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: pr.approval.id, payloadHash: pr.approval.payloadHash })
  check('a bank payment is recorded through payment.record (manual provider)', (await balance(E)).status === 'paid')
  const rf = await runCapability(sql, { requestId: `proof-money-${tag}-4`, actor, channel: 'os', capability: 'payment.refund', input: { invoice_id: E, amount: 40, reason: 'scope reduced' } })
  check('a refund prepares an approval whose preview says what happens and the open balance after', rf.status === 'approval_required' && rf.approval.preview.ACTION.includes('already made by bank') && rf.approval.preview['OPEN AFTER'].includes('40'))
  if (rf.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: rf.approval.id, payloadHash: rf.approval.payloadHash })
  check('the confirmed manual refund reopens the invoice for exactly that amount', (await balance(E)).open === 40 && (await balance(E)).status === 'sent')

  /* ── invoice ledger and Money snapshot ── */
  const im = await invoiceMoney(sql, A)
  check('the invoice ledger shows the payment, the refund and the chargeback; the link and attempts', im.ledger.filter(e => e.kind === 'payment').length === 1 && im.ledger.some(e => e.kind === 'refund') && im.ledger.some(e => e.kind === 'chargeback') && Boolean(im.link) && im.attempts.length >= 1)
  const snap = await moneySnapshot({ sql, actor, channel: 'os', now: new Date(), today, committed: () => {} })
  check('the Money snapshot reads card gross and fees from the rail records', (snap.card.gross.EUR ?? 0) >= 156 && (snap.card.fees.EUR ?? 0) >= 2.43)

  /* ── revocation ── */
  await revokePaymentLink(sql, A, actor)
  check('a revoked link shows nothing payable and starts no checkout', (await payPageState(sql, link.token, today)).kind === 'unavailable' && (await startCheckout(sql, link.token, rail, today) as { reason?: string }).reason === 'unavailable')
} finally {
  // Remove what this proof created, children first. os_audit keeps its rows (append-only).
  if (created.length) {
    await sql`DELETE FROM money.provider_events WHERE invoice_id = ANY(${created}::uuid[]) OR event_id LIKE ${`evt_proof${tag}%`}`
    await sql`DELETE FROM money.reversals WHERE invoice_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM money.disputes WHERE provider_dispute LIKE ${`dp_proof${tag}%`}`
    await sql`DELETE FROM money.charges WHERE provider_charge LIKE ${`ch_proof${tag}%`}`
    await sql`DELETE FROM money.payouts WHERE provider_payout LIKE ${`po_proof${tag}%`}`
    await sql`DELETE FROM money.checkout_sessions WHERE invoice_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM money.payment_links WHERE invoice_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM os_followups WHERE invoice_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM os_activities WHERE invoice_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM os_payments WHERE invoice_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM os_invoices WHERE id = ANY(${created}::uuid[])`
  }
}
console.log(`${passed} money assertions passed against the evidence database; Stripe was a fake rail.`)
