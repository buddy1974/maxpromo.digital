import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { neon } from '@neondatabase/serverless'
import { BUSINESS, type CurrencyCode, type DocumentLanguage } from '@/lib/documents/config'
import { fmtCurrency, fmtDocDate, splitClientName } from '@/lib/documents/format'
import { getLabels } from '@/lib/documents/labels'
import {
  escHtml, emailSalutation, buildEmailHeaderHtml, buildEmailAddressBlockHtml,
  buildEmailTableHeaderHtml, buildEmailBankBlockHtml, buildEmailFooterHtml, buildEmailVatClauseHtml,
} from '@/lib/documents/emailHtml'

const FROM_EMAIL = 'MAXPROMO DIGITAL <info@maxpromo.digital>'

interface LineItem {
  description: string
  qty: number
  unit_price: number
  total: number
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
  currency?: CurrencyCode | null
  language?: DocumentLanguage | null
}): string {
  const currency = data.currency ?? 'EUR'
  const language = data.language ?? 'de'
  const t = getLabels(language)
  const fmt = (n: number) => fmtCurrency(n, currency)
  const fmtDate = (v: string) => fmtDocDate(v, language)

  // Split combined "Name — Company" field
  const { name: nameOnly, company } = splitClientName(data.client_name)
  const salutation = emailSalutation(nameOnly, company, language)

  // Anzahlung logic
  const hasAnz  = Number(data.anzahlung) > 0
  const subtotal = Number(data.subtotal ?? data.total)
  const restbet  = hasAnz
    ? Number(data.restbetrag ?? (subtotal - Number(data.anzahlung)))
    : subtotal
  const amountDue = hasAnz ? restbet : subtotal
  const amountLabel = hasAnz ? t.remainingBalance : (language === 'en' ? 'Amount' : 'Betrag')

  // Line items rows
  const rows = data.line_items.map((item, i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#F97316;font-family:monospace;font-size:12px;font-weight:700;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;">${escHtml(item.description)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${item.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#555;text-align:right;font-family:monospace;">${fmt(Number(item.unit_price ?? item.total))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eeeeee;color:#111;text-align:right;font-family:monospace;font-weight:700;">${fmt(Number(item.total))}</td>
    </tr>`).join('')

  // Totals rows
  const totalsHtml = hasAnz ? `
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:#555;text-align:right;">${escHtml(t.subtotal)}</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:#555;text-align:right;">${fmt(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:#555;text-align:right;">${escHtml(t.deposit)} (${escHtml(data.anzahlung_method ?? t.bankTransfer)})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:#555;text-align:right;">−${fmt(Number(data.anzahlung))}</td>
    </tr>
    <tr style="background:#F97316;">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.remainingBalance)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmt(restbet)}</td>
    </tr>` : `
    <tr style="background:#F97316;">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.06em;">${escHtml(t.totalDue)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:#000;text-align:right;">${fmt(subtotal)}</td>
    </tr>`

  // Anzahlung date acknowledgement
  const anzDateNote = hasAnz && data.anzahlung_date
    ? `<p style="font-family:monospace;font-size:11px;color:#555;font-style:italic;margin:0 0 12px;">
        ${escHtml(t.depositThanks(fmt(Number(data.anzahlung)), fmtDate(data.anzahlung_date)))}
      </p>`
    : ''

  const introHtml = language === 'en'
    ? `attached is your Invoice No. <strong>${escHtml(data.invoice_number)}</strong> dated ${fmtDate(data.date)}.<br>
       Please transfer the <strong>${amountLabel} of ${fmt(amountDue)}</strong> by <strong>${fmtDate(data.due_date)}</strong> to the following account:`
    : `anbei erhalten Sie Ihre Rechnung Nr. <strong>${escHtml(data.invoice_number)}</strong> vom ${fmtDate(data.date)}.<br>
       Bitte überweisen Sie den <strong>${amountLabel} von ${fmt(amountDue)}</strong> bis zum <strong>${fmtDate(data.due_date)}</strong> auf folgendes Konto:`

  const closingHtml = language === 'en'
    ? `If you have any questions, please don't hesitate to reach out.<br><br>${escHtml(t.closing)}<br><strong>${escHtml(BUSINESS.legalName)}</strong><br>${escHtml(BUSINESS.brandFull)}`
    : `Für Rückfragen stehe ich Ihnen jederzeit zur Verfügung.<br><br>${escHtml(t.closing)}<br><strong>${escHtml(BUSINESS.legalName)}</strong><br>${escHtml(BUSINESS.brandFull)}`

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">

      ${buildEmailHeaderHtml({
        docTypeLabel: t.invoiceTitle,
        numberLabel: t.invoiceNumber,
        number: data.invoice_number,
        dateLabel: t.invoiceDate,
        date: fmtDate(data.date),
        secondaryDateLabel: t.dueDate,
        secondaryDate: fmtDate(data.due_date),
      })}

      ${buildEmailAddressBlockHtml({ nameOnly, company, address: data.address, language })}

      <!-- Letter body -->
      <div style="padding:24px 32px;">
        <p style="color:#333;font-size:13px;margin:0 0 16px;font-family:monospace;">${salutation}</p>
        <p style="color:#333;font-size:14px;margin:0 0 20px;line-height:1.7;">
          ${introHtml}
        </p>

        ${buildEmailBankBlockHtml(data.invoice_number, language)}

        <!-- Line items table -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;margin-bottom:4px;">
          ${buildEmailTableHeaderHtml(language)}
          ${rows}
          ${totalsHtml}
        </table>

        <!-- Anzahlung date note -->
        ${anzDateNote}

        ${buildEmailVatClauseHtml(language)}

        <!-- Closing -->
        <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">
          ${closingHtml}
        </p>
      </div>

      ${buildEmailFooterHtml(language)}
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
      currency?: CurrencyCode
      language?: DocumentLanguage
      sendCopyToMarcel?: boolean
    }

    const toEmails: string[] = body.clientEmails?.length
      ? body.clientEmails
      : body.client_email ? [body.client_email] : []

    if (!toEmails.length || !body.invoice_id) {
      return NextResponse.json({ error: 'invoice_id and at least one email required' }, { status: 400 })
    }

    console.log('[send-invoice] to:', toEmails, '| invoice:', body.invoice_number)

    // Fall back to the invoice's stored language if the caller didn't pass one explicitly.
    const sql = neon(dbUrl)
    let language: DocumentLanguage | null = body.language ?? null
    if (!language) {
      const langRows = await sql`SELECT language FROM os_invoices WHERE id = ${body.invoice_id}` as { language: DocumentLanguage | null }[]
      language = langRows[0]?.language ?? 'de'
    }

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
      currency: body.currency,
      language,
    })

    const bcc = body.sendCopyToMarcel !== false ? ['info@maxpromo.digital'] : []
    const t = getLabels(language)

    console.log('[send-invoice] 3. Sending email via Resend...')
    const result = await sendEmail({
      to: toEmails,
      from: FROM_EMAIL,
      replyTo: 'info@maxpromo.digital',
      subject: t.emailSubjectInvoice(body.invoice_number),
      html,
      bcc,
    })

    if (!result.success) {
      console.error('[send-invoice] Resend failed:', result.error)
      throw new Error(result.error ?? 'Resend returned failure')
    }

    console.log('[send-invoice] email sent, id:', result.id)

    console.log('[send-invoice] 4. Updating invoice status...')
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
