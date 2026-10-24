'use client'
/**
 * /os/approvals — where Marcel decides prepared business actions (ADR-0021).
 *
 * An agent (or Marcel's own Inbox draft) prepares an action; the OS holds it,
 * bound to the exact payload. Approving executes exactly what is shown, once,
 * through the same engine every interface uses. Two-step buttons instead of a
 * browser dialog: the second press is the decision, and for anything that
 * reaches a customer or books money it names that consequence.
 *
 * Each card answers: what is proposed (summary), who proposed it, what kind of
 * impact it has, and what will happen (the preview rows) — readable on a phone.
 */
import { useCallback, useEffect, useState } from 'react'
import { TONE_VARS } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'

interface Approval {
  id: string; capability: string; summary: string; preview: Record<string, string> | null; payload_hash: string
  status: string; requested_by: string; decided_by: string | null; created_at: string; expires_at: string; decided_at: string | null
}

/** The consequence class of a capability: what deserves a stronger confirmation. */
const OUTBOUND = new Set(['email.deliver', 'email.send', 'invoice.send', 'proposal.send', 'reminder.send', 'outreach.send'])
const MONEY = new Set(['payment.refund', 'payment.record', 'invoice.cancel', 'payout.reconcile', 'money.resolve'])
/** Stored previews come back from jsonb in key order; the action always reads first. */
const ordered = (preview: Record<string, string>) => Object.entries(preview).sort(([a], [b]) => Number(/^(ACTION|AKTION)$/.test(b)) - Number(/^(ACTION|AKTION)$/.test(a)))
const impactOf = (capability: string): 'outbound' | 'money' | 'data' => (OUTBOUND.has(capability) ? 'outbound' : MONEY.has(capability) ? 'money' : 'data')

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
      window.dispatchEvent(new Event('os:changed'))
    }
  }

  const when = (iso: string) => new Date(iso).toLocaleString(intlLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const who = (requestedBy: string) => (requestedBy.startsWith('os:') ? p.you : requestedBy.replace(/^agent:/, 'Agent ').replace(/^telegram:.*/, 'Telegram'))
  const pending = (rows ?? []).filter((r) => r.status === 'pending')
  const decided = (rows ?? []).filter((r) => r.status !== 'pending')

  return (
    <div className="os-page approvals-page">
      <header className="approvals-head">
        <h1>{p.title}</h1>
        <p>{p.subtitle}</p>
      </header>

      {last && <p role="status" className="approvals-last"><strong>{last.summary}</strong> — {last.text}</p>}
      {failed && <p role="alert">{p.error}</p>}
      {!rows && !failed && <p role="status">{p.loading}</p>}

      {rows && (
        <>
          <h2 className="approvals-label">{p.pending}</h2>
          {pending.length === 0 && <p className="approvals-quiet">{p.none}</p>}
          <div className="approvals-list">
            {pending.map((a) => {
              const impact = impactOf(a.capability)
              const confirmLabel = impact === 'outbound' ? p.confirmOutbound : impact === 'money' ? p.confirmMoney : p.confirmApprove
              return (
                <article key={a.id} className={`approval-card approval-${impact}`}>
                  <p className="approval-impact">{p.impact[impact]}</p>
                  <h3 className="approval-title">{a.summary}</h3>
                  <p className="approval-meta">{p.proposedBy} {who(a.requested_by)} · {p.expires} {when(a.expires_at)}</p>
                  {a.preview && Object.keys(a.preview).length > 0 && (
                    <>
                      <p className="approvals-label">{p.whatHappens}</p>
                      <dl className="approval-preview">
                        {ordered(a.preview).map(([k, v]) => (
                          <div key={k} style={{ display: 'contents' }}>
                            <dt>{k}</dt>
                            <dd style={{ whiteSpace: 'pre-wrap' }}>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                  {result[a.id] && <p role="status" className="approval-result">{result[a.id]}</p>}
                  <div className="approval-actions">
                    {arming?.id === a.id ? (
                      <>
                        <button type="button" className="btn-primary btn-sm" disabled={busy === a.id} onClick={() => void decide(a, arming.action)}>
                          {busy === a.id ? p.working : arming.action === 'execute' ? confirmLabel : p.confirmReject}
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
              )
            })}
          </div>

          {decided.length > 0 && <h2 className="approvals-label approvals-recent">{p.recent}</h2>}
          <ul className="approvals-history">
            {decided.map((a) => (
              <li key={a.id}>
                <span className="approvals-history-summary">{a.summary}</span>
                <span className="approvals-history-meta">
                  <span style={{ color: TONE_VARS[a.status === 'executed' ? 'positive' : a.status === 'failed' ? 'critical' : 'neutral'].text }}>{p.status[a.status] ?? a.status}</span>
                  {' · '}{when(a.decided_at ?? a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
