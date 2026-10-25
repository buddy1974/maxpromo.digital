import { NextResponse, type NextRequest } from 'next/server'
import { resolveRoute, logAiFailure } from '@maxpromo/ai'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { safeFilename } from '@/lib/mail/draftAttachments'
import { ExtractRefusal, MAX_EXTRACT_BYTES, extractClientCandidate } from '@/lib/clients/extract'
import { findClientMatches } from '@/lib/clients/match'

/**
 * POST /api/os/ai/scan-client — a client CANDIDATE from a document, photo, screenshot, business
 * card, PDF or pasted text (lib/clients/extract), plus the existing clients it could be
 * (lib/clients/match). Saves nothing: the screen shows the candidate in the client form and
 * Marcel saves through client.create.
 *
 *   multipart/form-data  file=<PDF|JPEG|PNG|WebP|GIF ≤ 4 MB>
 *   application/json     { text: "…" }
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 90

const NO_STORE = { 'Cache-Control': 'no-store' }
const sameOrigin = (r: NextRequest) => r.headers.get('origin') === new URL(r.url).origin && r.headers.get('sec-fetch-site') !== 'cross-site'

export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (session.sub !== 'marcel') return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  const limited = enforceRateLimit(request, { scope: 'client-extract', limit: 30, windowMs: 10 * 60_000 })
  if (limited) return limited
  if (!resolveRoute()) return NextResponse.json({ error: 'AI not configured', code: 'ai_unavailable' }, { status: 503, headers: NO_STORE })
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_EXTRACT_BYTES + 64 * 1024) return NextResponse.json({ error: 'The file is larger than 4 MB.', code: 'too_large' }, { status: 413, headers: NO_STORE })
  try {
    let candidate
    if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      if (!(file instanceof File)) return NextResponse.json({ error: 'file required', code: 'empty' }, { status: 400, headers: NO_STORE })
      const filename = safeFilename(file.name || 'upload.jpg') ?? 'upload.jpg'
      if (file.size > MAX_EXTRACT_BYTES) return NextResponse.json({ error: 'The file is larger than 4 MB.', code: 'too_large' }, { status: 413, headers: NO_STORE })
      candidate = await extractClientCandidate({ filename, bytes: new Uint8Array(await file.arrayBuffer()) })
    } else {
      const body = await request.json().catch(() => null) as { text?: unknown } | null
      if (!body || typeof body.text !== 'string') return NextResponse.json({ error: 'text or file required', code: 'empty' }, { status: 400, headers: NO_STORE })
      candidate = await extractClientCandidate({ text: body.text })
    }
    const f = candidate.fields
    const matches = await findClientMatches(getDb(), { name: f.name, company: f.company, email: f.email, phone: f.phone, website: f.website, city: f.city, postcode: f.postcode })
    return NextResponse.json({ candidate, matches }, { headers: NO_STORE })
  } catch (error) {
    if (error instanceof ExtractRefusal) {
      if (error.code === 'ai_failed' || error.code === 'ai_unavailable') {
        logAiFailure('/api/os/ai/scan-client', { klass: error.code === 'ai_unavailable' ? 'CONFIGURATION' : 'PROVIDER', status: 502, logDetail: error.message })
        return NextResponse.json({ error: 'Extraction failed', code: error.code }, { status: 502, headers: NO_STORE })
      }
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === 'too_large' ? 413 : 415, headers: NO_STORE })
    }
    console.error('[/api/os/ai/scan-client]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Extraction failed', code: 'ai_failed' }, { status: 500, headers: NO_STORE })
  }
})
