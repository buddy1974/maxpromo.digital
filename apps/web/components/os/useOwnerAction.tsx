'use client'
/**
 * One owner action on an OS screen: run the capability; when it prepares an approval, show exactly
 * what will happen (the preview rows) and act only on Marcel's confirmation. Shared by the Money
 * and Lead screens — one implementation of "confirm what leaves the system".
 */
import { useState } from 'react'
import { failure, ownerApi, type EngineResult } from '@/lib/commercial/ownerClient'

export interface OwnerActionCopy { done: string; failed: string; confirm: string; cancel: string }

export function useOwnerAction(endpoint: Parameters<typeof ownerApi>[0], copy: OwnerActionCopy, onDone: (r: EngineResult) => void) {
  const api = ownerApi(endpoint)
  const [pending, setPending] = useState<NonNullable<EngineResult['approval']> | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function settle(r: EngineResult, doneText?: string) {
    if (r.status === 'approval_required' && r.approval) { setPending(r.approval); return r }
    setPending(null)
    if (r.status === 'done') { setMessage({ tone: 'ok', text: doneText ?? r.result?.summary ?? copy.done }); onDone(r) }
    else setMessage({ tone: 'error', text: failure(r) || copy.failed })
    return r
  }
  async function run(capability: string, input: Record<string, unknown>, doneText?: string): Promise<EngineResult | null> {
    setBusy(true); setMessage(null)
    try { return await settle(await api.run(capability, input), doneText) } catch { setMessage({ tone: 'error', text: copy.failed }); return null } finally { setBusy(false) }
  }
  async function confirm() {
    if (!pending) return
    setBusy(true)
    try { await settle(await api.execute(pending.id, pending.payloadHash)) } finally { setBusy(false) }
  }
  async function cancel() {
    if (pending) await api.reject(pending.id).catch(() => undefined)
    setPending(null)
  }
  /** Show an approval that already exists (e.g. prepared before the page was opened). */
  const show = (approval: NonNullable<EngineResult['approval']>) => setPending(approval)

  const panel = (
    <>
      {pending && (
        <div role="dialog" aria-label={pending.summary} style={{ border: '1px solid var(--brand-border-strong)', background: 'var(--brand-surface)', padding: 'var(--space-4)', margin: 'var(--space-3) 0' }}>
          <p style={{ fontWeight: 700, margin: '0 0 var(--space-2)' }}>{pending.summary}</p>
          <dl className="approval-preview">
            {Object.entries(pending.preview).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={confirm} style={{ minHeight: '44px' }}>{copy.confirm}</button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={cancel} style={{ minHeight: '44px' }}>{copy.cancel}</button>
          </div>
        </div>
      )}
      {message && <p role="status" style={{ color: message.tone === 'error' ? 'var(--semantic-danger)' : 'var(--brand-text)', margin: 'var(--space-2) 0', overflowWrap: 'anywhere' }}>{message.text}</p>}
    </>
  )
  return { run, busy, panel, show }
}
