import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getDb } from '@/lib/db'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'MAXPROMO DIGITAL <info@maxpromo.digital>'

interface LineItem {
  description: string
  qty: number
  unit?: string
  unit_price?: number
  total: number
  isFixedPrice?: boolean
}

interface AngebotRow {
  id: string
  angebot_number: string
  client_name: string
  client_email: string | null
  client_address: string | null
  line_items: LineItem[]
  subtotal: string | number
  total: string | number
  status: string
  created_at: string
  valid_until: string | null
  notes: string | null
  anzahlung: string | number | null
  anzahlung_date: string | null
  anzahlung_method: string | null
  payment_terms: string | null
  included_items: string[] | null
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatGermanDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildAngebotEmail(a: AngebotRow): string {
  const dashIdx = a.client_name.indexOf(' — ')
  const nameOnly  = dashIdx >= 0 ? a.client_name.slice(0, dashIdx).trim() : a.client_name.trim()
  const company   = dashIdx >= 0 ? a.client_name.slice(dashIdx + 3).trim() : ''
  const firstName = nameOnly.split(' ')[0]

  const salutation = company
    ? 'Sehr geehrte Damen und Herren,'
    : `Sehr geehrte/r ${esc(firstName)},`

  const subtotal = Number(a.subtotal ?? a.total)
  const total    = Number(a.total)
  const anzahl   = Number(a.anzahlung ?? 0)
  const hasAnz   = anzahl > 0
  const restbet  = hasAnz ? total - anzahl : total

  const addressLines = [
    `<p style="color:#111;font-size:15px;margin:0 0 2px;font-weight:600;">${esc(nameOnly)}</p>`,
    company ? `<p style="color:#555;font-size:13px;margin:0 0 2px;">${esc(company)}</p>` : '',
    a.client_address ? `<p style="color:#555;font-size:13px;margin:0;">${esc(a.client_address)}</p>` : '',
  ].filter(Boolean).join('')

  const items = Array.isArray(a.line_items) ? a.line_items : []
  const rows = items.map((item, i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#F97316;font-family:monospace;font-size:12px;font-weight:700;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;">${esc(item.description)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${item.isFixedPrice ? '1' : item.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${fmtEur(Number(item.unit_price ?? item.total))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;text-align:right;font-family:monospace;font-weight:700;">${fmtEur(Number(item.total))}</td>
    </tr>`).join('')

  const totalsHtml = hasAnz ? `
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:#555;text-align:right;">Zwischensumme</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:#555;text-align:right;">${fmtEur(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:#555;text-align:right;">Anzahlung (${esc(a.anzahlung_method ?? 'Überweisung')})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:#555;text-align:right;">−${fmtEur(anzahl)}</td>
    </tr>
    <tr style="background:#F97316;">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">Restbetrag</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmtEur(restbet)}</td>
    </tr>` : `
    <tr style="background:#F97316;">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">Gesamtbetrag</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmtEur(total)}</td>
    </tr>`

  const includedBlock = Array.isArray(a.included_items) && a.included_items.length > 0
    ? `<div style="background:#f5fef9;border-left:3px solid #22c55e;padding:14px 18px;margin:0 0 18px;">
         <p style="font-family:monospace;font-size:11px;color:#22c55e;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">Inklusive (kostenlos)</p>
         <ul style="margin:0;padding-left:18px;">
           ${a.included_items.map(it => `<li style="font-size:13px;color:#333;line-height:1.6;">${esc(it)}</li>`).join('')}
         </ul>
       </div>`
    : ''

  const paymentBlock = a.payment_terms
    ? `<p style="font-family:monospace;font-size:12px;color:#555;font-style:italic;margin:0 0 12px;"><strong>Zahlungsbedingungen:</strong> ${esc(a.payment_terms)}</p>`
    : ''

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">

      <div style="background:#0A0A0A;padding:28px 32px;border-bottom:4px solid #F97316;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="font-family:monospace;font-size:14px;font-weight:700;color:#FFF;margin:0 0 6px;letter-spacing:0.05em;">MAXPROMO DIGITAL</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">Marcel Tabit Akwe</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">Körnerstr. 8, 45143 Essen</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">info@maxpromo.digital</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0;">+49 173 3645698</p>
          </div>
          <div style="text-align:right;">
            <p style="font-family:monospace;font-size:18px;font-weight:700;color:#FFF;margin:0 0 6px;letter-spacing:0.1em;">ANGEBOT</p>
            <p style="font-family:monospace;font-size:12px;color:#F97316;margin:0 0 2px;">Nr. ${esc(a.angebot_number)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">Datum: ${formatGermanDate(a.created_at)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0;">Gültig bis: ${formatGermanDate(a.valid_until)}</p>
          </div>
        </div>
      </div>

      <div style="padding:20px 32px;background:#f9f9f9;border-bottom:1px solid #eee;">
        <p style="color:#888;font-size:10px;margin:0 0 8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;">An / To</p>
        ${addressLines}
      </div>

      <div style="padding:24px 32px;">
        <p style="color:#333;font-size:13px;margin:0 0 16px;font-family:monospace;">${salutation}</p>
        <p style="color:#333;font-size:14px;margin:0 0 20px;line-height:1.7;">
          vielen Dank für Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. <strong>${esc(a.angebot_number)}</strong> vom ${formatGermanDate(a.created_at)} mit folgenden Leistungen:
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;margin-bottom:4px;">
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">Pos</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">Beschreibung</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Menge</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Einzelpreis</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Gesamt</th>
          </tr>
          ${rows}
          ${totalsHtml}
        </table>

        <p style="font-family:monospace;font-size:11px;color:#888;margin:12px 0 18px;">Gemäß §19 UStG wird keine Umsatzsteuer berechnet. Dieses Angebot ist gültig bis ${formatGermanDate(a.valid_until)}.</p>

        ${includedBlock}
        ${paymentBlock}

        <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Bei Rückfragen stehe ich Ihnen jederzeit zur Verfügung.<br><br>
          Mit freundlichen Grüßen<br>
          <strong>Marcel Tabit Akwe</strong><br>
          Maxpromo Digital
        </p>
      </div>

      <div style="background:#0A0A0A;padding:20px 32px;">
        <p style="font-family:monospace;font-size:11px;color:#555;margin:0 0 4px;">
          Steuernummer: 111/5339/7597 &nbsp;·&nbsp; Finanzamt: Essen-NordOst
        </p>
        <p style="font-family:monospace;font-size:10px;color:#3d3d3d;margin:0;">
          Maxpromo Digital &nbsp;·&nbsp; Körnerstr. 8 &nbsp;·&nbsp; 45143 Essen &nbsp;·&nbsp; info@maxpromo.digital &nbsp;·&nbsp; +49 173 3645698
        </p>
      </div>
    </div>`
}

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email not configured', detail: 'RESEND_API_KEY environment variable is missing' },
      { status: 503 },
    )
  }

  const dbUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json(
      { error: 'Database not configured', detail: 'NEON_DATABASE_URL is missing' },
      { status: 503 },
    )
  }

  try {
    const body = await request.json() as {
      angebot_id: string
      sendCopyToMarcel?: boolean
      clientEmails?: string[]
    }

    if (!body.angebot_id) {
      return NextResponse.json({ error: 'angebot_id required' }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql`SELECT * FROM os_angebote WHERE id = ${body.angebot_id}` as AngebotRow[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Angebot not found' }, { status: 404 })
    }
    const angebot = rows[0]

    const toEmails = body.clientEmails?.length
      ? body.clientEmails
      : angebot.client_email ? [angebot.client_email] : []
    if (toEmails.length === 0) {
      return NextResponse.json({ error: 'No client email on this Angebot' }, { status: 400 })
    }

    const html = buildAngebotEmail(angebot)
    const bcc = body.sendCopyToMarcel !== false ? ['info@maxpromo.digital'] : []

    const result = await sendEmail({
      to: toEmails,
      from: FROM_EMAIL,
      replyTo: 'info@maxpromo.digital',
      subject: `Angebot Nr. ${angebot.angebot_number} — Maxpromo Digital`,
      html,
      bcc,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email send failed', detail: result.error },
        { status: 502 },
      )
    }

    await sql`
      UPDATE os_angebote
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${angebot.id}`

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/send-angebot]', msg)
    return NextResponse.json(
      { error: 'Failed to send angebot', detail: msg },
      { status: 500 },
    )
  }
}
