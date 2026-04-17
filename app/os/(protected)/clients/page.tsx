'use client'
import { useEffect, useState } from 'react'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface Client {
  id: string; name: string; company: string; email: string
  phone: string; city: string; country: string; status: string; created_at: string
}

const BLANK: Omit<Client, 'id' | 'created_at'> = {
  name: '', company: '', email: '', phone: '', city: '', country: 'Germany', status: 'active',
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/os/clients')
      .then(r => r.json())
      .then(d => { setClients(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/os/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const newClient = await res.json() as Client
      setClients(prev => [newClient, ...prev])
      setForm({ ...BLANK })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const filtered = clients.filter(c =>
    `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Clients</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>{clients.length} TOTAL</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          + New Client
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '300px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '9px 14px', outline: 'none', marginBottom: '20px', display: 'block' }}
      />

      {/* New client form */}
      {showForm && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderTop: '2px solid #F97316', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 20px' }}>New Client</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <Input label="Name *"    value={form.name}    onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Input label="Company"  value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
            <Input label="Email"    value={form.email}   onChange={v => setForm(f => ({ ...f, email: v }))} />
            <Input label="Phone"    value={form.phone}   onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <Input label="City"     value={form.city}    onChange={v => setForm(f => ({ ...f, city: v }))} />
            <Input label="Country"  value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={save} disabled={saving || !form.name.trim()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', padding: '10px 20px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'SAVING...' : 'SAVE CLIENT'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '10px 16px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Name', 'Company', 'Email', 'Phone', 'City', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No clients found.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#FFF' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#888' }}>{c.company || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#888' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: '11px', color: '#888' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: sans, fontSize: '13px', color: '#555' }}>{c.city || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: c.status === 'active' ? '#22c55e' : '#555', background: c.status === 'active' ? '#22c55e22' : '#55555522', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {c.status}
                    </span>
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
