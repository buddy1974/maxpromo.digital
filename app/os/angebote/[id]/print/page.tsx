'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice?: boolean }
interface Angebot {
  id: string; angebot_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; valid_until: string; notes: string
  anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string
  payment_terms?: string; included_items?: string[]
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function buildWhatsApp(a: Angebot): string {
  const items = (Array.isArray(a.line_items) ? a.line_items : [])
    .map(i => `• ${i.description}: ${fmtEur(Number(i.total))}`)
    .join('\n')

  const validStr = a.valid_until ? new Date(a.valid_until + 'T12:00:00').toLocaleDateString('de-DE') : '—'

  const includedBlock = Array.isArray(a.included_items) && a.included_items.length > 0
    ? `\n\n✨ Inklusive (kostenlos):\n${a.included_items.map(it => `• ${it}`).join('\n')}`
    : ''

  const paymentBlock = a.payment_terms ? `\n\n💳 Zahlung:\n${a.payment_terms}` : ''

  const msg = `Guten Tag ${a.client_name},

anbei mein Angebot Nr. ${a.angebot_number} von MAXPROMO DIGITAL.

📋 Leistungen:
${items}

💰 Gesamtbetrag: ${fmtEur(Number(a.total))}${includedBlock}${paymentBlock}

📅 Angebot gültig bis: ${validStr}

Steuernummer: 111/5339/7597
Gemäß §19 UStG keine MwSt.

Bei Fragen melden Sie sich gerne.

Mit freundlichen Grüßen
Marcel Tabit Akwe
MAXPROMO DIGITAL
+49 173 3645698
maxpromo.digital`

  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export default function AngebotPrintPage() {
  const { id } = useParams<{ id: string }>()
  const [angebot, setAngebot] = useState<Angebot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auth is already enforced by middleware.ts before this page renders.
    fetch(`/api/os/angebote?id=${id}`)
      .then(r => r.json())
      .then(d => { setAngebot(d as Angebot); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (angebot) setTimeout(() => window.print(), 800)
  }, [angebot])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'monospace', color: '#888' }}>Loading angebot...</div>
  if (!angebot) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'monospace', color: '#888' }}>Angebot not found.</div>

  const date    = new Date(angebot.created_at).toLocaleDateString('de-DE')
  const validTo = angebot.valid_until ? new Date(angebot.valid_until + 'T12:00:00').toLocaleDateString('de-DE') : '—'
  const items   = Array.isArray(angebot.line_items) ? angebot.line_items : []
  const hasAnz  = Number(angebot.anzahlung) > 0
  const restbet = hasAnz ? Number(angebot.total) - Number(angebot.anzahlung) : Number(angebot.total)

  return (
    <>
      <title>Angebot-{angebot.angebot_number}-{angebot.client_name.replace(/[^a-zA-Z0-9À-ž]/g, '-').replace(/-+/g, '-')}</title>
      <style>{`
        @media print {
          body { margin: 0; background: #fff !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 20mm; }
        }
        body { background: #f0f0f0; }
        * { box-sizing: border-box; }
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
          href={buildWhatsApp(angebot)}
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
              <p style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: '#FFF', margin: '0 0 8px', letterSpacing: '0.1em' }}>ANGEBOT</p>
              <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#F97316', margin: '0 0 3px' }}>Nr: {angebot.angebot_number}</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: '0 0 3px' }}>Datum: {date}</p>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', margin: 0 }}>Gültig bis: {validTo}</p>
            </div>
          </div>
        </div>

        {/* Client */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>An / To</p>
          {(() => {
            const dashIdx = angebot.client_name.indexOf(' — ')
            const nameOnly = dashIdx >= 0 ? angebot.client_name.slice(0, dashIdx) : angebot.client_name
            const company  = dashIdx >= 0 ? angebot.client_name.slice(dashIdx + 3) : ''
            return <>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111', margin: '0 0 2px' }}>{nameOnly}</p>
              {company && <p style={{ fontSize: '13px', color: '#555', margin: '0 0 2px' }}>{company}</p>}
              {angebot.client_address && <p style={{ color: '#555', fontSize: '13px', margin: 0, whiteSpace: 'pre-line' }}>{angebot.client_address}</p>}
            </>
          })()}
        </div>

        {/* Letter intro */}
        <div style={{ padding: '24px 40px 8px' }}>
          <p style={{ fontSize: '13px', color: '#333', margin: '0 0 12px', fontFamily: 'monospace' }}>
            Sehr geehrte Damen und Herren,
          </p>
          <p style={{ fontSize: '14px', color: '#333', margin: 0, lineHeight: 1.7 }}>
            vielen Dank für Ihr Interesse an MAXPROMO DIGITAL. Anbei mein Angebot Nr. <strong>{angebot.angebot_number}</strong> vom {date} mit folgenden Leistungen:
          </p>
        </div>

        {/* Line items */}
        <div style={{ padding: '20px 40px' }}>
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
                <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#555', margin: '0 0 4px' }}>Zwischensumme: {fmtEur(Number(angebot.subtotal || angebot.total))}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#555', margin: '0 0 8px' }}>Anzahlung ({angebot.anzahlung_method || 'Überweisung'}): −{fmtEur(Number(angebot.anzahlung))}</p>
                <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#111' }}>Restbetrag: {fmtEur(restbet)}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#111' }}>Gesamtbetrag: {fmtEur(Number(angebot.total))}</span>
              </div>
            )}
          </div>

          {/* Included items (free) */}
          {Array.isArray(angebot.included_items) && angebot.included_items.length > 0 && (
            <div style={{ background: '#fafafa', borderLeft: '3px solid #22c55e', padding: '14px 20px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>Inklusive (kostenlos)</p>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {angebot.included_items.map((it, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>{it}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment terms */}
          {angebot.payment_terms && (
            <p style={{ fontSize: '13px', color: '#333', margin: '0 0 12px', fontStyle: 'italic' }}>
              <strong>Zahlungsbedingungen:</strong> {angebot.payment_terms}
            </p>
          )}

          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 4px' }}>
            Gemäß §19 UStG wird keine Umsatzsteuer berechnet. Dieses Angebot ist gültig bis {validTo}.
          </p>
          {angebot.notes && <p style={{ fontSize: '13px', color: '#555', margin: '12px 0 0', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{angebot.notes}</p>}

          <p style={{ fontSize: '14px', color: '#333', margin: '24px 0 0', lineHeight: 1.7 }}>
            Bei Fragen stehe ich Ihnen jederzeit zur Verfügung.<br /><br />
            Mit freundlichen Grüßen<br />
            <strong>Marcel Tabit Akwe</strong><br />
            Maxpromo Digital
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 40px 28px', borderTop: '1px solid #eee', background: '#fafafa' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 3px' }}>Steuernummer: 111/5339/7597 &nbsp;·&nbsp; Finanzamt: Essen-NordOst</p>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: 0 }}>Maxpromo Digital &nbsp;·&nbsp; Körnerstr. 8 &nbsp;·&nbsp; 45143 Essen &nbsp;·&nbsp; info@maxpromo.digital &nbsp;·&nbsp; +49 173 3645698</p>
        </div>
      </div>
    </>
  )
}
