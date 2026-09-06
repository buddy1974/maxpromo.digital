/**
 * lib/documents/labels.ts
 *
 * Every translatable label used by the shared document engine
 * (DocumentPage, DocumentTable, PaymentSection, InvoiceDocument,
 * AngebotDocument, whatsapp.ts, emailHtml.ts), keyed by DocumentLanguage.
 *
 * This is the ONE place document copy lives in either language — the
 * engine itself (components/documents/**) never branches on language
 * with if/else strings; it always reads `DOCUMENT_LABELS[language].x`.
 * That's what "one shared renderer, no duplicate DE/EN templates" means
 * in practice.
 *
 * Client-written content (line-item descriptions, notes, payment terms)
 * is NEVER looked up here — it's rendered verbatim, exactly as typed.
 */

import type { DocumentLanguage } from './config'

interface DocumentLabelSet {
  // Titles
  invoiceTitle: string
  quoteTitle: string
  // FROM / TO / DETAILS block
  from: string
  to: string
  invoiceDetailsHeading: string
  quoteDetailsHeading: string
  invoiceNumber: string
  quoteNumber: string
  invoiceDate: string
  quoteDate: string
  dueDate: string
  validUntil: string
  currency: string
  // Line items table
  servicesHeading: string
  colPos: string
  colDescription: string
  colQuantity: string
  colUnitPrice: string
  colAmount: string
  // Totals
  subtotal: string
  deposit: string
  remainingBalance: string
  totalDue: string
  quoteTotal: string
  // Payment section
  /** Short numbered-section title ("2. Zahlung" / "2. Payment") — distinct from paymentDetailsHeading so the two headings a few lines apart don't repeat the same words. */
  paymentSectionTitle: string
  paymentDetailsHeading: string
  bankTransfer: string
  accountHolder: string
  paymentReference: string
  momoScanToPay: string
  // Angebot-only copy
  dearSirMadam: string
  dear: (firstName: string) => string
  quoteIntro: (number: string, date: string) => string
  includedFree: string
  paymentTerms: string
  quoteValidUntilNote: (date: string) => string
  closing: string
  quoteAcceptanceHeading: string
  quoteAcceptanceBody: string
  placeDate: string
  namePrinted: string
  signature: string
  // Invoice-only copy
  depositThanks: (amount: string, date: string) => string
  // Footer
  taxNumberLabel: string
  taxOfficeLabel: string
  // Filenames / email subjects
  filenamePrefixInvoice: string
  filenamePrefixQuote: string
  emailSubjectInvoice: (number: string) => string
  emailSubjectQuote: (number: string) => string
}

const de: DocumentLabelSet = {
  invoiceTitle: 'RECHNUNG',
  quoteTitle: 'ANGEBOT',
  from: 'Von',
  to: 'An',
  invoiceDetailsHeading: 'Rechnungsdetails',
  quoteDetailsHeading: 'Angebotsdetails',
  invoiceNumber: 'Rechnungsnummer',
  quoteNumber: 'Angebotsnummer',
  invoiceDate: 'Rechnungsdatum',
  quoteDate: 'Angebotsdatum',
  dueDate: 'Fällig bis',
  validUntil: 'Gültig bis',
  currency: 'Währung',
  servicesHeading: 'Leistungen',
  colPos: 'Pos',
  colDescription: 'Beschreibung',
  colQuantity: 'Menge',
  colUnitPrice: 'Einzelpreis',
  colAmount: 'Betrag',
  subtotal: 'Zwischensumme',
  deposit: 'Anzahlung',
  remainingBalance: 'Restbetrag',
  totalDue: 'Gesamtbetrag',
  quoteTotal: 'Angebotssumme',
  paymentSectionTitle: 'Zahlung',
  paymentDetailsHeading: 'Zahlungsdetails',
  bankTransfer: 'Banküberweisung',
  accountHolder: 'Kontoinhaber',
  paymentReference: 'Verwendungszweck',
  momoScanToPay: 'Zum Bezahlen scannen',
  dearSirMadam: 'Sehr geehrte Damen und Herren,',
  dear: (firstName) => `Sehr geehrte/r ${firstName},`,
  quoteIntro: (number, date) =>
    `vielen Dank für Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. ${number} vom ${date} mit folgenden Leistungen (Scope & Deliverables):`,
  includedFree: 'Inklusive (kostenlos)',
  paymentTerms: 'Zahlungsbedingungen',
  quoteValidUntilNote: (date) => `Angebot gültig bis ${date}.`,
  closing: 'Mit freundlichen Grüßen',
  quoteAcceptanceHeading: 'Annahme des Angebots',
  quoteAcceptanceBody: 'Mit Unterschrift bestätigen Sie die Annahme dieses Angebots zu den oben genannten Konditionen.',
  placeDate: 'Ort, Datum',
  namePrinted: 'Name (Druckschrift)',
  signature: 'Unterschrift',
  depositThanks: (amount, date) => `Vielen Dank für Ihre Anzahlung von ${amount} am ${date}.`,
  taxNumberLabel: 'Steuernummer',
  taxOfficeLabel: 'Finanzamt',
  filenamePrefixInvoice: 'Rechnung',
  filenamePrefixQuote: 'Angebot',
  emailSubjectInvoice: (number) => `Rechnung Nr. ${number} — Maxpromo Digital`,
  emailSubjectQuote: (number) => `Angebot Nr. ${number} — Maxpromo Digital`,
}

const en: DocumentLabelSet = {
  invoiceTitle: 'INVOICE',
  quoteTitle: 'QUOTE',
  from: 'From',
  to: 'To',
  invoiceDetailsHeading: 'Invoice Details',
  quoteDetailsHeading: 'Quote Details',
  invoiceNumber: 'Invoice Number',
  quoteNumber: 'Quote Number',
  invoiceDate: 'Invoice Date',
  quoteDate: 'Quote Date',
  dueDate: 'Due Date',
  validUntil: 'Valid Until',
  currency: 'Currency',
  servicesHeading: 'Services',
  colPos: 'Pos',
  colDescription: 'Description',
  colQuantity: 'Quantity',
  colUnitPrice: 'Unit Price',
  colAmount: 'Amount',
  subtotal: 'Subtotal',
  deposit: 'Deposit',
  remainingBalance: 'Remaining Balance',
  totalDue: 'Total Due',
  quoteTotal: 'Quote Total',
  paymentSectionTitle: 'Payment',
  paymentDetailsHeading: 'Payment Details',
  bankTransfer: 'Bank Transfer',
  accountHolder: 'Account Holder',
  paymentReference: 'Payment Reference',
  momoScanToPay: 'Scan to pay',
  dearSirMadam: 'Dear Sir or Madam,',
  dear: (firstName) => `Dear ${firstName},`,
  quoteIntro: (number, date) =>
    `thank you for your enquiry. Please find enclosed my quote No. ${number} dated ${date} covering the following services (scope & deliverables):`,
  includedFree: 'Included (free)',
  paymentTerms: 'Payment Terms',
  quoteValidUntilNote: (date) => `Quote valid until ${date}.`,
  closing: 'Kind regards',
  quoteAcceptanceHeading: 'Quote Acceptance',
  quoteAcceptanceBody: 'By signing below you confirm acceptance of this quote under the terms stated above.',
  placeDate: 'Place, Date',
  namePrinted: 'Name (printed)',
  signature: 'Signature',
  depositThanks: (amount, date) => `Thank you for your deposit of ${amount} on ${date}.`,
  taxNumberLabel: 'Tax No.',
  taxOfficeLabel: 'Tax Office',
  filenamePrefixInvoice: 'Invoice',
  filenamePrefixQuote: 'Quote',
  emailSubjectInvoice: (number) => `Invoice No. ${number} — Maxpromo Digital`,
  emailSubjectQuote: (number) => `Quote No. ${number} — Maxpromo Digital`,
}

export const DOCUMENT_LABELS: Record<DocumentLanguage, DocumentLabelSet> = { de, en }

/** Convenience getter — defaults to German for null/undefined (matches the DB column's DEFAULT 'de'). */
export function getLabels(language?: DocumentLanguage | null): DocumentLabelSet {
  return DOCUMENT_LABELS[language ?? 'de']
}
