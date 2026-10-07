/**
 * lib/documents/allocate.ts — SERVER ONLY.
 *
 * The two functions that consume a business document number.
 *
 * They lived inside the quotation and invoice routes until the commercial
 * service needed the same numbers (ADR-0018). A second copy would be a second
 * numbering system the day one of them changed, so both doors now call these.
 * The rules have not moved:
 *
 *   - A number is allocated when a document is saved, never when a form or a
 *     preview is read (risks 57 and 63). `prove:document-numbering` holds the
 *     read paths to that.
 *   - The per-year Postgres sequence behind `next_angebot_number()` and
 *     `next_invoice_number()` is the only authority. `nextval()` is atomic, so
 *     two concurrent saves cannot share a number.
 *   - The SELECT-MAX fallback exists only for a database the 0001 migration
 *     has not reached, and says so in the log when it is used.
 *
 * Nothing here accepts a number from a caller.
 */

import { getDb } from '@/lib/db'

/** Allocates a quotation number and consumes it. Only a save may call this. */
export async function nextAngebotNumber(): Promise<string> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT next_angebot_number() AS number` as { number: string }[]
    if (rows[0]?.number) return rows[0].number
  } catch (err) {
    console.warn('[angebote] next_angebot_number() missing — falling back to SELECT-MAX', err instanceof Error ? err.message : err)
  }
  const year = new Date().getFullYear()
  const prefix = `ANG-${year}-`
  const rows = await sql`
    SELECT angebot_number FROM os_angebote
    WHERE angebot_number LIKE ${prefix + '%'}
    ORDER BY angebot_number DESC LIMIT 1`
  if (rows.length === 0) return `${prefix}001`
  const last = (rows[0] as { angebot_number: string }).angebot_number
  const num  = parseInt(last.replace(prefix, ''), 10)
  return `${prefix}${String(num + 1).padStart(3, '0')}`
}

/** Allocates an invoice number and consumes it. Only a save may call this. */
export async function nextInvoiceNumber(): Promise<string> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT next_invoice_number() AS number` as { number: string }[]
    if (rows[0]?.number) return rows[0].number
  } catch (err) {
    console.warn('[invoices] next_invoice_number() missing — falling back to SELECT-MAX', err instanceof Error ? err.message : err)
  }
  const year = new Date().getFullYear()
  const prefix = `MP-${year}-`
  const rows = await sql`
    SELECT invoice_number FROM os_invoices
    WHERE invoice_number LIKE ${prefix + '%'}
    ORDER BY invoice_number DESC LIMIT 1`
  if (rows.length === 0) return `${prefix}001`
  const last = (rows[0] as { invoice_number: string }).invoice_number
  const num  = parseInt(last.replace(prefix, ''), 10)
  return `${prefix}${String(num + 1).padStart(3, '0')}`
}
