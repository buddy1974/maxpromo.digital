/**
 * lib/documents/mail.ts — SERVER ONLY.
 *
 * Quotation, invoice and payment-reminder emails in the Maxpromo outbound identity (ADR-0023,
 * ADR-0025): the one renderer (lib/mail/identity/render.ts), sent from the mailbox through
 * Hostinger like every other Maxpromo email, with the document itself attached as a PDF
 * (lib/documents/pdf.ts) — "anbei" is now true.
 *
 * Every word comes from the stored record: number, dates, amounts, bank details. Nothing is
 * restated here; nothing is invented. VAT is never computed or shown; the § 19 UStG clause is
 * printed because these are commercial families.
 *
 * `version` binds an approval to the exact email: subject, HTML, text and the PDF bytes. The PDF
 * renderer is deterministic for a stored row, so the same record always gives the same version.
 */
import { createHash } from 'node:crypto'
import { renderEmail } from '@/lib/mail/identity/render'
import type { FamilyId } from '@/lib/mail/identity/families'
import type { SendPayload } from '@/lib/mail/provider'
import type { CurrencyCode, DocumentLanguage } from './config'
import { BANK_TRANSFER } from './identity'
import { fmtCurrency, fmtDocDate, splitClientName } from './format'
import { getLabels } from './labels'
import { documentPdfFilename, renderAngebotPdf, renderInvoicePdf, type AngebotPdfData, type InvoicePdfData } from './pdf'

export interface DocumentMail {
  subject: string
  html: string
  text: string
  family: FamilyId
  language: DocumentLanguage
  attachments: NonNullable<SendPayload['attachments']>
  attachmentMeta: { filename: string; contentType: string; size: number }[]
  version: string
}

const sha = (v: string | Uint8Array) => createHash('sha256').update(v).digest('hex')

function finish(p: { subject: string; family: FamilyId; language: DocumentLanguage; body: string; name: string | null; reference: [string, string][]; payUrl?: string | null; pdf: Uint8Array; filename: string }): DocumentMail {
  const action = p.payUrl ? { label: p.language === 'de' ? 'Online bezahlen' : 'Pay online', url: p.payUrl } : null
  const rendered = renderEmail({ family: p.family, language: p.language, body: p.body, recipientName: p.name, reference: p.reference, action })
  const content = Buffer.from(p.pdf).toString('base64')
  return {
    subject: p.subject, html: rendered.html, text: rendered.text, family: p.family, language: p.language,
    attachments: [{ filename: p.filename, content, contentType: 'application/pdf', encoding: 'base64' }],
    attachmentMeta: [{ filename: p.filename, contentType: 'application/pdf', size: p.pdf.byteLength }],
    version: sha(`${p.subject}\n${rendered.html}\n${rendered.text}\n${sha(p.pdf)}`).slice(0, 32),
  }
}

/** First name for the greeting; a company-only recipient is greeted without a name. */
function greetingName(clientName: string): string | null {
  const { name } = splitClientName(clientName)
  return name && !name.includes('@') ? name : null
}

function bankRows(reference: string, language: DocumentLanguage): [string, string][] {
  const de = language === 'de'
  return [
    [de ? 'Kontoinhaber' : 'Account holder', BANK_TRANSFER.beneficiary],
    ['IBAN', BANK_TRANSFER.iban],
    ['BIC', BANK_TRANSFER.bic],
    [de ? 'Verwendungszweck' : 'Payment reference', reference],
  ]
}

export interface InvoiceMailInput extends InvoicePdfData { invoice_number: string; client_name: string }

/** What the invoice asks for: the printed remaining balance, or total less a stated deposit. */
export function invoiceAsks(d: Pick<InvoicePdfData, 'total' | 'anzahlung' | 'restbetrag'>): number {
  if (d.restbetrag !== undefined && d.restbetrag !== null) return Number(d.restbetrag)
  return Math.max(0, Number(d.total) - Number(d.anzahlung ?? 0))
}

export async function invoiceMail(d: InvoiceMailInput, opts: { open?: number; payUrl?: string | null } = {}): Promise<DocumentMail> {
  const language: DocumentLanguage = d.language === 'en' ? 'en' : 'de'
  const cur = (d.currency ?? 'EUR') as CurrencyCode
  const t = getLabels(language)
  const asks = invoiceAsks(d)
  const due = opts.open ?? asks
  const de = language === 'de'
  const date = fmtDocDate(d.date, language), dueDate = fmtDocDate(d.due_date, language)
  const deposit = Number(d.anzahlung ?? 0) > 0
  const body = [
    de ? `anbei erhalten Sie Ihre Rechnung Nr. ${d.invoice_number} vom ${date} als PDF.` : `please find attached your invoice no. ${d.invoice_number} dated ${date} as a PDF.`,
    de ? `Bitte überweisen Sie ${fmtCurrency(due, cur)} bis zum ${dueDate} auf das unten genannte Konto und geben Sie die Rechnungsnummer als Verwendungszweck an.`
       : `Please transfer ${fmtCurrency(due, cur)} by ${dueDate} to the account below, quoting the invoice number as the payment reference.`,
    ...(deposit ? [de ? `Ihre Anzahlung von ${fmtCurrency(Number(d.anzahlung), cur)} ist bereits berücksichtigt.` : `Your deposit of ${fmtCurrency(Number(d.anzahlung), cur)} has already been deducted.`] : []),
    ...(opts.payUrl ? [de ? 'Sie können die Rechnung auch online per Karte bezahlen.' : 'You can also pay this invoice online by card.'] : []),
    de ? 'Bei Fragen antworten Sie einfach auf diese E-Mail.' : 'If you have any questions, simply reply to this email.',
  ].join('\n\n')
  const reference: [string, string][] = [
    [de ? 'Rechnung' : 'Invoice', d.invoice_number],
    [de ? 'Rechnungsdatum' : 'Invoice date', date],
    [de ? 'Fällig am' : 'Due date', dueDate],
    [de ? 'Zu zahlen' : 'Amount due', fmtCurrency(due, cur)],
    ...bankRows(d.invoice_number, language),
  ]
  return finish({ subject: t.emailSubjectInvoice(d.invoice_number), family: 'invoice', language, body, name: greetingName(d.client_name), reference, payUrl: opts.payUrl,
    pdf: await renderInvoicePdf(d), filename: documentPdfFilename('invoice', d.invoice_number, language) })
}

export async function angebotMail(a: AngebotPdfData): Promise<DocumentMail> {
  const language: DocumentLanguage = a.language === 'en' ? 'en' : 'de'
  const cur = (a.currency ?? 'EUR') as CurrencyCode
  const t = getLabels(language)
  const de = language === 'de'
  const date = fmtDocDate(a.created_at, language)
  const valid = a.valid_until ? fmtDocDate(a.valid_until, language) : null
  const body = [
    de ? `vielen Dank für Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. ${a.angebot_number} vom ${date} als PDF.` : `thank you for your enquiry. Please find attached my quote no. ${a.angebot_number} dated ${date} as a PDF.`,
    ...(valid ? [de ? `Das Angebot ist gültig bis ${valid}.` : `The quote is valid until ${valid}.`] : []),
    de ? 'Wenn Sie Fragen haben oder etwas angepasst werden soll, antworten Sie einfach auf diese E-Mail.' : 'If you have any questions or would like anything adjusted, simply reply to this email.',
  ].join('\n\n')
  const reference: [string, string][] = [
    [de ? 'Angebot' : 'Quote', a.angebot_number],
    [de ? 'Datum' : 'Date', date],
    ...(valid ? [[de ? 'Gültig bis' : 'Valid until', valid] as [string, string]] : []),
    [de ? 'Gesamtbetrag' : 'Total', fmtCurrency(Number(a.total), cur)],
    ...(a.payment_terms ? [[de ? 'Zahlungsbedingungen' : 'Payment terms', a.payment_terms] as [string, string]] : []),
  ]
  return finish({ subject: t.emailSubjectQuote(a.angebot_number), family: 'proposal', language, body, name: greetingName(a.client_name), reference,
    pdf: await renderAngebotPdf(a), filename: documentPdfFilename('angebot', a.angebot_number, language) })
}

export async function reminderMail(d: InvoiceMailInput, open: number, opts: { payUrl?: string | null } = {}): Promise<DocumentMail> {
  const language: DocumentLanguage = d.language === 'en' ? 'en' : 'de'
  const cur = (d.currency ?? 'EUR') as CurrencyCode
  const de = language === 'de'
  const dueDate = fmtDocDate(d.due_date, language)
  const body = [
    de ? `sicher ist es Ihnen im Alltag entgangen: Zu unserer Rechnung Nr. ${d.invoice_number}, fällig am ${dueDate}, ist ein Betrag von ${fmtCurrency(open, cur)} noch offen.`
       : `this is a friendly reminder that ${fmtCurrency(open, cur)} remains open on our invoice no. ${d.invoice_number}, due on ${dueDate}.`,
    de ? 'Wir bitten Sie, den Betrag in den nächsten Tagen auf das unten genannte Konto zu überweisen. Die Rechnung liegt noch einmal als PDF bei.'
       : 'We would be grateful if you could transfer the amount to the account below in the next few days. The invoice is attached again as a PDF.',
    ...(opts.payUrl ? [de ? 'Sie können auch online per Karte bezahlen.' : 'You can also pay online by card.'] : []),
    de ? 'Sollte sich Ihre Zahlung mit dieser Nachricht überschnitten haben, betrachten Sie sie bitte als gegenstandslos.' : 'If your payment has crossed with this message, please disregard it.',
  ].join('\n\n')
  const reference: [string, string][] = [
    [de ? 'Rechnung' : 'Invoice', d.invoice_number],
    [de ? 'Fällig seit' : 'Due since', dueDate],
    [de ? 'Offen' : 'Open', fmtCurrency(open, cur)],
    ...bankRows(d.invoice_number, language),
  ]
  return finish({ subject: de ? `Zahlungserinnerung — Rechnung Nr. ${d.invoice_number}` : `Payment reminder — invoice no. ${d.invoice_number}`,
    family: 'payment_reminder', language, body, name: greetingName(d.client_name), reference, payUrl: opts.payUrl,
    pdf: await renderInvoicePdf(d), filename: documentPdfFilename('invoice', d.invoice_number, language) })
}
