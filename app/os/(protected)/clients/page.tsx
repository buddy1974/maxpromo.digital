'use client'
import { useEffect, useRef, useState } from 'react'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface Client {
  id: string; name: string; company: string; email: string
  phone: string; city: string; country: string; status: string; created_at: string
}

interface Extracted {
  name: string; company: string; email: string; phone: string
  address: string; city: string; postcode: string; country: string
  website: string; notes: string; confidence: 'high' | 'medium' | 'low'
}

const BLANK = { name: '', company: '', email: '', phone: '', city: '', country: 'Germany', status: 'active' }

const inp: React.CSSProperties = {
  width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)',
  color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

export default function ClientsPage() {
  const [clients,  setClients]  = useState<Client[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ ...BLANK })
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')

  // scan states
  const [scanTab,       setScanTab]       = useState<'scan' | 'paste'>('scan')
  const [pasteText,     setPasteText]     = useState('')
  const [extracting,    setExtracting]    = useState(false)
  const [extracted,     setExtracted]     = useState<Extracted | null>(null)
  const [extractError,  setExtractError]  = useState('')
  const [scanPreview,   setScanPreview]   = useState('')
  const [scanBase64,    setScanBase64]    = useState('')
  const [scanMime,      setScanMime]      = useState('image/jpeg')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/os/clients')
      .then(r => r.json())
      .then(d => { setClients(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      setScanPreview(dataUrl)
      setScanBase64(b64)
      setScanMime(header.match(/:(.*?);/)?.[1] ?? 'image/jpeg')
    }
    reader.readAsDataURL(file)
    // reset value so same file can be re-selected
    e.target.value = ''
  }

  async function runExtract() {
    setExtracting(true)
    setExtractError('')
    setExtracted(null)
    try {
      const body = scanTab === 'scan' && scanBase64
        ? { image: scanBase64, mediaType: scanMime }
        : { text: pasteText }

      const res = await fetch('/api/os/ai/scan-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Extraction failed')
      const d = await res.json() as Extracted
      setExtracted(d)
      // Pre-fill form fields
      setForm({
        name:    d.name    || '',
        company: d.company || '',
        email:   d.email   || '',
        phone:   d.phone   || '',
        city:    [d.city, d.postcode].filter(Boolean).join(' ') || '',
        country: d.country || 'Germany',
        status:  'active',
      })
    } catch {
      setExtractError('Could not extract data. Please fill the form manually.')
    } finally {
      setExtracting(false)
    }
  }

  function resetScan() {
    setScanPreview('')
    setScanBase64('')
    setPasteText('')
    setExtracted(null)
    setExtractError('')
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/os/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          notes: extracted?.notes || undefined,
          address: extracted?.address || undefined,
        }),
      })
      const newClient = await res.json() as Client
      setClients(prev => [newClient, ...prev])
      setForm({ ...BLANK })
      setShowForm(false)
      resetScan()
    } finally {
      setSaving(false)
    }
  }

  const filtered = clients.filter(c =>
    `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const confidenceColor = {
    high:   '#22c55e',
    medium: '#F97316',
    low:    '#ef4444',
  }

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Clients</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>{clients.length} TOTAL</p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetScan() }}
          style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          + New Client
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '300px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '9px 14px', outline: 'none', marginBottom: '20px', display: 'block' }}
      />

      {/* New client form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderTop: '2px solid #F97316', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>New Client</p>
            {/* AI Scan buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setScanTab('scan'); fileRef.current?.click() }}
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', padding: '7px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                📷 Scan Business Card
              </button>
              <button
                onClick={() => { setScanTab('paste'); setShowForm(true); setExtracted(null); setScanPreview('') }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', padding: '7px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                📝 Paste Contact Info
              </button>
            </div>
          </div>

          {/* Image preview */}
          {scanTab === 'scan' && scanPreview && !extracted && (
            <div style={{ marginBottom: '16px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img src={scanPreview} alt="Business card" style={{ width: '140px', height: '90px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: '0 0 10px', letterSpacing: '0.08em' }}>Image selected — Claude will extract contact details</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={runExtract} disabled={extracting} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 16px', cursor: 'pointer', textTransform: 'uppercase', opacity: extracting ? 0.6 : 1, borderRadius: '2px' }}>
                      {extracting ? '⟳ Reading...' : '◈ Extract Contact Data'}
                    </button>
                    <button onClick={() => { setScanPreview(''); setScanBase64('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555', fontFamily: mono, fontSize: '10px', padding: '8px 12px', cursor: 'pointer', borderRadius: '2px' }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paste text input */}
          {scanTab === 'paste' && !extracted && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Paste or type contact details</p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={4}
                placeholder={'Example: John Smith, Acme GmbH, john@acme.de, +49 211 123456, Hauptstr. 12, 40210 Düsseldorf'}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={runExtract} disabled={extracting || !pasteText.trim()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 16px', cursor: 'pointer', textTransform: 'uppercase', opacity: extracting || !pasteText.trim() ? 0.5 : 1, borderRadius: '2px' }}>
                  {extracting ? '⟳ Extracting...' : '◈ Extract with AI'}
                </button>
                <button onClick={() => { setScanTab('scan'); setPasteText('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555', fontFamily: mono, fontSize: '10px', padding: '8px 12px', cursor: 'pointer', borderRadius: '2px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Extract error */}
          {extractError && (
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#ef4444', margin: '0 0 12px', letterSpacing: '0.06em' }}>
              ⚠ {extractError}
            </p>
          )}

          {/* Extracted preview */}
          {extracted && (
            <div style={{ marginBottom: '16px', background: '#0D0D0D', border: `1px solid ${confidenceColor[extracted.confidence]}33`, borderLeft: `3px solid ${confidenceColor[extracted.confidence]}`, padding: '14px 16px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
                  Extracted from {scanTab === 'scan' ? 'business card' : 'text'}
                </p>
                <span style={{ fontFamily: mono, fontSize: '9px', color: confidenceColor[extracted.confidence], background: `${confidenceColor[extracted.confidence]}22`, padding: '2px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>
                  {extracted.confidence} confidence
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                {[
                  ['Name', extracted.name],
                  ['Company', extracted.company],
                  ['Email', extracted.email],
                  ['Phone', extracted.phone],
                  ['Address', extracted.address],
                  ['City', [extracted.city, extracted.postcode].filter(Boolean).join(' ')],
                  ['Website', extracted.website],
                  ['Notes', extracted.notes],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <p key={k} style={{ fontFamily: sans, fontSize: '12px', color: '#CCC', margin: '2px 0' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.1em' }}>{k}: </span>
                    {v}
                  </p>
                ))}
              </div>
              {extracted.confidence === 'low' && (
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#ef4444', margin: '10px 0 0', letterSpacing: '0.08em' }}>
                  ⚠ Some fields may need correction. Please review before saving.
                </p>
              )}
              <button onClick={resetScan} style={{ fontFamily: mono, fontSize: '9px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0 }}>
                ↺ Re-scan
              </button>
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <Field label="Name *">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
            </Field>
            <Field label="Company">
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={inp} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inp} />
            </Field>
            <Field label="Country">
              <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} style={inp} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={save} disabled={saving || !form.name.trim()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', padding: '10px 20px', cursor: 'pointer', opacity: saving || !form.name.trim() ? 0.5 : 1, textTransform: 'uppercase' }}>
              {saving ? 'SAVING...' : 'SAVE CLIENT'}
            </button>
            <button onClick={() => { setShowForm(false); resetScan() }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '10px 16px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* hidden file input — capture=environment prefers camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Name', 'Company', 'Email', 'Phone', 'City', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No clients found.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#FFF' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#888' }}>{c.company || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#888' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#888' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#555' }}>{c.city || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: c.status === 'active' ? '#22c55e' : '#555', background: c.status === 'active' ? '#22c55e22' : '#55555522', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
