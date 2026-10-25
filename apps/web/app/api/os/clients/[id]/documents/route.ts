import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { CapabilityRefusal } from '@/lib/commercial/types'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { addClientDocument, listClientDocuments, MAX_CLIENT_DOCUMENT_BYTES, readClientDocument, removeClientDocument } from '@/lib/clients/documents'

/**
 * Documents kept on a client (lib/clients/documents). Owner only, same origin.
 *
 *   GET    /api/os/clients/<id>/documents              metadata list
 *   GET    /api/os/clients/<id>/documents?file=<id>    download (attachment; images may be shown inline)
 *   POST   multipart: file, label?                     add (≤ 4 MB, type decided by the bytes)
 *   DELETE ?file=<id>                                   remove the file (the timeline keeps the record)
 */
export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const sameOrigin = (r: NextRequest) => r.headers.get('origin') === new URL(r.url).origin && r.headers.get('sec-fetch-site') !== 'cross-site'
const refusal = (e: unknown) => e instanceof CapabilityRefusal ? ownerReply(e.message, e.code === 'not_found' ? 404 : 422) : ownerReply('Documents unavailable', 503)

type P = { id: string }

export const GET = withAuth<P>(async (request, { session, params }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (!UUID.test(params.id)) return ownerReply('Invalid client', 400)
  const sql = getDb()
  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  try {
    if (!file) return NextResponse.json({ documents: await listClientDocuments(sql, params.id) }, { headers: OWNER_HEADERS })
    if (!UUID.test(file)) return ownerReply('Invalid file', 400)
    const doc = await readClientDocument(sql, params.id, file)
    if (!doc) return ownerReply('Document not found', 404)
    const inline = url.searchParams.get('inline') === '1' && /^image\/(png|jpeg|webp|gif)$/.test(doc.mime_type)
    const disposition = `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(doc.filename)}`
    return new NextResponse(Buffer.from(doc.content), {
      headers: {
        'Content-Type': doc.mime_type,
        'Content-Disposition': disposition,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; sandbox",
        ...OWNER_HEADERS,
      },
    })
  } catch (e) { return refusal(e) }
})

export const POST = withAuth<P>(async (request, { session, params }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (!sameOrigin(request)) return ownerReply('Invalid origin', 403)
  if (!UUID.test(params.id)) return ownerReply('Invalid client', 400)
  if (!(request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return ownerReply('Multipart required', 415)
  if (Number(request.headers.get('content-length') ?? 0) > MAX_CLIENT_DOCUMENT_BYTES + 64 * 1024) return ownerReply('Files can be at most 4 MB.', 413)
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return ownerReply('file required', 400)
    if (file.size > MAX_CLIENT_DOCUMENT_BYTES) return ownerReply('Files can be at most 4 MB.', 413)
    const rawLabel = form.get('label')
    const result = await addClientDocument(getDb(), { clientId: params.id, actor: `os:${session.sub}`, filename: file.name, bytes: new Uint8Array(await file.arrayBuffer()), label: typeof rawLabel === 'string' ? rawLabel : null })
    return NextResponse.json(result, { headers: OWNER_HEADERS })
  } catch (e) { return refusal(e) }
})

export const DELETE = withAuth<P>(async (request, { session, params }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (!sameOrigin(request)) return ownerReply('Invalid origin', 403)
  const file = new URL(request.url).searchParams.get('file')
  if (!UUID.test(params.id) || !file || !UUID.test(file)) return ownerReply('Invalid request', 400)
  try {
    const removed = await removeClientDocument(getDb(), { clientId: params.id, fileId: file, actor: `os:${session.sub}` })
    return removed ? NextResponse.json({ removed: true }, { headers: OWNER_HEADERS }) : ownerReply('Document not found', 404)
  } catch (e) { return refusal(e) }
})
