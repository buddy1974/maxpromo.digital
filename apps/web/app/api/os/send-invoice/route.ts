import { NextRequest, NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { admitLineItems } from '@/lib/documents/extraction-guard'
import { berlinDate } from '@/lib/commercial/money'
import { renderStoredInvoiceEmail } from '@/lib/commercial/capabilities/documents'
import { recipients, sendDocumentDirect } from '@/lib/commercial/direct'
import { outboundTransport } from '@/lib/mail/outbound'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { CapabilityRefusal } from '@/lib/commercial/types'

/**
 * Marcel sends an invoice from /os — an owner direct action (ADR-0021).
 *
 * The screen saves the invoice first and then names it here. The email is the
 * STORED invoice, rendered exactly as the governed `invoice.send` renders it:
 * number, lines, amounts, dates and address come from the record, never from
 * the request (risk 80 closed). The request supplies only the recipients and
 * whether Marcel wants a copy. The send is idempotent and audited.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SENDABLE = ['draft', 'sent', 'overdue']

export async function POST(request: NextRequest) {
  // Documents leave through the mailbox (ADR-0025); evidence mode uses the sink.
  if (!outboundTransport()) {
    return NextResponse.json({ error: 'Email not configured', detail: 'Sending is not connected for this mailbox' }, { status: 503 })
  }

  // Asks the one resolver rather than re-reading the environment. In evidence
  // mode this is false unless the evidence database is configured, so the route
  // refuses instead of quietly reaching production.
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', detail: 'No database is configured for this process' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json() as { invoice_id?: unknown; clientEmails?: unknown; client_email?: string; sendCopyToMarcel?: boolean; resend?: boolean }
    if (typeof body.invoice_id !== 'string' || !UUID.test(body.invoice_id)) {
      return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })
    }

    const sql = getDb()
    let rendered: Awaited<ReturnType<typeof renderStoredInvoiceEmail>>
    try {
      rendered = await renderStoredInvoiceEmail(sql, body.invoice_id, berlinDate(), OWNER_ACTOR)
    } catch (err) {
      if (err instanceof CapabilityRefusal) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      throw err
    }
    const invoice = rendered.row
    if (!SENDABLE.includes(invoice.status)) {
      return NextResponse.json({ error: `An invoice that is ${invoice.status} is not sent again` }, { status: 409 })
    }

    /* The provenance boundary still applies to what was stored: a held line is never sent. */
    const admitted = admitLineItems(invoice.line_items ?? [])
    if (admitted.held.length > 0) {
      return NextResponse.json({ error: 'Line items hold content the source does not support', held: admitted.held }, { status: 422 })
    }

    const to = recipients(body.clientEmails, body.client_email ?? invoice.client_email)
    if (!to) return NextResponse.json({ error: 'invoice_id and at least one usable email required' }, { status: 400 })

    const sent = await sendDocumentDirect(sql, {
      operation: 'invoice.send.direct', entityType: 'invoice', entityId: invoice.id, to,
      mail: rendered.mail, entity: invoice.client_id ? { kind: 'client', id: invoice.client_id } : null, resend: body.resend === true,
    })
    if (!sent.ok) {
      console.error('[send-invoice] not sent', sent.uncertain ? 'uncertain' : sent.busy ? 'busy' : 'refused')
      return NextResponse.json({ error: sent.uncertain ? 'Delivery uncertain' : 'Email send failed', detail: sent.error, uncertain: !!sent.uncertain },
        { status: sent.busy ? 409 : sent.uncertain ? 202 : 502 })
    }

    await sql`
      UPDATE os_invoices SET status = 'sent', sent_at = NOW()
      WHERE id = ${invoice.id} AND status IN ('draft', 'sent')`

    return NextResponse.json({ success: true, id: sent.id })
  } catch (error) {
    console.error('[send-invoice] ERROR:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 })
  }
}
