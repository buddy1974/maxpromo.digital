/**
 * Outbound mail (ADR-0023). The one place Maxpromo email leaves the OS through the mailbox.
 *
 *   - Only a stored draft is sent, at the exact revision Marcel confirmed (email.deliver). The
 *     draft is claimed with one conditional UPDATE, so a double click or a replay sends once.
 *   - Sends are never retried. A timeout or 5xx after the request left is `uncertain`: recorded,
 *     surfaced in attention, never reported as sent or as failed.
 *   - Replies thread through Hostinger itself (`inReplyTo` by folder + UID copies Message-ID and
 *     References and flags the original \Answered); Hostinger saves a copy to INBOX.Sent.
 *   - The OS records the sent message in the same conversation, closes "needs reply", opens
 *     "waiting" and sets the follow-up date.
 *   - Evidence mode uses a sink: nothing leaves, everything else is identical.
 */
import { CapabilityRefusal, UncertainOutcome, type Sql } from '@/lib/commercial/types'
import { writeAudit } from '@/lib/commercial/audit'
import { HostingerMailProvider, MailProviderError, type EmailProvider, type MessageRef, type SendPayload } from './provider'
import { HOSTINGER_ACCOUNT, HOSTINGER_MAILBOX } from './hostingerIngestion'
import { FAMILIES, PLACEHOLDER, isFamily, type FamilyId, type Language } from './identity/families'
import { renderEmail } from './identity/render'
import { draftAttachmentPayload } from './draftAttachments'

export const SENDER_DISPLAY_NAME = 'Maxpromo Digital'
export const MAX_RECIPIENTS = 20
const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/

export type OutboundTransport = Pick<EmailProvider, 'send'> & Partial<Pick<EmailProvider, 'search' | 'folders'>>
export interface TransportChoice { transport: OutboundTransport; mode: 'hostinger' | 'evidence' }

/** The live transport, the evidence sink, or null when sending is not connected or switched off. */
export function outboundTransport(env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch): TransportChoice | null {
  if (env.MAXPROMO_EVIDENCE_MODE === '1') {
    return { mode: 'evidence', transport: { async send(payload) { console.log('[mail] evidence mode: delivery suppressed', { recipients: (payload.to?.length ?? 0) + (payload.cc?.length ?? 0) + (payload.bcc?.length ?? 0) }) } } }
  }
  // Owner kill switch: one Production variable stops every outbound email without a deploy of code.
  if (env.MAIL_SEND_DISABLED === '1') return null
  const token = env.HOSTINGER_MAIL_API_TOKEN, mailbox = env.HOSTINGER_MAILBOX_RESOURCE_ID
  if (!token || !mailbox) return null
  const provider = new HostingerMailProvider({ token, mailboxResourceId: mailbox, transport: fetcher, timeoutMs: 20_000,
    gate: { enabled: true, fixtureVerified: true, isEvidenceMode: () => env.MAXPROMO_EVIDENCE_MODE === '1' } })
  return { mode: 'hostinger', transport: { send: p => provider.send(p), search: (f, c, pg) => provider.search(f, c, pg), folders: pg => provider.folders(pg) } }
}

export function normalizeRecipients(list: unknown): string[] {
  if (!Array.isArray(list)) throw new CapabilityRefusal('Recipients must be a list.')
  const out = list.map(value => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
  for (const address of out) if (address.length > 254 || !EMAIL.test(address)) throw new CapabilityRefusal(`Not a valid email address: ${address.slice(0, 80) || '(empty)'}`)
  return [...new Set(out)]
}

export interface DraftRow {
  id: string; account_id: string; thread_id: string | null; mode: 'new' | 'reply' | 'reply_all' | 'forward'; source_message_id: string | null
  to_addrs: string[]; cc_addrs: string[]; bcc_addrs: string[]; subject: string; body: string; family: string; language: Language
  entity_kind: 'lead' | 'client' | 'project' | null; entity_id: string | null; follow_up_days: number | null; status: string; revision: number
}

/** Everything that makes a draft unsendable, checked at confirmation and again at execution. */
export function sendProblems(d: Pick<DraftRow, 'to_addrs' | 'cc_addrs' | 'bcc_addrs' | 'subject' | 'body'>): string[] {
  const problems: string[] = []
  const all = [...d.to_addrs, ...d.cc_addrs, ...d.bcc_addrs]
  if (!d.to_addrs.length) problems.push('Add at least one recipient.')
  if (all.length > MAX_RECIPIENTS) problems.push(`At most ${MAX_RECIPIENTS} recipients.`)
  if (all.some(a => !EMAIL.test(a))) problems.push('One of the addresses is not valid.')
  if (!d.subject.trim()) problems.push('Add a subject.')
  if (!d.body.trim()) problems.push('Write a message.')
  if (PLACEHOLDER.test(d.subject) || PLACEHOLDER.test(d.body)) problems.push('Fill in the [[…]] gaps before sending.')
  return problems
}

interface SourceMessage { id: string; sender: string; body_text: string; preview_text: string; body_state: string; received_at: Date; provider_folder: string | null; provider_uid: string | number | null; provider_state: string }

async function recipientName(sql: Sql, d: DraftRow): Promise<string | null> {
  if (!d.entity_kind || !d.entity_id) return null
  const rows = d.entity_kind === 'lead'
    ? await sql`SELECT name FROM os_leads WHERE id::text=${d.entity_id}` as { name: string | null }[]
    : d.entity_kind === 'client' ? await sql`SELECT name FROM os_clients WHERE id::text=${d.entity_id}` as { name: string | null }[] : []
  return rows[0]?.name ?? null
}

/** The exact email a draft renders to. Used for the confirmation preview and for sending, so
 * what Marcel approved and what leaves are the same bytes. */
export async function renderDraft(sql: Sql, d: DraftRow) {
  const family: FamilyId = isFamily(d.family) ? d.family : 'reply'
  let source: SourceMessage | null = null
  if (d.source_message_id) {
    const rows = await sql`SELECT id,sender,body_text,preview_text,body_state,received_at,provider_folder,provider_uid,provider_state FROM mail.messages WHERE id=${d.source_message_id}::uuid` as SourceMessage[]
    source = rows[0] ?? null
  }
  const quoteText = source ? (source.body_state === 'preview' ? source.preview_text : source.body_text) : ''
  const rendered = renderEmail({
    family, language: d.language, body: d.body, recipientName: await recipientName(sql, d),
    quoted: source && d.mode !== 'new' && quoteText ? { from: source.sender, at: new Date(source.received_at), text: quoteText } : null,
  })
  const ref: MessageRef | null = source?.provider_folder && source.provider_uid && ['inbox', 'other'].includes(source.provider_state)
    ? { folder: source.provider_folder, uid: Number(source.provider_uid) } : null
  return { family, rendered, ref, source }
}

const addDays = (iso: string, days: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }

export interface DeliverRequest {
  draftId: string; revision: number; approvalId: string; actor: string; today: string; committed: (what: string) => void
  /** Sent by the scheduler: claims a due `scheduled` draft instead of a `draft` (0023). */
  scheduled?: boolean
}

export async function deliverDraft(sql: Sql, req: DeliverRequest, choice: TransportChoice | null = outboundTransport()) {
  if (!choice) throw new CapabilityRefusal('Sending is not connected for this mailbox. Nothing was sent.', 'unsupported')
  // One claim = one send: the row moves to 'sending' exactly once, whichever door (Marcel now, or the scheduler).
  const claimed = (req.scheduled
    ? await sql`UPDATE mail.drafts SET status='sending',updated_at=now() WHERE id=${req.draftId}::uuid AND status='scheduled' AND scheduled_for<=now() AND revision=${req.revision} RETURNING *`
    : await sql`UPDATE mail.drafts SET status='sending',updated_at=now() WHERE id=${req.draftId}::uuid AND status='draft' AND revision=${req.revision} RETURNING *`) as DraftRow[]
  const d = claimed[0]
  if (!d) throw new CapabilityRefusal('This draft changed or was already sent. Review it again.', 'conflict')
  // A refused scheduled send goes back to Marcel as a draft with the reason — visible, never retried silently.
  const release = (reason = '') => (req.scheduled
    ? sql`UPDATE mail.drafts SET status='draft',scheduled_for=NULL,scheduled_approval=NULL,schedule_error=${reason.slice(0, 300) || 'not sent'},updated_at=now() WHERE id=${d.id}::uuid AND status='sending'`
    : sql`UPDATE mail.drafts SET status='draft' WHERE id=${d.id}::uuid AND status='sending'`)
  const reasonOf = (error: unknown) => (error instanceof Error ? error.message : 'not sent')
  try {
    const problems = sendProblems(d)
    if (problems.length) throw new CapabilityRefusal(problems.join(' '))
    if (d.thread_id) {
      const t = await sql`SELECT quarantine FROM mail.threads WHERE id=${d.thread_id}::uuid` as { quarantine: string | null }[]
      if (t[0]?.quarantine) throw new CapabilityRefusal('This conversation is in Spam. Mark it as not spam before replying.')
    }
  } catch (error) { await release(reasonOf(error)); throw error }

  let files: Awaited<ReturnType<typeof draftAttachmentPayload>>
  try { files = await draftAttachmentPayload(sql, d.id) } catch (error) { await release(reasonOf(error)); throw error }
  const { family, rendered, ref } = await renderDraft(sql, d)
  const payload: SendPayload = {
    to: d.to_addrs, ...(d.cc_addrs.length ? { cc: d.cc_addrs } : {}), ...(d.bcc_addrs.length ? { bcc: d.bcc_addrs } : {}),
    displayName: SENDER_DISPLAY_NAME, subject: d.subject.replace(/[\r\n]/g, ' ').trim(), text: rendered.text, html: rendered.html,
    ...(ref && (d.mode === 'reply' || d.mode === 'reply_all') ? { inReplyTo: ref } : {}),
    ...(ref && d.mode === 'forward' ? { forwardOf: ref } : {}),
    ...(files.send.length ? { attachments: files.send } : {}),
  }
  try {
    await choice.transport.send(payload)
  } catch (error) {
    if (error instanceof MailProviderError && error.outcome === 'uncertain') {
      // The engine records this as an `uncertain` audit row, which attention surfaces.
      await sql`UPDATE mail.drafts SET status='uncertain',updated_at=now() WHERE id=${d.id}::uuid`
      throw new UncertainOutcome('The mail server did not confirm the send. It may have been delivered.')
    }
    await release('The mail server refused the message. Nothing was sent.')
    throw new CapabilityRefusal('The mail server refused the message. Nothing was sent.', 'unsupported')
  }
  req.committed('Email accepted by the mail server')

  /* Bookkeeping after the external effect: failures here are reported as "sent, recording incomplete". */
  const classification = d.entity_kind === 'client' ? 'client' : d.entity_kind === 'lead' ? 'lead' : 'other'
  const recorded = await recordOutbound(sql, {
    accountId: d.account_id, threadId: d.thread_id, providerKey: `outbound:${d.id}`, to: d.to_addrs, cc: d.cc_addrs, bcc: d.bcc_addrs,
    subject: payload.subject!, text: rendered.text, preview: d.body.slice(0, 200), attachments: files.meta, classification,
    entity: d.entity_kind && d.entity_id ? { kind: d.entity_kind, id: d.entity_id } : null,
    followUpDays: d.follow_up_days ?? FAMILIES[family].followUpDays, today: req.today, actor: req.actor, approvalId: req.approvalId,
    audit: { draft_id: d.id, family }, threaded: Boolean(payload.inReplyTo || payload.forwardOf), choice, timeline: { draft_id: d.id },
  })
  await sql`UPDATE mail.drafts SET status='sent',sent_at=now(),sent_message_id=${recorded.messageId}::uuid,thread_id=${recorded.threadId}::uuid,schedule_error=NULL WHERE id=${d.id}::uuid`
  // The Sent folder copy is the record of what left; the draft keeps only the files' metadata.
  if (files.meta.length) await sql`UPDATE mail.draft_attachments SET content=NULL WHERE draft_id=${d.id}::uuid`
  return { threadId: recorded.threadId, messageId: recorded.messageId, threaded: Boolean(payload.inReplyTo || payload.forwardOf), transport: choice.mode }
}

/**
 * Scheduled send (0023): deliver every confirmed draft whose time has come, each exactly once.
 * Called by the cron route and opportunistically while the OS is open; concurrent sweeps are safe
 * because the claim inside deliverDraft is a single conditional UPDATE. Each outcome is audited.
 */
export async function sweepScheduledMail(sql: Sql, today: string, choice: TransportChoice | null = outboundTransport()): Promise<{ sent: number; failed: number; uncertain: number }> {
  const due = await sql`SELECT id, revision, scheduled_approval, created_by FROM mail.drafts WHERE status='scheduled' AND scheduled_for<=now() ORDER BY scheduled_for LIMIT 10` as { id: string; revision: number; scheduled_approval: string; created_by: string }[]
  const out = { sent: 0, failed: 0, uncertain: 0 }
  for (const d of due) {
    let outcome: 'succeeded' | 'failed' | 'uncertain' = 'succeeded', error: string | undefined
    try {
      await deliverDraft(sql, { draftId: d.id, revision: d.revision, approvalId: d.scheduled_approval, actor: d.created_by, today, committed: () => undefined, scheduled: true }, choice)
      out.sent++
    } catch (e) {
      if (e instanceof CapabilityRefusal && e.code === 'conflict') continue // another sweep took it
      outcome = e instanceof UncertainOutcome ? 'uncertain' : 'failed'
      error = e instanceof Error ? e.message.slice(0, 200) : 'failed'
      if (outcome === 'uncertain') out.uncertain++; else out.failed++
    }
    await writeAudit(sql, { actor: 'scheduler', channel: 'os', operation: 'email.scheduled.send', entityType: 'mail_draft', entityId: d.id, approvalId: d.scheduled_approval, outcome, error }).catch(() => undefined)
  }
  return out
}

export interface OutboundRecord {
  accountId: string
  /** The conversation it belongs to; null starts one keyed by providerKey. */
  threadId: string | null
  /** provider_thread_id for a new conversation (default: providerKey). Lets an invoice and its
   * reminders share one conversation. */
  threadKey?: string
  providerKey: string
  to: string[]; cc: string[]; bcc: string[]
  subject: string
  text: string
  preview: string
  attachments: { filename: string; contentType: string; size: number }[]
  classification: 'client' | 'lead' | 'other'
  entity: { kind: 'lead' | 'client' | 'project'; id: string } | null
  followUpDays: number | null
  today: string
  actor: string
  approvalId: string | null
  audit: Record<string, unknown>
  threaded: boolean
  choice: TransportChoice
  timeline: Record<string, unknown>
}

/** What every email Maxpromo sent leaves behind, whichever door sent it (a draft, an invoice, a
 * reminder): the message in its conversation, the conversation waiting for an answer with its
 * follow-up date, the business link, the mail audit, the timeline line and the Message-ID read
 * back so the customer's answer threads. One implementation. */
export async function recordOutbound(sql: Sql, r: OutboundRecord): Promise<{ threadId: string; messageId: string }> {
  let threadId = r.threadId
  if (!threadId && r.threadKey) {
    const existing = await sql`SELECT id FROM mail.threads WHERE account_id=${r.accountId} AND provider_thread_id=${r.threadKey}` as { id: string }[]
    threadId = existing[0]?.id ?? null
  }
  if (!threadId) {
    const rows = await sql`INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at)
      VALUES(${r.accountId},${r.threadKey ?? r.providerKey},${r.subject},${r.classification},false,now()) RETURNING id` as { id: string }[]
    threadId = rows[0].id
  }
  const [message] = await sql`INSERT INTO mail.messages(thread_id,account_id,provider_message_id,sender,recipients,cc,subject,body_text,received_at,is_read,attachments,
      body_state,preview_text,provider_state,provider_folder,direction)
    VALUES(${threadId}::uuid,${r.accountId},${r.providerKey},${HOSTINGER_MAILBOX},${JSON.stringify(r.to)}::jsonb,${JSON.stringify(r.cc)}::jsonb,
      ${r.subject},${r.text},now(),true,${JSON.stringify(r.attachments)}::jsonb,'complete',${r.preview},'other','INBOX.Sent','outbound')
    RETURNING id` as { id: string }[]
  await sql`UPDATE mail.threads SET needs_reply=false,waiting=${r.followUpDays !== null},follow_up_on=${r.followUpDays !== null ? addDays(r.today, r.followUpDays) : null}::date,
    archived=false,updated_at=now() WHERE id=${threadId}::uuid`
  if (r.entity) {
    await sql`INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status) VALUES(${threadId}::uuid,${r.entity.kind},${r.entity.id},'owner_confirmed')
      ON CONFLICT(thread_id,entity_kind,entity_id) DO UPDATE SET match_status='owner_confirmed'`
  }
  await sql`INSERT INTO mail.action_audit(thread_id,action,status,payload,approval_id) VALUES(${threadId}::uuid,'send','done',
    ${JSON.stringify({ actor: r.actor, ...r.audit, recipients: r.to.length + r.cc.length + r.bcc.length, attachments: r.attachments.length, threaded: r.threaded, transport: r.choice.mode })}::jsonb,${r.approvalId})`
  await recordTimeline(sql, r.entity, threadId!, r.subject, r.actor, r.timeline)
  if (r.choice.mode === 'hostinger') await recordSentMessageId(sql, r.choice.transport, message.id, r.to[0], r.subject, r.today).catch(() => undefined)
  return { threadId: threadId!, messageId: message.id }
}

/** The lead or client timeline shows the email next to calls, quotes and invoices. */
async function recordTimeline(sql: Sql, entity: OutboundRecord['entity'], threadId: string, subject: string, actor: string, detail: Record<string, unknown>) {
  const leadId = entity?.kind === 'lead' ? entity.id : null
  const clientId = entity?.kind === 'client' ? entity.id : null
  const links = leadId || clientId ? [] : await sql`SELECT entity_kind,entity_id FROM mail.business_links WHERE thread_id=${threadId}::uuid AND match_status='owner_confirmed' AND entity_kind IN ('lead','client')` as { entity_kind: string; entity_id: string }[]
  const lead = leadId ?? links.find(l => l.entity_kind === 'lead')?.entity_id ?? null
  const client = clientId ?? links.find(l => l.entity_kind === 'client')?.entity_id ?? null
  if (!lead && !client) return
  await sql`INSERT INTO os_activities(lead_id,client_id,kind,channel,summary,detail,actor) VALUES(${lead}::uuid,${client}::uuid,'email_sent','email',${`Email sent: ${subject}`.slice(0, 300)},${JSON.stringify({ thread_id: threadId, ...detail })}::jsonb,${actor})`
  if (lead) await sql`UPDATE os_leads SET last_interaction_at=now() WHERE id=${lead}::uuid`
}

/** Hostinger generates the Message-ID; a customer's reply references it. Read it back from the
 * Sent copy so that reply joins this conversation (mail.accept_hostinger, 0017). Best effort. */
async function recordSentMessageId(sql: Sql, transport: OutboundTransport, messageId: string, to: string, subject: string, today: string) {
  if (!transport.folders || !transport.search) return
  const folders = await transport.folders({ perPage: 100 })
  const sent = folders.data.find(f => f.specialUse === '\\Sent')?.path
  if (!sent) return
  const page = await transport.search(sent, { to, subject: subject.slice(0, 200), since: today }, { perPage: 5, sort: '-date' })
  const hit = page.data.find(m => m.messageId && (m.subject ?? '') === subject)
  if (!hit?.messageId) return
  await sql`UPDATE mail.messages SET rfc_message_id=${hit.messageId},provider_uid=${hit.uid},provider_folder=${hit.path} WHERE id=${messageId}::uuid`
  // A copy delivered to the mailbox itself before this readback is the same message (0021).
  await sql`SELECT mail.merge_self_copy(account_id, id) FROM mail.messages WHERE id=${messageId}::uuid`.catch(() => undefined)
}

export { HOSTINGER_ACCOUNT }

export interface DocumentSend {
  to: string[]
  mail: { subject: string; html: string; text: string; family: string; attachments: NonNullable<SendPayload['attachments']>; attachmentMeta: OutboundRecord['attachments'] }
  /** e.g. `doc:invoice:<id>` — an invoice and its reminders form one conversation. */
  threadKey: string
  /** Unique per send, e.g. `doc:invoice:<id>:<approval id>`. */
  sendKey: string
  entity: OutboundRecord['entity']
  actor: string
  approvalId: string | null
  today: string
  audit: Record<string, unknown>
  committed: (what: string) => void
}

/** A quotation, invoice or reminder leaves through the mailbox like every other Maxpromo email
 * (ADR-0025): sent once, never retried, an unanswered send is uncertain, and the message is
 * recorded in its conversation so the client's answer threads. */
export async function sendDocumentMail(sql: Sql, d: DocumentSend, choice: TransportChoice | null = outboundTransport()) {
  if (!choice) throw new CapabilityRefusal('Sending is not connected for this mailbox. Nothing was sent.', 'unsupported')
  const to = normalizeRecipients(d.to)
  if (!to.length || to.length > MAX_RECIPIENTS) throw new CapabilityRefusal('Give between one and twenty recipients.')
  const subject = d.mail.subject.replace(/[\r\n]/g, ' ').trim()
  try {
    await choice.transport.send({ to, displayName: SENDER_DISPLAY_NAME, subject, text: d.mail.text, html: d.mail.html, attachments: d.mail.attachments })
  } catch (error) {
    if (error instanceof MailProviderError && error.outcome === 'uncertain') throw new UncertainOutcome('The mail server did not confirm the send. It may have been delivered.')
    throw new CapabilityRefusal('The mail server refused the message. Nothing was sent.', 'unsupported')
  }
  d.committed('Email accepted by the mail server')
  const recorded = await recordOutbound(sql, {
    accountId: HOSTINGER_ACCOUNT, threadId: null, threadKey: `outbound:${d.threadKey}`, providerKey: `outbound:${d.sendKey}`, to, cc: [], bcc: [],
    subject, text: d.mail.text, preview: d.mail.text.slice(0, 200), attachments: d.mail.attachmentMeta,
    classification: d.entity?.kind === 'lead' ? 'lead' : d.entity ? 'client' : 'other', entity: d.entity,
    // Payment checks and quote follow-ups live in os_followups; the conversation does not add a second reminder.
    followUpDays: null, today: d.today, actor: d.actor, approvalId: d.approvalId, audit: { ...d.audit, family: d.mail.family }, threaded: false, choice,
    timeline: d.audit,
  })
  return { ...recorded, transport: choice.mode, to }
}
