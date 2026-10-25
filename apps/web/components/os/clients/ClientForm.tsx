'use client'
/**
 * The client form, for a new client and for an edit — one component, used by the client list,
 * the client page and Quick Scan. Every save goes through the client capabilities
 * (/api/os/clients/actions):
 *
 *   new   client.create — when existing clients could be the same, nothing is saved and the
 *         candidates are shown: open the existing one, or confirm "a different client".
 *   edit  client.update with only the fields that changed; a field emptied is sent as null, so it
 *         is cleared (never "left as it was").
 *
 * "From a document" reads a photo, screenshot, business card, PDF or pasted text into the form
 * (/api/os/ai/scan-client). The result is a candidate to check, never a saved record. The file can
 * be kept on the new client afterwards.
 */
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Icon } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'
import { CLIENTS_COPY } from '@/lib/os-i18n/clients'
import { ownerApi, failure, type EngineResult } from '@/lib/commercial/ownerClient'
import { Sheet } from '@/components/os/shell/Sheet'
import './clients.css'

export interface ClientRecord {
  id: string; name: string; company: string | null; email: string | null; phone: string | null; website: string | null
  address: string | null; postcode: string | null; city: string | null; country: string | null; language: string | null
  notes: string | null; source: string | null; status: string; archived_at: string | null
}

export interface MatchCandidate { id: string; label: string; level: 'exact' | 'likely' | 'possible'; reasons: string[]; archived: boolean }

type Fields = { name: string; company: string; email: string; phone: string; website: string; address: string; postcode: string; city: string; country: string; language: string; notes: string }
const FIELD_KEYS: (keyof Fields)[] = ['name', 'company', 'email', 'phone', 'website', 'address', 'postcode', 'city', 'country', 'language', 'notes']
const COUNTRIES = ['Deutschland', 'Österreich', 'Schweiz', 'United Kingdom', 'France', 'Other'] as const
const EMPTY: Fields = { name: '', company: '', email: '', phone: '', website: '', address: '', postcode: '', city: '', country: 'Deutschland', language: '', notes: '' }

const api = ownerApi('/api/os/clients/actions')

/** A legacy row may hold "45276 Essen" in city with no postcode. */
function fieldsOf(c: ClientRecord): Fields {
  const legacy = !c.postcode && /^\d{4,5}\s+/.test(c.city ?? '')
  return {
    name: c.name ?? '', company: c.company ?? '', email: c.email ?? '', phone: c.phone ?? '', website: c.website ?? '',
    address: c.address ?? '', postcode: legacy ? (c.city ?? '').trim().split(/\s+/)[0] : c.postcode ?? '',
    city: legacy ? (c.city ?? '').trim().replace(/^\d{4,5}\s+/, '') : c.city ?? '', country: c.country || 'Deutschland',
    language: c.language ?? '', notes: c.notes ?? '',
  }
}

/** Phone photos are often 5–10 MB; the platform takes 4. Re-encode large images in the browser. */
export async function shrinkImage(file: File, maxBytes = 3_500_000, maxSide = 2200): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= maxBytes) return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
}

export function MatchList({ candidates, onCreateAnyway, busy }: { candidates: MatchCandidate[]; onCreateAnyway?: () => void; busy?: boolean }) {
  const { locale } = useOsLocale()
  const c = CLIENTS_COPY[locale]
  return (
    <div className="client-dups" role="status">
      <ul>
        {candidates.map(m => (
          <li key={m.id}>
            <div className="client-dups-main">
              <strong>{m.label}</strong>
              <span>{c.dupLevel[m.level]} · {m.reasons.map(r => c.dupReason[r] ?? r).join(', ')}{m.archived ? ` · ${c.dupArchived}` : ''}</span>
            </div>
            <Link href={`/os/clients/${m.id}`} className="btn-secondary btn-sm">{c.openExisting}</Link>
          </li>
        ))}
      </ul>
      {onCreateAnyway && <button type="button" className="btn-secondary btn-sm" onClick={onCreateAnyway} disabled={busy}>{c.createAnyway}</button>}
    </div>
  )
}

export function ClientForm({ open, onClose, client, onSaved }: {
  open: boolean; onClose: () => void; client?: ClientRecord | null
  onSaved: (client: ClientRecord, created: boolean) => void
}) {
  const { locale } = useOsLocale()
  const c = CLIENTS_COPY[locale]
  const initial = client ? fieldsOf(client) : EMPTY
  const [form, setForm] = useState<Fields>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dups, setDups] = useState<MatchCandidate[] | null>(null)
  const [reading, setReading] = useState(false)
  const [paste, setPaste] = useState('')
  const [pasting, setPasting] = useState(false)
  const [candidate, setCandidate] = useState<{ confidence: string; warnings: string[] } | null>(null)
  const [extractMatches, setExtractMatches] = useState<MatchCandidate[]>([])
  const [docFile, setDocFile] = useState<File | null>(null)
  const [keepDoc, setKeepDoc] = useState(true)
  const fileInput = useRef<HTMLInputElement>(null)

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setForm(f => ({ ...f, [k]: e.target.value })); setDups(null) }

  function close() {
    setForm(initial); setError(''); setDups(null); setCandidate(null); setExtractMatches([]); setDocFile(null); setPaste(''); setPasting(false)
    onClose()
  }

  async function read(body: FormData | { text: string }) {
    setReading(true); setError(''); setCandidate(null); setExtractMatches([])
    try {
      const res = await fetch('/api/os/ai/scan-client', body instanceof FormData ? { method: 'POST', body } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({})) as { candidate?: { fields: Fields; confidence: string; warnings: string[] }; matches?: { candidates: MatchCandidate[] }; code?: string }
      if (!res.ok || !data.candidate) { setError(c.extractError[data.code ?? 'ai_failed'] ?? c.extractError.ai_failed); return }
      const f = data.candidate.fields
      setForm(prev => {
        const next = { ...prev }
        for (const k of FIELD_KEYS) if (f[k]) next[k] = f[k]
        if (f.country && !COUNTRIES.includes(f.country as typeof COUNTRIES[number])) next.country = /deutsch|germany/i.test(f.country) ? 'Deutschland' : 'Other'
        return next
      })
      setCandidate({ confidence: data.candidate.confidence, warnings: data.candidate.warnings })
      setExtractMatches(data.matches?.candidates ?? [])
    } catch { setError(c.extractError.ai_failed) } finally { setReading(false) }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    const file = await shrinkImage(picked)
    if (file.size > 4 * 1024 * 1024) { setError(c.extractError.too_large); return }
    setDocFile(file)
    const body = new FormData()
    body.append('file', file)
    await read(body)
  }

  async function attachDocument(clientId: string) {
    if (!docFile || !keepDoc) return
    const body = new FormData()
    body.append('file', docFile)
    await fetch(`/api/os/clients/${clientId}/documents`, { method: 'POST', body }).catch(() => undefined)
  }

  async function save(confirmedDistinct: string[] = []) {
    if (!form.name.trim()) { setError(c.nameRequired); return }
    setSaving(true); setError('')
    try {
      let r: EngineResult
      if (client) {
        /* Only what changed; an emptied field is sent as null and cleared. */
        const changes: Record<string, string | null> = { }
        for (const k of FIELD_KEYS) if (form[k].trim() !== initial[k].trim()) changes[k] = form[k].trim() || null
        if (!Object.keys(changes).length) { close(); return }
        r = await api.run('client.update', { client_id: client.id, ...changes })
      } else {
        const input: Record<string, unknown> = {}
        for (const k of FIELD_KEYS) if (form[k].trim()) input[k] = form[k].trim()
        if (docFile) input.source = 'document'
        if (confirmedDistinct.length) input.confirmed_distinct_from = confirmedDistinct
        r = await api.run('client.create', input)
      }
      if (r.status !== 'done') { setError(failure(r)); return }
      const data = r.result?.data as { created?: boolean; client?: ClientRecord; candidates?: MatchCandidate[] }
      if (!client && data.created === false && data.candidates?.length) {
        setDups(data.candidates)
        /* On a phone the answer is below the fold: bring it into view. */
        requestAnimationFrame(() => document.querySelector('.client-dups')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
        return
      }
      if (data.client) {
        if (!client && data.created) await attachDocument(data.client.id)
        onSaved(data.client, !client)
        close()
      }
    } catch { setError(c.failed) } finally { setSaving(false) }
  }

  const field = (k: keyof Fields, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="client-field"><span>{label}</span><input value={form[k]} onChange={set(k)} {...extra} /></label>
  )

  return (
    <Sheet open={open} onClose={close} title={client ? c.formEdit : c.formNew} closeLabel={c.cancel}>
      <form className="client-form" onSubmit={e => { e.preventDefault(); void save() }}>
        {!client && (
          <section className="client-doc">
            <p className="client-doc-title">{c.fromDocument}</p>
            <p className="client-hint">{c.fromDocumentHint}</p>
            <div className="client-row-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => fileInput.current?.click()} disabled={reading}><Icon name="upload" size="xs" /> {c.chooseFile}</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setPasting(p => !p)} disabled={reading}>{c.pasteText}</button>
            </div>
            {pasting && (
              <div className="client-paste">
                <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={4} aria-label={c.pasteText} />
                <button type="button" className="btn-primary btn-sm" disabled={reading || !paste.trim()} onClick={() => void read({ text: paste })}>{c.read}</button>
              </div>
            )}
            {reading && <p className="client-hint" role="status"><Icon name="running" size="xs" /> {c.reading}</p>}
            {candidate && (
              <div className={`client-candidate client-candidate-${candidate.confidence}`} role="status">
                <strong>{c.candidate}</strong> · {c.confidence[candidate.confidence] ?? candidate.confidence}
                {candidate.warnings.map(w => <p key={w}>{c.warning[w] ?? w}</p>)}
                {docFile && <label className="client-check"><input type="checkbox" checked={keepDoc} onChange={e => setKeepDoc(e.target.checked)} /> {c.keepDocument}</label>}
              </div>
            )}
            {extractMatches.length > 0 && !dups && (<><p className="client-hint">{c.matchesFound}</p><MatchList candidates={extractMatches} /></>)}
            <input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/gif" capture="environment" hidden onChange={onFile} />
          </section>
        )}

        <p className="client-section">{c.sectionContact}</p>
        {field('name', c.name, { required: true, autoComplete: 'name' })}
        {field('company', c.company, { autoComplete: 'organization' })}
        {field('email', c.email, { type: 'email', inputMode: 'email', autoComplete: 'email' })}
        {field('phone', c.phone, { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
        {field('website', c.website, { inputMode: 'url', placeholder: 'example.de' })}

        <p className="client-section">{c.sectionAddress}</p>
        {field('address', c.address, { autoComplete: 'street-address' })}
        <div className="client-pair">
          {field('postcode', c.postcode, { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 12 })}
          {field('city', c.city, { autoComplete: 'address-level2' })}
        </div>
        <label className="client-field"><span>{c.country}</span>
          <select value={COUNTRIES.includes(form.country as typeof COUNTRIES[number]) ? form.country : 'Other'} onChange={set('country')}>
            {COUNTRIES.map(v => <option key={v} value={v}>{c.countries[v]}</option>)}
          </select>
        </label>

        <p className="client-section">{c.sectionMore}</p>
        <label className="client-field"><span>{c.language}</span>
          <select value={form.language} onChange={set('language')}>
            <option value="">{c.languageNone}</option>
            {(['de', 'en', 'fr'] as const).map(l => <option key={l} value={l}>{c.languages[l]}</option>)}
          </select>
        </label>
        <label className="client-field"><span>{c.notes}</span><textarea value={form.notes} onChange={set('notes')} rows={3} /></label>

        {dups && (<><p className="client-error">{c.dupIntro}</p><MatchList candidates={dups} busy={saving} onCreateAnyway={() => void save(dups.map(d => d.id))} /></>)}
        {error && <p className="client-error" role="alert"><Icon name="warning" size="xs" /> {error}</p>}
        <div className="client-form-actions">
          <button type="submit" className="btn-primary" disabled={saving || reading}>{saving ? c.saving : client ? c.update : c.save}</button>
          <button type="button" className="btn-secondary" onClick={close}>{c.cancel}</button>
        </div>
      </form>
    </Sheet>
  )
}
