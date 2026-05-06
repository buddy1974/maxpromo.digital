'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
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

interface AIExtractedItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  finalPrice: number
  isFixedPrice: boolean
  confidence?: 'high' | 'medium' | 'low'
}
interface AIExtracted {
  clientName?: string
  clientCompany?: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientCity?: string
  clientPostcode?: string
  lineItems?: AIExtractedItem[]
  includedItems?: string[]
  paymentTerms?: string
  anzahlung?: number
  anzahlungDate?: string
  anzahlungMethod?: string
  notes?: string
  dueDate?: string
  validUntil?: string
  overallConfidence?: 'high' | 'medium' | 'low'
  extractionNotes?: string
  warnings?: string[]
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

  // ── AI raw-paste state ────────────────────────────────────────────────
  const [aiOpen,        setAiOpen]        = useState(false)
  const [aiRawText,     setAiRawText]     = useState('')
  const [aiLoading,     setAiLoading]     = useState(false)
  const [aiError,       setAiError]       = useState('')
  const [aiPreview,     setAiPreview]     = useState('')
  const [aiDragOver,    setAiDragOver]    = useState(false)
  const [aiMode,        setAiMode]        = useState<'merge' | 'replace'>('merge')
  const [aiAppliedMsg,  setAiAppliedMsg]  = useState('')
  const aiFileRef = useRef<HTMLInputElement>(null)

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

  /**
   * Keep unit_price and total in agreement so the document never displays
   * inconsistent math.
   *
   *   pauschal item       — qty=1, total = unit_price (whichever the user
   *                         touches, the other follows)
   *   per-unit item       — total = qty × unit_price; if the user edits
   *                         total directly, unit_price = total / qty
   */
  function updateItem(i: number, field: keyof LineItem, value: string | number | boolean) {
    setLineItems(prev => {
      const items = [...prev]
      const next = { ...items[i], [field]: value } as LineItem
      const qty = Math.max(1, Number(next.qty) || 1)

      if (next.isFixedPrice) {
        // Pauschal: 1 line, qty fixed at 1, total === unit_price.
        next.qty = 1
        if (field === 'total') next.unit_price = Number(next.total) || 0
        else if (field === 'unit_price') next.total = Number(next.unit_price) || 0
      } else {
        // Per-unit: any change to qty or unit_price recomputes total;
        // a change to total back-computes unit_price.
        if (field === 'qty' || field === 'unit_price') {
          next.total = qty * (Number(next.unit_price) || 0)
        } else if (field === 'total') {
          next.unit_price = (Number(next.total) || 0) / qty
        }
      }

      // Toggling pauschal → per-unit (or back) — re-anchor on total.
      if (field === 'isFixedPrice') {
        if (next.isFixedPrice) {
          next.qty = 1
          next.unit_price = Number(next.total) || 0
        } else {
          // Keep the existing total as anchor, infer unit_price.
          next.unit_price = (Number(next.total) || 0) / Math.max(1, Number(next.qty) || 1)
        }
      }

      items[i] = next
      return items
    })
  }

  // ── AI raw-paste handlers ─────────────────────────────────────────────

  /**
   * Apply AI-extracted data on top of the current form.
   *
   * mode='merge' (default) — partial-data friendly:
   *   • text fields fill ONLY when the existing value is empty
   *   • lineItems are APPENDED to existing
   *   • includedItems is the union of the two sets
   *   • notes are appended on a new line with a separator
   *   • anzahlung is set ONLY when no existing one
   *
   * mode='replace' — overwrite everything the AI returned values for.
   */
  function applyExtracted(d: AIExtracted, mode: 'merge' | 'replace') {
    const isReplace = mode === 'replace'
    const setIfEmptyOrReplace = (current: string, incoming: string | undefined, setter: (v: string) => void) => {
      if (!incoming) return
      if (isReplace || !current.trim()) setter(incoming)
    }

    // Client info
    const incomingName = d.clientName + (d.clientCompany ? ` — ${d.clientCompany}` : '')
    if (d.clientName) setIfEmptyOrReplace(clientName, incomingName, setClientName)
    setIfEmptyOrReplace(clientEmail, d.clientEmail, setClientEmail)

    // Address: flatten AI's split fields into our single textarea field.
    const flatAddr = [
      d.clientAddress,
      [d.clientPostcode, d.clientCity].filter(Boolean).join(' '),
    ].filter(s => s && s.trim()).join('\n')
    setIfEmptyOrReplace(clientAddress, flatAddr || undefined, setClientAddress)

    // Dates
    const incomingValid = d.validUntil || d.dueDate || ''
    setIfEmptyOrReplace(validUntil, incomingValid, setValidUntil)

    // Line items
    const newItems = (d.lineItems ?? []).map(li => ({
      description:  li.description,
      qty:          li.quantity,
      unit:         li.unit || 'pauschal',
      unit_price:   li.unitPrice,
      total:        li.finalPrice,
      isFixedPrice: li.isFixedPrice,
    }))
    if (newItems.length) {
      if (isReplace) {
        setLineItems(newItems)
      } else {
        // Drop any leading blank starter row before appending.
        setLineItems(prev => {
          const filtered = prev.filter(it => it.description.trim().length > 0)
          return [...filtered, ...newItems]
        })
      }
    }

    // Anzahlung — only set if there isn't one already (unless replacing).
    if (typeof d.anzahlung === 'number' && d.anzahlung > 0 && (isReplace || !hasAnzahlung)) {
      setHasAnzahlung(true)
      setAnzahlung(d.anzahlung)
      if (d.anzahlungDate) setAnzahlungDate(d.anzahlungDate)
      if (d.anzahlungMethod) setAnzahlungMethod(d.anzahlungMethod)
    }

    // Payment terms — fill if empty, replace on demand.
    setIfEmptyOrReplace(paymentTerms, d.paymentTerms, setPaymentTerms)

    // Included items — union on merge, replace on replace.
    if (Array.isArray(d.includedItems) && d.includedItems.length > 0) {
      if (isReplace) {
        setIncludedItems(d.includedItems)
      } else {
        const seen = new Set(includedItems.map(s => s.trim().toLowerCase()))
        const additions = d.includedItems.filter(s => !seen.has(s.trim().toLowerCase()))
        if (additions.length) setIncludedItems([...includedItems, ...additions])
      }
    }

    // Notes — append on merge, replace on replace.
    if (d.notes?.trim()) {
      if (isReplace) {
        setNotes(d.notes.trim())
      } else if (!notes.includes(d.notes.trim())) {
        setNotes(notes.trim() ? `${notes.trim()}\n\n${d.notes.trim()}` : d.notes.trim())
      }
    }

    // Build a friendly toast describing what landed.
    const summary: string[] = []
    if (newItems.length) summary.push(`${newItems.length} line item${newItems.length === 1 ? '' : 's'} ${isReplace ? 'replaced' : 'added'}`)
    if (d.includedItems?.length) summary.push(`${d.includedItems.length} included item${d.includedItems.length === 1 ? '' : 's'}`)
    if (d.paymentTerms) summary.push('payment terms')
    if (d.warnings?.length) summary.push(`${d.warnings.length} warning${d.warnings.length === 1 ? '' : 's'}`)
    setAiAppliedMsg(summary.length ? `${isReplace ? 'Replaced' : 'Merged'}: ${summary.join(' · ')}` : 'No new data extracted.')
  }

  async function aiExtractFromText() {
    if (!aiRawText.trim()) return
    setAiLoading(true); setAiError(''); setAiAppliedMsg('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'angebot', text: aiRawText }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted, aiMode)
      setAiOpen(false); setAiRawText(''); setAiPreview('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setAiLoading(false)
    }
  }

  const aiExtractFromImage = useCallback(async (b64: string, mime: string) => {
    setAiLoading(true); setAiError(''); setAiAppliedMsg('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'angebot', image: b64, mediaType: mime }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted, aiMode)
      setAiOpen(false); setAiPreview('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Image extraction failed')
    } finally {
      setAiLoading(false)
    }
  // applyExtracted closure intentionally re-evaluated each call
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode])

  // Clipboard image paste while modal is open
  useEffect(() => {
    if (!aiOpen) return
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const it of Array.from(items)) {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile(); if (!f) continue
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = ev => {
            const dataUrl = ev.target?.result as string
            const [header, b64] = dataUrl.split(',')
            const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
            setAiPreview(dataUrl)
            void aiExtractFromImage(b64, mime)
          }
          reader.readAsDataURL(f)
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [aiOpen, aiExtractFromImage])

  function aiHandleDrop(e: React.DragEvent) {
    e.preventDefault(); setAiDragOver(false)
    const f = e.dataTransfer.files[0]
    if (!f || !f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setAiPreview(dataUrl)
      void aiExtractFromImage(b64, mime)
    }
    reader.readAsDataURL(f)
  }

  function aiHandleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setAiPreview(dataUrl)
      void aiExtractFromImage(b64, mime)
    }
    reader.readAsDataURL(f); e.target.value = ''
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

      {/* AI raw-paste modal — paste text, drop an image, or Ctrl+V a screenshot */}
      {aiOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setAiOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div style={{ background: '#111', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '4px', width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontFamily: sans, fontWeight: 700, fontSize: '18px', color: '#FFF', margin: 0, letterSpacing: '-0.02em' }}>AI — Add data to this Angebot</h2>
                <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: '4px 0 0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Paste text, drop an image, or Ctrl+V a screenshot
                </p>
              </div>
              <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {(['merge', 'replace'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAiMode(m)}
                  style={{
                    flex: 1,
                    background: aiMode === m ? 'rgba(249,115,22,0.15)' : 'transparent',
                    border: `1px solid ${aiMode === m ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: aiMode === m ? '#F97316' : '#888',
                    fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '8px 10px', cursor: 'pointer', borderRadius: '3px',
                  }}
                >
                  {m === 'merge' ? '◐ Merge (default)' : '⊕ Replace all'}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: '0 0 14px', lineHeight: 1.6 }}>
              {aiMode === 'merge'
                ? 'Empty fields get filled. Existing values stay. New line items are appended.'
                : 'Replaces every field the AI returns. Existing data is overwritten.'}
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setAiDragOver(true) }}
              onDragLeave={() => setAiDragOver(false)}
              onDrop={aiHandleDrop}
              style={{
                border: `2px dashed ${aiDragOver ? '#F97316' : 'rgba(255,255,255,0.12)'}`,
                background: aiDragOver ? 'rgba(249,115,22,0.06)' : '#0A0A0A',
                borderRadius: '4px', padding: '14px', marginBottom: '12px',
                minHeight: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              {aiLoading && aiPreview ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.1em', margin: '0 0 6px' }}>⟳ Reading your image...</p>
                  <img src={aiPreview} alt="" style={{ maxWidth: '100%', maxHeight: '110px', objectFit: 'contain', opacity: 0.5 }} />
                </div>
              ) : aiPreview ? (
                <img src={aiPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
              ) : (
                <p style={{ fontFamily: mono, fontSize: '11px', color: '#444', margin: 0, lineHeight: 1.7, textAlign: 'center' }}>
                  📋 Paste image here <strong style={{ color: '#666' }}>Ctrl+V</strong> — or drag &amp; drop a file<br />
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>Screenshots · Photos · WhatsApp · Email</span>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontFamily: mono, fontSize: '10px', color: '#444', letterSpacing: '0.1em' }}>OR PASTE TEXT</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <textarea
              value={aiRawText}
              onChange={e => setAiRawText(e.target.value)}
              rows={5}
              placeholder={'Paste anything — WhatsApp, email, hand-typed notes, partial brief…\n\nExamples:\n• "Add: Wartung 12 Monate, 30€/Monat"\n• "Anzahlung 500€ am 5.5. erhalten"\n• "Email vergessen: kunde@beispiel.de"'}
              style={{ ...inp, resize: 'vertical', marginBottom: '12px', lineHeight: 1.7, fontSize: '12px' }}
            />

            {aiError && <p style={{ fontFamily: mono, fontSize: '10px', color: '#ef4444', margin: '0 0 10px', letterSpacing: '0.06em' }}>⚠ {aiError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={aiExtractFromText}
                disabled={aiLoading || !aiRawText.trim()}
                style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '11px 18px', cursor: aiLoading || !aiRawText.trim() ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: aiLoading || !aiRawText.trim() ? 0.5 : 1, borderRadius: '2px' }}
              >
                {aiLoading && !aiPreview ? 'Extracting...' : `${aiMode === 'merge' ? 'Merge' : 'Replace'} →`}
              </button>
              <button
                type="button"
                onClick={() => aiFileRef.current?.click()}
                disabled={aiLoading}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '11px 14px', cursor: aiLoading ? 'wait' : 'pointer', borderRadius: '2px' }}
              >
                ▦ Browse File
              </button>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                disabled={aiLoading}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '11px 14px', cursor: aiLoading ? 'wait' : 'pointer', borderRadius: '2px', marginLeft: 'auto' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={aiFileRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        style={{ display: 'none' }}
        onChange={aiHandleFile}
      />

      {/* Breadcrumb */}
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', marginBottom: '16px', letterSpacing: '0.1em' }}>
        <Link href="/os/angebote" style={{ color: '#555', textDecoration: 'none' }}>Angebote</Link>
        {' / '}
        <Link href={`/os/angebote/${id}`} style={{ color: '#555', textDecoration: 'none' }}>{angebotNumber}</Link>
        {' / '}
        <span style={{ color: '#FFF' }}>edit</span>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: sans, fontSize: '24px', fontWeight: 700, color: '#FFF', margin: 0, letterSpacing: '-0.02em' }}>
          Edit {angebotNumber}
        </h1>
        <button
          type="button"
          onClick={() => { setAiOpen(true); setAiError(''); setAiPreview('') }}
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', padding: '9px 16px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '4px' }}
          title="Paste raw notes, an email, or a screenshot — AI fills in the gaps"
        >
          ◈ AI Add Data
        </button>
      </div>

      {aiAppliedMsg && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', borderLeft: '3px solid #22c55e', padding: '10px 14px', marginBottom: '16px', borderRadius: '3px' }}>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#4ade80', margin: 0, letterSpacing: '0.04em' }}>✓ {aiAppliedMsg}</p>
        </div>
      )}

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
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <textarea
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="Beschreibung der Leistung — mehrzeilig erlaubt"
                  rows={Math.max(1, Math.min(8, item.description.split('\n').length))}
                  style={{ ...inp, flex: 1, resize: 'vertical', lineHeight: 1.5, fontFamily: sans, minHeight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => updateItem(i, 'isFixedPrice', !item.isFixedPrice)}
                  style={{
                    background: item.isFixedPrice ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${item.isFixedPrice ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: item.isFixedPrice ? '#F97316' : '#555',
                    fontFamily: mono, fontSize: '9px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '8px 10px', cursor: 'pointer',
                    whiteSpace: 'nowrap', borderRadius: '2px', alignSelf: 'flex-start',
                  }}
                >
                  {item.isFixedPrice ? 'Pauschal' : 'Per Unit'}
                </button>
                <button
                  type="button"
                  onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '18px', padding: '4px 6px', alignSelf: 'flex-start' }}
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
