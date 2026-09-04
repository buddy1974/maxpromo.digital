'use client'

/**
 * VoiceInputWidget
 *
 * Drop-in replacement for a <textarea> that adds voice input.
 *
 * Flow:
 *   Press + hold mic → speak → release → raw transcript shown
 *   → user can edit raw → optional "Enhance with AI" button
 *   → enhanced version shown → user approves raw or enhanced
 *   → approved text written to parent via onChange()
 *
 * Data preserved:
 *   rawInput   , original SpeechRecognition output, never auto-overwritten
 *   enhancedInput, AI-polished version, shown for comparison
 *
 * Browser support:
 *   Supported:  Chrome 33+, Edge 79+, Safari 14.1+, Samsung Internet
 *   Unsupported: Firefox (mic button hidden; textarea works normally)
 *
 * Mobile-first:
 *   - 48px minimum touch targets
 *   - pointerdown/pointerup for cross-device hold gesture
 *   - No hover-only interactions
 */

import { useRef, useCallback } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { Icon } from '@maxpromo/ui'

// ── Constants ────────────────────────────────────────────────────────────────

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

// ── Types ────────────────────────────────────────────────────────────────────

export interface VoiceInputWidgetProps {
  /** Controlled value shown in main textarea */
  value: string
  /** Called only when user explicitly approves a voice version */
  onChange: (value: string) => void
  /** Sent to AI endpoint for context-aware polishing */
  context?: string
  /** BCP-47 language tag for SpeechRecognition (default: 'de-DE') */
  lang?: string
  placeholder?: string
  rows?: number
  style?: React.CSSProperties
  textareaStyle?: React.CSSProperties
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>
  /** Allow direct typing in main textarea (always true; voice is additive) */
  disabled?: boolean
}

// ── MicButton ────────────────────────────────────────────────────────────────

function MicButton({
  listening,
  supported,
  onStart,
  onStop,
}: {
  listening: boolean
  supported: boolean
  onStart: () => void
  onStop: () => void
}) {
  const holdRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    holdRef.current = true
    onStart()
  }, [onStart])

  const handlePointerUp = useCallback(() => {
    if (holdRef.current) {
      holdRef.current = false
      onStop()
    }
  }, [onStop])

  const handlePointerLeave = useCallback(() => {
    if (holdRef.current) {
      holdRef.current = false
      onStop()
    }
  }, [onStop])

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input not supported in this browser (use Chrome, Edge, or Safari)"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--brand-surface) 4%, transparent)',
          border: '1px solid color-mix(in srgb, var(--brand-surface) 8%, transparent)',
          color: 'var(--brand-text-muted)',
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          touchAction: 'none',
        }}
        aria-label="Voice input not supported"
      >
        <MicIcon muted />
      </button>
    )
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      title={listening ? 'Release to stop' : 'Press and hold to speak'}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: listening
          ? 'color-mix(in srgb, var(--brand-primary) 20%, transparent)'
          : 'color-mix(in srgb, var(--brand-surface) 6%, transparent)',
        border: listening
          ? '1.5px solid color-mix(in srgb, var(--brand-primary) 70%, transparent)'
          : '1px solid color-mix(in srgb, var(--brand-surface) 15%, transparent)',
        color: listening ? 'var(--brand-primary)' : 'var(--brand-text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
        animation: listening ? 'voicePulse 1.2s ease-in-out infinite' : 'none',
      }}
      aria-label={listening ? 'Recording, release to stop' : 'Press and hold to record'}
      aria-pressed={listening}
    >
      <MicIcon active={listening} />
    </button>
  )
}

function MicIcon({ active = false, muted = false }: { active?: boolean; muted?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={muted ? 'var(--brand-text-muted)' : active ? 'var(--brand-primary)' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function VoiceInputWidget({
  value,
  onChange,
  context,
  lang = 'de-DE',
  placeholder,
  rows = 6,
  style,
  textareaStyle,
  onFocus,
  onBlur,
  disabled = false,
}: VoiceInputWidgetProps) {
  const voice = useVoiceInput(lang)
  const panelOpen = voice.phase !== 'idle' && voice.phase !== 'listening'

  const baseTextarea: React.CSSProperties = {
    width: '100%',
    background: 'color-mix(in srgb, var(--brand-surface) 4%, transparent)',
    border: '1px solid color-mix(in srgb, var(--brand-surface) 10%, transparent)',
    color: 'var(--brand-text-inverted)',
    fontFamily: sans,
    fontSize: '14px',
    padding: '14px 16px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.75,
    minHeight: '120px',
    boxSizing: 'border-box',
    borderRadius: '2px',
    ...textareaStyle,
  }

  const btnBase: React.CSSProperties = {
    fontFamily: mono,
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    border: 'none',
    borderRadius: '2px',
    padding: '10px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: '40px',
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Pulse animation keyframes injected once */}
      <style>{`
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand-primary) 40%, transparent); }
          50%       { box-shadow: 0 0 0 8px color-mix(in srgb, var(--brand-primary) 1%, transparent); }
        }
      `}</style>

      {/* ── Main textarea row ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          style={baseTextarea}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        {/* Mic button, right of textarea */}
        <div style={{ paddingTop: '4px' }}>
          <MicButton
            listening={voice.phase === 'listening'}
            supported={voice.supported}
            onStart={voice.startListening}
            onStop={voice.stopListening}
          />
        </div>
      </div>

      {/* ── Live interim transcript (while recording) ── */}
      {voice.phase === 'listening' && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--brand-primary) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              flexShrink: 0,
              animation: 'voicePulse 1s ease-in-out infinite',
            }}
          />
          <p
            style={{
              fontFamily: sans,
              fontSize: '13px',
              color: 'var(--brand-text-secondary)',
              margin: 0,
              fontStyle: voice.interimTranscript ? 'normal' : 'italic',
            }}
          >
            {voice.interimTranscript || 'Listening… speak now'}
          </p>
        </div>
      )}

      {/* ── Voice panel, shown after recording stops ── */}
      {panelOpen && (
        <div
          style={{
            marginTop: '10px',
            border: '1px solid color-mix(in srgb, var(--brand-surface) 10%, transparent)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '10px 14px',
              background: 'color-mix(in srgb, var(--brand-surface) 3%, transparent)',
              borderBottom: '1px solid color-mix(in srgb, var(--brand-surface) 6%, transparent)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary-text)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Voice Transcript
            </span>
            <button
              type="button"
              onClick={voice.dismiss}
              style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontFamily: mono, fontSize: '11px', padding: '2px 6px' }}
              aria-label="Dismiss voice panel"
            >
              <Icon name="close" size="sm" label="Close" />
            </button>
          </div>

          {/* Raw transcript, editable */}
          <div style={{ padding: '14px' }}>
            <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Raw transcript, edit if needed
            </p>
            <textarea
              value={voice.editedRaw}
              onChange={(e) => voice.setEditedRaw(e.target.value)}
              rows={4}
              style={{
                ...baseTextarea,
                minHeight: 'auto',
                fontSize: '13px',
                fontFamily: mono,
                resize: 'vertical',
              }}
              placeholder="Your spoken words appear here…"
            />
          </div>

          {/* Enhanced result, shown when available */}
          {voice.enhancedInput && (
            <div
              style={{
                padding: '0 14px 14px',
                borderTop: '1px solid color-mix(in srgb, var(--brand-surface) 5%, transparent)',
              }}
            >
              <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary-text)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '14px 0 8px' }}>
                AI-enhanced version
              </p>
              <div
                style={{
                  background: 'color-mix(in srgb, var(--brand-primary) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)',
                  borderRadius: '2px',
                  padding: '12px 14px',
                  fontFamily: sans,
                  fontSize: '13px',
                  color: 'var(--brand-text)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {voice.enhancedInput}
              </div>
            </div>
          )}

          {/* Action row */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid color-mix(in srgb, var(--brand-surface) 6%, transparent)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {/* Approve raw */}
            <button
              type="button"
              onClick={() => voice.approveRaw(onChange)}
              style={{ ...btnBase, background: 'color-mix(in srgb, var(--brand-surface) 8%, transparent)', color: 'var(--brand-text)' }}
            >
              <Icon name="check" size="sm" /> Use transcript
            </button>

            {/* Enhance with AI, only shown when no enhanced result yet */}
            {!voice.enhancedInput && voice.phase !== 'enhancing' && (
              <button
                type="button"
                onClick={() => voice.enhance(context)}
                disabled={!voice.editedRaw.trim()}
                style={{
                  ...btnBase,
                  background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
                  color: 'var(--brand-primary-text)',
                  border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)',
                  opacity: !voice.editedRaw.trim() ? 0.5 : 1,
                  cursor: !voice.editedRaw.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <Icon name="lab" size="sm" /> Enhance with AI
              </button>
            )}

            {/* Enhancing spinner */}
            {voice.phase === 'enhancing' && (
              <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-primary-text)', letterSpacing: '0.08em' }}>
                ⟳ Enhancing…
              </span>
            )}

            {/* Approve enhanced */}
            {voice.enhancedInput && (
              <button
                type="button"
                onClick={() => voice.approveEnhanced(onChange)}
                style={{ ...btnBase, background: 'var(--brand-primary)', color: 'var(--brand-text)' }}
              >
                <Icon name="check" size="sm" /> Use enhanced
              </button>
            )}

            {/* Discard */}
            <button
              type="button"
              onClick={voice.dismiss}
              style={{ ...btnBase, background: 'none', color: 'var(--brand-text-muted)', marginLeft: 'auto' }}
            >
              Discard
            </button>
          </div>

          {/* Error */}
          {voice.error && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid color-mix(in srgb, var(--brand-surface) 6%, transparent)' }}>
              <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--semantic-danger)', margin: 0 }}>
                <Icon name="warning" size="xs" /> {voice.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Unsupported fallback note */}
      {!voice.supported && (
        <p
          style={{
            fontFamily: mono,
            fontSize: '10px',
            color: 'var(--brand-text-secondary)',
            marginTop: '6px',
            letterSpacing: '0.05em',
          }}
        >
          Voice input requires Chrome, Edge, or Safari
        </p>
      )}
    </div>
  )
}
