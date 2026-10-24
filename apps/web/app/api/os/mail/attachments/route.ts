import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { CapabilityRefusal } from '@/lib/commercial/types'
import { renderStoredDocumentPdf } from '@/lib/commercial/capabilities/documents'
import { OWNER_HEADERS, ownerReply, readOwnerJson } from '@/lib/owner-request'
import { addDraftAttachment, listDraftAttachments, MAX_ATTACHMENT_BYTES, removeDraftAttachment } from '@/lib/mail/draftAttachments'

/**
 * Files on an email Marcel is writing (migration 0020). Owner only, same origin.
 *
 *   GET    ?draft=<id>                      the draft's files (metadata only)
 *   POST   multipart: draft_id, file         attach an uploaded file (≤ 4 MB, sniffed type)
 *   POST   JSON: { draft_id, document: { kind: 'invoice' | 'angebot', id } }
 *                                            attach the stored quotation/invoice as its PDF
 *   DELETE ?draft=<id>&id=<attachment id>    remove a file
 *
 * Every change bumps the draft revision: a confirmation shown before it can no longer send.
 */
export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const actorOf = (sub: string) => `os:${sub}`

function sameOrigin(request: NextRequest): boolean {
  return request.headers.get('origin') === new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'cross-site'
}

const refusal = (error: unknown) => error instanceof CapabilityRefusal
  ? ownerReply(error.message, error.code === 'conflict' ? 409 : error.code === 'not_found' ? 404 : 422)
  : ownerReply('Attachment unavailable', 503)

export const GET = withAuth(async (request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  const draft = new URL(request.url).searchParams.get('draft')
  if (!draft || !UUID.test(draft)) return ownerReply('Invalid draft', 400)
  const sql = getDb()
  const owned = await sql`SELECT 1 FROM mail.drafts WHERE id=${draft}::uuid AND created_by=${actorOf(session.sub)}` as unknown[]
  if (!owned.length) return ownerReply('Draft not found', 404)
  return NextResponse.json({ attachments: await listDraftAttachments(sql, draft) }, { headers: OWNER_HEADERS })
})

export const POST = withAuth(async (request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (!sameOrigin(request)) return ownerReply('Invalid origin', 403)
  const type = request.headers.get('content-type')?.split(';')[0].trim()
  const sql = getDb()
  try {
    if (type === 'application/json') {
      const read = await readOwnerJson(request, session, 2048)
      if (!read.ok) return read.response
      const { draft_id, document } = read.body as { draft_id?: unknown; document?: { kind?: unknown; id?: unknown } }
      if (typeof draft_id !== 'string' || !UUID.test(draft_id) || !document || (document.kind !== 'invoice' && document.kind !== 'angebot') || typeof document.id !== 'string' || !UUID.test(document.id)) return ownerReply('Invalid body', 400)
      const pdf = await renderStoredDocumentPdf(sql, document.kind, document.id, berlinDate())
      const att = await addDraftAttachment(sql, { draftId: draft_id, actor: actorOf(session.sub), filename: pdf.filename, bytes: pdf.bytes, source: document.kind, sourceId: document.id })
      return NextResponse.json({ attachment: att }, { headers: OWNER_HEADERS })
    }
    if (type !== 'multipart/form-data') return ownerReply('Multipart or JSON required', 415)
    // Form overhead included; the platform refuses bodies over 4.5 MB before this runs anyway.
    if (Number(request.headers.get('content-length') ?? 0) > MAX_ATTACHMENT_BYTES + 64 * 1024) return ownerReply('Files can be at most 4 MB.', 413)
    const form = await request.formData()
    const draft = form.get('draft_id'), file = form.get('file')
    if (typeof draft !== 'string' || !UUID.test(draft) || !(file instanceof File)) return ownerReply('Invalid upload', 400)
    if (file.size > MAX_ATTACHMENT_BYTES) return ownerReply('Files can be at most 4 MB.', 413)
    const att = await addDraftAttachment(sql, { draftId: draft, actor: actorOf(session.sub), filename: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })
    return NextResponse.json({ attachment: att }, { headers: OWNER_HEADERS })
  } catch (error) {
    return refusal(error)
  }
})

export const DELETE = withAuth(async (request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (!sameOrigin(request)) return ownerReply('Invalid origin', 403)
  const params = new URL(request.url).searchParams
  const draft = params.get('draft'), id = params.get('id')
  if (!draft || !UUID.test(draft) || !id || !UUID.test(id)) return ownerReply('Invalid request', 400)
  try {
    const removed = await removeDraftAttachment(getDb(), draft, id, actorOf(session.sub))
    return removed ? NextResponse.json({ removed: true }, { headers: OWNER_HEADERS }) : ownerReply('Attachment not found', 404)
  } catch (error) {
    return refusal(error)
  }
})
