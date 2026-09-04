'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono    = 'var(--brand-font-mono)'
const sans    = 'var(--brand-font-body)'

interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string
  total: number; status: string; created_at: string; due_date: string; paid_date: string
}

/** Raw DB status values — the filter identity. Display text comes from t.status.invoice. */
const STATUS_TABS = ['all', 'draft', 'sent', 'paid', 'overdue']
const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  draft:   { text: 'var(--brand-text-secondary)', bg: 'var(--brand-surface-sunken)' },
  sent:    { text: 'var(--semantic-info)', bg: 'color-mix(in srgb, var(--semantic-info) 12%, transparent)' },
  paid:    { text: 'var(--semantic-success)', bg: 'color-mix(in srgb, var(--semantic-success) 12%, transparent)' },
  overdue: { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 12%, transparent)' },
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = STATUS_COLOR[status] ?? { text: 'var(--brand-text-secondary)', bg: 'var(--brand-surface-sunken)' }
  return (
    <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 'var(--radius-xs)' }}>
      {label}
    </span>
  )
}

export default function InvoicesPage() {
  const { t, fmtEur, fmtDate } = useOsLocale()
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
    if (!confirm(t.invoiceList.deleteConfirm(num))) return
    const res = await fetch(`/api/os/invoices?id=${id}`, { method: 'DELETE' })
    if (res.ok) setInvoices(prev => prev.filter(i => i.id !== id))
  }

  const tabLabel = (key: string) => key === 'all' ? t.status.filterAll : (t.status.invoice[key] ?? key)

  const filtered = tab === 'all' ? invoices : invoices.filter(i => i.status === tab)
  const totals   = {
    outstanding: invoices.filter(i => ['sent','overdue'].includes(i.status)).reduce((s,i) => s + Number(i.total), 0),
    paid:        invoices.filter(i => i.status === 'paid').reduce((s,i) => s + Number(i.total), 0),
  }

  const columns = [
    t.invoiceList.colNumber, t.invoiceList.colClient, t.invoiceList.colDate,
    t.invoiceList.colDue, t.invoiceList.colAmount, t.invoiceList.colStatus, t.invoiceList.colActions,
  ]

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', letterSpacing: '-0.02em', margin: '0 0 var(--space-1)' }}>{t.invoiceList.heading}</h1>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.1em' }}>
            {t.invoiceList.outstanding}: <span style={{ color: 'var(--brand-primary-text)' }}>{fmtEur(totals.outstanding)}</span>
            &nbsp;·&nbsp; {t.invoiceList.paid}: <span style={{ color: 'var(--semantic-success)' }}>{fmtEur(totals.paid)}</span>
          </p>
        </div>
        <Link href="/os/invoices/new" style={{ background: 'var(--brand-primary)', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: 'var(--text-label)', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', textTransform: 'uppercase' }}>
          {t.invoiceList.newInvoice}
        </Link>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: '20px' }}>
        {STATUS_TABS.map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '7px 14px', border: 'none', cursor: 'pointer',
              background: tab === key ? 'var(--brand-primary)' : 'transparent',
              color: tab === key ? 'var(--brand-text)' : 'var(--brand-text-muted)',
              borderBottom: tab === key ? 'none' : '1px solid var(--brand-border)',
            }}
          >
            {tabLabel(key)}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              {columns.map(h => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-5) var(--space-4)', fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)' }}>{t.common.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-5) var(--space-4)', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-muted)' }}>{t.invoiceList.empty}</td></tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link href={`/os/invoices/${inv.id}`} style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)', textDecoration: 'none' }}>{inv.invoice_number}</Link>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)' }}>{inv.client_name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)' }}>
                    {fmtDate(inv.created_at)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: mono, fontSize: 'var(--text-label)', color: inv.status === 'overdue' ? 'var(--semantic-danger)' : 'var(--brand-text-muted)' }}>
                    {fmtDate(inv.due_date)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', fontWeight: 700 }}>
                    {fmtEur(Number(inv.total))}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <StatusBadge status={inv.status} label={t.status.invoice[inv.status] ?? inv.status} />
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a
                        href={`/os/invoices/${inv.id}/print`}
                        target="_blank"
                        style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', textDecoration: 'none', letterSpacing: '0.06em' }}
                      >
                        {t.invoiceList.pdf}
                      </a>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => markPaid(inv.id)}
                          style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-success)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', margin: '-6px -2px', letterSpacing: '0.06em' }}
                        >
                          {t.invoiceList.markPaid}
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvoice(inv.id, inv.invoice_number)}
                        style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', margin: '-6px -2px', letterSpacing: '0.06em' }}
                      >
                        {t.invoiceList.delete}
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
