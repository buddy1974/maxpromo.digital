'use client'

import { useState, useRef } from 'react'
import { useMax } from './MaxMemoryProvider'
import type { ChatMessage } from '@/lib/chat/types'

/** Textarea + send. Optimistic UI: appends user message, shows typing, appends reply. */
export function MaxComposer() {
  const [text, setText]   = useState('')
  const { addMessage, setLoading, isLoading } = useMax()
  const taRef = useRef<HTMLTextAreaElement>(null)

  async function send() {
    const content = text.trim()
    if (!content || isLoading) return
    setText('')
    if (taRef.current) {
      taRef.current.style.height = 'auto'
    }

    // Optimistic user bubble (no id from DB yet, use negative timestamp as temp key)
    const optimistic: ChatMessage = {
      id:        -Date.now(),
      sessionId: '',
      role:      'user',
      content,
      channel:   'web',
      createdAt: new Date(),
      metadata:  {},
    }
    addMessage(optimistic)
    setLoading(true)

    try {
      const res  = await fetch('/api/chat/message', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? 'chat_unavailable')
      }
      if (data.reply) {
        const reply: ChatMessage = {
          id:        -Date.now() - 1,
          sessionId: '',
          role:      'assistant',
          content:   data.reply,
          channel:   'web',
          createdAt: new Date(),
          metadata:  {},
        }
        addMessage(reply)
      }
    } catch {
      const lang = document.documentElement.lang || 'de'
      const errorReply: ChatMessage = {
        id:        -Date.now() - 2,
        sessionId: '',
        role:      'assistant',
        content:   lang === 'de'
          ? 'Max ist gerade nicht erreichbar. Bitte versuchen Sie es gleich erneut.'
          : 'Max is temporarily unavailable. Please try again in a moment.',
        channel:   'web',
        createdAt: new Date(),
        metadata:  { error: true },
      }
      addMessage(errorReply)
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`
  }

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--brand-surface-sunken)', display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'var(--brand-surface)' }}>
      <textarea
        ref={taRef}
        value={text}
        onChange={onInput}
        onKeyDown={onKeyDown}
        placeholder="…"
        rows={1}
        disabled={isLoading}
        style={{
          flex:         1,
          background:   'var(--brand-surface-sunken)',
          border:       '1px solid var(--brand-surface-sunken)',
          borderRadius: '8px',
          color:        'var(--brand-text)',
          fontFamily:   'var(--font-body, system-ui, sans-serif)',
          fontSize:     '14px',
          lineHeight:   1.5,
          padding:      '9px 12px',
          resize:       'none',
          minHeight:    '40px',
          maxHeight:    '100px',
          outline:      'none',
          transition:   'border-color 150ms ease',
        }}
        onFocus={e  => (e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--brand-primary) 40%, transparent)')}
        onBlur={e   => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
      />
      <button
        onClick={() => void send()}
        disabled={!text.trim() || isLoading}
        aria-label="Send"
        style={{
          width:        '40px',
          height:       '40px',
          borderRadius: '8px',
          background:   text.trim() && !isLoading ? 'var(--brand-primary)' : 'color-mix(in srgb, var(--brand-primary) 25%, transparent)',
          border:       'none',
          cursor:       text.trim() && !isLoading ? 'pointer' : 'not-allowed',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          flexShrink:   0,
          transition:   'background 150ms ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13" stroke="var(--brand-on-primary)" strokeWidth="2.5" strokeLinecap="round"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="var(--brand-on-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
