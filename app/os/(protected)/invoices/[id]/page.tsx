'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice?: boolean }
interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; due_date: string; paid_date: string; notes: string
  anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string; restbetrag?: number
}

const STATUS_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  draft:   { text: '#888',    bg: 'rgba(136,136,136,0.1)',  border: '#333' },
  sent:    { text: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)' },
  paid:    { text: '#4ade80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)' },
  overdue: { text: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)' },
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function InvoiceDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [marking, setMarking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/os/invoices?id=${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(d => { setInvoice(d as Invoice); setLoading(false) })
      .catch(() => { setError('Invoice not found.'); setLoading(false) })
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

  async function deleteInvoice() {
    if (!invoice || !confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/os/invoices?id=${invoice.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/os/invoices')
    else setDeleting(false)
  }

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em' }}>Loading...</p>
    </div>
  )

  if (error || !invoice) return (
    <div style={{ padding: '40px' }}>
      <p style={{ fontFamily: mono, fontSize: '12px', color: '#ef4444' }}>{error || 'Invoice not found.'}</p>
      <Link href="/os/invoices" style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', textDecoration: 'none' }}>← Back to Invoices</Link>
    </div>
  )

  const items    = Array.isArray(invoice.line_items) ? invoice.line_items : []
  const hasAnz   = Number(invoice.anzahlung) > 0
  const restbet  = hasAnz ? Number(invoice.restbetrag ?? (Number(invoice.total) - Number(invoice.anzahlung))) : Number(invoice.total)
  const sc       = STATUS_COLOR[invoice.status] ?? STATUS_COLOR.draft

  return (
    <div style={{ padding: '32px 40px', maxWidth: '860px' }}>

      {/* Breadcrumb */}
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', marginBottom: '24px', letterSpacing: '0.1em' }}>
        <Link href="/os/invoices" style={{ color: '#555', textDecoration: 'none' }}>Invoices</Link>
        {' / '}
        <span style={{ color: '#FFF' }}>{invoice.invoice_number}</span>
      </p>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: sans, fontSize: '26px', fontWeight: 700, color: '#FFF', margin: 0, letterSpacing: '-0.02em' }}>
              {invoice.invoice_number}
            </h1>
            <span style={{ fontFamily: mono, fontSize: '10px', color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, padding: '3px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '3px' }}>
              {invoice.status}
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: '15px', color: '#888', margin: 0 }}>{invoice.client_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={`/os/invoices/${invoice.id}/print`}
            target="_blank"
            style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#ccc', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
          >
            📄 PDF
          </a>
          {invoice.status !== 'paid' && (
            <button
              onClick={markPaid}
              disabled={marking}
              style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '9px 16px', cursor: marking ? 'wait' : 'pointer', opacity: marking ? 0.6 : 1 }}
            >
              ✓ Mark Paid
            </button>
          )}
          <button
            onClick={deleteInvoice}
            disabled={deleting}
            style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', padding: '9px 16px', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.5 : 1 }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Date', value: new Date(invoice.created_at).toLocaleDateString('de-DE') },
          { label: 'Due Date', value: invoice.due_date ? new Date(invoice.due_date + 'T12:00:00').toLocaleDateString('de-DE') : '—' },
          { label: 'Paid On', value: invoice.paid_date ? new Date(invoice.paid_date + 'T12:00:00').toLocaleDateString('de-DE') : '—' },
        ].map(m => (
          <div key={m.label} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '16px 20px' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>{m.label}</p>
            <p style={{ fontFamily: mono, fontSize: '14px', color: '#FFF', margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Client block */}
      <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '20px 24px', marginBottom: '20px' }}>
        <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>Client</p>
        <p style={{ fontFamily: sans, fontSize: '15px', fontWeight: 600, color: '#FFF', margin: '0 0 4px' }}>{invoice.client_name}</p>
        {invoice.client_email && <p style={{ fontFamily: mono, fontSize: '12px', color: '#888', margin: '0 0 3px' }}>{invoice.client_email}</p>}
        {invoice.client_address && <p style={{ fontFamily: sans, fontSize: '13px', color: '#666', margin: 0, whiteSpace: 'pre-line' }}>{invoice.client_address}</p>}
      </div>

      {/* Line items */}
      <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0D0D0D' }}>
          <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Line Items</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['#', 'Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === '#' ? 'center' : h === 'Qty' || h === 'Unit Price' || h === 'Total' ? 'right' : 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px', fontFamily: sans, fontSize: '13px', color: '#444', textAlign: 'center' }}>No line items.</td></tr>
            ) : items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: '#F97316' }}>{String(i + 1).padStart(2, '0')}</td>
                <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '14px', color: '#FFF' }}>
                  {item.description}
                  {!item.isFixedPrice && item.unit && item.qty > 1 && (
                    <span style={{ fontFamily: mono, fontSize: '11px', color: '#555', marginLeft: '8px' }}>({item.qty} {item.unit})</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: '#888' }}>{item.isFixedPrice ? '1' : item.qty}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: '#888' }}>{fmtEur(Number(item.unit_price || item.total))}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>{fmtEur(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ padding: '16px 24px', borderTop: '2px solid #F97316', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            {hasAnz ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>Zwischensumme</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>{fmtEur(Number(invoice.subtotal || invoice.total))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>Anzahlung ({invoice.anzahlung_method || 'Überweisung'})</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>−{fmtEur(Number(invoice.anzahlung))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                  <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>Restbetrag</span>
                  <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 700, color: '#F97316' }}>{fmtEur(restbet)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>Gesamt</span>
                <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 700, color: '#F97316' }}>{fmtEur(Number(invoice.total))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '20px 24px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>Notes</p>
          <p style={{ fontFamily: sans, fontSize: '14px', color: '#888', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
        </div>
      )}

      <p style={{ fontFamily: mono, fontSize: '10px', color: '#333', marginTop: '16px' }}>
        Gemäß §19 UStG keine MwSt. · Steuernummer: 111/5339/7597 · Finanzamt Essen-NordOst
      </p>
    </div>
  )
}
