/**
 * What the card rail needs Marcel to see (ADR-0025). Read-only; one query per concern.
 *
 *   dispute        a client disputed a card payment and it is not settled        → critical, pushed
 *   unapplied      money reached the rail but settles no invoice, or an event
 *                  could not be applied                                          → critical, pushed
 *   payoutFailed   a payout to Revolut failed                                     → critical, pushed
 *   unreconciled   a payout says paid for 3+ days and Marcel has not confirmed it
 *                  on the Revolut statement                                      → info, not pushed
 *
 * Optional until migration 0019 exists, like the mail and agent sections.
 */
import type { Sql } from '@/lib/commercial/types'

export type { RailIssue } from './types'
import type { RailIssue } from './types'

const OPEN_DISPUTE = ['warning_needs_response', 'needs_response', 'warning_under_review', 'under_review']

export async function railIssues(sql: Sql): Promise<RailIssue[]> {
  try {
    const [disputes, charges, events, payouts] = await Promise.all([
      sql`SELECT d.provider_dispute AS id, d.amount, d.currency, d.invoice_id, i.invoice_number, d.status AS detail, coalesce(d.evidence_due, d.created_at)::date::text AS date
          FROM money.disputes d LEFT JOIN os_invoices i ON i.id = d.invoice_id WHERE d.status = ANY(${OPEN_DISPUTE})`,
      sql`SELECT c.provider_charge AS id, c.gross AS amount, c.currency, c.invoice_id, i.invoice_number, coalesce(c.unapplied_reason, 'unapplied') AS detail, c.created_at::date::text AS date
          FROM money.charges c LEFT JOIN os_invoices i ON i.id = c.invoice_id
          WHERE c.state = 'unapplied' AND c.resolved_at IS NULL`,
      sql`SELECT e.event_id AS id, coalesce((e.detail->>'amount')::numeric, 0) AS amount, coalesce(e.detail->>'currency', 'EUR') AS currency, e.invoice_id,
                 i.invoice_number, e.type || ': ' || coalesce(e.detail->>'note', e.outcome) AS detail, e.received_at::date::text AS date
          FROM money.provider_events e LEFT JOIN os_invoices i ON i.id = e.invoice_id
          WHERE e.outcome IN ('reconcile', 'failed') AND e.resolved_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM money.charges c WHERE (c.provider_charge = e.object_id OR c.payment_intent = e.object_id) AND c.state = 'unapplied')`,
      sql`SELECT provider_payout AS id, amount, currency, NULL::uuid AS invoice_id, NULL AS invoice_number, status || coalesce(' ' || failure_code, '') AS detail,
                 coalesce(arrival_date, created_at::date)::text AS date, status, reconciled_at
          FROM money.payouts WHERE status = 'failed' OR (status = 'paid' AND reconciled_at IS NULL AND arrival_date <= current_date - 3)`,
    ]) as unknown as [Row[], Row[], Row[], (Row & { status: string })[]]
    const map = (kind: RailIssue['kind']) => (r: Row): RailIssue => ({
      kind, id: r.id, amount: Number(r.amount), currency: r.currency, invoiceId: r.invoice_id, invoiceNumber: r.invoice_number, detail: r.detail, date: r.date,
    })
    return [
      ...disputes.map(map('dispute')),
      ...charges.map(map('unapplied')),
      ...events.map(map('unapplied')),
      ...payouts.filter(p => p.status === 'failed').map(map('payoutFailed')),
      ...payouts.filter(p => p.status === 'paid').map(map('unreconciled')),
    ]
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000'].includes(String(error.code))) return []
    throw error
  }
}

interface Row { id: string; amount: string; currency: string; invoice_id: string | null; invoice_number: string | null; detail: string; date: string }
