/**
 * Business context for one conversation (ADR-0023): who wrote, what Maxpromo knows about them,
 * what is open between them, and the one next step. Read-only, from the OS records.
 *
 * Identity rules stay as in ADR-0021: a lead or client the owner linked is "confirmed"; a record
 * whose email equals the sender is a "possible" match, shown as such and never acted on alone.
 * A message classified as an enquiry with no CRM record is a "potential lead".
 */
import type { Sql } from '@/lib/commercial/types'
import { invoiceBalance, daysBetween, type InvoiceForMoney } from '@/lib/commercial/money'
import { leadStage, type LeadStage } from '@/lib/commercial/pipeline'
import { q } from '@/lib/commercial/records'
import { HOSTINGER_MAILBOX } from './hostingerIngestion'

export type ConversationState = 'needs_reply' | 'customer_replied' | 'follow_up_overdue' | 'follow_up_due' | 'waiting' | 'no_next_step' | 'quarantined' | 'archived'
export type NextStepKey = 'reply' | 'replyAndSaveLead' | 'followUpNow' | 'waitUntil' | 'chaseInvoice' | 'chaseQuote' | 'setFollowUpOrArchive' | 'none'
export interface ContextLead { id: string; name: string | null; company: string | null; email: string | null; stage: LeadStage | null; status: string; value: number | null; currency: string; source: string; nextAction: string | null; nextActionAt: string | null; confirmed: boolean }
export interface ContextClient { id: string; name: string; company: string | null; email: string | null; status: string; confirmed: boolean }
export interface ThreadContext {
  sender: string | null
  lead: ContextLead | null
  client: ContextClient | null
  potentialLead: boolean
  projects: { id: string; title: string; stage: string; dueDate: string | null }[]
  quotes: { id: string; number: string; status: string; total: number; currency: string; validUntil: string | null; sentAt: string | null }[]
  invoices: { id: string; number: string; state: string; total: number; open: number; currency: string; dueDate: string | null; daysOverdue: number }[]
  followUps: { id: string; dueOn: string; reason: string }[]
  otherThreads: { id: string; subject: string; updatedAt: string; needsReply: boolean }[]
  lastInbound: string | null
  lastOutbound: string | null
  state: ConversationState
  followUpOn: string | null
  nextAction: string | null
  next: { key: NextStepKey; params: Record<string, string | number> }
}

interface ThreadRow { id: string; classification: string; needs_reply: boolean; waiting: boolean; archived: boolean; quarantine: string | null; follow_up_on: string | null; next_action: string | null }

/** The conversation state Marcel acts on. One definition, used by the Inbox, attention and Max. */
export function conversationState(t: Pick<ThreadRow, 'needs_reply' | 'waiting' | 'archived' | 'quarantine' | 'follow_up_on'>, lastInbound: string | null, lastOutbound: string | null, today: string): ConversationState {
  if (t.quarantine) return 'quarantined'
  if (t.archived) return 'archived'
  if (t.needs_reply) return lastOutbound && lastInbound && lastInbound > lastOutbound ? 'customer_replied' : 'needs_reply'
  if (t.follow_up_on && t.follow_up_on < today) return 'follow_up_overdue'
  if (t.follow_up_on && t.follow_up_on === today) return 'follow_up_due'
  if (t.waiting) return 'waiting'
  return 'no_next_step'
}

export async function threadContext(sql: Sql, threadId: string, today: string): Promise<ThreadContext | null> {
  const [t] = await sql`SELECT id,classification,needs_reply,waiting,archived,quarantine,follow_up_on::text AS follow_up_on,next_action FROM mail.threads WHERE id=${threadId}::uuid` as ThreadRow[]
  if (!t) return null
  const [times] = await sql`SELECT max(received_at) FILTER (WHERE direction='inbound') AS inbound, max(received_at) FILTER (WHERE direction='outbound') AS outbound,
      (SELECT sender FROM mail.messages WHERE thread_id=${threadId}::uuid AND direction='inbound' ORDER BY received_at DESC LIMIT 1) AS sender,
      (SELECT recipients->>0 FROM mail.messages WHERE thread_id=${threadId}::uuid AND direction='outbound' ORDER BY received_at DESC LIMIT 1) AS outbound_to
    FROM mail.messages WHERE thread_id=${threadId}::uuid` as { inbound: Date | null; outbound: Date | null; sender: string | null; outbound_to: string | null }[]
  // The other party: the latest inbound sender, or whom Maxpromo wrote to in a new conversation.
  const counterpart = (times?.sender ?? times?.outbound_to ?? null)?.toLowerCase() ?? null
  const sender = counterpart && counterpart !== HOSTINGER_MAILBOX && !counterpart.endsWith('.invalid') ? counterpart : null
  const links = await sql`SELECT entity_kind,entity_id,match_status FROM mail.business_links WHERE thread_id=${threadId}::uuid` as { entity_kind: string; entity_id: string; match_status: string }[]
  const confirmed = (kind: string) => links.find(l => l.entity_kind === kind && l.match_status === 'owner_confirmed')?.entity_id ?? null

  const leadRows = await sql`SELECT id::text,name,company,email,status,value,currency,source,next_action,next_action_at::text AS next_action_at FROM os_leads
    WHERE id::text=${confirmed('lead')} OR (${sender}::text IS NOT NULL AND lower(email)=${sender}) ORDER BY (id::text=${confirmed('lead')}) DESC NULLS LAST, created_at DESC LIMIT 1` as
    { id: string; name: string | null; company: string | null; email: string | null; status: string; value: string | null; currency: string; source: string; next_action: string | null; next_action_at: string | null }[]
  const clientRows = await sql`SELECT id::text,name,company,email,status FROM os_clients
    WHERE id::text=${confirmed('client')} OR (${sender}::text IS NOT NULL AND lower(email)=${sender}) ORDER BY (id::text=${confirmed('client')}) DESC NULLS LAST, created_at DESC LIMIT 1` as
    { id: string; name: string; company: string | null; email: string | null; status: string }[]
  const l = leadRows[0], c = clientRows[0]
  const lead: ContextLead | null = l ? { id: l.id, name: l.name, company: l.company, email: l.email, stage: leadStage(l.status), status: l.status, value: l.value === null ? null : Number(l.value), currency: l.currency, source: l.source, nextAction: l.next_action, nextActionAt: l.next_action_at, confirmed: l.id === confirmed('lead') } : null
  const client: ContextClient | null = c ? { id: c.id, name: c.name, company: c.company, email: c.email, status: c.status, confirmed: c.id === confirmed('client') } : null
  const leadId = lead?.id ?? null, clientId = client?.id ?? null, projectId = confirmed('project')

  const [projects, quotes, invoiceRows, followUps, otherThreads] = await Promise.all([
    q<{ id: string; title: string; stage: string; due_date: string | null }>(sql`SELECT id::text,title,stage,due_date::text AS due_date FROM os_jobs WHERE id::text=${projectId} OR client_id::text=${clientId} OR lead_id::text=${leadId} ORDER BY created_at DESC LIMIT 5`),
    q<{ id: string; angebot_number: string; status: string; total: string; currency: string; valid_until: string | null; sent_at: Date | null }>(sql`SELECT id::text,angebot_number,status,total,currency,valid_until::text AS valid_until,sent_at FROM os_angebote
      WHERE client_id::text=${clientId} OR lead_id::text=${leadId} OR (${sender}::text IS NOT NULL AND lower(client_email)=${sender}) ORDER BY created_at DESC LIMIT 5`),
    q<InvoiceForMoney>(sql`SELECT i.id::text AS id,i.invoice_number,i.client_name,i.client_id,i.status,i.total,i.anzahlung,i.restbetrag,i.currency,i.due_date::text AS due_date,i.sent_at,i.created_at,
        money.invoice_paid(i.id)::text AS paid_amount
      FROM os_invoices i WHERE i.status<>'cancelled' AND (i.client_id::text=${clientId} OR (${sender}::text IS NOT NULL AND lower(i.client_email)=${sender})) ORDER BY i.created_at DESC LIMIT 6`),
    q<{ id: string; due_on: string; reason: string }>(sql`SELECT id::text,due_on::text AS due_on,reason FROM os_followups WHERE status='open' AND (lead_id::text=${leadId} OR client_id::text=${clientId}) ORDER BY due_on LIMIT 5`),
    q<{ id: string; subject: string; updated_at: Date; needs_reply: boolean }>(sql`SELECT t.id::text,t.subject,t.updated_at,t.needs_reply FROM mail.threads t WHERE t.id<>${threadId}::uuid AND t.quarantine IS NULL AND t.trashed=false
      AND ${sender}::text IS NOT NULL AND EXISTS(SELECT 1 FROM mail.messages m WHERE m.thread_id=t.id AND (m.sender=${sender} OR m.recipients ? ${sender ?? ''}))
      ORDER BY t.updated_at DESC LIMIT 5`),
  ])
  const invoices = invoiceRows.map(inv => invoiceBalance(inv, today)).map(b => ({ id: b.id, number: b.number, state: b.state, total: b.total, open: b.open, currency: b.currency, dueDate: b.dueDate, daysOverdue: b.daysOverdue }))
  const lastInbound = times?.inbound ? new Date(times.inbound).toISOString() : null
  const lastOutbound = times?.outbound ? new Date(times.outbound).toISOString() : null
  const state = conversationState(t, lastInbound, lastOutbound, today)
  const potentialLead = !lead && !client && t.classification === 'lead'
  const quoteRows = quotes.map(q => ({ id: q.id, number: q.angebot_number, status: q.status, total: Number(q.total), currency: q.currency, validUntil: q.valid_until, sentAt: q.sent_at ? new Date(q.sent_at).toISOString() : null }))

  let next: ThreadContext['next'] = { key: 'none', params: {} }
  const overdue = invoices.find(i => i.state === 'overdue')
  const waitingQuote = quoteRows.find(q => q.status === 'sent')
  if (state === 'quarantined' || state === 'archived') next = { key: 'none', params: {} }
  else if (state === 'needs_reply' || state === 'customer_replied') next = potentialLead ? { key: 'replyAndSaveLead', params: {} } : { key: 'reply', params: {} }
  else if (state === 'follow_up_overdue' || state === 'follow_up_due') next = { key: 'followUpNow', params: { days: t.follow_up_on ? Math.max(daysBetween(t.follow_up_on, today), 0) : 0 } }
  else if (overdue) next = { key: 'chaseInvoice', params: { number: overdue.number, days: overdue.daysOverdue } }
  else if (waitingQuote && waitingQuote.sentAt) next = { key: 'chaseQuote', params: { number: waitingQuote.number, days: daysBetween(waitingQuote.sentAt.slice(0, 10), today) } }
  else if (state === 'waiting') next = { key: 'waitUntil', params: { date: t.follow_up_on ?? '' } }
  else next = { key: 'setFollowUpOrArchive', params: {} }

  return {
    sender, lead, client, potentialLead,
    projects: projects.map(p => ({ id: p.id, title: p.title, stage: p.stage, dueDate: p.due_date })),
    quotes: quoteRows, invoices,
    followUps: followUps.map(f => ({ id: f.id, dueOn: f.due_on, reason: f.reason })),
    otherThreads: otherThreads.map(o => ({ id: o.id, subject: o.subject, updatedAt: new Date(o.updated_at).toISOString(), needsReply: o.needs_reply })),
    lastInbound, lastOutbound, state, followUpOn: t.follow_up_on, nextAction: t.next_action, next,
  }
}
