'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InvoiceDocument } from '@/components/documents/InvoiceDocument'
import type { CurrencyCode, PaymentMethodId, DocumentLanguage } from '@/lib/documents/config'
import type { InvoiceData } from '@/lib/documents/types'
import { fmtCurrency } from '@/lib/documents/format'
import { useOsLocale } from '@/lib/os-i18n/context'

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
  aiConfidence?: 'high' | 'medium' | 'low'
}
interface Client { id: string; name: string; company: string; email: string; address: string; city: string; country: string }
interface AIExtracted {
  clientName: string; clientCompany: string; clientEmail: string; clientPhone?: string
  clientAddress: string; clientCity: string; clientPostcode?: string
  lineItems: { description: string; quantity: number; unit: string; unitPrice: number; finalPrice: number; isFixedPrice: boolean; confidence?: 'high' | 'medium' | 'low' }[]
  anzahlung: number; anzahlungDate: string; anzahlungMethod: string
  notes: string; dueDate: string; validUntil?: string
  overallConfidence?: 'high' | 'medium' | 'low'
  extractionNotes?: string
  type?: string
}

const UNITS = ['pauschal', 'Stück', 'Stunden', 'Tage', 'Seiten', 'Monat', 'Lizenz']
const blankItem = (): LineItem => ({ description: '', qty: 1, unit: 'pauschal', unit_price: 0, total: 0, isFixedPrice: true })

function addDays(d: number) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0] }

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--brand-background)', border: '1px solid var(--brand-border)',
  color: 'var(--brand-text)', fontFamily: sans, fontSize: '13px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box',
}
const inpMissing: React.CSSProperties = {
  ...inp, border: '1px dashed color-mix(in srgb, var(--brand-primary) 50%, transparent)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
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
                {(postcode || city) && <span style={{ color: 'var(--brand-text-muted)', marginLeft: '10px', fontSize: '11px' }}>{[postcode, city].filter(Boolean).join(' ')}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { t } = useOsLocale()

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(addDays(30))
  const [clientId,       setClientId]       = useState('')
  const [clientName,     setClientName]     = useState('')
  const [clientEmails,   setClientEmails]   = useState<string[]>([])
  const [emailInput,     setEmailInput]     = useState('')
  const [emailError,     setEmailError]     = useState('')
  const [clientStreet,   setClientStreet]   = useState('')
  const [clientPostcode, setClientPostcode] = useState('')
  const [clientCity,     setClientCity]     = useState('')
  const [clients,        setClients]        = useState<Client[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([blankItem()])
  const [hasAnzahlung,    setHasAnzahlung]    = useState(false)
  const [anzahlung,       setAnzahlung]       = useState(0)
  const [anzahlungDate,   setAnzahlungDate]   = useState('')
  const [anzahlungMethod, setAnzahlungMethod] = useState('Überweisung')
  const [notes,   setNotes]   = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [currency,      setCurrency]      = useState<CurrencyCode>('EUR')
  const [language,      setLanguage]      = useState<DocumentLanguage>('de')
  const [saving,  setSaving]  = useState(false)
  const [sending, setSending] = useState(false)
  const [sendCopy, setSendCopy] = useState(true)
  const [sent,     setSent]    = useState(false)
  const [sentData, setSentData] = useState<{ id: string; number: string; emails: string[]; name: string } | null>(null)
  const [sendError, setSendError] = useState('')
  const [toast,    setToast]   = useState('')

  // AI state
  const [aiModalOpen,   setAiModalOpen]   = useState(false)
  const [rawText,       setRawText]       = useState('')
  const [aiLoading,     setAiLoading]     = useState(false)
  const [aiError,       setAiError]       = useState('')
  const [pastePreview,  setPastePreview]  = useState('')
  const [isDragOver,    setIsDragOver]    = useState(false)

  // Confidence & post-extraction state
  const [aiEnhanced,       setAiEnhanced]       = useState(false)
  const [overallConfidence, setOverallConfidence] = useState<'high' | 'medium' | 'low' | null>(null)
  const [extractionNotes,  setExtractionNotes]  = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/os/invoices?next=true').then(r => r.json()).then(d => setInvoiceNumber((d as { number: string }).number)).catch(() => {})
    fetch('/api/os/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // ── Clipboard paste listener (active when modal is open) ──────────────────
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
  }, [aiModalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image extraction (shared by paste, drop, file scan) ──────────────────
  const triggerImageExtract = useCallback(async (b64: string, mime: string) => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'rechnung', image: b64, mediaType: mime }),
      })
      if (!res.ok) throw new Error(t.forms.aiScanFailed)
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted)
      setAiModalOpen(false)
      setPastePreview('')
    } catch {
      setAiError(t.forms.aiImageReadFailed)
    } finally {
      setAiLoading(false)
    }
  }, [t]) // eslint-disable-line react-hooks/exhaustive-deps -- applyExtracted is a stable in-render closure over setState only

  // ── Drag & drop ──────────────────────────────────────────────────────────
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

  // ── File picker (Scan Image button) ──────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setPastePreview(dataUrl)
      setAiModalOpen(true)
      void triggerImageExtract(b64, mime)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Text extraction ───────────────────────────────────────────────────────
  async function handleGenerateAI() {
    if (!rawText.trim()) return
    setAiLoading(true); setAiError('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'rechnung', text: rawText }),
      })
      if (!res.ok) throw new Error(t.forms.aiExtractionFailed)
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted)
      setAiModalOpen(false)
      setRawText('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : t.forms.aiExtractionFailed)
    } finally {
      setAiLoading(false) }
  }

  // ── Apply extracted data + confidence signals ─────────────────────────────
  function applyExtracted(d: AIExtracted) {
    if (d.clientName) setClientName(d.clientName + (d.clientCompany ? ` — ${d.clientCompany}` : ''))
    if (d.clientEmail) setClientEmails([d.clientEmail])
    if (d.clientAddress) setClientStreet(d.clientAddress)
    if (d.clientCity)    setClientCity(d.clientCity)
    if (d.clientPostcode) setClientPostcode(d.clientPostcode)
    if (d.notes) setNotes(d.notes)
    if (d.dueDate) setDueDate(d.dueDate)
    if (d.lineItems?.length) {
      setLineItems(d.lineItems.map(li => ({
        description: li.description,
        qty: li.quantity,
        unit: li.unit || 'pauschal',
        unit_price: li.unitPrice,
        total: li.finalPrice,
        isFixedPrice: li.isFixedPrice,
        aiConfidence: li.confidence,
      })))
    }
    if (d.anzahlung > 0) {
      setHasAnzahlung(true)
      setAnzahlung(d.anzahlung)
      if (d.anzahlungDate)   setAnzahlungDate(d.anzahlungDate)
      if (d.anzahlungMethod) setAnzahlungMethod(d.anzahlungMethod)
    }
    setOverallConfidence(d.overallConfidence ?? 'medium')
    setExtractionNotes(d.extractionNotes ?? '')
    setAiEnhanced(true)
  }

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

  function selectClient(id: string) {
    const c = clients.find(x => x.id === id)
    if (!c) { setClientId(''); return }
    setClientId(c.id)
    setClientName(c.name + (c.company ? ` — ${c.company}` : ''))
    setClientEmails(c.email ? [c.email] : [])
    setEmailInput('')
    setClientStreet(c.address || '')
    const m = (c.city || '').trim().match(/^(\d{4,5})\s+(.+)$/)
    if (m) { setClientPostcode(m[1]); setClientCity(m[2]) }
    else   { setClientPostcode(''); setClientCity(c.city || '') }
  }

  const fmtEur = useCallback((n: number) => fmtCurrency(n, currency), [currency])

  const subtotal   = lineItems.reduce((s, i) => s + Number(i.total), 0)
  const restbetrag = subtotal - (hasAnzahlung ? Number(anzahlung) : 0)

  async function saveInvoice(sendNow = false): Promise<string | null> {
    if (!clientName.trim() || lineItems.every(i => !i.description)) return null
    const body = {
      invoice_number: invoiceNumber, client_id: clientId || undefined,
      client_name: clientName, client_email: clientEmails[0] || '',
      client_address: [clientStreet, [clientPostcode, clientCity].filter(Boolean).join(' ')].filter(Boolean).join('\n'),
      line_items: lineItems.filter(i => i.description),
      subtotal, total: subtotal, notes, due_date: dueDate,
      status: sendNow ? 'sent' : 'draft',
      anzahlung: hasAnzahlung ? Number(anzahlung) : 0,
      anzahlung_date: hasAnzahlung ? anzahlungDate : null,
      anzahlung_method: hasAnzahlung ? anzahlungMethod : null,
      restbetrag: hasAnzahlung ? restbetrag : subtotal,
      payment_method: paymentMethod,
      currency,
      language,
    }
    const res  = await fetch('/api/os/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      throw new Error(t.forms.serverError(res.status))
    }
    const data = await res.json() as { id: string }
    return data.id
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const id = await saveInvoice(false)
      if (id) router.push('/os/invoices')
    } catch (err) {
      showToast(t.forms.saveFailedToast(err instanceof Error ? err.message : t.forms.saveFailed))
    } finally { setSaving(false) }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 5000)
  }

  async function autoSaveClient(invoiceId: string) {
    if (!clientName.trim()) return
    try {
      const res = await fetch('/api/os/clients/auto-save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clientName, email: clientEmails[0] || '', address: clientStreet, city: [clientPostcode, clientCity].filter(Boolean).join(' '), invoice_id: invoiceId }),
      })
      if (res.ok) {
        const data = await res.json() as { created: boolean }
        if (data.created) showToast(t.forms.clientSavedToast(clientName.split(' — ')[0]))
      }
    } catch { /* non-blocking */ }
  }

  function addEmail() {
    const e = emailInput.trim().replace(/,+$/, '')
    if (!e) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setEmailError(t.forms.emailInvalid); return }
    if (clientEmails.includes(e)) { setEmailInput(''); return }
    setClientEmails(prev => [...prev, e])
    setEmailInput('')
    setEmailError('')
  }

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault(); addEmail()
    }
    if (e.key === 'Backspace' && !emailInput && clientEmails.length > 0) {
      setClientEmails(prev => prev.slice(0, -1))
    }
  }

  async function handleSend() {
    if (!clientEmails.length) {
      // Try adding whatever is typed in the input first
      if (emailInput.trim()) { addEmail(); return }
      setSendError(t.forms.emailRequired); return
    }
    setSending(true); setSendError('')
    try {
      const id = await saveInvoice(false)
      if (!id) { setSendError(t.forms.saveInvoiceFailed); return }

      const res = await fetch('/api/os/send-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: id,
          clientEmails,
          client_name: clientName,
          invoice_number: invoiceNumber,
          date,
          due_date: dueDate,
          line_items: lineItems.filter(i => i.description),
          subtotal,
          total: subtotal,
          anzahlung: hasAnzahlung ? Number(anzahlung) : 0,
          anzahlung_date: hasAnzahlung ? anzahlungDate : '',
          anzahlung_method: hasAnzahlung ? anzahlungMethod : '',
          restbetrag: hasAnzahlung ? restbetrag : subtotal,
          address: [clientStreet, [clientPostcode, clientCity].filter(Boolean).join(' ')].filter(Boolean).join(', '),
          sendCopyToMarcel: sendCopy,
          currency,
          language,
        }),
      })
      if (!res.ok) throw new Error(t.forms.sendFailed)

      // Auto-save client to addressbook
      void autoSaveClient(id)

      // Show success state
      setSentData({ id, number: invoiceNumber, emails: clientEmails, name: clientName })
      setSent(true)
      showToast(t.forms.invoiceSentToast(invoiceNumber, clientEmails.join(', ')))
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t.forms.sendFailed)
    } finally { setSending(false) }
  }

  // ── Confidence helpers ────────────────────────────────────────────────────
  const confColor   = { high: 'var(--semantic-success)', medium: 'var(--brand-primary)', low: 'var(--semantic-danger)' }
  const confBg      = { high: 'color-mix(in srgb, var(--semantic-success) 8%, transparent)', medium: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', low: 'color-mix(in srgb, var(--semantic-danger) 8%, transparent)' }
  const confBorder  = { high: 'color-mix(in srgb, var(--semantic-success) 25%, transparent)', medium: 'color-mix(in srgb, var(--brand-primary) 25%, transparent)', low: 'color-mix(in srgb, var(--semantic-danger) 25%, transparent)' }
  const confMsg     = { high: t.forms.confHigh, medium: t.forms.confMedium, low: t.forms.confLow }

  function itemBorderLeft(item: LineItem): string | undefined {
    if (item.aiConfidence === 'low')    return '3px solid var(--semantic-danger)'
    if (item.aiConfidence === 'medium') return '3px solid color-mix(in srgb, var(--brand-primary) 60%, transparent)'
    return undefined
  }

  function aiInp(value: string): React.CSSProperties {
    return aiEnhanced && !value.trim() ? inpMissing : inp
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── UNIFIED AI MODAL ── */}
      {aiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', width: '100%', maxWidth: '580px', padding: '28px', borderRadius: '4px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: grotesk, fontWeight: 700, fontSize: '18px', color: 'var(--brand-text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{t.forms.aiInvoiceTitle}</h2>
                <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', margin: 0 }}>{t.forms.aiModalSub}</p>
              </div>
              <button onClick={() => { setAiModalOpen(false); setAiError(''); setPastePreview(''); setRawText('') }} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>×</button>
            </div>

            {/* Paste / drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragOver ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                background: isDragOver ? 'color-mix(in srgb, var(--brand-primary) 6%, transparent)' : 'var(--brand-background)',
                borderRadius: '4px',
                padding: '16px',
                marginBottom: '16px',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.2s ease, background 0.2s ease',
                position: 'relative',
              }}
            >
              {aiLoading && pastePreview ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-primary-text)', letterSpacing: '0.1em', margin: '0 0 8px' }}>
                    {t.forms.aiReading}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs and offers no benefit for a transient upload preview */}
                  <img src={pastePreview} alt="" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', opacity: 0.5 }} />
                </div>
              ) : pastePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs
                <img src={pastePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }} />
              ) : (
                <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-muted)', letterSpacing: '0.06em', textAlign: 'center', margin: 0, lineHeight: 1.8 }}>
                  {t.forms.aiDropZonePrefix} <strong style={{ color: 'var(--brand-text-secondary)' }}>{t.forms.aiDropZoneKey}</strong> {t.forms.aiDropZoneSuffix}<br />
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>{t.forms.aiDropZoneFormats}</span>
                </p>
              )}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--brand-border)' }} />
              <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em' }}>{t.forms.aiOrPasteText}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--brand-border)' }} />
            </div>

            {/* Textarea */}
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={6}
              placeholder={t.forms.aiPlaceholderInvoice}
              style={{ ...inp, resize: 'vertical', marginBottom: '12px', lineHeight: 1.7, fontSize: '12px' }}
            />

            {aiError && (
              <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-danger)', margin: '0 0 12px', letterSpacing: '0.06em' }}>
                ▲ {aiError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading || !rawText.trim()}
                style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: aiLoading || !rawText.trim() ? 0.5 : 1, borderRadius: '2px' }}
              >
                {aiLoading && !pastePreview ? t.forms.aiExtracting : t.forms.aiGenerateButton}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'var(--brand-border)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '11px', padding: '12px 16px', cursor: 'pointer', borderRadius: '2px' }}
              >
                {t.forms.aiBrowseFile}
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

      <div style={{ display: 'flex', height: '100vh' }}>

        {/* ── FORM ── */}
        <div style={{ width: '50%', height: '100vh', overflowY: 'auto', padding: '28px 32px', borderRight: '1px solid var(--brand-border)' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: grotesk, fontSize: '20px', fontWeight: 700, color: 'var(--brand-text)', margin: 0, letterSpacing: '-0.02em' }}>{t.invoiceForm.newHeading}</h1>
              {aiEnhanced && (
                <span style={{ fontFamily: mono, fontSize: '9px', color: 'var(--semantic-success)', background: 'color-mix(in srgb, var(--semantic-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-success) 20%, transparent)', padding: '3px 8px', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>
                  {t.invoiceForm.aiEnhanced}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setAiModalOpen(true); setAiError(''); setPastePreview('') }} style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', color: 'var(--brand-primary-text)', fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px' }}>
                {t.invoiceForm.aiGenerate}
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--brand-border)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 14px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '2px' }}>
                {t.invoiceForm.scanImage}
              </button>
            </div>
          </div>

          {/* Confidence banner */}
          {aiEnhanced && overallConfidence && (
            <div style={{ background: confBg[overallConfidence], border: `1px solid ${confBorder[overallConfidence]}`, padding: '10px 14px', marginBottom: '14px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ fontFamily: mono, fontSize: '11px', color: confColor[overallConfidence], margin: 0, letterSpacing: '0.06em' }}>
                {confMsg[overallConfidence]}
              </p>
            </div>
          )}

          {/* Extraction notes */}
          {aiEnhanced && extractionNotes && (
            <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', padding: '10px 14px', marginBottom: '14px', borderRadius: '2px' }}>
              <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-secondary)', margin: 0, letterSpacing: '0.04em' }}>
                ℹ️  {extractionNotes}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label={t.invoiceForm.fieldInvoiceNo}><input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={inp} /></Field>
              <Field label={t.invoiceForm.fieldDate}><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></Field>
              <Field label={t.invoiceForm.fieldDueDate}><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} /></Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <Field label={t.invoiceForm.fieldCurrency}>
                <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} style={{ ...inp, appearance: 'none' }}>
                  <option value="EUR">EUR — €</option>
                  <option value="GBP">GBP — £</option>
                </select>
              </Field>
              <Field label={t.invoiceForm.fieldPaymentMethod}>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethodId)} style={{ ...inp, appearance: 'none' }}>
                  <option value="bank">{t.status.paymentMethod.bank}</option>
                  <option value="momo">{t.status.paymentMethod.momo}</option>
                  <option value="both">{t.status.paymentMethod.both}</option>
                </select>
              </Field>
              <Field label={t.invoiceForm.fieldDocumentLanguage}>
                <select value={language} onChange={e => setLanguage(e.target.value as DocumentLanguage)} style={{ ...inp, appearance: 'none' }}>
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>

            <div style={{ height: '1px', background: 'var(--brand-border)' }} />

            <Field label={t.invoiceForm.fieldSelectClient}>
              <select value={clientId} onChange={e => selectClient(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                <option value="">{t.invoiceForm.selectClientPlaceholder}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </Field>
            <Field label={t.invoiceForm.fieldClientName}>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder={aiEnhanced && !clientName.trim() ? t.forms.notFoundFill : t.invoiceForm.clientNameManual} style={aiInp(clientName)} />
            </Field>
            <Field label={t.invoiceForm.fieldClientEmails}>
              {/* ── Email chips input ── */}
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--brand-background)', border: `1px solid ${emailError ? 'color-mix(in srgb, var(--semantic-danger) 50%, transparent)' : 'var(--brand-border)'}`, padding: '7px 10px', minHeight: '40px', alignItems: 'center', cursor: 'text' }}
                onClick={e => { const inp = (e.currentTarget as HTMLDivElement).querySelector('input'); inp?.focus() }}
              >
                {clientEmails.map((e, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 35%, transparent)', color: 'var(--brand-primary-text)', fontFamily: mono, fontSize: '11px', padding: '2px 8px', borderRadius: '2px' }}>
                    {e}
                    <button onClick={() => setClientEmails(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--brand-primary-text)', cursor: 'pointer', fontSize: '13px', padding: '0', lineHeight: 1 }}>×</button>
                  </span>
                ))}
                <input
                  type="text" value={emailInput}
                  onChange={ev => { setEmailInput(ev.target.value); setEmailError('') }}
                  onKeyDown={handleEmailKeyDown}
                  onBlur={addEmail}
                  placeholder={clientEmails.length === 0 ? (aiEnhanced ? t.forms.emailAddPlaceholderAi : t.forms.emailAddPlaceholder) : ''}
                  style={{ flex: '1', minWidth: '180px', background: 'none', border: 'none', outline: 'none', color: 'var(--brand-text)', fontFamily: sans, fontSize: '13px', padding: '0' }}
                />
              </div>
              {emailError && <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-danger)', margin: '4px 0 0', letterSpacing: '0.06em' }}>▲ {emailError}</p>}
            </Field>

            {/* Send copy checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={sendCopy} onChange={e => setSendCopy(e.target.checked)}
                style={{ width: '14px', height: '14px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }} />
              <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.08em' }}>
                {t.invoiceForm.sendCopyToMarcel}
              </span>
            </label>
            <Field label={t.invoiceForm.fieldStreet}>
              <StreetInput
                value={clientStreet}
                onChange={setClientStreet}
                placeholder={aiEnhanced && !clientStreet.trim() ? t.forms.notFoundFill : t.forms.streetPlaceholder}
                aiEnhanced={aiEnhanced && !clientStreet.trim()}
                onFill={(street, postcode, city) => { setClientStreet(street); setClientPostcode(postcode); setClientCity(city) }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
              <Field label={t.invoiceForm.fieldPostcode}>
                <input value={clientPostcode} onChange={e => setClientPostcode(e.target.value)} placeholder="40210" maxLength={10} style={aiInp(clientPostcode)} />
              </Field>
              <Field label={t.invoiceForm.fieldCity}>
                <input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="Düsseldorf" style={aiInp(clientCity)} />
              </Field>
            </div>

            <div style={{ height: '1px', background: 'var(--brand-border)' }} />

            {/* Line items */}
            <div>
              <p style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>{t.invoiceForm.lineItemsHeading}</p>
              {lineItems.map((item, i) => (
                <div key={i} style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderLeft: itemBorderLeft(item) || '1px solid var(--brand-border)', padding: '12px', marginBottom: '6px', borderRadius: '2px', position: 'relative' }}>
                  {item.aiConfidence === 'low' && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: mono, fontSize: '9px', color: 'var(--semantic-danger)', letterSpacing: '0.08em' }}>
                      {t.forms.verifyBadge}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder={aiEnhanced && !item.description ? t.forms.notFoundFill : t.forms.descriptionPlaceholder}
                      style={{ ...inp, flex: 1, border: aiEnhanced && !item.description ? '1px dashed color-mix(in srgb, var(--brand-primary) 50%, transparent)' : inp.border as string }}
                    />
                    <button onClick={() => { const items = [...lineItems]; items[i] = { ...items[i], isFixedPrice: !items[i].isFixedPrice }; setLineItems(items) }} style={{ background: item.isFixedPrice ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--brand-border)', border: `1px solid ${item.isFixedPrice ? 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' : 'var(--brand-border)'}`, color: item.isFixedPrice ? 'var(--brand-primary)' : 'var(--brand-text-muted)', fontFamily: mono, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '2px' }}>
                      {item.isFixedPrice ? t.invoiceForm.pauschal : t.invoiceForm.perUnit}
                    </button>
                    <button onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>
                  {item.isFixedPrice ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', flexShrink: 0 }}>{t.forms.amountLabel}</span>
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
              <button onClick={() => setLineItems(prev => [...prev, blankItem()])} style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary-text)', background: 'none', border: '1px dashed color-mix(in srgb, var(--brand-primary) 30%, transparent)', padding: '7px 16px', cursor: 'pointer', marginTop: '4px', letterSpacing: '0.1em', width: '100%', borderRadius: '2px' }}>
                {t.invoiceForm.addItem}
              </button>
            </div>

            {/* Totals */}
            <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-secondary)' }}>{t.invoiceForm.subtotal}</span>
                <span style={{ fontFamily: mono, fontSize: '13px', color: 'var(--brand-text)', fontWeight: 700 }}>{fmtEur(subtotal)}</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
                <input type="checkbox" checked={hasAnzahlung} onChange={e => setHasAnzahlung(e.target.checked)} style={{ accentColor: 'var(--brand-primary)', width: '14px', height: '14px' }} />
                <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.invoiceForm.depositReceived}</span>
              </label>
              {hasAnzahlung && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <Field label={t.invoiceForm.depositAmount}><input type="number" value={anzahlung} onChange={e => setAnzahlung(Number(e.target.value))} style={{ ...inp, textAlign: 'right' }} /></Field>
                    <Field label={t.invoiceForm.depositDate}><input type="date" value={anzahlungDate} onChange={e => setAnzahlungDate(e.target.value)} style={inp} /></Field>
                    <Field label={t.invoiceForm.depositMethod}>
                      {/* The VALUE is persisted and printed on the document, so it
                          stays German; only the visible label follows the OS UI. */}
                      <select value={anzahlungMethod} onChange={e => setAnzahlungMethod(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                        {(['Überweisung', 'Bar', 'PayPal', 'Andere'] as const).map(m => (
                          <option key={m} value={m}>{t.status.depositMethod[m] ?? m}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-secondary)' }}>{t.invoiceForm.deposit}</span>
                      <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)' }}>−{fmtEur(Number(anzahlung))}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--brand-border)', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text)', fontWeight: 700 }}>{t.invoiceForm.remainingBalance}</span>
                      <span style={{ fontFamily: mono, fontSize: '15px', color: 'var(--brand-text)', fontWeight: 700 }}>{fmtEur(restbetrag)}</span>
                    </div>
                  </div>
                </div>
              )}
              {!hasAnzahlung && (
                <div style={{ borderTop: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', paddingTop: '10px', textAlign: 'right' }}>
                  <span style={{ fontFamily: grotesk, fontSize: '20px', fontWeight: 700, color: 'var(--brand-text)' }}>{fmtEur(subtotal)}</span>
                  <p style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', margin: '4px 0 0', letterSpacing: '0.06em' }}>{t.invoiceForm.vatNote}</p>
                </div>
              )}
            </div>

            <Field label={t.invoiceForm.fieldNotes}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
            </Field>

            {sendError && (
              <div style={{ background: 'color-mix(in srgb, var(--semantic-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 40%, transparent)', padding: '10px 14px', borderRadius: '2px' }}>
                <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--semantic-danger)', margin: 0, letterSpacing: '0.06em' }}>▲ {sendError}</p>
                <button onClick={() => setSendError('')} style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-danger)', background: 'none', border: '1px solid color-mix(in srgb, var(--semantic-danger) 30%, transparent)', padding: '4px 10px', cursor: 'pointer', marginTop: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.forms.retry}</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingBottom: '24px' }}>
              <button onClick={handleSaveDraft} disabled={saving} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: saving ? 0.6 : 1 }}>
                {saving ? t.invoiceForm.savingDraft : t.invoiceForm.saveDraft}
              </button>
              <button onClick={handleSend} disabled={sending} style={{ background: sending ? 'var(--brand-primary-dark)' : 'var(--brand-primary)', border: 'none', color: 'var(--brand-on-primary)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '12px 20px', cursor: sending ? 'wait' : 'pointer', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {sending && <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid color-mix(in srgb, var(--brand-text) 45%, transparent)', borderTopColor: 'var(--brand-text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {sending ? t.invoiceForm.sendingInvoice : t.invoiceForm.sendInvoice}
              </button>
            </div>
          </div>
        </div>

        {/* ── LIVE PREVIEW ──
             Renders the exact same shared document engine used by the
             print page (components/documents/InvoiceDocument.tsx) — not
             a third hand-rolled copy — so what you see here is exactly
             what "Als PDF speichern" will produce. */}
        <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--brand-surface-subtle)', padding: '28px' }}>
          <p style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>{t.invoiceForm.livePreview}</p>
          <div style={{ maxWidth: '520px', margin: '0 auto', transform: 'scale(0.94)', transformOrigin: 'top center' }}>
            <InvoiceDocument
              invoice={{
                invoice_number: invoiceNumber,
                created_at: date,
                due_date: dueDate,
                client_name: clientName || '—',
                client_email: clientEmails[0] || '',
                client_address: [clientStreet, [clientPostcode, clientCity].filter(Boolean).join(' ')].filter(Boolean).join('\n'),
                line_items: lineItems.filter(i => i.description),
                subtotal,
                total: subtotal,
                notes,
                anzahlung: hasAnzahlung ? Number(anzahlung) : 0,
                anzahlung_date: hasAnzahlung ? anzahlungDate : null,
                anzahlung_method: hasAnzahlung ? anzahlungMethod : null,
                restbetrag: hasAnzahlung ? restbetrag : subtotal,
                currency,
                payment_method: paymentMethod,
                language,
              } satisfies InvoiceData}
            />
          </div>
        </div>
      </div>

      {/* ── SEND SUCCESS OVERLAY ── */}
      {sent && sentData && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--brand-background)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '440px', width: '100%' }}>
            {/* Checkmark */}
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'color-mix(in srgb, var(--semantic-success) 12%, transparent)', border: '2px solid var(--semantic-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ color: 'var(--semantic-success)', fontSize: '32px', lineHeight: 1 }}>✓</span>
            </div>
            <h2 style={{ color: 'var(--brand-text)', fontSize: '22px', fontWeight: 700, margin: '0 0 8px', fontFamily: grotesk }}>{t.invoiceForm.sentHeading}</h2>
            <p style={{ color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '12px', margin: '0 0 4px', letterSpacing: '0.04em' }}>{t.forms.invoiceNoPrefix} {sentData.number} {t.invoiceForm.sentSubheading}</p>
            <p style={{ color: 'var(--brand-primary-text)', fontFamily: mono, fontSize: '12px', margin: '0 0 28px', letterSpacing: '0.04em', wordBreak: 'break-all' }}>{sentData.emails.join(', ')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => window.open(`/os/invoices/${sentData.id}/print`, '_blank')}
                style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '14px 20px', cursor: 'pointer', textTransform: 'uppercase', width: '100%' }}
              >
                {t.invoiceForm.savePdf}
              </button>
              <button
                onClick={() => router.push('/os/invoices')}
                style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', padding: '14px 20px', cursor: 'pointer', textTransform: 'uppercase', width: '100%' }}
              >
                {t.invoiceForm.backToInvoices}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 400, background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 40%, transparent)', color: 'var(--brand-text)', fontFamily: mono, fontSize: '12px', padding: '12px 18px', letterSpacing: '0.06em', maxWidth: '380px', boxShadow: '0 8px 32px color-mix(in srgb, var(--brand-text) 45%, transparent)' }}>
          {toast}
        </div>
      )}
    </>
  )
}
