'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'
import { LEADS_COPY } from '@/lib/os-i18n/leads'
import { ownerApi } from '@/lib/commercial/ownerClient'
import { Icon, TONE_VARS, toneMap } from '@maxpromo/ui'
import { LEAD_STAGES, leadStage } from '@/lib/commercial/pipeline'

const mono    = 'var(--brand-font-mono)'
const sans    = 'var(--brand-font-body)'

interface Lead {
  id: string; name: string; email: string; phone: string; company: string
  source: string; category: string; summary: string; status: string; notes: string
  converted: boolean; created_at: string
}

/* The stage, read through the one vocabulary (lib/commercial/pipeline.ts).
   A legacy stored value — new, converted, archived — shows as its stage. */
const stageOf = (status: string) => leadStage(status) ?? status
const statusTone = (status: string) => toneMap<string>({
  discovered: 'caution', responded: 'caution', negotiation: 'info', proposal: 'info', discovery: 'info',
  contacted: 'info', qualified: 'info', outreach_prepared: 'info', won: 'positive', lost: 'critical', on_hold: 'neutral',
})(stageOf(status))

/** Persisted pipeline stages. Display text comes from t.status.lead. */
const STATUSES: readonly string[] = LEAD_STAGES
const SOURCES  = ['manual', 'website', 'referral', 'instagram', 'facebook', 'linkedin', 'google', 'whatsapp', 'email', 'phone', 'other']

function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = TONE_VARS[statusTone(status)]
  return <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: c.text, background: c.bg, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 'var(--radius-xs)' }}>{label}</span>
}

const LEAD_BLANK = { name: '', company: '', email: '', phone: '', website: '', city: '', source: 'manual', notes: '' }
const leadsApi = ownerApi('/api/os/leads/actions')

export default function LeadsPage() {
  const { t, fmtDate, locale } = useOsLocale()
  const lc = LEADS_COPY[locale]
  const router = useRouter()
  const [leads,     setLeads]     = useState<Lead[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('all')
  const [search,    setSearch]    = useState('')
  const [showNew,   setShowNew]   = useState(false)
  const [newForm,   setNewForm]   = useState({ ...LEAD_BLANK })
  const [creating,  setCreating]  = useState(false)
  const [createErr, setCreateErr] = useState('')
  const [matches,   setMatches]   = useState<{ id: string; kind: string; label: string; basis: string }[]>([])
  const [closing,   setClosing]   = useState<string | null>(null)
  const [rowErr,    setRowErr]    = useState<{ id: string; text: string } | null>(null)

  const statusLabel = (s: string) => t.status.lead[stageOf(s)] ?? s
  const sourceLabel = (s: string) => t.status.leadSource[s] ?? s

  useEffect(() => {
    fetch('/api/os/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* Through lead.create (ADR-0027): it refuses a duplicate of an existing lead or client and says
     which one, records who saved it, and starts the lead at Discovered. A website lets research run. */
  async function createLead(distinct: string[] = []) {
    if (!newForm.company.trim() && !newForm.name.trim()) {
      setCreateErr(t.leads.nameOrEmailRequired); return
    }
    setCreating(true); setCreateErr(''); setMatches([])
    try {
      const pick = (v: string) => (v.trim() ? v.trim() : undefined)
      const r = await leadsApi.run('lead.create', {
        company: newForm.company.trim() || newForm.name.trim(), name: pick(newForm.name), email: pick(newForm.email), phone: pick(newForm.phone),
        website: pick(newForm.website), city: pick(newForm.city), source: newForm.source, summary: pick(newForm.notes),
        ...(distinct.length ? { confirmed_distinct_from: distinct } : {}),
      })
      const data = r.status === 'done' ? r.result?.data as { created?: boolean; lead_id?: string; matches?: { id: string; kind: string; label: string; basis: string }[] } | undefined : undefined
      /* A duplicate names what it matched and lets Marcel open it, or say it is a different business. */
      if (data && !data.created && data.matches?.length) { setMatches(data.matches); return }
      if (!data?.created || !data.lead_id) { setCreateErr(r.result?.summary ?? r.message ?? t.leads.createFailed); return }
      router.push(`/os/leads/${data.lead_id}`)
    } catch {
      setCreateErr(t.leads.createFailed)
    } finally { setCreating(false) }
  }

  /* Quick stage changes go through lead.update like the lead screen (risk 145): audited, on the
     lead's timeline. A lead is never deleted from here — "not interested" closes it as lost and keeps
     its history; won comes only from an accepted Angebot. */
  async function setStage(id: string, stage: 'contacted' | 'lost') {
    setRowErr(null)
    try {
      const r = await leadsApi.run('lead.update', { lead_id: id, stage, ...(stage === 'lost' ? { lost_reason: lc.listClosed } : {}) })
      if (r.status !== 'done') { setRowErr({ id, text: r.result?.summary ?? r.message ?? lc.listFailed }); return }
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: stage } : l))
    } catch {
      setRowErr({ id, text: lc.listFailed })
    } finally { setClosing(null) }
  }

  const filtered = leads
    .filter(l => tab === 'all' || stageOf(l.status) === tab)
    .filter(l => search === '' || `${l.name} ${l.company} ${l.email} ${l.source}`.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total: leads.length,
    new: leads.filter(l => stageOf(l.status) === 'discovered').length,
    converted: leads.filter(l => l.converted).length,
  }

  const inpStyle: React.CSSProperties = { width: '100%', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }

  const columns = [
    t.leads.colNameCompany, t.leads.colSource, t.leads.colDate, t.leads.colStatus, t.leads.colActions,
  ]

  return (
    <div className="leads-page" style={{ padding: '32px 40px' }}>
      {/* New Lead Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'var(--space-5) var(--space-4)', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <div role="dialog" aria-modal="true" style={{ background: 'var(--brand-surface-subtle)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)', width: '100%', maxWidth: '440px', borderRadius: 'var(--radius-sm)', padding: '28px', margin: 'auto 0' }}>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 20px' }}>{t.leads.newLeadModal}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {([
                { label: t.leads.fieldName,    key: 'name',    type: 'text' },
                { label: t.leads.fieldCompany, key: 'company', type: 'text' },
                { label: t.leads.fieldEmail,   key: 'email',   type: 'email' },
                { label: t.leads.fieldPhone,   key: 'phone',   type: 'text' },
                { label: lc.website,           key: 'website', type: 'url' },
                { label: lc.city,              key: 'city',    type: 'text' },
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
            {matches.length > 0 && (
              <div role="alert" style={{ marginTop: '12px', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--semantic-danger)' }}>{lc.dupIntro}</p>
                <ul style={{ margin: '0 0 8px', paddingLeft: '18px' }}>
                  {matches.map(m => (
                    <li key={m.id} style={{ marginBottom: '4px' }}>
                      {m.kind === 'lead' ? <a href={`/os/leads/${m.id}`} style={{ color: 'var(--brand-text)' }}>{m.label}</a> : m.label}
                      <span style={{ color: 'var(--brand-text-muted)' }}> · {lc.dupKind[m.kind] ?? m.kind} · {m.basis.split(/[ ,+]+/).map(b => lc.dupBasis[b] ?? b).join(', ')}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn-secondary btn-sm" disabled={creating} onClick={() => createLead(matches.map(m => m.id))}>{lc.dupSaveAnyway}</button>
              </div>
            )}
            {createErr && <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', margin: '10px 0 0' }}><Icon name="warning" size="xs" /> {createErr}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => createLead()} disabled={creating} style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontWeight: 700, fontSize: 'var(--text-micro)', padding: '10px 20px', cursor: creating ? 'wait' : 'pointer', opacity: creating ? 0.6 : 1 }}>
                {creating ? t.common.saving : t.leads.saveLead}
              </button>
              <button type="button" onClick={() => { setShowNew(false); setCreateErr(''); setMatches([]) }} style={{ background: 'none', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '10px 16px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', letterSpacing: '-0.02em', margin: '0 0 var(--space-1)' }}>{t.leads.heading}</h1>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.1em' }}>
            {stats.total} {t.leads.statTotal} &nbsp;·&nbsp;
            <span style={{ color: 'var(--brand-primary-text)' }}>{stats.new} {t.leads.statNew}</span> &nbsp;·&nbsp;
            <span style={{ color: 'var(--semantic-success)' }}>{stats.converted} {t.leads.statConverted}</span>
          </p>
          <Link href="/os/leads/calibration" className="money-more">{lc.calibrationLink} ›</Link>
        </div>
        <button onClick={() => { setShowNew(true); setCreateErr('') }} style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontWeight: 700, fontSize: 'var(--text-micro)', padding: '10px 18px', cursor: 'pointer' }}>
          {t.leads.newLead}
        </button>
      </div>

      {/* Filters */}
      <div className="leads-filters" style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="leads-tabs" style={{ display: 'flex', gap: 'var(--space-1)' }}>
          {['all', ...STATUSES].map(key => (
            <button key={key} onClick={() => setTab(key)} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 12px', border: 'none', cursor: 'pointer', background: tab === key ? 'var(--brand-primary)' : 'transparent', color: tab === key ? 'var(--brand-text)' : 'var(--brand-text-muted)' }}>
              {key === 'all' ? t.status.filterAll : statusLabel(key)}
            </button>
          ))}
        </div>
        <input placeholder={t.common.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '7px 14px', outline: 'none', width: '220px' }} />
      </div>

      <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', overflowX: 'auto' }}>
        <ul className="leads-cards">
          {loading ? <li className="leads-card-meta" style={{ padding: 'var(--space-4)' }}>{t.common.loading}</li>
            : filtered.length === 0 ? <li className="leads-card-meta" style={{ padding: 'var(--space-4)' }}>{t.leads.empty}</li>
            : filtered.map(lead => (
              <li key={lead.id}>
                <button type="button" className="leads-card" onClick={() => router.push(`/os/leads/${lead.id}`)}>
                  <span className="leads-card-main">
                    <p className="leads-card-title">{lead.company || lead.name || t.common.notAvailable}</p>
                    <p className="leads-card-meta">{[lead.company && lead.name ? lead.name : '', lead.source ? sourceLabel(lead.source) : '', fmtDate(lead.created_at)].filter(Boolean).join(' · ')}</p>
                  </span>
                  <StatusBadge status={lead.status} label={statusLabel(lead.status)} />
                </button>
              </li>
            ))}
        </ul>
        <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              {columns.map(h => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 'var(--space-5) var(--space-4)', fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)' }}>{t.common.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 'var(--space-5) var(--space-4)', fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-muted)' }}>{t.leads.empty}</td></tr>
            ) : (
              filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--brand-border)', cursor: 'pointer' }} onClick={() => router.push(`/os/leads/${lead.id}`)}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 2px' }}>{lead.name || lead.company || t.common.notAvailable}</p>
                    {lead.company && lead.name && <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.04em' }}>{lead.company}</p>}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--brand-border)', padding: '3px 8px' }}>
                      {lead.source ? sourceLabel(lead.source) : t.common.notAvailable}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)' }}>
                    {fmtDate(lead.created_at)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={lead.status} label={statusLabel(lead.status)} /></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      {!['contacted', 'won', 'lost'].includes(stageOf(lead.status)) && (
                        <button onClick={() => setStage(lead.id, 'contacted')} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-info)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', margin: '-6px -2px', letterSpacing: '0.04em' }}>
                          {t.leads.actionContacted}
                        </button>
                      )}
                      {!['won', 'lost'].includes(stageOf(lead.status)) && (
                        <button onClick={() => closing === lead.id ? setStage(lead.id, 'lost') : setClosing(lead.id)} style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: closing === lead.id ? 'var(--semantic-danger)' : 'var(--brand-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', margin: '-6px -2px', letterSpacing: '0.04em' }}>
                          {closing === lead.id ? lc.listCloseConfirm : lc.listClose}
                        </button>
                      )}
                    </div>
                    {rowErr?.id === lead.id && <p role="alert" style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--semantic-danger)', margin: '6px 0 0' }}>{rowErr.text}</p>}
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
