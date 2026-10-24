'use client'
/**
 * One owner Money action on screen (ADR-0025): run the capability; when it prepares an approval,
 * show exactly what will happen (the preview rows) and act only on Marcel's confirmation.
 * Money leaving (refunds) is never one click.
 */
import { useState } from 'react'
import { failure, ownerApi, type EngineResult } from '@/lib/commercial/ownerClient'
import type { MoneyCopy } from '@/lib/os-i18n/money'

const money = ownerApi('/api/os/money/actions')
const mono = 'var(--brand-font-mono)'

export function useMoneyAction(copy: MoneyCopy, onDone: () => void) {
  const [pending, setPending] = useState<NonNullable<EngineResult['approval']> | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function settle(r: EngineResult) {
    if (r.status === 'approval_required' && r.approval) { setPending(r.approval); return }
    setPending(null)
    if (r.status === 'done') { setMessage({ tone: 'ok', text: copy.done }); onDone() }
    else setMessage({ tone: 'error', text: failure(r) || copy.failed })
  }
  async function run(capability: string, input: Record<string, unknown>) {
    setBusy(true); setMessage(null)
    try { await settle(await money.run(capability, input)) } finally { setBusy(false) }
  }
  async function confirm() {
    if (!pending) return
    setBusy(true)
    try { await settle(await money.execute(pending.id, pending.payloadHash)) } finally { setBusy(false) }
  }
  async function cancel() {
    if (pending) await money.reject(pending.id).catch(() => undefined)
    setPending(null)
  }

  const panel = (
    <>
      {pending && (
        <div role="dialog" aria-label={pending.summary} style={{ border: '1px solid var(--brand-border-strong)', background: 'var(--brand-surface)', padding: 'var(--space-4)', margin: 'var(--space-3) 0' }}>
          <p style={{ fontWeight: 700, margin: '0 0 var(--space-2)' }}>{pending.summary}</p>
          <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, max-content) 1fr', gap: 'var(--space-1) var(--space-3)', margin: '0 0 var(--space-3)' }}>
            {Object.entries(pending.preview).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt style={{ fontFamily: mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', letterSpacing: '0.06em' }}>{k}</dt>
                <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={confirm} style={{ minHeight: '40px' }}>{copy.confirm}</button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={cancel} style={{ minHeight: '40px' }}>{copy.cancel}</button>
          </div>
        </div>
      )}
      {message && <p role="status" style={{ color: message.tone === 'error' ? 'var(--semantic-danger)' : 'var(--brand-text)', margin: 'var(--space-2) 0' }}>{message.text}</p>}
    </>
  )
  return { run, busy, panel }
}
