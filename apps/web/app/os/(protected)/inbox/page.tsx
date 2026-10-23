'use client'

import { useEffect, useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'
import { UNKNOWN_SENDER } from '@/lib/mail/normalization'

interface MailThread {
  id: string; subject: string; classification: string; needs_reply: boolean; waiting: boolean
  archived: boolean; trashed: boolean; updated_at: string; sender: string; preview?: string | null; unread: boolean; business_label?: string; business_kind?: 'client' | 'lead' | 'project'
}
interface MailMessage {
  id: string; sender: string; recipients: string[]; cc: string[]; subject: string; body_text: string
  received_at: string; is_read: boolean; body_state?: string; preview_text?: string
  attachments: { id: string; filename: string; size: number; contentType: string }[]
}
type Filter = 'inbox' | 'unread' | 'needs_reply' | 'waiting' | 'client' | 'lead' | 'billing' | 'system' | 'archived'
const filters: Filter[] = ['inbox', 'unread', 'needs_reply', 'waiting', 'client', 'lead', 'billing', 'system', 'archived']
const labels = {
  en: { inbox: 'Inbox', unread: 'Unread', needs_reply: 'Needs reply', waiting: 'Waiting', client: 'Clients', lead: 'Leads', billing: 'Billing', system: 'System', archived: 'Archived', search: 'Search mail', refresh: 'Refresh', loading: 'Loading mail…', error: 'Mail could not be loaded. Try again.', empty: 'No matching conversations.', disconnected: 'Mailbox not connected', connection: 'Hostinger activation is pending. Stored conversations remain available below.', select: 'Select a conversation to read messages and business context.', back: 'Back to conversations', from: 'From', to: 'To', cc: 'Cc', attachments: 'Attachments', metadata: 'Metadata only. Attachment downloads are not enabled.', safe: 'Plain text only. Remote images and active HTML are blocked.', noBody: 'No plain text body available.', context: 'Business context', unlinked: 'No verified business association', noSubject: '(No subject)', count: 'conversations', unknownSender: 'Unknown sender' },
  de: { inbox: 'Posteingang', unread: 'Ungelesen', needs_reply: 'Antwort nötig', waiting: 'Wartend', client: 'Kunden', lead: 'Leads', billing: 'Abrechnung', system: 'System', archived: 'Archiviert', search: 'E-Mails durchsuchen', refresh: 'Aktualisieren', loading: 'E-Mails werden geladen…', error: 'E-Mails konnten nicht geladen werden. Bitte erneut versuchen.', empty: 'Keine passenden Konversationen.', disconnected: 'Postfach nicht verbunden', connection: 'Die Hostinger-Aktivierung steht aus. Gespeicherte Konversationen bleiben unten verfügbar.', select: 'Konversation auswählen, um Nachrichten und Geschäftskontext zu lesen.', back: 'Zurück zu Konversationen', from: 'Von', to: 'An', cc: 'Cc', attachments: 'Anhänge', metadata: 'Nur Metadaten. Downloads sind noch nicht aktiviert.', safe: 'Nur Klartext. Externe Bilder und aktives HTML sind blockiert.', noBody: 'Kein Klartext verfügbar.', context: 'Geschäftskontext', unlinked: 'Keine bestätigte Geschäftszuordnung', noSubject: '(Kein Betreff)', count: 'Konversationen', unknownSender: 'Unbekannter Absender' },
}
function matches(thread: MailThread, filter: Filter): boolean {
  if (thread.trashed) return false
  if (filter === 'archived') return thread.archived
  if (thread.archived) return false
  if (filter === 'inbox') return true
  if (filter === 'unread') return thread.unread
  if (filter === 'needs_reply') return thread.needs_reply
  if (filter === 'waiting') return thread.waiting
  if (filter === 'client' || filter === 'lead') return thread.business_kind === filter
  return thread.classification === filter
}

export default function InboxPage() {
  const { locale, intlLocale } = useOsLocale()
  const c = labels[locale]
  const actions = locale === 'de' ? { draft: 'Entwurf vorbereiten', body: 'Antwortentwurf', read: 'Als gelesen markieren', unread: 'Als ungelesen markieren', local: 'Nur intern in Maxpromo OS. Hostinger wird nicht geändert. Es wird nichts gesendet.', working: 'Wird gespeichert…', error: 'Aktion konnte nicht abgeschlossen werden.', saved: 'Intern gespeichert. Nichts gesendet.' } : { draft: 'Prepare draft', body: 'Reply draft', read: 'Mark read', unread: 'Mark unread', local: 'Local to Maxpromo OS. Hostinger is unchanged. Nothing will be sent.', working: 'Saving…', error: 'Action could not be completed.', saved: 'Saved locally. Nothing sent.' }
  const [threads, setThreads] = useState<MailThread[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<Filter>('inbox')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ thread: MailThread; messages: MailMessage[] } | null>(null)
  const [detailError, setDetailError] = useState(false)
  const [draftBody, setDraftBody] = useState({ threadId: '', body: '' })
  const [actionPending, setActionPending] = useState(false)
  const [actionResult, setActionResult] = useState<{ threadId: string; text: string; error: boolean } | null>(null)

  async function runLocalAction(capability: 'email.draft' | 'email.state', input: Record<string, string>) {
    if (!selected || actionPending) return
    const threadId = selected
    setActionPending(true)
    setActionResult(null)
    try {
      const response = await fetch('/api/os/mail/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({ action: 'run', requestId: crypto.randomUUID(), capability, input: { ...input, thread_id: threadId } }),
      })
      if (!response.ok) throw new Error('mail_action_failed')
      const result: { status: string; result?: { summary?: string; lines?: string[] } } = await response.json()
      const done = result.status === 'done'
      setActionResult({ threadId, error: !done, text: done ? [actions.saved, result.result?.summary, ...(result.result?.lines ?? [])].filter(Boolean).join('\n') : actions.error })
      if (done) setRevision(value => value + 1)
    } catch {
      setActionResult({ threadId, error: true, text: actions.error })
    } finally {
      setActionPending(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch(`/api/os/mail?q=${encodeURIComponent(search)}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('mail_unavailable')
        const data: { threads: MailThread[]; configured: boolean } = await response.json()
        if (!Array.isArray(data.threads)) throw new Error('invalid_mail_response')
        setThreads(data.threads)
        setConfigured(data.configured)
      } catch {
        if (!controller.signal.aborted) setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [search, revision])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    async function load() {
      setDetail(null)
      setDetailError(false)
      try {
        const response = await fetch(`/api/os/mail?thread=${encodeURIComponent(selected!)}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('mail_unavailable')
        const data: { thread: MailThread; messages: MailMessage[] } = await response.json()
        if (!data.thread || !Array.isArray(data.messages)) throw new Error('invalid_mail_response')
        setDetail(data)
      } catch {
        if (!controller.signal.aborted) setDetailError(true)
      }
    }
    void load()
    return () => controller.abort()
  }, [selected, revision])

  function timestamp(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short' })
  }
  const visible = threads.filter(thread => matches(thread, filter))
  const button = 'btn-secondary btn-sm'

  return (
    <div className="min-w-0 p-4 text-[var(--brand-text)]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="font-semibold ">{c.inbox}</h1><p className="mt-2 text-sm text-[var(--brand-text-secondary)]">info@maxpromo.digital</p></div>
        <button type="button" className={button} onClick={() => setRevision(value => value + 1)}>{c.refresh}</button>
      </header>
      {configured === false && <aside className="mb-4 border border-[var(--brand-border)] bg-[var(--brand-surface-subtle)] p-4"><p className="font-medium">{c.disconnected}</p><p className="mt-1 text-sm text-[var(--brand-text-secondary)]">{c.connection}</p></aside>}
      <form className="mb-4 flex gap-2" onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setSelected(null) }}>
        <label htmlFor="mail-search" className="sr-only">{c.search}</label>
        <input id="mail-search" type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} placeholder={c.search} className="input min-w-0 flex-1" />
        <button className={button} type="submit">{c.search}</button>
      </form>
      <nav aria-label={c.inbox} className="mb-4 flex flex-wrap gap-2">{filters.map(item => <button key={item} type="button" aria-pressed={filter === item} onClick={() => { setFilter(item); setSelected(null) }} className={`${filter === item ? 'btn-primary btn-sm' : button}`}>{c[item]}</button>)}</nav>
      <div className="grid min-w-0 border border-[var(--brand-border)] lg:grid-cols-2">
        <section aria-label={c.inbox} aria-busy={loading} className={`${selected ? 'hidden lg:block' : ''} min-w-0`}>
          <p className="border-b border-[var(--brand-border)] p-4 text-xs text-[var(--brand-text-secondary)]">{visible.length} {c.count}</p>
          {loading ? <p role="status" className="p-4 text-sm">{c.loading}</p> : error ? <p role="alert" className="p-4 text-sm">{c.error}</p> : visible.length === 0 ? <p className="p-4 text-sm text-[var(--brand-text-secondary)]">{c.empty}</p> : visible.map(thread => (
            <button key={thread.id} type="button" aria-pressed={selected === thread.id} onClick={() => { setDetail(null); setDetailError(false); setSelected(thread.id) }} className={`block w-full min-w-0 border-b border-[var(--brand-border)] p-4 text-left ${selected === thread.id ? 'bg-[var(--brand-surface-subtle)]' : ''}`}>
              <div className="flex items-center gap-2">{thread.unread && <span className="text-xs font-semibold">{c.unread}</span>}<span className="truncate text-sm font-semibold">{thread.sender === UNKNOWN_SENDER ? c.unknownSender : thread.sender}</span></div>
              <p className="mt-2 break-words text-sm">{thread.subject || c.noSubject}</p>
              {thread.preview && <p className="mt-1 line-clamp-2 break-words text-xs text-[var(--brand-text-secondary)] wrap-anywhere">{thread.preview}</p>}
              {thread.business_label && <p className="mt-2 truncate text-xs text-[var(--brand-text-secondary)]">{thread.business_label}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--brand-text-secondary)]"><time dateTime={thread.updated_at}>{timestamp(thread.updated_at)}</time><span>{thread.classification}</span>{thread.needs_reply && <span className="font-semibold">{c.needs_reply}</span>}{thread.waiting && <span>{c.waiting}</span>}</div>
            </button>
          ))}
        </section>
        <section aria-label={c.context} aria-live="polite" className={`${selected ? '' : 'hidden lg:block'} min-w-0 p-4`}>
          {!selected ? <p className="p-4 text-sm text-[var(--brand-text-secondary)]">{c.select}</p> : <>
            <div className="mb-4 lg:hidden"><button type="button" className={button} onClick={() => setSelected(null)}>{c.back}</button></div>
            {detailError ? <p role="alert">{c.error}</p> : !detail ? <p role="status">{c.loading}</p> : <>
              <h2 className="break-words font-semibold">{detail.thread.subject || c.noSubject}</h2>
              <p className="mt-3 text-sm text-[var(--brand-text-secondary)]">{c.context}: {detail.thread.business_label || c.unlinked}</p>
              <p className="my-4  text-xs text-[var(--brand-text-secondary)]">{c.safe}</p>
              <div className="mb-4 border border-[var(--brand-border)] p-4">
                <p className="mb-4 text-xs text-[var(--brand-text-secondary)]">{actions.local}</p>
                <button className={button} disabled={actionPending} type="button" onClick={() => void runLocalAction('email.state', { action: detail.thread.unread ? 'mark_read' : 'mark_unread' })}>{actionPending ? actions.working : detail.thread.unread ? actions.read : actions.unread}</button>
                <form className="mt-4" onSubmit={event => { event.preventDefault(); const body = draftBody.threadId === selected ? draftBody.body.trim() : ''; if (body) void runLocalAction('email.draft', { body }) }}>
                  <label htmlFor="email-draft" className="mb-2 block text-sm font-medium">{actions.body}</label>
                  <textarea id="email-draft" value={draftBody.threadId === selected ? draftBody.body : ''} onChange={event => setDraftBody({ threadId: selected, body: event.target.value })} rows={5} maxLength={3000} required className="textarea min-w-0" />
                  <button type="submit" className={`${button} mt-3 `} disabled={actionPending || draftBody.threadId !== selected || !draftBody.body.trim()}>{actionPending ? actions.working : actions.draft}</button>
                </form>
              </div>
              {detail.messages.map(message => <article key={message.id} className="mb-4 border border-[var(--brand-border)] p-4">
                <dl className="space-y-2 break-words text-xs text-[var(--brand-text-secondary)]"><div><dt className="inline font-semibold">{c.from}: </dt><dd className="inline">{message.sender === UNKNOWN_SENDER ? c.unknownSender : message.sender}</dd></div><div><dt className="inline font-semibold">{c.to}: </dt><dd className="inline">{message.recipients.join(', ')}</dd></div>{message.cc.length > 0 && <div><dt className="inline font-semibold">{c.cc}: </dt><dd className="inline">{message.cc.join(', ')}</dd></div>}</dl>
                <time className="mt-3 block text-xs text-[var(--brand-text-secondary)]" dateTime={message.received_at}>{timestamp(message.received_at)}</time>
                {message.body_state === 'preview' && <p className="mt-3 text-xs text-[var(--brand-text-secondary)]">{locale === 'de' ? 'Vorschau (max. 200 Zeichen). Vollständiger Inhalt noch nicht abgerufen.' : 'Preview (up to 200 characters). Full content has not been retrieved.'}</p>}
                <p className="mt-4 whitespace-pre-wrap break-words text-sm wrap-anywhere">{message.body_state === 'preview' ? message.preview_text || c.noBody : message.body_text || c.noBody}</p>
                {message.attachments.length > 0 && <div className="mt-4 border-t border-[var(--brand-border)] pt-4"><h3 className="text-sm font-semibold">{c.attachments}</h3><ul className="mt-2 space-y-2 text-xs">{message.attachments.map(attachment => <li key={attachment.id} className="break-words">{attachment.filename} · {Math.ceil(attachment.size / 1024)} KB · {attachment.contentType}</li>)}</ul><p className="mt-3 text-xs text-[var(--brand-text-secondary)]">{c.metadata}</p></div>}
              </article>)}
            </>}
            {actionResult?.threadId === selected && <p role={actionResult.error ? 'alert' : 'status'} className="mb-4 whitespace-pre-wrap break-words border border-[var(--brand-border)] p-4 text-sm">{actionResult.text}</p>}
          </>}
        </section>
      </div>
    </div>
  )
}
