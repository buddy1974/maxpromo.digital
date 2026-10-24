/**
 * Reversals: money that left again after it settled an invoice (ADR-0025). SERVER ONLY.
 *
 * A refund or a lost dispute never edits or deletes the receipt in os_payments. It is a row in
 * money.reversals against that receipt, and money.invoice_paid() subtracts it once it succeeded.
 * When that makes a paid invoice owe money again, the invoice is reopened (status back to `sent`,
 * paid date cleared) in the same transaction, so "paid" never stands over an open balance.
 *
 * Guarantees, enforced inside one transaction under a row lock on the receipt:
 *   - a provider reversal is recorded once (unique provider reference); a later status change
 *     updates that one row;
 *   - reversals on one receipt never exceed what it received;
 *   - a manual reversal (a bank refund Marcel made) carries no provider reference and is only
 *     ever inserted by an owner action.
 */
import type { Sql } from '@/lib/commercial/types'

export type ReversalKind = 'refund' | 'chargeback'
export type ReversalStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled'

export interface ReversalInput {
  paymentId: string
  kind: ReversalKind
  amount: number
  currency: string
  status: ReversalStatus
  provider: 'manual' | 'stripe'
  providerRef: string | null
  reason?: string | null
  effectiveOn: string
  actor: string
  approvalId?: string | null
}

export interface ReversalOutcome {
  /** The reversal row, new or existing. Null when it was refused. */
  id: string | null
  invoiceId: string | null
  refused?: 'unknown_payment' | 'currency_mismatch' | 'exceeds_payment'
  reopened: boolean
}

/** Maps a Stripe refund status onto the reversal vocabulary. */
export function reversalStatusFromStripe(status: string): ReversalStatus {
  if (status === 'succeeded') return 'succeeded'
  if (status === 'failed') return 'failed'
  if (status === 'canceled') return 'cancelled'
  return 'pending'
}

export async function recordReversal(sql: Sql, r: ReversalInput): Promise<ReversalOutcome> {
  const payments = await sql`SELECT id, invoice_id, amount, currency FROM os_payments WHERE id = ${r.paymentId}::uuid` as { id: string; invoice_id: string; amount: string; currency: string }[]
  const p = payments[0]
  if (!p) return { id: null, invoiceId: null, refused: 'unknown_payment', reopened: false }
  if (p.currency !== r.currency) return { id: null, invoiceId: p.invoice_id, refused: 'currency_mismatch', reopened: false }

  /* Upsert by provider reference: the provider's latest status wins, but a succeeded reversal is
     never moved back to pending by an out-of-order event. Manual reversals are always new rows. */
  const counted = `pending,succeeded`
  const results = await sql.transaction([
    sql`SELECT id FROM os_payments WHERE id = ${p.id}::uuid FOR UPDATE`,
    sql`SELECT id FROM os_invoices WHERE id = ${p.invoice_id}::uuid FOR UPDATE`,
    sql`
      INSERT INTO money.reversals (payment_id, invoice_id, kind, amount, currency, status, provider, provider_ref, reason, effective_on, actor, approval_id)
      SELECT ${p.id}::uuid, ${p.invoice_id}::uuid, ${r.kind}, ${r.amount}, ${r.currency}, ${r.status}, ${r.provider}, ${r.providerRef},
             ${r.reason ?? null}, ${r.effectiveOn}::date, ${r.actor}, ${r.approvalId ?? null}::uuid
      WHERE ${r.amount}::numeric + coalesce((SELECT sum(amount) FROM money.reversals
              WHERE payment_id = ${p.id}::uuid AND status = ANY(string_to_array(${counted}, ','))
                AND (${r.providerRef}::text IS NULL OR provider_ref IS DISTINCT FROM ${r.providerRef})), 0)
            <= ${p.amount}::numeric + 0.009
      ON CONFLICT (provider, kind, provider_ref) WHERE provider_ref IS NOT NULL
      DO UPDATE SET status = CASE WHEN money.reversals.status = 'succeeded' AND EXCLUDED.status = 'pending' THEN money.reversals.status ELSE EXCLUDED.status END,
                    updated_at = now()
      RETURNING id`,
    // Reopen: a paid invoice that owes money again after this reversal.
    sql`
      UPDATE os_invoices SET status = 'sent', paid_date = NULL
      WHERE id = ${p.invoice_id}::uuid AND status = 'paid'
        AND coalesce(restbetrag, greatest(total - coalesce(anzahlung, 0), 0)) - money.invoice_paid(id) > 0.009
      RETURNING id`,
  ]) as unknown as [unknown, unknown, { id: string }[], { id: string }[]]
  const id = results[2][0]?.id ?? null
  if (!id) return { id: null, invoiceId: p.invoice_id, refused: 'exceeds_payment', reopened: false }
  return { id, invoiceId: p.invoice_id, reopened: results[3].length > 0 }
}
