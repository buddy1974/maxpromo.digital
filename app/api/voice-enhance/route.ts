import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/voice-enhance
 *
 * Polishes a raw speech-to-text transcript into clean business prose.
 * Preserves meaning — no invention, no expansion.
 *
 * Body:  { transcript: string, context?: string }
 * Reply: { enhanced: string }
 */

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

  try {
    const body = (await request.json()) as VoiceEnhanceBody
    const { transcript, context } = body

    if (!transcript?.trim()) {
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
    console.error('[/api/voice-enhance]', error)
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 })
  }
}
