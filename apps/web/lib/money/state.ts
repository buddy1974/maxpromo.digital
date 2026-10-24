/**
 * What /os shows about Money (ADR-0025). Read-only. The receivables come from the one definition
 * (lib/commercial/money.ts); the rail adds card money, fees, payouts and issues. Nothing here is a
 * second ledger: every number is read from os_invoices, os_payments, money.reversals and the rail
 * tables that point at them.
 */
import { addTo, berlinDate, invoiceBalance, receivables, type PerCurrency } from '@/lib/commercial/money'
import { loadInvoicesForMoney } from '@/lib/commercial/capabilities/documents'
import type { CapabilityContext, Sql } from '@/lib/commercial/types'
import { railIssues } from './attention'
import { railStatus } from './stripe/client'
import type { InvoiceMoney, LedgerEntry, MoneySnapshot } from './types'
export type { InvoiceMoney, LedgerEntry, MoneySnapshot } from './types'
import { payUrl } from './links'



const optional = async <T>(p: PromiseLike<unknown>, empty: T): Promise<T> => {
  try { return await p as T } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000'].includes(String(error.code))) return empty
    throw error
  }
}

async function ledger(sql: Sql, invoiceId: string | null, limit: number): Promise<LedgerEntry[]> {
  const payments = await sql`
    SELECT p.id, p.invoice_id, i.invoice_number, i.client_name, p.amount, p.currency, p.received_on::text AS date, p.provider,
           p.provider_ref AS reference, c.fee,
           p.amount - coalesce((SELECT sum(r.amount) FROM money.reversals r WHERE r.payment_id = p.id AND r.status IN ('pending', 'succeeded')), 0) AS refundable
    FROM os_payments p JOIN os_invoices i ON i.id = p.invoice_id LEFT JOIN money.charges c ON c.payment_id = p.id
    WHERE (${invoiceId}::uuid IS NULL OR p.invoice_id = ${invoiceId}::uuid)
    ORDER BY p.received_on DESC, p.created_at DESC LIMIT ${limit}` as Record<string, string | null>[]
  const reversals = await sql`
    SELECT r.id, r.invoice_id, i.invoice_number, i.client_name, r.kind, r.amount, r.currency, coalesce(r.effective_on, r.created_at::date)::text AS date,
           r.provider, r.status, r.provider_ref AS reference
    FROM money.reversals r JOIN os_invoices i ON i.id = r.invoice_id
    WHERE (${invoiceId}::uuid IS NULL OR r.invoice_id = ${invoiceId}::uuid)
    ORDER BY r.created_at DESC LIMIT ${limit}` as Record<string, string | null>[]
  const entries: LedgerEntry[] = [
    ...payments.map(p => ({ kind: 'payment' as const, id: p.id!, invoiceId: p.invoice_id!, invoiceNumber: p.invoice_number!, client: p.client_name!, amount: Number(p.amount),
      currency: p.currency!, date: p.date!, provider: p.provider!, status: 'succeeded', reference: p.reference, fee: p.fee === null ? null : Number(p.fee), refundable: Math.max(0, Number(p.refundable)) })),
    ...reversals.map(r => ({ kind: r.kind as 'refund' | 'chargeback', id: r.id!, invoiceId: r.invoice_id!, invoiceNumber: r.invoice_number!, client: r.client_name!, amount: Number(r.amount),
      currency: r.currency!, date: r.date!, provider: r.provider!, status: r.status!, reference: r.reference, fee: null, refundable: 0 })),
  ]
  return entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

export async function moneySnapshot(ctx: CapabilityContext): Promise<MoneySnapshot> {
  const rec = receivables(await loadInvoicesForMoney(ctx), ctx.today)
  const month = `${ctx.today.slice(0, 7)}-01`
  const [received, charges, payouts, issues, entries] = await Promise.all([
    optional<{ amount: string; currency: string }[]>(ctx.sql`
      SELECT amount, currency FROM os_payments WHERE received_on >= ${month}::date
      UNION ALL SELECT -amount, currency FROM money.reversals WHERE status = 'succeeded' AND effective_on >= ${month}::date`, []),
    optional<{ gross: string; fee: string | null; net: string | null; currency: string; payout_id: string | null; created_at: Date }[]>(ctx.sql`
      SELECT gross, fee, net, currency, payout_id, created_at FROM money.charges WHERE state = 'applied'`, []),
    optional<{ provider_payout: string; amount: string; currency: string; status: string; arrival_date: string | null; reconciled_at: Date | null; bank_reference: string | null }[]>(ctx.sql`
      SELECT provider_payout, amount, currency, status, arrival_date::text AS arrival_date, reconciled_at, bank_reference FROM money.payouts ORDER BY created_at DESC LIMIT 12`, []),
    railIssues(ctx.sql),
    optional<LedgerEntry[]>(ledger(ctx.sql, null, 30), []),
  ])
  const receivedThisMonth: PerCurrency = {}
  for (const r of received) addTo(receivedThisMonth, r.currency, Number(r.amount))
  const gross: PerCurrency = {}, fees: PerCurrency = {}, net: PerCurrency = {}, pendingPayout: PerCurrency = {}
  for (const c of charges) {
    const thisMonth = new Date(c.created_at).toISOString().slice(0, 10) >= month
    if (thisMonth) { addTo(gross, c.currency, Number(c.gross)); if (c.fee !== null) addTo(fees, c.currency, Number(c.fee)); if (c.net !== null) addTo(net, c.currency, Number(c.net)) }
    if (!c.payout_id) addTo(pendingPayout, c.currency, Number(c.net ?? c.gross))
  }
  return {
    rail: railStatus(), outstanding: rec.outstanding, overdue: rec.overdue, receivedThisMonth,
    card: { gross, fees, net, pendingPayout },
    payouts: payouts.map(p => ({ id: p.provider_payout, amount: Number(p.amount), currency: p.currency, status: p.status, arrivalDate: p.arrival_date, reconciled: Boolean(p.reconciled_at), bankReference: p.bank_reference })),
    issues, ledger: entries,
  }
}


export async function invoiceMoney(sql: Sql, invoiceId: string): Promise<InvoiceMoney> {
  const inv = (await sql`SELECT i.*, money.invoice_paid(i.id)::text AS paid_amount FROM os_invoices i WHERE i.id = ${invoiceId}::uuid` as Parameters<typeof invoiceBalance>[0][])[0]
  const balance = inv ? invoiceBalance(inv, berlinDate()) : null
  const [entries, links, attempts] = await Promise.all([
    optional<LedgerEntry[]>(ledger(sql, invoiceId, 50), []),
    optional<{ token: string; opened_count: number; last_opened_at: Date | null; language: string }[]>(sql`
      SELECT l.token, l.opened_count, l.last_opened_at, i.language FROM money.payment_links l JOIN os_invoices i ON i.id = l.invoice_id
      WHERE l.invoice_id = ${invoiceId}::uuid AND l.status = 'active'`, []),
    optional<{ status: string; amount: string; currency: string; created_at: Date; failure_code: string | null }[]>(sql`
      SELECT status, amount, currency, created_at, failure_code FROM money.checkout_sessions WHERE invoice_id = ${invoiceId}::uuid ORDER BY created_at DESC LIMIT 10`, []),
  ])
  const l = links[0]
  return {
    open: balance?.open ?? 0, received: inv ? Number(inv.paid_amount ?? 0) : 0, currency: balance?.currency ?? 'EUR',
    ledger: entries,
    link: l ? { url: payUrl(l.token, l.language === 'en' ? 'en' : 'de'), opened: l.opened_count, lastOpened: l.last_opened_at ? new Date(l.last_opened_at).toISOString() : null } : null,
    attempts: attempts.map(a => ({ status: a.status, amount: Number(a.amount), currency: a.currency, createdAt: new Date(a.created_at).toISOString(), failureCode: a.failure_code })),
    card: railStatus().connected,
  }
}
