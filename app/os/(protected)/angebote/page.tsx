'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface Angebot {
  id: string; angebot_number: string; client_name: string; client_email: string
  client_address?: string; line_items: unknown[]
  total: number; subtotal: number; status: string; created_at: string
  valid_until: string; converted_to_invoice: boolean; notes?: string
}

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  draft:     { text: '#888',     bg: '#88888820' },
  sent:      { text: '#3b82f6', bg: '#3b82f620' },
  accepted:  { text: '#22c55e', bg: '#22c55e20' },
  rejected:  { text: '#ef4444', bg: '#ef444420' },
  expired:   { text: '#ef4444', bg: '#ef444420' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { text: '#888', bg: '#88888820' }
  return <span style={{ fontFamily: mono, fontSize: '9px', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>{status}</span>
}

export default function AngebotePage() {
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
    if (!confirm(`Convert ${a.angebot_number} to invoice?\n\nThis will create a new draft invoice with all line items.`)) return
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
        }),
      })
      if (!res.ok) throw new Error('Failed to create invoice')
      await fetch('/api/os/angebote', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, converted_to_invoice: true, status: 'accepted' }),
      })
      setAngebote(prev => prev.map(x => x.id === a.id ? { ...x, converted_to_invoice: true, status: 'accepted' } : x))
      router.push('/os/invoices')
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setConverting(null)
    }
  }

  const fmtEur = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  async function deleteAngebot(id: string, num: string) {
    if (!confirm(`Delete ${num}? This cannot be undone.`)) return
    const res = await fetch(`/api/os/angebote?id=${id}`, { method: 'DELETE' })
    if (res.ok) setAngebote(prev => prev.filter(a => a.id !== id))
  }

  const tabs     = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired']
  const filtered = tab === 'all' ? angebote : angebote.filter(a => a.status === tab)

  return (
    <div style={{ padding: '32px 40px' }}>
      {convertError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 16px', marginBottom: '16px', borderRadius: '4px' }}>
          <p style={{ fontFamily: mono, fontSize: '11px', color: '#ef4444', margin: 0 }}>⚠ {convertError}</p>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Angebote</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>{angebote.length} TOTAL</p>
        </div>
        <Link href="/os/angebote/new" style={{ background: '#F97316', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', textDecoration: 'none', textTransform: 'uppercase' }}>
          + New Angebot
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 14px', border: 'none', cursor: 'pointer', background: tab === t ? '#F97316' : 'transparent', color: tab === t ? '#000' : '#555' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Number', 'Client', 'Date', 'Valid Until', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No angebote found.</td></tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '12px', color: '#F97316' }}>{a.angebot_number}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#FFF' }}>{a.client_name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#555' }}>
                    {new Date(a.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#555' }}>
                    {a.valid_until ? new Date(a.valid_until).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '13px', color: '#FFF', fontWeight: 700 }}>
                    {fmtEur(Number(a.total))}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {!a.converted_to_invoice ? (
                        <button
                          onClick={() => convertToInvoice(a)}
                          disabled={converting === a.id}
                          style={{ fontFamily: mono, fontSize: '10px', color: '#22c55e', background: 'none', border: 'none', cursor: converting === a.id ? 'wait' : 'pointer', padding: 0, letterSpacing: '0.06em', opacity: converting === a.id ? 0.5 : 1 }}
                        >
                          {converting === a.id ? '⟳' : '→ Invoice'}
                        </button>
                      ) : (
                        <span style={{ fontFamily: mono, fontSize: '9px', color: '#333', letterSpacing: '0.06em' }}>Converted</span>
                      )}
                      <button
                        onClick={() => deleteAngebot(a.id, a.angebot_number)}
                        style={{ fontFamily: mono, fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}
                      >
                        Delete
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
