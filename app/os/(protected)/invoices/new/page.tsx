'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface LineItem {
  description: string
  qty: number
  unit: string
  unit_price: number
  total: number
  isFixedPrice: boolean
}
interface Client { id: string; name: string; company: string; email: string; address: string; city: string; country: string }

const UNITS = ['pauschal', 'Stück', 'Stunden', 'Tage', 'Seiten', 'Monat', 'Lizenz']

const blankItem = (): LineItem => ({ description: '', qty: 1, unit: 'pauschal', unit_price: 0, total: 0, isFixedPrice: true })

function fmtEur(n: number) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n) }
function addDays(d: number) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0] }

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

// ── German address autocomplete ───────────────────────────────────────────���───
interface AddrSuggestion { display_name: string; address: { postcode?: string; city?: string; town?: string; village?: string; road?: string } }

function AddressInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [suggestions, setSuggestions] = useState<AddrSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    onChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.length < 3) { setSuggestions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&countrycodes=de&addressdetails=1&format=json&limit=6`,
          { headers: { 'User-Agent': 'MaxpromoDigitalOS/1.0 info@maxpromo.digital' } }
        )
        const data = await res.json() as AddrSuggestion[]
        setSuggestions(data)
        setOpen(data.length > 0)
      } catch { /* ignore */ }
    }, 400)
  }

  function pick(s: AddrSuggestion) {
    onChange(s.display_name.split(',').slice(0, 3).join(',').trim())
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div style={{ position: 'relative' }}>
      <input value={value} onChange={e => handleChange(e.target.value)} placeholder={placeholder} style={inp} onBlur={() => setTimeout(() => setOpen(false), 200)} />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111', border: '1px solid rgba(255,255,255,0.1)', zIndex: 50, maxHeight: '180px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <button key={i} onMouseDown={() => pick(s)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#CCC', fontFamily: sans, fontSize: '12px', padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {s.display_name.split(',').slice(0, 4).join(', ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AI modal ──────────────────────────────────────────────────────────────────
interface AIExtracted {
  clientName: string; clientCompany: string; clientEmail: string
  clientAddress: string; clientCity: string
  lineItems: { description: string; quantity: number; unit: string; unitPrice: number; finalPrice: number; isFixedPrice: boolean }[]
  anzahlung: number; anzahlungDate: string; anzahlungMethod: string
  notes: string; dueDate: string
}

// ─────────────────────────────────────────────────────────────────────────���───

export default function NewInvoicePage() {
  const router = useRouter()

  // ── meta
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(addDays(30))

  // ── client
  const [clientId,      setClientId]      = useState('')
  const [clientName,    setClientName]    = useState('')
  const [clientEmail,   setClientEmail]   = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clients,       setClients]       = useState<Client[]>([])

  // ── line items
  const [lineItems, setLineItems] = useState<LineItem[]>([blankItem()])

  // ── anzahlung
  const [hasAnzahlung,    setHasAnzahlung]    = useState(false)
  const [anzahlung,       setAnzahlung]       = useState(0)
  const [anzahlungDate,   setAnzahlungDate]   = useState('')
  const [anzahlungMethod, setAnzahlungMethod] = useState('Überweisung')

  // ── notes / actions
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [sending, setSending] = useState(false)

  // ── AI modal
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [rawText,     setRawText]     = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiError,     setAiError]     = useState('')

  // ── Scan modal
  const [scanModalOpen, setScanModalOpen]   = useState(false)
  const [scanPreview,   setScanPreview]     = useState('')
  const [scanBase64,    setScanBase64]      = useState('')
  const [scanMime,      setScanMime]        = useState('image/jpeg')
  const [scanLoading,   setScanLoading]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/os/invoices?next=true').then(r => r.json()).then(d => setInvoiceNumber((d as { number: string }).number)).catch(() => {})
    fetch('/api/os/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // ── helpers ──────────────────────────────────────────────────────────────
  function updateItem(i: number, field: keyof LineItem, value: string | number | boolean) {
    setLineItems(prev => {
      const items = [...prev]
      items[i] = { ...items[i], [field]: value }
      if (!items[i].isFixedPrice && (field === 'qty' || field === 'unit_price')) {
        items[i].total = Number(items[i].qty) * Number(items[i].unit_price)
      }
      return items
    })
  }

  function toggleFixed(i: number) {
    setLineItems(prev => {
      const items = [...prev]
      items[i] = { ...items[i], isFixedPrice: !items[i].isFixedPrice }
      return items
    })
  }

  function selectClient(id: string) {
    const c = clients.find(x => x.id === id)
    if (!c) { setClientId(''); return }
    setClientId(c.id)
    setClientName(c.name + (c.company ? ` — ${c.company}` : ''))
    setClientEmail(c.email || '')
    setClientAddress([c.address, c.city, c.country].filter(Boolean).join(', '))
  }

  const subtotal   = lineItems.reduce((s, i) => s + Number(i.total), 0)
  const restbetrag = subtotal - (hasAnzahlung ? Number(anzahlung) : 0)

  // ── AI generate ──────────────────────────────────────────────────────────
  async function handleGenerateAI() {
    if (!rawText.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res  = await fetch('/api/os/ai/generate-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      if (!res.ok) throw new Error('AI extraction failed')
      const d = await res.json() as AIExtracted
      applyExtracted(d)
      setAiModalOpen(false)
      setRawText('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Scan ─────────────────────────────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setScanPreview(dataUrl)
      setScanBase64(b64)
      setScanMime(mime)
      setScanModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  async function handleScanExtract() {
    if (!scanBase64) return
    setScanLoading(true)
    try {
      const res = await fetch('/api/os/ai/scan-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: scanBase64, mediaType: scanMime }),
      })
      if (!res.ok) throw new Error('Scan failed')
      const d = await res.json() as AIExtracted
      applyExtracted(d)
      setScanModalOpen(false)
      setScanPreview('')
      setScanBase64('')
    } catch { /* silently fail */ }
    finally { setScanLoading(false) }
  }

  function applyExtracted(d: AIExtracted) {
    if (d.clientName)    setClientName(d.clientName + (d.clientCompany ? ` — ${d.clientCompany}` : ''))
    if (d.clientEmail)   setClientEmail(d.clientEmail)
    if (d.clientAddress || d.clientCity) setClientAddress([d.clientAddress, d.clientCity].filter(Boolean).join(', '))
    if (d.notes)     setNotes(d.notes)
    if (d.dueDate)   setDueDate(d.dueDate)
    if (d.lineItems?.length) {
      setLineItems(d.lineItems.map(li => ({
        description: li.description,
        qty: li.quantity,
        unit: li.unit || 'pauschal',
        unit_price: li.unitPrice,
        total: li.finalPrice,
        isFixedPrice: li.isFixedPrice,
      })))
    }
    if (d.anzahlung > 0) {
      setHasAnzahlung(true)
      setAnzahlung(d.anzahlung)
      if (d.anzahlungDate)   setAnzahlungDate(d.anzahlungDate)
      if (d.anzahlungMethod) setAnzahlungMethod(d.anzahlungMethod)
    }
  }

  // ── save / send ──────────────────────────────────────────────────────────
  async function saveInvoice(sendNow = false): Promise<string | null> {
    if (!clientName.trim() || lineItems.every(i => !i.description)) return null
    const body = {
      invoice_number: invoiceNumber, client_id: clientId || undefined,
      client_name: clientName, client_email: clientEmail, client_address: clientAddress,
      line_items: lineItems.filter(i => i.description),
      subtotal, total: subtotal, notes, due_date: dueDate,
      status: sendNow ? 'sent' : 'draft',
      anzahlung: hasAnzahlung ? Number(anzahlung) : 0,
      anzahlung_date: hasAnzahlung ? anzahlungDate : null,
      anzahlung_method: hasAnzahlung ? anzahlungMethod : null,
      restbetrag: hasAnzahlung ? restbetrag : subtotal,
    }
    const res  = await fetch('/api/os/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json() as { id: string }
    return data.id
  }

  async function handleSaveDraft() {
    setSaving(true)
    try { const id = await saveInvoice(false); if (id) router.push('/os/invoices') }
    finally { setSaving(false) }
  }

  async function handleSend() {
    if (!clientEmail.trim()) { alert('Client email required to send invoice.'); return }
    setSending(true)
    try {
      const id = await saveInvoice(false)
      if (!id) return
      await fetch('/api/os/send-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: id, client_email: clientEmail, client_name: clientName, invoice_number: invoiceNumber, date, due_date: dueDate, line_items: lineItems.filter(i => i.description), total: subtotal }),
      })
      router.push('/os/invoices')
    } finally { setSending(false) }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* AI Modal */}
      {aiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(249,115,22,0.3)', width: '100%', maxWidth: '560px', padding: '28px', borderRadius: '4px' }}>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '18px', color: '#FFF', margin: '0 0 6px', letterSpacing: '-0.02em' }}>AI Invoice Generator</h2>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', letterSpacing: '0.12em', margin: '0 0 16px' }}>PASTE RAW NOTES OR DESCRIBE THE JOB</p>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={8}
              placeholder={'Example: Website für Müller GmbH, Essen. 5 Seiten, Kontaktformular, SEO. Preis 1500 Euro. Anzahlung 750 erhalten am 10.4.2026.'}
              style={{ ...inp, resize: 'vertical', marginBottom: '12px', lineHeight: 1.6 }}
            />
            {aiError && <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', margin: '0 0 12px' }}>{aiError}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading || !rawText.trim()}
                style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: aiLoading || !rawText.trim() ? 0.5 : 1 }}
              >
                {aiLoading ? 'Extracting...' : 'Generate Invoice with AI →'}
              </button>
              <button onClick={() => { setAiModalOpen(false); setAiError('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '12px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {scanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(249,115,22,0.3)', width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '4px' }}>
            <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '18px', color: '#FFF', margin: '0 0 16px' }}>Extract from Image</h2>
            {scanPreview && (
              <img src={scanPreview} alt="Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }} />
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleScanExtract}
                disabled={scanLoading}
                style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: scanLoading ? 0.5 : 1 }}
              >
                {scanLoading ? 'Reading...' : 'Extract Invoice Data →'}
              </button>
              <button onClick={() => { setScanModalOpen(false); setScanPreview(''); setScanBase64('') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '12px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileSelect} />

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── FORM ── */}
        <div style={{ width: '50%', overflowY: 'auto', padding: '28px 32px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h1 style={{ fontFamily: grotesk, fontSize: '20px', fontWeight: 700, color: '#FFF', margin: 0, letterSpacing: '-0.02em' }}>New Invoice</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAiModalOpen(true)} style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px' }}>
                ◈ AI Generate
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px' }}>
                ▦ Scan Image
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Invoice meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label="Invoice No"><input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={inp} /></Field>
              <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></Field>
              <Field label="Due Date"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} /></Field>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

            {/* Client */}
            <Field label="Select Client">
              <select value={clientId} onChange={e => selectClient(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                <option value="">— Select existing client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </Field>
            <Field label="Client Name *"><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Or enter manually" style={inp} /></Field>
            <Field label="Client Email"><input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} style={inp} /></Field>
            <Field label="Client Address">
              <AddressInput value={clientAddress} onChange={setClientAddress} placeholder="Street, City — type to search German addresses" />
            </Field>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

            {/* Line items */}
            <div>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Line Items</p>
              {lineItems.map((item, i) => (
                <div key={i} style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', marginBottom: '6px', borderRadius: '2px' }}>
                  {/* Description row */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="Description"
                      style={{ ...inp, flex: 1 }}
                    />
                    <button
                      onClick={() => toggleFixed(i)}
                      title={item.isFixedPrice ? 'Switch to qty × unit price' : 'Switch to fixed price'}
                      style={{
                        background: item.isFixedPrice ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${item.isFixedPrice ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: item.isFixedPrice ? '#F97316' : '#555',
                        fontFamily: mono, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
                        padding: '0 10px', cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '2px',
                      }}
                    >
                      {item.isFixedPrice ? 'Pauschal' : 'Per Unit'}
                    </button>
                    <button onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>

                  {item.isFixedPrice ? (
                    /* Fixed price: just enter the total */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: '#555', letterSpacing: '0.1em', flexShrink: 0 }}>BETRAG</span>
                      <input
                        type="number"
                        value={item.total}
                        onChange={e => updateItem(i, 'total', Number(e.target.value))}
                        style={{ ...inp, width: '120px', textAlign: 'right' }}
                      />
                      <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>€</span>
                    </div>
                  ) : (
                    /* Per-unit: qty × unit price → auto total */
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 120px 90px 1fr', gap: '6px', alignItems: 'center' }}>
                      <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} placeholder="Qty" style={{ ...inp, padding: '7px 8px', textAlign: 'right' }} />
                      <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={{ ...inp, appearance: 'none', padding: '7px 10px' }}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} placeholder="Unit €" style={{ ...inp, padding: '7px 8px', textAlign: 'right' }} />
                      <span style={{ fontFamily: mono, fontSize: '12px', color: '#F97316', textAlign: 'right' }}>{fmtEur(item.total)}</span>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => setLineItems(prev => [...prev, blankItem()])}
                style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', background: 'none', border: '1px dashed rgba(249,115,22,0.3)', padding: '7px 16px', cursor: 'pointer', marginTop: '4px', letterSpacing: '0.1em', width: '100%', borderRadius: '2px' }}
              >
                + Add Item
              </button>
            </div>

            {/* Totals + Anzahlung */}
            <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>Zwischensumme</span>
                <span style={{ fontFamily: mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>{fmtEur(subtotal)}</span>
              </div>

              {/* Anzahlung toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={hasAnzahlung}
                  onChange={e => setHasAnzahlung(e.target.checked)}
                  style={{ accentColor: '#F97316', width: '14px', height: '14px' }}
                />
                <span style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Anzahlung erhalten / Deposit received
                </span>
              </label>

              {hasAnzahlung && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <Field label="Anzahlung €">
                      <input type="number" value={anzahlung} onChange={e => setAnzahlung(Number(e.target.value))} style={{ ...inp, textAlign: 'right' }} />
                    </Field>
                    <Field label="Datum">
                      <input type="date" value={anzahlungDate} onChange={e => setAnzahlungDate(e.target.value)} style={inp} />
                    </Field>
                    <Field label="Methode">
                      <select value={anzahlungMethod} onChange={e => setAnzahlungMethod(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                        <option>Überweisung</option>
                        <option>Bar</option>
                        <option>PayPal</option>
                        <option>Andere</option>
                      </select>
                    </Field>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: '#888' }}>Anzahlung</span>
                      <span style={{ fontFamily: mono, fontSize: '12px', color: '#F97316' }}>−{fmtEur(Number(anzahlung))}</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF', fontWeight: 700 }}>Restbetrag</span>
                      <span style={{ fontFamily: mono, fontSize: '15px', color: '#FFF', fontWeight: 700 }}>{fmtEur(restbetrag)}</span>
                    </div>
                  </div>
                </div>
              )}

              {!hasAnzahlung && (
                <div style={{ borderTop: '1px solid rgba(249,115,22,0.3)', paddingTop: '10px', textAlign: 'right' }}>
                  <span style={{ fontFamily: grotesk, fontSize: '20px', fontWeight: 700, color: '#FFF' }}>{fmtEur(subtotal)}</span>
                  <p style={{ fontFamily: mono, fontSize: '9px', color: '#444', margin: '4px 0 0', letterSpacing: '0.06em' }}>Gemäß §19 UStG keine MwSt.</p>
                </div>
              )}
            </div>

            <Field label="Notes">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
            </Field>

            <div style={{ display: 'flex', gap: '10px', paddingBottom: '24px' }}>
              <button onClick={handleSaveDraft} disabled={saving} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={handleSend} disabled={sending} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Sending...' : 'Send Invoice'}
              </button>
            </div>
          </div>
        </div>

        {/* ── LIVE PREVIEW ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f0f0f0', padding: '28px' }}>
          <p style={{ fontFamily: mono, fontSize: '9px', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>Live Preview</p>
          <div style={{ background: '#FFF', maxWidth: '520px', margin: '0 auto', fontFamily: 'Arial,sans-serif', fontSize: '13px', color: '#111', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ background: '#0A0A0A', padding: '22px 28px', borderBottom: '3px solid #F97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#FFF', margin: '0 0 4px' }}>MAXPROMO DIGITAL</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Marcel Tabit Akwe · Körnerstr. 8, 45143 Essen</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: 0 }}>info@maxpromo.digital · maxpromo.digital</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#FFF', margin: '0 0 4px' }}>RECHNUNG</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#F97316', margin: '0 0 2px' }}>Nr: {invoiceNumber}</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Datum: {date ? new Date(date + 'T12:00:00').toLocaleDateString('de-DE') : '—'}</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: 0 }}>Fällig: {dueDate ? new Date(dueDate + 'T12:00:00').toLocaleDateString('de-DE') : '—'}</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 28px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>An / To</p>
              <p style={{ margin: '0 0 2px', fontWeight: 600 }}>{clientName || '—'}</p>
              {clientAddress && <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{clientAddress}</p>}
            </div>
            <div style={{ padding: '18px 28px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee', background: '#f5f5f5' }}>
                    {['Pos', 'Beschreibung', 'Menge', 'Preis'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Menge' || h === 'Preis' ? 'right' : 'left', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.filter(i => i.description).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: '11px', color: '#F97316', fontWeight: 700 }}>{String(i+1).padStart(2,'0')}</td>
                      <td style={{ padding: '7px 8px', fontSize: '13px', color: '#111' }}>
                        {item.description}
                        {!item.isFixedPrice && item.unit && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', marginLeft: '4px' }}>({item.qty} {item.unit})</span>}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>{item.isFixedPrice ? '1' : item.qty}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#111', fontWeight: 700 }}>{fmtEur(Number(item.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', borderTop: '2px solid #F97316', paddingTop: '10px' }}>
                {hasAnzahlung ? (
                  <>
                    <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#555', margin: '0 0 3px' }}>Zwischensumme: {fmtEur(subtotal)}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#555', margin: '0 0 6px' }}>Anzahlung: −{fmtEur(Number(anzahlung))}</p>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#111' }}>Restbetrag: {fmtEur(restbetrag)}</span>
                    </div>
                    {anzahlungDate && <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', margin: '8px 0 0', textAlign: 'left', fontStyle: 'italic' }}>Vielen Dank für Ihre Anzahlung von {fmtEur(Number(anzahlung))} am {new Date(anzahlungDate + 'T12:00:00').toLocaleDateString('de-DE')}.</p>}
                  </>
                ) : (
                  <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#111' }}>Gesamt: {fmtEur(subtotal)}</span>
                )}
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', margin: '10px 0 0' }}>Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>
            </div>
            <div style={{ padding: '14px 28px', borderTop: '1px solid #eee', background: '#f9f9f9' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Bankverbindung</p>
              <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#111', margin: '0 0 2px' }}>Marcel Tabit Akwe &nbsp;·&nbsp; IBAN: DE03 1001 0178 3648 4449 24 &nbsp;·&nbsp; BIC: REVODEB2</p>
              <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', margin: 0 }}>Steuernummer: 111/5339/7597 &nbsp;·&nbsp; Finanzamt: Essen-NordOst</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
