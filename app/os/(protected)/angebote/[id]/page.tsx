'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const mono = 'var(--font-roboto-mono)'
const sans = 'var(--font-inter)'

interface LineItem { description: string; qty: number; unit: string; unit_price: number; total: number; isFixedPrice?: boolean }
interface Angebot {
  id: string; angebot_number: string; client_name: string; client_email: string
  client_address: string; line_items: LineItem[]; total: number; subtotal: number
  status: string; created_at: string; valid_until: string; notes: string
  anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string
  payment_terms?: string; included_items?: string[]
  converted_to_invoice?: boolean
}

const STATUS_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  draft:    { text: '#888',    bg: 'rgba(136,136,136,0.1)',  border: '#333' },
  sent:     { text: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)' },
  accepted: { text: '#4ade80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)' },
  rejected: { text: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)' },
  expired:  { text: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)' },
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AngebotDetailPage() {
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

  useEffect(() => {
    if (!id) return
    fetch(`/api/os/angebote?id=${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(d => { setAngebot(d as Angebot); setLoading(false) })
      .catch(() => { setError('Angebot not found.'); setLoading(false) })
  }, [id])

  function openSendModal() {
    if (!angebot) return
    setEmailInput(angebot.client_email?.trim() ?? '')
    setSendError('')
    setSendSuccess('')
    setSendModalOpen(true)
  }

  /**
   * Sending is one atomic flow:
   *   1. Validate the email shown in the modal.
   *   2. If different from the stored client_email, PATCH the angebot
   *      so it's persisted (no silent override).
   *   3. POST /api/os/send-angebot with the new email.
   *
   * The sender route reads the stored client_email from the row, so the
   * PATCH must complete before the POST. We do them sequentially.
   */
  async function confirmSend() {
    if (!angebot) return
    const email = emailInput.trim()
    if (!email) {
      setSendError('Please enter an email address.')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setSendError('That doesn’t look like a valid email address.')
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
          const err = await patch.json().catch(() => ({})) as { error?: string }
          throw new Error(err.error ?? 'Could not save the new email')
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
      const data = await res.json() as { error?: string; detail?: string }
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`)

      setSendSuccess(`Sent to ${email}${bccMarcel ? ' (BCC info@maxpromo.digital)' : ''}.`)
      setAngebot(prev => prev ? { ...prev, status: 'sent', client_email: email } : prev)
      setSendModalOpen(false)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  async function deleteAngebot() {
    if (!angebot || !confirm(`Delete ${angebot.angebot_number}? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/os/angebote?id=${angebot.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/os/angebote')
    else setDeleting(false)
  }

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em' }}>Loading...</p>
    </div>
  )

  if (error || !angebot) return (
    <div style={{ padding: '40px' }}>
      <p style={{ fontFamily: mono, fontSize: '12px', color: '#ef4444' }}>{error || 'Angebot not found.'}</p>
      <Link href="/os/angebote" style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', textDecoration: 'none' }}>← Back to Angebote</Link>
    </div>
  )

  const items = Array.isArray(angebot.line_items) ? angebot.line_items : []
  const hasAnz = Number(angebot.anzahlung) > 0
  const restbet = hasAnz ? Number(angebot.total) - Number(angebot.anzahlung) : Number(angebot.total)
  const sc = STATUS_COLOR[angebot.status] ?? STATUS_COLOR.draft

  return (
    <div style={{ padding: '32px 40px', maxWidth: '860px' }}>
      {/* Breadcrumb */}
      <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', marginBottom: '24px', letterSpacing: '0.1em' }}>
        <Link href="/os/angebote" style={{ color: '#555', textDecoration: 'none' }}>Angebote</Link>
        {' / '}
        <span style={{ color: '#FFF' }}>{angebot.angebot_number}</span>
      </p>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: sans, fontSize: '26px', fontWeight: 700, color: '#FFF', margin: 0, letterSpacing: '-0.02em' }}>
              {angebot.angebot_number}
            </h1>
            <span style={{ fontFamily: mono, fontSize: '10px', color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, padding: '3px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '3px' }}>
              {angebot.status}
            </span>
            {angebot.converted_to_invoice && (
              <span style={{ fontFamily: mono, fontSize: '10px', color: '#888', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '3px' }}>
                converted to invoice
              </span>
            )}
          </div>
          <p style={{ fontFamily: sans, fontSize: '15px', color: '#888', margin: 0 }}>{angebot.client_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href={`/os/angebote/${angebot.id}/edit`}
            style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#ccc', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
          >
            ✎ Edit
          </Link>
          <a
            href={`/os/angebote/${angebot.id}/print`}
            target="_blank"
            style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#ccc', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}
          >
            📄 PDF / Print
          </a>
          <button
            onClick={openSendModal}
            disabled={sending}
            style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#000', background: '#F97316', border: 'none', borderRadius: '4px', padding: '9px 16px', cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.5 : 1, fontWeight: 700 }}
          >
            {sending ? '⟳ Sending...' : '✉ Send to Client'}
          </button>
          <button
            onClick={deleteAngebot}
            disabled={deleting}
            style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', padding: '9px 16px', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.5 : 1 }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Persistent banners (shown on the page after the modal closes) */}
      {sendSuccess && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', padding: '10px 16px', marginBottom: '16px', borderRadius: '4px' }}>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#4ade80', margin: 0 }}>✓ {sendSuccess}</p>
        </div>
      )}

      {/* SEND MODAL — opens when user clicks "Send to Client". Always asks
          for / shows the email so they can edit it inline; no need to
          bounce back to the edit page when the email is missing. */}
      {sendModalOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setSendModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
        >
          <div
            style={{
              background: '#111', border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: '4px', width: '100%', maxWidth: '460px', padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 style={{ fontFamily: sans, fontWeight: 700, fontSize: '18px', color: '#FFF', margin: 0, letterSpacing: '-0.02em' }}>
                Send Angebot {angebot.angebot_number}
              </h2>
              <button
                onClick={() => setSendModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: '0 0 22px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Resend or edit recipient before sending
            </p>

            <label style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Client email
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
              placeholder="kunde@example.com"
              style={{
                width: '100%',
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                color: '#FFF',
                fontFamily: sans,
                fontSize: '14px',
                padding: '10px 12px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '14px',
              }}
            />

            <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: '0 0 16px', letterSpacing: '0.04em' }}>
              {angebot.client_email && angebot.client_email !== emailInput.trim()
                ? `Will overwrite the saved email (${angebot.client_email}) on save.`
                : !angebot.client_email
                  ? 'No email is currently saved. The new email will be saved before sending.'
                  : 'Same as the saved email.'}
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={bccMarcel}
                onChange={e => setBccMarcel(e.target.checked)}
                style={{ accentColor: '#F97316', width: '14px', height: '14px' }}
              />
              <span style={{ fontFamily: mono, fontSize: '10px', color: '#888', letterSpacing: '0.08em' }}>
                BCC info@maxpromo.digital
              </span>
            </label>

            {sendError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', marginBottom: '14px', borderRadius: '3px' }}>
                <p style={{ fontFamily: mono, fontSize: '11px', color: '#ef4444', margin: 0 }}>⚠ {sendError}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSendModalOpen(false)}
                disabled={sending}
                style={{
                  fontFamily: mono, fontSize: '11px', letterSpacing: '0.08em',
                  color: '#888', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
                  padding: '10px 16px', cursor: sending ? 'wait' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                disabled={sending || !emailInput.trim()}
                style={{
                  fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                  color: '#000', background: '#F97316', border: 'none', borderRadius: '4px',
                  padding: '10px 18px',
                  cursor: sending || !emailInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: sending || !emailInput.trim() ? 0.5 : 1,
                }}
              >
                {sending ? '⟳ Sending…' : 'Send →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Date', value: new Date(angebot.created_at).toLocaleDateString('de-DE') },
          { label: 'Valid Until', value: angebot.valid_until ? new Date(angebot.valid_until).toLocaleDateString('de-DE') : '—' },
        ].map(m => (
          <div key={m.label} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '16px 20px' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>{m.label}</p>
            <p style={{ fontFamily: mono, fontSize: '14px', color: '#FFF', margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Client */}
      <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '20px 24px', marginBottom: '20px' }}>
        <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>Client</p>
        <p style={{ fontFamily: sans, fontSize: '15px', fontWeight: 600, color: '#FFF', margin: '0 0 4px' }}>{angebot.client_name}</p>
        {angebot.client_email && <p style={{ fontFamily: mono, fontSize: '12px', color: '#888', margin: '0 0 3px' }}>{angebot.client_email}</p>}
        {angebot.client_address && <p style={{ fontFamily: sans, fontSize: '13px', color: '#666', margin: 0, whiteSpace: 'pre-line' }}>{angebot.client_address}</p>}
      </div>

      {/* Line items */}
      <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0D0D0D' }}>
          <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Line Items</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['#', 'Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === '#' ? 'center' : h === 'Description' ? 'left' : 'right', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px', fontFamily: sans, fontSize: '13px', color: '#444', textAlign: 'center' }}>No line items.</td></tr>
            ) : items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: '#F97316' }}>{String(i + 1).padStart(2, '0')}</td>
                <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '14px', color: '#FFF' }}>
                  {item.description}
                  {!item.isFixedPrice && item.unit && item.qty > 1 && (
                    <span style={{ fontFamily: mono, fontSize: '11px', color: '#555', marginLeft: '8px' }}>({item.qty} {item.unit})</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: '#888' }}>{item.isFixedPrice ? '1' : item.qty}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: mono, fontSize: '12px', color: '#888' }}>{fmtEur(Number(item.unit_price || item.total))}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>{fmtEur(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ padding: '16px 24px', borderTop: '2px solid #F97316', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            {hasAnz ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>Zwischensumme</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>{fmtEur(Number(angebot.subtotal || angebot.total))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>Anzahlung ({angebot.anzahlung_method || 'Überweisung'})</span>
                  <span style={{ fontFamily: mono, fontSize: '12px', color: '#888' }}>−{fmtEur(Number(angebot.anzahlung))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                  <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>Restbetrag</span>
                  <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 700, color: '#F97316' }}>{fmtEur(restbet)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: sans, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>Gesamt</span>
                <span style={{ fontFamily: sans, fontSize: '20px', fontWeight: 700, color: '#F97316' }}>{fmtEur(Number(angebot.total))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Included items (free) */}
      {Array.isArray(angebot.included_items) && angebot.included_items.length > 0 && (
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(34,197,94,0.25)', borderLeft: '3px solid #22c55e', borderRadius: '4px', padding: '14px 20px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>Inklusive (kostenlos)</p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {angebot.included_items.map((it, i) => (
              <li key={i} style={{ fontFamily: sans, fontSize: '13px', color: '#CCC', lineHeight: 1.6 }}>{it}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment terms */}
      {angebot.payment_terms && (
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(249,115,22,0.25)', borderLeft: '3px solid #F97316', borderRadius: '4px', padding: '14px 20px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>Zahlungsbedingungen</p>
          <p style={{ fontFamily: sans, fontSize: '13px', color: '#CCC', margin: 0, lineHeight: 1.6 }}>{angebot.payment_terms}</p>
        </div>
      )}

      {/* Notes */}
      {angebot.notes && (
        <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '20px 24px', marginBottom: '20px' }}>
          <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>Notes</p>
          <p style={{ fontFamily: sans, fontSize: '14px', color: '#888', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{angebot.notes}</p>
        </div>
      )}

      <p style={{ fontFamily: mono, fontSize: '10px', color: '#333', marginTop: '16px' }}>
        Gemäß §19 UStG keine MwSt. · Steuernummer: 111/5339/7597 · Finanzamt Essen-NordOst
      </p>
    </div>
  )
}
