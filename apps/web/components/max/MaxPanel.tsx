'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useMax } from './MaxMemoryProvider'
import { MaxMessage } from './MaxMessage'
import { MaxComposer } from './MaxComposer'
import { Icon } from '@maxpromo/ui'

interface MaxPanelProps {
  onClose: () => void
}

/**
 * components/max/MaxPanel.tsx
 *
 * The conversation surface: a bottom sheet on a phone, a docked panel on a
 * desktop.
 *
 * WHAT IT WAS
 * A fixed block pinned to the bottom of the viewport with `max-height: 560px`,
 * every rule written as an inline style object, no dialog semantics, no
 * Escape, no scroll ownership, an English header and an auto-scroll that
 * dragged the reader to the bottom on every render. On a 667px phone the 560px
 * cap left 107px of page behind it and the composer sat under the home
 * indicator.
 *
 * THE SHEET
 * 78dvh — inside the 70–85% the brief asks for — using dynamic viewport units,
 * so the browser's own chrome collapsing does not clip the composer. That is
 * the specific failure `100vh` produces on mobile Safari and the reason the
 * unit exists. `max-height` is expressed against `svh` as well, so the sheet
 * is never taller than the *smallest* state of the viewport: with `dvh` alone,
 * a sheet sized while the URL bar is hidden gets cropped the moment it
 * reappears.
 *
 * The page stays visible above it. This is a conversation with a company whose
 * website you are reading, not a messaging app you switched to, and the
 * remaining strip of page is what says so.
 *
 * SCROLL OWNERSHIP
 * The body is locked while the sheet is open and restored when it closes,
 * including the scroll position — `overflow: hidden` alone lets iOS forget
 * where the reader was. `overscroll-behavior: contain` on the message list
 * stops a flick at the end of the conversation from scrolling the page behind
 * it.
 *
 * AUTO-SCROLL THAT LETS GO
 * New messages follow the bottom only while the reader is already near it.
 * Scroll up to re-read something and the conversation stops chasing you; come
 * back within 64px of the bottom and following resumes. A control appears when
 * following is off, so the state is visible rather than something to discover.
 *
 * WHAT IS NOT HERE, AND WHY
 * The brief also asks for full-width quick replies, a high-score highlight
 * card and a conversational contact step. None of the three has any state
 * behind it in this repository: Max is a free-text conversation against
 * /api/chat/message, with no quick-reply set, no score and no contact stage.
 * The scored guided audit those features belong to exists only as an orphaned
 * endpoint (/api/max-agent/submit) with no caller. Building them would mean
 * writing new conversation branching and a new scoring rule, which the same
 * brief forbids. Reported rather than invented.
 *
 * MOUNTED ONLY WHILE OPEN
 * It used to take an `open` prop and return `null` when false. Mounting it on
 * demand instead (see Max.tsx) is what makes "opening lands on the latest
 * message" free: the follow state starts at `true` because the component
 * starts. Returning `null` from a component that stays mounted keeps the old
 * scroll state alive between conversations and needs an effect to reset it,
 * which is a state update triggered by a render.
 */
export function MaxPanel({ onClose }: MaxPanelProps) {
  const { messages, isLoading } = useMax()
  const t = useTranslations('max')

  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)
  const [following, setFollowing] = useState(true)

  const NEAR_BOTTOM = 64

  /**
   * `smooth` is a request, not an instruction.
   *
   * Smooth scrolling is motion, and a reader who has asked their system for
   * less of it has asked for this too — the brief lists smooth scrolling among
   * the things `prefers-reduced-motion` must switch off. The rest of this
   * component's motion is handled in the stylesheet, where the media query is
   * free; a scroll issued from JavaScript has to ask.
   */
  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = scrollRef.current
    if (!el) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !calm ? 'smooth' : 'auto' })
  }, [])

  // Follow the conversation only while the reader is at the end of it.
  // On mount this is the jump to the latest message.
  useEffect(() => {
    if (!following) return
    scrollToBottom(messages.length > 1)
  }, [messages, isLoading, following, scrollToBottom])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setFollowing(distance <= NEAR_BOTTOM)
  }

  // Escape closes, as it does for the navigation sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /**
   * Lock the page behind the sheet, and give the reader back the place they
   * were reading. Position-fixed rather than `overflow: hidden` because iOS
   * Safari ignores the latter on `body` often enough to be unusable.
   */
  useEffect(() => {
    const y = window.scrollY
    const { body } = document
    const prev = {
      position: body.style.position,
      top:      body.style.top,
      width:    body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top      = `-${y}px`
    body.style.width    = '100%'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = prev.position
      body.style.top      = prev.top
      body.style.width    = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, y)
    }
  }, [])

  // Move focus into the sheet so a keyboard reader is where the dialog is.
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  const isEmpty = messages.length === 0

  return (
    <>
      <style>{`
        /* ── The sheet ─────────────────────────────────────────────────── */
        .max-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 78dvh;
          max-height: 85svh;
          background: var(--brand-surface);
          border: 1px solid var(--brand-border);
          border-bottom: 0;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          box-shadow: var(--shadow-overlay);
          animation: max-sheet-in var(--duration-base) var(--ease) both;
        }
        @keyframes max-sheet-in {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .max-panel:focus { outline: none; }

        @media (min-width: 640px) {
          .max-panel {
            left: auto;
            right: var(--space-5);
            bottom: 90px;
            width: 380px;
            height: auto;
            max-height: min(560px, 70dvh);
            border-radius: var(--radius-xl);
            border-bottom: 1px solid var(--brand-border);
          }
        }

        /* ── Header ────────────────────────────────────────────────────── */
        .max-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          flex-shrink: 0;
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--brand-border);
        }
        .max-head-id { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .max-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: var(--brand-primary);
          border: 1px solid var(--brand-primary-edge);
          color: var(--brand-on-primary);
          font-family: var(--brand-font-mono);
          font-weight: 700;
          font-size: var(--text-label);
        }
        .max-name {
          margin: 0;
          max-width: none;
          font-family: var(--brand-font-sans);
          font-size: var(--text-micro);
          font-weight: 600;
          letter-spacing: var(--tracking-label);
          text-transform: uppercase;
          color: var(--brand-text);
        }
        .max-role {
          margin: 0;
          max-width: none;
          font-size: var(--text-label);
          line-height: var(--leading-ui);
          color: var(--brand-text-secondary);
        }
        /* 44px, which is the floor for anything a thumb has to find. It was
           32px, in the corner of the screen, which is the hardest place on a
           phone to hit accurately. */
        .max-close {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          margin-right: calc(var(--space-2) * -1);
          background: none;
          border: 0;
          border-radius: var(--radius-md);
          color: var(--brand-text-secondary);
          cursor: pointer;
        }
        .max-close:hover { color: var(--brand-text); background: var(--brand-surface-subtle); }

        /* ── Messages ──────────────────────────────────────────────────── */
        .max-log {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-4) 0;
        }
        .max-empty {
          margin: 0;
          max-width: 34ch;
          align-self: center;
          padding: var(--space-6) var(--space-5) 0;
          font-size: var(--text-small);
          line-height: var(--leading-body);
          color: var(--brand-text-muted);
          text-align: center;
        }

        .max-msg {
          display: flex;
          justify-content: flex-start;
          padding-inline: var(--space-4);
          animation: max-msg-in 220ms var(--ease) both;
        }
        .max-msg-user { justify-content: flex-end; }
        @keyframes max-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .max-msg-bubble {
          max-width: 82%;
          padding: 10px 14px;
          border: 1px solid var(--brand-border);
          border-radius: var(--radius-lg);
          border-bottom-left-radius: var(--radius-xs);
          background: var(--brand-surface-subtle);
          color: var(--brand-text);
          font-family: var(--brand-font-body);
          font-size: var(--text-small);
          line-height: var(--leading-body);
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        /* The reader's own words: the one lime-tinted surface, with ordinary
           text on it. Tinted, not filled — a lime fill here would make every
           second bubble the loudest object on the page. */
        .max-msg-user .max-msg-bubble {
          background: var(--brand-surface-accent);
          border-color: var(--mp-lime-200);
          border-bottom-left-radius: var(--radius-lg);
          border-bottom-right-radius: var(--radius-xs);
        }

        .max-typing {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding-inline: var(--space-4);
        }

        /* ── Jump to latest ────────────────────────────────────────────── */
        .max-jump {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 84px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 36px;
          padding: 0 var(--space-4);
          border-radius: var(--radius-full);
          background: var(--brand-surface-inverted);
          color: var(--brand-text-inverted);
          border: 1px solid var(--brand-border-inverted);
          box-shadow: var(--shadow-overlay);
          font-family: var(--brand-font-sans);
          font-size: var(--text-label);
          font-weight: 500;
          letter-spacing: var(--tracking-label);
          text-transform: uppercase;
          cursor: pointer;
        }

        @media (prefers-reduced-motion: reduce) {
          .max-panel, .max-msg { animation: none; }
        }
      `}</style>

      <div
        ref={panelRef}
        className="max-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('conversationLabel')}
        tabIndex={-1}
      >
        <div className="max-head">
          <div className="max-head-id">
            <span className="max-mark" aria-hidden="true">M</span>
            <div>
              {/* Identity and purpose, and nothing else. No model name, no
                  "AI", no availability badge — the header said
                  "Business Advisor" in English on a German-first site, which
                  was both a language bug and a claim about a role. */}
              <p className="max-name">{t('name')}</p>
              <p className="max-role">{t('role')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="max-close">
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="max-log chat-scroll"
          role="log"
          aria-live="polite"
          aria-label={t('conversationLabel')}
        >
          {isEmpty && !isLoading && <p className="max-empty">{t('empty')}</p>}

          {messages.map((m) => (
            <MaxMessage
              key={m.id}
              message={m}
              speakerLabel={m.role === 'user' ? t('youSaid') : t('maxSaid')}
            />
          ))}

          {isLoading && (
            <div className="max-typing">
              <span className="sr-only">{t('thinking')}</span>
              <span className="typing-dot" aria-hidden="true" />
              <span className="typing-dot" aria-hidden="true" />
              <span className="typing-dot" aria-hidden="true" />
            </div>
          )}
        </div>

        {!following && !isEmpty && (
          <button
            type="button"
            className="max-jump"
            onClick={() => { setFollowing(true); scrollToBottom(true) }}
          >
            {t('scrollToLatest')}
          </button>
        )}

        <MaxComposer />
      </div>
    </>
  )
}
