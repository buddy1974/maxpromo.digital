/**
 * components/documents/DocumentTable.tsx
 *
 * The shared line-items table + totals block used by both InvoiceDocument
 * and AngebotDocument.
 *
 * Print-pagination behaviour:
 *  - `<thead>` repeats on every printed page automatically (native
 *    browser behaviour for tables that span a page break).
 *  - Each `<tr>` carries `break-inside: avoid` (see lib/documents/printCss.ts)
 *    so a single row is never sliced across two pages.
 *  - The totals block is a separate `<div data-keep-together>` — never
 *    inside the `<table>` — so it can be kept as one atomic unit and
 *    never split across a page boundary, and never repeats per-page the
 *    way a `<tfoot>` would.
 */

import { BRAND_COLORS, type CurrencyCode, type DocumentLanguage } from '@/lib/documents/config'
import type { DocumentLineItem } from '@/lib/documents/types'
import { fmtCurrency, fmtUnitPrice } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'

const mono = { fontFamily: 'monospace' } as const
const th: React.CSSProperties = { padding: '9px 12px', textAlign: 'left', ...mono, fontSize: '10.5px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }

/** Full-width dark/accent bar used for TOTAL DUE / ANGEBOTSSUMME and any single key→amount row — mirrors the Midas reference's bar treatment in Maxpromo's own black + orange palette. */
function TotalBar({ label, sublabel, amount, strong }: { label: string; sublabel?: string; amount: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: strong ? 0 : '2px' }}>
      <div style={{ flex: 1, background: BRAND_COLORS.ink, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Arial,sans-serif', fontSize: strong ? '15px' : '12px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        {sublabel && <span style={{ ...mono, fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{sublabel}</span>}
      </div>
      <div style={{ background: BRAND_COLORS.accent, padding: '14px 20px', display: 'flex', alignItems: 'center', minWidth: '140px', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'Arial,sans-serif', fontSize: strong ? '22px' : '15px', fontWeight: 800, color: BRAND_COLORS.ink }}>{amount}</span>
      </div>
    </div>
  )
}

interface DocumentTableProps {
  items: DocumentLineItem[]
  currency?: CurrencyCode | null
  language?: DocumentLanguage | null
  subtotal: number
  total: number
  anzahlung?: number | null
  anzahlungMethod?: string | null
  restbetrag?: number | null
  /** "Gesamtbetrag"/"Total Due" for an invoice, "Angebotssumme"/"Quote Total" for an angebot — pre-translated by the caller. */
  totalLabel: string
}

export function DocumentTable({
  items, currency, language, subtotal, total, anzahlung, anzahlungMethod, restbetrag, totalLabel,
}: DocumentTableProps) {
  const t = getLabels(language)
  const hasAnz = Number(anzahlung) > 0
  const remaining = hasAnz ? Number(restbetrag ?? (total - Number(anzahlung))) : total

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
        <thead>
          <tr style={{ background: BRAND_COLORS.ink }}>
            <th style={{ ...th, width: '40px' }}>{t.colPos}</th>
            <th style={th}>{t.colDescription}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t.colQuantity}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t.colUnitPrice}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t.colAmount}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const qty = item.isFixedPrice ? 1 : Number(item.qty || 1)
            const itemTotal = Number(item.total) || 0
            return (
              <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 1 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: '11px 12px', ...mono, fontSize: '11px', color: BRAND_COLORS.accent, fontWeight: 700, verticalAlign: 'top' }}>
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '11px 12px', fontSize: '13px', color: '#111', whiteSpace: 'pre-wrap', verticalAlign: 'top', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {item.description}
                  {!item.isFixedPrice && item.unit && item.qty > 1 && (
                    <span style={{ ...mono, fontSize: '11px', color: '#888', marginLeft: '6px' }}>({item.qty} {item.unit})</span>
                  )}
                </td>
                <td style={{ padding: '11px 12px', textAlign: 'right', ...mono, fontSize: '12px', color: '#555', verticalAlign: 'top' }}>
                  {item.isFixedPrice ? '1' : item.qty}
                </td>
                <td style={{ padding: '11px 12px', textAlign: 'right', ...mono, fontSize: '12px', color: '#555', verticalAlign: 'top' }}>
                  {fmtUnitPrice(itemTotal, qty, currency)}
                </td>
                <td style={{ padding: '11px 12px', textAlign: 'right', ...mono, fontSize: '12.5px', color: '#111', fontWeight: 700, verticalAlign: 'top' }}>
                  {fmtCurrency(itemTotal, currency)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div data-keep-together style={{ marginBottom: '20px' }}>
        {hasAnz ? (
          <>
            <div style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
              <span style={{ ...mono, fontSize: '12px', color: '#555' }}>{t.subtotal}: {fmtCurrency(subtotal || total, currency)}</span>
            </div>
            <div style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
              <span style={{ ...mono, fontSize: '12px', color: '#555' }}>{t.deposit} ({anzahlungMethod || t.bankTransfer}): −{fmtCurrency(Number(anzahlung), currency)}</span>
            </div>
            <TotalBar label={t.remainingBalance} amount={fmtCurrency(remaining, currency)} strong />
          </>
        ) : (
          <TotalBar label={totalLabel} amount={fmtCurrency(total, currency)} strong />
        )}
      </div>
    </>
  )
}
