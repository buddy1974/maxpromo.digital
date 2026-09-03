/**
 * lib/documents/emailHtml.ts
 *
 * Shared HTML fragment builders for transactional emails (send-invoice,
 * send-angebot). Before this module existed, the letterhead header, the
 * "An / To" address block, the line-item table header row, and the
 * footer were pasted independently into `buildInvoiceEmail()` and
 * `buildAngebotEmail()` — each with its own hardcoded business details.
 *
 * This is the one place that email markup lives now. Business identity
 * comes from `./config`, matching the print/PDF document system exactly,
 * so an invoice email and a printed invoice can never drift apart.
 *
 * Every builder here takes the document's `language` (never the OS
 * interface language) and looks its copy up from `./labels` — the same
 * dictionary the print/PDF engine uses, so an emailed invoice and its
 * printed twin are always worded identically.
 */

import { BUSINESS, BANK_TRANSFER, BRAND_COLORS, type DocumentLanguage } from './config'
import { getLabels } from './labels'

const BUSINESS_INK = BRAND_COLORS.ink
const BUSINESS_ACCENT = BRAND_COLORS.accent

/** Escape a string for safe interpolation into HTML markup. */
export function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Salutation line — the formal "Dear Sir or Madam" form when a company
 * is present (business correspondence convention), otherwise addresses
 * the individual by first name. Wording follows the document's own
 * language, not the OS interface language.
 */
export function emailSalutation(nameOnly: string, company: string, language?: DocumentLanguage | null): string {
  const t = getLabels(language)
  return company ? t.dearSirMadam : t.dear(escHtml(nameOnly.split(' ')[0]))
}

/**
 * Letterhead header: business identity block (left) + document type,
 * number and dates (right), on the dark/orange band matching the
 * printed document letterhead.
 */
export function buildEmailHeaderHtml(opts: {
  docTypeLabel: string
  numberLabel: string
  number: string
  dateLabel: string
  date: string
  secondaryDateLabel?: string
  secondaryDate?: string
}): string {
  const secondary = opts.secondaryDateLabel
    ? `<p style="font-family:monospace;font-size:11px;color:#888;margin:0;">${escHtml(opts.secondaryDateLabel)}: ${escHtml(opts.secondaryDate ?? '—')}</p>`
    : ''
  return `
      <div style="background:${BUSINESS_INK};padding:28px 32px;border-bottom:4px solid ${BUSINESS_ACCENT};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="font-family:monospace;font-size:14px;font-weight:700;color:#FFF;margin:0 0 6px;letter-spacing:0.05em;">${escHtml(BUSINESS.brandFull)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">${escHtml(BUSINESS.legalName)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">${escHtml(BUSINESS.addressLine1)}, ${escHtml(BUSINESS.addressLine2)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">${escHtml(BUSINESS.email)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0;">${escHtml(BUSINESS.phone)}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-family:monospace;font-size:18px;font-weight:700;color:#FFF;margin:0 0 6px;letter-spacing:0.1em;">${escHtml(opts.docTypeLabel)}</p>
            <p style="font-family:monospace;font-size:12px;color:${BUSINESS_ACCENT};margin:0 0 2px;">${escHtml(opts.numberLabel)}: ${escHtml(opts.number)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">${escHtml(opts.dateLabel)}: ${escHtml(opts.date)}</p>
            ${secondary}
          </div>
        </div>
      </div>`
}

/** Address block ("An" / "To"), language-aware label. */
export function buildEmailAddressBlockHtml(opts: { nameOnly: string; company: string; address?: string | null; language?: DocumentLanguage | null }): string {
  const t = getLabels(opts.language)
  const lines = [
    `<p style="color:#111;font-size:15px;margin:0 0 2px;font-weight:600;">${escHtml(opts.nameOnly)}</p>`,
    opts.company ? `<p style="color:#555;font-size:13px;margin:0 0 2px;">${escHtml(opts.company)}</p>` : '',
    opts.address ? `<p style="color:#555;font-size:13px;margin:0;">${escHtml(opts.address)}</p>` : '',
  ].filter(Boolean).join('')

  return `
      <div style="padding:20px 32px;background:${BRAND_COLORS.surfaceSubtle};border-bottom:1px solid #eee;">
        <p style="color:#888;font-size:10px;margin:0 0 8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;">${escHtml(t.to)}</p>
        ${lines}
      </div>`
}

/** Line-item table header row, language-aware column labels. */
export function buildEmailTableHeaderHtml(language?: DocumentLanguage | null): string {
  const t = getLabels(language)
  return `
          <tr style="background:${BRAND_COLORS.surfaceSubtle};">
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${escHtml(t.colPos)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${escHtml(t.colDescription)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${escHtml(t.colQuantity)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${escHtml(t.colUnitPrice)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${escHtml(t.colAmount)}</th>
          </tr>`
}

/** Bank-transfer details box, used on invoice emails. `reference` is the invoice/Angebot number, shown as the payment reference (Verwendungszweck). */
export function buildEmailBankBlockHtml(reference: string, language?: DocumentLanguage | null): string {
  const t = getLabels(language)
  return `
        <div style="background:${BRAND_COLORS.surfaceSubtle};border-left:3px solid ${BUSINESS_ACCENT};padding:16px 20px;margin-bottom:28px;">
          <p style="font-family:monospace;font-size:10px;color:${BUSINESS_ACCENT};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">${escHtml(t.bankTransfer)}</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">${escHtml(t.accountHolder)}: ${escHtml(BANK_TRANSFER.beneficiary)}</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">IBAN: ${escHtml(BANK_TRANSFER.iban)}</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">BIC: ${escHtml(BANK_TRANSFER.bic)}</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0;">${escHtml(t.paymentReference)}: ${escHtml(reference)}</p>
        </div>`
}

/** Footer band — tax identifiers + business contact line, language-aware labels. */
export function buildEmailFooterHtml(language?: DocumentLanguage | null): string {
  const t = getLabels(language)
  return `
      <div style="background:${BUSINESS_INK};padding:20px 32px;">
        <p style="font-family:monospace;font-size:11px;color:#555;margin:0 0 4px;">
          ${escHtml(t.taxNumberLabel)}: ${escHtml(BUSINESS.steuernummer)} &nbsp;·&nbsp; ${escHtml(t.taxOfficeLabel)}: ${escHtml(BUSINESS.finanzamt)}
        </p>
        <p style="font-family:monospace;font-size:10px;color:${BRAND_COLORS.muted};margin:0;">
          ${escHtml(BUSINESS.brandFull)} &nbsp;·&nbsp; ${escHtml(BUSINESS.addressLine1)} &nbsp;·&nbsp; ${escHtml(BUSINESS.addressLine2)} &nbsp;·&nbsp; ${escHtml(BUSINESS.email)} &nbsp;·&nbsp; ${escHtml(BUSINESS.phone)}
        </p>
      </div>`
}

/** §19 UStG mandatory clause line, styled for email body use, in the document's own language. */
export function buildEmailVatClauseHtml(language?: DocumentLanguage | null, extra?: string): string {
  const clause = BUSINESS.vatClause[language ?? 'de']
  const suffix = extra ? ` ${escHtml(extra)}` : ''
  return `<p style="font-family:monospace;font-size:11px;color:#888;margin:12px 0 20px;">${escHtml(clause)}${suffix}</p>`
}
