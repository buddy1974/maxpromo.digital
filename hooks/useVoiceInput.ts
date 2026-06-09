'use client'

/**
 * useVoiceInput
 *
 * SpeechRecognition state machine for voice-assisted text input.
 *
 * Phases:
 *   idle       — no active voice session
 *   listening  — mic active, streaming transcript
 *   raw        — transcript captured; user can read/edit raw text
 *   enhancing  — AI polish in flight
 *   enhanced   — AI result ready; user can approve raw or enhanced
 *
 * Rules:
 *   - rawInput is NEVER overwritten automatically
 *   - Parent value is only updated on explicit approve()
 *   - If SpeechRecognition unavailable, supported = false; UI shows fallback
 *
 * Browser support:
 *   Chrome 33+, Edge 79+, Safari 14.1+ — full
 *   Firefox — NOT supported (no SpeechRecognition implementation)
 *   Samsung Internet — supported
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type VoicePhase = 'idle' | 'listening' | 'raw' | 'enhancing' | 'enhanced'

export interface VoiceInputState {
  /** Whether the browser supports SpeechRecognition */
  supported: boolean
  phase: VoicePhase
  /** Original, unmodified speech-to-text output */
  rawInput: string
  /** User-editable version of raw (may differ from rawInput) */
  editedRaw: string
  /** AI-polished version; null until enhance() resolves */
  enhancedInput: string | null
  error: string | null
  /** Interim transcript shown live during recording */
  interimTranscript: string
}

export interface VoiceInputActions {
  startListening: () => void
  stopListening: () => void
  setEditedRaw: (text: string) => void
  enhance: (context?: string) => Promise<void>
  /** Approve a version — calls parent onChange and resets to idle */
  approveRaw: (onChange: (v: string) => void) => void
  approveEnhanced: (onChange: (v: string) => void) => void
  dismiss: () => void
}

// ── Browser type shim ────────────────────────────────────────────────────────

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
  resultIndex: number
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function createRecognition(lang: string): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  if (!SR) return null
  const r = new SR() as SpeechRecognitionInstance
  r.continuous = true
  r.interimResults = true
  r.lang = lang
  return r
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceInput(lang = 'de-DE'): VoiceInputState & VoiceInputActions {
  const [supported, setSupported] = useState(false)
  const [phase, setPhase] = useState<VoicePhase>('idle')
  const [rawInput, setRawInput] = useState('')
  const [editedRaw, setEditedRaw] = useState('')
  const [enhancedInput, setEnhancedInput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')

  // Detect support once on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    setSupported(!!SR)
  }, [])

  const startListening = useCallback(() => {
    if (!supported) return
    setError(null)
    setInterimTranscript('')
    finalTranscriptRef.current = ''

    const recognition = createRecognition(lang)
    if (!recognition) return

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = finalTranscriptRef.current

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }

      finalTranscriptRef.current = final
      setInterimTranscript(interim)
    }

    recognition.onerror = (e: { error: string }) => {
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone in browser settings.')
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Hold the button and speak clearly.')
      } else {
        setError(`Recognition error: ${e.error}`)
      }
      setPhase('idle')
    }

    recognition.onend = () => {
      const raw = finalTranscriptRef.current.trim()
      setInterimTranscript('')
      if (raw) {
        setRawInput(raw)
        setEditedRaw(raw)
        setEnhancedInput(null)
        setPhase('raw')
      } else {
        setPhase('idle')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setPhase('listening')
  }, [supported, lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [])

  const enhance = useCallback(async (context?: string) => {
    if (!editedRaw.trim()) return
    setPhase('enhancing')
    setError(null)
    try {
      const res = await fetch('/api/voice-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: editedRaw, context }),
      })
      if (!res.ok) throw new Error('Enhancement request failed')
      const data = await res.json() as { enhanced: string }
      setEnhancedInput(data.enhanced)
      setPhase('enhanced')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed')
      setPhase('raw')
    }
  }, [editedRaw])

  const approveRaw = useCallback((onChange: (v: string) => void) => {
    onChange(editedRaw)
    reset()
  }, [editedRaw]) // eslint-disable-line react-hooks/exhaustive-deps

  const approveEnhanced = useCallback((onChange: (v: string) => void) => {
    if (enhancedInput) onChange(enhancedInput)
    reset()
  }, [enhancedInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    reset()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setPhase('idle')
    setRawInput('')
    setEditedRaw('')
    setEnhancedInput(null)
    setError(null)
    setInterimTranscript('')
    finalTranscriptRef.current = ''
  }

  return {
    supported,
    phase,
    rawInput,
    editedRaw,
    enhancedInput,
    error,
    interimTranscript,
    startListening,
    stopListening,
    setEditedRaw,
    enhance,
    approveRaw,
    approveEnhanced,
    dismiss,
  }
}
