'use client'
/**
 * Business context beside a conversation (ADR-0023): the next step first, then who this is, what
 * is open between Maxpromo and them, and the follow-up controls. Presentational.
 */
import { useState } from 'react'
import Link from 'next/link'
import type { MailCopy } from '@/lib/os-i18n/mail'
import { say } from '@/lib/os-i18n/mail'
import { STAGE_LABEL } from '@/lib/commercial/pipeline'
import type { ThreadContext } from '@/lib/mail/context'
import { addDaysIso, fullDate, isoDay, money } from './format'

export interface Analysis { summary: string; intent: string | null; openQuestions: string[]; ourCommitments: string[]; theirCommitments: string[]; nextStep: string | null; followUpDays: number | null; previewOnly: boolean }
export interface ContextPanelProps {
  context: ThreadContext
  copy: MailCopy
  locale: 'de' | 'en'
  intlLocale: string
  today: string
  busy: boolean
  analysis: Analysis | null
  analysisState: 'idle' | 'working' | 'error'
  onAnalyze: () => void
  onFollowUp: (input: { follow_up_on?: string; clear_follow_up?: boolean; next_action?: string; clear_next_action?: boolean; waiting?: boolean; needs_reply?: boolean }) => void
  onSaveLead: (input: { company: string; name?: string }) => void
  onLink: (kind: 'lead' | 'client', id: string) => void
  onOpenThread: (id: string) => void
}

export function ContextPanel({ context: c, copy, locale, intlLocale, today, busy, analysis, analysisState, onAnalyze, onFollowUp, onSaveLead, onLink, onOpenThread }: ContextPanelProps) {
  const k = copy.context
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState(c.nextAction ?? '')
  const nextText = say(copy.nextStep[c.next.key], c.next.key === 'waitUntil' && c.next.params.date ? { ...c.next.params, date: isoDay(String(c.next.params.date), intlLocale) } : c.next.params)
  const canSaveLead = !c.lead && !c.client && Boolean(c.sender)

  return (
    <aside className="mail-context" aria-label={k.title}>
      {nextText && (
        <section className="mail-panel is-next">
          <p className="mail-panel-title">{k.next}</p>
          <p className="mail-next">{nextText}</p>
        </section>
      )}

      <section className="mail-panel">
        <p className="mail-panel-title">{k.person}</p>
        {c.sender && <p className="mail-strong mail-break">{c.sender}</p>}
        {c.lead && (
          <div className="mail-record">
            <p><span className="mail-label">{k.lead}</span> <span className="mail-strong">{c.lead.company || c.lead.name || c.lead.email}</span>{c.lead.company && c.lead.name ? ` · ${c.lead.name}` : ''}</p>
            <p className="mail-note">{k.stage}: {c.lead.stage ? STAGE_LABEL[c.lead.stage][locale] : c.lead.status}{c.lead.value ? ` · ${k.value}: ${money(c.lead.value, c.lead.currency, intlLocale)}` : ''}</p>
            {c.lead.confirmed ? <p className="mail-note">{k.confirmed}</p> : <p className="mail-note">{k.possible} <button type="button" className="mail-link" disabled={busy} onClick={() => onLink('lead', c.lead!.id)}>{copy.actions.linkLead}</button></p>}
            <Link className="mail-link" href="/os/leads">{copy.views.leads} →</Link>
          </div>
        )}
        {c.client && (
          <div className="mail-record">
            <p><span className="mail-label">{k.client}</span> <span className="mail-strong">{c.client.company || c.client.name}</span>{c.client.company ? ` · ${c.client.name}` : ''}</p>
            {c.client.confirmed ? <p className="mail-note">{k.confirmed}</p> : <p className="mail-note">{k.possible} <button type="button" className="mail-link" disabled={busy} onClick={() => onLink('client', c.client!.id)}>{copy.actions.linkClient}</button></p>}
            <Link className="mail-link" href="/os/clients">{copy.views.clients} →</Link>
          </div>
        )}
        {canSaveLead && (
          <form className="mail-record" onSubmit={e => { e.preventDefault(); if (company.trim()) onSaveLead({ company: company.trim(), ...(name.trim() ? { name: name.trim() } : {}) }) }}>
            <p className="mail-note">{c.potentialLead ? k.potentialLead : k.noRecord}</p>
            <label className="mail-field"><span>{copy.actions.saveLeadCompany}</span><input className="input" value={company} maxLength={200} required onChange={e => setCompany(e.target.value)} /></label>
            <label className="mail-field"><span>{copy.actions.saveLeadName}</span><input className="input" value={name} maxLength={200} onChange={e => setName(e.target.value)} /></label>
            <button type="submit" className="btn-secondary btn-sm" disabled={busy || !company.trim()}>{copy.actions.saveLead}</button>
          </form>
        )}
        <dl className="mail-facts">
          <div><dt>{k.lastInbound}</dt><dd>{c.lastInbound ? fullDate(c.lastInbound, intlLocale) : k.none}</dd></div>
          <div><dt>{k.lastOutbound}</dt><dd>{c.lastOutbound ? fullDate(c.lastOutbound, intlLocale) : k.none}</dd></div>
        </dl>
      </section>

      {c.state !== 'quarantined' && (
        <section className="mail-panel">
          <p className="mail-panel-title">{copy.states[c.state]}</p>
          <p className="mail-note">{k.followUpOn}: {c.followUpOn ? isoDay(c.followUpOn, intlLocale) : k.none}</p>
          <div className="mail-chips" role="group" aria-label={k.setFollowUp}>
            {[1, 3, 5, 7, 14].map(days => (
              <button key={days} type="button" className="mail-chip" disabled={busy} onClick={() => onFollowUp({ follow_up_on: addDaysIso(today, days), waiting: true, needs_reply: false })}>{say(k.in, { days })}</button>
            ))}
            {c.followUpOn && <button type="button" className="mail-chip" disabled={busy} onClick={() => onFollowUp({ clear_follow_up: true })}>{k.clearFollowUp}</button>}
          </div>
          <div className="mail-chips">
            <button type="button" className="mail-chip" aria-pressed={c.state === 'needs_reply' || c.state === 'customer_replied'} disabled={busy} onClick={() => onFollowUp({ needs_reply: true, waiting: false })}>{k.markNeedsReply}</button>
            <button type="button" className="mail-chip" aria-pressed={c.state === 'waiting'} disabled={busy} onClick={() => onFollowUp({ waiting: true, needs_reply: false })}>{k.markWaiting}</button>
            <button type="button" className="mail-chip" aria-pressed={c.state === 'no_next_step'} disabled={busy} onClick={() => onFollowUp({ waiting: false, needs_reply: false, clear_follow_up: true })}>{k.clearState}</button>
          </div>
          <form className="mail-field-row" onSubmit={e => { e.preventDefault(); onFollowUp(note.trim() ? { next_action: note.trim() } : { clear_next_action: true }) }}>
            <label className="mail-field"><span>{k.nextAction}</span><input className="input" value={note} maxLength={300} onChange={e => setNote(e.target.value)} /></label>
            <button type="submit" className="btn-secondary btn-sm" disabled={busy || note.trim() === (c.nextAction ?? '')}>{copy.actions.save}</button>
          </form>
        </section>
      )}

      {c.projects.length > 0 && (
        <section className="mail-panel">
          <p className="mail-panel-title">{k.projects}</p>
          <ul className="mail-items">{c.projects.map(p => <li key={p.id}><Link className="mail-link" href="/os/jobs">{p.title}</Link><span className="mail-note"> · {p.stage}{p.dueDate ? ` · ${isoDay(p.dueDate, intlLocale)}` : ''}</span></li>)}</ul>
        </section>
      )}
      {c.quotes.length > 0 && (
        <section className="mail-panel">
          <p className="mail-panel-title">{k.quotes}</p>
          <ul className="mail-items">{c.quotes.map(q => <li key={q.id}><Link className="mail-link" href={`/os/angebote/${q.id}`}>{q.number}</Link><span className="mail-note"> · {money(q.total, q.currency, intlLocale)} · {q.status}</span></li>)}</ul>
        </section>
      )}
      {c.invoices.length > 0 && (
        <section className="mail-panel">
          <p className="mail-panel-title">{k.invoices}</p>
          <ul className="mail-items">{c.invoices.map(i => (
            <li key={i.id}><Link className="mail-link" href={`/os/invoices/${i.id}`}>{i.number}</Link>
              <span className={`mail-note${i.state === 'overdue' ? ' is-alert' : ''}`}> · {i.open > 0 ? `${money(i.open, i.currency, intlLocale)} ${k.open}` : k.paid}{i.state === 'overdue' ? ` · ${say(k.overdue, { days: i.daysOverdue })}` : i.dueDate && i.open > 0 ? ` · ${say(k.due, { date: isoDay(i.dueDate, intlLocale) })}` : ''}</span></li>
          ))}</ul>
        </section>
      )}
      {c.followUps.length > 0 && (
        <section className="mail-panel">
          <p className="mail-panel-title">{k.followUps}</p>
          <ul className="mail-items">{c.followUps.map(f => <li key={f.id}>{isoDay(f.dueOn, intlLocale)} · {f.reason}</li>)}</ul>
        </section>
      )}
      {c.otherThreads.length > 0 && (
        <section className="mail-panel">
          <p className="mail-panel-title">{k.history}</p>
          <ul className="mail-items">{c.otherThreads.map(o => <li key={o.id}><button type="button" className="mail-link" onClick={() => onOpenThread(o.id)}>{o.subject || copy.noSubject}</button><span className="mail-note"> · {fullDate(o.updatedAt, intlLocale)}</span></li>)}</ul>
        </section>
      )}

      {c.state !== 'quarantined' && (
        <section className="mail-panel">
          <p className="mail-panel-title">{copy.analysis.title}</p>
          {!analysis && <button type="button" className="btn-secondary btn-sm" disabled={busy || analysisState === 'working'} onClick={onAnalyze}>{analysisState === 'working' ? copy.analysis.working : copy.analysis.run}</button>}
          {analysisState === 'error' && <p className="mail-note is-alert">{copy.actions.failed}</p>}
          {analysis && (
            <div className="mail-analysis">
              <p>{analysis.summary}</p>
              {analysis.intent && <p><span className="mail-label">{copy.analysis.intent}</span> {analysis.intent}</p>}
              {analysis.openQuestions.length > 0 && <><p className="mail-label">{copy.analysis.questions}</p><ul>{analysis.openQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul></>}
              {analysis.ourCommitments.length > 0 && <><p className="mail-label">{copy.analysis.ours}</p><ul>{analysis.ourCommitments.map((q, i) => <li key={i}>{q}</li>)}</ul></>}
              {analysis.theirCommitments.length > 0 && <><p className="mail-label">{copy.analysis.theirs}</p><ul>{analysis.theirCommitments.map((q, i) => <li key={i}>{q}</li>)}</ul></>}
              {analysis.nextStep && <p><span className="mail-label">{copy.analysis.next}</span> {analysis.nextStep}</p>}
              {analysis.followUpDays !== null && <button type="button" className="mail-chip" disabled={busy} onClick={() => onFollowUp({ follow_up_on: addDaysIso(today, analysis.followUpDays!), waiting: true, needs_reply: false })}>{say(copy.analysis.followUp, { days: analysis.followUpDays })}</button>}
              <p className="mail-note">{analysis.previewOnly ? copy.previewOnly : copy.analysis.note}</p>
            </div>
          )}
        </section>
      )}
    </aside>
  )
}
