'use client'
import { useEffect, useState } from 'react'

const mono    = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans    = 'var(--font-dm-sans)'

interface Lead {
  id: string; name: string; email: string; phone: string; company: string
  source: string; category: string; summary: string; status: string; notes: string
  converted: boolean; created_at: string
}

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  new:        { text: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  contacted:  { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  qualified:  { text: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  converted:  { text: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  lost:       { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { text: '#888', bg: 'rgba(136,136,136,0.12)' }
  return <span style={{ fontFamily: mono, fontSize: '9px', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>{status}</span>
}

export default function LeadsPage() {
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    fetch('/api/os/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    await fetch('/api/os/leads', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, converted: status === 'converted' }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, converted: status === 'converted' } : l))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const filtered = leads
    .filter(l => tab === 'all' || l.status === tab)
    .filter(l => search === '' || `${l.name} ${l.company} ${l.email} ${l.source}`.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    converted: leads.filter(l => l.converted).length,
  }

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Leads</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>
            {stats.total} Total &nbsp;·&nbsp;
            <span style={{ color: '#F97316' }}>{stats.new} New</span> &nbsp;·&nbsp;
            <span style={{ color: '#22c55e' }}>{stats.converted} Converted</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', ...STATUSES].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 12px', border: 'none', cursor: 'pointer', background: tab === t ? '#F97316' : 'transparent', color: tab === t ? '#000' : '#555' }}>
              {t}
            </button>
          ))}
        </div>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '7px 14px', outline: 'none', width: '220px' }} />
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Name / Company', 'Source', 'Date', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No leads found.</td></tr>
            ) : (
              filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => setSelected(lead)}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontFamily: sans, fontSize: '13px', color: '#FFF', margin: '0 0 2px' }}>{lead.name || '—'}</p>
                    {lead.company && <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.04em' }}>{lead.company}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.04)', padding: '3px 8px' }}>{lead.source || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#555' }}>
                    {new Date(lead.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={lead.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      {lead.status !== 'contacted' && (
                        <button onClick={() => updateStatus(lead.id, 'contacted')} style={{ fontFamily: mono, fontSize: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                          Contacted
                        </button>
                      )}
                      {lead.status !== 'converted' && (
                        <button onClick={() => updateStatus(lead.id, 'converted')} style={{ fontFamily: mono, fontSize: '10px', color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                          Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', background: '#0D0D0D', borderLeft: '1px solid rgba(255,255,255,0.07)', zIndex: 200, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Lead Details</p>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: grotesk, fontSize: '18px', fontWeight: 700, color: '#FFF', margin: '0 0 4px' }}>{selected.name || 'Anonymous'}</h2>
            {selected.company && <p style={{ fontFamily: mono, fontSize: '11px', color: '#555', margin: '0 0 16px' }}>{selected.company}</p>}

            <StatusBadge status={selected.status} />

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Email', value: selected.email },
                { label: 'Phone', value: selected.phone },
                { label: 'Source', value: selected.source },
                { label: 'Category', value: selected.category },
                { label: 'Date', value: new Date(selected.created_at).toLocaleDateString('de-DE') },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 3px' }}>{f.label}</p>
                  <p style={{ fontFamily: sans, fontSize: '13px', color: '#888', margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {selected.summary && (
              <div style={{ marginTop: '16px', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '2px solid #F97316', padding: '14px 16px' }}>
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px' }}>AI Summary</p>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#888', margin: 0, lineHeight: 1.6 }}>{selected.summary}</p>
              </div>
            )}

            {selected.notes && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 6px' }}>Notes</p>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#888', margin: 0, lineHeight: 1.6 }}>{selected.notes}</p>
              </div>
            )}

            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px' }}>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>Update Status</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {STATUSES.filter(s => s !== selected.status).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ fontFamily: mono, fontSize: '9px', color: STATUS_COLOR[s]?.text ?? '#888', background: STATUS_COLOR[s]?.bg ?? 'transparent', border: `1px solid ${STATUS_COLOR[s]?.text ?? '#555'}40`, padding: '6px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
