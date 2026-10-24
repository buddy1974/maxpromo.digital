import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { renderDraft, type DraftRow } from '@/lib/mail/outbound'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const headers = { 'Cache-Control': 'private, no-store' }

/** The exact HTML and text a draft renders to — the same function that sends it. Rendered on
 * the server so the letterhead identity never enters a public JavaScript chunk. */
export const GET = withAuth(async (req, { session }) => {
  if (session.sub !== 'marcel') return NextResponse.json({ error: 'Owner access required' }, { status: 403, headers })
  const id = req.nextUrl.searchParams.get('draft') ?? ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid draft' }, { status: 400, headers })
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM mail.drafts WHERE id=${id}::uuid AND created_by=${`os:${session.sub}`}` as DraftRow[]
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
    const { rendered } = await renderDraft(sql, rows[0])
    return NextResponse.json({ html: rendered.html, text: rendered.text }, { headers })
  } catch {
    return NextResponse.json({ error: 'Preview unavailable' }, { status: 503, headers })
  }
})
