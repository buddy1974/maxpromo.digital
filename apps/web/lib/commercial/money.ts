/**
 * lib/commercial/money.ts
 *
 * What an invoice is owed, and which money words mean what.
 *
 * WHY THIS EXISTS
 *
 * "Outstanding" was computed twice — on the dashboard and on the invoice list
 * — and both summed `total` over invoices whose status was `sent` or
 * `overdue`. That was wrong three ways:
 *
 *   1. A deposit already received (`anzahlung`) was counted as still owed.
 *   2. EUR and GBP were added into one number and printed as euros.
 *   3. `overdue` is never written by anything (known risk 58), so an invoice
 *      past its due date stayed "sent" and was never reported overdue.
 *
 * Here the open balance is derived from the invoice and the payments actually
 * recorded against it, overdue is derived from the due date, and every total
 * is kept per currency. A number in one currency is never added to another.
 *
 * THE WORDS (never interchangeable)
 *
 *   pipeline        value of open leads, unweighted. Not money.
 *   weighted        pipeline × stage weight. A planning figure, not a forecast.
 *   invoiced        totals of issued invoices in a period.
 *   received        payments recorded in a period (os_payments + deposits).
 *   outstanding     open balance of issued invoices.
 *   overdue         outstanding whose due date has passed.
 *   recurring       contracted recurring revenue, normalised to per month.
 *
 * Pure and dependency-free.
 */

export type Currency = string

export interface InvoiceForMoney {
  id: string
  invoice_number: string
  client_name: string
  client_id?: string | null
  status: string
  total: number | string
  anzahlung?: number | string | null
  restbetrag?: number | string | null
  currency?: string | null
  due_date?: string | Date | null
  sent_at?: string | Date | null
  created_at?: string | Date | null
  /** Sum of os_payments rows for this invoice. */
  paid_amount?: number | string | null
}

export type InvoiceState =
  | 'draft'
  | 'cancelled'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'due'
  | 'sent'

export interface InvoiceBalance {
  id: string
  number: string
  client: string
  clientId: string | null
  currency: Currency
  total: number
  open: number
  state: InvoiceState
  dueDate: string | null
  daysOverdue: number
  /** Marked paid while money is still recorded as open, or vice versa. */
  needsReconciliation: boolean
}

const n = (v: number | string | null | undefined): number => {
  const x = typeof v === 'string' ? Number(v) : v ?? 0
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0
}

/**
 * A DATE value as `YYYY-MM-DD`. The Neon driver returns DATE as a Date at
 * LOCAL midnight, so `toISOString()` would move it a day back east of UTC;
 * the calendar components are the stored date.
 */
export function isoDate(v: string | Date | null | undefined): string | null {
  if (!v) return null
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
  }
  return String(v).slice(0, 10)
}

/** Calendar date in Berlin, `YYYY-MM-DD`, for comparing with DATE columns. */
export function berlinDate(at: Date = new Date()): string {
  return at.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

/** Days before the due date that an unpaid invoice counts as "due". */
export const DUE_SOON_DAYS = 7

export function invoiceBalance(inv: InvoiceForMoney, today: string): InvoiceBalance {
  const total = n(inv.total)
  const deposit = n(inv.anzahlung)
  const paid = n(inv.paid_amount)
  /* The amount the invoice itself asks for: total less any deposit it
     acknowledges. `restbetrag` is what was printed, when it was stored. */
  const asked = inv.restbetrag !== null && inv.restbetrag !== undefined && inv.restbetrag !== ''
    ? n(inv.restbetrag)
    : Math.max(0, total - deposit)
  const open = Math.max(0, Math.round((asked - paid) * 100) / 100)
  const base = {
    id: inv.id,
    number: inv.invoice_number,
    client: inv.client_name,
    clientId: inv.client_id ?? null,
    currency: (inv.currency || 'EUR').toUpperCase(),
    total,
    dueDate: isoDate(inv.due_date),
  }

  if (inv.status === 'cancelled') {
    return { ...base, open: 0, state: 'cancelled', daysOverdue: 0, needsReconciliation: false }
  }
  if (inv.status === 'draft') {
    return { ...base, open, state: 'draft', daysOverdue: 0, needsReconciliation: false }
  }
  if (inv.status === 'paid') {
    /* Marked paid by a person. Trusted as the state, but a recorded shortfall
       is surfaced rather than hidden. Only meaningful once payments are being
       recorded, so a paid invoice with no payment rows is not flagged. */
    const shortfall = paid > 0 && open > 0
    return { ...base, open: 0, state: 'paid', daysOverdue: 0, needsReconciliation: shortfall }
  }
  if (open === 0) {
    return { ...base, open: 0, state: 'paid', daysOverdue: 0, needsReconciliation: true }
  }

  const daysOverdue = base.dueDate ? Math.max(0, daysBetween(base.dueDate, today)) : 0
  let state: InvoiceState
  if (base.dueDate && daysOverdue > 0) state = 'overdue'
  else if (paid > 0) state = 'partially_paid'
  else if (base.dueDate && daysBetween(today, base.dueDate) <= DUE_SOON_DAYS) state = 'due'
  else state = 'sent'
  return { ...base, open, state, daysOverdue, needsReconciliation: false }
}

export type PerCurrency = Record<Currency, number>

export function addTo(acc: PerCurrency, currency: Currency, amount: number): PerCurrency {
  acc[currency] = Math.round(((acc[currency] ?? 0) + amount) * 100) / 100
  return acc
}

export interface Receivables {
  outstanding: PerCurrency
  overdue: PerCurrency
  invoices: InvoiceBalance[]
  overdueInvoices: InvoiceBalance[]
  drafts: InvoiceBalance[]
  reconcile: InvoiceBalance[]
}

export function receivables(invoices: readonly InvoiceForMoney[], today: string): Receivables {
  const all = invoices.map((i) => invoiceBalance(i, today))
  const open = all.filter((b) => b.open > 0 && !['draft', 'cancelled', 'paid'].includes(b.state))
  const outstanding: PerCurrency = {}
  const overdue: PerCurrency = {}
  for (const b of open) {
    addTo(outstanding, b.currency, b.open)
    if (b.state === 'overdue') addTo(overdue, b.currency, b.open)
  }
  return {
    outstanding,
    overdue,
    invoices: open.sort((a, b) => b.daysOverdue - a.daysOverdue || b.open - a.open),
    overdueInvoices: open.filter((b) => b.state === 'overdue').sort((a, b) => b.daysOverdue - a.daysOverdue),
    drafts: all.filter((b) => b.state === 'draft'),
    reconcile: all.filter((b) => b.needsReconciliation),
  }
}

/** "€1.500,00 · £300,00" — each currency stated on its own. */
export function formatPerCurrency(amounts: PerCurrency, locale = 'de-DE'): string {
  const parts = Object.entries(amounts)
    .filter(([, v]) => v !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cur, v]) => new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(v))
  return parts.length ? parts.join(' · ') : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(0)
}

export function formatMoney(amount: number, currency: Currency, locale = 'de-DE'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

/** Recurring amount normalised to one month. */
export function monthlyEquivalent(amount: number, frequency: 'monthly' | 'quarterly' | 'yearly'): number {
  const m = frequency === 'monthly' ? amount : frequency === 'quarterly' ? amount / 3 : amount / 12
  return Math.round(m * 100) / 100
}

/** Next renewal date after `from` for a frequency, in ISO date form. */
export function addPeriod(fromIso: string, frequency: 'monthly' | 'quarterly' | 'yearly'): string {
  const [y, m, d] = fromIso.slice(0, 10).split('-').map(Number)
  const months = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(d, lastDay))
  return target.toISOString().slice(0, 10)
}
