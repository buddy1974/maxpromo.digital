import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { admitLineItems } from '@/lib/documents/extraction-guard'
import { type CurrencyCode, type DocumentLanguage } from '@/lib/documents/config'
import { getLabels } from '@/lib/documents/labels'
import { buildInvoiceEmail, DOCUMENT_FROM_EMAIL, type InvoiceEmailLineItem as LineItem } from '@/lib/documents/emails'

// One sender for every commercial document: the configured one (risk 79, closed 2026-10-08).
const FROM_EMAIL = DOCUMENT_FROM_EMAIL

export async function POST(request: NextRequest) {
  console.log('[send-invoice] POST called')

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-invoice] RESEND_API_KEY missing')
    return NextResponse.json(
      { error: 'Email not configured', detail: 'RESEND_API_KEY environment variable is missing' },
      { status: 503 }
    )
  }

  // Asks the one resolver rather than re-reading the environment. In evidence
  // mode this is false unless the evidence database is configured, so the route
  // refuses instead of quietly reaching production.
  if (!isDatabaseConfigured()) {
    console.error('[send-invoice] no database this process is allowed to open')
    return NextResponse.json(
      { error: 'Database not configured', detail: 'No database is configured for this process' },
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

    /* The email is built from the lines in this request, not from the stored
       invoice, so the boundary applies here too: a held line is never sent. */
    const admitted = admitLineItems(body.line_items)
    if (admitted.held.length > 0) {
      /* Persistence boundary: a line the provenance guard held, and no person
         resolved, is not stored. See admitLineItems in extraction-guard.ts. */
      return NextResponse.json(
        { error: 'Line items hold content the source does not support', held: admitted.held },
        { status: 422 },
      )
    }
    body.line_items = admitted.items as LineItem[]

    console.log('[send-invoice] to:', toEmails.length, 'recipient(s)')

    /*
     * The number on the email is the stored one, never the request's (risk
     * 63): the server allocates invoice numbers on save, so the only
     * authoritative number is the row's. Stored language is the fallback when
     * the caller did not pass one.
     */
    const sql = getDb()
    const stored = await sql`SELECT invoice_number, language FROM os_invoices WHERE id = ${body.invoice_id}` as { invoice_number: string; language: DocumentLanguage | null }[]
    if (!stored.length) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    const invoice_number = stored[0].invoice_number
    const language: DocumentLanguage = body.language ?? stored[0].language ?? 'de'

    console.log('[send-invoice] 2. Building HTML...')
    const html = buildInvoiceEmail({
      invoice_number,
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
      subject: t.emailSubjectInvoice(invoice_number),
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
