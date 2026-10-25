/**
 * packages/ai/audio.ts — speech to text, the gateway's audio route (Universal Max V1, ADR-0029).
 *
 * The text routes (gateway.ts) choose Anthropic in production, and Anthropic does not transcribe
 * audio. So transcription is its own, explicitly enabled route — never implied by a key that
 * happens to be present:
 *
 *   AUDIO_TRANSCRIPTION_PROVIDER=openai  and  OPENAI_API_KEY   → OpenAI audio transcription
 *
 * Nothing else is a transcription route. The caller (apps/web lib/audio/transcribe.ts) shows the
 * transcript for Marcel to edit; audio is sent once and kept nowhere.
 */

type Env = Record<string, string | undefined>
export type AudioRouteName = 'openai'
export type TranscriptionResult = { ok: true; text: string; route: AudioRouteName } | { ok: false; reason: 'not_configured' | 'provider'; detail: string }

export function resolveAudioRoute(env: Env = process.env): AudioRouteName | null {
  return env.AUDIO_TRANSCRIPTION_PROVIDER?.trim() === 'openai' && env.OPENAI_API_KEY?.trim() ? 'openai' : null
}

export async function transcribeAudio(
  audio: { bytes: Uint8Array; mime: string; language?: 'de' | 'en' },
  deps: { env?: Env; fetch?: typeof fetch } = {},
): Promise<TranscriptionResult> {
  const env = deps.env ?? process.env
  const route = resolveAudioRoute(env)
  if (!route) return { ok: false, reason: 'not_configured', detail: 'no transcription route configured' }
  const mime = audio.mime.split(';')[0].trim().toLowerCase()
  const ext = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : mime.includes('mpeg') ? 'mp3' : 'm4a'
  const form = new FormData()
  form.append('file', new Blob([audio.bytes as BlobPart], { type: mime }), `voice.${ext}`)
  form.append('model', env.OPENAI_TRANSCRIPTION_MODEL?.trim() || 'gpt-4o-mini-transcribe')
  if (audio.language) form.append('language', audio.language)
  try {
    const res = await (deps.fetch ?? fetch)('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY!.trim()}` }, body: form, signal: AbortSignal.timeout(45_000),
    })
    if (!res.ok) return { ok: false, reason: 'provider', detail: `openai audio ${res.status}` }
    const data = await res.json().catch(() => null) as { text?: unknown } | null
    return { ok: true, text: typeof data?.text === 'string' ? data.text.trim().slice(0, 4000) : '', route }
  } catch (e) {
    return { ok: false, reason: 'provider', detail: e instanceof Error ? e.name : 'network' }
  }
}
