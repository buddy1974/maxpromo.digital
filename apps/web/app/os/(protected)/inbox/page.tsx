'use client'
/**
 * Email OS (ADR-0023): conversation → business context → actions.
 *
 * Views on the left (work, business, mailbox), conversations in the middle, the open conversation
 * with its business context on the right. On a phone one pane shows at a time. The view and the
 * open conversation live in the URL, so a reload or a shared link returns to the same place.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MAIL_COPY, localizeFailure } from '@/lib/os-i18n/mail'
import { VIEW_GROUPS, inView, isView, sortForView, viewCounts, type MailThread, type View } from '@/lib/mail/views'
import { resultData, runMail } from '@/lib/mail/client'
import type { ThreadContext } from '@/lib/mail/context'
import type { FamilyId } from '@/lib/mail/identity/families'
import { MailList } from '@/components/os/mail/MailList'
import { ConversationView, type MailMessage, type ReplyMode } from '@/components/os/mail/ConversationView'
import { ContextPanel, type Analysis } from '@/components/os/mail/ContextPanel'
import { Composer, type ComposerInit } from '@/components/os/mail/Composer'
import './mail.css'

interface DraftRow { id: string; mode: ComposerInit['mode']; source_message_id: string | null; to_addrs: string[]; cc_addrs: string[]; bcc_addrs: string[]; subject: string; body: string; family: FamilyId; language: 'de' | 'en'; entity_kind: ComposerInit['entityKind']; entity_id: string | null; follow_up_days: number | null; revision: number }
interface Detail { thread: MailThread; messages: MailMessage[]; context: ThreadContext | null; draft: DraftRow | null; providerCheck: boolean; sending: boolean }
const MAILBOX = 'info@maxpromo.digital'
const GERMAN = /\b(und|nicht|bitte|vielen|danke|ich|wir|sie|ihre|ihnen|mit|für|eine?n?|sehr geehrte|grüße|hallo)\b/i

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function InboxPage() {
  const { locale, intlLocale } = useOsLocale()
  const copy = MAIL_COPY[locale]
  const params = useSearchParams()
  const [threads, setThreads] = useState<MailThread[]>([])
  const [meta, setMeta] = useState({ configured: true, providerCheck: false, sending: false, today: new Date().toISOString().slice(0, 10) })
  // The view and the open conversation start from the URL (a reload or a link from attention).
  const [view, setView] = useState<View>(() => { const v = params.get('view'); return isView(v) ? v : 'inbox' })
  const [selected, setSelected] = useState<string | null>(() => { const t = params.get('thread'); return t && UUID.test(t) ? t : null })
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailError, setDetailError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const [composer, setComposer] = useState<ComposerInit | null>(null)
  const [analysis, setAnalysis] = useState<Record<string, Analysis>>({})
  const [analysisState, setAnalysisState] = useState<'idle' | 'working' | 'error'>('idle')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (view === 'inbox') p.delete('view'); else p.set('view', view)
    if (selected) p.set('thread', selected); else p.delete('thread')
    const next = `${window.location.pathname}${p.size ? `?${p}` : ''}`
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next)
  }, [view, selected])

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      setLoading(true); setError(false)
      try {
        const r = await fetch(`/api/os/mail?q=${encodeURIComponent(search)}`, { signal: controller.signal, cache: 'no-store' })
        if (!r.ok) throw new Error('mail_unavailable')
        const data = await r.json() as { threads: MailThread[]; configured: boolean; providerCheck?: boolean; sending?: boolean; today?: string }
        if (!Array.isArray(data.threads)) throw new Error('invalid')
        setThreads(data.threads)
        setMeta(m => ({ configured: data.configured, providerCheck: data.providerCheck === true, sending: data.sending === true, today: data.today ?? m.today }))
      } catch { if (!controller.signal.aborted) setError(true) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    })()
    return () => controller.abort()
  }, [search, revision])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    void (async () => {
      setDetailError(false)
      try {
        const r = await fetch(`/api/os/mail?thread=${encodeURIComponent(selected)}`, { signal: controller.signal, cache: 'no-store' })
        if (!r.ok) throw new Error('mail_unavailable')
        const data = await r.json() as Detail
        if (!data.thread || !Array.isArray(data.messages)) throw new Error('invalid')
        setDetail(data)
        // Opening a conversation reads it. Local to Maxpromo OS; Hostinger is not changed.
        if (data.thread.unread && !data.thread.quarantine) {
          void runMail('email.state', { thread_id: selected, action: 'mark_read' }).then(res => {
            if (res.status !== 'done') return
            setThreads(list => list.map(t => (t.id === selected ? { ...t, unread: false } : t)))
            setDetail(d => (d && d.thread.id === selected ? { ...d, thread: { ...d.thread, unread: false } } : d))
          })
        }
      } catch { if (!controller.signal.aborted) setDetailError(true) }
    })()
    return () => controller.abort()
  }, [selected, revision])

  // Only the detail of the conversation that is open now; a stale one is never shown.
  const shown = detail && selected && detail.thread.id === selected ? detail : null
  const counts = useMemo(() => viewCounts(threads), [threads])
  const visible = useMemo(() => sortForView(threads.filter(t => inView(t, view)), view), [threads, view])

  const act = useCallback(async (capability: string, input: Record<string, unknown>, after?: () => void) => {
    setBusy(true); setNotice(null)
    try {
      const r = await runMail(capability, input)
      if (r.status !== 'done') { setNotice({ text: localizeFailure(r, copy), error: true }); return false }
      setNotice({ text: r.result?.summary ?? copy.actions.done, error: false })
      after?.()
      setRevision(n => n + 1)
      return true
    } catch { setNotice({ text: copy.actions.failed, error: true }); return false }
    finally { setBusy(false) }
  }, [copy])

  function openReply(mode: ReplyMode) {
    if (!shown) return
    const { thread, messages, context, draft } = shown
    if (draft && draft.mode === mode) return setComposer(fromDraft(draft, thread.id))
    const source = [...messages].reverse().find(m => m.direction !== 'outbound') ?? messages[messages.length - 1]
    const others = source ? [...source.recipients, ...source.cc].filter(a => a !== MAILBOX && a !== source.sender) : []
    const replyTo = source?.direction === 'outbound' ? source.recipients : source ? [source.sender] : []
    const text = source ? (source.body_state === 'preview' ? source.preview_text ?? '' : source.body_text) : ''
    const subject = thread.subject || ''
    setComposer({
      mode, threadId: thread.id, sourceMessageId: source?.id ?? null,
      to: mode === 'forward' ? [] : replyTo.filter(a => !a.endsWith('.invalid')),
      cc: mode === 'reply_all' ? others : [], bcc: [],
      subject: mode === 'forward' ? (/^(fwd?|wg):/i.test(subject) ? subject : `Fwd: ${subject}`) : (/^(re|aw):/i.test(subject) ? subject : `Re: ${subject}`),
      body: '', family: mode === 'forward' ? 'reply' : context?.potentialLead ? 'enquiry_response' : 'reply',
      language: GERMAN.test(`${subject} ${text}`) ? 'de' : 'en',
      entityKind: context?.lead?.confirmed ? 'lead' : context?.client?.confirmed ? 'client' : null,
      entityId: context?.lead?.confirmed ? context.lead.id : context?.client?.confirmed ? context.client.id : null,
      recipientName: context?.lead?.name ?? context?.client?.name ?? null, company: context?.lead?.company ?? context?.client?.company ?? null,
    })
  }
  function fromDraft(d: DraftRow, threadId: string | null): ComposerInit {
    return { draftId: d.id, revision: d.revision, mode: d.mode, threadId, sourceMessageId: d.source_message_id, to: d.to_addrs, cc: d.cc_addrs, bcc: d.bcc_addrs, subject: d.subject, body: d.body, family: d.family, language: d.language, entityKind: d.entity_kind, entityId: d.entity_id, followUpDays: d.follow_up_days }
  }

  async function analyze() {
    if (!shown) return
    const id = shown.thread.id
    setAnalysisState('working')
    const r = await runMail('email.assist', { mode: 'analyze', thread_id: id, language: locale })
    const data = resultData<Analysis>(r)
    if (data) { setAnalysis(a => ({ ...a, [id]: data })); setAnalysisState('idle') } else { setAnalysisState('error'); setNotice({ text: localizeFailure(r, copy, true), error: true }) }
  }

  const select = (id: string) => { setNotice(null); setAnalysisState('idle'); setDetail(d => (d?.thread.id === id ? d : null)); setSelected(id) }
  const groups = Object.entries(VIEW_GROUPS) as [keyof typeof VIEW_GROUPS, readonly View[]][]

  return (
    <div className={`mail-shell${selected ? ' has-selection' : ''}`}>
      <header className="mail-top">
        <div>
          <h1 className="mail-title">{copy.title}</h1>
          <p className="mail-note">{copy.mailbox}</p>
        </div>
        <form className="mail-search" role="search" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); setSelected(null) }}>
          <label htmlFor="mail-search" className="sr-only">{copy.search}</label>
          <input id="mail-search" type="search" className="input" maxLength={200} value={query} placeholder={copy.searchPlaceholder} onChange={e => setQuery(e.target.value)} />
          <button type="submit" className="btn-secondary btn-sm">{copy.search}</button>
        </form>
        <div className="mail-top-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => setRevision(n => n + 1)}>{copy.refresh}</button>
          <button type="button" className="btn-primary btn-sm" onClick={() => setComposer({ mode: 'new', to: [], cc: [], bcc: [], subject: '', body: '', family: 'outreach', language: locale })}>{copy.compose}</button>
        </div>
      </header>
      {!meta.configured && <p className="mail-banner">{copy.disconnected}</p>}

      <nav className="mail-views" aria-label={copy.title}>
        {groups.map(([group, items]) => (
          <div key={group} className="mail-view-group">
            <p className="mail-view-group-title">{copy.groups[group]}</p>
            {items.map(item => (
              <button key={item} type="button" aria-pressed={view === item} className={`mail-view${view === item ? ' is-active' : ''}`} onClick={() => { setView(item); setSelected(null) }}>
                <span>{copy.views[item]}</span>{counts[item] > 0 && <span className="mail-count">{counts[item]}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <section className="mail-list-pane" aria-label={copy.views[view]} aria-busy={loading}>
        <p className="mail-list-head"><span className="mail-strong">{copy.views[view]}</span> <span className="mail-note">· {copy.count({ n: visible.length })}</span></p>
        <p className="mail-note mail-list-hint">{copy.viewHint[view]}</p>
        {loading && !threads.length ? <p role="status" className="mail-empty">{copy.loading}</p>
          : error ? <p role="alert" className="mail-empty">{copy.error}</p>
            : visible.length === 0 ? <p className="mail-empty">{copy.emptyHint[view] ?? copy.empty}</p>
              : <MailList threads={visible} selectedId={selected} copy={copy} intlLocale={intlLocale} today={meta.today} onSelect={select} />}
      </section>

      <section className="mail-detail-pane" aria-live="polite">
        {notice && <p role={notice.error ? 'alert' : 'status'} className={`mail-notice${notice.error ? ' is-alert' : ''}`}>{notice.text}</p>}
        {!selected ? <p className="mail-empty mail-select">{copy.select}</p>
          : detailError ? <p role="alert" className="mail-empty">{copy.error}</p>
            : !shown ? <p role="status" className="mail-empty">{copy.loading}</p>
              : <div className="mail-detail">
                <ConversationView thread={shown.thread} messages={shown.messages} copy={copy} intlLocale={intlLocale} providerCheck={shown.providerCheck} busy={busy}
                  onBack={() => setSelected(null)}
                  onReply={openReply}
                  onState={action => void act('email.state', { thread_id: shown.thread.id, action }, action === 'archive' ? () => setSelected(null) : undefined)}
                  onSpam={(verdict, block) => void act('email.spam', { thread_id: shown.thread.id, verdict, ...(block ? { block_sender: true } : {}) }, () => setSelected(null))} />
                {shown.context && (
                  <ContextPanel key={shown.thread.id} context={shown.context} copy={copy} locale={locale} intlLocale={intlLocale} today={meta.today} busy={busy}
                    analysis={analysis[shown.thread.id] ?? null} analysisState={analysisState} onAnalyze={() => void analyze()}
                    onFollowUp={input => void act('email.followup', { thread_id: shown.thread.id, ...input })}
                    onSaveLead={input => void act('email.save_lead', { thread_id: shown.thread.id, ...input })}
                    onLink={(kind, id) => void act('email.link', { thread_id: shown.thread.id, entity_kind: kind, entity_id: id })}
                    onOpenThread={select} />
                )}
              </div>}
      </section>

      {composer && <Composer init={composer} copy={copy} sending={meta.sending} onClose={changed => { setComposer(null); if (changed) setRevision(n => n + 1) }}
        onSent={summary => { setComposer(null); setNotice({ text: summary, error: false }); setRevision(n => n + 1) }} />}
    </div>
  )
}
