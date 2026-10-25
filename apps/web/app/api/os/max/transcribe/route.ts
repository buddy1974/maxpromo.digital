import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { MAX_AUDIO_BYTES, TranscriptionUnavailable, audioTypeOk, transcribe } from '@/lib/audio/transcribe'

/**
 * POST /api/os/max/transcribe — audio.transcribe() for the Max composer (ADR-0029).
 * multipart/form-data: audio (≤ 4 MB), language (de|en). Returns { text } for Marcel to read and
 * edit; nothing is executed from audio and the audio is never stored. 503 { code: 'unavailable' }
 * when no transcription provider is configured — the composer then offers the browser's own
 * speech recognition, or typing.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return ownerReply('Invalid origin', 403)
  const limited = enforceRateLimit(request, { scope: 'os-max-voice', limit: 40, windowMs: 10 * 60_000 })
  if (limited) return limited
  if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 32 * 1024) return ownerReply('Recording too long', 413)
  let form: FormData
  try { form = await request.formData() } catch { return ownerReply('Invalid form', 400) }
  const audio = form.get('audio')
  if (!(audio instanceof File) || !audio.size) return ownerReply('audio required', 400)
  if (audio.size > MAX_AUDIO_BYTES) return ownerReply('Recording too long', 413)
  if (!audioTypeOk(audio.type)) return ownerReply('Unsupported audio type', 415)
  try {
    const text = await transcribe({ bytes: new Uint8Array(await audio.arrayBuffer()), mime: audio.type, language: form.get('language') === 'en' ? 'en' : 'de' })
    return NextResponse.json({ text }, { headers: OWNER_HEADERS })
  } catch (e) {
    if (e instanceof TranscriptionUnavailable) return NextResponse.json({ error: 'No transcription provider', code: 'unavailable' }, { status: 503, headers: OWNER_HEADERS })
    console.error('[os/max/transcribe]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Transcription failed', code: 'failed' }, { status: 502, headers: OWNER_HEADERS })
  }
})
