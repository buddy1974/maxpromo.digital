import { token } from '@maxpromo/design-tokens'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getDb } from '@/lib/db'
import type { CurrencyCode, DocumentLanguage } from '@/lib/documents/config'
import { fmtCurrency, fmtUnitPrice, fmtDocDate, splitClientName } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'
import {
  escHtml, emailSalutation, buildEmailHeaderHtml, buildEmailAddressBlockHtml,
  buildEmailTableHeaderHtml, buildEmailFooterHtml, buildEmailVatClauseHtml,
} from '@/lib/documents/emailHtml'

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
  currency: CurrencyCode | null
  language: DocumentLanguage | null
}

function buildAngebotEmail(a: AngebotRow): string {
  const language: DocumentLanguage = a.language ?? 'de'
  const t = getLabels(language)
  const { name: nameOnly, company } = splitClientName(a.client_name)
  const salutation = emailSalutation(nameOnly, company, language)
  const currency = a.currency ?? 'EUR'
  const fmt = (n: number) => fmtCurrency(n, currency)
  const fmtDate = (v: string | null) => fmtDocDate(v, language)

  const subtotal = Number(a.subtotal ?? a.total)
  const total    = Number(a.total)
  const anzahl   = Number(a.anzahlung ?? 0)
  const hasAnz   = anzahl > 0
  const restbet  = hasAnz ? total - anzahl : total

  const items = Array.isArray(a.line_items) ? a.line_items : []
  const rows = items.map((item, i) => {
    const qty = item.isFixedPrice ? 1 : Number(item.qty || 1)
    const total = Number(item.total) || 0
    return `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:${token.primaryText};font-family:monospace;font-size:11px;font-weight:700;vertical-align:top;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:var(--brand-text);font-size:13px;line-height:1.5;white-space:pre-wrap;vertical-align:top;">${escHtml(item.description)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:var(--brand-text-muted);text-align:right;font-family:monospace;font-size:12px;vertical-align:top;">${qty}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:var(--brand-text-muted);text-align:right;font-family:monospace;font-size:12px;vertical-align:top;">${fmtUnitPrice(total, qty, currency)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${token.border};color:var(--brand-text);text-align:right;font-family:monospace;font-size:13px;font-weight:700;vertical-align:top;">${fmt(total)}</td>
    </tr>`
  }).join('')

  const totalsHtml = hasAnz ? `
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">${escHtml(t.subtotal)}</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">${fmt(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">${escHtml(t.deposit)} (${escHtml(a.anzahlung_method ?? t.bankTransfer)})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">−${fmt(anzahl)}</td>
    </tr>
    <tr style="background:${token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:var(--brand-surface-inverted);text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.remainingBalance)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:var(--brand-surface-inverted);text-align:right;">${fmt(restbet)}</td>
    </tr>` : `
    <tr style="background:${token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:var(--brand-surface-inverted);text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.quoteTotal)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:var(--brand-surface-inverted);text-align:right;">${fmt(total)}</td>
    </tr>`

  // Inklusive (kostenlos) list intentionally omitted from the email body
  // — kept compact per Marcel's preference. The data is still stored in
  // the row and visible inside the OS for internal reference.

  const paymentBlock = a.payment_terms
    ? `<p style="font-size:12px;color:var(--brand-text-secondary);margin:0 0 8px;"><strong>${escHtml(t.paymentTerms)}:</strong> ${escHtml(a.payment_terms)}</p>`
    : ''

  const introHtml = language === 'en'
    ? `thank you for your enquiry. Please find enclosed my Quote No. <strong>${escHtml(a.angebot_number)}</strong> dated ${fmtDate(a.created_at)} covering the following services:`
    : `vielen Dank für Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. <strong>${escHtml(a.angebot_number)}</strong> vom ${fmtDate(a.created_at)} mit folgenden Leistungen:`

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:${token.surface};">

      ${buildEmailHeaderHtml({
        docTypeLabel: t.quoteTitle,
        numberLabel: t.quoteNumber,
        number: a.angebot_number,
        dateLabel: t.quoteDate,
        date: fmtDate(a.created_at),
        secondaryDateLabel: t.validUntil,
        secondaryDate: fmtDate(a.valid_until),
      })}

      ${buildEmailAddressBlockHtml({ nameOnly, company, address: a.client_address, language })}

      <div style="padding:24px 32px;">
        <p style="color:var(--brand-text-secondary);font-size:13px;margin:0 0 16px;font-family:monospace;">${salutation}</p>
        <p style="color:var(--brand-text-secondary);font-size:14px;margin:0 0 20px;line-height:1.7;">
          ${introHtml}
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid var(--brand-border);margin-bottom:4px;">
          ${buildEmailTableHeaderHtml(language)}
          ${rows}
          ${totalsHtml}
        </table>

        ${paymentBlock}

        ${buildEmailVatClauseHtml(language, t.quoteValidUntilNote(fmtDate(a.valid_until)))}

        <p style="color:var(--brand-text-secondary);font-size:13px;line-height:1.5;margin:0 0 16px;">
          ${escHtml(t.closing)}<br>
          <strong>Marcel Tabit Akwe</strong>
        </p>
      </div>

      ${buildEmailFooterHtml(language)}
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
    const t = getLabels(angebot.language ?? 'de')

    const result = await sendEmail({
      to: toEmails,
      from: FROM_EMAIL,
      replyTo: 'info@maxpromo.digital',
      subject: t.emailSubjectQuote(angebot.angebot_number),
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
