'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string
  total: number; status: string; created_at: string; due_date: string; paid_date: string
}

const STATUS_TABS = ['all', 'draft', 'sent', 'paid', 'overdue']
const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  draft:   { text: '#888', bg: '#88888820' },
  sent:    { text: '#3b82f6', bg: '#3b82f620' },
  paid:    { text: '#22c55e', bg: '#22c55e20' },
  overdue: { text: '#ef4444', bg: '#ef444420' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { text: '#888', bg: '#88888820' }
  return (
    <span style={{ fontFamily: mono, fontSize: '9px', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>
      {status}
    </span>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')

  useEffect(() => {
    fetch('/api/os/invoices')
      .then(r => r.json())
      .then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markPaid(id: string) {
    const res = await fetch('/api/os/invoices', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }),
    })
    if (res.ok) setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' } : i))
  }

  async function deleteInvoice(id: string, num: string) {
    if (!confirm(`Delete invoice ${num}? This cannot be undone.`)) return
    const res = await fetch(`/api/os/invoices?id=${id}`, { method: 'DELETE' })
    if (res.ok) setInvoices(prev => prev.filter(i => i.id !== id))
  }

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  const filtered = tab === 'all' ? invoices : invoices.filter(i => i.status === tab)
  const totals   = {
    outstanding: invoices.filter(i => ['sent','overdue'].includes(i.status)).reduce((s,i) => s + Number(i.total), 0),
    paid:        invoices.filter(i => i.status === 'paid').reduce((s,i) => s + Number(i.total), 0),
  }

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Invoices</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>
            Outstanding: <span style={{ color: '#F97316' }}>{fmtEur(totals.outstanding)}</span>
            &nbsp;·&nbsp; Paid: <span style={{ color: '#22c55e' }}>{fmtEur(totals.paid)}</span>
          </p>
        </div>
        <Link href="/os/invoices/new" style={{ background: '#F97316', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', textTransform: 'uppercase' }}>
          + New Invoice
        </Link>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {STATUS_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '7px 14px', border: 'none', cursor: 'pointer',
              background: tab === t ? '#F97316' : 'transparent',
              color: tab === t ? '#000' : '#555',
              borderBottom: tab === t ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Number', 'Client', 'Date', 'Due', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No invoices found.</td></tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/os/invoices/${inv.id}`} style={{ fontFamily: mono, fontSize: '12px', color: '#F97316', textDecoration: 'none' }}>{inv.invoice_number}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#FFF' }}>{inv.client_name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#555' }}>
                    {new Date(inv.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: inv.status === 'overdue' ? '#ef4444' : '#555' }}>
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>
                    {fmtEur(Number(inv.total))}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a
                        href={`/os/invoices/${inv.id}/print`}
                        target="_blank"
                        style={{ fontFamily: mono, fontSize: '10px', color: '#888', textDecoration: 'none', letterSpacing: '0.06em' }}
                      >
                        PDF
                      </a>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => markPaid(inv.id)}
                          style={{ fontFamily: mono, fontSize: '10px', color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
                        >
                          Paid ✓
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvoice(inv.id, inv.invoice_number)}
                        style={{ fontFamily: mono, fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
