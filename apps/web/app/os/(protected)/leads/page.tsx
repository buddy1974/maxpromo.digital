'use client'
import { useEffect, useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Icon } from '@maxpromo/ui'

const mono    = 'var(--brand-font-mono)'
const grotesk = 'var(--brand-font-body)'
const sans    = 'var(--brand-font-body)'

interface Lead {
  id: string; name: string; email: string; phone: string; company: string
  source: string; category: string; summary: string; status: string; notes: string
  converted: boolean; created_at: string
}

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  new:        { text: 'var(--semantic-warning)', bg: 'color-mix(in srgb, var(--semantic-warning) 12%, transparent)' },
  contacted:  { text: 'var(--semantic-info)', bg: 'color-mix(in srgb, var(--semantic-info) 12%, transparent)' },
  qualified:  { text: 'var(--semantic-info)', bg: 'color-mix(in srgb, var(--semantic-info) 12%, transparent)' },
  converted:  { text: 'var(--semantic-success)', bg: 'color-mix(in srgb, var(--semantic-success) 12%, transparent)' },
  lost:       { text: 'var(--semantic-danger)', bg: 'color-mix(in srgb, var(--semantic-danger) 12%, transparent)' },
}

/** Raw DB values — the persisted identity. Display text comes from t.status.*. */
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']
const SOURCES  = ['manual', 'website', 'referral', 'instagram', 'facebook', 'linkedin', 'google', 'whatsapp', 'email', 'phone', 'other']

function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = STATUS_COLOR[status] ?? { text: 'var(--brand-text-secondary)', bg: 'color-mix(in srgb, var(--brand-text-secondary) 12%, transparent)' }
  return <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>{label}</span>
}

const LEAD_BLANK = { name: '', company: '', email: '', phone: '', source: 'manual', notes: '' }

export default function LeadsPage() {
  const { t, fmtDate } = useOsLocale()
  const [leads,     setLeads]     = useState<Lead[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<Lead | null>(null)
  const [tab,       setTab]       = useState('all')
  const [search,    setSearch]    = useState('')
  const [showNew,   setShowNew]   = useState(false)
  const [newForm,   setNewForm]   = useState({ ...LEAD_BLANK })
  const [creating,  setCreating]  = useState(false)
  const [createErr, setCreateErr] = useState('')

  const statusLabel = (s: string) => t.status.lead[s] ?? s
  const sourceLabel = (s: string) => t.status.leadSource[s] ?? s

  useEffect(() => {
    fetch('/api/os/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createLead() {
    if (!newForm.name.trim() && !newForm.email.trim()) {
      setCreateErr(t.leads.nameOrEmailRequired); return
    }
    setCreating(true); setCreateErr('')
    try {
      const res = await fetch('/api/os/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newForm }),
      })
      if (!res.ok) throw new Error(t.leads.createFailed)
      const lead = await res.json() as Lead
      setLeads(prev => [lead, ...prev])
      setNewForm({ ...LEAD_BLANK })
      setShowNew(false)
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : t.leads.createFailed)
    } finally { setCreating(false) }
  }

  async function deleteLead(id: string) {
    if (!confirm(t.leads.deleteConfirm)) return
    const res = await fetch(`/api/os/leads?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== id))
      if (selected?.id === id) setSelected(null)
    }
  }

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

  const inpStyle: React.CSSProperties = { width: '100%', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: '4px', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }

  const columns = [
    t.leads.colNameCompany, t.leads.colSource, t.leads.colDate, t.leads.colStatus, t.leads.colActions,
  ]

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* New Lead Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', width: '100%', maxWidth: '440px', borderRadius: '4px', padding: '28px' }}>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 20px' }}>{t.leads.newLeadModal}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([
                { label: t.leads.fieldName,    key: 'name',    type: 'text' },
                { label: t.leads.fieldCompany, key: 'company', type: 'text' },
                { label: t.leads.fieldEmail,   key: 'email',   type: 'email' },
                { label: t.leads.fieldPhone,   key: 'phone',   type: 'text' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} value={newForm[f.key]} onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))} style={inpStyle} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{t.leads.fieldSource}</label>
                <select value={newForm.source} onChange={e => setNewForm(p => ({ ...p, source: e.target.value }))} style={{ ...inpStyle, appearance: 'none' }}>
                  {SOURCES.map(s => <option key={s} value={s}>{sourceLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{t.leads.fieldNotes}</label>
                <textarea value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inpStyle, resize: 'vertical' }} />
              </div>
            </div>
            {createErr && <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', margin: '10px 0 0' }}><Icon name="warning" size="xs" /> {createErr}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={createLead} disabled={creating} style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: '4px', color: 'var(--brand-text)', fontFamily: sans, fontWeight: 700, fontSize: 'var(--text-micro)', padding: '10px 20px', cursor: creating ? 'wait' : 'pointer', opacity: creating ? 0.6 : 1 }}>
                {creating ? t.common.saving : t.leads.saveLead}
              </button>
              <button type="button" onClick={() => { setShowNew(false); setCreateErr('') }} style={{ background: 'none', border: '1px solid var(--brand-border)', borderRadius: '4px', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '10px 16px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{t.leads.heading}</h1>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.1em' }}>
            {stats.total} {t.leads.statTotal} &nbsp;·&nbsp;
            <span style={{ color: 'var(--brand-primary-text)' }}>{stats.new} {t.leads.statNew}</span> &nbsp;·&nbsp;
            <span style={{ color: 'var(--semantic-success)' }}>{stats.converted} {t.leads.statConverted}</span>
          </p>
        </div>
        <button onClick={() => { setShowNew(true); setCreateErr('') }} style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: '4px', color: 'var(--brand-text)', fontFamily: sans, fontWeight: 700, fontSize: 'var(--text-micro)', padding: '10px 18px', cursor: 'pointer' }}>
          {t.leads.newLead}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', ...STATUSES].map(key => (
            <button key={key} onClick={() => setTab(key)} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 12px', border: 'none', cursor: 'pointer', background: tab === key ? 'var(--brand-primary)' : 'transparent', color: tab === key ? 'var(--brand-text)' : 'var(--brand-text-muted)' }}>
              {key === 'all' ? t.status.filterAll : statusLabel(key)}
            </button>
          ))}
        </div>
        <input placeholder={t.common.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '7px 14px', outline: 'none', width: '220px' }} />
      </div>

      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              {columns.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)' }}>{t.common.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px 16px', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-muted)' }}>{t.leads.empty}</td></tr>
            ) : (
              filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--brand-border)', cursor: 'pointer' }} onClick={() => setSelected(lead)}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 2px' }}>{lead.name || t.common.notAvailable}</p>
                    {lead.company && <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.04em' }}>{lead.company}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--brand-border)', padding: '3px 8px' }}>
                      {lead.source ? sourceLabel(lead.source) : t.common.notAvailable}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)' }}>
                    {fmtDate(lead.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={lead.status} label={statusLabel(lead.status)} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      {lead.status !== 'contacted' && (
                        <button onClick={() => updateStatus(lead.id, 'contacted')} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-info)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                          {t.leads.actionContacted}
                        </button>
                      )}
                      {lead.status !== 'converted' && (
                        <button onClick={() => updateStatus(lead.id, 'converted')} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-success)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                          {t.leads.actionConvert}
                        </button>
                      )}
                      <button onClick={() => deleteLead(lead.id)} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}>
                        {t.leads.actionDelete}
                      </button>
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
        <div style={{ position: 'fixed', top: 0, right: 0, width: 'min(400px, 100vw)', height: '100vh', background: 'var(--brand-surface)', borderLeft: '1px solid var(--brand-border)', zIndex: 200, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brand-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.leads.leadDetails}</p>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: grotesk, fontSize: '18px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', margin: '0 0 4px' }}>{selected.name || t.leads.anonymous}</h2>
            {selected.company && <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', margin: '0 0 16px' }}>{selected.company}</p>}

            <StatusBadge status={selected.status} label={statusLabel(selected.status)} />

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: t.leads.fieldEmail,    value: selected.email },
                { label: t.leads.fieldPhone,    value: selected.phone },
                { label: t.leads.fieldSource,   value: selected.source ? sourceLabel(selected.source) : '' },
                { label: t.leads.fieldCategory, value: selected.category },
                { label: t.leads.colDate,       value: fmtDate(selected.created_at) },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 3px' }}>{f.label}</p>
                  <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {selected.summary && (
              <div style={{ marginTop: '16px', background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderLeft: '2px solid var(--brand-primary)', padding: '14px 16px' }}>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px' }}>{t.leads.aiSummary}</p>
                <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.6 }}>{selected.summary}</p>
              </div>
            )}

            {selected.notes && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 6px' }}>{t.leads.fieldNotes}</p>
                <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.6 }}>{selected.notes}</p>
              </div>
            )}

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--brand-border)', paddingTop: '20px' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.leads.updateStatus}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {STATUSES.filter(s => s !== selected.status).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: STATUS_COLOR[s]?.text ?? 'var(--brand-text-secondary)', background: STATUS_COLOR[s]?.bg ?? 'transparent', border: `1px solid ${STATUS_COLOR[s]?.text ?? 'var(--brand-text-muted)'}40`, padding: '6px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }}>
                    {statusLabel(s)}
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
