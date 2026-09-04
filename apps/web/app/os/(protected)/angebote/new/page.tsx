'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AngebotDocument } from '@/components/documents/AngebotDocument'
import type { CurrencyCode, PaymentMethodId, DocumentLanguage } from '@/lib/documents/config'
import type { AngebotData } from '@/lib/documents/types'
import { fmtCurrency } from '@/lib/documents/format'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Icon } from '@maxpromo/ui'

const mono    = 'var(--brand-font-mono)'
const sans    = 'var(--brand-font-body)'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice: boolean; aiConfidence?: 'high' | 'medium' | 'low'; category?: string }
interface Client   { id: string; name: string; company: string; email: string; address: string; city: string; country: string }
interface AIExtracted {
  clientName: string; clientCompany: string; clientEmail: string; clientPhone?: string
  clientAddress: string; clientCity: string; clientPostcode?: string
  lineItems: { description: string; quantity: number; unit: string; unitPrice: number; finalPrice: number; isFixedPrice: boolean; confidence?: 'high' | 'medium' | 'low'; category?: string }[]
  includedItems?: string[]
  paymentTerms?: string
  declaredTotal?: number
  computedTotal?: number
  warnings?: string[]
  anzahlung: number; anzahlungDate: string; anzahlungMethod: string
  notes: string; dueDate: string; validUntil?: string
  overallConfidence?: 'high' | 'medium' | 'low'
  extractionNotes?: string
  type?: string
}

const UNITS = ['pauschal', 'Stück', 'Stunden', 'Tage', 'Seiten', 'Monat', 'Lizenz']
const blankItem = (): LineItem => ({ description: '', qty: 1, unit: 'pauschal', unit_price: 0, total: 0, isFixedPrice: true })

function addDays(d: number) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0] }

const inp: React.CSSProperties = { width: '100%', background: 'var(--brand-background)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }
const inpMissing: React.CSSProperties = { ...inp, border: '1px dashed color-mix(in srgb, var(--brand-primary) 50%, transparent)' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

interface NominatimResult {
  display_name: string
  address: {
    road?: string; house_number?: string
    city?: string; town?: string; village?: string; postcode?: string
  }
}

function StreetInput({ value, onChange, placeholder, aiEnhanced, onFill }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  aiEnhanced?: boolean; onFill?: (street: string, postcode: string, city: string) => void
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
        setSuggestions(withStreet); setOpen(withStreet.length > 0)
      } catch { /* ignore */ }
    }, 400)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input value={value} onChange={e => handleChange(e.target.value)} placeholder={placeholder} style={aiEnhanced && !value.trim() ? inpMissing : inp} onBlur={() => setTimeout(() => setOpen(false), 200)} />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', zIndex: 50, maxHeight: '180px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => {
            const road      = s.address.road || ''
            const num       = s.address.house_number || ''
            const streetStr = [road, num].filter(Boolean).join(' ')
            const city      = s.address.city || s.address.town || s.address.village || ''
            const postcode  = s.address.postcode || ''
            return (
              <button key={i}
                onMouseDown={() => { onChange(streetStr || s.display_name.split(',')[0].trim()); onFill?.(streetStr || s.display_name.split(',')[0].trim(), postcode, city); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--brand-text)', fontFamily: sans, fontSize: '12px', padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--brand-border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--brand-primary) 8%, transparent)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {streetStr || s.display_name.split(',').slice(0, 2).join(',')}
                {(postcode || city) && <span style={{ color: 'var(--brand-text-muted)', marginLeft: '10px', fontSize: 'var(--text-label)' }}>{[postcode, city].filter(Boolean).join(' ')}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NewAngebotPage() {
  const router = useRouter()
  const { t } = useOsLocale()

  const [number,      setNumber]      = useState('')
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0])
  const [validUntil,  setValidUntil]  = useState(addDays(30))
  const [clientId,       setClientId]       = useState('')
  const [clientName,     setClientName]     = useState('')
  const [clientEmail,    setClientEmail]    = useState('')
  const [clientStreet,   setClientStreet]   = useState('')
  const [clientPostcode, setClientPostcode] = useState('')
  const [clientCity,     setClientCity]     = useState('')
  const [lineItems,   setLineItems]   = useState<LineItem[]>([blankItem()])
  const [notes,       setNotes]       = useState('')
  const [clients,     setClients]     = useState<Client[]>([])
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [hasAnzahlung,    setHasAnzahlung]    = useState(false)
  const [anzahlung,       setAnzahlung]       = useState(0)
  const [anzahlungDate,   setAnzahlungDate]   = useState('')
  const [anzahlungMethod, setAnzahlungMethod] = useState('Überweisung')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [currency,      setCurrency]      = useState<CurrencyCode>('EUR')
  const [language,      setLanguage]      = useState<DocumentLanguage>('de')

  // AI state
  const [aiModalOpen,  setAiModalOpen]  = useState(false)
  const [rawText,      setRawText]      = useState('')
  const [aiLoading,    setAiLoading]    = useState(false)
  const [aiError,      setAiError]      = useState('')
  const [pastePreview, setPastePreview] = useState('')
  const [isDragOver,   setIsDragOver]   = useState(false)

  // Confidence state
  const [aiEnhanced,        setAiEnhanced]        = useState(false)
  const [overallConfidence,  setOverallConfidence]  = useState<'high' | 'medium' | 'low' | null>(null)
  const [extractionNotes,   setExtractionNotes]   = useState('')
  const [includedItems,     setIncludedItems]     = useState<string[]>([])
  const [paymentTerms,      setPaymentTerms]      = useState('')
  const [aiWarnings,        setAiWarnings]        = useState<string[]>([])

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/os/angebote?next=true').then(r => r.json()).then(d => setNumber((d as { number: string }).number)).catch(() => {})
    fetch('/api/os/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // Clipboard paste
  function applyExtracted(d: AIExtracted) {
    if (d.clientName)  setClientName(d.clientName + (d.clientCompany ? ` — ${d.clientCompany}` : ''))
    if (d.clientEmail) setClientEmail(d.clientEmail)
    if (d.clientAddress) setClientStreet(d.clientAddress)
    if (d.clientCity)    setClientCity(d.clientCity)
    if (d.clientPostcode) setClientPostcode(d.clientPostcode)
    // Build a notes blob that captures payment terms + included items + extractor remarks
    const noteParts: string[] = []
    if (d.notes?.trim()) noteParts.push(d.notes.trim())
    if (d.paymentTerms?.trim()) noteParts.push(`Zahlungsbedingungen: ${d.paymentTerms.trim()}`)
    if (noteParts.length) setNotes(noteParts.join('\n\n'))
    if (d.validUntil || d.dueDate) setValidUntil(d.validUntil || d.dueDate)
    if (d.lineItems?.length) {
      setLineItems(d.lineItems.map(li => ({ description: li.description, qty: li.quantity, unit: li.unit || 'pauschal', unit_price: li.unitPrice, total: li.finalPrice, isFixedPrice: li.isFixedPrice, aiConfidence: li.confidence, category: li.category })))
    }
    if (d.anzahlung > 0) {
      setHasAnzahlung(true); setAnzahlung(d.anzahlung)
      if (d.anzahlungDate) setAnzahlungDate(d.anzahlungDate)
      if (d.anzahlungMethod) setAnzahlungMethod(d.anzahlungMethod)
    }
    setIncludedItems(d.includedItems ?? [])
    setPaymentTerms(d.paymentTerms ?? '')
    setAiWarnings(d.warnings ?? [])
    setOverallConfidence(d.overallConfidence ?? 'medium')
    setExtractionNotes(d.extractionNotes ?? '')
    setAiEnhanced(true)
  }

  const triggerImageExtract = useCallback(async (b64: string, mime: string) => {
    setAiLoading(true); setAiError('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'angebot', image: b64, mediaType: mime }),
      })
      if (!res.ok) throw new Error(t.forms.aiScanFailed)
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted)
      setAiModalOpen(false); setPastePreview('')
    } catch {
      setAiError(t.forms.aiImageReadFailed)
    } finally { setAiLoading(false) }
  }, [t])

  useEffect(() => {
    if (!aiModalOpen) return
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = ev => {
            const dataUrl = ev.target?.result as string
            const [header, b64] = dataUrl.split(',')
            const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
            setPastePreview(dataUrl)
            void triggerImageExtract(b64, mime)
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [aiModalOpen, triggerImageExtract])

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragOver(true) }
  function handleDragLeave() { setIsDragOver(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setPastePreview(dataUrl)
      void triggerImageExtract(b64, mime)
    }
    reader.readAsDataURL(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setPastePreview(dataUrl); setAiModalOpen(true)
      void triggerImageExtract(b64, mime)
    }
    reader.readAsDataURL(file); e.target.value = ''
  }

  async function handleGenerateAI() {
    if (!rawText.trim()) return
    setAiLoading(true); setAiError('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'angebot', text: rawText }),
      })
      if (!res.ok) throw new Error(t.forms.aiExtractionFailed)
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted)
      setAiModalOpen(false); setRawText('')
    } catch (e) { setAiError(e instanceof Error ? e.message : t.forms.aiExtractionFailed) }
    finally { setAiLoading(false) }
  }


  /**
   * Keep unit_price ↔ total in sync so the document never displays
   * inconsistent math. Pauschal items: total === unit_price (qty fixed
   * at 1). Per-unit items: total = qty × unit_price; if total is edited
   * directly we back-compute unit_price from total ÷ qty.
   */
  function updateItem(i: number, field: keyof LineItem, value: string | number | boolean) {
    setLineItems(prev => {
      const items = [...prev]
      const next = { ...items[i], [field]: value } as LineItem
      const qty = Math.max(1, Number(next.qty) || 1)

      if (next.isFixedPrice) {
        next.qty = 1
        if (field === 'total') next.unit_price = Number(next.total) || 0
        else if (field === 'unit_price') next.total = Number(next.unit_price) || 0
      } else {
        if (field === 'qty' || field === 'unit_price') {
          next.total = qty * (Number(next.unit_price) || 0)
        } else if (field === 'total') {
          next.unit_price = (Number(next.total) || 0) / qty
        }
      }

      if (field === 'isFixedPrice') {
        if (next.isFixedPrice) {
          next.qty = 1
          next.unit_price = Number(next.total) || 0
        } else {
          next.unit_price = (Number(next.total) || 0) / Math.max(1, Number(next.qty) || 1)
        }
      }

      items[i] = next
      return items
    })
  }

  function selectClient(id: string) {
    const c = clients.find(x => x.id === id)
    if (!c) { setClientId(''); return }
    setClientId(c.id); setClientName(c.name + (c.company ? ` — ${c.company}` : ''))
    setClientEmail(c.email || '')
    setClientStreet(c.address || '')
    const m = (c.city || '').trim().match(/^(\d{4,5})\s+(.+)$/)
    if (m) { setClientPostcode(m[1]); setClientCity(m[2]) }
    else   { setClientPostcode(''); setClientCity(c.city || '') }
  }

  const fmtEur = useCallback((n: number) => fmtCurrency(n, currency), [currency])

  const subtotal   = lineItems.reduce((s, i) => s + Number(i.total), 0)
  const restbetrag = subtotal - (hasAnzahlung ? Number(anzahlung) : 0)

  async function handleSave() {
    if (!clientName.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      // Compose notes from user-edited notes + included items (free) + payment terms.
      // Once Stage-2 schema lands these get their own columns; for now we
      // round-trip them via the existing `notes` jsonb-free field so nothing
      // is silently lost.
      const noteParts: string[] = []
      if (notes.trim()) noteParts.push(notes.trim())
      if (includedItems.length > 0) {
        noteParts.push(
          'Inklusive (kostenlos):\n' + includedItems.map(it => `  • ${it}`).join('\n'),
        )
      }
      if (paymentTerms.trim() && !notes.includes(paymentTerms)) {
        noteParts.push(`Zahlungsbedingungen: ${paymentTerms.trim()}`)
      }
      const finalNotes = noteParts.join('\n\n')

      const res = await fetch('/api/os/angebote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angebot_number: number,
          client_id: clientId || undefined,
          client_name: clientName,
          client_email: clientEmail,
          client_address: [clientStreet, [clientPostcode, clientCity].filter(Boolean).join(' ')].filter(Boolean).join('\n'),
          line_items: lineItems.filter(i => i.description),
          subtotal,
          total: subtotal,
          status: 'draft',
          valid_until: validUntil,
          notes: finalNotes,
          anzahlung: hasAnzahlung ? Number(anzahlung) : 0,
          anzahlung_date: hasAnzahlung ? anzahlungDate : null,
          payment_method: paymentMethod,
          currency,
          language,
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? `Server error ${res.status}`)
      }
      router.push('/os/angebote')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.forms.saveFailed)
    } finally { setSaving(false) }
  }

  const confColor  = { high: 'var(--semantic-success)', medium: 'var(--brand-primary)', low: 'var(--semantic-danger)' }
  const confBg     = { high: 'color-mix(in srgb, var(--semantic-success) 8%, transparent)', medium: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', low: 'color-mix(in srgb, var(--semantic-danger) 8%, transparent)' }
  const confBorder = { high: 'color-mix(in srgb, var(--semantic-success) 25%, transparent)', medium: 'color-mix(in srgb, var(--brand-primary) 25%, transparent)', low: 'color-mix(in srgb, var(--semantic-danger) 25%, transparent)' }
  const confMsg    = { high: 'High confidence — review and confirm', medium: 'Some fields need review — check highlighted items', low: 'Low confidence — please verify all fields' }
  const confIcon   = { high: 'check', medium: 'warning', low: 'warning' } as const

  function itemBorderLeft(item: LineItem): string | undefined {
    if (item.aiConfidence === 'low')    return '3px solid var(--semantic-danger)'
    if (item.aiConfidence === 'medium') return '3px solid color-mix(in srgb, var(--brand-primary) 60%, transparent)'
    return undefined
  }

  function aiInp(value: string): React.CSSProperties { return aiEnhanced && !value.trim() ? inpMissing : inp }

  return (
    <>
      {/* Unified AI Modal */}
      {aiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}>
          <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', width: '100%', maxWidth: '580px', padding: '28px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: sans, fontWeight: 'var(--weight-heading)', fontSize: '18px', color: 'var(--brand-text)', margin: '0 0 var(--space-1)', letterSpacing: '-0.02em' }}>{t.forms.aiAngebotTitle}</h2>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', margin: 0 }}>{t.forms.aiModalSub}</p>
              </div>
              <button onClick={() => { setAiModalOpen(false); setAiError(''); setPastePreview(''); setRawText('') }} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: 'var(--space-1)' }}>×</button>
            </div>

            {/* Paste / drop zone */}
            <div
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              style={{ border: `2px dashed ${isDragOver ? 'var(--brand-primary)' : 'var(--brand-border)'}`, background: isDragOver ? 'color-mix(in srgb, var(--brand-primary) 6%, transparent)' : 'var(--brand-background)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color var(--duration-base) var(--ease), background var(--duration-base) var(--ease)' }}
            >
              {aiLoading && pastePreview ? (
                <div role="status" style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', letterSpacing: '0.1em', margin: '0 0 var(--space-2)' }}><Icon name="running" size="xs" /> {t.forms.aiReading}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs and offers no benefit for a transient upload preview */}
                  <img src={pastePreview} alt="" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', opacity: 0.5 }} />
                </div>
              ) : pastePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs
                <img src={pastePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }} />
              ) : (
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', letterSpacing: '0.06em', textAlign: 'center', margin: 0, lineHeight: 1.8 }}>
                  {t.forms.aiDropZonePrefix} <strong style={{ color: 'var(--brand-text-secondary)' }}>{t.forms.aiDropZoneKey}</strong> {t.forms.aiDropZoneSuffix}<br />
                  <span style={{ fontSize: 'var(--text-label-dense)', opacity: 0.6 }}>{t.forms.aiDropZoneFormats}</span>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--brand-border)' }} />
              <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.1em' }}>{t.forms.aiOrPasteText}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--brand-border)' }} />
            </div>

            <textarea value={rawText} onChange={e => setRawText(e.target.value)} rows={6} placeholder={t.forms.aiPlaceholderAngebot} style={{ ...inp, resize: 'vertical', marginBottom: 'var(--space-3)', lineHeight: 1.7, fontSize: '12px' }} />

            {aiError && <p role="alert" style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-danger)', margin: '0 0 var(--space-3)', letterSpacing: '0.06em' }}><Icon name="warning" size="xs" /> {aiError}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleGenerateAI} disabled={aiLoading || !rawText.trim()} aria-busy={aiLoading} style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: 'var(--text-label)', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: aiLoading || !rawText.trim() ? 0.5 : 1, borderRadius: 'var(--radius-xs)' }}>
                {aiLoading && !pastePreview ? t.forms.aiExtracting : t.forms.aiGenerateButton}
              </button>
              <button onClick={() => fileRef.current?.click()} style={{ background: 'var(--brand-border)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: 'var(--text-label)', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', borderRadius: 'var(--radius-xs)' }}>
                <Icon name="upload" size="sm" /> Browse File
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*,.pdf" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ width: '50%', overflowY: 'auto', padding: '28px 32px', borderRight: '1px solid var(--brand-border)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: sans, fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', margin: 0 }}>{t.angebotForm.newHeading}</h1>
              {aiEnhanced && (
                <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-success)', background: 'color-mix(in srgb, var(--semantic-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-success) 20%, transparent)', padding: '3px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 'var(--radius-xs)' }}>{t.angebotForm.aiEnhanced}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={() => { setAiModalOpen(true); setAiError(''); setPastePreview('') }} style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', color: 'var(--brand-primary-text)', fontFamily: mono, fontSize: 'var(--text-label-dense)', fontWeight: 700, letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: 'var(--radius-xs)' }}>{t.angebotForm.aiGenerate}</button>
              <button onClick={() => fileRef.current?.click()} style={{ background: 'var(--brand-border)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: 'var(--radius-xs)' }}>{t.angebotForm.scanImage}</button>
            </div>
          </div>

          {/* Confidence banner */}
          {aiEnhanced && overallConfidence && (
            <div style={{ background: confBg[overallConfidence], border: `1px solid ${confBorder[overallConfidence]}`, padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-xs)' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: confColor[overallConfidence], margin: 0, letterSpacing: '0.06em' }}><Icon name={confIcon[overallConfidence]} size="xs" /> {confMsg[overallConfidence]}</p>
            </div>
          )}

          {/* Extraction notes */}
          {aiEnhanced && extractionNotes && (
            <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-xs)' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)', margin: 0, letterSpacing: '0.04em' }}>ℹ️  {extractionNotes}</p>
            </div>
          )}

          {/* Sum-reconciliation + missing-data warnings (server-side) */}
          {aiEnhanced && aiWarnings.length > 0 && (
            <div style={{ background: 'color-mix(in srgb, var(--semantic-danger) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 25%, transparent)', padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-xs)' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-danger)', margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}><Icon name="warning" size="xs" /> Verify before sending</p>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {aiWarnings.map((w, i) => (
                  <li key={i} style={{ fontFamily: sans, fontSize: '12px', color: 'var(--semantic-danger)', lineHeight: 1.5, marginBottom: '2px' }}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Included (free) items — kept out of line items deliberately */}
          {aiEnhanced && includedItems.length > 0 && (
            <div style={{ background: 'var(--brand-surface)', border: '1px solid color-mix(in srgb, var(--semantic-success) 25%, transparent)', borderLeft: '3px solid var(--semantic-success)', padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-xs)' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-success)', margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.forms.includedHeading}</p>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {includedItems.map((it, i) => (
                  <li key={i} style={{ fontFamily: sans, fontSize: '12px', color: 'var(--brand-text)', lineHeight: 1.5, marginBottom: '2px' }}>{it}</li>
                ))}
              </ul>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 'var(--space-2) 0 0', letterSpacing: '0.05em' }}>{t.forms.includedNote}</p>
            </div>
          )}

          {/* Payment terms — captured but stored as part of notes when saving */}
          {aiEnhanced && paymentTerms && (
            <div style={{ background: 'var(--brand-surface)', border: '1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)', borderLeft: '3px solid var(--brand-primary)', padding: '10px 14px', marginBottom: '14px', borderRadius: 'var(--radius-xs)' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', margin: '0 0 var(--space-1)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.forms.paymentTermsHeading}</p>
              <p style={{ fontFamily: sans, fontSize: '12px', color: 'var(--brand-text)', margin: 0, lineHeight: 1.5 }}>{paymentTerms}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label={t.angebotForm.fieldAngebotNo}><input value={number} onChange={e => setNumber(e.target.value)} style={inp} /></Field>
              <Field label={t.angebotForm.fieldDate}><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></Field>
              <Field label={t.angebotForm.fieldValidUntil}><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inp} /></Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label={t.angebotForm.fieldCurrency}>
                <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} style={{ ...inp, appearance: 'none' }}>
                  <option value="EUR">EUR — €</option>
                  <option value="GBP">GBP — £</option>
                </select>
              </Field>
              <Field label={t.angebotForm.fieldPaymentMethod}>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethodId)} style={{ ...inp, appearance: 'none' }}>
                  <option value="bank">{t.status.paymentMethod.bank}</option>
                  <option value="momo">{t.status.paymentMethod.momo}</option>
                  <option value="both">{t.status.paymentMethod.both}</option>
                </select>
              </Field>
              <Field label={t.angebotForm.fieldDocumentLanguage}>
                <select value={language} onChange={e => setLanguage(e.target.value as DocumentLanguage)} style={{ ...inp, appearance: 'none' }}>
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>

            <div style={{ height: '1px', background: 'var(--brand-border)' }} />

            <Field label={t.angebotForm.fieldSelectClient}>
              <select value={clientId} onChange={e => selectClient(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                <option value="">{t.angebotForm.selectClientPlaceholder}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </Field>
            <Field label={t.angebotForm.fieldClientName}>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder={aiEnhanced && !clientName.trim() ? t.forms.notFoundFill : t.forms.enterManually} style={aiInp(clientName)} />
            </Field>
            <Field label={t.angebotForm.fieldClientEmail}>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder={aiEnhanced && !clientEmail.trim() ? t.forms.notFoundFill : t.forms.emailPlaceholder} style={aiInp(clientEmail)} />
            </Field>
            <Field label={t.angebotForm.fieldStreet}>
              <StreetInput
                value={clientStreet}
                onChange={setClientStreet}
                placeholder={aiEnhanced && !clientStreet.trim() ? t.forms.notFoundFill : t.forms.streetPlaceholder}
                aiEnhanced={aiEnhanced && !clientStreet.trim()}
                onFill={(street, postcode, city) => { setClientStreet(street); setClientPostcode(postcode); setClientCity(city) }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
              <Field label={t.angebotForm.fieldPostcode}>
                <input value={clientPostcode} onChange={e => setClientPostcode(e.target.value)} placeholder="40210" maxLength={10} style={aiInp(clientPostcode)} />
              </Field>
              <Field label={t.angebotForm.fieldCity}>
                <input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="Düsseldorf" style={aiInp(clientCity)} />
              </Field>
            </div>

            <div style={{ height: '1px', background: 'var(--brand-border)' }} />

            <div>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>{t.angebotForm.lineItemsHeading}</p>
              {lineItems.map((item, i) => (
                <div key={i} style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderLeft: itemBorderLeft(item) || '1px solid var(--brand-border)', padding: 'var(--space-3)', marginBottom: '6px', borderRadius: 'var(--radius-xs)', position: 'relative' }}>
                  {item.aiConfidence === 'low' && <span style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-danger)', letterSpacing: '0.08em' }}><Icon name="warning" size="xs" /> verify</span>}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <textarea
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder={aiEnhanced && !item.description ? t.forms.notFoundFill : t.forms.descriptionPlaceholderMultiline}
                      rows={Math.max(1, Math.min(8, (item.description || '').split('\n').length))}
                      style={{ ...inp, flex: 1, resize: 'vertical', lineHeight: 1.5, fontFamily: sans, minHeight: '36px', border: aiEnhanced && !item.description ? '1px dashed color-mix(in srgb, var(--brand-primary) 50%, transparent)' : inp.border as string }}
                    />
                    <button onClick={() => { const items = [...lineItems]; items[i] = { ...items[i], isFixedPrice: !items[i].isFixedPrice }; setLineItems(items) }} style={{ background: item.isFixedPrice ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--brand-border)', border: `1px solid ${item.isFixedPrice ? 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' : 'var(--brand-border)'}`, color: item.isFixedPrice ? 'var(--brand-primary-text)' : 'var(--brand-text-muted)', fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: 'var(--radius-xs)' }}>
                      {item.isFixedPrice ? t.angebotForm.pauschal : t.angebotForm.perUnit}
                    </button>
                    <button onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 var(--space-1)' }}>×</button>
                  </div>
                  {item.isFixedPrice ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', flexShrink: 0 }}>{t.forms.amountLabel}</span>
                      <input type="number" value={item.total} onChange={e => updateItem(i, 'total', Number(e.target.value))} style={{ ...inp, width: '120px', textAlign: 'right' }} />
                      <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{currency === 'GBP' ? '£' : '€'}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 120px 90px 1fr', gap: '6px', alignItems: 'center' }}>
                      <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} style={{ ...inp, padding: '7px 8px', textAlign: 'right' }} />
                      <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={{ ...inp, appearance: 'none', padding: '7px 10px' }}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} style={{ ...inp, padding: '7px 8px', textAlign: 'right' }} />
                      <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)', textAlign: 'right' }}>{fmtEur(item.total)}</span>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setLineItems(prev => [...prev, blankItem()])} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', background: 'none', border: '1px dashed color-mix(in srgb, var(--brand-primary) 30%, transparent)', padding: '7px 16px', cursor: 'pointer', marginTop: 'var(--space-1)', letterSpacing: '0.1em', width: '100%', borderRadius: 'var(--radius-xs)' }}>{t.angebotForm.addItem}</button>
            </div>

            <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)' }}>{t.angebotForm.subtotal}</span>
                <span style={{ fontFamily: mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', fontWeight: 700 }}>{fmtEur(subtotal)}</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 'var(--space-3)' }}>
                <input type="checkbox" checked={hasAnzahlung} onChange={e => setHasAnzahlung(e.target.checked)} style={{ accentColor: 'var(--brand-primary)', width: '14px', height: '14px' }} />
                <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.angebotForm.depositReceived}</span>
              </label>
              {hasAnzahlung && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: '10px' }}>
                    <Field label={t.angebotForm.depositAmount}><input type="number" value={anzahlung} onChange={e => setAnzahlung(Number(e.target.value))} style={{ ...inp, textAlign: 'right' }} /></Field>
                    <Field label={t.angebotForm.depositDate}><input type="date" value={anzahlungDate} onChange={e => setAnzahlungDate(e.target.value)} style={inp} /></Field>
                    <Field label={t.angebotForm.depositMethod}>
                      <select value={anzahlungMethod} onChange={e => setAnzahlungMethod(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                        {(['Überweisung', 'Bar', 'PayPal', 'Andere'] as const).map(m => (
                          <option key={m} value={m}>{t.status.depositMethod[m] ?? m}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)' }}>{t.angebotForm.deposit}</span>
                      <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)' }}>−{fmtEur(Number(anzahlung))}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--brand-border)', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text)', fontWeight: 700 }}>{t.angebotForm.remainingBalance}</span>
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-small)', color: 'var(--brand-text)', fontWeight: 'var(--weight-heading)' }}>{fmtEur(restbetrag)}</span>
                    </div>
                  </div>
                </div>
              )}
              {!hasAnzahlung && (
                <div style={{ borderTop: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', paddingTop: '10px', textAlign: 'right' }}>
                  <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)' }}>{fmtEur(subtotal)}</span>
                  <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 'var(--space-1) 0 0' }}>{t.forms.vatValidityNote}</p>
                </div>
              )}
            </div>

            <Field label={t.angebotForm.fieldNotes}><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} /></Field>

            <div style={{ marginBottom: 'var(--space-5)' }}>
              <button type="button" onClick={handleSave} disabled={saving || !clientName.trim()} style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: 'var(--text-label)', letterSpacing: '0.1em', padding: '12px 20px', cursor: saving || !clientName.trim() ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: saving || !clientName.trim() ? 0.6 : 1 }}>
                {saving ? t.angebotForm.saving : t.angebotForm.saveAngebot}
              </button>
              {saveError && <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', margin: '10px 0 0', letterSpacing: '0.04em' }}><Icon name="warning" size="xs" /> {saveError}</p>}
            </div>
          </div>
        </div>

        {/* ── LIVE PREVIEW ──
             Renders the exact same shared document engine used by the
             print page (components/documents/AngebotDocument.tsx) — not
             a third hand-rolled copy — so what you see here is exactly
             what "Als PDF speichern" will produce. */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--brand-surface-subtle)', padding: '28px' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 'var(--space-3)', textAlign: 'center' }}>{t.invoiceForm.livePreview}</p>
          <div style={{ maxWidth: '520px', margin: '0 auto', transform: 'scale(0.94)', transformOrigin: 'top center' }}>
            <AngebotDocument
              angebot={{
                angebot_number: number,
                created_at: date,
                valid_until: validUntil,
                client_name: clientName || '—',
                client_email: clientEmail,
                client_address: [clientStreet, [clientPostcode, clientCity].filter(Boolean).join(' ')].filter(Boolean).join('\n'),
                line_items: lineItems.filter(i => i.description),
                subtotal,
                total: subtotal,
                notes,
                anzahlung: hasAnzahlung ? Number(anzahlung) : 0,
                anzahlung_date: hasAnzahlung ? anzahlungDate : null,
                anzahlung_method: hasAnzahlung ? anzahlungMethod : null,
                payment_terms: paymentTerms || null,
                included_items: includedItems,
                currency,
                payment_method: paymentMethod,
                language,
              } satisfies AngebotData}
            />
          </div>
        </div>
      </div>
    </>
  )
}
