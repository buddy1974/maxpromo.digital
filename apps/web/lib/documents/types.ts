/**
 * lib/documents/types.ts
 *
 * The one shared data shape both Invoice and Angebot documents render
 * from. This deliberately mirrors the existing `os_invoices`/`os_angebote`
 * column names (see db/schema.sql) so API responses can be passed straight
 * through without a mapping layer.
 */

import type { CurrencyCode, DocumentLanguage, PaymentMethodId } from './config'

export interface DocumentLineItem {
  description: string
  qty: number
  unit: string
  unit_price: number
  total: number
  isFixedPrice?: boolean
}

/** Fields common to both invoices and angebote. */
interface DocumentDataBase {
  client_name: string // may encode "Name — Company"
  client_email?: string | null
  client_address?: string | null
  line_items: DocumentLineItem[]
  subtotal: number
  total: number
  notes?: string | null
  anzahlung?: number | null
  anzahlung_date?: string | null
  anzahlung_method?: string | null
  currency?: CurrencyCode | null
  payment_method?: PaymentMethodId | null
  /** Document language — independent of the OS interface language. Defaults to 'de' when unset (pre-migration records). */
  language?: DocumentLanguage | null
}

export interface InvoiceData extends DocumentDataBase {
  invoice_number: string
  created_at: string
  due_date?: string | null
  restbetrag?: number | null
}

export interface AngebotData extends DocumentDataBase {
  angebot_number: string
  created_at: string
  valid_until?: string | null
  payment_terms?: string | null
  included_items?: string[] | null
}

/** Result of splitting the "Name — Company" convention used on client_name. */
export interface SplitClientName {
  name: string
  company: string
}
