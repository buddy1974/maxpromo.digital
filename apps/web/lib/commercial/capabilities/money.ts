/**
 * lib/commercial/capabilities/money.ts
 *
 * The Money domain's rail capabilities (ADR-0025). The invoice and the payment ledger stay where
 * they are (documents.ts); these add the payment request, refunds, and what the rail reports.
 *
 *   payment.link       GREEN   the invoice's stable pay link (created once, never two active)
 *   payment.refund     AMBER   money back to the client: through Stripe for a card payment,
 *                              or recording a refund Marcel already made by bank transfer
 *   money.overview     GREEN   rail status, card money, fees, payouts, disputes, open issues
 *   payout.reconcile   AMBER   Marcel confirms a payout arrived on the Revolut statement
 *   money.resolve      AMBER   Marcel marks an unapplied payment / reconcile item as handled
 *
 * Nothing here records a received payment: that happens only from a verified provider event or
 * from payment.record (one path, recordPaymentLocked).
 */
import { writeAudit } from '../audit'
import { formatPerCurrency, addTo, invoiceBalance, type PerCurrency } from '../money'
import { eur, focus, q } from '../records'
import { payloadHash } from '../signing'
import { CapabilityRefusal, UncertainOutcome, type AnyCapability, type CapabilityContext, type CapabilityDefinition } from '../types'
import { v } from '../validate'
import { recordReversal, reversalStatusFromStripe } from '@/lib/money/ledger'
import { ensurePaymentLink, payUrl, revokePaymentLink } from '@/lib/money/links'
import { railIssues } from '@/lib/money/attention'
import { railStatus, stripeRail, StripeRailError, toMinor } from '@/lib/money/stripe/client'

const invoiceRef = { invoice_id: v.optional(v.uuid()), number: v.optional(v.string({ max: 30 })) }

interface Inv { id: string; invoice_number: string; client_name: string; client_id: string | null; status: string; total: string; anzahlung: string | null; restbetrag: string | null; currency: string; due_date: string | null; language: string; paid_amount: string }

async function findInvoice(ctx: CapabilityContext, ref: { invoice_id?: string; number?: string }): Promise<Inv> {
  if (!ref.invoice_id && !ref.number) throw new CapabilityRefusal('Which invoice? Give its number.')
  const rows = await ctx.sql`
    SELECT id, invoice_number, client_name, client_id, status, total, anzahlung, restbetrag, currency, due_date::text AS due_date, language,
           money.invoice_paid(id)::text AS paid_amount
    FROM os_invoices WHERE ${ref.invoice_id ?? null}::uuid IS NOT NULL AND id = ${ref.invoice_id ?? null}::uuid
       OR ${ref.number ?? null}::text IS NOT NULL AND upper(invoice_number) = upper(${ref.number ?? ''})` as Inv[]
  if (rows.length !== 1) throw new CapabilityRefusal(`No invoice ${ref.number ?? ref.invoice_id}.`, 'not_found')
  return rows[0]
}

/* ── payment.link ───────────────────────────────────────────────────────── */

const linkInput = v.object({ ...invoiceRef, revoke: v.optional(v.boolean()) })

export const paymentLink: CapabilityDefinition<ReturnType<typeof linkInput.parse>> = {
  id: 'payment.link',
  family: 'PAYMENT',
  title: 'Payment link for an invoice',
  description: 'The invoice’s stable pay link on maxpromo.digital. It always asks for the current open balance; card payment works once Stripe is connected, bank details are always shown. revoke=true retires it.',
  risk: 'GREEN',
  input: linkInput,
  async run(ctx, input) {
    const inv = await findInvoice(ctx, input)
    if (input.revoke) {
      const done = await revokePaymentLink(ctx.sql, inv.id, ctx.actor)
      if (done) await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'payment.link.revoke', entityType: 'invoice', entityId: inv.id, outcome: 'succeeded' })
      return { summary: done ? `The pay link for ${inv.invoice_number} no longer works.` : `${inv.invoice_number} had no active pay link.`, focus: [focus('invoice', inv.id, inv.invoice_number)] }
    }
    if (inv.status === 'cancelled') throw new CapabilityRefusal(`${inv.invoice_number} is cancelled.`)
    const link = await ensurePaymentLink(ctx.sql, inv.id, ctx.actor)
    const url = payUrl(link.token, inv.language === 'en' ? 'en' : 'de')
    const rail = railStatus()
    return {
      summary: `Pay link for ${inv.invoice_number}: ${url}`,
      lines: [
        rail.connected ? `Card payment: on (${rail.mode} mode).` : 'Card payment: not connected yet — the page shows the bank details only.',
        ...(inv.status === 'draft' ? ['The invoice is still a draft: the page says so until it is issued.'] : []),
      ],
      focus: [focus('invoice', inv.id, inv.invoice_number)],
      data: { url, card: rail.connected },
    }
  },
}

/* ── payment.refund ─────────────────────────────────────────────────────── */

const refundInput = v.object({
  ...invoiceRef,
  payment_id: v.optional(v.uuid()),
  /** Omitted: what remains refundable on that payment. */
  amount: v.optional(v.number({ min: 0.01, max: 10_000_000 })),
  reason: v.optional(v.string({ max: 300 })),
})

interface PaymentRow { id: string; amount: string; currency: string; provider: string; provider_ref: string | null; received_on: string; reversed: string }

export const paymentRefund: CapabilityDefinition<ReturnType<typeof refundInput.parse>> = {
  id: 'payment.refund',
  family: 'PAYMENT',
  title: 'Refund a payment',
  description: 'Money back to the client. A card payment is refunded through Stripe; a bank payment is recorded as refunded after Marcel transferred it back. The invoice reopens for the refunded amount.',
  risk: 'AMBER',
  input: refundInput,
  async prepare(ctx, input) {
    const inv = await findInvoice(ctx, input)
    const payments = await q<PaymentRow>(ctx.sql`
      SELECT p.id, p.amount, p.currency, p.provider, p.provider_ref, p.received_on::text AS received_on,
             coalesce((SELECT sum(r.amount) FROM money.reversals r WHERE r.payment_id = p.id AND r.status IN ('pending', 'succeeded')), 0)::text AS reversed
      FROM os_payments p WHERE p.invoice_id = ${inv.id}::uuid ORDER BY p.received_on DESC`)
    const refundable = payments.filter(p => Number(p.amount) - Number(p.reversed) > 0.009)
    const p = input.payment_id ? refundable.find(x => x.id === input.payment_id) : refundable.length === 1 ? refundable[0] : null
    if (!p) {
      if (!refundable.length) throw new CapabilityRefusal(`Nothing on ${inv.invoice_number} can be refunded.`)
      return {
        summary: `${refundable.length} payments on ${inv.invoice_number}. Which one?`,
        lines: refundable.map(x => `${x.received_on} · ${eur(x.amount, x.currency)} · ${x.provider}`),
        data: { payments: refundable.map(x => ({ id: x.id, amount: Number(x.amount), provider: x.provider, received_on: x.received_on })) },
      }
    }
    const left = Math.round((Number(p.amount) - Number(p.reversed)) * 100) / 100
    const amount = input.amount ?? left
    if (amount > left + 0.009) throw new CapabilityRefusal(`At most ${eur(left, p.currency)} of that payment can still be refunded.`)
    const card = p.provider === 'stripe'
    if (card && !stripeRail()) throw new CapabilityRefusal('Stripe is not connected, so a card refund cannot be made from the OS.', 'unsupported')
    const open = invoiceBalance({ ...inv, paid_amount: inv.paid_amount }, ctx.today).open
    return {
      summary: `Refund ${eur(amount, p.currency)} on ${inv.invoice_number}`,
      preview: {
        ACTION: card ? 'Refund by card through Stripe — money leaves now' : 'Record a refund you already made by bank transfer',
        RECHNUNG: `${inv.invoice_number} · ${inv.client_name}`,
        PAYMENT: `${eur(p.amount, p.currency)} received ${p.received_on} (${card ? 'card' : 'manual'})`,
        AMOUNT: eur(amount, p.currency),
        'OPEN AFTER': eur(open + amount, p.currency),
        ...(input.reason ? { REASON: input.reason } : {}),
      },
      payload: { invoice_id: inv.id, payment_id: p.id, amount, currency: p.currency, provider: p.provider, intent: p.provider_ref, reason: input.reason ?? null, left },
      dedupeKey: `refund:${p.id}`,
      expiresInMinutes: 30,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { invoice_id: string; payment_id: string; amount: number; currency: string; provider: string; intent: string | null; reason: string | null; left: number }
    const audit = (outcome: 'succeeded' | 'uncertain' | 'failed', externalRef?: string, error?: string) => writeAudit(ctx.sql, {
      actor: ctx.actor, channel: ctx.channel, operation: 'payment.refund', entityType: 'invoice', entityId: p.invoice_id,
      after: { amount: p.amount, currency: p.currency, provider: p.provider }, approvalId, payloadHash: payloadHash('payment.refund', payload), outcome, externalRef, error,
    })
    let status: 'pending' | 'succeeded' = 'succeeded'
    let ref: string | null = null
    if (p.provider === 'stripe') {
      const rail = stripeRail()
      if (!rail || !p.intent) throw new CapabilityRefusal('Stripe is not connected. Nothing was refunded.', 'unsupported')
      try {
        const r = await rail.createRefund({ paymentIntent: p.intent, amountMinor: toMinor(p.amount), invoiceId: p.invoice_id, reason: 'requested_by_customer' }, `mp-refund:${approvalId}`)
        ref = r.id
        status = reversalStatusFromStripe(r.status) === 'succeeded' ? 'succeeded' : 'pending'
      } catch (error) {
        if (error instanceof StripeRailError && error.outcome === 'uncertain') {
          await audit('uncertain', undefined, 'stripe did not answer')
          throw new UncertainOutcome('Stripe did not confirm the refund. It may have been made; the webhook will record it if so. Do not refund again before checking.')
        }
        await audit('failed', undefined, error instanceof StripeRailError ? error.code ?? `http ${error.status}` : 'error')
        throw new CapabilityRefusal(`Stripe refused the refund${error instanceof StripeRailError && error.code ? ` (${error.code})` : ''}. Nothing was refunded.`)
      }
      ctx.committed(`Refund of ${eur(p.amount, p.currency)} accepted by Stripe`, ref)
    }
    const out = await recordReversal(ctx.sql, {
      paymentId: p.payment_id, kind: 'refund', amount: p.amount, currency: p.currency, status, provider: p.provider === 'stripe' ? 'stripe' : 'manual',
      providerRef: ref, reason: p.reason, effectiveOn: ctx.today, actor: ctx.actor, approvalId,
    })
    if (!out.id && p.provider !== 'stripe') throw new CapabilityRefusal(`The refund was not recorded (${out.refused}).`, 'conflict')
    if (p.provider !== 'stripe') ctx.committed(`Refund of ${eur(p.amount, p.currency)} recorded`)
    await audit('succeeded', ref ?? undefined)
    return {
      summary: `${p.provider === 'stripe' ? 'Refunded' : 'Recorded refund of'} ${eur(p.amount, p.currency)}${status === 'pending' ? ' (Stripe is processing it)' : ''}.${out.reopened ? ' The invoice is open again for that amount.' : ''}`,
      focus: [focus('invoice', p.invoice_id, 'invoice')],
    }
  },
}

/* ── money.overview ─────────────────────────────────────────────────────── */

const noInput = v.object({})

export const moneyOverview: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'money.overview',
  family: 'FINANCE',
  title: 'Money: rail and payouts',
  description: 'Card payments received, fees, net, payouts to Revolut and anything that needs reconciling. Receivables stay in “Who owes me money?”.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    const status = railStatus()
    const month = `${ctx.today.slice(0, 7)}-01`
    let charges: { gross: string; fee: string | null; net: string | null; currency: string }[] = []
    let payouts: { amount: string; currency: string; status: string; arrival_date: string | null }[] = []
    try {
      charges = await q(ctx.sql`SELECT gross, fee, net, currency FROM money.charges WHERE state = 'applied' AND created_at >= ${month}::date`)
      payouts = await q(ctx.sql`SELECT amount, currency, status, arrival_date::text AS arrival_date FROM money.payouts ORDER BY created_at DESC LIMIT 5`)
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000'].includes(String(error.code)))) throw error
    }
    const gross: PerCurrency = {}, fees: PerCurrency = {}
    for (const c of charges) { addTo(gross, c.currency, Number(c.gross)); if (c.fee !== null) addTo(fees, c.currency, Number(c.fee)) }
    const issues = await railIssues(ctx.sql)
    return {
      summary: status.connected ? `Card payments this month: ${formatPerCurrency(gross)} (fees ${formatPerCurrency(fees)}).` : 'Card payments are not connected yet; bank transfers work as before.',
      lines: [
        `Stripe: ${status.connected ? `connected, ${status.mode} mode` : `not connected (${status.reason})`} · webhook ${status.webhook ? 'configured' : 'not configured'}`,
        ...payouts.map(p => `Payout ${eur(p.amount, p.currency)} · ${p.status}${p.arrival_date ? ` · ${p.arrival_date}` : ''}`),
        ...issues.map(i => `${i.kind}: ${eur(i.amount, i.currency)}${i.invoiceNumber ? ` · ${i.invoiceNumber}` : ''} · ${i.detail}`),
      ],
      data: { rail: status, gross, fees, issues: issues.length },
    }
  },
}

/* ── payout.reconcile / money.resolve ───────────────────────────────────── */

const reconcileInput = v.object({ payout_id: v.string({ max: 80 }), bank_reference: v.optional(v.string({ max: 120 })) })

export const payoutReconcile: CapabilityDefinition<ReturnType<typeof reconcileInput.parse>> = {
  id: 'payout.reconcile',
  family: 'FINANCE',
  title: 'Payout arrived on Revolut',
  description: 'Marcel confirms that a Stripe payout is on the Revolut statement. Only he can see the statement, so this is always his confirmation.',
  risk: 'AMBER',
  input: reconcileInput,
  async prepare(ctx, input) {
    const rows = await q<{ provider_payout: string; amount: string; currency: string; status: string; arrival_date: string | null; reconciled_at: Date | null }>(ctx.sql`
      SELECT provider_payout, amount, currency, status, arrival_date::text AS arrival_date, reconciled_at FROM money.payouts WHERE provider_payout = ${input.payout_id}`)
    const p = rows[0]
    if (!p) throw new CapabilityRefusal('No such payout.', 'not_found')
    if (p.reconciled_at) return { summary: 'That payout is already confirmed.' }
    if (p.status !== 'paid') throw new CapabilityRefusal(`That payout is ${p.status}, not paid.`)
    return {
      summary: `Confirm payout ${eur(p.amount, p.currency)} on Revolut`,
      preview: { ACTION: 'Confirm payout on the Revolut statement', AMOUNT: eur(p.amount, p.currency), ARRIVAL: p.arrival_date ?? '—', ...(input.bank_reference ? { REFERENCE: input.bank_reference } : {}) },
      payload: { payout_id: p.provider_payout, bank_reference: input.bank_reference ?? null },
      dedupeKey: `payout:${p.provider_payout}`,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { payout_id: string; bank_reference: string | null }
    const rows = await q<{ provider_payout: string }>(ctx.sql`UPDATE money.payouts SET reconciled_at = now(), reconciled_by = ${ctx.actor}, bank_reference = ${p.bank_reference}, updated_at = now()
      WHERE provider_payout = ${p.payout_id} AND reconciled_at IS NULL AND status = 'paid' RETURNING provider_payout`)
    if (!rows.length) return { summary: 'Nothing changed: the payout was confirmed already or is not paid.' }
    ctx.committed('Payout confirmed on the Revolut statement')
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'payout.reconcile', entityType: 'payout', entityId: p.payout_id, approvalId, payloadHash: payloadHash('payout.reconcile', payload), outcome: 'succeeded' })
    return { summary: 'Payout confirmed on the Revolut statement.' }
  },
}

const resolveInput = v.object({ id: v.string({ max: 120 }), note: v.string({ min: 3, max: 300 }) })

export const moneyResolve: CapabilityDefinition<ReturnType<typeof resolveInput.parse>> = {
  id: 'money.resolve',
  family: 'FINANCE',
  title: 'Mark a money issue handled',
  description: 'Closes an unapplied payment or a provider event that needed reconciliation, with Marcel’s note of what he did (refunded, applied by hand, accepted). It changes no amount.',
  risk: 'AMBER',
  input: resolveInput,
  async prepare(ctx, input) {
    const issue = (await railIssues(ctx.sql)).find(i => i.id === input.id && i.kind === 'unapplied')
    if (!issue) throw new CapabilityRefusal('No open money issue with that id.', 'not_found')
    return {
      summary: `Mark ${eur(issue.amount, issue.currency)} as handled`,
      preview: { ACTION: 'Mark money issue handled (no amount changes)', ISSUE: issue.detail, AMOUNT: eur(issue.amount, issue.currency), NOTE: input.note },
      payload: { id: input.id, note: input.note },
      dedupeKey: `resolve:${input.id}`,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { id: string; note: string }
    await ctx.sql.transaction([
      ctx.sql`UPDATE money.charges SET resolved_at = now(), resolved_by = ${ctx.actor}, resolution_note = ${p.note}, updated_at = now() WHERE provider_charge = ${p.id} AND resolved_at IS NULL`,
      ctx.sql`UPDATE money.provider_events SET resolved_at = now(), resolved_by = ${ctx.actor}, resolution_note = ${p.note}
              WHERE resolved_at IS NULL AND outcome IN ('reconcile', 'failed')
                AND (event_id = ${p.id} OR object_id = ${p.id} OR object_id = (SELECT payment_intent FROM money.charges WHERE provider_charge = ${p.id}))`,
    ])
    ctx.committed('Money issue marked handled')
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'money.resolve', entityType: 'money_issue', entityId: p.id, after: { note: p.note }, approvalId, payloadHash: payloadHash('money.resolve', payload), outcome: 'succeeded' })
    return { summary: 'Marked as handled.' }
  },
}

export const MONEY_CAPABILITIES: AnyCapability[] = [paymentLink, paymentRefund, moneyOverview, payoutReconcile, moneyResolve]
