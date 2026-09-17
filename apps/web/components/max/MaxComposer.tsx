'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useMax } from './MaxMemoryProvider'
import { Icon } from '@maxpromo/ui'
import type { ChatMessage } from '@/lib/chat/types'

/**
 * Textarea + send. Optimistic UI: appends user message, shows typing, appends
 * reply. The request, the endpoint and the optimistic sequence are unchanged —
 * this pass touched how the control looks and what it says, not what it does.
 *
 * FOUR THINGS THE MOBILE PASS FIXED
 *
 *  1. `font-size: 14px`. Mobile Safari zooms the whole page when a focused
 *     input is under 16px, and the reader then has to pinch back out to see
 *     the conversation they are having. It is 16px here and the zoom does not
 *     happen. This is the single most common mobile form bug and it is a font
 *     size.
 *  2. `placeholder="…"` — one ellipsis, which tells nobody anything and is
 *     the placeholder-as-label antipattern besides. The field now has a real
 *     accessible name from the catalogue.
 *  3. The error string chose its language with `document.documentElement.lang`
 *     and an inline ternary, which is a second translation mechanism living
 *     beside next-intl. It reads from the catalogue like everything else.
 *  4. `aria-label="Send"` was English on a German-first site, and the send
 *     control was 40px in the corner of a phone. 44px, and named in both
 *     languages.
 *
 * The composer sits below the message list inside a flex column, so it is
 * pinned without being `position: fixed` — which is what keeps it above the
 * on-screen keyboard instead of behind it. The bottom padding clears the home
 * indicator.
 */
export function MaxComposer() {
  const [text, setText] = useState('')
  const { addMessage, setLoading, isLoading } = useMax()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const t = useTranslations('max')

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
      const errorReply: ChatMessage = {
        id:        -Date.now() - 2,
        sessionId: '',
        role:      'assistant',
        content:   t('unavailable'),
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

  const canSend = Boolean(text.trim()) && !isLoading

  return (
    <>
      <style>{`
        .max-composer {
          display: flex;
          align-items: flex-end;
          gap: var(--space-2);
          flex-shrink: 0;
          padding: var(--space-3) var(--space-4);
          padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid var(--brand-border);
          background: var(--brand-surface);
        }
        .max-input {
          flex: 1;
          min-width: 0;
          min-height: 44px;
          max-height: 100px;
          padding: 11px 12px;
          background: var(--brand-surface-subtle);
          border: 1px solid var(--brand-border-control);
          border-radius: var(--radius-lg);
          color: var(--brand-text);
          font-family: var(--brand-font-body);
          /* 16px. Below it, mobile Safari zooms the page on focus. */
          font-size: 1rem;
          line-height: var(--leading-ui);
          resize: none;
          outline: none;
          transition: border-color var(--duration-fast) var(--ease);
        }
        .max-input:focus { border-color: var(--brand-text); }
        .max-input::placeholder { color: var(--brand-text-muted); }

        .max-send {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          background: var(--brand-primary);
          border: 1px solid var(--brand-primary-edge);
          color: var(--brand-on-primary);
          cursor: pointer;
          transition: opacity var(--duration-base) var(--ease);
        }
        .max-send:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <div className="max-composer">
        <textarea
          ref={taRef}
          value={text}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          rows={1}
          disabled={isLoading}
          className="max-input"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          aria-label={t('send')}
          className="max-send"
        >
          <Icon name="send" size="sm" />
        </button>
      </div>
    </>
  )
}
