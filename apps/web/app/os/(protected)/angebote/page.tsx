'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Icon } from '@maxpromo/ui'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface Angebot {
  id: string; angebot_number: string; client_name: string; client_email: string
  client_address?: string; line_items: unknown[]
  total: number; subtotal: number; status: string; created_at: string
  valid_until: string; converted_to_invoice: boolean; notes?: string
  payment_method?: string; currency?: string; language?: string
}

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  draft:     { text: 'var(--brand-text-secondary)',     bg: 'var(--brand-surface-sunken)' },
  sent:      { text: 'var(--semantic-info)', bg: 'color-mix(in srgb, var(--semantic-info) 12%, transparent)' },
  accepted:  { text: 'var(--semantic-success)', bg: 'color-mix(in srgb, var(--semantic-success) 12%, transparent)' },
  rejected:  { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 12%, transparent)' },
  expired:   { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 12%, transparent)' },
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = STATUS_COLOR[status] ?? { text: 'var(--brand-text-secondary)', bg: 'var(--brand-surface-sunken)' }
  return <span style={{ fontFamily: mono, fontSize: '9px', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>{label}</span>
}

/** Raw DB status values — the filter identity. Display text comes from t.status.angebot. */
const TABS = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired']

export default function AngebotePage() {
  const { t, fmtEur, fmtDate } = useOsLocale()
  const router = useRouter()
  const [angebote, setAngebote] = useState<Angebot[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')

  useEffect(() => {
    fetch('/api/os/angebote')
      .then(r => r.json())
      .then(d => { setAngebote(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const [converting, setConverting] = useState<string | null>(null)
  const [convertError, setConvertError] = useState('')

  async function convertToInvoice(a: Angebot) {
    if (!confirm(t.angebotList.convertConfirm(a.angebot_number))) return
    setConverting(a.id)
    setConvertError('')
    try {
      // Fetch full angebot to ensure we have line_items
      const full = await fetch(`/api/os/angebote?id=${a.id}`).then(r => r.json()) as Angebot
      const res = await fetch('/api/os/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: full.client_name,
          client_email: full.client_email,
          client_address: full.client_address || undefined,
          line_items: Array.isArray(full.line_items) ? full.line_items : [],
          subtotal: Number(full.subtotal || full.total),
          total: Number(full.total),
          status: 'draft',
          notes: full.notes || undefined,
          payment_method: full.payment_method || 'bank',
          currency: full.currency || 'EUR',
          // Angebot → Invoice conversion inherits the quote's DOCUMENT
          // language (not the OS UI language — the two are independent).
          // Marcel can change it afterwards on the new invoice's detail
          // page — same pattern as payment_method and currency, which are
          // also carried forward but editable.
          language: full.language || 'de',
        }),
      })
      if (!res.ok) throw new Error(t.angebotList.createInvoiceFailed)
      await fetch('/api/os/angebote', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, converted_to_invoice: true, status: 'accepted' }),
      })
      setAngebote(prev => prev.map(x => x.id === a.id ? { ...x, converted_to_invoice: true, status: 'accepted' } : x))
      router.push('/os/invoices')
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : t.angebotList.convertFailed)
    } finally {
      setConverting(null)
    }
  }

  async function deleteAngebot(id: string, num: string) {
    if (!confirm(t.angebotList.deleteConfirm(num))) return
    const res = await fetch(`/api/os/angebote?id=${id}`, { method: 'DELETE' })
    if (res.ok) setAngebote(prev => prev.filter(a => a.id !== id))
  }

  const tabLabel = (key: string) => key === 'all' ? t.status.filterAll : (t.status.angebot[key] ?? key)
  const filtered = tab === 'all' ? angebote : angebote.filter(a => a.status === tab)

  const columns = [
    t.angebotList.colNumber, t.angebotList.colClient, t.angebotList.colDate,
    t.angebotList.colValidUntil, t.angebotList.colAmount, t.angebotList.colStatus, t.angebotList.colActions,
  ]

  return (
    <div style={{ padding: '32px 40px' }}>
      {convertError && (
        <div style={{ background: 'color-mix(in srgb, var(--semantic-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-danger) 30%, transparent)', padding: '10px 16px', marginBottom: '16px', borderRadius: '4px' }}>
          <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--semantic-danger)', margin: 0 }}><Icon name="warning" size="xs" /> {convertError}</p>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: 'var(--brand-text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{t.angebotList.heading}</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.1em' }}>{angebote.length} {t.common.total}</p>
        </div>
        <Link href="/os/angebote/new" style={{ background: 'var(--brand-primary)', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', textTransform: 'uppercase' }}>
          {t.angebotList.newAngebot}
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {TABS.map(key => (
          <button key={key} onClick={() => setTab(key)} style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 14px', border: 'none', cursor: 'pointer', background: tab === key ? 'var(--brand-primary)' : 'transparent', color: tab === key ? 'var(--brand-text)' : 'var(--brand-text-muted)' }}>
            {tabLabel(key)}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              {columns.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-secondary)' }}>{t.common.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: 'var(--brand-text-muted)' }}>{t.angebotList.empty}</td></tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      href={`/os/angebote/${a.id}`}
                      style={{ fontFamily: mono, fontSize: '12px', color: 'var(--brand-primary-text)', textDecoration: 'none', borderBottom: '1px dotted color-mix(in srgb, var(--brand-primary) 40%, transparent)' }}
                    >
                      {a.angebot_number}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: 'var(--brand-text)' }}>
                    <Link href={`/os/angebote/${a.id}`} style={{ color: 'var(--brand-text)', textDecoration: 'none' }}>
                      {a.client_name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-muted)' }}>
                    {fmtDate(a.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-muted)' }}>
                    {fmtDate(a.valid_until)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '13px', color: 'var(--brand-text)', fontWeight: 700 }}>
                    {fmtEur(Number(a.total))}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={a.status} label={t.status.angebot[a.status] ?? a.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {!a.converted_to_invoice ? (
                        <button
                          onClick={() => convertToInvoice(a)}
                          disabled={converting === a.id}
                          style={{ fontFamily: mono, fontSize: '10px', color: 'var(--semantic-success)', background: 'none', border: 'none', cursor: converting === a.id ? 'wait' : 'pointer', padding: 0, letterSpacing: '0.06em', opacity: converting === a.id ? 0.5 : 1 }}
                        >
                          {converting === a.id ? '⟳' : t.angebotList.convert}
                        </button>
                      ) : (
                        <span style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-secondary)', letterSpacing: '0.06em' }}>{t.angebotList.converted}</span>
                      )}
                      <button
                        onClick={() => deleteAngebot(a.id, a.angebot_number)}
                        style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
                      >
                        {t.angebotList.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
