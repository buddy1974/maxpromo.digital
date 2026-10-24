'use client'
/**
 * Ask Max — one conversation, two homes (ADR-0023): the slide-over panel on a desktop and the Max tab
 * on a phone (/os/ask). The conversation lives in a provider above the routes, so moving between
 * Today, Inbox and Max on a phone keeps it. Answers come from the OS records only
 * (lib/commercial/ask.ts), in the language of the question, with the facts and links they rest on.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'

export interface AskMsg { role: 'user' | 'assistant'; content: string; facts?: string[]; links?: { label: string; href: string }[]; phrased?: boolean; failed?: boolean }

interface AskMaxValue { msgs: AskMsg[]; loading: boolean; send: (q: string) => Promise<void>; clear: () => void }
const AskMaxContext = createContext<AskMaxValue | null>(null)

export function AskMaxProvider({ children }: { children: React.ReactNode }) {
  const { t, locale } = useOsLocale()
  const [msgs, setMsgs] = useState<AskMsg[]>([])
  const [loading, setLoading] = useState(false)

  const send = useCallback(async (content: string) => {
    const question = content.trim().slice(0, 500)
    if (!question) return
    setMsgs(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await fetch('/api/os/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale }) })
      if (res.status === 401) throw new Error('session')
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json() as { answer: string; facts: string[]; links: { label: string; href: string }[]; phrased: boolean }
      setMsgs(prev => [...prev, { role: 'assistant', content: data.answer || t.ai.noAnswer, facts: data.facts, links: data.links, phrased: data.phrased }])
    } catch (e) {
      setMsgs(prev => [...prev, { role: 'assistant', content: e instanceof Error && e.message === 'session' ? t.shell.sessionExpired : t.ai.errorReply, failed: true }])
    } finally { setLoading(false) }
  }, [locale, t])

  const value = useMemo(() => ({ msgs, loading, send, clear: () => setMsgs([]) }), [msgs, loading, send])
  return <AskMaxContext.Provider value={value}>{children}</AskMaxContext.Provider>
}

export function useAskMax(): AskMaxValue {
  const v = useContext(AskMaxContext)
  if (!v) throw new Error('useAskMax() must be used within <AskMaxProvider>')
  return v
}

/** The conversation itself. `onNavigate` closes the desktop panel when an answer's link is followed. */
export function AskMaxConversation({ onNavigate, autoFocus = false }: { onNavigate?: () => void; autoFocus?: boolean }) {
  const { t } = useOsLocale()
  const { msgs, loading, send } = useAskMax()
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const prompts = [t.ai.prompt6, t.ai.prompt2, t.ai.prompt5, t.ai.prompt1, t.ai.prompt7, t.ai.prompt4]

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, loading])
  useEffect(() => { if (autoFocus) field.current?.focus() }, [autoFocus])

  function submit() {
    if (!input.trim() || loading) return
    void send(input)
    setInput('')
  }

  return (
    <div className="askmax">
      <div className="askmax-log" aria-live="polite" aria-busy={loading}>
        {msgs.length === 0 && (
          <div className="askmax-prompts">
            <p className="askmax-label">{t.ai.quickPrompts}</p>
            {prompts.map(p => <button key={p} type="button" className="askmax-prompt" onClick={() => void send(p)}>{p}</button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`askmax-msg askmax-msg-${m.role}${m.failed ? ' askmax-msg-failed' : ''}`}>
            <p className="askmax-text">{m.content}</p>
            {m.links && m.links.length > 0 && (
              <ul className="askmax-links">
                {m.links.map(l => <li key={l.href}><Link href={l.href} onClick={onNavigate}>{l.label}</Link></li>)}
              </ul>
            )}
            {m.role === 'assistant' && m.phrased && m.facts && m.facts.length > 0 && (
              <details className="askmax-facts">
                <summary>{t.ai.facts}</summary>
                <ul>{m.facts.map((f, n) => <li key={n}>{f}</li>)}</ul>
              </details>
            )}
            {m.role === 'assistant' && !m.phrased && m.facts && m.facts.length > 1 && (
              <ul className="askmax-factlist">{m.facts.slice(1).map((f, n) => <li key={n}>{f}</li>)}</ul>
            )}
          </div>
        ))}
        {loading && <div className="askmax-msg askmax-msg-assistant"><p className="askmax-thinking">{t.ai.thinking}</p></div>}
        <div ref={end} />
      </div>
      <form className="askmax-compose" onSubmit={e => { e.preventDefault(); submit() }}>
        <label className="visually-hidden" htmlFor="askmax-input">{t.ai.inputPlaceholder}</label>
        <textarea id="askmax-input" ref={field} value={input} rows={1} maxLength={500} enterKeyHint="send"
          placeholder={t.ai.inputPlaceholder} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} />
        <button type="submit" className="askmax-send" disabled={loading || !input.trim()} aria-label={t.ai.send}><Icon name="send" size="md" /></button>
      </form>
    </div>
  )
}
