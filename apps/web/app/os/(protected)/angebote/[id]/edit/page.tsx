'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CurrencyCode, PaymentMethodId, DocumentLanguage } from '@/lib/documents/config'
import { fmtCurrency } from '@/lib/documents/format'
import { useOsLocale } from '@/lib/os-i18n/context'

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
  payment_method?: PaymentMethodId | null
  currency?: CurrencyCode | null
  language?: DocumentLanguage | null
}

const UNITS = ['pauschal', 'Stück', 'Stunden', 'Tage', 'Seiten', 'Monat', 'Lizenz']
const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired']

const blankItem = (): LineItem => ({
  description: '', qty: 1, unit: 'pauschal',
  unit_price: 0, total: 0, isFixedPrice: true,
})

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--brand-background)',
  border: '1px solid var(--brand-border)', color: 'var(--brand-text)',
  fontFamily: sans, fontSize: '13px', padding: '9px 12px',
  outline: 'none', boxSizing: 'border-box',
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
      <label style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

export default function EditAngebotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, intlLocale } = useOsLocale()

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [currency,      setCurrency]      = useState<CurrencyCode>('EUR')
  const [language,      setLanguage]      = useState<DocumentLanguage>('de')

  const fmtEur = useCallback((n: number) => fmtCurrency(n, currency), [currency])

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
        setPaymentMethod(d.payment_method ?? 'bank')
        setCurrency(d.currency ?? 'EUR')
        setLanguage(d.language ?? 'de')

        setLoading(false)
      })
      .catch(() => { setLoadError(t.forms.loadAngebotFailed); setLoading(false) })
    // The error message is localised, so a language change legitimately
    // re-runs this. Refetching one angebot on a language switch is cheap and
    // correct; suppressing the dependency to avoid it was not.
  }, [id, t.forms.loadAngebotFailed])

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
    if (newItems.length) summary.push(isReplace ? t.forms.aiSummaryItemsReplaced(newItems.length) : t.forms.aiSummaryItemsAdded(newItems.length))
    if (d.includedItems?.length) summary.push(t.forms.aiSummaryIncluded(d.includedItems.length))
    if (d.paymentTerms) summary.push(t.forms.aiSummaryPaymentTerms)
    if (d.warnings?.length) summary.push(t.forms.aiSummaryWarnings(d.warnings.length))
    const joined = summary.join(' · ')
    setAiAppliedMsg(
      summary.length
        ? (isReplace ? t.forms.aiSummaryReplaced(joined) : t.forms.aiSummaryMerged(joined))
        : t.forms.aiSummaryNone
    )
  }

  async function aiExtractFromText() {
    if (!aiRawText.trim()) return
    setAiLoading(true); setAiError(''); setAiAppliedMsg('')
    try {
      const res = await fetch('/api/os/ai/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'angebot', text: aiRawText }),
      })
      if (!res.ok) throw new Error(t.forms.serverError(res.status))
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted, aiMode)
      setAiOpen(false); setAiRawText(''); setAiPreview('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : t.forms.aiExtractionFailed)
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
      if (!res.ok) throw new Error(t.forms.serverError(res.status))
      const json = await res.json() as { extracted: AIExtracted }
      applyExtracted(json.extracted, aiMode)
      setAiOpen(false); setAiPreview('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : t.forms.aiImageExtractionFailed)
    } finally {
      setAiLoading(false)
    }
  // applyExtracted closure intentionally re-evaluated each call
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode, t])

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
      setSaveError(t.forms.clientNameRequired)
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
          payment_method:   paymentMethod,
          currency,
          language,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        throw new Error(err.detail ?? err.error ?? `Server error ${res.status}`)
      }
      router.push(`/os/angebote/${id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.forms.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-primary-text)', letterSpacing: '0.2em' }}>{t.common.loading}</p>
    </div>
  )

  if (loadError) return (
    <div style={{ padding: '40px' }}>
      <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--semantic-danger)' }}>{loadError}</p>
      <Link href="/os/angebote" style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-primary-text)', textDecoration: 'none' }}>{t.angebotDetail.backToAngebote}</Link>
    </div>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: '780px' }}>

      {/* AI raw-paste modal — paste text, drop an image, or Ctrl+V a screenshot */}
      {aiOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setAiOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', borderRadius: '4px', width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontFamily: sans, fontWeight: 700, fontSize: '18px', color: 'var(--brand-text)', margin: 0, letterSpacing: '-0.02em' }}>{t.forms.aiAngebotAddTitle}</h2>
                <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', margin: '4px 0 0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {t.forms.aiModalSub}
                </p>
              </div>
              <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}>×</button>
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
                    background: aiMode === m ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'transparent',
                    border: `1px solid ${aiMode === m ? 'color-mix(in srgb, var(--brand-primary) 50%, transparent)' : 'var(--brand-border)'}`,
                    color: aiMode === m ? 'var(--brand-primary)' : 'var(--brand-text-secondary)',
                    fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '8px 10px', cursor: 'pointer', borderRadius: '3px',
                  }}
                >
                  {m === 'merge' ? t.forms.aiModeMerge : t.forms.aiModeReplace}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
              {aiMode === 'merge' ? t.forms.aiModeMergeHint : t.forms.aiModeReplaceHint}
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setAiDragOver(true) }}
              onDragLeave={() => setAiDragOver(false)}
              onDrop={aiHandleDrop}
              style={{
                border: `2px dashed ${aiDragOver ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                background: aiDragOver ? 'color-mix(in srgb, var(--brand-primary) 6%, transparent)' : 'var(--brand-background)',
                borderRadius: '4px', padding: '14px', marginBottom: '12px',
                minHeight: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              {aiLoading && aiPreview ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-primary-text)', letterSpacing: '0.1em', margin: '0 0 6px' }}>{t.forms.aiReading}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs and offers no benefit for a transient upload preview */}
                  <img src={aiPreview} alt="" style={{ maxWidth: '100%', maxHeight: '110px', objectFit: 'contain', opacity: 0.5 }} />
                </div>
              ) : aiPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side FileReader data: URL preview; next/image cannot optimize runtime data URLs
                <img src={aiPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
              ) : (
                <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-muted)', margin: 0, lineHeight: 1.7, textAlign: 'center' }}>
                  {t.forms.aiDropZonePrefix} <strong style={{ color: 'var(--brand-text-secondary)' }}>{t.forms.aiDropZoneKey}</strong> {t.forms.aiDropZoneSuffix}<br />
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>{t.forms.aiDropZoneFormats}</span>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--brand-border)' }} />
              <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em' }}>{t.forms.aiOrPasteTextShort}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--brand-border)' }} />
            </div>

            <textarea
              value={aiRawText}
              onChange={e => setAiRawText(e.target.value)}
              rows={5}
              placeholder={t.forms.aiPlaceholderAddData}
              style={{ ...inp, resize: 'vertical', marginBottom: '12px', lineHeight: 1.7, fontSize: '12px' }}
            />

            {aiError && <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-danger)', margin: '0 0 10px', letterSpacing: '0.06em' }}>▲ {aiError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={aiExtractFromText}
                disabled={aiLoading || !aiRawText.trim()}
                style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '11px 18px', cursor: aiLoading || !aiRawText.trim() ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: aiLoading || !aiRawText.trim() ? 0.5 : 1, borderRadius: '2px' }}
              >
                {aiLoading && !aiPreview ? t.forms.aiExtracting : (aiMode === 'merge' ? t.forms.aiMergeButton : t.forms.aiReplaceButton)}
              </button>
              <button
                type="button"
                onClick={() => aiFileRef.current?.click()}
                disabled={aiLoading}
                style={{ background: 'var(--brand-border)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '11px', padding: '11px 14px', cursor: aiLoading ? 'wait' : 'pointer', borderRadius: '2px' }}
              >
                {t.forms.aiBrowseFile}
              </button>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                disabled={aiLoading}
                style={{ background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '11px', padding: '11px 14px', cursor: aiLoading ? 'wait' : 'pointer', borderRadius: '2px', marginLeft: 'auto' }}
              >
                {t.common.cancel}
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
      <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', marginBottom: '16px', letterSpacing: '0.1em' }}>
        <Link href="/os/angebote" style={{ color: 'var(--brand-text-muted)', textDecoration: 'none' }}>{t.angebotDetail.breadcrumb}</Link>
        {' / '}
        <Link href={`/os/angebote/${id}`} style={{ color: 'var(--brand-text-muted)', textDecoration: 'none' }}>{angebotNumber}</Link>
        {' / '}
        <span style={{ color: 'var(--brand-text)' }}>{t.forms.editBreadcrumb}</span>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: sans, fontSize: '24px', fontWeight: 700, color: 'var(--brand-text)', margin: 0, letterSpacing: '-0.02em' }}>
          {t.angebotForm.editHeading} {angebotNumber}
        </h1>
        <button
          type="button"
          onClick={() => { setAiOpen(true); setAiError(''); setAiPreview('') }}
          style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', color: 'var(--brand-primary-text)', fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', padding: '9px 16px', cursor: 'pointer', textTransform: 'uppercase', borderRadius: '4px' }}
          title={t.forms.aiAddDataTooltip}
        >
          {t.angebotForm.aiAddData}
        </button>
      </div>

      {aiAppliedMsg && (
        <div style={{ background: 'color-mix(in srgb, var(--semantic-success) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-success) 25%, transparent)', borderLeft: '3px solid var(--semantic-success)', padding: '10px 14px', marginBottom: '16px', borderRadius: '3px' }}>
          <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--semantic-success)', margin: 0, letterSpacing: '0.04em' }}>✓ {aiAppliedMsg}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <Field label={t.angebotForm.fieldAngebotNo}><input value={angebotNumber} disabled style={{ ...inp, opacity: 0.5 }} /></Field>
          <Field label={t.angebotForm.fieldDate}><input value={createdAt ? new Date(createdAt).toLocaleDateString(intlLocale) : ''} disabled style={{ ...inp, opacity: 0.5 }} /></Field>
          <Field label={t.angebotForm.fieldValidUntil}><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inp} /></Field>
        </div>

        <Field label={t.angebotForm.fieldStatus}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inp, appearance: 'none' }}>
            {STATUSES.map(s => <option key={s} value={s}>{t.status.angebot[s] ?? s}</option>)}
          </select>
        </Field>

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

        <div style={{ height: '1px', background: 'var(--brand-border)', margin: '4px 0' }} />

        <Field label={t.angebotForm.fieldClientName}>
          <input value={clientName} onChange={e => setClientName(e.target.value)} style={inp} />
        </Field>
        <Field label={t.angebotForm.fieldClientEmail}>
          <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder={t.forms.emailPlaceholder} style={inp} />
        </Field>
        <Field label={t.angebotForm.fieldClientAddress}>
          <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
        </Field>

        <div style={{ height: '1px', background: 'var(--brand-border)', margin: '4px 0' }} />

        {/* Line items */}
        <div>
          <p style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>{t.angebotForm.lineItemsHeading}</p>
          {lineItems.map((item, i) => (
            <div key={i} style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', padding: '12px', marginBottom: '6px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <textarea
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder={t.forms.descriptionPlaceholderEdit}
                  rows={Math.max(1, Math.min(8, item.description.split('\n').length))}
                  style={{ ...inp, flex: 1, resize: 'vertical', lineHeight: 1.5, fontFamily: sans, minHeight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => updateItem(i, 'isFixedPrice', !item.isFixedPrice)}
                  style={{
                    background: item.isFixedPrice ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--brand-border)',
                    border: `1px solid ${item.isFixedPrice ? 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' : 'var(--brand-border)'}`,
                    color: item.isFixedPrice ? 'var(--brand-primary)' : 'var(--brand-text-muted)',
                    fontFamily: mono, fontSize: '9px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '8px 10px', cursor: 'pointer',
                    whiteSpace: 'nowrap', borderRadius: '2px', alignSelf: 'flex-start',
                  }}
                >
                  {item.isFixedPrice ? t.angebotForm.pauschal : t.angebotForm.perUnit}
                </button>
                <button
                  type="button"
                  onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontSize: '18px', padding: '4px 6px', alignSelf: 'flex-start' }}
                >
                  ×
                </button>
              </div>
              {item.isFixedPrice ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', letterSpacing: '0.1em' }}>{t.forms.amountLabel}</span>
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
          <button
            type="button"
            onClick={() => setLineItems(prev => [...prev, blankItem()])}
            style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-primary-text)', background: 'none', border: '1px dashed color-mix(in srgb, var(--brand-primary) 30%, transparent)', padding: '7px 16px', cursor: 'pointer', marginTop: '4px', letterSpacing: '0.1em', width: '100%', borderRadius: '2px' }}
          >
            {t.angebotForm.addItem}
          </button>
        </div>

        {/* Anzahlung + total */}
        <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-secondary)' }}>{t.angebotForm.subtotal}</span>
            <span style={{ fontFamily: mono, fontSize: '13px', color: 'var(--brand-text)', fontWeight: 700 }}>{fmtEur(subtotal)}</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" checked={hasAnzahlung} onChange={e => setHasAnzahlung(e.target.checked)} style={{ accentColor: 'var(--brand-primary)', width: '14px', height: '14px' }} />
            <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.angebotForm.depositReceived}</span>
          </label>
          {hasAnzahlung && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
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
              <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--brand-text)', fontWeight: 700 }}>{t.angebotForm.remainingBalance}</span>
                <span style={{ fontFamily: mono, fontSize: '15px', color: 'var(--brand-text)', fontWeight: 700 }}>{fmtEur(restbet)}</span>
              </div>
            </>
          )}
          {!hasAnzahlung && (
            <div style={{ borderTop: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', paddingTop: '10px', textAlign: 'right' }}>
              <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 700, color: 'var(--brand-text)' }}>{fmtEur(subtotal)}</span>
            </div>
          )}
        </div>

        <Field label={t.angebotForm.fieldPaymentTerms}>
          <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder={t.forms.paymentTermsPlaceholder} style={inp} />
        </Field>

        <Field label={t.angebotForm.fieldIncludedItems}>
          <textarea
            value={includedItems.join('\n')}
            onChange={e => setIncludedItems(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
            rows={3}
            placeholder={t.forms.includedPlaceholder}
            style={{ ...inp, resize: 'vertical' }}
          />
        </Field>

        <Field label={t.angebotForm.fieldNotes}><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...inp, resize: 'vertical' }} /></Field>

        {saveError && (
          <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--semantic-danger)', margin: '4px 0 0' }}>▲ {saveError}</p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !clientName.trim()}
            style={{
              background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)',
              fontFamily: mono, fontWeight: 700, fontSize: '11px',
              letterSpacing: '0.1em', padding: '12px 20px',
              cursor: saving || !clientName.trim() ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', borderRadius: '2px',
              opacity: saving || !clientName.trim() ? 0.5 : 1,
            }}
          >
            {saving ? t.angebotForm.saving : t.angebotForm.saveChanges}
          </button>
          <Link
            href={`/os/angebote/${id}`}
            style={{
              background: 'var(--brand-border)',
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-text-secondary)', textDecoration: 'none',
              fontFamily: mono, fontSize: '11px',
              padding: '12px 20px', borderRadius: '2px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              display: 'inline-block',
            }}
          >
            {t.angebotForm.cancel}
          </Link>
        </div>
      </div>
    </div>
  )
}
