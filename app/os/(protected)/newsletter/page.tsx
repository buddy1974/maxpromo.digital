'use client'
import { useEffect, useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono    = 'var(--font-roboto-mono)'
const grotesk = 'var(--font-inter)'
const sans    = 'var(--font-inter)'

interface Subscriber {
  id: string; email: string; name: string; source: string; status: string; created_at: string; tags: string[]
}

/** Raw DB values — the filter identity. Display text comes from t.status.subscriber. */
const STATUS_TABS = ['all', 'active', 'unsubscribed']

export default function NewsletterPage() {
  const { t, fmtDate } = useOsLocale()
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

  const activeCount = subs.filter(s => s.status === 'active').length

  async function sendNewsletter() {
    if (!subject.trim() || !body.trim()) return
    if (!confirm(t.newsletter.sendConfirm(activeCount))) return
    setSending(true)
    setSendResult(null)
    try {
      // NOTE: the newsletter body is authored by Marcel in whatever language
      // he types — it is CONTENT, not OS chrome, so it is deliberately not
      // routed through the dictionary.
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:var(--brand-background);padding:24px 32px;border-bottom:3px solid var(--brand-primary);">
            <p style="font-family:monospace;font-size:10px;color:var(--brand-primary);letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px;">Maxpromo Digital</p>
            <h1 style="color:var(--brand-surface);margin:0;font-size:20px;font-weight:700;">${subject.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h1>
          </div>
          <div style="padding:28px 32px;background:var(--brand-surface);">
            <div style="color:var(--brand-text-secondary);font-size:15px;line-height:1.7;white-space:pre-wrap;">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          </div>
          <div style="background:var(--brand-background);padding:16px 32px;border-top:1px solid var(--brand-surface-sunken);">
            <p style="font-family:monospace;font-size:10px;color:var(--brand-text-muted);margin:0;">Maxpromo Digital · info@maxpromo.digital · maxpromo.digital</p>
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
    const rows = [[t.newsletter.csvEmail, t.newsletter.csvName, t.newsletter.csvSource, t.newsletter.csvStatus, t.newsletter.csvDate]]
    subs.forEach(s => rows.push([
      s.email,
      s.name || '',
      s.source || '',
      t.status.subscriber[s.status] ?? s.status,
      fmtDate(s.created_at),
    ]))
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

  const tabLabel = (key: string) => key === 'all' ? t.status.filterAll : (t.status.subscriber[key] ?? key)

  const columns = [t.newsletter.colEmail, t.newsletter.colName, t.newsletter.colSource, t.newsletter.colDate, t.newsletter.colStatus, '']

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: 'var(--brand-text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{t.newsletter.heading}</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.1em' }}>
            {subs.length} {t.newsletter.statTotal} &nbsp;·&nbsp; <span style={{ color: 'var(--semantic-success)' }}>{activeCount} {t.newsletter.statActive}</span>
          </p>
        </div>
        <button onClick={exportCsv} style={{ background: 'none', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', padding: '9px 16px', cursor: 'pointer', textTransform: 'uppercase' }}>
          {t.newsletter.exportCsv}
        </button>
      </div>

      {/* Compose */}
      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', padding: '24px', marginBottom: '28px' }}>
        <p style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>{t.newsletter.compose}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t.newsletter.fieldSubject}</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', background: 'var(--brand-background)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t.newsletter.fieldBody}</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} style={{ width: '100%', background: 'var(--brand-background)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: '13px', padding: '10px 14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
          </div>
        </div>

        {sendResult && (
          <div style={{ background: 'color-mix(in srgb, var(--semantic-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--semantic-success) 20%, transparent)', padding: '10px 16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: mono, fontSize: '11px', color: 'var(--semantic-success)', margin: 0, letterSpacing: '0.06em' }}>
              {t.newsletter.sendResult(sendResult.sent, sendResult.failed)}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={sendNewsletter} disabled={sending || !subject.trim() || !body.trim()} style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '11px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: sending || !subject.trim() || !body.trim() ? 0.5 : 1 }}>
            {sending ? t.newsletter.sending : t.newsletter.sendTo(activeCount)}
          </button>
          <button onClick={() => setPreview(!preview)} style={{ background: 'none', border: '1px solid var(--brand-border)', color: 'var(--brand-text-secondary)', fontFamily: mono, fontSize: '11px', padding: '11px 16px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {preview ? t.newsletter.hidePreview : t.newsletter.preview}
          </button>
        </div>

        {preview && subject && body && (
          <div style={{ marginTop: '20px', border: '1px solid var(--brand-border)', padding: '0', overflow: 'hidden' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 16px', borderBottom: '1px solid var(--brand-border)', margin: 0 }}>{t.newsletter.emailPreview}</p>
            <div style={{ padding: '20px', background: 'var(--brand-surface-subtle)' }}>
              <div style={{ background: 'var(--brand-background)', padding: '20px 24px', borderBottom: '3px solid var(--brand-primary)', marginBottom: '0' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>Maxpromo Digital</p>
                <p style={{ color: 'var(--brand-text)', margin: 0, fontSize: '17px', fontWeight: 700 }}>{subject}</p>
              </div>
              <div style={{ background: 'var(--brand-surface)', padding: '20px 24px' }}>
                <p style={{ color: 'var(--brand-text-secondary)', fontSize: '14px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{body}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscriber list */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        {STATUS_TABS.map(key => (
          <button key={key} onClick={() => setStatusTab(key)} style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 12px', border: 'none', cursor: 'pointer', background: statusTab === key ? 'var(--brand-primary)' : 'transparent', color: statusTab === key ? 'var(--brand-text)' : 'var(--brand-text-muted)' }}>
            {tabLabel(key)}
          </button>
        ))}
        <input placeholder={t.common.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: '13px', padding: '7px 14px', outline: 'none', width: '220px', marginLeft: 'auto' }} />
      </div>

      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              {columns.map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-secondary)' }}>{t.common.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px 16px', fontFamily: sans, fontSize: '13px', color: 'var(--brand-text-muted)' }}>{t.newsletter.empty}</td></tr>
            ) : (
              filtered.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '12px', color: 'var(--brand-text)' }}>{sub.email}</td>
                  <td style={{ padding: '11px 16px', fontFamily: sans, fontSize: '13px', color: 'var(--brand-text-secondary)' }}>{sub.name || t.common.notAvailable}</td>
                  <td style={{ padding: '11px 16px' }}><span style={{ fontFamily: mono, fontSize: '9px', color: 'var(--brand-text-secondary)', background: 'var(--brand-border)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub.source || t.common.notAvailable}</span></td>
                  <td style={{ padding: '11px 16px', fontFamily: mono, fontSize: '11px', color: 'var(--brand-text-muted)' }}>{fmtDate(sub.created_at)}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: '9px', color: sub.status === 'active' ? 'var(--semantic-success)' : 'var(--semantic-danger)', background: sub.status === 'active' ? 'color-mix(in srgb, var(--semantic-success) 12%, transparent)' : 'color-mix(in srgb, var(--semantic-danger) 12%, transparent)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>
                      {t.status.subscriber[sub.status] ?? sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <button onClick={() => updateStatus(sub.id, sub.status === 'active' ? 'unsubscribed' : 'active')} style={{ fontFamily: mono, fontSize: '10px', color: 'var(--brand-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                      {sub.status === 'active' ? t.newsletter.unsub : t.newsletter.reactivate}
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
