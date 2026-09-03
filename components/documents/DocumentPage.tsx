/**
 * components/documents/DocumentPage.tsx
 *
 * The one shared A4 document shell. Visual hierarchy is modelled on the
 * Midas reference document (compact repeating top strip → large title →
 * brand line → FROM / TO / DETAILS three-column block → numbered body
 * sections → repeating footer), rebuilt entirely in Maxpromo's own
 * black/white/orange palette — no gold or green from the reference is
 * reused anywhere.
 *
 * InvoiceDocument and AngebotDocument both compose on top of this; only
 * their body content (numbered sections, table, payment section,
 * legal/acceptance copy) differs.
 *
 * Print pagination: the top strip and footer are pinned with
 * `position: fixed` under `@media print` (see lib/documents/printCss.ts)
 * so they repeat identically on every printed page — the same technique
 * used industry-wide for browser-based ("Save as PDF") repeating
 * headers/footers, since `window.print()` has no header/footer template
 * API of its own. `[data-print-body]` reserves matching top/bottom
 * padding in print so flowing content never renders underneath them.
 *
 * This is deliberately a *rendering* component only — it takes already-
 * formatted strings as props. Data fetching, `window.print()` timing and
 * WhatsApp-link building stay in the page-level components that own the
 * fetch, so this component can also be reused for the on-screen "live
 * preview" pane in the create/edit forms (which never calls window.print()).
 */

import type { ReactNode } from 'react'
import { BUSINESS, BRAND_COLORS, type DocumentLanguage } from '@/lib/documents/config'
import { DOCUMENT_PRINT_CSS } from '@/lib/documents/printCss'
import { splitClientName } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'

const mono = { fontFamily: 'monospace' } as const

interface DocumentPageProps {
  /** Suggested filename shown in the browser tab / "Save as PDF" dialog. Omit to skip (e.g. live-preview pane). */
  filename?: string
  /** Document language — independent of the OS interface language. Drives this shell's own labels (Von/An, Währung) and is NOT re-derived from anywhere else. */
  language?: DocumentLanguage | null
  docTypeLabel: string // 'RECHNUNG' | 'INVOICE' | 'ANGEBOT' | 'QUOTE' — pre-translated by the caller
  /** Pre-translated heading for the third detail column, e.g. "Rechnungsdetails" / "Invoice Details". */
  detailsLabel: string
  numberLabel: string // pre-translated, e.g. "Rechnungsnummer" / "Invoice Number"
  number: string
  dateLabel: string // pre-translated
  date: string
  secondaryDateLabel: string // pre-translated
  secondaryDate: string
  /** Optional third detail row, e.g. "EUR" / "GBP" — omitted when not set on the document. */
  currency?: string | null
  clientName: string
  clientAddress?: string | null
  /** Toolbar buttons (print / WhatsApp / close) — omitted entirely for the live-preview pane. */
  toolbar?: ReactNode
  children: ReactNode
}

const colLabel = { ...mono, fontSize: '10px', fontWeight: 700, color: BRAND_COLORS.accentText, textTransform: 'uppercase' as const, letterSpacing: '0.14em', margin: '0 0 10px' }

export function DocumentPage({
  filename, language, docTypeLabel, detailsLabel, numberLabel, number, dateLabel, date,
  secondaryDateLabel, secondaryDate, currency, clientName, clientAddress, toolbar, children,
}: DocumentPageProps) {
  const { name: clientNameOnly, company } = splitClientName(clientName)
  const t = getLabels(language)

  return (
    <>
      {filename && <title>{filename}</title>}
      <style>{DOCUMENT_PRINT_CSS}</style>

      {toolbar}

      <div data-print-doc style={{ background: '#fff', maxWidth: '780px', margin: toolbar ? '20px auto' : '0 auto', boxShadow: toolbar ? '0 4px 40px rgba(0,0,0,0.15)' : 'none', fontFamily: 'Arial,sans-serif', color: BRAND_COLORS.ink }}>

        {/* Compact repeating top strip — fixed in print, see printCss.ts */}
        <div data-print-topstrip style={{ padding: '9px 40px', borderBottom: '1px solid #e5e5e5', background: '#fff' }}>
          <p style={{ ...mono, fontSize: '10px', color: '#888', margin: 0, letterSpacing: '0.02em' }}>
            {BUSINESS.website} &nbsp;|&nbsp; {numberLabel}: {number} &nbsp;|&nbsp; {date}
          </p>
        </div>

        <div data-print-body>
          {/* Title + brand line */}
          <div style={{ padding: '32px 40px 20px' }}>
            <h1 style={{ fontFamily: 'Arial,sans-serif', fontSize: '42px', fontWeight: 800, color: BRAND_COLORS.ink, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{docTypeLabel}</h1>
            <p style={{ ...mono, fontSize: '15px', fontWeight: 700, color: BRAND_COLORS.accentText, margin: 0, letterSpacing: '0.02em' }}>{BUSINESS.website}</p>
          </div>
          <div style={{ borderTop: `2px solid ${BRAND_COLORS.accent}`, margin: '0 40px' }} />

          {/* FROM / TO / DETAILS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', padding: '24px 40px', borderBottom: '1px solid #eee' }}>
            <div>
              <p style={colLabel}>{t.from}</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{BUSINESS.legalName}</p>
              <p style={{ fontSize: '12.5px', color: '#555', margin: '0 0 2px' }}>{BUSINESS.brandFull}</p>
              <p style={{ fontSize: '12.5px', color: '#555', margin: '0 0 2px' }}>{BUSINESS.addressLine1}</p>
              <p style={{ fontSize: '12.5px', color: '#555', margin: 0 }}>{BUSINESS.addressLine2}, {BUSINESS.country}</p>
            </div>
            <div>
              <p style={colLabel}>{t.to}</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{clientNameOnly || '—'}</p>
              {company && <p style={{ fontSize: '12.5px', color: '#555', margin: '0 0 2px' }}>{company}</p>}
              {clientAddress && <p style={{ fontSize: '12.5px', color: '#555', margin: 0, whiteSpace: 'pre-line' }}>{clientAddress}</p>}
            </div>
            <div>
              <p style={colLabel}>{detailsLabel}</p>
              <p style={{ ...mono, fontSize: '12.5px', color: '#333', margin: '0 0 3px' }}>{numberLabel}: {number}</p>
              <p style={{ ...mono, fontSize: '12.5px', color: '#333', margin: '0 0 3px' }}>{dateLabel}: {date}</p>
              <p style={{ ...mono, fontSize: '12.5px', color: '#333', margin: currency ? '0 0 3px' : 0 }}>{secondaryDateLabel}: {secondaryDate}</p>
              {currency && <p style={{ ...mono, fontSize: '12.5px', color: '#333', margin: 0 }}>{t.currency}: {currency}</p>}
            </div>
          </div>

          {children}
        </div>

        {/* Repeating footer — fixed in print, see printCss.ts */}
        <div data-print-footer style={{ padding: '9px 40px', borderTop: '1px solid #e5e5e5', background: '#fff' }}>
          <p style={{ ...mono, fontSize: '9.5px', color: '#888', margin: 0 }}>
            {BUSINESS.website} &nbsp;|&nbsp; {BUSINESS.legalName} &nbsp;|&nbsp; {BUSINESS.addressLine2} &nbsp;|&nbsp; {docTypeLabel} {number} &nbsp;|&nbsp; {t.taxNumberLabel}: {BUSINESS.steuernummer}
          </p>
        </div>
      </div>
    </>
  )
}

/** Shared on-screen (non-print) toolbar shell — print/WhatsApp/close buttons. */
export function DocumentToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="no-print" style={{ background: BRAND_COLORS.ink, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      {children}
    </div>
  )
}

/**
 * Numbered section heading used above the line-items table and the
 * payment section, matching the Midas reference's "1. Website Design…" /
 * "3. Payment Details" pattern — renumbered per document since Invoice
 * and Angebot each only have two body sections (Leistungen, Zahlung).
 */
export function SectionHeading({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) {
  return (
    <div style={{ margin: '4px 0 14px' }}>
      <h2 style={{ fontFamily: 'Arial,sans-serif', fontSize: '16px', fontWeight: 700, color: BRAND_COLORS.ink, margin: '0 0 8px' }}>
        {n}. {title}
      </h2>
      <div style={{ borderTop: '1px solid #ddd', marginBottom: subtitle ? '8px' : 0 }} />
      {subtitle && <p style={{ ...mono, fontSize: '11.5px', color: '#888', margin: 0 }}>{subtitle}</p>}
    </div>
  )
}
