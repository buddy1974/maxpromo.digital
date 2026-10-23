'use client'
/**
 * /os/approvals — where Marcel decides prepared business actions (ADR-0021).
 *
 * An agent (or Marcel's own Inbox draft) prepares an action; the OS holds it,
 * bound to the exact payload. Approving executes exactly what is shown, once,
 * through the same engine every interface uses. Two-step buttons instead of a
 * browser dialog: the second press is the decision.
 */
import { useCallback, useEffect, useState } from 'react'
import { TONE_VARS } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'

const mono = 'var(--brand-font-mono)'
const sans = 'var(--brand-font-body)'

interface Approval {
  id: string; capability: string; summary: string; preview: Record<string, string> | null; payload_hash: string
  status: string; requested_by: string; decided_by: string | null; created_at: string; expires_at: string; decided_at: string | null
}

export default function ApprovalsPage() {
  const { t, intlLocale } = useOsLocale()
  const p = t.approvalsPage
  const [rows, setRows] = useState<Approval[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [arming, setArming] = useState<{ id: string; action: 'execute' | 'reject' } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, string>>({})
  const [last, setLast] = useState<{ summary: string; text: string } | null>(null)

  const load = useCallback(() => {
    fetch('/api/os/approvals', { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); setRows(((await r.json()) as { approvals: Approval[] }).approvals); setFailed(false) })
      .catch(() => setFailed(true))
  }, [])
  useEffect(() => { load() }, [load])

  async function decide(a: Approval, action: 'execute' | 'reject') {
    setBusy(a.id); setArming(null)
    try {
      const r = await fetch('/api/os/approvals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'execute' ? { action, approvalId: a.id, payloadHash: a.payload_hash } : { action, approvalId: a.id }),
      })
      const body = await r.json().catch(() => ({})) as { status?: string; message?: string; result?: { summary?: string }; error?: string }
      const text = body.result?.summary ?? body.message ?? body.error ?? (r.ok ? p.done : t.common.actionFailed)
      setResult((m) => ({ ...m, [a.id]: text }))
      /* The card leaves the pending list once decided; the outcome stays visible here. */
      setLast({ summary: a.summary, text })
    } finally {
      setBusy(null)
      load()
    }
  }

  const when = (iso: string) => new Date(iso).toLocaleString(intlLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const pending = (rows ?? []).filter((r) => r.status === 'pending')
  const decided = (rows ?? []).filter((r) => r.status !== 'pending')
  const label = { fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1000px' }}>
      <h1 style={{ fontFamily: sans, fontSize: '28px', fontWeight: 'var(--weight-heading)', color: 'var(--brand-text)', margin: '0 0 8px' }}>{p.title}</h1>
      <p style={{ fontFamily: sans, color: 'var(--brand-text-secondary)', margin: '0 0 28px', maxWidth: '640px' }}>{p.subtitle}</p>

      {last && (
        <p role="status" style={{ fontFamily: sans, fontSize: '14px', border: '1px solid var(--brand-border)', background: 'var(--brand-surface-subtle)', padding: '12px 16px', margin: '0 0 24px', overflowWrap: 'anywhere' }}>
          <strong>{last.summary}</strong> — {last.text}
        </p>
      )}
      {failed && <p role="alert">{p.error}</p>}
      {!rows && !failed && <p role="status">{p.loading}</p>}

      {rows && (
        <>
          <h2 style={{ ...label, margin: '0 0 12px' }}>{p.pending}</h2>
          {pending.length === 0 && <p style={{ fontFamily: sans, color: 'var(--brand-text-secondary)' }}>{p.none}</p>}
          <div style={{ display: 'grid', gap: '14px' }}>
            {pending.map((a) => (
              <article key={a.id} style={{ border: '1px solid var(--brand-border)', background: 'var(--brand-surface-subtle)', padding: '18px 20px' }}>
                <h3 style={{ fontFamily: sans, fontSize: '16px', fontWeight: 600, margin: '0 0 6px', overflowWrap: 'anywhere' }}>{a.summary}</h3>
                <p style={{ ...label, letterSpacing: '0.08em', margin: '0 0 12px' }}>
                  {a.capability} · {p.requestedBy} {a.requested_by} · {p.expires} {when(a.expires_at)}
                </p>
                {a.preview && (
                  <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, max-content) 1fr', gap: '4px 14px', margin: '0 0 14px', fontSize: '13px' }}>
                    {Object.entries(a.preview).map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}>
                        <dt style={{ fontFamily: mono, color: 'var(--brand-text-muted)' }}>{k}</dt>
                        <dd style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--brand-text)' }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {result[a.id] && <p role="status" style={{ fontFamily: sans, fontSize: '13px', margin: '0 0 10px' }}>{result[a.id]}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {arming?.id === a.id ? (
                    <>
                      <button type="button" className="btn-primary btn-sm" disabled={busy === a.id} onClick={() => void decide(a, arming.action)}>
                        {busy === a.id ? p.working : arming.action === 'execute' ? p.confirmApprove : p.confirmReject}
                      </button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setArming(null)}>{p.cancel}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn-primary btn-sm" disabled={busy !== null} onClick={() => setArming({ id: a.id, action: 'execute' })}>{p.approve}</button>
                      <button type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => setArming({ id: a.id, action: 'reject' })}>{p.reject}</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          {decided.length > 0 && <h2 style={{ ...label, margin: '32px 0 12px' }}>{p.recent}</h2>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
            {decided.map((a) => (
              <li key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'baseline', minWidth: 0, fontSize: '13px' }}>
                <span style={{ fontFamily: mono, minWidth: '86px', color: TONE_VARS[a.status === 'executed' ? 'positive' : a.status === 'failed' ? 'critical' : 'neutral'].text }}>{p.status[a.status] ?? a.status}</span>
                <span style={{ fontFamily: sans, flex: 1, overflowWrap: 'anywhere' }}>{a.summary}</span>
                <span style={{ fontFamily: mono, color: 'var(--brand-text-muted)' }}>{when(a.decided_at ?? a.created_at)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
