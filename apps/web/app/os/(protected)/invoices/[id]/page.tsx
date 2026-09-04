'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DocumentLanguage } from '@/lib/documents/config'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono = 'var(--brand-font-mono)'
const sans = 'var(--brand-font-body)'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice?: boolean }
interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; due_date: string; paid_date: string; notes: string
  anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string; restbetrag?: number
  language?: DocumentLanguage | null
}

const STATUS_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  draft:   { text: 'var(--brand-text-secondary)',    bg: 'color-mix(in srgb, var(--brand-text-secondary) 10%, transparent)',  border: 'var(--brand-text-secondary)' },
  sent:    { text: 'var(--semantic-info)', bg: 'color-mix(in srgb, var(--semantic-info) 10%, transparent)',   border: 'color-mix(in srgb, var(--semantic-info) 30%, transparent)' },
  paid:    { text: 'var(--semantic-success)', bg: 'color-mix(in srgb, var(--semantic-success) 10%, transparent)',    border: 'color-mix(in srgb, var(--semantic-success) 30%, transparent)' },
  overdue: { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 10%, transparent)',    border: 'color-mix(in srgb, var(--semantic-danger) 30%, transparent)' },
}

export default function InvoiceDetailPage() {
  const { t, fmtEur, fmtDate } = useOsLocale()
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [marking, setMarking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingLanguage, setChangingLanguage] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/os/invoices?id=${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(d => { setInvoice(d as Invoice); setLoading(false) })
      .catch(() => { setError('not-found'); setLoading(false) })
  }, [id])

  async function markPaid() {
    if (!invoice) return
    setMarking(true)
    const res = await fetch('/api/os/invoices', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoice.id, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) setInvoice(prev => prev ? { ...prev, status: 'paid', paid_date: new Date().toISOString().split('T')[0] } : prev)
    setMarking(false)
  }

  /**
   * Changes the DOCUMENT's language (what the PDF/email is written in) —
   * completely independent of the OS UI language the user is reading this
   * page in. Persisted on the row so print + email routes stay consistent.
   */
  async function changeLanguage(lang: DocumentLanguage) {
    if (!invoice || lang === invoice.language) return
    setChangingLanguage(true)
    const res = await fetch('/api/os/invoices', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoice.id, language: lang }),
    })
    if (res.ok) setInvoice(prev => prev ? { ...prev, language: lang } : prev)
    setChangingLanguage(false)
  }

  async function deleteInvoice() {
    if (!invoice || !confirm(t.invoiceDetail.deleteConfirm(invoice.invoice_number))) return
    setDeleting(true)
    const res = await fetch(`/api/os/invoices?id=${invoice.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/os/invoices')
    else setDeleting(false)
  }

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em' }}>{t.common.loading}</p>
    </div>
  )

  if (error || !invoice) return (
    <div style={{ padding: '40px' }}>
      <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--semantic-danger)' }}>{t.invoiceDetail.notFound}</p>
      <Link href="/os/invoices" style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', textDecoration: 'none' }}>{t.invoiceDetail.backToInvoices}</Link>
    </div>
  )

  const items    = Array.isArray(invoice.line_items) ? invoice.line_items : []
  const hasAnz   = Number(invoice.anzahlung) > 0
  const restbet  = hasAnz ? Number(invoice.restbetrag ?? (Number(invoice.total) - Number(invoice.anzahlung))) : Number(invoice.total)
  const sc       = STATUS_COLOR[invoice.status] ?? STATUS_COLOR.draft

  const columns = [
    t.invoiceDetail.colIndex, t.invoiceDetail.colDescription,
    t.invoiceDetail.colQty, t.invoiceDetail.colUnitPrice, t.invoiceDetail.colTotal,
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: '860px' }}>

      {/* Breadcrumb */}
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', marginBottom: 'var(--space-5)', letterSpacing: '0.1em' }}>
        <Link href="/os/invoices" style={{ color: 'var(--brand-text-muted)', textDecoration: 'none' }}>{t.invoiceDetail.breadcrumb}</Link>
        {' / '}
        <span style={{ color: 'var(--brand-text)' }}>{invoice.invoice_number}</span>
      </p>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: sans, fontSize: '26px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', margin: 0, letterSpacing: '-0.02em' }}>
              {invoice.invoice_number}
            </h1>
            <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, padding: '3px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 'var(--radius-xs)' }}>
              {t.status.invoice[invoice.status] ?? invoice.status}
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', margin: 0 }}>{invoice.client_name}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={invoice.language ?? 'de'}
            disabled={changingLanguage}
            onChange={e => changeLanguage(e.target.value as DocumentLanguage)}
            title={t.invoiceDetail.documentLanguageTitle}
            aria-label={t.invoiceDetail.documentLanguageTitle}
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--brand-text)', background: 'var(--brand-background)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', cursor: changingLanguage ? 'wait' : 'pointer', opacity: changingLanguage ? 0.6 : 1, appearance: 'none' }}
          >
            {/* Endonyms — a document language is named in its own language in
                both OS locales, so this select does NOT follow the OS UI. */}
            <option value="de">🇩🇪 Deutsch</option>
            <option value="en">🇬🇧 English</option>
          </select>
          <a
            href={`/os/invoices/${invoice.id}/print`}
            target="_blank"
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--brand-text)', background: 'transparent', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
          >
            {t.invoiceDetail.pdf}
          </a>
          {invoice.status !== 'paid' && (
            <button
              onClick={markPaid}
              disabled={marking}
              style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--semantic-success)', background: 'color-mix(in srgb, var(--semantic-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-success) 30%, transparent)', borderRadius: 'var(--radius-sm)', padding: '9px 16px', cursor: marking ? 'wait' : 'pointer', opacity: marking ? 0.6 : 1 }}
            >
              {t.invoiceDetail.markPaid}
            </button>
          )}
          <button
            onClick={deleteInvoice}
            disabled={deleting}
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--semantic-danger)', background: 'color-mix(in srgb, var(--semantic-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 20%, transparent)', borderRadius: 'var(--radius-sm)', padding: '9px 16px', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.5 : 1 }}
          >
            {t.invoiceDetail.delete}
          </button>
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: '28px' }}>
        {[
          { label: t.invoiceDetail.metaDate,    value: fmtDate(invoice.created_at) },
          { label: t.invoiceDetail.metaDueDate, value: fmtDate(invoice.due_date ? invoice.due_date + 'T12:00:00' : null) },
          { label: t.invoiceDetail.metaPaidOn,  value: fmtDate(invoice.paid_date ? invoice.paid_date + 'T12:00:00' : null) },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 var(--space-2)' }}>{m.label}</p>
            <p style={{ fontFamily: mono, fontSize: '14px', color: 'var(--brand-text)', margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Client block */}
      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', padding: '20px 24px', marginBottom: '20px' }}>
        <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.invoiceDetail.client}</p>
        <p style={{ fontFamily: sans, fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--brand-text)', margin: '0 0 var(--space-1)' }}>{invoice.client_name}</p>
        {invoice.client_email && <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)', margin: '0 0 3px' }}>{invoice.client_email}</p>}
        {invoice.client_address && <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>{invoice.client_address}</p>}
      </div>

      {/* Line items */}
      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--brand-border)', background: 'var(--brand-surface)' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{t.invoiceDetail.lineItems}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--brand-surface)', borderBottom: '1px solid var(--brand-border)' }}>
                {columns.map((h, ci) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: ci === 0 ? 'center' : ci === 1 ? 'left' : 'right', fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 'var(--space-4)', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-muted)', textAlign: 'center' }}>{t.invoiceDetail.noLineItems}</td></tr>
              ) : items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)' }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: sans, fontSize: '14px', color: 'var(--brand-text)' }}>
                    {item.description}
                    {!item.isFixedPrice && item.unit && item.qty > 1 && (
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', marginLeft: 'var(--space-2)' }}>({item.qty} {item.unit})</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{item.isFixedPrice ? '1' : item.qty}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{fmtEur(Number(item.unit_price || item.total))}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', fontWeight: 700 }}>{fmtEur(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '2px solid var(--brand-primary)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            {hasAnz ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{t.invoiceDetail.subtotal}</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{fmtEur(Number(invoice.subtotal || invoice.total))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>
                    {t.invoiceDetail.deposit} ({invoice.anzahlung_method || t.invoiceDetail.depositDefaultMethod})
                  </span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>−{fmtEur(Number(invoice.anzahlung))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--brand-border)', paddingTop: '10px' }}>
                  <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)' }}>{t.invoiceDetail.remainingBalance}</span>
                  <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-primary-text)' }}>{fmtEur(restbet)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)' }}>{t.invoiceDetail.grandTotal}</span>
                <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-primary-text)' }}>{fmtEur(Number(invoice.total))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', padding: '20px 24px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.invoiceDetail.notes}</p>
          <p style={{ fontFamily: sans, fontSize: '14px', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
        </div>
      )}

      {/* §19 UStG — Kleinunternehmer status. Never charge VAT. */}
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', marginTop: 'var(--space-4)' }}>
        {t.invoiceDetail.legalFooter}
      </p>
    </div>
  )
}
