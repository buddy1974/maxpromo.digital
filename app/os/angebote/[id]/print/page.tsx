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

/**
 * Display Einzelpreis as total ÷ qty so Menge × Einzelpreis = Gesamt
 * always holds for the reader, regardless of what's in unit_price.
 *
 * The AI extractor sometimes stores rounded per-unit prices that don't
 * multiply back to the stated total (e.g. 2500 × €0,05 = €125, not €120).
 * The edit page also lets users change `total` without touching
 * `unit_price`. Trusting only `total` as the source of truth and deriving
 * the per-unit price at render time keeps the document self-consistent.
 *
 * For sub-cent unit prices (e.g. €0,048) we show up to 4 decimals so
 * the math doesn't appear off-by-rounding.
 */
function fmtUnitPrice(total: number, qty: number): string {
  const q = qty > 0 ? qty : 1
  const unit = total / q
  // 2 decimals normally; 4 decimals if rounding would distort
  const fractionDigits = Math.abs(unit * q - total) > 0.005 || Math.abs(unit - Math.round(unit * 100) / 100) > 0.0001 ? 4 : 2
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: fractionDigits,
  }).format(unit)
}

/**
 * Parse a date that may be either a date-only string ("2026-06-04") OR a
 * full ISO datetime ("2026-06-04T00:00:00.000Z"). Returns "—" for null
 * and any unparseable input — never the literal string "Invalid Date".
 */
function fmtGermanDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = value.length > 10 ? new Date(value) : new Date(value + 'T12:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildWhatsApp(a: Angebot): string {
  const items = (Array.isArray(a.line_items) ? a.line_items : [])
    .map(i => `• ${i.description}: ${fmtEur(Number(i.total))}`)
    .join('\n')

  const validStr = fmtGermanDate(a.valid_until)

  const paymentBlock = a.payment_terms ? `\n\nZahlung: ${a.payment_terms}` : ''

  const msg = `Guten Tag ${a.client_name},

anbei mein Angebot Nr. ${a.angebot_number} (PDF angehängt).

Leistungen:
${items}

Gesamtbetrag: ${fmtEur(Number(a.total))}${paymentBlock}

Angebot gültig bis: ${validStr}

Gemäß §19 UStG wird keine Umsatzsteuer berechnet.

Mit freundlichen Grüßen
Marcel Tabit Akwe
MAXPROMO DIGITAL · maxpromo.digital · +49 173 3645698`

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

  const date    = fmtGermanDate(angebot.created_at)
  const validTo = fmtGermanDate(angebot.valid_until)
  const items   = Array.isArray(angebot.line_items) ? angebot.line_items : []
  const hasAnz  = Number(angebot.anzahlung) > 0
  const restbet = hasAnz ? Number(angebot.total) - Number(angebot.anzahlung) : Number(angebot.total)

  return (
    <>
      <title>Angebot-{angebot.angebot_number}-{angebot.client_name.replace(/[^a-zA-Z0-9À-ž]/g, '-').replace(/-+/g, '-')}</title>
      <style>{`
        body { background: #f0f0f0; }
        * { box-sizing: border-box; }

        @media print {
          /* Force Chrome / Safari / Firefox to print background colors and
             images. Without this the dark letterhead and the orange totals
             row come out as plain white. Setting on every element so we
             cover the inline backgrounds set on the header div. */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          /* Hide every body child whose subtree does NOT contain our document.
             That kills the global Navbar, Footer, ChatAgent, and CookieBanner
             coming from app/layout.tsx without needing to touch them. */
          body > *:not(:has([data-print-doc])) {
            display: none !important;
          }

          /* The OS root layout (app/os/layout.tsx) wraps us in a fixed-
             position div that browsers repeat on every printed page and
             clip at viewport height. Reset it so the document flows
             naturally across pages. The :has() selector matches it
             because it contains [data-print-doc] somewhere inside. */
          body > *:has([data-print-doc]) {
            position: static !important;
            inset: auto !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: transparent !important;
            z-index: auto !important;
            display: block !important;
          }

          /* The on-screen toolbar at the top of this page never prints. */
          .no-print { display: none !important; }

          /* The on-screen page wrapper has a grey background + shadow —
             remove for paper. */
          [data-print-doc] {
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: none !important;
          }

          @page { size: A4; margin: 18mm 16mm; }

          /* Avoid breaking individual rows mid-row, but let the table itself
             flow across pages so we don't waste a whole page below the
             intro letter waiting for the table to fit in one block. */
          tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: '#0A0A0A', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          📄 Als PDF speichern
        </button>
        {/*
          WhatsApp Click-to-Chat URLs only support text — there's no API
          to attach a file. The page already auto-triggers print on load
          (PDF lands in Downloads). This button just opens the chat with
          the message pre-filled; the user drags the PDF in afterwards.
        */}
        <a
          href={buildWhatsApp(angebot)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#25D366', color: '#FFF', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', display: 'inline-block', textTransform: 'uppercase' }}
        >
          💬 WhatsApp text
        </a>
        <button
          onClick={() => window.close()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#888', fontFamily: 'monospace', fontSize: '11px', padding: '10px 14px', cursor: 'pointer' }}
        >
          Close
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', marginLeft: 'auto', maxWidth: '380px', textAlign: 'right', lineHeight: 1.5 }}>
          WhatsApp can&apos;t auto-attach files. PDF saves to Downloads — drag it into the chat after the text is pre-filled.
        </span>
      </div>

      {/* Document */}
      <div data-print-doc style={{ background: '#fff', maxWidth: '780px', margin: '20px auto', boxShadow: '0 4px 40px rgba(0,0,0,0.15)', fontFamily: 'Arial,sans-serif' }}>
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
                <th style={{ padding: '7px 10px', textAlign: 'left',  fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pos</th>
                <th style={{ padding: '7px 10px', textAlign: 'left',  fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Beschreibung</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menge</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Einzelpreis</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const qty = item.isFixedPrice ? 1 : Number(item.qty || 1)
                const total = Number(item.total) || 0
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#F97316', fontWeight: 700, verticalAlign: 'top' }}>{String(i+1).padStart(2,'0')}</td>
                    <td style={{ padding: '7px 10px', fontSize: '13px', color: '#111', whiteSpace: 'pre-wrap', verticalAlign: 'top', lineHeight: 1.5 }}>
                      {item.description}
                      {!item.isFixedPrice && item.unit && item.qty > 1 && (
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', marginLeft: '6px' }}>({item.qty} {item.unit})</span>
                      )}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555', verticalAlign: 'top' }}>{qty}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555', verticalAlign: 'top' }}>{fmtUnitPrice(total, qty)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', color: '#111', fontWeight: 700, verticalAlign: 'top' }}>{fmtEur(total)}</td>
                  </tr>
                )
              })}
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

          {/* Compact trailing block: payment terms (if any) + single §19 UStG line + notes + signature.
              Removed: Inklusive (kostenlos) list, "Alle Preise gemäß…" duplicate legal,
              "Bei Fragen…" closing line. Per Marcel: keep Angebot/Rechnung tight. */}
          {angebot.payment_terms && (
            <p style={{ fontSize: '12px', color: '#333', margin: '0 0 6px' }}>
              <strong>Zahlung:</strong> {angebot.payment_terms}
            </p>
          )}

          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 4px' }}>
            Gemäß §19 UStG wird keine Umsatzsteuer berechnet. Angebot gültig bis {validTo}.
          </p>

          {angebot.notes && (
            <p style={{ fontSize: '12px', color: '#555', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{angebot.notes}</p>
          )}

          <p style={{ fontSize: '13px', color: '#333', margin: '20px 0 0', lineHeight: 1.5 }}>
            Mit freundlichen Grüßen<br />
            <strong>Marcel Tabit Akwe</strong>
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
