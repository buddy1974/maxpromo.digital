/**
 * Offline proof for the document PDF renderer (lib/documents/pdf.ts): the invoice and the quotation
 * as files carry the stored facts, the bank details and the § 19 UStG clause, never VAT; long
 * documents paginate; client-typed text cannot break rendering; the same row gives the same bytes.
 * No database, credentials or network.
 */
import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { PDFDocument } from 'pdf-lib'
import { renderInvoicePdf, renderAngebotPdf, documentPdfFilename, type InvoicePdfData, type AngebotPdfData } from '../../lib/documents/pdf.ts'
import { BANK_TRANSFER } from '../../lib/documents/identity.ts'
import { fmtCurrency } from '../../lib/documents/format.ts'

let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }

/* Windows-1252 bytes 0x80–0x9F that differ from Latin-1 (the ones the documents can print). */
const CP1252: Record<number, string> = { 0x80: '€', 0x84: '„', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x91: '‘', 0x92: '’' }

/** Every string drawn on every page, decoded from the (deflated) content streams. */
function pdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString('latin1')
  const out: string[] = []
  const re = /stream\r?\n/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length
    const end = raw.indexOf('endstream', start)
    let body = Buffer.from(raw.slice(start, end), 'latin1')
    try { body = inflateSync(body) } catch { /* not deflated */ }
    for (const hex of body.toString('latin1').matchAll(/<([0-9A-Fa-f\s]*)>\s*Tj/g)) {
      const b = Buffer.from(hex[1].replace(/\s/g, ''), 'hex')
      out.push([...b].map((c) => CP1252[c] ?? String.fromCharCode(c)).join(''))
    }
  }
  return out.join('\n')
}

const pages = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPageCount()
const norm = (s: string) => s.replace(/ /g, ' ')

const invoice: InvoicePdfData = {
  invoice_number: 'MP-2026-002', client_name: 'Jonas Weber — Weber GmbH', address: 'Hauptstr. 1\n45127 Essen',
  date: '2026-05-27', due_date: '2026-06-10',
  line_items: [{ description: 'Website Relaunch', qty: 1, unit_price: 156, total: 156 }],
  subtotal: 156, total: 156, currency: 'EUR', language: 'de',
}
const de = await renderInvoicePdf(invoice)
const deText = norm(pdfText(de))
check('output is a PDF file', Buffer.from(de.slice(0, 5)).toString('latin1') === '%PDF-')
check('invoice PDF carries its number', deText.includes('MP-2026-002'))
check('invoice PDF carries the amount due, formatted in its currency', deText.includes(norm(fmtCurrency(156, 'EUR'))))
check('invoice PDF carries the IBAN from the identity module', deText.includes(BANK_TRANSFER.iban) && deText.includes(BANK_TRANSFER.bic))
check('payment reference is the invoice number', deText.includes('Verwendungszweck: MP-2026-002'))
check('German invoice carries the German § 19 UStG clause', deText.includes('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'))
check('client name, company and address are printed', deText.includes('Jonas Weber') && deText.includes('Weber GmbH') && deText.includes('45127 Essen'))
check('no VAT amount, rate or line anywhere', !/MwSt|Mehrwertsteuer|USt\.|\bVAT\b(?! is charged)|19 ?%|7 ?%/.test(deText.replace('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.', '')))
check('no deposit or remaining-balance lines without a deposit', !deText.includes('Anzahlung') && !deText.includes('Restbetrag'))
check('German footer has page numbering', deText.includes('Seite 1/1'))

const en = norm(pdfText(await renderInvoicePdf({ ...invoice, language: 'en', currency: 'GBP', anzahlung: 50, anzahlung_date: '2026-05-01', restbetrag: 106 })))
check('English invoice carries the English § 19 UStG clause', en.includes('No VAT is charged pursuant to § 19 UStG.') && !en.includes('Umsatzsteuer'))
check('a deposit prints subtotal, deposit and remaining balance', en.includes('Subtotal') && en.includes('Deposit') && en.includes('REMAINING BALANCE') && en.includes(norm(fmtCurrency(106, 'GBP'))))
check('a deposit with a date is acknowledged', en.includes('Thank you for your deposit of'))
check('English labels and page numbering', en.includes('INVOICE') && en.includes('Page 1/1'))

const long = Array.from({ length: 40 }, (_, i) => ({ description: `Leistungsposition ${i + 1}: ${'Konzeption, Gestaltung und Umsetzung der Seite mit ausführlicher Beschreibung. '.repeat(3)}`, qty: 2, unit_price: 50, total: 100 }))
const longPdf = await renderInvoicePdf({ ...invoice, line_items: long, subtotal: 4000, total: 4000 })
const longText = norm(pdfText(longPdf))
check('40 long line items paginate onto more than one page', (await pages(longPdf)) > 1)
check('every line item survives pagination', long.every((_, i) => longText.includes(`Leistungsposition ${i + 1}:`)))
check('continuation pages repeat the document and the page count', longText.includes('RECHNUNG MP-2026-002') && /Seite 2\/\d/.test(longText))

let threw = false
let hostile: Uint8Array | null = null
try {
  hostile = await renderInvoicePdf({ ...invoice, client_name: '<script>alert(1)</script> 李雷 — Firma 😀', address: 'Straße\u0000 1\t\n', line_items: [{ description: 'Emoji 🚀 und 中文 und  nbsp', qty: 1, unit_price: 1, total: 1 }] })
} catch { threw = true }
check('hostile client text (script, emoji, Chinese, control characters) does not throw', !threw && hostile !== null)
check('unencodable characters become "?" and markup stays inert text', norm(pdfText(hostile!)).includes('<script>alert(1)</script> ??') && norm(pdfText(hostile!)).includes('Emoji ? und ?? und'))

const again = await renderInvoicePdf(invoice)
check('deterministic: the same invoice gives identical bytes', Buffer.compare(Buffer.from(de), Buffer.from(again)) === 0)
const meta = await PDFDocument.load(de, { updateMetadata: false })
check('metadata: title, author, fixed creation date from the document date', meta.getTitle() === 'RECHNUNG MP-2026-002' && meta.getAuthor() === 'Maxpromo Digital' && meta.getCreationDate()?.toISOString() === '2026-05-27T12:00:00.000Z')

const angebot: AngebotPdfData = {
  id: 'a1', angebot_number: 'MP-A-2026-003', client_name: 'Lena Fischer', client_email: null, client_address: 'Ring 4\n10115 Berlin',
  line_items: [{ description: 'Online-Shop', qty: 1, total: 2400, isFixedPrice: true }], subtotal: 2400, total: 2400, status: 'draft',
  created_at: '2026-10-01', valid_until: '2026-10-31', notes: 'Wartung 49 € monatlich (nicht im Gesamtbetrag enthalten)', anzahlung: null, anzahlung_date: null,
  anzahlung_method: null, payment_terms: '50 % bei Auftrag, 50 % bei Abnahme', included_items: ['Hosting-Einrichtung'], currency: 'EUR', language: 'de',
}
const q = norm(pdfText(await renderAngebotPdf(angebot)))
check('quotation PDF carries number, validity, total and the § 19 clause', q.includes('MP-A-2026-003') && q.includes('Gültig bis') && q.includes(norm(fmtCurrency(2400, 'EUR'))) && q.includes('Gemäß § 19 UStG'))
check('quotation prints payment terms, notes, included items and the acceptance block', q.includes('Zahlungsbedingungen: 50 % bei Auftrag') && q.includes('Wartung 49') && q.includes('Hosting-Einrichtung') && q.includes('Annahme des Angebots') && q.includes('Unterschrift'))
check('quotation carries no bank block and no VAT', !q.includes('IBAN') && !/MwSt|USt\./.test(q))
const qEn = norm(pdfText(await renderAngebotPdf({ ...angebot, language: 'en' })))
check('English quotation in English', qEn.includes('QUOTE') && qEn.includes('No VAT is charged pursuant to § 19 UStG.') && qEn.includes('Quote Acceptance'))

const names = [documentPdfFilename('invoice', 'MP-2026-002', 'de'), documentPdfFilename('angebot', 'MP-A-2026-003', 'en'), documentPdfFilename('invoice', '../../etc/passwd\r\n"x', 'en'), documentPdfFilename('invoice', '', null)]
check('filenames name the document in its language', names[0] === 'Rechnung_MP-2026-002.pdf' && names[1] === 'Quote_MP-A-2026-003.pdf')
check('filenames are safe: only [A-Za-z0-9_.-], no path or header characters', names.every((n) => /^[A-Za-z0-9_.-]+\.pdf$/.test(n) && !n.includes('..')))

console.log(`\nprove-document-pdf: ${passed} passed`)
