/**
 * lib/documents/pdf.ts — SERVER ONLY.
 *
 * The invoice and the quotation as a PDF file, so a document email carries the
 * document itself ("anbei") instead of promising an attachment it does not have.
 *
 * Same sources as the print pages and the document emails: identity and bank
 * details from ./identity (which reads @maxpromo/config), copy from ./labels,
 * amounts and dates from ./format, colours from the token mirror in ./config.
 * The input shapes are exactly what buildInvoiceEmail / buildAngebotEmail take,
 * so one stored row renders the email body and its PDF.
 *
 * Legal (Kleinunternehmer / §19 UStG): no VAT is calculated or shown; the
 * clause is printed in the document's language on both documents.
 *
 * Deterministic: the same row gives the same bytes (fixed metadata dates from
 * the document date, no object streams), so a send can be bound to it.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { BRAND_COLORS, type DocumentLanguage } from './config'
import { BUSINESS, BANK_TRANSFER } from './identity'
import { getLabels } from './labels'
import { fmtCurrency, fmtDocDate, fmtUnitPrice, splitClientName } from './format'
import type { AngebotRow, InvoiceDocumentData } from './emails'

export type InvoicePdfData = InvoiceDocumentData
export type AngebotPdfData = AngebotRow
export type DocumentPdfKind = 'invoice' | 'angebot'

/* ── page geometry (A4, points) ─────────────────────────────────────────── */
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 48
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_TOP = 70
const BOTTOM = FOOTER_TOP + 16

const COL = { pos: MARGIN + 6, desc: MARGIN + 34, qtyRight: MARGIN + 330, unitRight: MARGIN + 415, amountRight: MARGIN + CONTENT_W - 6 }
const DESC_W = COL.qtyRight - 40 - COL.desc

function color(hex: string): RGB {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const n = parseInt(full, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const C = {
  ink: color(BRAND_COLORS.ink),
  accent: color(BRAND_COLORS.accent),
  onAccent: color(BRAND_COLORS.onAccent),
  muted: color(BRAND_COLORS.muted),
  faint: color(BRAND_COLORS.faint),
  border: color(BRAND_COLORS.border),
  subtle: color(BRAND_COLORS.surfaceSubtle),
  white: color(BRAND_COLORS.white),
  inverted: color(BRAND_COLORS.textInverted),
}

/* ── text that the standard fonts can encode ────────────────────────────── */

/** Replaces what WinAnsi cannot encode with '?', so client-typed text never makes rendering throw. */
function makeSanitizer(font: PDFFont): (s: string) => string {
  const supported = new Set(font.getCharacterSet())
  return (s: string) => {
    let out = ''
    for (const ch of String(s ?? '').normalize('NFC').replace(/[   ]/g, ' ').replace(/\t/g, ' ')) {
      const cp = ch.codePointAt(0)!
      if (cp === 10) { out += '\n'; continue }
      if (cp < 32 || cp === 127) continue
      out += supported.has(cp) ? ch : '?'
    }
    return out
  }
}

interface Fonts { regular: PDFFont; bold: PDFFont; clean: (s: string) => string }

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(/ +/)
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue }
      if (line) lines.push(line)
      /* A single word longer than the column is broken by characters. */
      let rest = word
      while (font.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
        let cut = rest.length - 1
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    lines.push(line)
  }
  return lines
}

/* ── the shared document writer ─────────────────────────────────────────── */

interface Line { description: string; qty: number; total: number }

interface DocSpec {
  kind: DocumentPdfKind
  language: DocumentLanguage
  title: string
  number: string
  numberLabel: string
  dateLabel: string
  date: string
  secondaryLabel: string
  secondary: string
  clientName: string
  address?: string | null
  currency: 'EUR' | 'GBP'
  intro?: string
  lines: Line[]
  subtotal: number
  total: number
  anzahlung: number
  anzahlungMethod?: string | null
  restbetrag: number
  /** Invoice: bank block. Quote: terms, notes, validity, acceptance. */
  after: (w: Writer) => void
  metaDate: Date
}

class Writer {
  pages: PDFPage[] = []
  page!: PDFPage
  y = 0
  constructor(public doc: PDFDocument, public f: Fonts, public spec: DocSpec) {}

  text(s: string, x: number, y: number, size: number, opts: { bold?: boolean; color?: RGB; right?: boolean } = {}) {
    const font = opts.bold ? this.f.bold : this.f.regular
    const clean = this.f.clean(s).replace(/\n/g, ' ')
    const at = opts.right ? x - font.widthOfTextAtSize(clean, size) : x
    this.page.drawText(clean, { x: at, y, size, font, color: opts.color ?? C.ink })
  }

  newPage(first: boolean) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H])
    this.pages.push(this.page)
    if (first) { this.letterhead(); return }
    const s = this.spec
    this.text(`${s.title} ${s.number}`, MARGIN, PAGE_H - MARGIN, 10, { bold: true })
    this.page.drawRectangle({ x: MARGIN, y: PAGE_H - MARGIN - 8, width: 40, height: 3, color: C.accent })
    this.y = PAGE_H - MARGIN - 28
  }

  /** Room for `h` points, else a continuation page (which repeats the table header when asked). */
  ensure(h: number, tableHeader = false) {
    if (this.y - h >= BOTTOM) return
    this.newPage(false)
    if (tableHeader) this.tableHeader()
  }

  letterhead() {
    const s = this.spec
    const t = getLabels(s.language)
    const bandH = 104
    this.page.drawRectangle({ x: 0, y: PAGE_H - bandH, width: PAGE_W, height: bandH, color: C.ink })
    this.page.drawRectangle({ x: 0, y: PAGE_H - bandH - 4, width: PAGE_W, height: 4, color: C.accent })
    let y = PAGE_H - 38
    this.text(BUSINESS.brandFull, MARGIN, y, 15, { bold: true, color: C.white })
    for (const l of [BUSINESS.legalName, `${BUSINESS.addressLine1}, ${BUSINESS.addressLine2}`, BUSINESS.email, BUSINESS.phone]) {
      y -= 12
      this.text(l, MARGIN, y, 8.5, { color: C.inverted })
    }
    const right = PAGE_W - MARGIN
    this.text(s.title, right, PAGE_H - 40, 18, { bold: true, color: C.white, right: true })
    this.text(`${s.numberLabel}: ${s.number}`, right, PAGE_H - 58, 9, { bold: true, color: C.inverted, right: true })
    this.text(`${s.dateLabel}: ${s.date}`, right, PAGE_H - 71, 8.5, { color: C.inverted, right: true })
    this.text(`${s.secondaryLabel}: ${s.secondary}`, right, PAGE_H - 84, 8.5, { color: C.inverted, right: true })

    /* An / To */
    y = PAGE_H - bandH - 34
    this.text(t.to.toUpperCase(), MARGIN, y, 7.5, { color: C.muted })
    const { name, company } = splitClientName(s.clientName)
    y -= 15
    this.text(name, MARGIN, y, 11, { bold: true })
    for (const l of [company, ...(s.address ?? '').split('\n')].map((v) => v.trim()).filter(Boolean)) {
      y -= 13
      this.text(l, MARGIN, y, 9.5, { color: C.muted })
    }
    this.text(`${t.currency}: ${s.currency}`, PAGE_W - MARGIN, PAGE_H - bandH - 34, 8.5, { color: C.muted, right: true })
    this.y = y - 28
  }

  paragraph(s: string, size = 9.5, opts: { bold?: boolean; color?: RGB; gap?: number } = {}) {
    const font = opts.bold ? this.f.bold : this.f.regular
    for (const line of wrap(this.f.clean(s), font, size, CONTENT_W)) {
      this.ensure(size + 4)
      this.text(line, MARGIN, this.y, size, opts)
      this.y -= size + 4
    }
    this.y -= opts.gap ?? 6
  }

  tableHeader() {
    const t = getLabels(this.spec.language)
    this.page.drawRectangle({ x: MARGIN, y: this.y - 6, width: CONTENT_W, height: 20, color: C.subtle })
    const ty = this.y
    this.text(t.colPos.toUpperCase(), COL.pos, ty, 7.5, { bold: true, color: C.muted })
    this.text(t.colDescription.toUpperCase(), COL.desc, ty, 7.5, { bold: true, color: C.muted })
    this.text(t.colQuantity.toUpperCase(), COL.qtyRight, ty, 7.5, { bold: true, color: C.muted, right: true })
    this.text(t.colUnitPrice.toUpperCase(), COL.unitRight, ty, 7.5, { bold: true, color: C.muted, right: true })
    this.text(t.colAmount.toUpperCase(), COL.amountRight, ty, 7.5, { bold: true, color: C.muted, right: true })
    this.y -= 24
  }

  table() {
    const s = this.spec
    const fmt = (n: number) => fmtCurrency(n, s.currency)
    this.ensure(60)
    this.tableHeader()
    s.lines.forEach((l, i) => {
      const descLines = wrap(this.f.clean(l.description), this.f.regular, 9, DESC_W)
      const rowH = descLines.length * 12 + 8
      /* A row longer than a page is still split by line, never dropped. */
      this.ensure(Math.min(rowH, PAGE_H / 2), true)
      const top = this.y
      this.text(String(i + 1).padStart(2, '0'), COL.pos, top, 8.5, { bold: true })
      this.text(String(l.qty), COL.qtyRight, top, 9, { color: C.muted, right: true })
      this.text(fmtUnitPrice(l.total, l.qty, s.currency), COL.unitRight, top, 9, { color: C.muted, right: true })
      this.text(fmt(l.total), COL.amountRight, top, 9, { bold: true, right: true })
      for (const dl of descLines) {
        this.ensure(12, true)
        this.text(dl, COL.desc, this.y, 9)
        this.y -= 12
      }
      this.y -= 4
      this.page.drawLine({ start: { x: MARGIN, y: this.y + 2 }, end: { x: MARGIN + CONTENT_W, y: this.y + 2 }, thickness: 0.5, color: C.border })
      this.y -= 8
    })
  }

  totals() {
    const s = this.spec
    const t = getLabels(s.language)
    const fmt = (n: number) => fmtCurrency(n, s.currency)
    const labelRight = COL.unitRight
    this.ensure(70)
    if (s.anzahlung > 0) {
      this.text(t.subtotal, labelRight, this.y, 9, { color: C.muted, right: true })
      this.text(fmt(s.subtotal), COL.amountRight, this.y, 9, { color: C.muted, right: true })
      this.y -= 14
      this.text(`${t.deposit} (${s.anzahlungMethod || t.bankTransfer})`, labelRight, this.y, 9, { color: C.muted, right: true })
      this.text(`-${fmt(s.anzahlung)}`, COL.amountRight, this.y, 9, { color: C.muted, right: true })
      this.y -= 14
    }
    /* The accent bar's top edge sits 16pt above its baseline: keep it clear of the line above. */
    this.y -= 18
    const label = s.anzahlung > 0 ? t.remainingBalance : s.kind === 'invoice' ? t.totalDue : t.quoteTotal
    const amount = s.anzahlung > 0 ? s.restbetrag : s.kind === 'invoice' ? s.subtotal : s.total
    this.page.drawRectangle({ x: MARGIN, y: this.y - 10, width: CONTENT_W, height: 26, color: C.accent })
    this.text(label.toUpperCase(), MARGIN + 10, this.y - 1, 9, { bold: true, color: C.onAccent })
    this.text(fmt(amount), COL.amountRight, this.y - 2, 12, { bold: true, color: C.onAccent, right: true })
    this.y -= 40
  }

  footers() {
    const t = getLabels(this.spec.language)
    const total = this.pages.length
    this.pages.forEach((page, i) => {
      this.page = page
      page.drawLine({ start: { x: MARGIN, y: FOOTER_TOP }, end: { x: PAGE_W - MARGIN, y: FOOTER_TOP }, thickness: 0.5, color: C.border })
      this.text(`${t.taxNumberLabel}: ${BUSINESS.steuernummer}  ·  ${t.taxOfficeLabel}: ${BUSINESS.finanzamt}`, MARGIN, FOOTER_TOP - 14, 7.5, { color: C.faint })
      this.text(`${BUSINESS.brandFull}  ·  ${BUSINESS.legalName}  ·  ${BUSINESS.addressLine1}, ${BUSINESS.addressLine2}  ·  ${BUSINESS.email}  ·  ${BUSINESS.website}`, MARGIN, FOOTER_TOP - 25, 7, { color: C.faint })
      const pageLabel = this.spec.language === 'de' ? `Seite ${i + 1}/${total}` : `Page ${i + 1}/${total}`
      this.text(pageLabel, PAGE_W - MARGIN, FOOTER_TOP - 14, 7.5, { color: C.faint, right: true })
    })
  }
}

async function renderDocument(spec: DocSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false })
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const w = new Writer(doc, { regular, bold, clean: makeSanitizer(regular) }, spec)
  const t = getLabels(spec.language)

  w.newPage(true)
  if (spec.intro) w.paragraph(spec.intro, 9.5, { gap: 10 })
  w.table()
  w.totals()
  spec.after(w)
  w.paragraph(BUSINESS.vatClause[spec.language], 8.5, { color: C.muted, gap: 14 })
  w.ensure(40)
  w.paragraph(t.closing, 9.5, { gap: 0 })
  w.paragraph(BUSINESS.legalName, 9.5, { bold: true })
  w.footers()

  doc.setTitle(`${spec.title} ${spec.number}`)
  doc.setAuthor('Maxpromo Digital')
  doc.setCreator('Maxpromo Digital')
  doc.setProducer('Maxpromo OS')
  doc.setLanguage(spec.language === 'de' ? 'de-DE' : 'en-GB')
  doc.setCreationDate(spec.metaDate)
  doc.setModificationDate(spec.metaDate)
  return await doc.save({ useObjectStreams: false })
}

/** The document date as a fixed instant (noon UTC), or the epoch when unparseable. */
function metaDate(value: string | null | undefined): Date {
  const d = value ? new Date(String(value).length > 10 ? String(value) : `${value}T12:00:00Z`) : new Date(0)
  return Number.isNaN(d.getTime()) ? new Date(0) : d
}

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

/* ── public ─────────────────────────────────────────────────────────────── */

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const language: DocumentLanguage = data.language ?? 'de'
  const t = getLabels(language)
  const currency = data.currency ?? 'EUR'
  const subtotal = num(data.subtotal ?? data.total)
  const anzahlung = num(data.anzahlung)
  const restbetrag = anzahlung > 0 ? num(data.restbetrag ?? subtotal - anzahlung) : subtotal
  return renderDocument({
    kind: 'invoice', language, title: t.invoiceTitle, number: data.invoice_number,
    numberLabel: t.invoiceNumber, dateLabel: t.invoiceDate, date: fmtDocDate(data.date, language),
    secondaryLabel: t.dueDate, secondary: fmtDocDate(data.due_date, language),
    clientName: data.client_name, address: data.address, currency,
    lines: (data.line_items ?? []).map((l) => ({ description: l.description, qty: num(l.qty) || 1, total: num(l.total) })),
    subtotal, total: num(data.total), anzahlung, anzahlungMethod: data.anzahlung_method, restbetrag,
    metaDate: metaDate(data.date),
    after(w) {
      if (anzahlung > 0 && data.anzahlung_date) {
        w.paragraph(t.depositThanks(fmtCurrency(anzahlung, currency), fmtDocDate(data.anzahlung_date, language)), 8.5, { color: C.muted, gap: 10 })
      }
      const rows = [
        `${t.accountHolder}: ${BANK_TRANSFER.beneficiary}`,
        `IBAN: ${BANK_TRANSFER.iban}`,
        `BIC: ${BANK_TRANSFER.bic}`,
        `Bank: ${BANK_TRANSFER.bank}`,
        `${t.paymentReference}: ${data.invoice_number}`,
      ]
      const h = 26 + rows.length * 13
      w.ensure(h + 12)
      w.page.drawRectangle({ x: MARGIN, y: w.y - h + 14, width: CONTENT_W, height: h, color: C.subtle })
      w.page.drawRectangle({ x: MARGIN, y: w.y - h + 14, width: 3, height: h, color: C.accent })
      w.text(t.paymentDetailsHeading.toUpperCase(), MARGIN + 14, w.y, 7.5, { bold: true, color: C.muted })
      w.y -= 16
      for (const r of rows) { w.text(r, MARGIN + 14, w.y, 9.5); w.y -= 13 }
      w.y -= 18
    },
  })
}

export async function renderAngebotPdf(a: AngebotPdfData): Promise<Uint8Array> {
  const language: DocumentLanguage = a.language ?? 'de'
  const t = getLabels(language)
  const currency = a.currency ?? 'EUR'
  const total = num(a.total)
  const anzahlung = num(a.anzahlung)
  const date = fmtDocDate(a.created_at, language)
  const validUntil = fmtDocDate(a.valid_until, language)
  return renderDocument({
    kind: 'angebot', language, title: t.quoteTitle, number: a.angebot_number,
    numberLabel: t.quoteNumber, dateLabel: t.quoteDate, date, secondaryLabel: t.validUntil, secondary: validUntil,
    clientName: a.client_name, address: a.client_address, currency,
    /* The intro continues a salutation, as on the print page and in the email. */
    intro: `${(() => { const { name, company } = splitClientName(a.client_name); return company ? t.dearSirMadam : t.dear(name.split(' ')[0]) })()}\n${t.quoteIntro(a.angebot_number, date)}`,
    lines: (Array.isArray(a.line_items) ? a.line_items : []).map((l) => ({
      description: l.description, qty: l.isFixedPrice ? 1 : num(l.qty) || 1, total: num(l.total),
    })),
    subtotal: num(a.subtotal ?? a.total), total, anzahlung, anzahlungMethod: a.anzahlung_method,
    restbetrag: anzahlung > 0 ? total - anzahlung : total,
    metaDate: metaDate(a.created_at),
    after(w) {
      const included = (a.included_items ?? []).filter(Boolean)
      if (included.length) {
        w.paragraph(t.includedFree, 9, { bold: true, gap: 2 })
        for (const item of included) w.paragraph(`• ${item}`, 9, { gap: 0 })
        w.y -= 8
      }
      if (a.payment_terms) w.paragraph(`${t.paymentTerms}: ${a.payment_terms}`, 9, { gap: 8 })
      if (a.notes) w.paragraph(a.notes, 9, { color: C.muted, gap: 8 })
      w.paragraph(t.quoteValidUntilNote(validUntil), 9, { gap: 14 })
      /* Acceptance: three signature lines, kept together on one page. */
      w.ensure(90)
      w.paragraph(t.quoteAcceptanceHeading, 9.5, { bold: true, gap: 2 })
      w.paragraph(t.quoteAcceptanceBody, 8.5, { color: C.muted, gap: 26 })
      const colW = (CONTENT_W - 32) / 3
      ;[t.placeDate, t.namePrinted, t.signature].forEach((label, i) => {
        const x = MARGIN + i * (colW + 16)
        w.page.drawLine({ start: { x, y: w.y }, end: { x: x + colW, y: w.y }, thickness: 0.5, color: C.ink })
        w.text(label, x, w.y - 11, 7.5, { color: C.muted })
      })
      w.y -= 36
    },
  })
}

/** `Rechnung_MP-2026-002.pdf` / `Quote_MP-A-2026-003.pdf` — only [A-Za-z0-9_.-]. */
export function documentPdfFilename(kind: DocumentPdfKind, number: string, language?: DocumentLanguage | null): string {
  const t = getLabels(language)
  const prefix = kind === 'invoice' ? t.filenamePrefixInvoice : t.filenamePrefixQuote
  const safe = String(number).replace(/[^A-Za-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'document'
  return `${prefix}_${safe}.pdf`
}
