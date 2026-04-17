import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getDb } from '@/lib/db'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

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

function buildInvoiceEmail(data: {
  invoice_number: string; client_name: string; date: string
  due_date: string; line_items: LineItem[]; total: number
}): string {
  const rows = data.line_items.map((item, i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;font-family:monospace;font-size:12px;">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;">${esc(item.description)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${item.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;text-align:right;font-family:monospace;">${fmtEur(item.unit_price)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;text-align:right;font-family:monospace;font-weight:bold;">${fmtEur(item.total)}</td>
    </tr>`).join('')

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
      <div style="background:#0A0A0A;padding:28px 32px;border-bottom:3px solid #F97316;">
        <p style="font-family:monospace;font-size:10px;color:#F97316;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px;">MaxPromo Digital</p>
        <h1 style="color:#ffffff;margin:0 0 6px;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Rechnung</h1>
        <p style="color:#888;margin:0;font-size:12px;font-family:monospace;">Nr. ${esc(data.invoice_number)} &nbsp;·&nbsp; ${esc(data.date)}</p>
      </div>

      <div style="padding:24px 32px;background:#f9f9f9;border-bottom:1px solid #eee;">
        <p style="color:#888;font-size:11px;margin:0 0 4px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">An / To</p>
        <p style="color:#111;font-size:15px;margin:0;font-weight:600;">${esc(data.client_name)}</p>
      </div>

      <div style="padding:24px 32px;">
        <p style="color:#888;font-size:11px;margin:0 0 12px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Sehr geehrte/r ${esc(data.client_name)},</p>
        <p style="color:#333;font-size:14px;margin:0 0 20px;line-height:1.7;">
          anbei erhalten Sie Ihre Rechnung Nr. <strong>${esc(data.invoice_number)}</strong> vom ${esc(data.date)}.<br>
          Bitte überweisen Sie den Betrag von <strong>${fmtEur(data.total)}</strong> bis zum <strong>${esc(data.due_date)}</strong> auf folgendes Konto:
        </p>

        <div style="background:#f5f5f5;border-left:3px solid #F97316;padding:16px 20px;margin-bottom:24px;">
          <p style="font-family:monospace;font-size:11px;color:#F97316;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Bankverbindung</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">Marcel Tabit Akwe</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0 0 3px;">IBAN: DE03 1001 0178 3648 4449 24</p>
          <p style="font-family:monospace;font-size:13px;color:#111;margin:0;">BIC: REVODEB2</p>
        </div>

        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;margin-bottom:20px;">
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">Pos</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">Beschreibung</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Menge</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Einzelpreis</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Gesamt</th>
          </tr>
          ${rows}
          <tr style="background:#F97316;">
            <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">Gesamtbetrag</td>
            <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmtEur(data.total)}</td>
          </tr>
        </table>

        <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Für Rückfragen stehe ich Ihnen jederzeit zur Verfügung.<br><br>
          Mit freundlichen Grüßen<br>
          <strong>Marcel Tabit Akwe</strong><br>
          MaxPromo Digital
        </p>
      </div>

      <div style="background:#0A0A0A;padding:20px 32px;">
        <p style="font-family:monospace;font-size:11px;color:#555;margin:0 0 4px;">Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>
        <p style="font-family:monospace;font-size:10px;color:#3d3d3d;margin:0;">
          Steuernummer: 111/5339/7597 · Finanzamt: Essen-NordOst &nbsp;·&nbsp; info@maxpromo.digital · +49 173 3645698
        </p>
      </div>
    </div>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      invoice_id: string; client_email: string; client_name: string
      invoice_number: string; date: string; due_date: string
      line_items: LineItem[]; total: number
    }

    if (!body.client_email || !body.invoice_id) {
      return NextResponse.json({ error: 'invoice_id and client_email required' }, { status: 400 })
    }

    const html = buildInvoiceEmail(body)

    // Send to client
    const result = await sendEmail({
      to: body.client_email,
      from: FROM_EMAIL,
      replyTo: 'info@maxpromo.digital',
      subject: `Rechnung Nr. ${body.invoice_number} — MaxPromo Digital`,
      html,
    })

    // BCC to self
    await sendEmail({
      to: 'info@maxpromo.digital',
      from: FROM_EMAIL,
      subject: `[KOPIE] Rechnung ${body.invoice_number} → ${body.client_name}`,
      html,
    }).catch(console.error)

    if (!result.success) throw new Error(result.error)

    // Mark invoice as sent
    const sql = getDb()
    await sql`
      UPDATE os_invoices SET status = 'sent', sent_at = NOW()
      WHERE id = ${body.invoice_id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/send-invoice]', error)
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 })
  }
}
