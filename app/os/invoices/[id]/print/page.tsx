'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice?: boolean }
interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; due_date: string; notes: string
  anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string; restbetrag?: number
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function buildWhatsApp(inv: Invoice): string {
  const items = (Array.isArray(inv.line_items) ? inv.line_items : [])
    .map(i => `• ${i.description}: ${fmtEur(Number(i.total))}`)
    .join('\n')

  const anzText = inv.anzahlung && Number(inv.anzahlung) > 0
    ? `\nAnzahlung: ${fmtEur(Number(inv.anzahlung))}\nRestbetrag: ${fmtEur(Number(inv.restbetrag ?? (Number(inv.total) - Number(inv.anzahlung))))}`
    : ''

  const dueStr = inv.due_date
    ? new Date(inv.due_date + 'T12:00:00').toLocaleDateString('de-DE')
    : '—'

  const msg = `Guten Tag ${inv.client_name},

anbei Ihre Rechnung Nr. ${inv.invoice_number} von MAXPROMO DIGITAL.

📋 Leistungen:
${items}

💰 Gesamtbetrag: ${fmtEur(Number(inv.total))}${anzText}

📅 Zahlungsziel: ${dueStr}

🏦 Bankverbindung:
Marcel Tabit Akwe
IBAN: DE03 1001 0178 3648 4449 24
BIC: REVODEB2

Das vollständige Dokument als PDF finden Sie im Anhang.

Steuernummer: 111/5339/7597
Gemäß §19 UStG keine MwSt.

Mit freundlichen Grüßen
Marcel Tabit Akwe
MAXPROMO DIGITAL
+49 173 3645698
maxpromo.digital`

  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export default function PrintPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('os-auth') !== 'true') { router.replace('/os/login'); return }
    fetch(`/api/os/invoices?id=${id}`)
      .then(r => r.json())
      .then(d => { setInvoice(d as Invoice); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (invoice) setTimeout(() => window.print(), 800)
  }, [invoice])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'monospace', color: '#888' }}>Loading invoice...</div>
  if (!invoice) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'monospace', color: '#888' }}>Invoice not found.</div>

  const date    = new Date(invoice.created_at).toLocaleDateString('de-DE')
  const dueDate = invoice.due_date ? new Date(invoice.due_date + 'T12:00:00').toLocaleDateString('de-DE') : '—'
  const items   = Array.isArray(invoice.line_items) ? invoice.line_items : []
  const hasAnz  = Number(invoice.anzahlung) > 0
  const restbet = hasAnz ? Number(invoice.restbetrag ?? (Number(invoice.total) - Number(invoice.anzahlung))) : Number(invoice.total)

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

      {/* Toolbar */}
      <div className="no-print" style={{ background: '#0A0A0A', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          📄 Als PDF speichern
        </button>
        <a
          href={buildWhatsApp(invoice)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#25D366', color: '#FFF', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', display: 'inline-block', textTransform: 'uppercase' }}
        >
          💬 Per WhatsApp senden
        </a>
        <button
          onClick={() => window.close()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', fontFamily: 'monospace', fontSize: '11px', padding: '10px 14px', cursor: 'pointer' }}
        >
          Close
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', marginLeft: 'auto' }}>
          WhatsApp: message pre-filled — attach the PDF manually before sending
        </span>
      </div>

      {/* Document */}
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
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111' }}>
                    {item.description}
                    {!item.isFixedPrice && item.unit && item.qty > 1 && (
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', marginLeft: '6px' }}>({item.qty} {item.unit})</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555' }}>{item.isFixedPrice ? '1' : item.qty}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555' }}>{fmtEur(Number(item.unit_price || item.total))}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', color: '#111', fontWeight: 700 }}>{fmtEur(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ borderTop: '3px solid #F97316', paddingTop: '16px', marginBottom: '20px' }}>
            {hasAnz ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#555', margin: '0 0 4px' }}>Zwischensumme: {fmtEur(Number(invoice.subtotal || invoice.total))}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#555', margin: '0 0 8px' }}>Anzahlung ({invoice.anzahlung_method || 'Überweisung'}): −{fmtEur(Number(invoice.anzahlung))}</p>
                <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#111' }}>Restbetrag: {fmtEur(restbet)}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#111' }}>Gesamtbetrag: {fmtEur(Number(invoice.total))}</span>
              </div>
            )}
          </div>

          {hasAnz && invoice.anzahlung_date && (
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555', fontStyle: 'italic', margin: '0 0 12px' }}>
              Vielen Dank für Ihre Anzahlung von {fmtEur(Number(invoice.anzahlung))} am {new Date(invoice.anzahlung_date + 'T12:00:00').toLocaleDateString('de-DE')}.
            </p>
          )}

          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 4px' }}>Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>
          {invoice.notes && <p style={{ fontSize: '13px', color: '#555', margin: '12px 0 0', fontStyle: 'italic' }}>{invoice.notes}</p>}
        </div>

        {/* Bank */}
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
