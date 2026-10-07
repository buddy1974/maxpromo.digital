import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { getLabels } from '@/lib/documents/labels'
import { buildAngebotEmail, type AngebotRow } from '@/lib/documents/emails'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'MAXPROMO DIGITAL <info@maxpromo.digital>'

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email not configured', detail: 'RESEND_API_KEY environment variable is missing' },
      { status: 503 },
    )
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
