'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ChatSession, ChatMessage } from '@/lib/chat/types'

interface MaxCtx {
  session:    ChatSession | null
  messages:   ChatMessage[]
  isLoading:  boolean
  addMessage: (msg: ChatMessage) => void
  setLoading: (v: boolean)       => void
}

const Ctx = createContext<MaxCtx | null>(null)

export function useMax(): MaxCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMax must be used inside MaxMemoryProvider')
  return ctx
}

export function MaxMemoryProvider({ children }: { children: React.ReactNode }) {
  const [session,   setSession]   = useState<ChatSession | null>(null)
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Hydrate from the server on mount if a session cookie exists
    fetch('/api/chat/session')
      .then(async res => {
        if (res.status === 204) return  // no existing session — start fresh
        const data = await res.json() as { session: ChatSession; messages: ChatMessage[] }
        setSession(data.session)
        setMessages(data.messages)
      })
      .catch(() => { /* fail open — widget still works, just no history */ })

    // TODO(phase3b): track URL changes, scroll depth, time on page — emit to /api/chat/events
  }, [])

  function addMessage(msg: ChatMessage) {
    setMessages(prev => [...prev, msg])
    if (!session) {
      // Session will be set by the POST response on first message
    }
  }

  return (
    <Ctx.Provider value={{ session, messages, isLoading, addMessage, setLoading: setIsLoading }}>
      {children}
    </Ctx.Provider>
  )
}
