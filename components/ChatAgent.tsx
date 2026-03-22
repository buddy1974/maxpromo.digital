'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm Max, your automation assistant. Ask me anything about AI agents, workflow automation, or how MaxPromo Digital can help your organisation.",
}

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text }
    setInput('')
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
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
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat panel */}
      {isOpen && (
        <div
          className="mb-4 w-80 sm:w-96 flex flex-col overflow-hidden"
          style={{
            maxHeight: '520px',
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '2px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#F97316',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="status-pulse"
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#030305' }}
              />
              <div>
                <p style={{ color: '#030305', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>
                  Max
                </p>
                <p style={{ color: 'rgba(3,3,5,0.65)', fontFamily: 'var(--font-space-mono)', fontSize: '10px', marginTop: '2px' }}>
                  Automation Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ color: 'rgba(3,3,5,0.65)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
              aria-label="Close chat"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-dm-sans)',
                    background: m.role === 'user' ? '#F97316' : '#1A1A20',
                    color: m.role === 'user' ? '#030305' : '#FAFAFF',
                    borderRadius: '2px',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#1A1A20', padding: '12px 14px', borderRadius: '2px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="animate-bounce"
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#6B6B7A',
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '12px',
              display: 'flex',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about automation..."
              style={{
                flex: 1,
                background: '#030305',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FAFAFF',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                padding: '10px 12px',
                outline: 'none',
                borderRadius: '2px',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#F97316')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? '#F97316' : 'rgba(249,115,22,0.3)',
                color: '#030305',
                border: 'none',
                padding: '10px 12px',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                transition: 'background 150ms ease',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => { if (input.trim() && !loading) e.currentTarget.style.background = '#EA6A00' }}
              onMouseLeave={(e) => { if (input.trim() && !loading) e.currentTarget.style.background = '#F97316' }}
              aria-label="Send message"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          background: '#F97316',
          color: '#030305',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#EA6A00')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#F97316')}
        aria-label={isOpen ? 'Close assistant' : 'Open automation assistant'}
      >
        {isOpen ? (
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
