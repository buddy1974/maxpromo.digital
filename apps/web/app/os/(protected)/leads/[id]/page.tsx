'use client'
/**
 * /os/leads/:id — one prospect, understood in a minute on a phone (ADR-0027):
 *   1. who they are, and anything waiting for Marcel's approval
 *   2. why they qualified: the score's reasons and the quotes from their own website, with links
 *   3. the basis for emailing them (UWG §7) — without one, email is not offered as the channel
 *   4. the outreach draft: revise, put up for approval, or edit it in the Inbox
 *   5. follow-ups, stage decisions and the timeline
 * Every button is a capability through /api/os/leads/actions; a send is always a confirmation.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useOsLocale } from '@/lib/os-i18n/context'
import { LEADS_COPY } from '@/lib/os-i18n/leads'
import { useOwnerAction } from '@/components/os/useOwnerAction'
import type { LeadWorkspace } from '@/lib/leads/workspace'

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
        {done && (
          <>
            <div className="lead-score">
              <span className="money-big">{done.qualification.score}</span>
              <span>
                <strong>{done.qualification.qualified ? c.qualified : c.notQualified}</strong>
                <span className="money-sub">{c.score} · {c.confidence[done.qualification.confidence]} · {c.researchedAt(fmtDate(done.researched_at))}{lastWork?.state === 'completed' ? ` · ${c.agentBy}` : ''}</span>
              </span>
            </div>
            {done.summary && <p className="lead-summary">{done.summary}</p>}
            {done.angle && <p><strong>{c.angle}:</strong> {c.solution[done.angle.solution] ?? done.angle.solution} — {done.angle.why}</p>}
            <h3 className="money-label">{c.why}</h3>
            <ul className="money-list lead-reasons">
              {done.qualification.reasons.map((r, i) => (
                <li key={i} className="money-row"><span>{(c.reason[r.code] ?? (() => r.code))(r.value)}</span><span className="money-amount">{r.points > 0 ? '+' : ''}{r.points}</span></li>
              ))}
            </ul>
            <h3 className="money-label">{c.evidence}</h3>
            {done.evidence.length === 0 ? <p className="money-quiet">{c.noEvidence}</p> : (
              <ul className="money-list">
                {done.evidence.map((e, i) => (
                  <li key={i}>
                    <strong>{c.evidenceKind[e.kind]}</strong> · {e.text}
                    <blockquote className="lead-quote">„{e.quote}“</blockquote>
                    <a className="money-sub" href={e.url} target="_blank" rel="noopener noreferrer nofollow">{c.source}: {e.url.replace(/^https?:\/\//, '')}</a>
                  </li>
                ))}
              </ul>
            )}
            {done.qualification.caveats.length > 0 && (
              <p className="money-rail"><strong>{c.caveats}:</strong> {done.qualification.caveats.map(x => (c.caveat[x.code] ?? (() => x.code))(x.value)).join(' · ')}</p>
            )}
            {done.contact.person && <p className="money-rail">{c.contactPerson}: {done.contact.person}{done.contact.role ? ` (${done.contact.role})` : ''}</p>}
            {done.contact.email_off_domain && <p className="money-rail">{c.offDomain(done.contact.email_off_domain)}</p>}
            <p className="money-rail">{c.pagesRead}: {done.pages.map(p => p.url.replace(/^https?:\/\//, '')).join(' · ')}</p>
          </>
        )}
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
