'use client'
import { useEffect, useState } from 'react'

const mono    = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans    = 'var(--font-dm-sans)'

interface Subscriber {
  id: string; email: string; name: string; source: string; status: string; created_at: string; tags: string[]
}

export default function NewsletterPage() {
  const [subs,      setSubs]      = useState<Subscriber[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [subject,   setSubject]   = useState('')
  const [body,      setBody]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [preview,   setPreview]   = useState(false)

  useEffect(() => {
    fetch('/api/os/newsletter')
      .then(r => r.json())
      .then(d => { setSubs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function sendNewsletter() {
    if (!subject.trim() || !body.trim()) return
    if (!confirm(`Send to all ${subs.filter(s => s.status === 'active').length} active subscribers?`)) return
    setSending(true)
    setSendResult(null)
    try {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0A0A0A;padding:24px 32px;border-bottom:3px solid #F97316;">
            <p style="font-family:monospace;font-size:10px;color:#F97316;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px;">MaxPromo Digital</p>
            <h1 style="color:#FFF;margin:0;font-size:20px;font-weight:700;">${subject.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h1>
          </div>
          <div style="padding:28px 32px;background:#fff;">
            <div style="color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          </div>
          <div style="background:#0A0A0A;padding:16px 32px;border-top:1px solid #1a1a1a;">
            <p style="font-family:monospace;font-size:10px;color:#444;margin:0;">MaxPromo Digital · info@maxpromo.digital · maxpromo.digital</p>
          </div>
        </div>`
      const res  = await fetch('/api/os/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      })
      const data = await res.json() as { sent: number; failed: number }
      setSendResult(data)
    } finally { setSending(false) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/os/newsletter', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  function exportCsv() {
    const rows = [['Email', 'Name', 'Source', 'Status', 'Date']]
    subs.forEach(s => rows.push([s.email, s.name || '', s.source || '', s.status, new Date(s.created_at).toLocaleDateString('de-DE')]))
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'newsletter-subscribers.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = subs
    .filter(s => statusTab === 'all' || s.status === statusTab)
    .filter(s => search === '' || `${s.email} ${s.name}`.toLowerCase().includes(search.toLowerCase()))

  const activeCount = subs.filter(s => s.status === 'active').length

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Newsletter</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>
            {subs.length} Total &nbsp;·&nbsp; <span style={{ color: '#22c55e' }}>{activeCount} Active</span>
          </p>
        </div>
        <button onClick={exportCsv} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#888', fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', padding: '9px 16px', cursor: 'pointer', textTransform: 'uppercase' }}>
          Export CSV
        </button>
      </div>

      {/* Compose */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', padding: '24px', marginBottom: '28px' }}>
        <p style={{ fontFamily: mono, fontSize: '9px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>Compose Newsletter</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Body (plain text)</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '10px 14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
          </div>
        </div>

        {sendResult && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '10px 16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: mono, fontSize: '11px', color: '#22c55e', margin: 0, letterSpacing: '0.06em' }}>
              ✓ Sent: {sendResult.sent} &nbsp;·&nbsp; Failed: {sendResult.failed}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={sendNewsletter} disabled={sending || !subject.trim() || !body.trim()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '11px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: sending || !subject.trim() || !body.trim() ? 0.5 : 1 }}>
            {sending ? 'Sending...' : `Send to ${activeCount} Active Subscribers`}
          </button>
          <button onClick={() => setPreview(!preview)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '11px 16px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {preview ? 'Hide Preview' : 'Preview'}
          </button>
        </div>

        {preview && subject && body && (
          <div style={{ marginTop: '20px', border: '1px solid rgba(255,255,255,0.06)', padding: '0', overflow: 'hidden' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', margin: 0 }}>Email Preview</p>
            <div style={{ padding: '20px', background: '#f9f9f9' }}>
              <div style={{ background: '#0A0A0A', padding: '20px 24px', borderBottom: '3px solid #F97316', marginBottom: '0' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '9px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>MaxPromo Digital</p>
                <p style={{ color: '#FFF', margin: 0, fontSize: '17px', fontWeight: 700 }}>{subject}</p>
              </div>
              <div style={{ background: '#fff', padding: '20px 24px' }}>
                <p style={{ color: '#333', fontSize: '14px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{body}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscriber list */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        {['all', 'active', 'unsubscribed'].map(t => (
          <button key={t} onClick={() => setStatusTab(t)} style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 12px', border: 'none', cursor: 'pointer', background: statusTab === t ? '#F97316' : 'transparent', color: statusTab === t ? '#000' : '#555' }}>
            {t}
          </button>
        ))}
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '7px 14px', outline: 'none', width: '220px', marginLeft: 'auto' }} />
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #F97316', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Email', 'Name', 'Source', 'Date', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: '#444' }}>No subscribers found.</td></tr>
            ) : (
              filtered.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '12px', color: '#FFF' }}>{sub.email}</td>
                  <td style={{ padding: '11px 16px', fontFamily: sans, fontSize: '13px', color: '#888' }}>{sub.name || '—'}</td>
                  <td style={{ padding: '11px 16px' }}><span style={{ fontFamily: mono, fontSize: '9px', color: '#666', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub.source || '—'}</span></td>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '11px', color: '#555' }}>{new Date(sub.created_at).toLocaleDateString('de-DE')}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: sub.status === 'active' ? '#22c55e' : '#ef4444', background: sub.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>{sub.status}</span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <button onClick={() => updateStatus(sub.id, sub.status === 'active' ? 'unsubscribed' : 'active')} style={{ fontFamily: mono, fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                      {sub.status === 'active' ? 'Unsub' : 'Reactivate'}
                    </button>
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
