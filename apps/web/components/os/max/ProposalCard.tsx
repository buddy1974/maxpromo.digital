'use client'
/**
 * One Universal Max proposal: what Max understood, in business words — never raw data. Marcel can
 * confirm, edit a field, pick the right record, or reject. A money proposal shows the capability's
 * own approval preview and needs a second, explicit confirmation. The result says what happened,
 * with links to the records, and a failure is shown as a failure.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MAX_SCREEN_COPY } from '@/lib/os-i18n/max'
import { useMax, type ProposalDecision, type ProposalView } from './MaxProvider'

/** How often a card with open delegated work asks for its state. The server rate-limits the Bureau. */
const WORK_POLL_MS = 4000

const OPEN = new Set(['proposed'])

export function ProposalCard({ p, decide, selectable, selected, onSelect }: {
  p: ProposalView
  decide: (id: string, d: ProposalDecision) => Promise<{ ok: boolean; error?: string }>
  selectable?: boolean; selected?: boolean; onSelect?: (v: boolean) => void
}) {
  const { locale } = useOsLocale()
  const c = MAX_SCREEN_COPY[locale]
  const g = p.grounded
  const editableMissing = g.missing.some(m => g.editable.some(e => e.key === m || e.key === `set.${m}`))
  const [editing, setEditing] = useState(g.state === 'needs_input' && editableMissing && !g.choice)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = OPEN.has(p.status)
  const { refresh } = useMax()
  const workOpen = Boolean(p.work?.open)

  /* Delegated work runs in the Agent Bureau: follow it until it is finished or has failed. */
  useEffect(() => {
    if (!workOpen) return
    const timer = window.setInterval(() => { void refresh(p.id) }, WORK_POLL_MS)
    return () => window.clearInterval(timer)
  }, [workOpen, p.id, refresh])

  async function run(d: ProposalDecision) {
    setBusy(true); setError(null)
    const r = await decide(p.id, d)
    setBusy(false)
    if (!r.ok) setError(r.error === 'unavailable' ? c.errorReply : r.error ?? c.errorReply)
    return r.ok
  }
  async function applyEdits() {
    const edits = Object.fromEntries(Object.entries(draft).filter(([k, v]) => v !== (g.editable.find(e => e.key === k)?.value ?? '')))
    if (!Object.keys(edits).length) { setEditing(false); return }
    if (await run({ action: 'edit', edits })) { setEditing(false); setDraft({}) }
  }

  return (
    <article className={`max-card max-card-${p.status}${g.state === 'needs_input' && open ? ' max-card-needs' : ''}`} aria-busy={busy}>
      <header className="max-card-head">
        {selectable && open && g.state === 'ready' && (
          <input type="checkbox" className="max-card-select" checked={Boolean(selected)} onChange={e => onSelect?.(e.target.checked)} aria-label={`${c.select}: ${g.title}`} />
        )}
        <span className="max-card-type">{g.title}</span>
        <span className={`max-card-status max-status-${p.status}`}>{c.status[p.status] ?? p.status}</span>
      </header>
      {p.summary && <p className="max-card-summary">{p.summary}</p>}

      {g.rows.length > 0 && (
        <dl className="max-rows">
          {g.rows.map((r, i) => (
            <div key={i} className={`max-row${r.tone ? ` max-row-${r.tone}` : ''}`}>
              <dt>{r.label}</dt>
              <dd>{r.before !== undefined && <><s>{r.before}</s> → </>}{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {g.body && !editing && (
        <div className="max-body"><p className="max-body-label">{g.body.label}</p><p className="max-body-text">{g.body.text}</p></div>
      )}
      {g.warnings.length > 0 && <ul className="max-warnings">{g.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
      {open && g.missing.length > 0 && !editing && (
        <p className="max-missing">{c.missing}: {g.missing.join(', ')}</p>
      )}

      {open && g.choice && (
        <div className="max-choice" role="group" aria-label={g.choice.prompt}>
          <p className="max-choice-prompt">{g.choice.prompt}</p>
          <ul>
            {g.choice.options.map(o => (
              <li key={o.id}>
                <div className="max-choice-main"><strong>{o.label}</strong>{o.hint && <span>{o.hint}</span>}</div>
                <div className="max-choice-actions">
                  {o.href && <Link href={o.href} className="btn-secondary btn-sm">{c.open}</Link>}
                  {g.choice!.field !== 'distinct' && <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => void run({ action: 'choose', choice: o.id })}>{c.choose}</button>}
                </div>
              </li>
            ))}
          </ul>
          {g.choice.allowNone && <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => void run({ action: 'choose', choice: '__none__' })}>{g.choice.allowNone}</button>}
        </div>
      )}

      {open && g.tick && (
        <label className="max-tick">
          <input type="checkbox" disabled={busy} onChange={e => { if (e.target.checked) void run({ action: 'edit', edits: { [g.tick!.key]: true } }) }} />
          <span>{g.tick.label}</span>
        </label>
      )}

      {open && editing && (
        <form className="max-edit" onSubmit={e => { e.preventDefault(); void applyEdits() }}>
          {g.editable.map(f => {
            const value = draft[f.key] ?? f.value
            const set = (v: string) => setDraft(d => ({ ...d, [f.key]: v }))
            const id = `max-${p.id}-${f.key}`
            return (
              <label key={f.key} htmlFor={id} className={`max-field${f.kind === 'textarea' ? ' max-field-wide' : ''}`}>
                <span>{f.label}{g.missing.includes(f.key.replace(/^set\./, '')) ? ' *' : ''}</span>
                {f.kind === 'textarea'
                  ? <textarea id={id} value={value} rows={6} onChange={e => set(e.target.value)} />
                  : <input id={id} value={value} onChange={e => set(e.target.value)}
                      type={f.kind === 'date' ? 'date' : f.kind === 'email' ? 'email' : 'text'}
                      inputMode={f.kind === 'amount' ? 'decimal' : f.kind === 'email' ? 'email' : undefined} autoComplete="off" />}
              </label>
            )
          })}
          <div className="max-actions">
            <button type="submit" className="btn-primary" disabled={busy}>{c.apply}</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => { setEditing(false); setDraft({}) }}>{c.cancel}</button>
          </div>
        </form>
      )}

      {p.status === 'awaiting_approval' && p.approval && (
        <div className="max-approval">
          <p className="max-approval-title">{c.approvalTitle}</p>
          <dl className="max-rows">
            {p.approval.preview.map(([k, v]) => <div key={k} className="max-row"><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <p className="max-approval-note">{c.approvalNote}</p>
          <div className="max-actions">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void run({ action: 'approve', payload_hash: p.approval!.payloadHash })}>{c.confirmPayment}</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void run({ action: 'reject' })}>{c.cancel}</button>
          </div>
        </div>
      )}

      {p.result && (
        <div className={`max-result${p.result.error ? ' max-result-error' : ''}`} role="status">
          <p>{p.result.summary}</p>
          {(p.result.links.length > 0 || (p.status === 'done' && g.links?.length)) && (
            <div className="max-links">
              {(p.result.links.length ? p.result.links : g.links ?? []).map(l => <Link key={l.href + l.label} href={l.href} className="btn-secondary btn-sm">{l.label}</Link>)}
            </div>
          )}
        </div>
      )}

      {p.work && (
        <section className={`max-work max-work-${p.work.state}`} aria-live="polite" aria-label={p.work.stateLabel}>
          <p className="max-work-state">
            {p.work.open && <span className="max-work-pulse" aria-hidden="true" />}
            <strong>{p.work.stateLabel}</strong>
            {p.work.lead.label && <span> · {p.work.lead.label}</span>}
          </p>
          {p.work.outcome && (
            <p className="max-work-outcome">
              <span className="max-work-score">{p.work.outcome.score}</span>
              <span className={p.work.outcome.qualified ? 'max-work-yes' : 'max-work-no'}>{p.work.outcome.qualifiedLabel}</span>
              <span className="max-work-conf">{p.work.outcome.confidence}</span>
            </p>
          )}
          {p.work.recommendation?.text && <p className="max-work-next">{p.work.recommendation.text}</p>}
          {p.work.warning && <p className="max-work-warn">{p.work.warning}</p>}
          {p.work.evidence.length > 0 && (
            <div className="max-work-evidence">
              <p className="max-body-label">{p.work.evidenceLabel}</p>
              <ul>
                {p.work.evidence.map((e, i) => (
                  <li key={i}>
                    <span>{e.text}</span>
                    <q>{e.quote}</q>
                    <a href={e.url} target="_blank" rel="noopener noreferrer nofollow">{hostPath(e.url)}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {[p.work.reading, p.work.opportunities].map(part => part && (
            <div key={part.label} className="max-work-part">
              <p className="max-body-label">{part.label}</p>
              <p className="max-work-note">{part.note}</p>
              <ul>{part.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          ))}
          {p.work.checks && (
            <div className="max-work-part">
              <p className="max-body-label">{p.work.checks.label}</p>
              <ul>{p.work.checks.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
          {p.work.failure && <p className="max-work-fail">{p.work.failure.text}</p>}
          {!p.work.open && <p className="max-work-foot">{p.work.footnote}</p>}
          <div className="max-actions">
            {p.work.offer && !p.work.offer.done && (
              <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => void run({ action: 'follow' })}>{p.work.offer.label}</button>
            )}
            <Link href={p.work.lead.href} className="btn-secondary btn-sm">{c.openLead}</Link>
          </div>
        </section>
      )}

      {error && <p className="max-error" role="alert">{error}</p>}

      {open && !editing && (
        <div className="max-actions">
          {g.state === 'ready' && <button type="button" className="btn-primary" disabled={busy} onClick={() => void run({ action: 'confirm', payload_hash: p.payloadHash })}>{p.type === 'AGENT_WORK' ? c.startWork : c.confirm}</button>}
          {g.editable.length > 0 && <button type="button" className="btn-secondary" disabled={busy} onClick={() => setEditing(true)}>{c.edit}</button>}
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void run({ action: 'reject' })}>{c.reject}</button>
        </div>
      )}
    </article>
  )
}

/** An evidence link shows where the quote is — host and path, never a long URL. */
function hostPath(url: string): string {
  try { const u = new URL(url); return `${u.hostname.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname}`.slice(0, 60) } catch { return url.slice(0, 60) }
}
