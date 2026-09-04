'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DocumentLanguage } from '@/lib/documents/config'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Icon } from '@maxpromo/ui'

const mono = 'var(--brand-font-mono)'
const sans = 'var(--brand-font-body)'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice?: boolean }
interface Angebot {
  id: string; angebot_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; valid_until: string; notes: string
  anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string
  payment_terms?: string; included_items?: string[]
  converted_to_invoice?: boolean
  language?: DocumentLanguage | null
}

const STATUS_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  draft:    { text: 'var(--brand-text-secondary)',    bg: 'color-mix(in srgb, var(--brand-text-secondary) 10%, transparent)',  border: 'var(--brand-text-secondary)' },
  sent:     { text: 'var(--semantic-info)', bg: 'color-mix(in srgb, var(--semantic-info) 10%, transparent)',   border: 'color-mix(in srgb, var(--semantic-info) 30%, transparent)' },
  accepted: { text: 'var(--semantic-success)', bg: 'color-mix(in srgb, var(--semantic-success) 10%, transparent)',    border: 'color-mix(in srgb, var(--semantic-success) 30%, transparent)' },
  rejected: { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 10%, transparent)',    border: 'color-mix(in srgb, var(--semantic-danger) 30%, transparent)' },
  expired:  { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 10%, transparent)',    border: 'color-mix(in srgb, var(--semantic-danger) 30%, transparent)' },
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AngebotDetailPage() {
  const { t, intlLocale, fmtEur, fmtDate } = useOsLocale()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [angebot, setAngebot] = useState<Angebot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Send-modal state
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [bccMarcel, setBccMarcel] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  const [deleting, setDeleting] = useState(false)
  const [changingLanguage, setChangingLanguage] = useState(false)

  /** Display Einzelpreis as total ÷ qty so the table math always reconciles. */
  function fmtUnitPrice(total: number, qty: number): string {
    const q = qty > 0 ? qty : 1
    const unit = total / q
    const fractionDigits = Math.abs(unit * q - total) > 0.005 || Math.abs(unit - Math.round(unit * 100) / 100) > 0.0001 ? 4 : 2
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: fractionDigits,
    }).format(unit)
  }

  useEffect(() => {
    if (!id) return
    fetch(`/api/os/angebote?id=${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(d => { setAngebot(d as Angebot); setLoading(false) })
      .catch(() => { setError('not-found'); setLoading(false) })
  }, [id])

  function openSendModal() {
    if (!angebot) return
    setEmailInput(angebot.client_email?.trim() ?? '')
    setSendError('')
    setSendSuccess('')
    setSendModalOpen(true)
  }

  /**
   * Changes the DOCUMENT's language (what the PDF/email is written in) —
   * independent of the OS UI language. Persisted on the row so the print
   * route and send-angebot email both pick it up.
   */
  async function changeLanguage(lang: DocumentLanguage) {
    if (!angebot || lang === angebot.language) return
    setChangingLanguage(true)
    const res = await fetch('/api/os/angebote', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: angebot.id, language: lang }),
    })
    if (res.ok) setAngebot(prev => prev ? { ...prev, language: lang } : prev)
    setChangingLanguage(false)
  }

  /**
   * Sending is one atomic flow:
   *   1. Validate the email shown in the modal.
   *   2. If different from the stored client_email, PATCH the angebot
   *      so it's persisted (no silent override).
   *   3. POST /api/os/send-angebot with the new email.
   *
   * The sender route reads the stored client_email AND the stored document
   * language from the row, so the PATCH must complete before the POST. We
   * do them sequentially.
   */
  async function confirmSend() {
    if (!angebot) return
    const email = emailInput.trim()
    if (!email) {
      setSendError(t.angebotDetail.emailRequired)
      return
    }
    if (!EMAIL_RE.test(email)) {
      setSendError(t.angebotDetail.emailInvalid)
      return
    }

    setSending(true); setSendError(''); setSendSuccess('')
    try {
      // 1. Persist the email if it changed (or was missing).
      if (email !== (angebot.client_email ?? '').trim()) {
        const patch = await fetch('/api/os/angebote', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: angebot.id, client_email: email }),
        })
        if (!patch.ok) {
          throw new Error(t.angebotDetail.saveEmailFailed)
        }
      }

      // 2. Send.
      const res = await fetch('/api/os/send-angebot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angebot_id: angebot.id,
          clientEmails: [email],            // explicit override beats the row
          sendCopyToMarcel: bccMarcel,
        }),
      })
      if (!res.ok) throw new Error(t.angebotDetail.sendFailed)

      setSendSuccess(t.angebotDetail.sentTo(email, bccMarcel))
      setAngebot(prev => prev ? { ...prev, status: 'sent', client_email: email } : prev)
      setSendModalOpen(false)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t.angebotDetail.sendFailed)
    } finally {
      setSending(false)
    }
  }

  async function deleteAngebot() {
    if (!angebot || !confirm(t.angebotDetail.deleteConfirm(angebot.angebot_number))) return
    setDeleting(true)
    const res = await fetch(`/api/os/angebote?id=${angebot.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/os/angebote')
    else setDeleting(false)
  }

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em' }}>{t.common.loading}</p>
    </div>
  )

  if (error || !angebot) return (
    <div style={{ padding: '40px' }}>
      <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--semantic-danger)' }}>{t.angebotDetail.notFound}</p>
      <Link href="/os/angebote" style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', textDecoration: 'none' }}>{t.angebotDetail.backToAngebote}</Link>
    </div>
  )

  const items = Array.isArray(angebot.line_items) ? angebot.line_items : []
  const hasAnz = Number(angebot.anzahlung) > 0
  const restbet = hasAnz ? Number(angebot.total) - Number(angebot.anzahlung) : Number(angebot.total)
  const sc = STATUS_COLOR[angebot.status] ?? STATUS_COLOR.draft

  const columns = [
    t.angebotDetail.colIndex, t.angebotDetail.colDescription,
    t.angebotDetail.colQty, t.angebotDetail.colUnitPrice, t.angebotDetail.colTotal,
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: '860px' }}>
      {/* Breadcrumb */}
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', marginBottom: '24px', letterSpacing: '0.1em' }}>
        <Link href="/os/angebote" style={{ color: 'var(--brand-text-muted)', textDecoration: 'none' }}>{t.angebotDetail.breadcrumb}</Link>
        {' / '}
        <span style={{ color: 'var(--brand-text)' }}>{angebot.angebot_number}</span>
      </p>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: sans, fontSize: '26px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', margin: 0, letterSpacing: '-0.02em' }}>
              {angebot.angebot_number}
            </h1>
            <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, padding: '3px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '3px' }}>
              {t.status.angebot[angebot.status] ?? angebot.status}
            </span>
            {angebot.converted_to_invoice && (
              <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', border: '1px solid var(--brand-border)', padding: '3px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '3px' }}>
                {t.angebotDetail.convertedBadge}
              </span>
            )}
          </div>
          <p style={{ fontFamily: sans, fontSize: 'var(--text-small)', color: 'var(--brand-text-secondary)', margin: 0 }}>{angebot.client_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={angebot.language ?? 'de'}
            disabled={changingLanguage}
            onChange={e => changeLanguage(e.target.value as DocumentLanguage)}
            title={t.angebotDetail.documentLanguageTitle}
            aria-label={t.angebotDetail.documentLanguageTitle}
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--brand-text)', background: 'var(--brand-background)', border: '1px solid var(--brand-border)', borderRadius: '4px', padding: '9px 12px', cursor: changingLanguage ? 'wait' : 'pointer', opacity: changingLanguage ? 0.6 : 1, appearance: 'none' }}
          >
            {/* Endonyms — a document language is named in its own language in
                both OS locales, so this select does NOT follow the OS UI. */}
            <option value="de">🇩🇪 Deutsch</option>
            <option value="en">🇬🇧 English</option>
          </select>
          <Link
            href={`/os/angebote/${angebot.id}/edit`}
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--brand-text)', background: 'transparent', border: '1px solid var(--brand-border)', borderRadius: '4px', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
          >
            {t.angebotDetail.edit}
          </Link>
          <a
            href={`/os/angebote/${angebot.id}/print`}
            target="_blank"
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--brand-text)', background: 'transparent', border: '1px solid var(--brand-border)', borderRadius: '4px', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
          >
            {t.angebotDetail.pdf}
          </a>
          <button
            onClick={openSendModal}
            disabled={sending}
            aria-busy={sending}
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--brand-text)', background: 'var(--brand-primary)', border: 'none', borderRadius: '4px', padding: '9px 16px', cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.5 : 1, fontWeight: 700 }}
          >
            {sending && <Icon name="running" size="xs" />}
            {sending ? t.angebotDetail.sendingButton : t.angebotDetail.sendToClient}
          </button>
          <button
            onClick={deleteAngebot}
            disabled={deleting}
            style={{ fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em', color: 'var(--semantic-danger)', background: 'color-mix(in srgb, var(--semantic-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 20%, transparent)', borderRadius: '4px', padding: '9px 16px', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.5 : 1 }}
          >
            {t.angebotDetail.delete}
          </button>
        </div>
      </div>

      {/* Persistent banners (shown on the page after the modal closes) */}
      {sendSuccess && (
        <div style={{ background: 'color-mix(in srgb, var(--semantic-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-success) 25%, transparent)', padding: '10px 16px', marginBottom: '16px', borderRadius: '4px' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-success)', margin: 0 }}><Icon name="check" size="xs" /> {sendSuccess}</p>
        </div>
      )}

      {/* SEND MODAL — opens when user clicks "Send to Client". Always asks
          for / shows the email so they can edit it inline; no need to
          bounce back to the edit page when the email is missing. */}
      {sendModalOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setSendModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)',
              borderRadius: '4px', width: '100%', maxWidth: '460px', padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 style={{ fontFamily: sans, fontWeight: 'var(--weight-heading)', fontSize: '18px', color: 'var(--brand-text)', margin: 0, letterSpacing: '-0.02em' }}>
                {t.angebotDetail.sendModalTitle(angebot.angebot_number)}
              </h2>
              <button
                onClick={() => setSendModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: '0 0 22px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t.angebotDetail.sendModalSub}
            </p>

            <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              {t.angebotDetail.clientEmail}
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !sending) { e.preventDefault(); confirmSend() }
                if (e.key === 'Escape') setSendModalOpen(false)
              }}
              autoFocus
              placeholder={t.angebotDetail.emailPlaceholder}
              style={{
                width: '100%',
                background: 'var(--brand-background)',
                border: '1px solid var(--brand-border)',
                borderRadius: '4px',
                color: 'var(--brand-text)',
                fontFamily: sans,
                fontSize: '14px',
                padding: '10px 12px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '14px',
              }}
            />

            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: '0 0 16px', letterSpacing: '0.04em' }}>
              {angebot.client_email && angebot.client_email !== emailInput.trim()
                ? t.angebotDetail.willOverwrite(angebot.client_email)
                : !angebot.client_email
                  ? t.angebotDetail.noSavedEmail
                  : t.angebotDetail.sameAsSaved}
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={bccMarcel}
                onChange={e => setBccMarcel(e.target.checked)}
                style={{ accentColor: 'var(--brand-primary)', width: '14px', height: '14px' }}
              />
              <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.08em' }}>
                {t.angebotDetail.bccMarcel}
              </span>
            </label>

            {sendError && (
              <div style={{ background: 'color-mix(in srgb, var(--semantic-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 30%, transparent)', padding: '8px 12px', marginBottom: '14px', borderRadius: '3px' }}>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', margin: 0 }}><Icon name="warning" size="xs" /> {sendError}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSendModalOpen(false)}
                disabled={sending}
                style={{
                  fontFamily: mono, fontSize: 'var(--text-label)', letterSpacing: '0.08em',
                  color: 'var(--brand-text-secondary)', background: 'transparent',
                  border: '1px solid var(--brand-border)', borderRadius: '4px',
                  padding: '10px 16px', cursor: sending ? 'wait' : 'pointer',
                }}
              >
                {t.common.cancel}
              </button>
              <button
                onClick={confirmSend}
                disabled={sending || !emailInput.trim()}
                style={{
                  fontFamily: mono, fontSize: 'var(--text-label)', fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--brand-text)', background: 'var(--brand-primary)', border: 'none', borderRadius: '4px',
                  padding: '10px 18px',
                  cursor: sending || !emailInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: sending || !emailInput.trim() ? 0.5 : 1,
                }}
              >
                {sending && <Icon name="running" size="xs" />}
                {sending ? t.angebotDetail.sendingModal : t.angebotDetail.send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: t.angebotDetail.metaDate,       value: fmtDate(angebot.created_at) },
          { label: t.angebotDetail.metaValidUntil, value: fmtDate(angebot.valid_until) },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: '4px', padding: '16px 20px' }}>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>{m.label}</p>
            <p style={{ fontFamily: mono, fontSize: '14px', color: 'var(--brand-text)', margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Client */}
      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '20px' }}>
        <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.angebotDetail.client}</p>
        <p style={{ fontFamily: sans, fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--brand-text)', margin: '0 0 4px' }}>{angebot.client_name}</p>
        {angebot.client_email && <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)', margin: '0 0 3px' }}>{angebot.client_email}</p>}
        {angebot.client_address && <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>{angebot.client_address}</p>}
      </div>

      {/* Line items */}
      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--brand-border)', background: 'var(--brand-surface)' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{t.angebotDetail.lineItems}</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--brand-surface)', borderBottom: '1px solid var(--brand-border)' }}>
              {columns.map((h, ci) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: ci === 0 ? 'center' : ci === 1 ? 'left' : 'right', fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-muted)', textAlign: 'center' }}>{t.angebotDetail.noLineItems}</td></tr>
            ) : items.map((item, i) => {
              const qty = item.isFixedPrice ? 1 : Number(item.qty || 1)
              const total = Number(item.total) || 0
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)', verticalAlign: 'top' }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '10px 16px', fontFamily: sans, fontSize: '14px', color: 'var(--brand-text)', whiteSpace: 'pre-wrap', verticalAlign: 'top', lineHeight: 1.5 }}>
                    {item.description}
                    {!item.isFixedPrice && item.unit && item.qty > 1 && (
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', marginLeft: '8px' }}>({item.qty} {item.unit})</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)', verticalAlign: 'top' }}>{qty}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)', verticalAlign: 'top' }}>{fmtUnitPrice(total, qty)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', fontWeight: 700, verticalAlign: 'top' }}>{fmtEur(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ padding: '16px 24px', borderTop: '2px solid var(--brand-primary)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            {hasAnz ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{t.angebotDetail.subtotal}</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>{fmtEur(Number(angebot.subtotal || angebot.total))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>
                    {t.angebotDetail.deposit} ({angebot.anzahlung_method || t.angebotDetail.depositDefaultMethod})
                  </span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-text-secondary)' }}>−{fmtEur(Number(angebot.anzahlung))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--brand-border)', paddingTop: '10px' }}>
                  <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)' }}>{t.angebotDetail.remainingBalance}</span>
                  <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-primary-text)' }}>{fmtEur(restbet)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)' }}>{t.angebotDetail.grandTotal}</span>
                <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-primary-text)' }}>{fmtEur(Number(angebot.total))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Included items (free) */}
      {Array.isArray(angebot.included_items) && angebot.included_items.length > 0 && (
        <div style={{ background: 'var(--brand-surface)', border: '1px solid color-mix(in srgb, var(--semantic-success) 25%, transparent)', borderLeft: '3px solid var(--semantic-success)', borderRadius: '4px', padding: '14px 20px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-success)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>{t.angebotDetail.includedItems}</p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {angebot.included_items.map((it, i) => (
              <li key={i} style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', lineHeight: 1.6 }}>{it}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment terms */}
      {angebot.payment_terms && (
        <div style={{ background: 'var(--brand-surface)', border: '1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)', borderLeft: '3px solid var(--brand-primary)', borderRadius: '4px', padding: '14px 20px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>{t.angebotDetail.paymentTerms}</p>
          <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: 0, lineHeight: 1.6 }}>{angebot.payment_terms}</p>
        </div>
      )}

      {/* Notes */}
      {angebot.notes && (
        <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderRadius: '4px', padding: '20px 24px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.angebotDetail.notes}</p>
          <p style={{ fontFamily: sans, fontSize: '14px', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{angebot.notes}</p>
        </div>
      )}

      {/* §19 UStG — Kleinunternehmer status. Never charge VAT. */}
      <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', marginTop: '16px' }}>
        {t.angebotDetail.legalFooter}
      </p>
    </div>
  )
}
