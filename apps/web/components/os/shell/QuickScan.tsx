'use client'
/**
 * Quick Scan: a business card photo or pasted signature becomes a client. Moved out of the shell into
 * its own sheet; opened from the desktop's floating control or the phone's More sheet. On a phone the
 * file control offers the camera directly.
 */
import { useRef, useState } from 'react'
import { Icon } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Sheet } from './Sheet'

interface ScannedContact {
  name: string; company: string; email: string; phone: string
  address: string; city: string; postcode: string; country: string
  website: string; notes: string; confidence: 'high' | 'medium' | 'low'
}

export function QuickScanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useOsLocale()
  const q = t.quickScan
  const [tab, setTab] = useState<'scan' | 'paste'>('scan')
  const [paste, setPaste] = useState('')
  const [preview, setPreview] = useState('')
  const [base64, setBase64] = useState('')
  const [mime, setMime] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ScannedContact | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  function reset() { setExtracted(null); setError(''); setPreview(''); setBase64(''); setPaste(''); setSaved(false) }
  function close() { reset(); onClose() }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      setPreview(dataUrl); setBase64(b64); setMime(header.match(/:(.*?);/)?.[1] ?? 'image/jpeg')
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  async function extract() {
    setLoading(true); setError(''); setExtracted(null)
    try {
      const payload = tab === 'scan' && base64 ? { kind: 'client', image: base64, mediaType: mime } : { kind: 'client', text: paste }
      const res = await fetch('/api/os/ai/enhance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      setExtracted((await res.json() as { extracted: ScannedContact }).extracted)
    } catch { setError(q.errorGeneric) } finally { setLoading(false) }
  }

  async function save() {
    if (!extracted?.name) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/os/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extracted.name, company: extracted.company || undefined, email: extracted.email || undefined, phone: extracted.phone || undefined,
          address: extracted.address || undefined, city: [extracted.city, extracted.postcode].filter(Boolean).join(' ') || undefined,
          country: extracted.country || 'Germany', notes: extracted.notes || undefined,
        }),
      })
      // A failed save is never shown as saved.
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(close, 1500)
    } catch { setError(q.errorGeneric) } finally { setSaving(false) }
  }

  const ready = tab === 'scan' ? Boolean(base64) : Boolean(paste.trim())
  const confidence = extracted?.confidence ?? 'low'
  const tone = confidence === 'high' ? 'var(--semantic-success)' : confidence === 'medium' ? 'var(--semantic-warning)' : 'var(--semantic-danger)'

  return (
    <Sheet open={open} onClose={close} title={q.title} closeLabel={t.shell.close}>
      <div className="qs-tabs" role="tablist">
        {(['scan', 'paste'] as const).map(k => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="qs-tab" onClick={() => { setTab(k); reset() }}>
            {k === 'scan' ? q.tabScan : q.tabPaste}
          </button>
        ))}
      </div>

      {!extracted && (
        <div className="qs-step">
          {tab === 'scan' && (!preview
            ? <button type="button" className="qs-drop" onClick={() => file.current?.click()}>{q.dropZone}<span>{q.dropZoneFormats}</span></button>
            // eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview
            : <img src={preview} alt="" className="qs-preview" />)}
          {tab === 'paste' && <textarea className="qs-paste" value={paste} onChange={e => setPaste(e.target.value)} rows={5} placeholder={q.pastePlaceholder} aria-label={q.tabPaste} />}
          {error && <p role="alert" className="qs-error"><Icon name="warning" size="xs" /> {error}</p>}
          <div className="qs-actions">
            <button type="button" className="btn-primary btn-sm" onClick={extract} disabled={loading || !ready} aria-busy={loading}>{loading ? q.extractingButton : q.extractButton}</button>
            {tab === 'scan' && preview && <button type="button" className="btn-secondary btn-sm" onClick={() => { setPreview(''); setBase64('') }}>{q.remove}</button>}
          </div>
        </div>
      )}

      {extracted && !saved && (
        <div className="qs-step">
          <p className="qs-heading">{q.extractedHeading} <span style={{ color: tone }}>· {confidence === 'high' ? q.confidenceHigh : confidence === 'medium' ? q.confidenceMedium : q.confidenceLow}</span></p>
          <dl className="qs-fields">
            {([[q.fieldName, extracted.name], [q.fieldCompany, extracted.company], [q.fieldEmail, extracted.email], [q.fieldPhone, extracted.phone],
              [q.fieldAddress, extracted.address], [q.fieldCity, [extracted.city, extracted.postcode].filter(Boolean).join(' ')], [q.fieldCountry, extracted.country]] as [string, string][])
              .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {confidence === 'low' && <p className="qs-error">{q.lowConfidenceWarning}</p>}
          {error && <p role="alert" className="qs-error">{error}</p>}
          <div className="qs-actions">
            <button type="button" className="btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? q.saving : q.saveClient}</button>
            <button type="button" className="btn-secondary btn-sm" onClick={reset}>{q.rescan}</button>
          </div>
        </div>
      )}

      {saved && <p role="status" className="qs-saved">{q.savedHeading} — {extracted?.name}</p>}
      <input ref={file} type="file" accept="image/*,.pdf" capture="environment" hidden onChange={onFile} />
    </Sheet>
  )
}
