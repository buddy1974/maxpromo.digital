import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { safeFilename } from '@/lib/mail/draftAttachments'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { capture, history, MAX_FILE_BYTES } from '@/lib/max/max'
import { parseEnvelope } from '@/lib/max/context'
import { transcriptionProvider } from '@/lib/audio/transcribe'

/**
 * /api/os/max — Universal Max (ADR-0029). Owner session, same origin.
 *
 *   GET   recent interactions with their proposals and results, and which voice input is available
 *   POST  multipart/form-data: text, input_kind (text|voice|file), locale, context (JSON envelope),
 *         file (optional, ≤ 4 MB). Returns an answer, a clarifying question, or proposals.
 *         NOTHING EXECUTES HERE — proposals run only through /api/os/max/proposals.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const sameOrigin = (r: NextRequest) => r.headers.get('origin') === new URL(r.url).origin && r.headers.get('sec-fetch-site') !== 'cross-site'

export const GET = withAuth(async (_request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  try {
    return NextResponse.json({ history: await history(getDb(), `os:${session.sub}`), voice: transcriptionProvider() ? 'server' : 'browser' }, { headers: OWNER_HEADERS })
  } catch (e) {
    console.error('[os/max] history', e instanceof Error ? e.message : e)
    return ownerReply('Max is unavailable', 503)
  }
})

export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (!sameOrigin(request)) return ownerReply('Invalid origin', 403)
  const limited = enforceRateLimit(request, { scope: 'os-max', limit: 60, windowMs: 10 * 60_000 })
  if (limited) return limited
  if (!(request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return ownerReply('multipart/form-data required', 415)
  if (Number(request.headers.get('content-length') ?? 0) > MAX_FILE_BYTES + 64 * 1024) return ownerReply('The file is larger than 4 MB.', 413)
  let form: FormData
  try { form = await request.formData() } catch { return ownerReply('Invalid form', 400) }
  const allowed = new Set(['text', 'input_kind', 'locale', 'context', 'file'])
  for (const key of form.keys()) if (!allowed.has(key)) return ownerReply('Unexpected field', 400)
  const text = typeof form.get('text') === 'string' ? String(form.get('text')) : ''
  if (text.length > 4000) return ownerReply('At most 4000 characters', 400)
  const kind = form.get('input_kind')
  const inputKind = kind === 'voice' || kind === 'file' ? kind : 'text'
  const locale = form.get('locale') === 'en' ? 'en' : 'de'
  let envelope
  try { envelope = parseEnvelope(JSON.parse(typeof form.get('context') === 'string' ? String(form.get('context')) : '{}')) } catch { return ownerReply('Invalid context', 400) }
  const upload = form.get('file')
  let file: { filename: string; bytes: Uint8Array } | null = null
  if (upload instanceof File && upload.size > 0) {
    if (upload.size > MAX_FILE_BYTES) return ownerReply('The file is larger than 4 MB.', 413)
    file = { filename: safeFilename(upload.name || 'upload.jpg') ?? 'upload.jpg', bytes: new Uint8Array(await upload.arrayBuffer()) }
  }
  if (!text.trim() && !file) return ownerReply('Say or attach something', 400)
  try {
    const result = await capture(getDb(), { actor: `os:${session.sub}`, text, inputKind: file && !text.trim() ? 'file' : inputKind, file, envelope, screenLanguage: locale })
    return NextResponse.json(result, { headers: OWNER_HEADERS })
  } catch (e) {
    console.error('[os/max] capture', e instanceof Error ? e.message : e)
    return ownerReply('Max is unavailable. Nothing was changed.', 503)
  }
})
