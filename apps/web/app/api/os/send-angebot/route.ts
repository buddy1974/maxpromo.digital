import { NextRequest, NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { renderStoredAngebotEmail } from '@/lib/commercial/capabilities/documents'
import { recipients, sendDocumentDirect } from '@/lib/commercial/direct'
import { outboundTransport } from '@/lib/mail/outbound'
import { CapabilityRefusal } from '@/lib/commercial/types'

/**
 * Marcel sends an Angebot from /os — an owner direct action (ADR-0021).
 * The email is the stored Angebot rendered exactly as the governed
 * `proposal.send` renders it; the send is idempotent and audited.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  // Documents leave through the mailbox (ADR-0025); evidence mode uses the sink.
  if (!outboundTransport()) {
    return NextResponse.json({ error: 'Email not configured', detail: 'Sending is not connected for this mailbox' }, { status: 503 })
  }

  // One resolver, asked rather than re-derived. Under evidence mode this is
  // false unless the evidence database is configured.
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', detail: 'No database is configured for this process' },
      { status: 503 },
    )
  }

  try {
    const body = await request.json() as { angebot_id?: unknown; sendCopyToMarcel?: boolean; clientEmails?: unknown; resend?: boolean }
    if (typeof body.angebot_id !== 'string' || !UUID.test(body.angebot_id)) {
      return NextResponse.json({ error: 'angebot_id required' }, { status: 400 })
    }

    const sql = getDb()
    let rendered: Awaited<ReturnType<typeof renderStoredAngebotEmail>>
    try {
      rendered = await renderStoredAngebotEmail(sql, body.angebot_id)
    } catch (err) {
      if (err instanceof CapabilityRefusal) return NextResponse.json({ error: 'Angebot not found' }, { status: 404 })
      throw err
    }
    const angebot = rendered.row
    const to = recipients(body.clientEmails, angebot.client_email)
    if (!to) return NextResponse.json({ error: 'No usable client email on this Angebot' }, { status: 400 })

    const sent = await sendDocumentDirect(sql, {
      operation: 'proposal.send.direct', entityType: 'angebot', entityId: angebot.id, to,
      mail: rendered.mail, entity: angebot.client_id ? { kind: 'client', id: angebot.client_id } : angebot.lead_id ? { kind: 'lead', id: angebot.lead_id } : null,
      resend: body.resend === true,
    })
    if (!sent.ok) {
      return NextResponse.json({ error: sent.uncertain ? 'Delivery uncertain' : 'Email send failed', detail: sent.error, uncertain: !!sent.uncertain },
        { status: sent.busy ? 409 : sent.uncertain ? 202 : 502 })
    }

    await sql`
      UPDATE os_angebote
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${angebot.id} AND status IN ('draft', 'sent')`

    return NextResponse.json({ success: true, id: sent.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/send-angebot]', msg)
    return NextResponse.json({ error: 'Failed to send angebot' }, { status: 500 })
  }
}
