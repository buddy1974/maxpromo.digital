import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { attachmentPolicy, contentDisposition } from '@/lib/mail/attachments'
import { attachmentReader } from '@/lib/mail/attachments.server'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const deny = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store' } })

/**
 * One attachment, on Marcel's explicit click (ADR-0023). Bytes come only from the provider's own
 * API host (fixed URL, Bearer token, no redirects), stream through with a hard size cap and are
 * served as a download — never rendered by the browser, never stored, never given to a model.
 */
export const GET = withAuth(async (req, { session }) => {
  if (session.sub !== 'marcel') return deny('Owner access required', 403)
  // A download link is a GET; refuse it when another site embeds or triggers it.
  if (req.headers.get('sec-fetch-site') === 'cross-site') return deny('Invalid origin', 403)
  const message = req.nextUrl.searchParams.get('message') ?? ''
  const attachment = req.nextUrl.searchParams.get('attachment') ?? ''
  if (!UUID.test(message) || !/^[A-Za-z0-9_=-]{1,512}$/.test(attachment)) return deny('Invalid request', 400)
  try {
    const sql = getDb()
    const rows = await sql`SELECT m.id,m.thread_id,m.attachments,m.provider_folder,m.provider_uid,m.provider_state,m.risk_signals,t.quarantine
      FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id WHERE m.id=${message}::uuid AND m.direction='inbound'` as
      { id: string; thread_id: string; attachments: { id: string; filename: string; size: number }[]; provider_folder: string | null; provider_uid: string | number | null; provider_state: string; risk_signals: string[]; quarantine: string | null }[]
    const m = rows[0]
    if (!m) return deny('Not found', 404)
    const meta = (m.attachments ?? []).find(a => a.id === attachment)
    if (!meta) return deny('Not found', 404)
    const policy = attachmentPolicy({ filename: meta.filename, size: meta.size, quarantined: Boolean(m.quarantine), located: Boolean(m.provider_folder && m.provider_uid) && ['inbox', 'other'].includes(m.provider_state) })
    if (!policy.allowed) return deny(policy.reason, 409)
    const reader = attachmentReader()
    if (!reader) return deny('Mailbox API not connected', 503)
    const stream = await reader.attachment({ folder: m.provider_folder!, uid: Number(m.provider_uid) }, attachment, policy.maxBytes)
    await sql`INSERT INTO mail.action_audit(thread_id,action,status,payload) VALUES(${m.thread_id}::uuid,'attachment_download','done',
      ${JSON.stringify({ actor: `os:${session.sub}`, message_id: m.id, size: meta.size, type: policy.contentType })}::jsonb)`
    return new NextResponse(stream, { headers: {
      'Content-Type': policy.contentType,
      'Content-Disposition': contentDisposition(meta.filename),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    } })
  } catch {
    return deny('Attachment unavailable', 502)
  }
})
