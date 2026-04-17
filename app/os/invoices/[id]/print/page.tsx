'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface LineItem { description: string; qty: number; unit_price: number; total: number }
interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; due_date: string; notes: string
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('os-auth') !== 'true') {
      router.replace('/os/login')
      return
    }
    fetch(`/api/os/invoices?id=${id}`)
      .then(r => r.json())
      .then(d => { setInvoice(d as Invoice); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (invoice) setTimeout(() => window.print(), 800)
  }, [invoice])

  if (loading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#fff', fontFamily:'monospace', color:'#888' }}>Loading invoice...</div>
  }
  if (!invoice) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#fff', fontFamily:'monospace', color:'#888' }}>Invoice not found.</div>
  }

  const date     = new Date(invoice.created_at).toLocaleDateString('de-DE')
  const dueDate  = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('de-DE') : '—'
  const items    = Array.isArray(invoice.line_items) ? invoice.line_items : []

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 15mm; }
        }
        body { background: #f0f0f0; }
      `}</style>

      <div className="no-print" style={{ background: '#0A0A0A', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => window.print()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase' }}>
          Print / Save PDF
        </button>
        <button onClick={() => window.close()} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', fontFamily: 'monospace', fontSize: '11px', padding: '10px 16px', cursor: 'pointer' }}>
          Close
        </button>
      </div>

      <div style={{ background: '#fff', maxWidth: '780px', margin: '20px auto', boxShadow: '0 4px 40px rgba(0,0,0,0.15)', fontFamily: 'Arial,sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#0A0A0A', padding: '32px 40px', borderBottom: '4px solid #F97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#FFF', margin: '0 0 8px', letterSpacing: '0.05em' }}>MAXPROMO DIGITAL</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: '0 0 2px' }}>Marcel Tabit Akwe</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: '0 0 2px' }}>Körnerstr. 8, 45143 Essen</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: '0 0 2px' }}>info@maxpromo.digital</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: 0 }}>maxpromo.digital</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: '#FFF', margin: '0 0 8px', letterSpacing: '0.1em' }}>RECHNUNG</p>
              <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#F97316', margin: '0 0 3px' }}>Nr: {invoice.invoice_number}</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: '0 0 3px' }}>Datum: {date}</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: 0 }}>Fällig bis: {dueDate}</p>
            </div>
          </div>
        </div>

        {/* Client */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>An / To</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111', margin: '0 0 3px' }}>{invoice.client_name}</p>
          {invoice.client_address && <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{invoice.client_address}</p>}
        </div>

        {/* Line items */}
        <div style={{ padding: '28px 40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111', background: '#f5f5f5' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontFamily: 'monospace', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pos</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontFamily: 'monospace', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Beschreibung</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menge</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Einzelpreis</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#F97316', fontWeight: 700 }}>{String(i+1).padStart(2,'0')}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111' }}>{item.description}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555' }}>{item.qty}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555' }}>{fmtEur(Number(item.unit_price))}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', color: '#111', fontWeight: 700 }}>{fmtEur(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', borderTop: '3px solid #F97316', paddingTop: '16px', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#111' }}>
              Gesamtbetrag: {fmtEur(Number(invoice.total))}
            </span>
          </div>

          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 4px' }}>Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>
          {invoice.notes && <p style={{ fontSize: '13px', color: '#555', margin: '12px 0 0', fontStyle: 'italic' }}>{invoice.notes}</p>}
        </div>

        {/* Bank details */}
        <div style={{ padding: '20px 40px 28px', borderTop: '1px solid #eee', background: '#fafafa' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Bankverbindung</p>
          <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#111', margin: '0 0 3px' }}>Marcel Tabit Akwe</p>
          <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#111', margin: '0 0 3px' }}>IBAN: DE03 1001 0178 3648 4449 24</p>
          <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#111', margin: '0 0 12px' }}>BIC: REVODEB2</p>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 3px' }}>Steuernummer: 111/5339/7597 &nbsp;·&nbsp; Finanzamt: Essen-NordOst</p>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: 0 }}>Maxpromo Digital &nbsp;·&nbsp; Körnerstr. 8 &nbsp;·&nbsp; 45143 Essen &nbsp;·&nbsp; info@maxpromo.digital</p>
        </div>
      </div>
    </>
  )
}
