import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendEmail } from '@/lib/email'

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

// Bulk send newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { subject: string; html: string }

    if (!body.subject?.trim() || !body.html?.trim()) {
      return NextResponse.json({ error: 'Subject and body required' }, { status: 400 })
    }

    const sql  = getDb()
    const rows = await sql`
      SELECT email, name FROM os_newsletter WHERE status = 'active'`

    const results = await Promise.allSettled(
      (rows as { email: string; name: string }[]).map(sub =>
        sendEmail({
          to: sub.email,
          from: FROM_EMAIL,
          replyTo: CONTACT_EMAIL,
          subject: body.subject,
          html: body.html,
        })
      )
    )

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ sent, failed, total: rows.length })
  } catch (error) {
    console.error('[/api/os/newsletter POST]', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as { id: string; status: string }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

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
