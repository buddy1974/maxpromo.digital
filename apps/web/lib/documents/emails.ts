import type { CurrencyCode, DocumentLanguage } from '@/lib/documents/config'

/**
 * lib/documents/emails.ts — SERVER ONLY.
 *
 * The stored shapes of a quotation and an invoice as their email and PDF read them. The emails
 * themselves are rendered by lib/documents/mail.ts in the Maxpromo outbound identity and leave
 * through the mailbox with the PDF (lib/documents/pdf.ts) attached (ADR-0025). The former HTML
 * letterhead builders sent through Resend were removed with that change: one document, one email.
 */

/** Sender for the remaining Resend path (outreach). Document emails no longer use it. */
export const DOCUMENT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'MAXPROMO DIGITAL <info@maxpromo.digital>'

export interface AngebotLineItem {
  description: string
  qty: number
  unit?: string
  unit_price?: number
  total: number
  isFixedPrice?: boolean
}

export interface AngebotRow {
  id: string
  angebot_number: string
  client_name: string
  client_email: string | null
  client_address: string | null
  line_items: AngebotLineItem[]
  subtotal: string | number
  total: string | number
  status: string
  created_at: string
  valid_until: string | null
  notes: string | null
  anzahlung: string | number | null
  anzahlung_date: string | null
  anzahlung_method: string | null
  payment_terms: string | null
  included_items: string[] | null
  currency: CurrencyCode | null
  language: DocumentLanguage | null
}

export interface InvoiceEmailLineItem {
  description: string
  qty: number
  unit_price: number
  total: number
}

export interface InvoiceDocumentData {
  invoice_number: string
  client_name: string   // may be "Name — Company"
  address?: string
  date: string
  due_date: string
  line_items: InvoiceEmailLineItem[]
  subtotal: number
  total: number
  anzahlung?: number
  anzahlung_date?: string
  anzahlung_method?: string
  restbetrag?: number
  currency?: CurrencyCode | null
  language?: DocumentLanguage | null
}
