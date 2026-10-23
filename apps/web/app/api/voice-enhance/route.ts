import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { enforceRateLimit } from '@/lib/rate-limit'
import { allDomainHosts, normaliseHost } from '@maxpromo/config'

/**
 * POST /api/voice-enhance
 *
 * Polishes a raw speech-to-text transcript into clean business prose.
 * Preserves meaning — no invention, no expansion.
 *
 * Body:  { transcript: string, context?: string }
 * Reply: { enhanced: string }
 *
 * Public and unauthenticated by design (the contact form's voice input), so
 * it is bounded rather than trusted: only a page on one of our own domains may
 * call it (Origin + Sec-Fetch-Site), the body and the model output are capped,
 * and the per-instance rate limit stays. It reads nothing and writes nothing.
 */

const MAX_BODY_BYTES = 8 * 1024

/** A browser on one of our registered domains — never another site, never a script without an Origin. */
function fromOurPages(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (!origin) return false
  let host: string
  try { host = new URL(origin).host } catch { return false }
  if (process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return true
  return allDomainHosts().includes(normaliseHost(host))
}

interface VoiceEnhanceBody {
  transcript: string
  context?: string
}

const SYSTEM_PROMPT = `You are a transcript polishing assistant for Maxpromo Digital's business diagnostic forms.

Your task:
- Fix punctuation, capitalisation, and grammar in speech-to-text output
- Remove filler words (uh, um, like, you know) and false starts
- Preserve the speaker's exact meaning and intent — do NOT add, invent, or expand content
- Keep the same language as the input (German or English)
- Output only the polished text — no preamble, no explanation, no quotation marks
- If the transcript is already clear, return it as-is with minimal changes
- Appropriate length: match the input; never significantly shorten or lengthen`

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { scope: 'voice-enhance', limit: 20, windowMs: 60_000 })
  if (blocked) return blocked

  if (!fromOurPages(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })
    const body = JSON.parse(raw) as VoiceEnhanceBody
    const transcript = typeof body.transcript === 'string' ? body.transcript : ''
    const context = typeof body.context === 'string' ? body.context.slice(0, 120) : undefined

    if (!transcript.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
    }

    const trimmed = transcript.trim().slice(0, 3000)

    const userMessage = context
      ? `Field context: ${context}\n\nTranscript to polish:\n${trimmed}`
      : `Transcript to polish:\n${trimmed}`

    const result = await callAI(
      [{ role: 'user', content: userMessage }],
      SYSTEM_PROMPT,
      { maxTokens: 600 },
    )

    return NextResponse.json({ enhanced: result.content.trim() })
  } catch (error) {
    console.error('[/api/voice-enhance]', error instanceof Error ? error.message : 'failed')
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 })
  }
}
