'use client'
/**
 * The client page — "what is happening with this client?" Everything shown is a canonical record
 * linked here, never a copy: conversations open in the Inbox, quotes and invoices on their own
 * pages. Data comes from client.show; edits from ClientForm (client.update); archive / restore are
 * one confirmed step; a permanent delete is offered only for a client nothing points at, and goes
 * through an approval (client.delete, AMBER).
 */
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Icon } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'
import { CLIENTS_COPY } from '@/lib/os-i18n/clients'
import { ownerApi, failure } from '@/lib/commercial/ownerClient'
import { ClientForm, shrinkImage, type ClientRecord } from '@/components/os/clients/ClientForm'
import '@/components/os/clients/clients.css'

const api = ownerApi('/api/os/clients/actions')

interface Show {
  client: ClientRecord & { created_at: string }
  attention: { kind: string; label: string; ref: string; amount?: number; currency?: string }[]
  threads: { id: string; subject: string; needs_reply: boolean; last_at: string | null; confirmed: boolean }[]
  quotes: { id: string; number: string; status: string; total: number; currency: string }[]
  invoices: { id: string; number: string; status: string; total: number; paid: number; open: number; currency: string; due_date: string | null }[]
  payments: { id: string; amount: number; currency: string; received_on: string; method: string | null; invoice_number: string; invoice_id: string }[]
  jobs: { id: string; title: string; stage: string }[]
  leads: { id: string; label: string; status: string }[]
  followups: { id: string; due_on: string; reason: string }[]
  documents: { id: string; filename: string; mime_type: string; size_bytes: number; created_at: string }[]
  activity: { id: string; kind: string; summary: string; created_at: string; detail?: { changed?: string[] } }[]
  deletable: boolean
}

export default function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { locale, intlLocale, fmtDate: formatDate } = useOsLocale()
  const c = CLIENTS_COPY[locale]
  const [data, setData] = useState<Show | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState<null | 'archive' | 'delete'>(null)
  const [approval, setApproval] = useState<{ id: string; payloadHash: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const load = useCallback(() => api.run('client.show', { client_id: id }).then(r => {
    if (r.status === 'done' && r.result?.data) { setData(r.result.data as Show); setState('ready') }
    else setState(r.code === 'not_found' ? 'missing' : 'error')
  }).catch(() => setState('error')), [id])
  useEffect(() => { load() }, [load])

  async function act(capability: 'client.archive' | 'client.restore') {
    setBusy(true); setMessage('')
    const r = await api.run(capability, { client_id: id })
    setBusy(false); setConfirm(null)
    if (r.status !== 'done') { setMessage(failure(r)); return }
    await load()
  }

  async function prepareDelete() {
    setBusy(true); setMessage('')
    const r = await api.run('client.delete', { client_id: id })
    setBusy(false)
    if (r.status === 'approval_required' && r.approval) { setApproval({ id: r.approval.id, payloadHash: r.approval.payloadHash }); setConfirm('delete'); return }
    setConfirm(null)
    setMessage(r.status === 'done' ? (r.result?.summary ?? c.deleteBlocked) : failure(r))
  }

  async function executeDelete() {
    if (!approval) return
    setBusy(true)
    const r = await api.execute(approval.id, approval.payloadHash)
    setBusy(false)
    if (r.status === 'done') { router.push('/os/clients'); return }
    setMessage(failure(r)); setConfirm(null); setApproval(null)
  }

  async function cancelDelete() {
    if (approval) await api.reject(approval.id)
    setApproval(null); setConfirm(null)
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    setUploading(true); setMessage('')
    const body = new FormData()
    body.append('file', await shrinkImage(picked))
    const res = await fetch(`/api/os/clients/${id}/documents`, { method: 'POST', body })
    const out = await res.json().catch(() => ({})) as { duplicate?: boolean; error?: string }
    setUploading(false)
    if (!res.ok) { setMessage(out.error ?? c.failed); return }
    if (out.duplicate) setMessage(c.duplicateDocument)
    await load()
  }

  async function removeDocument(fileId: string) {
    if (!window.confirm(c.removeConfirm)) return
    const res = await fetch(`/api/os/clients/${id}/documents?file=${fileId}`, { method: 'DELETE' })
    if (!res.ok) setMessage(c.failed)
    await load()
  }

  if (state === 'loading') return <div className="client-page"><p className="clients-empty">{c.loading}</p></div>
  if (state !== 'ready' || !data) return <div className="client-page"><Link href="/os/clients" className="client-back">← {c.back}</Link><p className="clients-empty" role="alert">{state === 'missing' ? c.notFound : c.failed}</p></div>

  const cl = data.client
  const archived = Boolean(cl.archived_at)
  const money = (n: number, cur: string) => new Intl.NumberFormat(intlLocale, { style: 'currency', currency: cur || 'EUR' }).format(Number(n))
  const place = [cl.address, [cl.postcode, cl.city].filter(Boolean).join(' '), cl.country].filter(Boolean).join(', ')

  return (
    <div className="client-page">
      <Link href="/os/clients" className="client-back">← {c.back}</Link>
      <header className="client-head">
        <div className="client-head-main">
          <h1>{cl.company || cl.name}</h1>
          {cl.company && <p className="client-sub">{cl.name}</p>}
          <span className={`client-status ${archived ? 'is-archived' : 'is-active'}`}>{archived ? c.archived : c.active}</span>
        </div>
        <div className="client-head-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}><Icon name="edit" size="xs" /> {c.edit}</button>
          {archived
            ? <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => void act('client.restore')}>{c.restore}</button>
            : <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => setConfirm('archive')}>{c.archive}</button>}
          {data.deletable && <button type="button" className="btn-secondary btn-sm client-danger" disabled={busy} onClick={() => void prepareDelete()}>{c.delete}</button>}
        </div>
      </header>

      {archived && <p className="client-note">{c.archivedNote}</p>}
      {confirm === 'archive' && (
        <div className="client-confirm" role="alertdialog" aria-label={c.archive}>
          <p>{c.archiveConfirm}</p>
          <div className="client-row-actions">
            <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => void act('client.archive')}>{c.confirmArchive}</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirm(null)}>{c.cancel}</button>
          </div>
        </div>
      )}
      {confirm === 'delete' && approval && (
        <div className="client-confirm" role="alertdialog" aria-label={c.delete}>
          <p>{c.deleteConfirm}</p>
          <div className="client-row-actions">
            <button type="button" className="btn-primary btn-sm client-danger" disabled={busy} onClick={() => void executeDelete()}>{c.confirmDelete}</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void cancelDelete()}>{c.cancel}</button>
          </div>
        </div>
      )}
      {message && <p className="client-error" role="status">{message}</p>}

      <section className="client-card">
        <h2>{c.attention}</h2>
        {data.attention.length === 0 ? <p className="client-muted">{c.nothingOpen}</p> : (
          <ul className="client-list">
            {data.attention.map(a => (
              <li key={`${a.kind}:${a.ref}`}>
                <Link href={a.kind === 'reply' ? `/os/inbox?thread=${a.ref}` : a.kind === 'quote' ? `/os/angebote/${a.ref}` : ['overdue', 'unpaid'].includes(a.kind) ? `/os/invoices/${a.ref}` : a.kind === 'job' ? '/os/jobs' : `/os/clients/${id}`}>
                  <span className={`client-tag tag-${a.kind}`}>{c.attentionKind[a.kind] ?? a.kind}</span> {a.label}{a.amount !== undefined && ` · ${money(a.amount, a.currency ?? 'EUR')}`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="client-card">
        <h2>{c.identity}</h2>
        <dl className="client-facts">
          {cl.email && <div><dt>{c.email}</dt><dd><a href={`mailto:${cl.email}`}>{cl.email}</a></dd></div>}
          {cl.phone && <div><dt>{c.phone}</dt><dd><a href={`tel:${cl.phone.replace(/[^\d+]/g, '')}`}>{cl.phone}</a></dd></div>}
          {cl.website && <div><dt>{c.website}</dt><dd><a href={cl.website} target="_blank" rel="noopener noreferrer nofollow">{cl.website.replace(/^https?:\/\//, '')}</a></dd></div>}
          {place && <div><dt>{c.sectionAddress}</dt><dd>{place}</dd></div>}
          {cl.language && <div><dt>{c.language}</dt><dd>{c.languages[cl.language] ?? cl.language}</dd></div>}
          {cl.source && <div><dt>{c.source}</dt><dd>{c.createdVia(c.sources[cl.source] ?? cl.source)}</dd></div>}
          {cl.notes && <div><dt>{c.notes}</dt><dd className="client-pre">{cl.notes}</dd></div>}
        </dl>
      </section>

      <section className="client-card">
        <h2>{c.conversations}</h2>
        {data.threads.length === 0 ? <p className="client-muted">{c.noConversations}</p> : (
          <ul className="client-list">{data.threads.map(t => (
            <li key={t.id}><Link href={`/os/inbox?thread=${t.id}`}>{t.needs_reply && <span className="client-tag tag-reply">{c.attentionKind.reply}</span>} {t.subject}{!t.confirmed && <span className="client-muted"> · {c.suggested}</span>}</Link>{t.last_at && <span className="client-muted">{formatDate(t.last_at)}</span>}</li>
          ))}</ul>
        )}
      </section>

      {(data.quotes.length > 0 || data.invoices.length > 0 || data.payments.length > 0) && (
        <section className="client-card">
          {data.quotes.length > 0 && (<><h2>{c.quotes}</h2><ul className="client-list">{data.quotes.map(q => (
            <li key={q.id}><Link href={`/os/angebote/${q.id}`}>{q.number}</Link><span>{c.status[q.status] ?? q.status} · {money(q.total, q.currency)}</span></li>
          ))}</ul></>)}
          {data.invoices.length > 0 && (<><h2>{c.invoices}</h2><ul className="client-list">{data.invoices.map(i => (
            <li key={i.id}><Link href={`/os/invoices/${i.id}`}>{i.number}</Link><span>{c.status[i.status] ?? i.status} · {money(i.total, i.currency)}{i.paid > 0 && ` · ${money(i.paid, i.currency)} ${c.paid}`}{i.open > 0 && i.status !== 'draft' && i.status !== 'cancelled' && ` · ${money(i.open, i.currency)} ${c.open}`}{i.due_date && i.status !== 'paid' && i.status !== 'cancelled' && ` · ${c.due} ${formatDate(i.due_date)}`}</span></li>
          ))}</ul></>)}
          {data.payments.length > 0 && (<><h2>{c.payments}</h2><ul className="client-list">{data.payments.map(p => (
            <li key={p.id}><Link href={`/os/invoices/${p.invoice_id}`}>{p.invoice_number}</Link><span>{formatDate(p.received_on)} · {money(p.amount, p.currency)}{p.method ? ` · ${p.method}` : ''}</span></li>
          ))}</ul></>)}
        </section>
      )}

      {(data.jobs.length > 0 || data.leads.length > 0 || data.followups.length > 0) && (
        <section className="client-card">
          {data.jobs.length > 0 && (<><h2>{c.jobs}</h2><ul className="client-list">{data.jobs.map(j => <li key={j.id}><Link href="/os/jobs">{j.title}</Link><span>{j.stage}</span></li>)}</ul></>)}
          {data.leads.length > 0 && (<><h2>{c.leads}</h2><ul className="client-list">{data.leads.map(l => <li key={l.id}><Link href={`/os/leads/${l.id}`}>{l.label}</Link><span>{l.status}</span></li>)}</ul></>)}
          {data.followups.length > 0 && (<><h2>{c.followups}</h2><ul className="client-list">{data.followups.map(f => <li key={f.id}><span>{formatDate(f.due_on)}</span><span>{f.reason}</span></li>)}</ul></>)}
        </section>
      )}

      <section className="client-card">
        <div className="client-card-head">
          <h2>{c.documents}</h2>
          <button type="button" className="btn-secondary btn-sm" disabled={uploading} onClick={() => file.current?.click()}><Icon name="upload" size="xs" /> {uploading ? c.uploading : c.addDocument}</button>
        </div>
        {data.documents.length === 0 ? <p className="client-muted">{c.noDocuments}</p> : (
          <ul className="client-list">{data.documents.map(d => (
            <li key={d.id}>
              <a href={`/api/os/clients/${id}/documents?file=${d.id}`}><Icon name="download" size="xs" /> {d.filename}</a>
              <span className="client-doc-side">{Math.max(1, Math.round(d.size_bytes / 1024))} KB · {formatDate(d.created_at)}
                <button type="button" className="client-link-button" onClick={() => void removeDocument(d.id)}>{c.remove}</button></span>
            </li>
          ))}</ul>
        )}
        <input ref={file} type="file" accept="application/pdf,image/*,.docx,.xlsx,.pptx,.txt,.csv" hidden onChange={upload} />
      </section>

      <section className="client-card">
        <h2>{c.timeline}</h2>
        {data.activity.length === 0 ? <p className="client-muted">{c.noneYet}</p> : (
          <ul className="client-list">{data.activity.map(a => <li key={a.id}><span>{c.activity[a.kind] ?? a.summary}</span><span className="client-muted">{formatDate(a.created_at)}</span></li>)}</ul>
        )}
      </section>

      {editing && <ClientForm open client={cl} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); void load() }} />}
    </div>
  )
}
