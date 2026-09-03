/**
 * components/documents/AngebotDocument.tsx
 *
 * The Angebot (quotation) composition of the shared document engine.
 * Inherits the exact same DocumentPage/DocumentTable/PaymentSection as
 * InvoiceDocument — same typography, spacing, margins, table styling,
 * colours, footer. Only the wording and a few angebot-only sections
 * differ, and — as of the document-language feature — that wording is
 * looked up from lib/documents/labels.ts by `angebot.language`, never
 * hardcoded to German.
 *
 *   Invoice wording              →  Angebot wording (DE)      →  Quote wording (EN)
 *   RECHNUNG / INVOICE              ANGEBOT                       QUOTE
 *   Rechnungsnummer                 Angebotsnummer                Quote Number
 *   Rechnungsdatum                  Angebotsdatum                 Quote Date
 *   Fällig bis / Due Date           Gültig bis                    Valid Until
 *   Gesamtbetrag / Total Due        Angebotssumme                 Quote Total
 *
 * No "payment due" wording appears anywhere on this document — the
 * payment section (when shown) is framed as "how you'll pay once you
 * accept," not a demand.
 */

import { DocumentPage, SectionHeading } from './DocumentPage'
import { DocumentTable } from './DocumentTable'
import { PaymentSection } from './PaymentSection'
import { BUSINESS, BRAND_COLORS, DEFAULT_PAYMENT_METHOD } from '@/lib/documents/config'
import { fmtDocDate, fmtDocFilename, splitClientName } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'
import type { AngebotData } from '@/lib/documents/types'

const mono = { fontFamily: 'monospace' } as const

interface AngebotDocumentProps {
  angebot: AngebotData
  withFilename?: boolean
  toolbar?: React.ReactNode
}

export function AngebotDocument({ angebot, withFilename, toolbar }: AngebotDocumentProps) {
  const t = getLabels(angebot.language)
  const date = fmtDocDate(angebot.created_at, angebot.language)
  const validTo = fmtDocDate(angebot.valid_until, angebot.language)
  const items = Array.isArray(angebot.line_items) ? angebot.line_items : []
  const includedItems = Array.isArray(angebot.included_items) ? angebot.included_items : []

  const { name: nameOnly, company } = splitClientName(angebot.client_name)
  const salutation = company ? t.dearSirMadam : t.dear(nameOnly.split(' ')[0] || nameOnly)

  return (
    <DocumentPage
      filename={withFilename ? fmtDocFilename(t.filenamePrefixQuote, angebot.angebot_number, angebot.client_name) : undefined}
      language={angebot.language}
      docTypeLabel={t.quoteTitle}
      detailsLabel={t.quoteDetailsHeading}
      numberLabel={t.quoteNumber}
      number={angebot.angebot_number}
      dateLabel={t.quoteDate}
      date={date}
      secondaryDateLabel={t.validUntil}
      secondaryDate={validTo}
      currency={angebot.currency}
      clientName={angebot.client_name}
      clientAddress={angebot.client_address}
      toolbar={toolbar}
    >
      {/* Letter intro */}
      <div style={{ padding: '24px 40px 8px' }}>
        <p style={{ fontSize: '13px', color: 'var(--brand-text-secondary)', margin: '0 0 12px', ...mono }}>{salutation}</p>
        <p style={{ fontSize: '14px', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.7 }}>
          {t.quoteIntro(angebot.angebot_number, date)}
        </p>
      </div>

      {/* Line items + totals */}
      <div style={{ padding: '20px 40px' }}>
        <SectionHeading n={1} title={t.servicesHeading} />

        <DocumentTable
          items={items}
          currency={angebot.currency}
          language={angebot.language}
          subtotal={angebot.subtotal}
          total={angebot.total}
          anzahlung={angebot.anzahlung}
          anzahlungMethod={angebot.anzahlung_method}
          restbetrag={null}
          totalLabel={t.quoteTotal}
        />

        {includedItems.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ ...mono, fontSize: '10px', color: 'var(--brand-primary-text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
              {t.includedFree}
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {includedItems.map((it, i) => (
                <li key={i} style={{ fontSize: '12px', color: 'var(--brand-text-muted)', lineHeight: 1.6 }}>{it}</li>
              ))}
            </ul>
          </div>
        )}

        {angebot.payment_terms && (
          <p style={{ fontSize: '12px', color: 'var(--brand-text-secondary)', margin: '0 0 6px' }}>
            <strong>{t.paymentTerms}:</strong> {angebot.payment_terms}
          </p>
        )}

        <p style={{ ...mono, fontSize: '11px', color: 'var(--brand-text-secondary)', margin: '0 0 4px' }}>
          {BUSINESS.vatClause[angebot.language ?? 'de']} {t.quoteValidUntilNote(validTo)}
        </p>

        {angebot.notes && (
          <p style={{ fontSize: '12px', color: 'var(--brand-text-muted)', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{angebot.notes}</p>
        )}

        <p style={{ fontSize: '13px', color: 'var(--brand-text-secondary)', margin: '20px 0 0', lineHeight: 1.5 }}>
          {t.closing}<br />
          <strong>{BUSINESS.legalName}</strong>
        </p>
      </div>

      {/* Payment method (informational — no "due" wording on a quotation) */}
      <div style={{ padding: '0 40px 24px' }}>
        <SectionHeading n={2} title={t.paymentSectionTitle} />
        <PaymentSection
          method={angebot.payment_method ?? DEFAULT_PAYMENT_METHOD}
          variant="angebot"
          language={angebot.language}
          reference={angebot.angebot_number}
        />
      </div>

      {/* Acceptance section */}
      <div data-keep-together style={{ padding: '20px 40px 8px', borderTop: '1px dashed var(--brand-border-strong)' }}>
        <SectionHeading n={3} title={t.quoteAcceptanceHeading} />
        <p style={{ fontSize: '12px', color: 'var(--brand-text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
          {t.quoteAcceptanceBody}
        </p>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ borderBottom: `1px solid ${BRAND_COLORS.borderStrong}`, height: '36px' }} />
            <p style={{ ...mono, fontSize: '10px', color: 'var(--brand-text-secondary)', margin: '6px 0 0' }}>{t.placeDate}</p>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ borderBottom: `1px solid ${BRAND_COLORS.borderStrong}`, height: '36px' }} />
            <p style={{ ...mono, fontSize: '10px', color: 'var(--brand-text-secondary)', margin: '6px 0 0' }}>{t.namePrinted}</p>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ borderBottom: `1px solid ${BRAND_COLORS.borderStrong}`, height: '36px' }} />
            <p style={{ ...mono, fontSize: '10px', color: 'var(--brand-text-secondary)', margin: '6px 0 0' }}>{t.signature}</p>
          </div>
        </div>
      </div>
    </DocumentPage>
  )
}
