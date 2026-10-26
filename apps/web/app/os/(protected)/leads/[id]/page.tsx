'use client'
/**
 * /os/leads/:id — one prospect, understood in a minute on a phone (ADR-0027):
 *   1. who they are, and anything waiting for Marcel's approval
 *   2. why they qualified: the score's reasons and the quotes from their own website, with links
 *   3. the basis for emailing them (UWG §7) — without one, email is not offered as the channel
 *   4. the outreach draft: revise, put up for approval, or edit it in the Inbox
 *   5. follow-ups, stage decisions and the timeline
 * Under a Research Agent result, one small question for the field calibration: was it useful?
 * Every button is a capability through /api/os/leads/actions; a send is always a confirmation.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useOsLocale } from '@/lib/os-i18n/context'
import { LEADS_COPY } from '@/lib/os-i18n/leads'
import { useOwnerAction } from '@/components/os/useOwnerAction'
import { useMaxScreenContext } from '@/components/os/max/MaxProvider'
import type { LeadWorkspace } from '@/lib/leads/workspace'
import { JUDGEMENT_COPY } from '@/lib/os-i18n/calibration'

const ISSUES = ['missed_signal', 'overstated', 'misunderstood', 'score_too_high', 'score_too_low', 'wrong_next_step'] as const

/** Field calibration: Marcel's judgement of the result on screen. Stored beside the run; changes nothing else. */
function Judgement({ calibration, busy, fmtDate, j, cancel, onSave }: {
  calibration: NonNullable<LeadWorkspace['calibration']>; busy: boolean; fmtDate: (d: string) => string; j: (typeof JUDGEMENT_COPY)['en']; cancel: string
  onSave: (input: { verdict: string; issues: string[]; note?: string }) => Promise<unknown>
}) {
  const r = calibration.review
  const [editing, setEditing] = useState(!r)
  const [verdict, setVerdict] = useState<string | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [note, setNote] = useState('')
  if (r && !editing) return (
    <div className="lead-judgement">
      <p>{j.current(j.verdict[r.verdict], fmtDate(r.created_at))}{r.issues.length > 0 ? ` · ${r.issues.map(i => j.issue[i]).join(', ')}` : ''}</p>
      {r.note && <p className="money-sub">„{r.note}“</p>}
      {r.revisions > 1 && <p className="money-sub">{j.revisions(r.revisions)}</p>}
      <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}>{j.change}</button>
    </div>
  )
  return (
    <form className="lead-judgement" onSubmit={e => { e.preventDefault(); if (verdict) void onSave({ verdict, issues: verdict === 'agree' ? [] : issues, ...(note.trim() ? { note: note.trim() } : {}) }) }}>
      <p><strong>{j.ask}</strong></p>
      <div className="lead-actions" role="group" aria-label={j.ask}>
        {(['agree', 'partly', 'disagree'] as const).map(v => (
          <button key={v} type="button" aria-pressed={verdict === v} className={`btn-sm ${verdict === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setVerdict(v)}>{j.verdict[v]}</button>
        ))}
      </div>
      {verdict && (
        <>
          {verdict !== 'agree' && (
            <fieldset className="lead-issues">
              <legend className="money-sub">{j.what}</legend>
              {ISSUES.map(i => (
                <label key={i}><input type="checkbox" checked={issues.includes(i)} onChange={e => setIssues(x => e.target.checked ? [...x, i] : x.filter(y => y !== i))} /> {j.issue[i]}</label>
              ))}
            </fieldset>
          )}
          <input aria-label={j.note} placeholder={j.note} value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
          <div className="lead-actions">
            <button type="submit" className="btn-primary btn-sm" disabled={busy}>{j.save}</button>
            {r && <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(false)}>{cancel}</button>}
          </div>
          <p className="money-sub">{j.unchanged}</p>
        </>
      )}
    </form>
  )
}

export default function LeadPage() {
  const { id } = useParams<{ id: string }>()
  const { locale, t, fmtDate } = useOsLocale()
  const c = LEADS_COPY[locale]
  const [ws, setWs] = useState<LeadWorkspace | null>(null)
  const [missing, setMissing] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [website, setWebsite] = useState('')
  const [basisNote, setBasisNote] = useState('')
  const [basisKind, setBasisKind] = useState<'consent' | 'customer' | 'withdrawn'>('consent')
  const [lostReason, setLostReason] = useState('')
  const load = useCallback(() => {
    fetch(`/api/os/leads/${id}`, { cache: 'no-store' })
      .then(r => { if (r.status === 404) { setMissing(true); return null } return r.ok ? r.json() : Promise.reject() })
      .then(d => { if (d) setWs(d as LeadWorkspace) })
      .catch(() => setMissing(true))
  }, [id])
  useEffect(() => { load() }, [load])
  /* While the Research Agent works, look again every few seconds; the server asks the Bureau. */
  const running = ws?.site?.state === 'running'
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(load, 4000)
    return () => window.clearInterval(timer)
  }, [running, load])
  const action = useOwnerAction('/api/os/leads/actions', c, () => load())
  /* "Research this lead" in Max means the lead on screen. */
  useMaxScreenContext(ws ? { lead_id: id, label: ws.lead.company || ws.lead.name || ws.lead.email || undefined } : null)

  if (missing) return <div className="os-page money-page"><p className="money-quiet">{c.notFound}</p><Link href="/os/leads" className="money-more">‹ {c.back}</Link></div>
  if (!ws) return <div className="os-page money-page"><p role="status" className="money-quiet">…</p></div>

  const { lead, site, basis } = ws
  const label = lead.company || lead.name || lead.email || '—'
  const done = site && site.state === 'done' ? site : null
  const openDraft = ws.drafts.find(d => d.status === 'draft')
  const answered = ['responded', 'discovery', 'proposal', 'negotiation', 'won'].includes(lead.status)
  const stageLabel = t.status.lead[lead.status] ?? lead.status
  /* Research is delegated to the Agent Bureau's Research Agent (ADR-0030); the result comes back here. */
  const research = () => action.run('agentwork.request', { agent: 'research', lead_id: lead.id, source: 'lead-screen', language: locale })
  const agentRunning = site?.state === 'running' && site.by === 'bureau:research'
  const lastWork = ws.agentWork[0]

  return (
    <div className="os-page money-page lead-page">
      <Link href="/os/leads" className="money-more lead-back">‹ {c.back}</Link>

      <section className="money-hero" aria-label={label}>
        <p className="money-label">{stageLabel}</p>
        <h1 className="lead-title">{label}</h1>
        <p className="money-sub">{[lead.name && lead.company ? lead.name : null, lead.business_type, lead.city].filter(Boolean).join(' · ')}</p>
        <p className="lead-contact">
          {lead.website && <a href={/^https?:\/\//.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer nofollow">{lead.website.replace(/^https?:\/\//, '')}</a>}
          {lead.email && <span>{lead.email}</span>}
          {lead.phone && <a href={`tel:${lead.phone}`}>{lead.phone}</a>}
        </p>
        {ws.approvals.map(a => (
          <div key={a.id} className="lead-waiting">
            <strong>{c.waiting}</strong>
            <button type="button" className="btn-primary btn-sm" onClick={() => action.show({ id: a.id, payloadHash: a.payload_hash, summary: a.summary, preview: a.preview, expiresAt: a.expires_at })}>{c.review}</button>
          </div>
        ))}
        {action.panel}
      </section>

      {/* ── why: research and qualification ── */}
      <section className="money-card" aria-label={c.research}>
        <h2 className="money-label">{c.research}</h2>
        {!lead.website && (
          <form className="money-form" onSubmit={e => { e.preventDefault(); void action.run('lead.update', { lead_id: lead.id, website: website.trim() }) }}>
            <p className="money-quiet">{c.noWebsite}</p>
            <input aria-label={c.website} placeholder="example.de" value={website} onChange={e => setWebsite(e.target.value)} maxLength={300} required inputMode="url" />
            <button type="submit" className="btn-secondary btn-sm" disabled={action.busy}>{c.save}</button>
          </form>
        )}
        {lead.website && !site && <p className="money-quiet">{c.researchNone}</p>}
        {site?.state === 'running' && <p role="status" className="money-quiet">{agentRunning ? c.agentWorking : c.researching}</p>}
        {!agentRunning && lastWork?.state === 'failed' && lastWork.failure && site?.state !== 'done' && site?.state !== 'failed' && <p className="money-alert">{c.agentFailed(lastWork.failure)}</p>}
        {site?.state === 'failed' && <p className="money-alert">{c.researchFailed(site.detail)}</p>}
        {done && (() => {
          const q = done.qualification
          /* Research recorded before ADR-0031 has no verdict and is shown as it was decided then. */
          const verdict = q.verdict ?? (q.qualified ? 'qualified' : 'not_qualified')
          const short = (u: string) => u.replace(/^https?:\/\/[^/]+\/?/, '/') || '/'
          return (
            <>
              <div className="lead-score">
                <span className="money-big">{q.score}</span>
                <span>
                  <strong>{c.verdict[verdict]}</strong>
                  <span className="money-sub">{c.opportunityScore} · {c.researchConfidence}: {c.confidence[q.confidence]}</span>
                  <span className="money-sub">{c.researchedAt(fmtDate(done.researched_at))}{lastWork?.state === 'completed' ? ` · ${c.agentBy}` : ''}</span>
                </span>
              </div>
              {q.verdict && <p className="money-quiet">{c.verdictWhy[verdict]}</p>}
              {done.summary && <p className="lead-summary">{done.summary}</p>}
              {ws.next && (
                <div className="lead-next">
                  <h3 className="money-label">{c.nextLabel}</h3>
                  <p>{c.next[ws.next.recommendation]}</p>
                  {ws.next.checks.length > 0 && (
                    <>
                      {ws.next.recommendation !== 'review' && <p className="money-sub">{c.checksLabel}:</p>}
                      <ul className="money-list lead-checks">
                        {ws.next.checks.map((x, i) => <li key={i}>{'question' in x ? x.question : (c.unknown[x.code] ?? (() => x.code))(x.value)}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              )}

              <h3 className="money-label">{done.version === 2 ? c.factsLabel : c.evidence}</h3>
              {done.evidence.length === 0 ? <p className="money-quiet">{c.noEvidence}</p> : (
                <ul className="money-list">
                  {done.evidence.map((e, i) => (
                    <li key={i}>
                      {e.id && <span className="lead-id">{e.id}</span>}
                      {done.version !== 2 && <><strong>{c.evidenceKind[e.kind]}</strong> · </>}{e.text}
                      <blockquote className="lead-quote">„{e.quote}“</blockquote>
                      <a className="money-sub" href={e.url} target="_blank" rel="noopener noreferrer nofollow">{c.source}: {e.url.replace(/^https?:\/\//, '')}</a>
                      {e.also && e.also.length > 0 && <span className="money-sub"> · {c.alsoOn(e.also.length)} ({e.also.map(short).join(', ')})</span>}
                    </li>
                  ))}
                </ul>
              )}
              {(done.signal_facts?.length ?? 0) > 0 && (
                <>
                  <p className="money-sub">{c.signalsLabel}</p>
                  <ul className="money-list lead-signals">
                    {done.signal_facts!.map(x => <li key={x.id}><span className="lead-id">{x.id}</span>{(c.signal[x.code] ?? (() => x.code))(x.value)}</li>)}
                  </ul>
                </>
              )}

              {(done.inferences?.length ?? 0) > 0 && (
                <>
                  <h3 className="money-label">{c.inferencesLabel}</h3>
                  <p className="money-sub">{c.inferencesNote}</p>
                  <ul className="money-list">
                    {done.inferences!.map((x, i) => <li key={i}>{x.text} <span className="money-sub">({c.basedOn} {x.based_on.join(', ')})</span></li>)}
                  </ul>
                </>
              )}
              {(done.opportunities?.length ?? 0) > 0 ? (
                <>
                  <h3 className="money-label">{c.opportunitiesLabel}</h3>
                  <p className="money-sub">{c.opportunitiesNote}</p>
                  <ul className="money-list">
                    {done.opportunities!.map((x, i) => <li key={i}><strong>{c.solution[x.solution] ?? x.solution}</strong> — {x.hypothesis} <span className="money-sub">({c.basedOn} {x.based_on.join(', ')})</span></li>)}
                  </ul>
                </>
              ) : done.version !== 2 && done.angle && <p><strong>{c.angle}:</strong> {c.solution[done.angle.solution] ?? done.angle.solution} — {done.angle.why}</p>}

              <h3 className="money-label">{q.verdict ? c.scoreWhy : c.why}</h3>
              <ul className="money-list lead-reasons">
                {q.reasons.map((r, i) => (
                  <li key={i} className="money-row"><span>{(c.reason[r.code] ?? (() => r.code))(r.value)}</span><span className="money-amount">{r.points > 0 ? '+' : ''}{r.points}</span></li>
                ))}
                {(q.unknowns ?? []).map((u, i) => (
                  <li key={`u${i}`} className="money-row money-quiet"><span>{c.notEstablished}: {(c.unknown[u.code] ?? (() => u.code))(u.value)}</span><span className="money-amount">±0</span></li>
                ))}
              </ul>
              {q.caveats.length > 0 && (
                <p className="money-rail"><strong>{c.caveats}:</strong> {q.caveats.map(x => (c.caveat[x.code] ?? (() => x.code))(x.value)).join(' · ')}</p>
              )}
              {done.contact.person && <p className="money-rail">{c.contactPerson}: {done.contact.person}{done.contact.role ? ` (${done.contact.role})` : ''}</p>}
              {done.contact.email_off_domain && !q.verdict && <p className="money-rail">{c.offDomain(done.contact.email_off_domain)}</p>}
              <p className="money-rail">{c.pagesRead}: {done.pages.map(p => p.url.replace(/^https?:\/\//, '')).join(' · ')}</p>
              {ws.calibration && <Judgement key={`${ws.calibration.workId}:${ws.calibration.review?.id ?? ''}`} calibration={ws.calibration} busy={action.busy} fmtDate={fmtDate} j={JUDGEMENT_COPY[locale]} cancel={c.cancel}
                onSave={input => action.run('agentwork.review', { work_id: ws.calibration!.workId, ...input })} />}
              {ws.siteHistory.length > 0 && (
                <p className="money-rail"><strong>{c.earlier}:</strong> {ws.siteHistory.map(h => c.historyLine(fmtDate(h.at), h.score, c.verdict[h.verdict] ?? h.verdict, c.confidence[h.confidence] ?? h.confidence, h.facts, h.pages)).join(' — ')}</p>
              )}
            </>
          )
        })()}
        {lead.website && site?.state !== 'running' && (
          <button type="button" className="btn-secondary btn-sm lead-button" disabled={action.busy} onClick={research}>{action.busy ? c.researching : done ? c.researchAgain : c.researchNow}</button>
        )}
      </section>

      {/* ── may we email them? ── */}
      <section className={`money-card ${basis ? '' : 'money-issues'}`} aria-label={c.basis}>
        <h2 className="money-label">{c.basis}</h2>
        <p className="money-sentence">{basis ? c.basisText[basis] : c.basisNone}</p>
        <form className="money-form" onSubmit={e => { e.preventDefault(); void action.run('lead.basis', { lead_id: lead.id, basis: basisKind, note: basisNote.trim() }).then(() => setBasisNote('')) }}>
          <select aria-label={c.basisRecord} value={basisKind} onChange={e => setBasisKind(e.target.value as typeof basisKind)}>
            <option value="consent">{c.basisConsent}</option>
            <option value="customer">{c.basisCustomer}</option>
            <option value="withdrawn">{c.basisWithdraw}</option>
          </select>
          <input aria-label={c.basisNote} placeholder={c.basisNote} value={basisNote} onChange={e => setBasisNote(e.target.value)} minLength={10} maxLength={500} required />
          <button type="submit" className="btn-secondary btn-sm" disabled={action.busy}>{c.basisRecord}</button>
        </form>
      </section>

      {/* ── the message ── */}
      <section className="money-card" aria-label={c.outreach}>
        <h2 className="money-label">{c.outreach}</h2>
        {answered && <p className="money-sentence">{c.replied}</p>}
        {!lead.email && <p className="money-quiet">{c.noEmail}</p>}
        {ws.drafts.map(d => (
          <article key={d.id} className="lead-draft">
            <p className="money-sub">{c.family[d.family] ?? d.family} · {c.draftStatus[d.status] ?? d.status} · {c.draftFor(d.to_addrs.join(', ') || '—')}</p>
            <p className="lead-subject">{d.subject}</p>
            <p className="lead-body">{d.body}</p>
            {/* After a reply the policy refuses outreach; the screen does not offer it (the stored reason is the audit's English). */}
            {d.schedule_error && !answered && <p className="money-alert">{d.schedule_error}</p>}
            {d.status === 'draft' && !answered && (
              <div className="lead-actions">
                <button type="button" className="btn-primary btn-sm" disabled={action.busy || !d.to_addrs.length} onClick={() => action.run('outreach.send', { mail_draft_id: d.id })}>{c.send}</button>
                <Link className="btn-secondary btn-sm" href="/os/inbox?view=drafts">{c.openInbox}</Link>
                <button type="button" className="btn-secondary btn-sm" disabled={action.busy} onClick={() => action.run('email.discard', { draft_id: d.id })}>{c.discard}</button>
              </div>
            )}
            {d.thread_id && d.status !== 'draft' && <Link className="money-more" href={`/os/inbox?thread=${d.thread_id}`}>{c.openConversation} ›</Link>}
          </article>
        ))}
        {lead.email && !answered && (
          openDraft && ws.latestDraftVersion ? (
            <form className="money-form" onSubmit={e => { e.preventDefault(); void action.run('outreach.draft', { previous_draft_id: ws.latestDraftVersion, instruction: instruction.trim() }).then(() => setInstruction('')) }}>
              <input aria-label={c.revise} placeholder={c.revisePlaceholder} value={instruction} onChange={e => setInstruction(e.target.value)} maxLength={600} required />
              <button type="submit" className="btn-secondary btn-sm" disabled={action.busy}>{action.busy ? c.drafting : c.revise}</button>
            </form>
          ) : !openDraft && (
            <button type="button" className="btn-secondary btn-sm lead-button" disabled={action.busy}
              onClick={() => action.run('outreach.draft', { lead_id: lead.id, channel: 'email', ...(lead.status === 'contacted' ? { follow_up: true } : {}) })}>
              {action.busy ? c.drafting : lead.status === 'contacted' ? c.writeFollowUp : c.writeDraft}
            </button>
          )
        )}
      </section>

      {ws.followups.length > 0 && (
        <section className="money-card" aria-label={c.followups}>
          <h2 className="money-label">{c.followups}</h2>
          <ul className="money-list">
            {ws.followups.map(f => <li key={f.id} className="money-row"><span>{fmtDate(f.due_on)}<span className="money-sub">{f.reason}{f.unless_reply ? ` · ${c.ifNoReply}` : ''}</span></span></li>)}
          </ul>
        </section>
      )}

      <section className="money-card" aria-label={c.stage}>
        <h2 className="money-label">{c.stage}: {stageLabel}</h2>
        <div className="lead-actions">
          {answered && lead.status === 'responded' && <button type="button" className="btn-primary btn-sm" disabled={action.busy} onClick={() => action.run('lead.update', { lead_id: lead.id, stage: 'discovery' })}>{c.opportunity}</button>}
          {lead.status !== 'lost' && lead.status !== 'won' && (
            <form className="money-form" onSubmit={e => { e.preventDefault(); void action.run('lead.update', { lead_id: lead.id, stage: 'lost', ...(lostReason.trim() ? { lost_reason: lostReason.trim() } : {}) }) }}>
              <input aria-label={c.lostReason} placeholder={c.lostReason} value={lostReason} onChange={e => setLostReason(e.target.value)} maxLength={300} />
              <button type="submit" className="btn-secondary btn-sm" disabled={action.busy}>{c.notInterested}</button>
            </form>
          )}
        </div>
      </section>

      <section className="money-card" aria-label={c.progress}>
        <h2 className="money-label">{c.progress}</h2>
        {ws.timeline.length === 0 ? <p className="money-quiet">{c.noTimeline}</p> : (
          <ul className="money-list">
            {ws.timeline.map(a => <li key={a.id}><span className="money-sub">{fmtDate(a.created_at)} · {a.actor}</span>{a.summary}</li>)}
          </ul>
        )}
      </section>
    </div>
  )
}
