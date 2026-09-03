/**
 * lib/documents/format.ts
 *
 * Shared formatting helpers for the document system. Previously
 * `fmtEur`/`fmtGermanDate`/`fmtUnitPrice` were copy-pasted (EUR-only,
 * German-only) into both print pages, both live-preview panes and both
 * email builders. This module is the one place that logic lives now,
 * and it is currency-aware (EUR/GBP) rather than EUR-only.
 */

import { CURRENCY_LOCALE, DEFAULT_CURRENCY, type CurrencyCode, type DocumentLanguage } from './config'
import type { SplitClientName } from './types'

/** Date-format locale per document language — German documents keep DD.MM.YYYY, English documents read "06 May 2026". */
const DOCUMENT_DATE_LOCALE: Record<DocumentLanguage, string> = { de: 'de-DE', en: 'en-GB' }

/** Format a monetary amount in the given currency (defaults to EUR). */
export function fmtCurrency(amount: number, currency?: CurrencyCode | null): string {
  const code = currency ?? DEFAULT_CURRENCY
  return new Intl.NumberFormat(CURRENCY_LOCALE[code], { style: 'currency', currency: code }).format(amount)
}

/**
 * Display Einzelpreis/Unit price as total ÷ qty so Menge × Einzelpreis =
 * Gesamt always holds for the reader, regardless of what's stored in
 * unit_price. The AI extractor sometimes stores rounded per-unit prices
 * that don't multiply back to the stated total, and the edit forms let
 * users change `total` without touching `unit_price`. Trusting only
 * `total` as the source of truth and deriving the per-unit price at
 * render time keeps the document internally consistent.
 *
 * For sub-cent unit prices we show up to 4 decimals so the math doesn't
 * appear off-by-rounding.
 */
export function fmtUnitPrice(total: number, qty: number, currency?: CurrencyCode | null): string {
  const code = currency ?? DEFAULT_CURRENCY
  const q = qty > 0 ? qty : 1
  const unit = total / q
  const fractionDigits =
    Math.abs(unit * q - total) > 0.005 || Math.abs(unit - Math.round(unit * 100) / 100) > 0.0001 ? 4 : 2
  return new Intl.NumberFormat(CURRENCY_LOCALE[code], {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits,
  }).format(unit)
}

/**
 * Parse a date that may be either a date-only string ("2026-06-04") OR a
 * full ISO datetime ("2026-06-04T00:00:00.000Z"). Returns "—" for null
 * and any unparseable input — never the literal string "Invalid Date".
 */
export function fmtGermanDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = value.length > 10 ? new Date(value) : new Date(value + 'T12:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Language-aware document date formatter. German documents keep the
 * numeric DD.MM.YYYY format (`fmtGermanDate`'s behaviour); English
 * documents render "06 May 2026" — avoids an English invoice reading
 * with an obviously German-formatted date.
 */
export function fmtDocDate(value: string | null | undefined, language?: DocumentLanguage | null): string {
  if (!value) return '—'
  const d = value.length > 10 ? new Date(value) : new Date(value + 'T12:00:00')
  if (isNaN(d.getTime())) return '—'
  const locale = DOCUMENT_DATE_LOCALE[language ?? 'de']
  return d.toLocaleDateString(locale, { day: '2-digit', month: language === 'en' ? 'short' : '2-digit', year: 'numeric' })
}

/**
 * Splits the "Name — Company" convention used on `client_name` across
 * the whole document system into separate name/company strings.
 */
export function splitClientName(clientName: string): SplitClientName {
  const dashIdx = clientName.indexOf(' — ')
  if (dashIdx < 0) return { name: clientName.trim(), company: '' }
  return {
    name: clientName.slice(0, dashIdx).trim(),
    company: clientName.slice(dashIdx + 3).trim(),
  }
}

/** Safe filename fragment for the browser "Save as PDF" suggested title. */
export function fmtDocFilename(prefix: string, number: string, clientName: string): string {
  return `${prefix}-${number}-${clientName}`.replace(/[^a-zA-Z0-9À-ž-]/g, '-').replace(/-+/g, '-')
}
