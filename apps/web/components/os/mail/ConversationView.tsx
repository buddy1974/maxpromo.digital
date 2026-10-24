'use client'
/**
 * One conversation (ADR-0023): header, actions, the messages in order — Maxpromo's own replies in
 * the same timeline — and attachments. Presentational; actions are callbacks.
 *
 * Mail is untrusted data. Bodies render as plain text (React escapes every character); nothing is
 * interpreted as HTML, no remote image loads, no link is generated from mail content.
 */
import { useState } from 'react'
import type { MailCopy } from '@/lib/os-i18n/mail'
import { attachmentPolicy } from '@/lib/mail/attachments'
import type { MailThread } from '@/lib/mail/views'
import { fullDate } from './format'
import { senderLabel } from './MailList'

export interface MailMessage {
  id: string; sender: string; recipients: string[]; cc: string[]; subject: string; body_text: string; preview_text?: string; body_state?: string
  received_at: string; is_read: boolean; attachments: { id: string; filename: string; size: number; contentType?: string }[]
  provider_state?: string; provider_folder?: string | null; risk_signals?: string[]; direction?: 'inbound' | 'outbound'; content_attempts?: number
}
export type ReplyMode = 'reply' | 'reply_all' | 'forward'
export interface ConversationViewProps {
  thread: MailThread & { follow_up_on?: string | null }
  messages: MailMessage[]
  copy: MailCopy
  intlLocale: string
  providerCheck: boolean
  busy: boolean
  onReply: (mode: ReplyMode) => void
  onState: (action: 'archive' | 'unarchive' | 'mark_read' | 'mark_unread') => void
  onSpam: (verdict: 'spam' | 'not_spam', block?: boolean) => void
  onBack: () => void
}

function bytes(size: number): string {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`
}

export function ConversationView({ thread, messages, copy, intlLocale, providerCheck, busy, onReply, onState, onSpam, onBack }: ConversationViewProps) {
  const [armBlock, setArmBlock] = useState(false)
  const quarantined = Boolean(thread.quarantine)
  const latest = messages[messages.length - 1]
  const inbound = [...messages].reverse().find(m => m.direction !== 'outbound')
  const state = inbound?.provider_state
  const where = state && state !== 'unverified' && state !== 'not_found' ? `${copy.spam.folder}: ${inbound?.provider_folder ?? state}`
    : state === 'not_found' ? copy.spam.notFound : providerCheck ? copy.spam.checking : copy.spam.notConnected
  const signals = Array.from(new Set(messages.flatMap(m => m.risk_signals ?? [])))
  const participants = Array.from(new Set(messages.flatMap(m => m.direction === 'outbound' ? [...m.recipients, ...m.cc] : [m.sender]))).filter(Boolean)

  return (
    <article className="mail-conversation" aria-label={thread.subject || copy.noSubject}>
      <header className="mail-conv-head">
        <button type="button" className="btn-secondary btn-sm mail-back" onClick={onBack}>{copy.back}</button>
        <h2 className="mail-conv-subject">{thread.subject || copy.noSubject}</h2>
        <p className="mail-conv-people">{participants.map(p => senderLabel(p, copy)).join(', ')}</p>
        {!quarantined && (
          <div className="mail-toolbar" role="toolbar" aria-label={copy.actions.more}>
            <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => onReply('reply')}>{copy.actions.reply}</button>
            {latest && (latest.recipients.length + latest.cc.length > 1) && <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onReply('reply_all')}>{copy.actions.replyAll}</button>}
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onReply('forward')}>{copy.actions.forward}</button>
            {thread.archived
              ? <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onState('unarchive')}>{copy.actions.unarchive}</button>
              : <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onState('archive')}>{copy.actions.archive}</button>}
            <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onState(thread.unread ? 'mark_read' : 'mark_unread')}>{thread.unread ? copy.actions.markRead : copy.actions.markUnread}</button>
          </div>
        )}
      </header>

      {quarantined ? (
        <section role="status" className="mail-panel mail-spam">
          <p className="mail-panel-title">{copy.spam.reason[thread.quarantine!] ?? copy.views.spam}</p>
          <p className="mail-note">{copy.spam.note}</p>
          <p className="mail-note">{where}</p>
          {signals.length > 0 && <p className="mail-note">{signals.map(s => copy.spam.signals[s] ?? s).join(' · ')}</p>}
          <div className="mail-toolbar"><button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onSpam('not_spam')}>{busy ? copy.actions.working : copy.actions.notSpam}</button></div>
        </section>
      ) : (
        <p className="mail-note mail-safety">{copy.plainOnly}</p>
      )}

      <ol className="mail-messages">
        {messages.map(message => {
          const outbound = message.direction === 'outbound'
          const preview = message.body_state === 'preview'
          const located = Boolean(message.provider_folder) && ['inbox', 'other'].includes(message.provider_state ?? '')
          return (
            <li key={message.id} className={`mail-message${outbound ? ' is-outbound' : ''}`}>
              <div className="mail-message-head">
                <span className="mail-message-from">{outbound ? copy.you : senderLabel(message.sender, copy)}</span>
                <time dateTime={message.received_at}>{fullDate(message.received_at, intlLocale)}</time>
              </div>
              <p className="mail-message-meta">{copy.to}: {message.recipients.join(', ')}{message.cc.length > 0 && <> · {copy.cc}: {message.cc.join(', ')}</>}</p>
              {preview && <p className="mail-note">{(message.content_attempts ?? 0) >= 3 || !located ? copy.previewUnavailable : copy.previewOnly}</p>}
              <div className="mail-body">{(preview ? message.preview_text : message.body_text) || copy.previewUnavailable}</div>
              {message.attachments.length > 0 && (
                <div className="mail-attachments">
                  <p className="mail-panel-title">{copy.attachments}</p>
                  <ul>
                    {message.attachments.map(a => {
                      const policy = outbound ? null : attachmentPolicy({ filename: a.filename, size: a.size, quarantined, located })
                      return (
                        <li key={a.id}>
                          <span className="mail-attachment-name">{a.filename}</span> <span className="mail-note">· {bytes(a.size)}</span>
                          {policy?.allowed
                            ? <a className="btn-secondary btn-sm mail-download" href={`/api/os/mail/attachment?message=${encodeURIComponent(message.id)}&attachment=${encodeURIComponent(a.id)}`} download rel="noopener">{copy.download}</a>
                            : policy && <span className="mail-note mail-blocked">{quarantined ? copy.attachmentSpam : /code/.test(policy.reason) ? copy.attachmentBlocked : copy.attachmentUnavailable}</span>}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {!quarantined && (
        <footer className="mail-conv-foot">
          <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onSpam('spam')}>{copy.actions.spam}</button>
          {armBlock
            ? <><button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => { setArmBlock(false); onSpam('spam', true) }}>{copy.actions.confirmBlock}</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setArmBlock(false)}>{copy.actions.cancel}</button></>
            : <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => setArmBlock(true)}>{copy.actions.block}</button>}
          <span className="mail-note">{where}</span>
        </footer>
      )}
    </article>
  )
}
