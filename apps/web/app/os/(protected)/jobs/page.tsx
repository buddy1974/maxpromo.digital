'use client'
import { useEffect, useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'
import { Icon, TONE_VARS, toneMap } from '@maxpromo/ui'

const mono    = 'var(--brand-font-mono)'
const sans    = 'var(--brand-font-body)'

/** Raw DB stage values — the persisted identity. Display text comes from t.status.jobStage. */
const STAGES = ['lead', 'discovery', 'proposal', 'in progress', 'review', 'completed', 'invoiced'] as const
type Stage = typeof STAGES[number]

const PRIORITIES = ['low', 'medium', 'high'] as const

interface Job {
  id: string; title: string; client_name: string; stage: Stage; priority: string
  value: number | null; due_date: string | null; notes: string; description: string
}

const priorityTone = toneMap<string>({ high: 'critical', medium: 'caution', low: 'neutral' })

interface NewJobForm { title: string; client_name: string; stage: Stage; priority: string; value: string; notes: string }
const BLANK_FORM: NewJobForm = { title: '', client_name: '', stage: 'lead', priority: 'medium', value: '', notes: '' }

export default function JobsPage() {
  const { t, intlLocale, fmtDate } = useOsLocale()
  const [jobs,       setJobs]       = useState<Job[]>([])
  const [loading,    setLoading]    = useState(true)
  const [dragId,     setDragId]     = useState<string | null>(null)
  const [selected,   setSelected]   = useState<Job | null>(null)
  const [showNew,    setShowNew]    = useState(false)
  const [form,       setForm]       = useState<NewJobForm>({ ...BLANK_FORM })
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')

  const fmtEur = (n: number) =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const stageLabel    = (s: string) => t.status.jobStage[s] ?? s
  const priorityLabel = (p: string) => t.status.priority[p] ?? p

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
    setSaveError('')
    try {
      const res = await fetch('/api/os/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, value: form.value ? Number(form.value) : undefined }),
      })
      if (!res.ok) throw new Error(t.jobs.serverError(res.status))
      const job = await res.json() as Job
      setJobs(prev => [job, ...prev])
      setForm({ ...BLANK_FORM })
      setShowNew(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.jobs.saveError)
    } finally { setSaving(false) }
  }

  const jobsByStage = (stage: Stage) => jobs.filter(j => j.stage === stage)

  return (
    <div style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', letterSpacing: '-0.02em', margin: '0 0 var(--space-1)' }}>{t.jobs.heading}</h1>
          <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 0, letterSpacing: '0.1em' }}>{jobs.length} {t.common.total}</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ background: 'var(--brand-primary)', border: 'none', color: 'var(--brand-text)', fontFamily: mono, fontWeight: 700, fontSize: 'var(--text-label)', letterSpacing: '0.1em', padding: '10px 18px', cursor: 'pointer', textTransform: 'uppercase' }}>
          {t.jobs.newJob}
        </button>
      </div>

      {/* New job modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--brand-text) 45%, transparent)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}>
          <div style={{ background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', borderTop: '2px solid var(--brand-primary)', borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: '440px', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--brand-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.jobs.newJobModal}</p>
              <button onClick={() => { setShowNew(false); setSaveError('') }} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Body — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {([
                  { label: t.jobs.fieldTitle,      key: 'title',       type: 'text' },
                  { label: t.jobs.fieldClientName, key: 'client_name', type: 'text' },
                  { label: t.jobs.fieldValue,      key: 'value',       type: 'number' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width: '100%', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{t.jobs.fieldStage}</label>
                    <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))} style={{ width: '100%', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', appearance: 'none' }}>
                      {STAGES.map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{t.jobs.fieldPriority}</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', appearance: 'none' }}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>{t.jobs.fieldNotes}</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ width: '100%', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '9px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Footer — always visible */}
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--brand-border)', background: 'var(--brand-surface-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={createJob} disabled={saving || !form.title.trim()} style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontWeight: 700, fontSize: 'var(--text-micro)', padding: '10px 24px', cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
                  {saving ? t.common.saving : t.jobs.createJob}
                </button>
                <button type="button" onClick={() => { setShowNew(false); setSaveError('') }} style={{ background: 'none', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-text)', fontFamily: sans, fontSize: 'var(--text-micro)', padding: '10px 16px', cursor: 'pointer' }}>
                  {t.common.cancel}
                </button>
              </div>
              {saveError && <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--semantic-danger)', margin: '10px 0 0', letterSpacing: '0.04em' }}><Icon name="warning" size="xs" /> {saveError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-secondary)' }}>{t.common.loading}</p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 'var(--space-4)' }}>
          {STAGES.map(stage => (
            <div
              key={stage}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragId) { moveJob(dragId, stage); setDragId(null) } }}
              style={{ minWidth: '200px', flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            >
              {/* Column header */}
              <div style={{ background: 'var(--brand-surface-subtle)', borderTop: '2px solid var(--brand-primary)', border: '1px solid var(--brand-border)', padding: '10px 12px', flexShrink: 0 }}>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 2px' }}>{stageLabel(stage)}</p>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-primary-text)', margin: 0 }}>{jobsByStage(stage).length}</p>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflowY: 'auto', flex: 1 }}>
                {jobsByStage(stage).map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => setDragId(job.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(job)}
                    style={{
                      background: dragId === job.id ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' : 'var(--brand-surface)',
                      border: `1px solid ${dragId === job.id ? 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' : 'var(--brand-border)'}`,
                      borderLeft: `3px solid ${TONE_VARS[priorityTone(job.priority)].text}`,
                      padding: 'var(--space-3)',
                      cursor: 'grab',
                      userSelect: 'none',
                    }}
                  >
                    <p style={{ fontFamily: sans, fontSize: '12px', color: 'var(--brand-text)', margin: '0 0 var(--space-1)', fontWeight: 600, lineHeight: 1.4 }}>{job.title}</p>
                    {job.client_name && <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: '0 0 6px', letterSpacing: '0.04em' }}>{job.client_name}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {job.value && <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)' }}>{fmtEur(Number(job.value))}</span>}
                      <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: TONE_VARS[priorityTone(job.priority)].text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{priorityLabel(job.priority)}</span>
                    </div>
                    {job.due_date && <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', margin: 'var(--space-1) 0 0', letterSpacing: '0.06em' }}>{fmtDate(job.due_date)}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job detail slide-out */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '360px', height: '100vh', background: 'var(--brand-surface)', borderLeft: '1px solid var(--brand-border)', zIndex: 200, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--brand-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{t.jobs.jobDetails}</p>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontFamily: sans, fontSize: '18px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', margin: '0 0 6px' }}>{selected.title}</h2>
            {selected.client_name && <p style={{ fontFamily: mono, fontSize: 'var(--text-label)', color: 'var(--brand-text-muted)', margin: '0 0 var(--space-4)', letterSpacing: '0.06em' }}>{selected.client_name}</p>}

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-primary-text)', background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stageLabel(selected.stage)}</span>
              <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: TONE_VARS[priorityTone(selected.priority)].text, background: TONE_VARS[priorityTone(selected.priority)].bg, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{priorityLabel(selected.priority)}</span>
              {selected.value && <span style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', padding: '4px 10px', background: 'var(--brand-surface-subtle)', letterSpacing: '0.06em' }}>{fmtEur(Number(selected.value))}</span>}
            </div>

            {selected.description && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 var(--space-2)' }}>{t.jobs.description}</p>
                <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.6 }}>{selected.description}</p>
              </div>
            )}

            {selected.notes && (
              <div>
                <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 var(--space-2)' }}>{t.jobs.notes}</p>
                <p style={{ fontFamily: sans, fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', margin: 0, lineHeight: 1.6 }}>{selected.notes}</p>
              </div>
            )}

            {/* Move stage buttons */}
            <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--brand-border)', paddingTop: '20px' }}>
              <p style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.jobs.moveToStage}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {STAGES.filter(s => s !== selected.stage).map(s => (
                  <button key={s} onClick={() => { moveJob(selected.id, s); setSelected(prev => prev ? { ...prev, stage: s } : null) }}
                    style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', background: 'var(--brand-surface-subtle)', border: '1px solid var(--brand-border)', padding: '6px 10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {stageLabel(s)}
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
