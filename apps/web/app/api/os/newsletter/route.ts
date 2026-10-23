import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { writeAudit } from '@/lib/commercial/audit'
import { sha256Hex } from '@/lib/commercial/signing'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { DIRECT_CHANNEL } from '@/lib/commercial/direct'

const FROM_EMAIL    = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const CONTACT_EMAIL = process.env.CONTACT_EMAIL     ?? 'info@maxpromo.digital'

export async function GET() {
  try {
    const sql  = getDb()
    const rows = await sql`
      SELECT * FROM os_newsletter ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[/api/os/newsletter GET]', error)
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

/**
 * Bulk send — an owner direct action (ADR-0021). Each recipient's email
 * carries a key derived from the campaign content and the address, so a
 * double click or a retried request delivers once per subscriber. The
 * broadcast is one os_audit row with honest counts: the transport reports a
 * refused delivery as success:false, not as a thrown error.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { subject?: unknown; html?: unknown }
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const html = typeof body.html === 'string' ? body.html : ''
    if (!subject || !html.trim() || subject.length > 300 || html.length > 200_000) {
      return NextResponse.json({ error: 'Subject and body required' }, { status: 400 })
    }

    const sql  = getDb()
    const rows = await sql`
      SELECT email, name FROM os_newsletter WHERE status = 'active'` as { email: string; name: string }[]
    const campaign = sha256Hex(`${subject}\n${html}`).slice(0, 24)

    const results = await Promise.allSettled(
      rows.map(sub =>
        sendEmail({
          to: sub.email,
          from: FROM_EMAIL,
          replyTo: CONTACT_EMAIL,
          subject,
          html,
          idempotencyKey: `newsletter:${campaign}:${sha256Hex(sub.email.toLowerCase()).slice(0, 24)}`,
        })
      )
    )

    const sent   = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = rows.length - sent

    await writeAudit(sql, {
      actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, operation: 'newsletter.broadcast', entityType: 'newsletter', entityId: campaign,
      after: { recipients: rows.length, sent, failed }, outcome: failed === 0 ? 'succeeded' : sent === 0 ? 'failed' : 'uncertain',
      error: failed ? `${failed} of ${rows.length} deliveries not accepted` : undefined,
    })

    return NextResponse.json({ sent, failed, total: rows.length })
  } catch (error) {
    console.error('[/api/os/newsletter POST]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as { id: string; status: string }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    if (!['active', 'unsubscribed'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    const rows = await sql`
      UPDATE os_newsletter SET status = ${body.status}
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/newsletter PATCH]', error)
    return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 })
  }
}
