'use client'
/**
 * Write, review and send one email (ADR-0023).
 *
 *   edit     text is saved to a server draft as Marcel types (debounced); Max can draft or rewrite,
 *            and only ever proposes — "Apply" is Marcel's choice.
 *   confirm  email.deliver prepares the exact email; the rendered HTML is shown in a sandboxed
 *            frame (no scripts, no network). Editing again cancels the confirmation.
 *   sent     one execution of that confirmation; a replay cannot send twice.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MailCopy } from '@/lib/os-i18n/mail'
import { localizeFailure, say } from '@/lib/os-i18n/mail'
import { FAMILIES, FAMILY_IDS, PLACEHOLDER, type FamilyId } from '@/lib/mail/identity/families'
import { executeApproval, rejectApproval, resultData, runMail, type EngineResult } from '@/lib/mail/client'

export interface ComposerInit {
  draftId?: string; revision?: number
  mode: 'new' | 'reply' | 'reply_all' | 'forward'
  threadId?: string | null; sourceMessageId?: string | null
  to: string[]; cc: string[]; bcc: string[]
  subject: string; body: string; family: FamilyId; language: 'de' | 'en'
  entityKind?: 'lead' | 'client' | 'project' | null; entityId?: string | null
  followUpDays?: number | null
  recipientName?: string | null; company?: string | null
}
export interface ComposerProps { init: ComposerInit; copy: MailCopy; sending: boolean; onClose: (changed: boolean) => void; onSent: (summary: string) => void }

const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/
const splitAddresses = (value: string) => value.split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
const ASSIST = ['improve', 'shorten', 'expand', 'friendlier', 'formal', 'translate'] as const

export function Composer({ init, copy, sending, onClose, onSent }: ComposerProps) {
  const k = copy.composer
  const [to, setTo] = useState(init.to.join(', '))
  const [cc, setCc] = useState(init.cc.join(', '))
  const [bcc, setBcc] = useState(init.bcc.join(', '))
  const [showCc, setShowCc] = useState(init.cc.length > 0 || init.bcc.length > 0)
  const [subject, setSubject] = useState(init.subject)
  const [body, setBody] = useState(init.body)
  const [family, setFamily] = useState<FamilyId>(init.family)
  const [language, setLanguage] = useState<'de' | 'en'>(init.language)
  const [followUp, setFollowUp] = useState<number | null | 'default'>(init.followUpDays === undefined || init.followUpDays === null ? 'default' : init.followUpDays)
  const [dirty, setDirty] = useState(false)
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'error'>(init.draftId ? 'saved' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<'edit' | 'confirm' | 'sent'>('edit')
  const [approval, setApproval] = useState<EngineResult['approval'] | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<{ text: string; note: string; translate: boolean } | null>(null)
  const [assisting, setAssisting] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const saving = useRef<Promise<string | null> | null>(null)
  const changed = useRef(false)
  /* The id of the server draft, read at call time: a save queued behind the one that created the
     draft must update it, not create a second draft from a stale closure. */
  const draftRef = useRef<string | null>(init.draftId ?? null)

  const invalid = [to, cc, bcc].flatMap(splitAddresses).filter(a => !EMAIL.test(a))
  const days = followUp === 'default' ? FAMILIES[family].followUpDays : followUp
  const gaps = PLACEHOLDER.test(subject) || PLACEHOLDER.test(body)

  const edit = <T,>(setter: (v: T) => void) => (value: T) => { setter(value); setDirty(true); changed.current = true; setSave('idle') }

  const persist = useCallback(async (): Promise<string | null> => {
    if (saving.current) await saving.current
    if (invalid.length) { setSave('error'); setError(`${copy.composer.recipientsHint} ${invalid.join(', ')}`); return null }
    const job = (async () => {
      setSave('saving')
      const input: Record<string, unknown> = {
        to: splitAddresses(to), cc: splitAddresses(cc), bcc: splitAddresses(bcc), subject, body, family, language,
        ...(days !== null && days !== undefined ? { follow_up_days: days } : {}),
      }
      if (draftRef.current) input.draft_id = draftRef.current
      else Object.assign(input, { mode: init.mode, ...(init.threadId ? { thread_id: init.threadId } : {}), ...(init.sourceMessageId ? { source_message_id: init.sourceMessageId } : {}), ...(init.entityKind && init.entityId ? { entity_kind: init.entityKind, entity_id: init.entityId } : {}) })
      const r = await runMail('email.compose', input)
      const data = resultData<{ draft_id: string; revision: number }>(r)
      if (!data) { setSave('error'); setError(localizeFailure(r, copy)); return null }
      draftRef.current = data.draft_id
      setDirty(false); setSave('saved'); setError(null)
      return data.draft_id
    })()
    saving.current = job
    try { return await job } finally { if (saving.current === job) saving.current = null }
  }, [to, cc, bcc, subject, body, family, language, days, init, invalid, copy])

  // Autosave after a pause in typing; nothing is sent.
  useEffect(() => {
    if (!dirty || stage !== 'edit') return
    const timer = setTimeout(() => { void persist() }, 1200)
    return () => clearTimeout(timer)
  }, [dirty, stage, persist])

  async function review() {
    setWorking(true); setError(null)
    try {
      const id = dirty || !draftRef.current ? await persist() : draftRef.current
      if (!id) return
      const r = await runMail('email.deliver', { draft_id: id })
      if (r.status !== 'approval_required' || !r.approval) { setError(localizeFailure(r, copy)); return }
      setApproval(r.approval); setStage('confirm'); setPreviewHtml(null)
      const p = await fetch(`/api/os/mail/preview?draft=${encodeURIComponent(id)}`, { cache: 'no-store' })
      if (p.ok) setPreviewHtml(((await p.json()) as { html: string }).html)
    } finally { setWorking(false) }
  }

  async function send() {
    if (!approval) return
    setWorking(true); setError(null)
    try {
      const r = await executeApproval(approval.id, approval.payloadHash)
      if (r.status === 'done') {
        setStage('sent')
        const data = r.result?.data as { transport?: string } | undefined
        onSent(data?.transport === 'evidence' ? k.sentEvidence : k.sent)
        return
      }
      if (r.status === 'failed' && r.message && /confirm|bestätig|uncertain/i.test(r.message)) setError(k.uncertain)
      else if (r.code === 'expired') { setError(k.expired); setStage('edit') }
      else setError(localizeFailure(r, copy))
    } finally { setWorking(false) }
  }

  async function backToEdit() {
    if (approval) await rejectApproval(approval.id).catch(() => undefined)
    setApproval(null); setPreviewHtml(null); setStage('edit')
  }

  async function discard() {
    if (draftRef.current) await runMail('email.discard', { draft_id: draftRef.current })
    onClose(true)
  }

  async function assist(mode: 'draft_reply' | typeof ASSIST[number]) {
    setAssisting(mode); setSuggestion(null); setError(null)
    try {
      const target = mode === 'translate' ? (language === 'de' ? 'en' : 'de') : language
      const r = await runMail('email.assist', { mode, language: target, ...(init.threadId ? { thread_id: init.threadId } : {}), ...(body.trim() ? { text: body } : {}) })
      const data = resultData<{ text: string }>(r)
      if (!data?.text) { setError(localizeFailure(r, copy, true)); return }
      setSuggestion({ text: data.text, note: r.result?.summary ?? '', translate: mode === 'translate' })
    } finally { setAssisting(null) }
  }

  function insertStarter() {
    const context = { name: init.recipientName, company: init.company, subject: init.subject }
    if (!subject.trim()) edit(setSubject)(FAMILIES[family].subject[language](context))
    edit(setBody)(FAMILIES[family].starter[language](context) + (body.trim() ? `\n\n${body}` : ''))
  }

  const title = { new: k.newTitle, reply: k.replyTitle, reply_all: k.replyAllTitle, forward: k.forwardTitle }[init.mode]
  return (
    <div className="mail-composer-backdrop" role="presentation">
      <section className="mail-composer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="mail-composer-head">
          <h2>{stage === 'confirm' ? k.confirmTitle : title}</h2>
          <span className="mail-note" aria-live="polite">{save === 'saving' ? k.saving : save === 'saved' ? k.saved : save === 'error' ? k.unsaved : ''}</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => onClose(changed.current)}>{k.close}</button>
        </header>

        {stage === 'edit' && (
          <form className="mail-composer-body" onSubmit={e => { e.preventDefault(); void review() }}>
            <label className="mail-field"><span>{k.to}</span><input className="input" value={to} onChange={e => edit(setTo)(e.target.value)} autoComplete="email" inputMode="email" aria-describedby="mail-recipients-hint" /></label>
            {showCc ? <>
              <label className="mail-field"><span>{k.cc}</span><input className="input" value={cc} onChange={e => edit(setCc)(e.target.value)} inputMode="email" /></label>
              <label className="mail-field"><span>{k.bcc}</span><input className="input" value={bcc} onChange={e => edit(setBcc)(e.target.value)} inputMode="email" /></label>
            </> : <button type="button" className="mail-link mail-add-cc" onClick={() => setShowCc(true)}>{k.addCc}</button>}
            <p id="mail-recipients-hint" className="mail-note">{k.recipientsHint}</p>
            <label className="mail-field"><span>{k.subject}</span><input className="input" value={subject} maxLength={300} onChange={e => edit(setSubject)(e.target.value)} /></label>
            <div className="mail-composer-options">
              <label className="mail-field"><span>{k.family}</span>
                <select className="input" value={family} onChange={e => edit(setFamily)(e.target.value as FamilyId)}>
                  {FAMILY_IDS.map(f => <option key={f} value={f}>{FAMILIES[f].label[language]}</option>)}
                </select>
              </label>
              <label className="mail-field"><span>{k.language}</span>
                <select className="input" value={language} onChange={e => edit(setLanguage)(e.target.value as 'de' | 'en')}>
                  <option value="de">{k.languages.de}</option><option value="en">{k.languages.en}</option>
                </select>
              </label>
              <label className="mail-field"><span>{k.followUp}</span>
                <select className="input" value={followUp === null ? 'none' : String(followUp)} onChange={e => edit(setFollowUp)(e.target.value === 'default' ? 'default' : e.target.value === 'none' ? null : Number(e.target.value))}>
                  <option value="default">{FAMILIES[family].followUpDays === null ? k.followUpNone : say(k.followUpDays, { days: FAMILIES[family].followUpDays! })}</option>
                  {[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{say(k.followUpDays, { days: d })}</option>)}
                  <option value="none">{k.followUpNone}</option>
                </select>
              </label>
            </div>
            <label className="mail-field mail-field-body"><span>{k.body}</span>
              <textarea className="textarea" value={body} rows={12} maxLength={20000} onChange={e => edit(setBody)(e.target.value)} />
            </label>
            <p className="mail-note">{k.greetingNote}</p>
            {gaps && <p className="mail-note is-alert" role="status">{k.gaps}</p>}

            <div className="mail-assist" role="group" aria-label={k.max}>
              <span className="mail-label">{k.max}</span>
              {init.threadId && init.mode !== 'forward' && <button type="button" className="mail-chip" disabled={Boolean(assisting)} onClick={() => void assist('draft_reply')}>{assisting === 'draft_reply' ? k.maxWorking : k.maxDraft}</button>}
              {ASSIST.map(mode => <button key={mode} type="button" className="mail-chip" disabled={Boolean(assisting) || !body.trim()} onClick={() => void assist(mode)}>
                {assisting === mode ? k.maxWorking : { improve: k.maxImprove, shorten: k.maxShorten, expand: k.maxExpand, friendlier: k.maxFriendlier, formal: k.maxFormal, translate: k.maxTranslate }[mode]}</button>)}
              {FAMILIES[family].starter[language]({}) && <button type="button" className="mail-chip" onClick={insertStarter}>{k.starter}</button>}
            </div>
            {suggestion && (
              <div className="mail-suggestion" role="status">
                <p className="mail-note">{suggestion.note}</p>
                <div className="mail-body">{suggestion.text}</div>
                <div className="mail-toolbar">
                  <button type="button" className="btn-primary btn-sm" onClick={() => { edit(setBody)(suggestion.text); if (suggestion.translate) edit(setLanguage)(language === 'de' ? 'en' : 'de'); setSuggestion(null) }}>{k.maxApply}</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setSuggestion(null)}>{k.maxDismiss}</button>
                </div>
              </div>
            )}
            <p className="mail-note">{k.maxNote}</p>
            {!sending && <p className="mail-note is-alert">{copy.sendingOff}</p>}
            {error && <p className="mail-note is-alert" role="alert">{error}</p>}
            <div className="mail-composer-actions">
              <button type="submit" className="btn-primary" disabled={working || !sending || gaps || invalid.length > 0 || !splitAddresses(to).length || !subject.trim() || !body.trim()}>{k.review}</button>
              <button type="button" className="btn-secondary" onClick={() => void discard()}>{k.discard}</button>
            </div>
          </form>
        )}

        {stage === 'confirm' && approval && (
          <div className="mail-composer-body">
            <dl className="mail-confirm">
              {['FROM', 'TO', 'CC', 'BCC', 'SUBJECT'].filter(key => approval.preview[key]).map(key => (
                <div key={key}><dt>{{ FROM: copy.from, TO: k.to, CC: k.cc, BCC: k.bcc, SUBJECT: k.subject }[key]}</dt><dd>{approval.preview[key]}</dd></div>
              ))}
              <div><dt>{k.thread}</dt><dd>{init.mode === 'new' ? k.threadNew : /^Continues/.test(approval.preview.THREAD ?? '') ? k.threadContinues : k.threadUnknown}</dd></div>
              <div><dt>{k.followUp}</dt><dd>{days === null || days === undefined ? k.followUpNone : say(k.followUpDays, { days })}</dd></div>
            </dl>
            <p className="mail-label">{k.previewTitle}</p>
            {previewHtml
              ? <iframe className="mail-preview" title={k.previewTitle} sandbox="" srcDoc={previewHtml} />
              : <div className="mail-body">{body}</div>}
            {error && <p className="mail-note is-alert" role="alert">{error}</p>}
            <div className="mail-composer-actions">
              <button type="button" className="btn-primary" disabled={working} onClick={() => void send()}>{working ? copy.actions.working : k.send}</button>
              <button type="button" className="btn-secondary" disabled={working} onClick={() => void backToEdit()}>{k.back}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
