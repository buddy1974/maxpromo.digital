/**
 * components/documents/InvoiceDocument.tsx
 *
 * The Invoice composition of the shared document engine. All layout,
 * typography, spacing and print behaviour come from DocumentPage +
 * DocumentTable + PaymentSection — this file only supplies invoice
 * wording and invoice-specific fields (Rechnungsnummer/Fällig bis/
 * Gesamtbetrag, notes, §19 UStG line).
 */

import { DocumentPage, SectionHeading } from './DocumentPage'
import { DocumentTable } from './DocumentTable'
import { PaymentSection } from './PaymentSection'
import { BUSINESS, DEFAULT_PAYMENT_METHOD } from '@/lib/documents/config'
import { fmtCurrency, fmtDocDate, fmtDocFilename } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'
import type { InvoiceData } from '@/lib/documents/types'

const mono = { fontFamily: 'monospace' } as const

interface InvoiceDocumentProps {
  invoice: InvoiceData
  /** Set for the actual print page (adds a browser-tab filename); omit for the on-screen live-preview pane. */
  withFilename?: boolean
  toolbar?: React.ReactNode
}

export function InvoiceDocument({ invoice, withFilename, toolbar }: InvoiceDocumentProps) {
  const t = getLabels(invoice.language)
  const date = fmtDocDate(invoice.created_at, invoice.language)
  const dueDate = fmtDocDate(invoice.due_date, invoice.language)
  const items = Array.isArray(invoice.line_items) ? invoice.line_items : []
  const hasAnz = Number(invoice.anzahlung) > 0

  return (
    <DocumentPage
      filename={withFilename ? fmtDocFilename(t.filenamePrefixInvoice, invoice.invoice_number, invoice.client_name) : undefined}
      language={invoice.language}
      docTypeLabel={t.invoiceTitle}
      detailsLabel={t.invoiceDetailsHeading}
      numberLabel={t.invoiceNumber}
      number={invoice.invoice_number}
      dateLabel={t.invoiceDate}
      date={date}
      secondaryDateLabel={t.dueDate}
      secondaryDate={dueDate}
      currency={invoice.currency}
      clientName={invoice.client_name}
      clientAddress={invoice.client_address}
      toolbar={toolbar}
    >
      {/* Line items + totals */}
      <div style={{ padding: '24px 40px 28px' }}>
        <SectionHeading n={1} title={t.servicesHeading} />

        <DocumentTable
          items={items}
          currency={invoice.currency}
          language={invoice.language}
          subtotal={invoice.subtotal}
          total={invoice.total}
          anzahlung={invoice.anzahlung}
          anzahlungMethod={invoice.anzahlung_method}
          restbetrag={invoice.restbetrag}
          totalLabel={t.totalDue}
        />

        {hasAnz && invoice.anzahlung_date && (
          <p style={{ ...mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', fontStyle: 'italic', margin: '14px 0 0' }}>
            {t.depositThanks(fmtCurrency(Number(invoice.anzahlung), invoice.currency), fmtDocDate(invoice.anzahlung_date, invoice.language))}
          </p>
        )}

        <p style={{ ...mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', margin: '14px 0 0' }}>{BUSINESS.vatClause[invoice.language ?? 'de']}</p>
        {invoice.notes && <p style={{ fontSize: 'var(--text-micro)', color: 'var(--brand-text-muted)', margin: '12px 0 0', fontStyle: 'italic' }}>{invoice.notes}</p>}
      </div>

      {/* Payment */}
      <div style={{ padding: '0 40px 28px' }}>
        <SectionHeading n={2} title={t.paymentSectionTitle} />
        <PaymentSection
          method={invoice.payment_method ?? DEFAULT_PAYMENT_METHOD}
          variant="invoice"
          language={invoice.language}
          reference={invoice.invoice_number}
        />
      </div>
    </DocumentPage>
  )
}
