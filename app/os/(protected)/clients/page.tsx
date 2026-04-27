'use client'
import { useEffect, useRef, useState } from 'react'

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

interface Client {
  id: string; name: string; company: string; email: string
  phone: string; address: string; city: string; country: string; status: string; created_at: string
}

interface Extracted {
  name: string; company: string; email: string; phone: string
  address: string; city: string; postcode: string; country: string
  website: string; notes: string; confidence: 'high' | 'medium' | 'low'
}

interface NominatimResult {
  display_name: string
  address: {
    road?: string; house_number?: string
    city?: string; town?: string; village?: string; postcode?: string
  }
}

const BLANK = {
  name: '', company: '', email: '', phone: '',
  address: '', postcode: '', city: '', country: 'Deutschland',
  website: '', notes: '', status: 'active',
}

const inp: React.CSSProperties = {
  width: '100%', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '4px', color: '#FFF', fontFamily: sans, fontSize: '14px', padding: '10px 14px',
  outline: 'none', boxSizing: 'border-box',
}

const sectionLbl: React.CSSProperties = {
  fontFamily: mono, fontSize: '9px', color: '#444', letterSpacing: '0.2em',
  textTransform: 'uppercase', margin: '20px 0 14px', paddingBottom: '8px',
  borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'block',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: '9px', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function StreetInput({ value, onChange, onFill }: {
  value: string
  onChange: (v: string) => void
  onFill?: (street: string, postcode: string, city: string) => void
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    onChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.length < 3) { setSuggestions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&countrycodes=de,at,ch&addressdetails=1&format=json&limit=6`,
          { headers: { 'User-Agent': 'MaxpromoDigitalOS/1.0 info@maxpromo.digital' } }
        )
        const data = await res.json() as NominatimResult[]
        const withStreet = data.filter(r => r.address?.road)
        setSuggestions(withStreet)
        setOpen(withStreet.length > 0)
      } catch { /* ignore */ }
    }, 400)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder="Musterstraße 12"
        style={inp}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111111', border: '1px solid rgba(255,255,255,0.10)', zIndex: 50, maxHeight: '180px', overflowY: 'auto', borderRadius: '0 0 4px 4px' }}>
          {suggestions.map((s, i) => {
            const road      = s.address.road || ''
            const num       = s.address.house_number || ''
            const streetStr = [road, num].filter(Boolean).join(' ')
            const city      = s.address.city || s.address.town || s.address.village || ''
            const postcode  = s.address.postcode || ''
            return (
              <button
                key={i}
                onMouseDown={() => { onChange(streetStr); onFill?.(streetStr, postcode, city); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#CCC', fontFamily: sans, fontSize: '13px', padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {streetStr || s.display_name.split(',').slice(0, 2).join(',')}
                {(postcode || city) && (
                  <span style={{ color: '#555', marginLeft: '10px', fontSize: '12px' }}>
                    {[postcode, city].filter(Boolean).join(' ')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ClientsPage() {
  const [clients,   setClients]   = useState<Client[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [form,      setForm]      = useState({ ...BLANK })
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toast,     setToast]     = useState('')
  const [search,    setSearch]    = useState('')

  const [scanTab,      setScanTab]      = useState<'scan' | 'paste'>('scan')
  const [pasteText,    setPasteText]    = useState('')
  const [extracting,   setExtracting]   = useState(false)
  const [extracted,    setExtracted]    = useState<Extracted | null>(null)
  const [extractError, setExtractError] = useState('')
  const [scanPreview,  setScanPreview]  = useState('')
  const [scanBase64,   setScanBase64]   = useState('')
  const [scanMime,     setScanMime]     = useState('image/jpeg')
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
    e.target.value = ''
  }

  async function runExtract() {
    setExtracting(true); setExtractError(''); setExtracted(null)
    try {
      const body = scanTab === 'scan' && scanBase64
        ? { image: scanBase64, mediaType: scanMime }
        : { text: pasteText }
      const res = await fetch('/api/os/ai/scan-client', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Extraction failed')
      const d = await res.json() as Extracted
      setExtracted(d)
      setForm({
        name:     d.name     || '',
        company:  d.company  || '',
        email:    d.email    || '',
        phone:    d.phone    || '',
        address:  d.address  || '',
        postcode: d.postcode || '',
        city:     d.city     || '',
        country:  d.country  || 'Deutschland',
        website:  d.website  || '',
        notes:    d.notes    || '',
        status:   'active',
      })
    } catch {
      setExtractError('Could not extract data. Please fill the form manually.')
    } finally {
      setExtracting(false)
    }
  }

  function resetScan() {
    setScanPreview(''); setScanBase64(''); setPasteText('')
    setExtracted(null); setExtractError('')
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      console.log('[clients] POSTing to /api/os/clients', { name: form.name.trim() })
      const res = await fetch('/api/os/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.name.trim(),
          company: form.company  || undefined,
          email:   form.email    || undefined,
          phone:   form.phone    || undefined,
          address: form.address  || undefined,
          city:    [form.postcode, form.city].filter(Boolean).join(' ') || undefined,
          country: form.country  || 'Deutschland',
          notes:   form.notes    || undefined,
        }),
      })
      console.log('[clients] API response status:', res.status)
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? `Server error ${res.status}`)
      }
      const newClient = await res.json() as Client
      console.log('[clients] Saved client:', newClient.id, newClient.name)
      setClients(prev => [newClient, ...prev])
      setForm({ ...BLANK })
      setShowForm(false)
      resetScan()
      setToast(`✓ ${newClient.name} saved`)
      setTimeout(() => setToast(''), 4000)
    } catch (err) {
      console.error('[clients] Save failed:', err)
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function updateClient() {
    if (!form.name.trim() || !editId) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/os/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:      editId,
          name:    form.name.trim(),
          company: form.company  || null,
          email:   form.email    || null,
          phone:   form.phone    || null,
          address: form.address  || null,
          city:    [form.postcode, form.city].filter(Boolean).join(' ') || null,
          country: form.country  || 'Deutschland',
          notes:   form.notes    || null,
        }),
      })
      if (!res.ok) { const e = await res.json() as { error?: string }; throw new Error(e.error ?? `Error ${res.status}`) }
      const updated = await res.json() as Client
      setClients(prev => prev.map(c => c.id === editId ? updated : c))
      setEditId(null)
      setShowForm(false)
      setForm({ ...BLANK })
      setToast(`✓ ${updated.name} updated`)
      setTimeout(() => setToast(''), 4000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update.')
    } finally { setSaving(false) }
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/os/clients?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClients(prev => prev.filter(c => c.id !== id))
      setToast(`Deleted ${name}`)
      setTimeout(() => setToast(''), 3000)
    }
  }

  function startEdit(c: Client) {
    const [postcode, ...cityParts] = (c.city || '').trim().split(/\s+/)
    const hasPostcode = /^\d{4,5}$/.test(postcode ?? '')
    setEditId(c.id)
    setForm({
      name:     c.name     || '',
      company:  c.company  || '',
      email:    c.email    || '',
      phone:    c.phone    || '',
      address:  c.address  || '',
      postcode: hasPostcode ? postcode : '',
      city:     hasPostcode ? cityParts.join(' ') : (c.city || ''),
      country:  c.country  || 'Deutschland',
      website:  '',
      notes:    '',
      status:   c.status   || 'active',
    })
    setShowForm(true)
    setSaveError('')
    resetScan()
  }

  const filtered = clients.filter(c =>
    `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const confidenceColor = { high: '#22c55e', medium: '#F97316', low: '#ef4444' }

  return (
    <div style={{ padding: '32px 40px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: '28px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Clients</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>{clients.length} TOTAL</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ ...BLANK }); setShowForm(true); resetScan() }}
          style={{ background: '#F97316', border: 'none', borderRadius: '4px', color: '#000', fontFamily: sans, fontWeight: 700, fontSize: '13px', padding: '10px 20px', cursor: 'pointer' }}
        >
          + New Client
        </button>
      </div>

      {/* ── Search ── */}
      <input
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '300px', ...inp, marginBottom: '20px', display: 'block' }}
      />

      {/* ── New / Edit Client MODAL ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '2px solid #F97316',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* ── MODAL HEADER — fixed top ── */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
                {editId ? 'Edit Client' : 'New Client'}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => { setScanTab('scan'); fileRef.current?.click() }}
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '6px 12px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px' }}
                >
                  📷 Scan
                </button>
                <button
                  onClick={() => { setScanTab('paste'); setExtracted(null); setScanPreview('') }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '10px', letterSpacing: '0.08em', padding: '6px 12px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px' }}
                >
                  📝 Paste
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditId(null); resetScan(); setSaveError(''); setForm({ ...BLANK }) }}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 8px' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* ── MODAL BODY — scrollable ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

              {/* Image preview */}
              {scanTab === 'scan' && scanPreview && !extracted && (
                <div style={{ marginBottom: '16px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '2px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <img src={scanPreview} alt="Business card" style={{ width: '120px', height: '80px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: mono, fontSize: '10px', color: '#888', margin: '0 0 10px', letterSpacing: '0.08em' }}>Image ready — extract contact details</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={runExtract} disabled={extracting} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', opacity: extracting ? 0.6 : 1, borderRadius: '2px' }}>
                          {extracting ? '⟳ Reading...' : '◈ Extract'}
                        </button>
                        <button onClick={() => { setScanPreview(''); setScanBase64('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555', fontFamily: mono, fontSize: '10px', padding: '8px 10px', cursor: 'pointer', borderRadius: '2px' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paste text */}
              {scanTab === 'paste' && !extracted && (
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    rows={4}
                    placeholder={'John Smith\nAcme GmbH\njohn@acme.de\n+49 211 123456\nHauptstr. 12, 40210 Düsseldorf'}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={runExtract} disabled={extracting || !pasteText.trim()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', opacity: extracting || !pasteText.trim() ? 0.5 : 1, borderRadius: '2px' }}>
                      {extracting ? '⟳ Extracting...' : '◈ Extract with AI'}
                    </button>
                    <button onClick={() => { setScanTab('scan'); setPasteText('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#555', fontFamily: mono, fontSize: '10px', padding: '8px 10px', cursor: 'pointer', borderRadius: '2px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {extractError && (
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#ef4444', margin: '0 0 12px', letterSpacing: '0.06em' }}>⚠ {extractError}</p>
              )}

              {/* Extracted preview banner */}
              {extracted && (
                <div style={{ marginBottom: '16px', background: '#0D0D0D', border: `1px solid ${confidenceColor[extracted.confidence]}33`, borderLeft: `3px solid ${confidenceColor[extracted.confidence]}`, padding: '12px 16px', borderRadius: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: mono, fontSize: '9px', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Fields pre-filled — verify below</p>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: confidenceColor[extracted.confidence], background: `${confidenceColor[extracted.confidence]}22`, padding: '2px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>
                      {extracted.confidence} confidence
                    </span>
                  </div>
                  {extracted.confidence === 'low' && (
                    <p style={{ fontFamily: mono, fontSize: '9px', color: '#ef4444', margin: '8px 0 0', letterSpacing: '0.08em' }}>⚠ Low confidence — please verify before saving</p>
                  )}
                  <button onClick={resetScan} style={{ fontFamily: mono, fontSize: '9px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 0 0', display: 'block' }}>
                    ↺ Re-scan
                  </button>
                </div>
              )}

              {/* Contact Info */}
              <span style={sectionLbl}>Contact Info</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Name *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                </Field>
                <Field label="Firma">
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={inp} />
                </Field>
                <Field label="E-Mail">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
                </Field>
                <Field label="Telefon">
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                </Field>
              </div>

              {/* Address */}
              <span style={sectionLbl}>Adresse</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label="Straße und Hausnummer">
                  <StreetInput
                    value={form.address}
                    onChange={v => setForm(f => ({ ...f, address: v }))}
                    onFill={(street, postcode, city) => setForm(f => ({ ...f, address: street, postcode, city }))}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px' }}>
                  <Field label="Postleitzahl">
                    <input value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} placeholder="40210" maxLength={10} style={inp} />
                  </Field>
                  <Field label="Stadt">
                    <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Düsseldorf" style={inp} />
                  </Field>
                </div>
                <Field label="Land">
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                    <option>Deutschland</option>
                    <option>Österreich</option>
                    <option>Schweiz</option>
                    <option>United Kingdom</option>
                    <option>France</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>

              {/* Additional */}
              <span style={sectionLbl}>Zusätzlich</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '4px' }}>
                <Field label="Website">
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" style={inp} />
                </Field>
                <Field label="Notizen">
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Internal notes about this client..." style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                </Field>
              </div>
            </div>

            {/* ── MODAL FOOTER — always visible ── */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#111111', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={editId ? updateClient : save}
                  disabled={saving || !form.name.trim()}
                  style={{ background: '#F97316', border: 'none', borderRadius: '4px', color: '#000', fontFamily: sans, fontWeight: 700, fontSize: '13px', padding: '10px 24px', cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.name.trim() ? 0.5 : 1 }}
                >
                  {saving ? 'Saving...' : editId ? 'Update Client' : 'Save Client'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditId(null); resetScan(); setSaveError(''); setForm({ ...BLANK }) }}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', color: '#cccccc', fontFamily: sans, fontSize: '13px', padding: '10px 18px', cursor: 'pointer' }}
                >
                  Abbrechen
                </button>
              </div>
              {saveError && (
                <p style={{ fontFamily: mono, fontSize: '11px', color: '#ef4444', margin: '10px 0 0', letterSpacing: '0.04em' }}>⚠ {saveError}</p>
              )}
            </div>

          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*,.pdf" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* ── TABLE ── */}
      <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #F97316', overflow: 'hidden', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Name', 'Company', 'Email', 'Phone', 'City', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: '#555555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '14px', color: '#444444' }}>No clients found.</td></tr>
            ) : (
              filtered.map(c => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '14px', color: '#FFFFFF' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '14px', color: '#888888' }}>{c.company || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '12px', color: '#888888' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '12px', color: '#888888' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '14px', color: '#555555' }}>{c.city || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '10px', color: c.status === 'active' ? '#4ade80' : '#666666', background: c.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '3px', border: `1px solid ${c.status === 'active' ? 'rgba(34,197,94,0.2)' : '#333333'}` }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => startEdit(c)}
                        style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteClient(c.id, c.name)}
                        style={{ fontFamily: mono, fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Success toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '80px', right: '24px', background: '#111111', border: '1px solid rgba(34,197,94,0.3)', borderLeft: '3px solid #22c55e', padding: '12px 20px', borderRadius: '4px', zIndex: 500 }}>
          <p style={{ fontFamily: mono, fontSize: '12px', color: '#22c55e', margin: 0, letterSpacing: '0.06em' }}>{toast}</p>
        </div>
      )}
    </div>
  )
}
