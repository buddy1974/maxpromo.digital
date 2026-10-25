'use client'
/**
 * Universal Max — one conversation, two homes (ADR-0029): the Max tab on a phone (/os/ask) and the
 * slide-over on a desktop. The state lives here, above the routes, so moving between screens keeps
 * it; the surface itself (MaxSurface) is loaded only when Max is opened.
 *
 * Screens tell Max where Marcel is with useMaxScreenContext (the client on a client page, the open
 * conversation or the selection in the Inbox, the invoice or quote on screen). That context follows
 * Marcel into the Max tab, is shown as a removable chip, and ends when he opens another screen.
 * The server checks every id; the screen only says what is shown.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useOsLocale } from '@/lib/os-i18n/context'

export interface MaxScreenContext {
  client_id?: string; lead_id?: string; invoice_id?: string; angebot_id?: string; thread_id?: string; selected_thread_ids?: string[]
  /** What the chip says, e.g. the client's name or the conversation's subject. */
  label?: string
}
export interface MaxEnvelopeState extends MaxScreenContext { route: string }

export interface ProposalView {
  id: string; type: string; title: string; summary: string; status: string; confirmation: string; capability: string; payloadHash: string
  grounded: {
    state: 'ready' | 'needs_input' | 'blocked'; title: string
    rows: { label: string; value: string; before?: string; tone?: 'warn' | 'muted' }[]
    body?: { label: string; text: string }; warnings: string[]; missing: string[]
    choice?: { field: string; prompt: string; options: { id: string; label: string; hint?: string; href?: string }[]; allowNone?: string }
    links?: { label: string; href: string }[]; tick?: { key: string; label: string }
    editable: { key: string; label: string; kind: 'text' | 'textarea' | 'email' | 'date' | 'amount' | 'select'; value: string }[]
  }
  approval?: { summary: string; preview: [string, string][]; payloadHash: string; expiresAt: string }
  result?: { summary: string; links: { label: string; href: string }[]; error?: boolean }
  /** Delegated agent work (ADR-0030). Every word is made by the server in the screen language. */
  work?: {
    id: string; state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'; stateLabel: string; open: boolean
    lead: { label: string; href: string }
    outcome?: { score: string; confidence: string; qualified: boolean; qualifiedLabel: string }
    evidence: { kind: string; text: string; quote: string; url: string }[]; evidenceLabel: string
    recommendation?: { code: string; text: string }; warning?: string
    failure?: { text: string; retryable: boolean }
    offer?: { label: string; done: boolean }
    footnote: string
  }
  createdAt: string
}
export interface InteractionView {
  id: string; createdAt: string; input: string; inputKind: string; file: { name: string; type: string; size: number } | null
  context: Record<string, unknown>; outcome: 'answer' | 'proposals' | 'clarify' | 'refused' | 'failed'
  reply: { text?: string; facts?: string[]; links?: { label: string; href: string }[]; phrased?: boolean; notes?: string[] }
  proposals: ProposalView[]
  /** Local only: shown while the request runs, or when it failed before reaching the server. */
  pending?: boolean; failed?: string
}
export type ProposalDecision =
  | { action: 'edit'; edits: Record<string, unknown> } | { action: 'choose'; choice: string } | { action: 'reject' }
  | { action: 'confirm'; payload_hash: string } | { action: 'approve'; payload_hash: string } | { action: 'follow' }

interface MaxValue {
  entries: InteractionView[]; loading: boolean; historyLoaded: boolean; voice: 'server' | 'browser' | null
  envelope: MaxEnvelopeState | null; clearEnvelope: () => void
  setScreenContext: (c: MaxScreenContext | null) => void
  send: (input: { text: string; file?: File | null; inputKind?: 'text' | 'voice' | 'file' }) => Promise<void>
  decide: (proposalId: string, d: ProposalDecision) => Promise<{ ok: boolean; error?: string }>
  /** Re-read one proposal from the server (a card following its delegated work). */
  refresh: (proposalId: string) => Promise<void>
  loadHistory: () => void
  panelOpen: boolean; scanRequested: boolean
  openMax: (opts?: { scan?: boolean }) => void; closePanel: () => void; consumeScan: () => void
}
const MaxContext = createContext<MaxValue | null>(null)

export function MaxProvider({ children }: { children: React.ReactNode }) {
  const { locale, t } = useOsLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [entries, setEntries] = useState<InteractionView[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [voice, setVoice] = useState<'server' | 'browser' | null>(null)
  const [envelope, setEnvelope] = useState<MaxEnvelopeState | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [scanRequested, setScanRequested] = useState(false)
  const historyStarted = useRef(false)

  /* The screen's context ends when Marcel opens another screen (the Max tab itself keeps it). */
  const [seenPath, setSeenPath] = useState(pathname)
  if (seenPath !== pathname) {
    setSeenPath(pathname)
    if (envelope && pathname !== '/os/ask' && envelope.route !== pathname) setEnvelope(null)
  }

  const setScreenContext = useCallback((c: MaxScreenContext | null) => {
    setEnvelope(c ? { ...c, route: window.location.pathname } : null)
  }, [])

  const loadHistory = useCallback(() => {
    if (historyStarted.current) return
    historyStarted.current = true
    fetch('/api/os/max', { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) return
        const d = await r.json() as { history: InteractionView[]; voice: 'server' | 'browser' }
        setVoice(d.voice)
        setEntries(prev => [...d.history.filter(h => !prev.some(p => p.id === h.id)), ...prev])
      })
      .catch(() => undefined)
      .finally(() => setHistoryLoaded(true))
  }, [])

  const send = useCallback(async ({ text, file, inputKind = 'text' }: { text: string; file?: File | null; inputKind?: 'text' | 'voice' | 'file' }) => {
    const input = text.trim().slice(0, 4000)
    if (!input && !file) return
    const localId = `local-${Date.now()}`
    setEntries(prev => [...prev, { id: localId, createdAt: new Date().toISOString(), input, inputKind, file: file ? { name: file.name, type: file.type, size: file.size } : null, context: {}, outcome: 'answer', reply: {}, proposals: [], pending: true }])
    setLoading(true)
    const form = new FormData()
    form.set('text', input)
    form.set('input_kind', inputKind)
    form.set('locale', locale)
    if (envelope) {
      const { label: _label, ...ids } = envelope
      void _label
      form.set('context', JSON.stringify(ids))
    } else form.set('context', JSON.stringify({ route: window.location.pathname }))
    if (file) form.set('file', file)
    try {
      const res = await fetch('/api/os/max', { method: 'POST', body: form })
      if (res.status === 401) throw new Error(t.shell.sessionExpired)
      if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? '')
      const view = await res.json() as InteractionView
      setEntries(prev => prev.map(e => (e.id === localId ? view : e)))
      if (view.proposals.some(p => p.status === 'done')) window.dispatchEvent(new Event('os:changed'))
    } catch (e) {
      setEntries(prev => prev.map(x => (x.id === localId ? { ...x, pending: false, failed: e instanceof Error && e.message ? e.message : 'unavailable' } : x)))
    } finally { setLoading(false) }
  }, [envelope, locale, t])

  const decide = useCallback(async (proposalId: string, d: ProposalDecision) => {
    try {
      const res = await fetch('/api/os/max/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposal_id: proposalId, locale, ...d }) })
      const body = await res.json().catch(() => null) as { proposal?: ProposalView; error?: string; code?: string } | null
      if (body?.proposal && d.action === 'follow') {
        /* A follow-up is a NEW card under the research card; the research card shows it was offered. */
        const added = body.proposal
        setEntries(prev => prev.map(e => (e.proposals.some(p => p.id === proposalId) && !e.proposals.some(p => p.id === added.id)
          ? { ...e, proposals: [...e.proposals.map(p => (p.id === proposalId && p.work?.offer ? { ...p, work: { ...p.work, offer: { ...p.work.offer, done: true } } } : p)), added] }
          : e)))
        return { ok: true }
      }
      if (body?.proposal) {
        const updated = body.proposal
        setEntries(prev => prev.map(e => ({ ...e, proposals: e.proposals.map(p => (p.id === updated.id ? updated : p)) })))
        if (updated.status === 'done') window.dispatchEvent(new Event('os:changed'))
        return { ok: true }
      }
      /* "Something changed": fetch the re-grounded proposal so the card shows the new preview. */
      if (body?.code === 'changed' || body?.code === 'expired') {
        historyStarted.current = false
        const r = await fetch('/api/os/max', { cache: 'no-store' })
        if (r.ok) {
          const h = await r.json() as { history: InteractionView[] }
          const fresh = h.history.flatMap(e => e.proposals).find(p => p.id === proposalId)
          if (fresh) setEntries(prev => prev.map(e => ({ ...e, proposals: e.proposals.map(p => (p.id === proposalId ? fresh : p)) })))
        }
        historyStarted.current = true
      }
      return { ok: false, error: body?.error ?? String(res.status) }
    } catch { return { ok: false, error: 'unavailable' } }
  }, [locale])

  const refresh = useCallback(async (proposalId: string) => {
    try {
      const res = await fetch(`/api/os/max/proposals?id=${encodeURIComponent(proposalId)}&locale=${locale}`, { cache: 'no-store' })
      if (!res.ok) return
      const { proposal } = await res.json() as { proposal?: ProposalView }
      if (!proposal) return
      setEntries(prev => prev.map(e => ({ ...e, proposals: e.proposals.map(p => (p.id === proposal.id ? proposal : p)) })))
      if (proposal.work && !proposal.work.open) window.dispatchEvent(new Event('os:changed'))
    } catch { /* the next poll tries again */ }
  }, [locale])

  const openMax = useCallback((opts?: { scan?: boolean }) => {
    if (opts?.scan) setScanRequested(true)
    if (window.matchMedia('(max-width: 899px)').matches) router.push('/os/ask')
    else setPanelOpen(true)
  }, [router])

  useEffect(() => { if (pathname === '/os/ask') setPanelOpen(false) }, [pathname])

  const value = useMemo<MaxValue>(() => ({
    entries, loading, historyLoaded, voice, envelope, clearEnvelope: () => setEnvelope(null), setScreenContext, send, decide, refresh, loadHistory,
    panelOpen, scanRequested, openMax, closePanel: () => setPanelOpen(false), consumeScan: () => setScanRequested(false),
  }), [entries, loading, historyLoaded, voice, envelope, setScreenContext, send, decide, refresh, loadHistory, panelOpen, scanRequested, openMax])
  return <MaxContext.Provider value={value}>{children}</MaxContext.Provider>
}

export function useMax(): MaxValue {
  const v = useContext(MaxContext)
  if (!v) throw new Error('useMax() must be used within <MaxProvider>')
  return v
}

/** A screen tells Max what it shows. Pass null (or nothing selected) to say nothing. */
export function useMaxScreenContext(c: MaxScreenContext | null) {
  const { setScreenContext } = useMax()
  const key = c ? JSON.stringify(c) : ''
  useEffect(() => {
    setScreenContext(key ? JSON.parse(key) as MaxScreenContext : null)
  }, [key, setScreenContext])
}
