import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { hostingerStateReader } from '@/lib/mail/providerState'
import { scheduleProviderCheck } from '@/lib/mail/providerSchedule'
import { outboundTransport } from '@/lib/mail/outbound'
import { conversationState, threadContext } from '@/lib/mail/context'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const headers = { 'Cache-Control': 'private, no-store' }
/** Whether the provider's spam folder can be read (owner-connected Hostinger REST API). */
const providerCheck = () => hostingerStateReader() !== null

export const GET = withAuth(async (req, { session }) => {
  if (session.sub !== 'marcel') return NextResponse.json({ error: 'Owner access required' }, { status: 403, headers })
  try {
    const sql = getDb()
    const installed = await sql`SELECT to_regclass('mail.accounts') IS NOT NULL AS ready, to_regclass('mail.drafts') IS NOT NULL AS workspace`
    if (!installed[0]?.ready) return NextResponse.json({ configured: false, threads: [] }, { headers })
    const workspace = installed[0].workspace === true
    const today = berlinDate()
    const thread = req.nextUrl.searchParams.get('thread')
    if (thread && !UUID.test(thread)) return NextResponse.json({ error: 'Invalid thread' }, { status: 400, headers })
    const query = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 200)
    const sending = outboundTransport() !== null
    if (thread) {
      const rows = await sql`SELECT t.*,t.follow_up_on::text AS follow_up_on,EXISTS(SELECT 1 FROM mail.messages WHERE thread_id=t.id AND NOT is_read) AS unread
        FROM mail.threads t WHERE id=${thread}::uuid`
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
      const messages = await sql`SELECT id,sender,recipients,cc,subject,body_text,preview_text,body_state,event_at,email_date,received_at,is_read,attachments,
        provider_state,provider_folder,risk_signals,direction,content_attempts,delivery_state,delivery_detail
        FROM mail.messages WHERE thread_id=${thread}::uuid ORDER BY received_at LIMIT 200`
      const context = rows[0].quarantine ? null : await threadContext(sql, thread, today)
      const drafts = workspace ? await sql`SELECT id,mode,source_message_id,to_addrs,cc_addrs,bcc_addrs,subject,body,family,language,entity_kind,entity_id,follow_up_days,revision,updated_at
        FROM mail.drafts WHERE thread_id=${thread}::uuid AND status='draft' AND created_by='os:marcel' ORDER BY updated_at DESC LIMIT 1` : []
      // A confirmed "send later" on this conversation, and a scheduled send that did not go (0023).
      const scheduled = workspace ? await sql`SELECT id,scheduled_for FROM mail.drafts WHERE thread_id=${thread}::uuid AND status='scheduled' AND created_by='os:marcel' ORDER BY scheduled_for LIMIT 1`.catch(() => []) as { id: string; scheduled_for: string }[] : []
      const failedSchedule = workspace ? await sql`SELECT schedule_error FROM mail.drafts WHERE thread_id=${thread}::uuid AND status='draft' AND schedule_error IS NOT NULL AND created_by='os:marcel' ORDER BY updated_at DESC LIMIT 1`.catch(() => []) as { schedule_error: string }[] : []
      // Full text for this conversation's previews is fetched after this response.
      if (!rows[0].quarantine) scheduleProviderCheck('thread', thread)
      return NextResponse.json({ thread: rows[0], messages, context, draft: drafts[0] ?? null, scheduled: scheduled[0] ?? null, scheduleError: failedSchedule[0]?.schedule_error ?? null, providerCheck: providerCheck(), sending }, { headers })
    }
    const threads = await sql`SELECT t.id,t.subject,t.classification,t.needs_reply,t.waiting,t.archived,t.trashed,t.trashed_at,t.updated_at,t.quarantine,t.owner_verdict,
      t.follow_up_on::text AS follow_up_on,t.next_action,
      (SELECT entity_kind FROM mail.business_links WHERE thread_id=t.id AND match_status='owner_confirmed' ORDER BY entity_kind LIMIT 1) AS business_kind,
      (SELECT coalesce(l.company,l.name,c.company,c.name,j.title) FROM mail.business_links b
         LEFT JOIN os_leads l ON b.entity_kind='lead' AND l.id::text=b.entity_id
         LEFT JOIN os_clients c ON b.entity_kind='client' AND c.id::text=b.entity_id
         LEFT JOIN os_jobs j ON b.entity_kind='project' AND j.id::text=b.entity_id
       WHERE b.thread_id=t.id ORDER BY (b.match_status='owner_confirmed') DESC, b.entity_kind LIMIT 1) AS business_label,
      CASE WHEN NOT EXISTS(SELECT 1 FROM mail.business_links WHERE thread_id=t.id AND match_status='owner_confirmed')
        THEN (SELECT entity_kind FROM mail.business_links WHERE thread_id=t.id AND match_status='possible' ORDER BY (entity_kind='client') DESC LIMIT 1) END AS possible_kind,
      (SELECT CASE WHEN direction='outbound' THEN recipients->>0 ELSE sender END FROM mail.messages WHERE thread_id=t.id ORDER BY received_at DESC LIMIT 1) AS sender,
      (SELECT direction FROM mail.messages WHERE thread_id=t.id ORDER BY received_at DESC LIMIT 1) AS last_direction,
      (SELECT left(CASE WHEN body_state='preview' THEN preview_text ELSE body_text END,200) FROM mail.messages WHERE thread_id=t.id ORDER BY received_at DESC LIMIT 1) AS preview,
      (SELECT max(received_at) FROM mail.messages WHERE thread_id=t.id AND direction='inbound') AS last_inbound,
      (SELECT max(received_at) FROM mail.messages WHERE thread_id=t.id AND direction='outbound') AS last_outbound,
      (SELECT count(*)::int FROM mail.messages WHERE thread_id=t.id) AS message_count,
      EXISTS(SELECT 1 FROM mail.messages WHERE thread_id=t.id AND NOT is_read) AS unread,
      EXISTS(SELECT 1 FROM mail.messages WHERE thread_id=t.id AND jsonb_array_length(attachments)>0) AS has_attachments,
      ${workspace} AND EXISTS(SELECT 1 FROM mail.drafts d WHERE d.thread_id=t.id AND d.status='draft') AS has_draft,
      (SELECT provider_state FROM mail.messages WHERE thread_id=t.id ORDER BY received_at DESC LIMIT 1) AS provider_state
      FROM mail.threads t WHERE (t.trashed=false OR t.trashed_at > now() - interval '180 days') AND (${query}='' OR strpos(lower(t.subject),lower(${query}))>0 OR EXISTS(
        SELECT 1 FROM mail.messages m WHERE m.thread_id=t.id AND
        (strpos(lower(m.subject),lower(${query}))>0 OR strpos(lower(m.sender),lower(${query}))>0 OR strpos(lower(m.recipients::text),lower(${query}))>0
         OR strpos(lower(m.body_text),lower(${query}))>0 OR strpos(lower(m.preview_text),lower(${query}))>0)))
      ORDER BY t.trashed, t.updated_at DESC LIMIT 300`
    /* New emails Marcel started (no conversation yet): the Drafts view lists them so they can be
       reopened, edited and sent; a scheduled one shows when it goes and can be taken back. */
    const drafts = workspace ? await sql`SELECT id,mode,source_message_id,to_addrs,cc_addrs,bcc_addrs,subject,body,family,language,entity_kind,entity_id,follow_up_days,revision,updated_at,status,scheduled_for
      FROM mail.drafts WHERE thread_id IS NULL AND status IN ('draft','scheduled') AND created_by=${`os:${session.sub}`}
      ORDER BY updated_at DESC LIMIT 50`.catch(() => []) : []
    const accounts = await sql`SELECT id FROM mail.accounts WHERE enabled LIMIT 1`
    // Unverified provider state is checked after this response; the next load shows it.
    scheduleProviderCheck('inbox')
    const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null)
    return NextResponse.json({
      configured: accounts.length > 0, providerCheck: providerCheck(), sending, today, drafts,
      threads: threads.map(t => {
        const lastInbound = iso(t.last_inbound), lastOutbound = iso(t.last_outbound)
        return { ...t, last_inbound: lastInbound, last_outbound: lastOutbound, state: conversationState(t as never, lastInbound, lastOutbound, today) }
      }),
    }, { headers })
  } catch {
    // Never log mail bodies, SQL parameters, database URL or provider error text.
    return NextResponse.json({ error: 'Inbox unavailable' }, { status: 503, headers })
  }
})
