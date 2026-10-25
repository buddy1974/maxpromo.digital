'use client'
/**
 * Voice input for the Max composer: tap, speak, tap again — the transcript lands in the text field
 * for Marcel to read and edit. Nothing is ever sent or executed from audio.
 *
 *   server   MediaRecorder → /api/os/max/transcribe (audio.transcribe, when a provider is configured)
 *   browser  the browser's own speech recognition (Chrome, Safari), processed by the browser vendor
 *   none     a plain message; typing (and the keyboard's own dictation) stays available
 *
 * Audio is never stored: the recording lives in memory until it is transcribed.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceState = 'idle' | 'listening' | 'transcribing'
export type VoiceProblem = 'denied' | 'failed' | 'empty' | 'unavailable' | null

interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function voiceSupport(server: boolean): 'server' | 'browser' | 'none' {
  if (server && typeof window !== 'undefined' && 'MediaRecorder' in window && typeof navigator.mediaDevices?.getUserMedia === 'function') return 'server'
  return recognitionCtor() ? 'browser' : 'none'
}

export function useVoice(opts: { server: boolean; locale: 'de' | 'en'; onTranscript: (text: string) => void }) {
  const [state, setState] = useState<VoiceState>('idle')
  const [problem, setProblem] = useState<VoiceProblem>(null)
  const [interim, setInterim] = useState('')
  const [used, setUsed] = useState<'server' | 'browser' | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const heard = useRef('')
  const errored = useRef(false)
  const { onTranscript, locale } = opts

  const finish = useCallback((text: string) => {
    const t = text.trim()
    setInterim('')
    setState('idle')
    if (!t) { setProblem('empty'); return }
    onTranscript(t)
  }, [onTranscript])

  const startBrowser = useCallback(() => {
    const Ctor = recognitionCtor()
    if (!Ctor) { setProblem('unavailable'); return }
    const r = new Ctor()
    r.lang = locale === 'de' ? 'de-DE' : 'en-GB'
    r.continuous = true
    r.interimResults = true
    heard.current = ''
    errored.current = false
    r.onresult = e => {
      let finalText = '', partial = ''
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else partial += res[0].transcript
      }
      heard.current = finalText
      setInterim(`${finalText} ${partial}`.trim())
    }
    r.onerror = e => { errored.current = true; setInterim(''); setProblem(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'empty' : 'failed'); setState('idle') }
    /* An error has already said what went wrong; the end that follows it must not say "nothing heard". */
    r.onend = () => { recognition.current = null; if (errored.current) setState('idle'); else finish(heard.current) }
    recognition.current = r
    setUsed('browser')
    setState('listening')
    try { r.start() } catch { setProblem('failed'); setState('idle') }
  }, [finish, locale])

  const start = useCallback(async () => {
    setProblem(null)
    const mode = voiceSupport(opts.server)
    if (mode === 'none') { setProblem('unavailable'); return }
    if (mode === 'browser') { startBrowser(); return }
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch (e) {
      setProblem(e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'failed'); return
    }
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = ev => { if (ev.data.size) chunks.push(ev.data) }
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      recorder.current = null
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
      if (!blob.size) { setState('idle'); setProblem('empty'); return }
      setState('transcribing')
      const form = new FormData()
      form.set('audio', new File([blob], 'voice', { type: blob.type.split(';')[0] }))
      form.set('language', locale)
      try {
        const res = await fetch('/api/os/max/transcribe', { method: 'POST', body: form })
        if (res.status === 503) { setState('idle'); if (recognitionCtor()) startBrowser(); else setProblem('unavailable'); return }
        if (!res.ok) throw new Error(String(res.status))
        finish(((await res.json()) as { text?: string }).text ?? '')
      } catch { setState('idle'); setProblem('failed') }
    }
    recorder.current = rec
    setUsed('server')
    setState('listening')
    rec.start()
  }, [finish, locale, opts.server, startBrowser])

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
    else if (recognition.current) recognition.current.stop()
  }, [])

  useEffect(() => () => {
    recognition.current?.abort()
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  return { state, problem, interim, used, start, stop, dismiss: () => setProblem(null) }
}
