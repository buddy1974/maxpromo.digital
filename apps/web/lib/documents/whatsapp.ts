/**
 * lib/documents/whatsapp.ts
 *
 * Builds the wa.me click-to-chat link used by both print pages. WhatsApp
 * click-to-chat URLs only support prefilled text — there's no API to
 * attach a file — so the print page auto-fires window.print() (the PDF
 * lands in Downloads) and this link just opens a chat with a summary
 * message prefilled; the user attaches the saved PDF manually.
 *
 * The message is rendered in the DOCUMENT's language (inv.language /
 * a.language), never the OS interface language — a German OS user
 * sending an English invoice gets an English WhatsApp message to match.
 */

import { BUSINESS } from './config'
import { fmtCurrency, fmtDocDate } from './format'
import { getLabels } from './labels'
import type { AngebotData, InvoiceData } from './types'

export function buildInvoiceWhatsAppUrl(inv: InvoiceData): string {
  const t = getLabels(inv.language)
  const vat = BUSINESS.vatClause[inv.language ?? 'de']
  const items = (Array.isArray(inv.line_items) ? inv.line_items : [])
    .map((i) => `• ${i.description}: ${fmtCurrency(Number(i.total), inv.currency)}`)
    .join('\n')

  const hasAnz = Number(inv.anzahlung) > 0
  const anzText = hasAnz
    ? `\n${t.deposit}: ${fmtCurrency(Number(inv.anzahlung), inv.currency)}\n${t.remainingBalance}: ${fmtCurrency(Number(inv.restbetrag ?? (Number(inv.total) - Number(inv.anzahlung))), inv.currency)}`
    : ''

  const greeting = inv.language === 'en' ? `Hello ${inv.client_name},` : `Guten Tag ${inv.client_name},`
  const intro = inv.language === 'en'
    ? `attached is your Invoice No. ${inv.invoice_number} from ${BUSINESS.brandFull}.`
    : `anbei Ihre Rechnung Nr. ${inv.invoice_number} von ${BUSINESS.brandFull}.`
  const servicesLabel = inv.language === 'en' ? '📋 Services:' : '📋 Leistungen:'
  const dueLabel = inv.language === 'en' ? '📅 Payment due:' : '📅 Zahlungsziel:'
  const pdfNote = inv.language === 'en'
    ? 'The complete document is attached as a PDF.'
    : 'Das vollständige Dokument als PDF finden Sie im Anhang.'
  const taxLabel = t.taxNumberLabel
  const closingWord = t.closing

  const msg = `${greeting}

${intro}

${servicesLabel}
${items}

💰 ${t.totalDue}: ${fmtCurrency(Number(inv.total), inv.currency)}${anzText}

${dueLabel} ${fmtDocDate(inv.due_date, inv.language)}

${pdfNote}

${taxLabel}: ${BUSINESS.steuernummer}
${vat}

${closingWord}
${BUSINESS.legalName}
${BUSINESS.brandFull}
${BUSINESS.phone}
${BUSINESS.website}`

  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export function buildAngebotWhatsAppUrl(a: AngebotData): string {
  const t = getLabels(a.language)
  const vat = BUSINESS.vatClause[a.language ?? 'de']
  const items = (Array.isArray(a.line_items) ? a.line_items : [])
    .map((i) => `• ${i.description}: ${fmtCurrency(Number(i.total), a.currency)}`)
    .join('\n')

  const paymentBlock = a.payment_terms ? `\n\n${t.paymentTerms}: ${a.payment_terms}` : ''
  const greeting = a.language === 'en' ? `Hello ${a.client_name},` : `Guten Tag ${a.client_name},`
  const intro = a.language === 'en'
    ? `attached is my Quote No. ${a.angebot_number} (PDF attached).`
    : `anbei mein Angebot Nr. ${a.angebot_number} (PDF angehängt).`
  const validLabel = a.language === 'en' ? 'Quote valid until:' : 'Angebot gültig bis:'

  const msg = `${greeting}

${intro}

${t.servicesHeading}:
${items}

${t.quoteTotal}: ${fmtCurrency(Number(a.total), a.currency)}${paymentBlock}

${validLabel} ${fmtDocDate(a.valid_until, a.language)}

${vat}

${t.closing}
${BUSINESS.legalName}
${BUSINESS.brandFull} · ${BUSINESS.website} · ${BUSINESS.phone}`

  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}
