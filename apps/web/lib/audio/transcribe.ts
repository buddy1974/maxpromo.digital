/**
 * lib/audio/transcribe.ts — audio.transcribe(): speech to text behind one boundary (Universal Max V1,
 * ADR-0029). SERVER ONLY.
 *
 * Universal Max never acts on audio. A recording becomes a transcript, the transcript is shown in
 * the composer, Marcel may edit it, and only what he then sends is input. Audio is processed in
 * memory for one request and never stored.
 *
 * The provider call lives in the shared gateway (@maxpromo/ai `transcribeAudio`), which has no
 * transcription route unless the owner enables one (AUDIO_TRANSCRIPTION_PROVIDER=openai with
 * OPENAI_API_KEY) — the production text route is Anthropic, which does not transcribe. With no
 * route the composer uses the browser's own speech recognition where the browser has one (the
 * browser vendor processes the audio, as with keyboard dictation), and otherwise says so and keeps
 * typing available. Adding a provider means adding a route in the gateway — Max does not change.
 */
import { resolveAudioRoute, transcribeAudio } from '@maxpromo/ai'

export class TranscriptionUnavailable extends Error {}
export class TranscriptionFailed extends Error {}

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024
const AUDIO_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/m4a', 'audio/x-m4a'])

type Env = Record<string, string | undefined>

export function transcriptionProvider(env: Env = process.env): 'openai' | null {
  return resolveAudioRoute(env)
}

export function audioTypeOk(mime: string): boolean {
  return AUDIO_TYPES.has(mime.split(';')[0].trim().toLowerCase())
}

export async function transcribe(audio: { bytes: Uint8Array; mime: string; language?: 'de' | 'en' }, deps: { env?: Env; fetch?: typeof fetch } = {}): Promise<string> {
  if (!transcriptionProvider(deps.env ?? process.env)) throw new TranscriptionUnavailable('No transcription provider is configured.')
  if (!audio.bytes.byteLength) throw new TranscriptionFailed('empty audio')
  if (audio.bytes.byteLength > MAX_AUDIO_BYTES) throw new TranscriptionFailed('audio too large')
  if (!audioTypeOk(audio.mime)) throw new TranscriptionFailed('unsupported audio type')
  const r = await transcribeAudio(audio, deps)
  if (!r.ok) throw r.reason === 'not_configured' ? new TranscriptionUnavailable(r.detail) : new TranscriptionFailed(r.detail)
  return r.text
}
