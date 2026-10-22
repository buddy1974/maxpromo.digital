import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import type { Sql } from '@/lib/commercial/types'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const headers = { 'Cache-Control': 'private, no-store' }
interface Link { thread_id: string; entity_kind: string; entity_id: string; match_status: string; label: string | null }
async function businessLinks(sql: Sql, ids: string[]): Promise<Link[]> {
  if (!ids.length) return []
  return await sql`SELECT b.*,coalesce(l.company,l.name,c.name,j.title) AS label FROM mail.business_links b
    LEFT JOIN os_leads l ON b.entity_kind='lead' AND l.id::text=b.entity_id
    LEFT JOIN os_clients c ON b.entity_kind='client' AND c.id::text=b.entity_id
    LEFT JOIN os_jobs j ON b.entity_kind='project' AND j.id::text=b.entity_id
    WHERE b.thread_id=ANY(${ids}::uuid[])` as Link[]
}
const businessLabel = (links: Link[]) => links.map(link => `${link.match_status === 'possible' ? 'Possible match: ' : ''}${link.label ?? link.entity_kind}`).join(' · ')

export const GET = withAuth(async (req, { session }) => {
  if (session.sub !== 'marcel') return NextResponse.json({ error: 'Owner access required' }, { status: 403, headers })
  try {
    const sql = getDb()
    const installed = await sql`SELECT to_regclass('mail.accounts') IS NOT NULL AS ready`
    if (!installed[0]?.ready) return NextResponse.json({ configured: false, threads: [] }, { headers })
    const thread = req.nextUrl.searchParams.get('thread')
    if (thread && !UUID.test(thread)) return NextResponse.json({ error: 'Invalid thread' }, { status: 400, headers })
    const query = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 200)
    if (thread) {
      const rows = await sql`SELECT t.*,EXISTS(SELECT 1 FROM mail.messages WHERE thread_id=t.id AND NOT is_read) AS unread
        FROM mail.threads t WHERE id=${thread}::uuid`
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
      const messages = await sql`SELECT id,sender,recipients,cc,subject,body_text,preview_text,body_state,event_at,email_date,received_at,is_read,attachments
        FROM mail.messages WHERE thread_id=${thread}::uuid ORDER BY received_at LIMIT 200`
      const links = await businessLinks(sql, [thread])
      return NextResponse.json({ thread: { ...rows[0], business_label: businessLabel(links) }, messages, links }, { headers })
    }
    const threads = await sql`SELECT t.*,
      (SELECT entity_kind FROM mail.business_links WHERE thread_id=t.id AND match_status='owner_confirmed' ORDER BY entity_kind LIMIT 1) AS business_kind,
      (SELECT sender FROM mail.messages WHERE thread_id=t.id ORDER BY received_at DESC LIMIT 1) AS sender,
      EXISTS(SELECT 1 FROM mail.messages WHERE thread_id=t.id AND NOT is_read) AS unread
      FROM mail.threads t WHERE (${query}='' OR EXISTS(
        SELECT 1 FROM mail.messages m WHERE m.thread_id=t.id AND
        (strpos(lower(m.subject),lower(${query}))>0 OR strpos(lower(m.sender),lower(${query}))>0 OR strpos(lower(m.body_text),lower(${query}))>0)))
      ORDER BY t.updated_at DESC LIMIT 100`
    const accounts = await sql`SELECT id FROM mail.accounts WHERE enabled LIMIT 1`
    const links = await businessLinks(sql, threads.map(t => t.id as string))
    return NextResponse.json({ configured: accounts.length > 0, threads: threads.map(t => ({ ...t, business_label: businessLabel(links.filter(link => link.thread_id === t.id)) })) }, { headers })
  } catch {
    // Never log mail bodies, SQL parameters, database URL or provider error text.
    return NextResponse.json({ error: 'Inbox unavailable' }, { status: 503, headers })
  }
})
