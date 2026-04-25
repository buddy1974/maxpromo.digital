'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING: Message = {
  role: 'assistant',
  content:
    "👋 Hi! I'm Max — MAXPROMO.DIGITAL's AI assistant.\n\nI can help you with:\n• Our services and capabilities\n• Pricing and timelines\n• How automation could help your business\n• Booking a discovery call\n\nWhat can I help you with today?",
}

const QUICK_REPLIES = [
  'What do you build?',
  'View pricing',
  'Book a call',
  'Run free audit',
]

const sans = 'var(--font-inter)'
const mono = 'var(--font-roboto-mono)'

/* ── Typing indicator ─────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 2px' }}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

/* ── Main component ───────────────────── */
export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* Show non-blocking tooltip after 8s, once per session, fades after 4s */
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('maxTooltipShown')
    if (alreadyShown) return
    let hideTimer: ReturnType<typeof setTimeout>
    const showTimer = setTimeout(() => {
      setShowTooltip(true)
      sessionStorage.setItem('maxTooltipShown', '1')
      hideTimer = setTimeout(() => setShowTooltip(false), 4000)
    }, 8000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* Focus textarea on open */
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [isOpen])

  /* Auto-resize textarea */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setShowChips(false)
    const userMsg: Message = { role: 'user', content: trimmed }
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message ?? 'Sorry, I had trouble responding.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const toggleOpen = () => {
    setIsOpen((v) => !v)
    sessionStorage.setItem('chatOpened', '1')
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* ── Chat window ── */}
      {isOpen && (
        <div
          className="chat-window-enter"
          style={{
            marginBottom: '16px',
            width: '400px',
            height: '580px',
            background: '#0A0A0A',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: '12px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.1), 0 0 60px rgba(249,115,22,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#111111',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                className="status-pulse"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#F97316',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <div>
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    lineHeight: 1,
                    letterSpacing: '0.06em',
                  }}
                >
                  MAX
                </p>
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: '9px',
                    color: '#666666',
                    marginTop: '3px',
                    letterSpacing: '0.1em',
                  }}
                >
                  MAXPROMO · AI ASSISTANT
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                fontFamily: mono,
                fontSize: '18px',
                color: '#666666',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px 8px',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
              aria-label="Minimise chat"
            >
              –
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            className="chat-scroll"
          >
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      fontFamily: sans,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      ...(m.role === 'user'
                        ? {
                            background: '#F97316',
                            color: '#000000',
                            fontWeight: 500,
                            borderRadius: '12px 2px 2px 12px',
                          }
                        : {
                            background: '#161616',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#CCCCCC',
                            borderRadius: '2px 12px 12px 12px',
                          }),
                    }}
                  >
                    {m.content}
                  </div>
                </div>

                {/* Quick reply chips — shown after first greeting only */}
                {i === 0 && showChips && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '10px',
                    }}
                  >
                    {QUICK_REPLIES.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => void sendMessage(chip)}
                        style={{
                          fontFamily: mono,
                          fontSize: '11px',
                          color: '#F97316',
                          background: 'rgba(249,115,22,0.08)',
                          border: '1px solid rgba(249,115,22,0.25)',
                          padding: '7px 14px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          transition: 'background 0.2s ease',
                          letterSpacing: '0.04em',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(249,115,22,0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(249,115,22,0.08)')}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: '#161616',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '2px 12px 12px 12px',
                    padding: '12px 16px',
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              background: '#111111',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              padding: '16px 20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontFamily: sans,
                fontSize: '14px',
                padding: '10px 14px',
                borderRadius: '6px',
                resize: 'none',
                minHeight: '42px',
                maxHeight: '120px',
                overflowY: 'auto',
                outline: 'none',
                lineHeight: 1.5,
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: '42px',
                height: '42px',
                background: input.trim() && !loading ? '#F97316' : 'rgba(249,115,22,0.3)',
                border: 'none',
                borderRadius: '6px',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => { if (input.trim() && !loading) e.currentTarget.style.background = '#EA6A00' }}
              onMouseLeave={(e) => { if (input.trim() && !loading) e.currentTarget.style.background = '#F97316' }}
              onMouseDown={(e) => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(0.95)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      <div style={{ position: 'relative' }}>
        {/* Non-blocking tooltip */}
        {showTooltip && !isOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 12px)',
              right: 0,
              background: 'hsl(240 12% 8% / 0.95)',
              border: '1px solid rgba(249,115,22,0.3)',
              backdropFilter: 'blur(16px)',
              borderRadius: '8px',
              padding: '10px 16px',
              whiteSpace: 'nowrap',
              fontFamily: mono,
              fontSize: '12px',
              color: 'hsl(40 30% 96%)',
              pointerEvents: 'none',
              animation: 'chatSlideUp 0.3s ease forwards',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            Need help? Ask Max →
            <span
              style={{
                position: 'absolute',
                bottom: '-5px',
                right: '20px',
                width: '10px',
                height: '10px',
                background: 'hsl(240 12% 8%)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderTop: 'none',
                borderLeft: 'none',
                transform: 'rotate(45deg)',
              }}
            />
          </div>
        )}
        {/* AI badge */}
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#FFFFFF',
            color: '#F97316',
            fontFamily: mono,
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '10px',
            letterSpacing: '0.08em',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          AI
        </span>
        <button
          onClick={toggleOpen}
          className={isOpen ? '' : 'chat-pulse-ring'}
          style={{
            width: '48px',
            height: '48px',
            background: '#F97316',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
          aria-label={isOpen ? 'Close assistant' : 'Open Max — AI assistant'}
        >
          {isOpen ? (
            /* X icon */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Chat bubble icon */
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
