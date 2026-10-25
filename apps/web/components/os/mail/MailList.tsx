'use client'
/**
 * The conversation list (ADR-0023). Presentational: everything arrives as props, so the proof can
 * render it with fixtures. Each row answers "who, about what, and do I owe something" in one look.
 */
import { ACTIONABLE, clientKind, leadKind, type MailThread } from '@/lib/mail/views'
import type { MailCopy } from '@/lib/os-i18n/mail'
import { UNKNOWN_SENDER } from '@/lib/mail/normalization'
import { shortDate } from './format'

export interface MailListProps {
  threads: MailThread[]
  selectedId: string | null
  copy: MailCopy
  intlLocale: string
  today: string
  onSelect: (id: string) => void
  /** Selection mode for bulk actions: a checkbox per row; tapping the row still opens it. */
  selection?: { checked: ReadonlySet<string>; onToggle: (id: string) => void } | null
}

export function senderLabel(sender: string | null | undefined, copy: MailCopy): string {
  if (!sender || sender === UNKNOWN_SENDER) return copy.unknownSender
  return sender
}

export function MailList({ threads, selectedId, copy, intlLocale, today, onSelect, selection }: MailListProps) {
  return (
    <ul className="mail-list" role="list">
      {threads.map(thread => {
        const kind = leadKind(thread)
        const client = clientKind(thread)
        const actionable = ACTIONABLE.has(thread.state)
        const outbound = thread.last_direction === 'outbound'
        return (
          <li key={thread.id} className={selection ? 'mail-li-select' : undefined}>
            {selection && (
              <label className="mail-check">
                <input type="checkbox" checked={selection.checked.has(thread.id)} onChange={() => selection.onToggle(thread.id)} aria-label={`${copy.actions.selectRow}: ${thread.subject || copy.noSubject}`} />
              </label>
            )}
            <button type="button" aria-current={selectedId === thread.id ? 'true' : undefined} onClick={() => onSelect(thread.id)}
              className={`mail-row${selectedId === thread.id ? ' is-selected' : ''}${thread.unread ? ' is-unread' : ''}`}>
              <span className="mail-row-top">
                {thread.unread && <span className="mail-dot" aria-label={copy.views.unread} />}
                <span className="mail-row-who">{thread.business_label || senderLabel(thread.sender, copy)}</span>
                <time className="mail-row-time" dateTime={thread.updated_at}>{shortDate(thread.updated_at, intlLocale, today, copy)}</time>
              </span>
              <span className="mail-row-subject">{outbound && <span className="mail-row-you">{copy.you}: </span>}{thread.subject || copy.noSubject}</span>
              {thread.preview && <span className="mail-row-preview">{thread.preview}</span>}
              <span className="mail-row-tags">
                {thread.quarantine
                  ? <span className="mail-tag is-muted">{copy.spam.reason[thread.quarantine] ?? copy.views.spam}</span>
                  : <>
                    {(actionable || thread.state === 'waiting') && <span className={`mail-tag${actionable ? ' is-action' : ''}`}>{copy.states[thread.state]}</span>}
                    {kind && <span className={`mail-tag${kind === 'potential' ? ' is-potential' : ''}`}>{kind === 'possibleMatch' ? `${copy.leadKinds.possibleMatch}: ${copy.context.lead}` : copy.leadKinds[kind]}</span>}
                    {client && <span className={`mail-tag${client === 'possibleMatch' ? ' is-potential' : ''}`}>{client === 'possibleMatch' ? `${copy.leadKinds.possibleMatch}: ${copy.context.client}` : copy.context.client}</span>}
                    {['billing', 'system', 'routine'].includes(thread.classification) && <span className="mail-tag is-muted">{copy.categories[thread.classification]}</span>}
                    {thread.has_draft && <span className="mail-tag is-muted">{copy.views.drafts}</span>}
                    {thread.has_attachments && <span className="mail-tag is-muted">{copy.attachments}</span>}
                  </>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
