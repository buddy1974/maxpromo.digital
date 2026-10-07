import { token } from '@maxpromo/design-tokens'
import type { CurrencyCode, DocumentLanguage } from '@/lib/documents/config'
import { BUSINESS } from '@/lib/documents/identity'
import { fmtCurrency, fmtUnitPrice, fmtDocDate, splitClientName } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'
import {
  escHtml, emailSalutation, buildEmailHeaderHtml, buildEmailAddressBlockHtml,
  buildEmailTableHeaderHtml, buildEmailBankBlockHtml, buildEmailFooterHtml, buildEmailVatClauseHtml,
} from '@/lib/documents/emailHtml'

/**
 * lib/documents/emails.ts — SERVER ONLY.
 *
 * The quotation and invoice emails, as the client receives them.
 *
 * Moved out of the two send routes unchanged when the commercial service
 * began sending the same documents (ADR-0018): one document, one email,
 * whichever door sent it. The identity, the bank block and the §19 UStG clause
 * reach these builders from lib/documents/identity.ts and emailHtml.ts as
 * before; nothing here restates them.
 */

export const DOCUMENT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'MAXPROMO DIGITAL <info@maxpromo.digital>'

interface AngebotLineItem {
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

export function buildAngebotEmail(a: AngebotRow): string {
  const language: DocumentLanguage = a.language ?? 'de'
  const t = getLabels(language)
  const { name: nameOnly, company } = splitClientName(a.client_name)
  const salutation = emailSalutation(nameOnly, company, language)
  const currency = a.currency ?? 'EUR'
  const fmt = (n: number) => fmtCurrency(n, currency)
  const fmtDate = (v: string | null) => fmtDocDate(v, language)

  const subtotal = Number(a.subtotal ?? a.total)
  const total    = Number(a.total)
  const anzahl   = Number(a.anzahlung ?? 0)
  const hasAnz   = anzahl > 0
  const restbet  = hasAnz ? total - anzahl : total

  const items = Array.isArray(a.line_items) ? a.line_items : []
  const rows = items.map((item, i) => {
    const qty = item.isFixedPrice ? 1 : Number(item.qty || 1)
    const total = Number(item.total) || 0
    return `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:${token.primaryText};font-family:monospace;font-size:11px;font-weight:700;vertical-align:top;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:${token.text};font-size:13px;line-height:1.5;white-space:pre-wrap;vertical-align:top;">${escHtml(item.description)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:${token.textMuted};text-align:right;font-family:monospace;font-size:12px;vertical-align:top;">${qty}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:${token.textMuted};text-align:right;font-family:monospace;font-size:12px;vertical-align:top;">${fmtUnitPrice(total, qty, currency)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:${token.text};text-align:right;font-family:monospace;font-size:13px;font-weight:700;vertical-align:top;">${fmt(total)}</td>
    </tr>`
  }).join('')

  const totalsHtml = hasAnz ? `
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">${escHtml(t.subtotal)}</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">${fmt(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">${escHtml(t.deposit)} (${escHtml(a.anzahlung_method ?? t.bankTransfer)})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">−${fmt(anzahl)}</td>
    </tr>
    <tr style="background:${token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:${token.surfaceInverted};text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.remainingBalance)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:${token.surfaceInverted};text-align:right;">${fmt(restbet)}</td>
    </tr>` : `
    <tr style="background:${token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:${token.surfaceInverted};text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.quoteTotal)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:${token.surfaceInverted};text-align:right;">${fmt(total)}</td>
    </tr>`

  // Inklusive (kostenlos) list intentionally omitted from the email body
  // — kept compact per Marcel's preference. The data is still stored in
  // the row and visible inside the OS for internal reference.

  const paymentBlock = a.payment_terms
    ? `<p style="font-size:12px;color:${token.textSecondary};margin:0 0 8px;"><strong>${escHtml(t.paymentTerms)}:</strong> ${escHtml(a.payment_terms)}</p>`
    : ''

  const introHtml = language === 'en'
    ? `thank you for your enquiry. Please find enclosed my Quote No. <strong>${escHtml(a.angebot_number)}</strong> dated ${fmtDate(a.created_at)} covering the following services:`
    : `vielen Dank für Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. <strong>${escHtml(a.angebot_number)}</strong> vom ${fmtDate(a.created_at)} mit folgenden Leistungen:`

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:${token.surface};">

      ${buildEmailHeaderHtml({
        docTypeLabel: t.quoteTitle,
        numberLabel: t.quoteNumber,
        number: a.angebot_number,
        dateLabel: t.quoteDate,
        date: fmtDate(a.created_at),
        secondaryDateLabel: t.validUntil,
        secondaryDate: fmtDate(a.valid_until),
      })}

      ${buildEmailAddressBlockHtml({ nameOnly, company, address: a.client_address, language })}

      <div style="padding:24px 32px;">
        <p style="color:${token.textSecondary};font-size:13px;margin:0 0 16px;font-family:monospace;">${salutation}</p>
        <p style="color:${token.textSecondary};font-size:14px;margin:0 0 20px;line-height:1.7;">
          ${introHtml}
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid ${token.border};margin-bottom:4px;">
          ${buildEmailTableHeaderHtml(language)}
          ${rows}
          ${totalsHtml}
        </table>

        ${paymentBlock}

        ${buildEmailVatClauseHtml(language, t.quoteValidUntilNote(fmtDate(a.valid_until)))}

        <p style="color:${token.textSecondary};font-size:13px;line-height:1.5;margin:0 0 16px;">
          ${escHtml(t.closing)}<br>
          <strong>Marcel Tabit Akwe</strong>
        </p>
      </div>

      ${buildEmailFooterHtml(language)}
    </div>`
}

export interface InvoiceEmailLineItem {
  description: string
  qty: number
  unit_price: number
  total: number
}

export function buildInvoiceEmail(data: {
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
}): string {
  const currency = data.currency ?? 'EUR'
  const language = data.language ?? 'de'
  const t = getLabels(language)
  const fmt = (n: number) => fmtCurrency(n, currency)
  const fmtDate = (v: string) => fmtDocDate(v, language)

  // Split combined "Name — Company" field
  const { name: nameOnly, company } = splitClientName(data.client_name)
  const salutation = emailSalutation(nameOnly, company, language)

  // Anzahlung logic
  const hasAnz  = Number(data.anzahlung) > 0
  const subtotal = Number(data.subtotal ?? data.total)
  const restbet  = hasAnz
    ? Number(data.restbetrag ?? (subtotal - Number(data.anzahlung)))
    : subtotal
  const amountDue = hasAnz ? restbet : subtotal
  const amountLabel = hasAnz ? t.remainingBalance : (language === 'en' ? 'Amount' : 'Betrag')

  // Line items rows
  const rows = data.line_items.map((item, i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid ${token.border};color:${token.primaryText};font-family:monospace;font-size:12px;font-weight:700;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid ${token.border};color:${token.text};">${escHtml(item.description)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid ${token.border};color:${token.textMuted};text-align:right;font-family:monospace;">${item.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid ${token.border};color:${token.textMuted};text-align:right;font-family:monospace;">${fmt(Number(item.unit_price ?? item.total))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid ${token.border};color:${token.text};text-align:right;font-family:monospace;font-weight:700;">${fmt(Number(item.total))}</td>
    </tr>`).join('')

  // Totals rows
  const totalsHtml = hasAnz ? `
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">${escHtml(t.subtotal)}</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">${fmt(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">${escHtml(t.deposit)} (${escHtml(data.anzahlung_method ?? t.bankTransfer)})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:${token.textMuted};text-align:right;">−${fmt(Number(data.anzahlung))}</td>
    </tr>
    <tr style="background:${token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:${token.surfaceInverted};text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.remainingBalance)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:${token.surfaceInverted};text-align:right;">${fmt(restbet)}</td>
    </tr>` : `
    <tr style="background:${token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:${token.surfaceInverted};text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.totalDue)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:${token.surfaceInverted};text-align:right;">${fmt(subtotal)}</td>
    </tr>`

  // Anzahlung date acknowledgement
  const anzDateNote = hasAnz && data.anzahlung_date
    ? `<p style="font-family:monospace;font-size:11px;color:${token.textMuted};font-style:italic;margin:0 0 12px;">
        ${escHtml(t.depositThanks(fmt(Number(data.anzahlung)), fmtDate(data.anzahlung_date)))}
      </p>`
    : ''

  const introHtml = language === 'en'
    ? `attached is your Invoice No. <strong>${escHtml(data.invoice_number)}</strong> dated ${fmtDate(data.date)}.<br>
       Please transfer the <strong>${amountLabel} of ${fmt(amountDue)}</strong> by <strong>${fmtDate(data.due_date)}</strong> to the following account:`
    : `anbei erhalten Sie Ihre Rechnung Nr. <strong>${escHtml(data.invoice_number)}</strong> vom ${fmtDate(data.date)}.<br>
       Bitte überweisen Sie den <strong>${amountLabel} von ${fmt(amountDue)}</strong> bis zum <strong>${fmtDate(data.due_date)}</strong> auf folgendes Konto:`

  const closingHtml = language === 'en'
    ? `If you have any questions, please don't hesitate to reach out.<br><br>${escHtml(t.closing)}<br><strong>${escHtml(BUSINESS.legalName)}</strong><br>${escHtml(BUSINESS.brandFull)}`
    : `Für Rückfragen stehe ich Ihnen jederzeit zur Verfügung.<br><br>${escHtml(t.closing)}<br><strong>${escHtml(BUSINESS.legalName)}</strong><br>${escHtml(BUSINESS.brandFull)}`

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:${token.surface};">

      ${buildEmailHeaderHtml({
        docTypeLabel: t.invoiceTitle,
        numberLabel: t.invoiceNumber,
        number: data.invoice_number,
        dateLabel: t.invoiceDate,
        date: fmtDate(data.date),
        secondaryDateLabel: t.dueDate,
        secondaryDate: fmtDate(data.due_date),
      })}

      ${buildEmailAddressBlockHtml({ nameOnly, company, address: data.address, language })}

      <!-- Letter body -->
      <div style="padding:24px 32px;">
        <p style="color:${token.textSecondary};font-size:13px;margin:0 0 16px;font-family:monospace;">${salutation}</p>
        <p style="color:${token.textSecondary};font-size:14px;margin:0 0 20px;line-height:1.7;">
          ${introHtml}
        </p>

        ${buildEmailBankBlockHtml(data.invoice_number, language)}

        <!-- Line items table -->
        <table style="width:100%;border-collapse:collapse;border:1px solid ${token.border};margin-bottom:4px;">
          ${buildEmailTableHeaderHtml(language)}
          ${rows}
          ${totalsHtml}
        </table>

        <!-- Anzahlung date note -->
        ${anzDateNote}

        ${buildEmailVatClauseHtml(language)}

        <!-- Closing -->
        <p style="color:${token.textMuted};font-size:14px;line-height:1.7;margin:0 0 20px;">
          ${closingHtml}
        </p>
      </div>

      ${buildEmailFooterHtml(language)}
    </div>`
}

