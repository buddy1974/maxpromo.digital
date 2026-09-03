'use client'

import { useEffect, useRef } from 'react'
import { useMax } from './MaxMemoryProvider'
import { MaxMessage } from './MaxMessage'
import { MaxComposer } from './MaxComposer'

interface MaxPanelProps {
  open:    boolean
  onClose: () => void
}

/** Chat panel. 380px desktop / full-width bottom drawer mobile. */
export function MaxPanel({ open, onClose }: MaxPanelProps) {
  const { messages, isLoading } = useMax()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  // Locale-aware empty state
  const lang    = typeof document !== 'undefined' ? document.documentElement.lang || 'de' : 'de'
  const isEmpty = messages.length === 0

  if (!open) return null

  return (
    <>
      <style>{`
        .max-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 999;
          border-radius: 12px 12px 0 0;
          max-height: 560px;
        }
        @media (min-width: 640px) {
          .max-panel {
            left: auto;
            right: 24px;
            bottom: 90px;
            width: 380px;
            border-radius: 12px;
          }
        }
      `}</style>

      <div
        className="max-panel"
        style={{
          background: '#0F0F0F',
          border:     '1px solid #1A1A1A',
          display:    'flex',
          flexDirection: 'column',
          overflow:   'hidden',
          boxShadow:  '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1A1A1A', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: '11px', color: '#080808', flexShrink: 0 }}>
              M
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: '13px', color: '#E0DDD8', margin: 0, letterSpacing: '0.05em' }}>
                Max
              </p>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: '#F97316', margin: 0, letterSpacing: '0.1em' }}>
                {'Business Advisor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '6px', fontSize: '18px', lineHeight: 1, borderRadius: '6px', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}
          className="chat-scroll"
        >
          {isEmpty && !isLoading && (
            <p style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)', fontSize: '15px', color: '#444', textAlign: 'center', padding: '2rem 2rem 0', lineHeight: 1.6 }}>
              {lang === 'de' ? 'Frage stellen. Echte Antwort.' : 'Ask a question. Real answer.'}
            </p>
          )}
          {messages.map(m => <MaxMessage key={m.id} message={m} />)}
          {isLoading && (
            <div style={{ paddingLeft: '16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
              <span className="typing-dot" style={{ animationDelay: '0.30s' }} />
            </div>
          )}
        </div>

        {/* Composer */}
        <MaxComposer />
      </div>
    </>
  )
}
