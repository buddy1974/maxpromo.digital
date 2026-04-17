'use client'
import { useEffect, useState } from 'react'

const mono    = 'var(--font-space-mono)'
const grotesk = 'var(--font-space-grotesk)'
const sans    = 'var(--font-dm-sans)'

const STAGES = ['lead', 'discovery', 'proposal', 'in progress', 'review', 'completed', 'invoiced'] as const
type Stage = typeof STAGES[number]

interface Job {
  id: string; title: string; client_name: string; stage: Stage; priority: string
  value: number | null; due_date: string | null; notes: string; description: string
}

const PRIORITY_COLOR: Record<string, string> = { high: '#ef4444', medium: '#F97316', low: '#555' }
const STAGE_LABEL: Record<Stage, string> = {
  'lead': 'LEAD', 'discovery': 'DISCOVERY', 'proposal': 'PROPOSAL',
  'in progress': 'IN PROGRESS', 'review': 'REVIEW', 'completed': 'COMPLETED', 'invoiced': 'INVOICED',
}

function fmtEur(n: number) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) }

interface NewJobForm { title: string; client_name: string; stage: Stage; priority: string; value: string; notes: string }
const BLANK_FORM: NewJobForm = { title: '', client_name: '', stage: 'lead', priority: 'medium', value: '', notes: '' }

export default function JobsPage() {
  const [jobs,       setJobs]       = useState<Job[]>([])
  const [loading,    setLoading]    = useState(true)
  const [dragId,     setDragId]     = useState<string | null>(null)
  const [selected,   setSelected]   = useState<Job | null>(null)
  const [showNew,    setShowNew]    = useState(false)
  const [form,       setForm]       = useState<NewJobForm>({ ...BLANK_FORM })
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    fetch('/api/os/jobs')
      .then(r => r.json())
      .then(d => { setJobs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function moveJob(id: string, stage: Stage) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, stage } : j))
    await fetch('/api/os/jobs', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    }).catch(console.error)
  }

  async function createJob() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/os/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, value: form.value ? Number(form.value) : undefined }),
      })
      const job = await res.json() as Job
      setJobs(prev => [job, ...prev])
      setForm({ ...BLANK_FORM })
      setShowNew(false)
    } finally { setSaving(false) }
  }

  const jobsByStage = (stage: Stage) => jobs.filter(j => j.stage === stage)

  return (
    <div style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: grotesk, fontSize: '24px', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Jobs / Kanban</h1>
          <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.1em' }}>{jobs.length} TOTAL</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}>
          + New Job
        </button>
      </div>

      {/* New job modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderTop: '2px solid #F97316', padding: '28px', width: '440px' }}>
            <p style={{ fontFamily: mono, fontSize: '10px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 20px' }}>New Job</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Title *', key: 'title', type: 'text' },
                { label: 'Client Name', key: 'client_name', type: 'text' },
                { label: 'Value (€)', key: 'value', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof NewJobForm]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Stage</label>
                  <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))} style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '8px 12px', outline: 'none', appearance: 'none' }}>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '8px 12px', outline: 'none', appearance: 'none' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontFamily: sans, fontSize: '13px', padding: '8px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={createJob} disabled={saving || !form.title.trim()} style={{ background: '#F97316', border: 'none', color: '#000', fontFamily: mono, fontWeight: 700, fontSize: '11px', padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Create Job'}
              </button>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontFamily: mono, fontSize: '11px', padding: '10px 16px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <p style={{ fontFamily: mono, fontSize: '11px', color: '#333' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '16px' }}>
          {STAGES.map(stage => (
            <div
              key={stage}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragId) { moveJob(dragId, stage); setDragId(null) } }}
              style={{ minWidth: '200px', flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {/* Column header */}
              <div style={{ background: '#111', borderTop: '2px solid #F97316', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', flexShrink: 0 }}>
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 2px' }}>{STAGE_LABEL[stage]}</p>
                <p style={{ fontFamily: mono, fontSize: '11px', color: '#F97316', margin: 0 }}>{jobsByStage(stage).length}</p>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {jobsByStage(stage).map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => setDragId(job.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(job)}
                    style={{
                      background: dragId === job.id ? 'rgba(249,115,22,0.1)' : '#0D0D0D',
                      border: `1px solid ${dragId === job.id ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderLeft: `3px solid ${PRIORITY_COLOR[job.priority] ?? '#555'}`,
                      padding: '12px',
                      cursor: 'grab',
                      userSelect: 'none',
                    }}
                  >
                    <p style={{ fontFamily: sans, fontSize: '12px', color: '#FFF', margin: '0 0 4px', fontWeight: 600, lineHeight: 1.4 }}>{job.title}</p>
                    {job.client_name && <p style={{ fontFamily: mono, fontSize: '10px', color: '#555', margin: '0 0 6px', letterSpacing: '0.04em' }}>{job.client_name}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {job.value && <span style={{ fontFamily: mono, fontSize: '10px', color: '#888' }}>{fmtEur(Number(job.value))}</span>}
                      <span style={{ fontFamily: mono, fontSize: '9px', color: PRIORITY_COLOR[job.priority] ?? '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{job.priority}</span>
                    </div>
                    {job.due_date && <p style={{ fontFamily: mono, fontSize: '9px', color: '#444', margin: '4px 0 0', letterSpacing: '0.06em' }}>{new Date(job.due_date).toLocaleDateString('de-DE')}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job detail slide-out */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '360px', height: '100vh', background: '#0D0D0D', borderLeft: '1px solid rgba(255,255,255,0.07)', zIndex: 200, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: mono, fontSize: '9px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Job Details</p>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: grotesk, fontSize: '18px', fontWeight: 700, color: '#FFF', margin: '0 0 6px' }}>{selected.title}</h2>
            {selected.client_name && <p style={{ fontFamily: mono, fontSize: '11px', color: '#555', margin: '0 0 16px', letterSpacing: '0.06em' }}>{selected.client_name}</p>}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: mono, fontSize: '9px', color: '#F97316', background: 'rgba(249,115,22,0.1)', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selected.stage}</span>
              <span style={{ fontFamily: mono, fontSize: '9px', color: PRIORITY_COLOR[selected.priority], background: PRIORITY_COLOR[selected.priority] + '20', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selected.priority}</span>
              {selected.value && <span style={{ fontFamily: mono, fontSize: '9px', color: '#888', padding: '4px 10px', background: '#11111130', letterSpacing: '0.06em' }}>{fmtEur(Number(selected.value))}</span>}
            </div>

            {selected.description && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px' }}>Description</p>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#888', margin: 0, lineHeight: 1.6 }}>{selected.description}</p>
              </div>
            )}

            {selected.notes && (
              <div>
                <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px' }}>Notes</p>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#888', margin: 0, lineHeight: 1.6 }}>{selected.notes}</p>
              </div>
            )}

            {/* Move stage buttons */}
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px' }}>
              <p style={{ fontFamily: mono, fontSize: '9px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>Move to stage</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {STAGES.filter(s => s !== selected.stage).map(s => (
                  <button key={s} onClick={() => { moveJob(selected.id, s); setSelected(prev => prev ? { ...prev, stage: s } : null) }}
                    style={{ fontFamily: mono, fontSize: '9px', color: '#888', background: '#111', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {STAGE_LABEL[s]}
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
