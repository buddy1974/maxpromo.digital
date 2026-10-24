/**
 * The Money domain's view shapes (ADR-0025). Client-safe: no imports, so a screen that renders
 * Money never pulls a server module, a provider client or the mail transport into its graph.
 */
export type PerCurrency = Record<string, number>

export interface RailStatus {
  connected: boolean
  mode: 'test' | 'live' | null
  webhook: boolean
  /** Why it is not connected, in owner terms. Never the key. */
  reason: 'no_key' | 'bad_key' | 'disabled' | 'live_not_enabled' | 'evidence_live_key' | null
}

export interface RailIssue {
  kind: 'dispute' | 'unapplied' | 'payoutFailed' | 'unreconciled'
  id: string
  amount: number
  currency: string
  invoiceId: string | null
  invoiceNumber: string | null
  detail: string
  date: string
}

export interface LedgerEntry {
  kind: 'payment' | 'refund' | 'chargeback'
  id: string
  invoiceId: string
  invoiceNumber: string
  client: string
  amount: number
  currency: string
  date: string
  provider: string
  status: string
  reference: string | null
  fee: number | null
  refundable: number
}

export interface MoneySnapshot {
  rail: RailStatus
  outstanding: PerCurrency
  overdue: PerCurrency
  receivedThisMonth: PerCurrency
  card: { gross: PerCurrency; fees: PerCurrency; net: PerCurrency; pendingPayout: PerCurrency }
  payouts: { id: string; amount: number; currency: string; status: string; arrivalDate: string | null; reconciled: boolean; bankReference: string | null }[]
  issues: RailIssue[]
  ledger: LedgerEntry[]
}

export interface InvoiceMoney {
  /** Open balance now (the one definition in lib/commercial/money.ts) and net received. */
  open: number
  received: number
  currency: string
  ledger: LedgerEntry[]
  link: { url: string; opened: number; lastOpened: string | null } | null
  attempts: { status: string; amount: number; currency: string; createdAt: string; failureCode: string | null }[]
  card: boolean
}
