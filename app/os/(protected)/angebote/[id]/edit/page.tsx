'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

interface LineItem {
  description: string
  qty: number
  unit: string
  unit_price: number
  total: number
  isFixedPrice: boolean
}

interface Angebot {
  id: string
  angebot_number: string
  client_name: string
  client_email: string | null
  client_address: string | null
  line_items: LineItem[]
  subtotal: number | string
  total: number | string
  status: string
  created_at: string
  valid_until: string | null
  notes: string | null
  anzahlung?: number | string | null
  anzahlung_date?: string | null
  anzahlung_method?: string | null
  payment_terms?: string | null
  included_items?: string[] | null
}

const UNITS = ['pauschal', 'Stück', 'Stunden', 'Tage', 'Seiten', 'Monat', 'Lizenz']
const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired']

const blankItem = (): LineItem => ({
  description: '', qty: 1, unit: 'pauschal',
  unit_price: 0, total: 0, isFixedPrice: true,
})

const inp: React.CSSProperties = {
  width: '100%', background: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.08)', color: '#FFF',
  fontFamily: sans, fontSize: '13px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box',
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function dateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  // PATCH expects YYYY-MM-DD. The DB returns either that already or a full
  // ISO datetime; in either case the first 10 chars are the date.
  return value.slice(0, 10)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

export default function EditAngebotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Form state
  const [angebotNumber, setAngebotNumber] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [status, setStatus] = useState('draft')

  const [clientName,    setClientName]    = useState('')
  const [clientEmail,   setClientEmail]   = useState('')
  const [clientAddress, setClientAddress] = useState('')   // free-form multi-line

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [notes,     setNotes]     = useState('')

  const [hasAnzahlung,    setHasAnzahlung]    = useState(false)
  const [anzahlung,       setAnzahlung]       = useState(0)
  const [anzahlungDate,   setAnzahlungDate]   = useState('')
  const [anzahlungMethod, setAnzahlungMethod] = useState('Überweisung')

  const [paymentTerms,  setPaymentTerms]  = useState('')
  const [includedItems, setIncludedItems] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    fetch(`/api/os/angebote?id=${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then((d: Angebot) => {
        setAngebotNumber(d.angebot_number ?? '')
        setCreatedAt(d.created_at ?? '')
        setValidUntil(dateInputValue(d.valid_until))
        setStatus(d.status ?? 'draft')

        setClientName(d.client_name ?? '')
        setClientEmail(d.client_email ?? '')
        setClientAddress(d.client_address ?? '')

        const items = Array.isArray(d.line_items) ? d.line_items : []
        setLineItems(items.length > 0 ? items.map(it => ({
          description:  it.description ?? '',
          qty:          Number(it.qty) || 1,
          unit:         it.unit || 'pauschal',
          unit_price:   Number(it.unit_price) || 0,
          total:        Number(it.total) || 0,
          isFixedPrice: it.isFixedPrice ?? true,
        })) : [blankItem()])

        setNotes(d.notes ?? '')

        const anzNum = Number(d.anzahlung ?? 0)
        if (anzNum > 0) {
          setHasAnzahlung(true)
          setAnzahlung(anzNum)
          setAnzahlungDate(dateInputValue(d.anzahlung_date))
          setAnzahlungMethod(d.anzahlung_method ?? 'Überweisung')
        }

        setPaymentTerms(d.payment_terms ?? '')
        setIncludedItems(Array.isArray(d.included_items) ? d.included_items : [])

        setLoading(false)
      })
      .catch(() => { setLoadError('Could not load this Angebot.'); setLoading(false) })
  }, [id])

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

  const subtotal = lineItems.reduce((s, i) => s + Number(i.total), 0)
  const restbet  = subtotal - (hasAnzahlung ? Number(anzahlung) : 0)

  async function handleSave() {
    if (!clientName.trim()) {
      setSaveError('Client name is required.')
      return
    }
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/os/angebote', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          valid_until: validUntil || null,
          client_name:    clientName,
          client_email:   clientEmail,
          client_address: clientAddress,
          line_items:     lineItems.filter(li => li.description.trim()),
          subtotal,
          total:          subtotal,
          notes,
          anzahlung:        hasAnzahlung ? Number(anzahlung) : 0,
          anzahlung_date:   hasAnzahlung && anzahlungDate ? anzahlungDate : null,
          anzahlung_method: hasAnzahlung ? anzahlungMethod : undefined,
          payment_terms:    paymentTerms,
          included_items:   includedItems,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        throw new Error(err.detail ?? err.error ?? `Server error ${res.status}`)
      }
      router.push(`/os/angebote/${id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em' }}>Loading...</p>
    </div>
  )

  if (loadError) return (
    <div style={{ padding: '40px' }}>
      <p style={{ fontFamily: mono, fontSize: '12px', color: '#ef4444' }}>{loadError}</p>
      <Link href="/os/angebote" style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', textDecoration: 'none' }}>← Back to Angebote</Link>
    </div>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: '780px' }}>
      {/* Breadcrumb */}
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', marginBottom: '16px', letterSpacing: '0.1em' }}>
        <Link href="/os/angebote" style={{ color: '#555', textDecoration: 'none' }}>Angebote</Link>
        {' / '}
        <Link href={`/os/angebote/${id}`} style={{ color: '#555', textDecoration: 'none' }}>{angebotNumber}</Link>
        {' / '}
        <span style={{ color: '#FFF' }}>edit</span>
      </p>

      <h1 style={{ fontFamily: sans, fontSize: '24px', fontWeight: 700, color: '#FFF', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
        Edit {angebotNumber}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <Field label="Angebot No"><input value={angebotNumber} disabled style={{ ...inp, opacity: 0.5 }} /></Field>
          <Field label="Date"><input value={createdAt ? new Date(createdAt).toLocaleDateString('de-DE') : ''} disabled style={{ ...inp, opacity: 0.5 }} /></Field>
          <Field label="Valid Until"><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inp} /></Field>
        </div>

        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inp, appearance: 'none' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '4px 0' }} />

        <Field label="Client Name *">
          <input value={clientName} onChange={e => setClientName(e.target.value)} style={inp} />
        </Field>
        <Field label="Client Email">
          <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="kunde@example.com" style={inp} />
        </Field>
        <Field label="Client Address (multi-line OK)">
          <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
        </Field>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '4px 0' }} />

        {/* Line items */}
        <div>
          <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Line Items</p>
          {lineItems.map((item, i) => (
            <div key={i} style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', marginBottom: '6px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="Description"
                  style={{ ...inp, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => updateItem(i, 'isFixedPrice', !item.isFixedPrice)}
                  style={{
                    background: item.isFixedPrice ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${item.isFixedPrice ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: item.isFixedPrice ? '#F97316' : '#555',
                    fontFamily: mono, fontSize: '9px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '0 10px', cursor: 'pointer',
                    whiteSpace: 'nowrap', borderRadius: '2px',
                  }}
                >
                  {item.isFixedPrice ? 'Pauschal' : 'Per Unit'}
                </button>
                <button
                  type="button"
                  onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
              {item.isFixedPrice ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: mono, fontSize: '10px', color: '#555', letterSpacing: '0.1em' }}>BETRAG</span>
                  <input type="number" value={item.total} onChange={e => updateItem(i, 'total', Number(e.target.value))} style={{ ...inp, width: '120px', textAlign: 'right' }} />
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>€</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '60px 120px 90px 1fr', gap: '6px', alignItems: 'center' }}>
                  <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} style={{ ...inp, padding: '7px 8px', textAlign: 'right' }} />
                  <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={{ ...inp, appearance: 'none', padding: '7px 10px' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} style={{ ...inp, padding: '7px 8px', textAlign: 'right' }} />
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#F97316', textAlign: 'right' }}>{fmtEur(item.total)}</span>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLineItems(prev => [...prev, blankItem()])}
            style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', background: 'none', border: '1px dashed rgba(249,115,22,0.3)', padding: '7px 16px', cursor: 'pointer', marginTop: '4px', letterSpacing: '0.1em', width: '100%', borderRadius: '2px' }}
          >
            + Add Item
          </button>
        </div>

        {/* Anzahlung + total */}
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontFamily: mono, fontSize: '11px', color: '#888' }}>Zwischensumme</span>
            <span style={{ fontFamily: mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>{fmtEur(subtotal)}</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" checked={hasAnzahlung} onChange={e => setHasAnzahlung(e.target.checked)} style={{ accentColor: '#F97316', width: '14px', height: '14px' }} />
            <span style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Anzahlung erhalten</span>
          </label>
          {hasAnzahlung && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <Field label="Anzahlung €"><input type="number" value={anzahlung} onChange={e => setAnzahlung(Number(e.target.value))} style={{ ...inp, textAlign: 'right' }} /></Field>
                <Field label="Datum"><input type="date" value={anzahlungDate} onChange={e => setAnzahlungDate(e.target.value)} style={inp} /></Field>
                <Field label="Methode">
                  <select value={anzahlungMethod} onChange={e => setAnzahlungMethod(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                    <option>Überweisung</option><option>Bar</option><option>PayPal</option><option>Andere</option>
                  </select>
                </Field>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: '#FFF', fontWeight: 700 }}>Restbetrag</span>
                <span style={{ fontFamily: mono, fontSize: '15px', color: '#FFF', fontWeight: 700 }}>{fmtEur(restbet)}</span>
              </div>
            </>
          )}
          {!hasAnzahlung && (
            <div style={{ borderTop: '1px solid rgba(249,115,22,0.3)', paddingTop: '10px', textAlign: 'right' }}>
              <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 700, color: '#FFF' }}>{fmtEur(subtotal)}</span>
            </div>
          )}
        </div>

        <Field label="Payment Terms">
          <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="z.B. Zahlung in 2 Raten möglich" style={inp} />
        </Field>

        <Field label="Included (free) items">
          <textarea
            value={includedItems.join('\n')}
            onChange={e => setIncludedItems(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
            rows={3}
            placeholder="One per line — items provided free that aren&rsquo;t billed"
            style={{ ...inp, resize: 'vertical' }}
          />
        </Field>

        <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...inp, resize: 'vertical' }} /></Field>

        {saveError && (
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>⚠ {saveError}</p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !clientName.trim()}
            style={{
              background: '#F97316', border: 'none', color: '#000',
              fontFamily: mono, fontWeight: 700, fontSize: '11px',
              letterSpacing: '0.1em', padding: '12px 20px',
              cursor: saving || !clientName.trim() ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', borderRadius: '2px',
              opacity: saving || !clientName.trim() ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/os/angebote/${id}`}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#888', textDecoration: 'none',
              fontFamily: mono, fontSize: '11px',
              padding: '12px 20px', borderRadius: '2px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              display: 'inline-block',
            }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
