'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface LineItem { description: string; qty: number; unit_price: number; total: number }
interface Client   { id: string; name: string; company: string; email: string; address: string; city: string; country: string }

const blankItem = (): LineItem => ({ description: '', qty: 1, unit_price: 0, total: 0 })

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)',
  color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box' as const,
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
  const [dueDate,  setDueDate]  = useState(addDays(30))
  const [clientId, setClientId] = useState('')
  const [clientName,    setClientName]    = useState('')
  const [clientEmail,   setClientEmail]   = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([blankItem()])
  const [notes,    setNotes]    = useState('')
  const [clients,  setClients]  = useState<Client[]>([])
  const [saving,   setSaving]   = useState(false)
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    fetch('/api/os/invoices?next=true').then(r => r.json()).then(d => setInvoiceNumber((d as { number: string }).number)).catch(() => {})
    fetch('/api/os/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => {
      const items = [...prev]
      items[i] = { ...items[i], [field]: value }
      if (field === 'qty' || field === 'unit_price') {
        items[i].total = Number(items[i].qty) * Number(items[i].unit_price)
      }
      return items
    })
  }

  function removeItem(i: number) {
    setLineItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function selectClient(id: string) {
    const c = clients.find(c => c.id === id)
    if (!c) { setClientId(''); return }
    setClientId(c.id)
    setClientName(c.name + (c.company ? ` — ${c.company}` : ''))
    setClientEmail(c.email || '')
    setClientAddress([c.address, c.city, c.country].filter(Boolean).join(', '))
  }

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)

  async function saveInvoice(sendNow = false): Promise<string | null> {
    if (!clientName.trim() || lineItems.every(i => !i.description)) return null
    const body = {
      invoice_number: invoiceNumber, client_id: clientId || undefined,
      client_name: clientName, client_email: clientEmail, client_address: clientAddress,
      line_items: lineItems.filter(i => i.description), subtotal, total: subtotal, notes,
      due_date: dueDate, status: sendNow ? 'sent' : 'draft',
    }
    const res = await fetch('/api/os/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json() as { id: string }
    return data.id
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const id = await saveInvoice(false)
      if (id) router.push('/os/invoices')
    } finally { setSaving(false) }
  }

  async function handleSend() {
    if (!clientEmail.trim()) { alert('Client email required to send invoice.'); return }
    setSending(true)
    try {
      const id = await saveInvoice(false)
      if (!id) return
      await fetch('/api/os/send-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: id, client_email: clientEmail, client_name: clientName,
          invoice_number: invoiceNumber, date, due_date: dueDate,
          line_items: lineItems.filter(i => i.description), total: subtotal,
        }),
      })
      router.push('/os/invoices')
    } finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── LEFT: FORM ── */}
      <div style={{ width: '50%', overflowY: 'auto', padding: '32px 32px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontFamily: grotesk, fontSize: '22px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 28px' }}>New Invoice</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Field label="Invoice No">
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Date">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Due Date">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          {/* Client */}
          <Field label="Select Client">
            <select value={clientId} onChange={e => selectClient(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">— Select existing client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
            </select>
          </Field>

          <Field label="Client Name *">
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Or enter manually" style={inputStyle} />
          </Field>
          <Field label="Client Email">
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Client Address">
            <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Street, City, Country" style={inputStyle} />
          </Field>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

          {/* Line items */}
          <div>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Line Items</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 80px 24px', gap: '4px', marginBottom: '6px' }}>
              {['Description', 'Qty', 'Unit Price', 'Total', ''].map(h => (
                <span key={h} style={{ fontFamily: mono, fontSize: '9px', color: '#333', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {lineItems.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 80px 24px', gap: '4px', marginBottom: '4px' }}>
                <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" style={{ ...inputStyle, padding: '7px 10px' }} />
                <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} style={{ ...inputStyle, padding: '7px 8px', textAlign: 'right' }} />
                <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} style={{ ...inputStyle, padding: '7px 8px', textAlign: 'right' }} />
                <span style={{ fontFamily: mono, fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{fmtEur(item.total)}</span>
                <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
              </div>
            ))}
            <button
              onClick={() => setLineItems(prev => [...prev, blankItem()])}
              style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', background: 'none', border: '1px dashed rgba(249,115,22,0.3)', padding: '7px 14px', cursor: 'pointer', marginTop: '6px', letterSpacing: '0.1em' }}
            >
              + Add Item
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px', textAlign: 'right' }}>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 6px' }}>Gesamt / Total</p>
              <p style={{ fontFamily: grotesk, fontSize: '22px', fontWeight: 700, color: '#FFF', margin: 0 }}>{fmtEur(subtotal)}</p>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#444', margin: '4px 0 0', letterSpacing: '0.06em' }}>Gemäß §19 UStG keine MwSt.</p>
            </div>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'flex', gap: '10px', paddingBottom: '20px' }}>
            <button onClick={handleSaveDraft} disabled={saving} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={handleSend} disabled={sending} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Sending...' : 'Send Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: LIVE PREVIEW ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5', padding: '32px' }}>
        <p style={{ fontFamily: mono, fontSize: '9px', color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>Live Preview</p>
        <div style={{ background: '#FFF', maxWidth: '560px', margin: '0 auto', fontFamily: 'Arial,sans-serif', fontSize: '13px', color: '#111', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
          {/* Header */}
          <div style={{ background: '#0A0A0A', padding: '24px 28px', borderBottom: '3px solid #F97316' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#FFF', margin: '0 0 4px' }}>MAXPROMO DIGITAL</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Marcel Tabit Akwe</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Körnerstr. 8, 45143 Essen</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 2px' }}>info@maxpromo.digital</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: 0 }}>maxpromo.digital</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: '#FFF', margin: '0 0 6px', letterSpacing: '0.08em' }}>RECHNUNG</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#F97316', margin: '0 0 2px' }}>Nr: {invoiceNumber}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: '0 0 2px' }}>
                  Datum: {date ? new Date(date).toLocaleDateString('de-DE') : '—'}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', margin: 0 }}>
                  Fällig: {dueDate ? new Date(dueDate).toLocaleDateString('de-DE') : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Client */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>An / To</p>
            <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#111' }}>{clientName || '—'}</p>
            {clientAddress && <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{clientAddress}</p>}
          </div>

          {/* Line items */}
          <div style={{ padding: '20px 28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee', background: '#f5f5f5' }}>
                  <th style={{ padding: '7px 8px', textAlign: 'left', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pos</th>
                  <th style={{ padding: '7px 8px', textAlign: 'left', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Beschreibung</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menge</th>
                  <th style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preis</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.filter(i => i.description).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#F97316', fontWeight: 700 }}>{String(i+1).padStart(2,'0')}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#111' }}>{item.description}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#555' }}>{item.qty}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#111', fontWeight: 700 }}>{fmtEur(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', borderTop: '2px solid #F97316', paddingTop: '12px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#111' }}>Gesamt: {fmtEur(subtotal)}</span>
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', margin: '10px 0' }}>
              Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
            </p>
          </div>

          {/* Bank */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid #eee', background: '#f9f9f9' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Bankverbindung</p>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#111', margin: '0 0 2px' }}>Marcel Tabit Akwe</p>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#111', margin: '0 0 2px' }}>IBAN: DE03 1001 0178 3648 4449 24</p>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#111', margin: '0 0 10px' }}>BIC: REVODEB2</p>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', margin: '0 0 2px' }}>Steuernummer: 111/5339/7597</p>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#888', margin: 0 }}>Finanzamt: Essen-NordOst</p>
          </div>
        </div>
      </div>
    </div>
  )
}
