import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { neon } from '@neondatabase/serverless'

const FROM_EMAIL = 'MAXPROMO DIGITAL <info@maxpromo.digital>'

interface LineItem {
  description: string
  qty: number
  unit_price: number
  total: number
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

function formatGermanDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildInvoiceEmail(data: {
  invoice_number: string
  client_name: string   // may be "Name — Company"
  address?: string
  date: string
  due_date: string
  line_items: LineItem[]
  subtotal: number
  total: number
  anzahlung?: number
  anzahlung_date?: string
  anzahlung_method?: string
  restbetrag?: number
}): string {
  // Split combined "Name — Company" field
  const dashIdx = data.client_name.indexOf(' — ')
  const nameOnly  = dashIdx >= 0 ? data.client_name.slice(0, dashIdx).trim() : data.client_name.trim()
  const company   = dashIdx >= 0 ? data.client_name.slice(dashIdx + 3).trim() : ''
  const firstName = nameOnly.split(' ')[0]

  // Salutation (Bug 4)
  const salutation = company
    ? 'Sehr geehrte Damen und Herren,'
    : `Sehr geehrte/r ${esc(firstName)},`

  // Anzahlung logic (Bug 1)
  const hasAnz  = Number(data.anzahlung) > 0
  const subtotal = Number(data.subtotal ?? data.total)
  const restbet  = hasAnz
    ? Number(data.restbetrag ?? (subtotal - Number(data.anzahlung)))
    : subtotal
  const amountDue = hasAnz ? restbet : subtotal
  const amountLabel = hasAnz ? 'Restbetrag' : 'Betrag'

  // "An / To" address lines (Bug 4)
  const addressLines = [
    `<p style="color:#111;font-size:15px;margin:0 0 2px;font-weight:600;">${esc(nameOnly)}</p>`,
    company ? `<p style="color:#555;font-size:13px;margin:0 0 2px;">${esc(company)}</p>` : '',
    data.address ? `<p style="color:#555;font-size:13px;margin:0;">${esc(data.address)}</p>` : '',
  ].filter(Boolean).join('')

  // Line items rows
  const rows = data.line_items.map((item, i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#F97316;font-family:monospace;font-size:12px;font-weight:700;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;">${esc(item.description)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${item.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${fmtEur(Number(item.unit_price ?? item.total))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;text-align:right;font-family:monospace;font-weight:700;">${fmtEur(Number(item.total))}</td>
    </tr>`).join('')

  // Totals rows (Bug 1)
  const totalsHtml = hasAnz ? `
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:#555;text-align:right;">Zwischensumme</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:#555;text-align:right;">${fmtEur(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:#555;text-align:right;">Anzahlung (${esc(data.anzahlung_method ?? 'Überweisung')})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:#555;text-align:right;">−${fmtEur(Number(data.anzahlung))}</td>
    </tr>
    <tr style="background:#F97316;">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">Restbetrag</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmtEur(restbet)}</td>
    </tr>` : `
    <tr style="background:#F97316;">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">Gesamtbetrag</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmtEur(subtotal)}</td>
    </tr>`

  // Anzahlung date acknowledgement
  const anzDateNote = hasAnz && data.anzahlung_date
    ? `<p style="font-family:monospace;font-size:11px;color:#555;font-style:italic;margin:0 0 12px;">
        Vielen Dank für Ihre Anzahlung von ${fmtEur(Number(data.anzahlung))} am ${formatGermanDate(data.anzahlung_date)}.
      </p>`
    : ''

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">

      <!-- Header: MAXPROMO DIGITAL + RECHNUNG -->
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
            <p style="font-family:monospace;font-size:18px;font-weight:700;color:#FFF;margin:0 0 6px;letter-spacing:0.1em;">RECHNUNG</p>
            <p style="font-family:monospace;font-size:12px;color:#F97316;margin:0 0 2px;">Nr. ${esc(data.invoice_number)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px;">Datum: ${formatGermanDate(data.date)}</p>
            <p style="font-family:monospace;font-size:11px;color:#888;margin:0;">Fällig bis: ${formatGermanDate(data.due_date)}</p>
          </div>
        </div>
      </div>

      <!-- An / To (Bug 4) -->
      <div style="padding:20px 32px;background:#f9f9f9;border-bottom:1px solid #eee;">
        <p style="color:#888;font-size:10px;margin:0 0 8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;">An / To</p>
        ${addressLines}
      </div>

      <!-- Letter body -->
      <div style="padding:24px 32px;">
        <p style="color:#333;font-size:13px;margin:0 0 16px;font-family:monospace;">${salutation}</p>
        <p style="color:#333;font-size:14px;margin:0 0 20px;line-height:1.7;">
          anbei erhalten Sie Ihre Rechnung Nr. <strong>${esc(data.invoice_number)}</strong> vom ${formatGermanDate(data.date)}.<br>
          Bitte überweisen Sie den <strong>${amountLabel} von ${fmtEur(amountDue)}</strong> bis zum <strong>${formatGermanDate(data.due_date)}</strong> auf folgendes Konto:
        </p>

        <!-- Bankverbindung -->
        <div style="background:#f5f5f5;border-left:3px solid #F97316;padding:16px 20px;margin-bottom:28px;">
          <p style="font-family:monospace;font-size:10px;color:#F97316;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">Bankverbindung</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">Marcel Tabit Akwe</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">IBAN: DE03 1001 0178 3648 4449 24</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0;">BIC: REVODEB2</p>
        </div>

        <!-- Line items table -->
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

        <!-- Anzahlung date note (Bug 1) -->
        ${anzDateNote}

        <!-- §19 UStG -->
        <p style="font-family:monospace;font-size:11px;color:#888;margin:12px 0 20px;">Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>

        <!-- Closing -->
        <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Für Rückfragen stehe ich Ihnen jederzeit zur Verfügung.<br><br>
          Mit freundlichen Grüßen<br>
          <strong>Marcel Tabit Akwe</strong><br>
          Maxpromo Digital
        </p>
      </div>

      <!-- Footer -->
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
  console.log('[send-invoice] POST called')

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-invoice] RESEND_API_KEY missing')
    return NextResponse.json(
      { error: 'Email not configured', detail: 'RESEND_API_KEY environment variable is missing' },
      { status: 503 }
    )
  }

  const dbUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('[send-invoice] DATABASE_URL missing')
    return NextResponse.json(
      { error: 'Database not configured', detail: 'Neither NEON_DATABASE_URL nor DATABASE_URL is set' },
      { status: 503 }
    )
  }

  try {
    console.log('[send-invoice] 1. Parsing body...')
    const body = await request.json() as {
      invoice_id: string
      clientEmails?: string[]
      client_email?: string
      client_name: string
      address?: string
      invoice_number: string
      date: string
      due_date: string
      line_items: LineItem[]
      subtotal?: number
      total: number
      anzahlung?: number
      anzahlung_date?: string
      anzahlung_method?: string
      restbetrag?: number
      sendCopyToMarcel?: boolean
    }

    const toEmails: string[] = body.clientEmails?.length
      ? body.clientEmails
      : body.client_email ? [body.client_email] : []

    if (!toEmails.length || !body.invoice_id) {
      return NextResponse.json({ error: 'invoice_id and at least one email required' }, { status: 400 })
    }

    console.log('[send-invoice] to:', toEmails, '| invoice:', body.invoice_number)

    console.log('[send-invoice] 2. Building HTML...')
    const html = buildInvoiceEmail({
      invoice_number: body.invoice_number,
      client_name: body.client_name,
      address: body.address,
      date: body.date,
      due_date: body.due_date,
      line_items: body.line_items,
      subtotal: body.subtotal ?? body.total,
      total: body.total,
      anzahlung: body.anzahlung,
      anzahlung_date: body.anzahlung_date,
      anzahlung_method: body.anzahlung_method,
      restbetrag: body.restbetrag,
    })

    const bcc = body.sendCopyToMarcel !== false ? ['info@maxpromo.digital'] : []

    console.log('[send-invoice] 3. Sending email via Resend...')
    const result = await sendEmail({
      to: toEmails,
      from: FROM_EMAIL,
      replyTo: 'info@maxpromo.digital',
      subject: `Rechnung Nr. ${body.invoice_number} — Maxpromo Digital`,
      html,
      bcc,
    })

    if (!result.success) {
      console.error('[send-invoice] Resend failed:', result.error)
      throw new Error(result.error ?? 'Resend returned failure')
    }

    console.log('[send-invoice] email sent, id:', result.id)

    console.log('[send-invoice] 4. Updating invoice status...')
    const sql = neon(dbUrl)
    await sql`
      UPDATE os_invoices SET status = 'sent', sent_at = NOW()
      WHERE id = ${body.invoice_id}`

    console.log('[send-invoice] done')
    return NextResponse.json({ success: true })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[send-invoice] ERROR:', msg)
    console.error('[send-invoice] stack:', stack)
    return NextResponse.json(
      { error: 'Failed to send invoice', detail: msg },
      { status: 500 }
    )
  }
}
