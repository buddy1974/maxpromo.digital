/**
 * lib/commercial/capabilities/views.ts
 *
 * The owner's questions, answered from the records rather than from a
 * dashboard: what needs me, what can make money today, how is the business
 * doing, what is waiting for my approval, and "find that one".
 *
 * Every figure names what it is. Pipeline is not money; weighted pipeline is a
 * planning figure; invoiced is not received; outstanding is the open balance
 * of issued invoices; recurring is normalised to per month. Currencies are
 * never added together (lib/commercial/money.ts).
 *
 * Ranking money-today across currencies orders by amount as stated — a GBP
 * and a EUR figure are close enough to order work by, never to total.
 */

import {
  q, addDays, clientLabel, eur, focus, isoDate, leadLabel, searchClients, searchLeads, stageText, type LeadRow,
} from '../records'
import { OPEN_STAGES, STAGE_WEIGHT, leadStage, statusesFor } from '../pipeline'
import { addTo, daysBetween, formatPerCurrency, monthlyEquivalent, receivables, type PerCurrency } from '../money'
import { loadInvoicesForMoney } from './documents'
import { railIssues } from '@/lib/money/attention'
import { openAgentEvents, type StoredAgentEvent } from '../agent-events'
import type { AnyCapability, CapabilityContext, CapabilityDefinition, CapabilityResult, FocusRef } from '../types'
import { v } from '../validate'

interface Item {
  area: 'SALES' | 'MONEY' | 'CLIENT' | 'SYSTEM' | 'AGENT'
  /** English sentence for the brief and notices; interfaces render `msg` in their own locale. */
  text: string
  msg: AttentionMessage
  /** Amount at stake, in the item's own currency; 0 when none. */
  amount: number
  currency: string
  /** 0..1 — how likely acting now turns into money. */
  probability: number
  /** 1..3 — how much waiting costs. */
  urgency: number
  action: string
  ref?: FocusRef
  commercial: boolean
}

/** One key per item kind plus its values, so /os can render the sentence in German or English
 * (risk 109). Values are record data (names, numbers, dates), never translated. */
export type AttentionKey = 'enquiryNew' | 'emailReplied' | 'emailFollowUp' | 'leadReplied' | 'negotiationQuiet' | 'discoveryNoStep' | 'followUp' | 'angebotWaiting' | 'angebotExpired'
  | 'angebotNotInvoiced' | 'projectNotInvoiced' | 'invoiceOverdue' | 'invoiceDraft' | 'renewal' | 'incident' | 'projectLate'
  | 'approvalsWaiting' | 'uncertainSend' | 'paymentsDisagree' | 'agentEvent' | 'moneyDispute' | 'moneyUnapplied' | 'payoutFailed' | 'payoutUnreconciled' | 'emailBounced'
export interface AttentionMessage { key: AttentionKey; params: Record<string, string | number> }
const m = (key: AttentionKey, params: Record<string, string | number> = {}): AttentionMessage => ({ key, params })

function score(i: Item): number {
  return (i.amount || 100) * i.probability * i.urgency
}

async function collect(ctx: CapabilityContext): Promise<Item[]> {
  const today = ctx.today
  const [leads, fups, sentAngebote, acceptedNoDeposit, completedNoFinal, renewals, incidents, lateJobs, approvals, uncertain, invoices, intakes] = await Promise.all([
    q<LeadRow>(ctx.sql`SELECT * FROM os_leads WHERE status = ANY(${statusesFor([...OPEN_STAGES])})`),
    q<{ id: string; due_on: string; reason: string; lead_id: string | null; company: string | null; name: string | null; city: string | null; value: string | null; currency: string | null }>(ctx.sql`SELECT f.id, f.due_on::text AS due_on, f.reason, f.lead_id, l.company, l.name, l.city, l.value, l.currency
            FROM os_followups f LEFT JOIN os_leads l ON l.id = f.lead_id
            WHERE f.status = 'open' AND f.due_on <= ${today} AND f.invoice_id IS NULL`),
    q<{ id: string; angebot_number: string; client_name: string; total: string; currency: string; sent_at: Date | null; valid_until: string | null }>(ctx.sql`SELECT id, angebot_number, client_name, total, currency, sent_at, valid_until::text AS valid_until FROM os_angebote WHERE status = 'sent'`),
    q<{ id: string; angebot_number: string; client_name: string; total: string; currency: string }>(ctx.sql`SELECT a.id, a.angebot_number, a.client_name, a.total, a.currency FROM os_angebote a
            WHERE a.status = 'accepted' AND NOT EXISTS (SELECT 1 FROM os_invoices i WHERE i.angebot_id = a.id)`),
    q<{ id: string; title: string; value: string | null }>(ctx.sql`SELECT j.id, j.title, j.value FROM os_jobs j
            WHERE j.stage = 'completed' AND NOT EXISTS (SELECT 1 FROM os_invoices i WHERE i.job_id = j.id AND i.kind IN ('final', 'standard'))`),
    q<{ id: string; service: string; amount: string; currency: string; next_renewal: string; name: string; company: string | null }>(ctx.sql`SELECT r.id, r.service, r.amount, r.currency, r.next_renewal::text AS next_renewal, c.name, c.company FROM os_recurring r JOIN os_clients c ON c.id = r.client_id
            WHERE r.status = 'active' AND r.next_renewal <= ${addDays(today, 14)}`),
    q<{ id: string; title: string; severity: string; status: string; client_id: string | null }>(ctx.sql`SELECT i.id, i.title, i.severity, i.status, i.client_id FROM os_incidents i WHERE i.status IN ('open', 'investigating')`),
    q<{ id: string; title: string; due_date: string }>(ctx.sql`SELECT id, title, due_date::text AS due_date FROM os_jobs WHERE due_date < ${today} AND stage NOT IN ('completed', 'invoiced', 'lead', 'discovery', 'proposal')`),
    q<{ id: string; summary: string; capability: string }>(ctx.sql`SELECT id, summary, capability FROM os_approvals WHERE status = 'pending' AND expires_at > now() ORDER BY created_at`),
    /* Uncertain sends, and approvals claimed for execution that never reported
       back (the process died mid-action): both need a human look, not a retry. */
    q<{ operation: string; entity_type: string | null; entity_id: string | null; created_at: Date }>(ctx.sql`
      SELECT operation, entity_type, entity_id, created_at FROM os_audit WHERE outcome = 'uncertain' AND created_at > now() - interval '7 days'
      UNION ALL
      SELECT capability || ' (' || summary || ')', NULL, id::text, decided_at FROM os_approvals
      WHERE status = 'executing' AND decided_at < now() - interval '15 minutes'`),
    loadInvoicesForMoney(ctx),
    /* Enquiries a channel handed to the OS (ADR-0021): the channel each lead last arrived through. */
    q<{ lead_id: string; source: string }>(ctx.sql`SELECT DISTINCT ON (lead_id) lead_id::text AS lead_id, source FROM os_intake_receipts ORDER BY lead_id, received_at DESC`),
  ])
  const [agentEvents, conversations, rail, bounced] = await Promise.all([agentAttention(ctx), conversationAttention(ctx), railIssues(ctx.sql), bouncedMail(ctx)])

  const items: Item[] = []
  /* Email conversations Marcel wrote in (ADR-0023): the customer answered, or the follow-up he
     planned is due. "Needs reply" on a first message stays in the email row below the items. */
  for (const c of conversations) {
    const who = c.label ?? c.counterpart ?? c.subject
    const ref = focus('email_thread', c.id, c.subject.slice(0, 60))
    const area = c.kind === 'client' ? 'CLIENT' : 'SALES'
    if (c.replied) items.push({ area, text: `${who} replied to your email “${c.subject}” — answer them`, msg: m('emailReplied', { who, subject: c.subject }), amount: 0, currency: 'EUR', probability: 0.4, urgency: 3, action: `Open email thread ${c.id}`, ref, commercial: c.kind !== 'client' })
    else if (c.follow_up_on && c.follow_up_on <= today) {
      const days = daysBetween(c.follow_up_on, today)
      items.push({ area, text: `Follow up with ${who} on “${c.subject}”${days > 0 ? ` (due ${days} day(s) ago)` : ' (due today)'}`, msg: m('emailFollowUp', { who, subject: c.subject, days }), amount: 0, currency: 'EUR', probability: 0.25, urgency: days > 0 ? 3 : 2, action: `Open email thread ${c.id}`, ref, commercial: c.kind !== 'client' })
    }
  }
  const leadValue = (l: { value: string | null }) => Number(l.value ?? 0)
  const intakeSource = new Map(intakes.map((r) => [r.lead_id, r.source]))

  for (const l of leads) {
    const s = leadStage(l.status)!
    const idle = daysBetween(isoDate(l.last_interaction_at ?? l.created_at) ?? today, today)
    const ref = focus('lead', l.id, leadLabel(l))
    /* A channel enquiry nobody has answered yet: the first thing a sales day needs. It leaves
       attention as soon as the lead moves past 'discovered'. */
    if (s === 'discovered' && intakeSource.has(l.id)) items.push({ area: 'SALES', text: `New enquiry from ${leadLabel(l)} (${intakeSource.get(l.id)}) — reply`, msg: m('enquiryNew', { lead: leadLabel(l), source: intakeSource.get(l.id)! }), amount: leadValue(l), currency: l.currency, probability: 0.3, urgency: 3, action: `Write ${l.company ?? l.name}`, ref, commercial: true })
    else if (s === 'responded') items.push({ area: 'SALES', text: `${leadLabel(l)} replied — answer them`, msg: m('leadReplied', { lead: leadLabel(l) }), amount: leadValue(l), currency: l.currency, probability: 0.4, urgency: 3, action: `Write ${l.company ?? l.name}`, ref, commercial: true })
    else if (s === 'negotiation' && idle >= 5) items.push({ area: 'SALES', text: `Negotiation with ${leadLabel(l)} quiet for ${idle} days`, msg: m('negotiationQuiet', { lead: leadLabel(l), days: idle }), amount: leadValue(l), currency: l.currency, probability: STAGE_WEIGHT.negotiation, urgency: 2, action: `What happened with ${l.company ?? l.name}?`, ref, commercial: true })
    else if (s === 'discovery' && !l.next_action_at) items.push({ area: 'SALES', text: `${leadLabel(l)} in discovery with no next step — prepare the Angebot?`, msg: m('discoveryNoStep', { lead: leadLabel(l) }), amount: leadValue(l), currency: l.currency, probability: STAGE_WEIGHT.discovery, urgency: 2, action: `Prepare an Angebot for ${l.company ?? l.name}`, ref, commercial: true })
  }
  for (const f of fups) {
    const overdue = f.due_on < today
    items.push({
      area: 'SALES', text: `${overdue ? `Overdue since ${f.due_on}: ` : ''}${f.reason}${f.company || f.name ? ` — ${leadLabel(f)}` : ''}`,
      msg: m('followUp', { since: overdue ? f.due_on : '', reason: f.reason, lead: f.company || f.name ? leadLabel(f) : '' }),
      amount: Number(f.value ?? 0), currency: f.currency ?? 'EUR', probability: 0.2, urgency: overdue ? 3 : 2,
      action: f.lead_id ? `What happened with ${f.company ?? f.name}?` : 'Who needs follow-up?', ref: f.lead_id ? focus('lead', f.lead_id, leadLabel(f)) : undefined, commercial: true,
    })
  }
  for (const a of sentAngebote) {
    const age = a.sent_at ? daysBetween(isoDate(a.sent_at)!, today) : 0
    const expired = a.valid_until && a.valid_until < today
    if (age >= 5 || expired) items.push({ area: 'SALES', text: `Angebot ${a.angebot_number} (${a.client_name}, ${eur(a.total, a.currency)}) ${expired ? `expired ${a.valid_until}` : `waiting ${age} days`}`, msg: expired ? m('angebotExpired', { number: a.angebot_number, client: a.client_name, amount: eur(a.total, a.currency), date: a.valid_until ?? '' }) : m('angebotWaiting', { number: a.angebot_number, client: a.client_name, amount: eur(a.total, a.currency), days: age }), amount: Number(a.total), currency: a.currency, probability: expired ? 0.2 : STAGE_WEIGHT.proposal, urgency: expired ? 3 : 2, action: `Chase Angebot ${a.angebot_number}`, ref: focus('angebot', a.id, a.angebot_number), commercial: true })
  }
  for (const a of acceptedNoDeposit) {
    items.push({ area: 'MONEY', text: `Angebot ${a.angebot_number} accepted (${a.client_name}) and not invoiced`, msg: m('angebotNotInvoiced', { number: a.angebot_number, client: a.client_name }), amount: Number(a.total) / 2, currency: a.currency, probability: 0.95, urgency: 3, action: `Invoice 50% deposit for ${a.angebot_number}`, ref: focus('angebot', a.id, a.angebot_number), commercial: true })
  }
  for (const j of completedNoFinal) {
    items.push({ area: 'MONEY', text: `Project “${j.title}” completed and not finally invoiced`, msg: m('projectNotInvoiced', { title: j.title }), amount: Number(j.value ?? 0), currency: 'EUR', probability: 0.95, urgency: 3, action: `Create final invoice for ${j.title}`, ref: focus('job', j.id, j.title), commercial: true })
  }
  const rec = receivables(invoices, today)
  for (const b of rec.overdueInvoices) {
    items.push({ area: 'MONEY', text: `${b.client} owes ${eur(b.open, b.currency)} on ${b.number}, ${b.daysOverdue} days overdue`, msg: m('invoiceOverdue', { client: b.client, amount: eur(b.open, b.currency), number: b.number, days: b.daysOverdue }), amount: b.open, currency: b.currency, probability: 0.8, urgency: b.daysOverdue > 14 ? 3 : 2, action: `Remind ${b.number}`, ref: focus('invoice', b.id, b.number), commercial: true })
  }
  for (const b of rec.drafts) {
    items.push({ area: 'MONEY', text: `Draft invoice ${b.number} (${b.client}, ${eur(b.open, b.currency)}) not sent`, msg: m('invoiceDraft', { number: b.number, client: b.client, amount: eur(b.open, b.currency) }), amount: b.open, currency: b.currency, probability: 0.9, urgency: 2, action: `Send invoice ${b.number}`, ref: focus('invoice', b.id, b.number), commercial: true })
  }
  for (const r of renewals) {
    items.push({ area: 'MONEY', text: `${r.company ?? r.name}: ${r.service} renews ${r.next_renewal} (${eur(r.amount, r.currency)})`, msg: m('renewal', { client: r.company ?? r.name, service: r.service, date: r.next_renewal, amount: eur(r.amount, r.currency) }), amount: Number(r.amount), currency: r.currency, probability: 0.85, urgency: r.next_renewal <= today ? 3 : 1, action: 'Show recurring revenue', commercial: true })
  }
  for (const i of incidents) {
    const sev = ['critical', 'high'].includes(i.severity)
    items.push({ area: i.client_id ? 'CLIENT' : 'SYSTEM', text: `${i.severity.toUpperCase()} incident: ${i.title} (${i.status})`, msg: m('incident', { severity: i.severity, title: i.title, status: i.status }), amount: 0, currency: 'EUR', probability: 0, urgency: sev ? 3 : 1, action: 'Any incidents?', ref: focus('incident', i.id, i.title), commercial: false })
  }
  for (const j of lateJobs) {
    items.push({ area: 'CLIENT', text: `Project “${j.title}” past its deadline ${j.due_date}`, msg: m('projectLate', { title: j.title, date: j.due_date }), amount: 0, currency: 'EUR', probability: 0, urgency: 2, action: `Status of ${j.title}`, ref: focus('job', j.id, j.title), commercial: false })
  }
  if (approvals.length) {
    items.push({ area: 'MONEY', text: `${approvals.length} action(s) waiting for your approval`, msg: m('approvalsWaiting', { count: approvals.length }), amount: 0, currency: 'EUR', probability: 0, urgency: 2, action: 'What needs my approval?', commercial: false })
  }
  for (const u of uncertain) {
    items.push({ area: 'SYSTEM', text: `Unclear whether ${u.operation} on ${isoDate(u.created_at)} reached the recipient — check before resending`, msg: m('uncertainSend', { operation: u.operation, date: isoDate(u.created_at) ?? '' }), amount: 0, currency: 'EUR', probability: 0, urgency: 3, action: 'Show what is uncertain', commercial: false })
  }
  if (rec.reconcile.length) {
    items.push({ area: 'MONEY', text: `${rec.reconcile.length} invoice(s) where status and recorded payments disagree`, msg: m('paymentsDisagree', { count: rec.reconcile.length }), amount: 0, currency: 'EUR', probability: 0, urgency: 1, action: 'Who owes me money?', commercial: false })
  }
  /* An email Maxpromo sent that did not arrive: the address is wrong or the mailbox refused it. */
  for (const b of bounced) {
    const who = b.recipient ?? 'a recipient'
    items.push({ area: 'SYSTEM', text: `Your email “${b.subject}” to ${who} did not arrive (${b.detail ?? 'delivery failed'})`, msg: m('emailBounced', { who, subject: b.subject, detail: b.detail ?? '' }), amount: 0, currency: 'EUR', probability: 0, urgency: 3, action: `Open email thread ${b.thread_id}`, ref: focus('email_thread', b.thread_id, b.subject.slice(0, 60)), commercial: false })
  }
  /* The card rail (ADR-0025): disputes, money that settles no invoice, payouts. */
  for (const r of rail) {
    const amount = eur(r.amount, r.currency)
    const ref = r.invoiceId && r.invoiceNumber ? focus('invoice', r.invoiceId, r.invoiceNumber) : undefined
    if (r.kind === 'dispute') items.push({ area: 'MONEY', text: `Card payment disputed: ${amount}${r.invoiceNumber ? ` on ${r.invoiceNumber}` : ''} (${r.detail}) — respond by ${r.date}`, msg: m('moneyDispute', { amount, number: r.invoiceNumber ?? '', status: r.detail, date: r.date }), amount: r.amount, currency: r.currency, probability: 0, urgency: 3, action: `Money issue ${r.id}`, ref, commercial: false })
    else if (r.kind === 'unapplied') items.push({ area: 'MONEY', text: `Payment not applied: ${amount}${r.invoiceNumber ? ` (${r.invoiceNumber})` : ''} — ${r.detail}`, msg: m('moneyUnapplied', { amount, number: r.invoiceNumber ?? '', reason: r.detail }), amount: r.amount, currency: r.currency, probability: 0, urgency: 3, action: `Money issue ${r.id}`, ref, commercial: false })
    else if (r.kind === 'payoutFailed') items.push({ area: 'MONEY', text: `Payout to Revolut failed: ${amount}`, msg: m('payoutFailed', { amount }), amount: r.amount, currency: r.currency, probability: 0, urgency: 3, action: `Money issue ${r.id}`, commercial: false })
    else items.push({ area: 'MONEY', text: `Confirm payout ${amount} of ${r.date} on the Revolut statement`, msg: m('payoutUnreconciled', { amount, date: r.date }), amount: 0, currency: r.currency, probability: 0, urgency: 1, action: `Money issue ${r.id}`, commercial: false })
  }
  /* What the Agent Control Plane reported and Marcel has not seen. Recommendations
     and completions inform; blocked, failed and exceptions need a look. */
  for (const e of agentEvents) {
    const ref = e.business_kind && e.business_id && e.business_kind !== 'email_thread' ? focus(e.business_kind as FocusRef['kind'], e.business_id, e.title.slice(0, 60)) : undefined
    items.push({
      area: 'AGENT', text: `Agent ${e.agent} ${AGENT_VERB[e.kind] ?? e.kind}: ${e.title}`, msg: m('agentEvent', { agent: e.agent, kind: e.kind, title: e.title }), amount: 0, currency: 'EUR', probability: 0,
      urgency: e.severity === 'critical' ? 3 : e.severity === 'warning' ? 2 : 1, action: 'Show agent events', ref, commercial: false,
    })
  }
  return items
}

const AGENT_VERB: Record<string, string> = {
  completed: 'completed', blocked: 'is blocked', failed: 'failed', exception: 'found an exception', recommendation: 'recommends', waiting: 'is waiting',
}

interface ConversationRow { id: string; subject: string; follow_up_on: string | null; replied: boolean; counterpart: string | null; label: string | null; kind: string | null; last_inbound: Date | null }
/** Conversations with Maxpromo's own message in them whose customer answered, or whose planned
 * follow-up date has come. Quarantined, archived and trashed threads never appear. Optional
 * until migration 0017 exists. */
async function conversationAttention(ctx: CapabilityContext): Promise<ConversationRow[]> {
  try {
    return await ctx.sql`SELECT t.id::text,t.subject,t.follow_up_on::text AS follow_up_on,
        (t.needs_reply AND last.inbound > last.outbound) AS replied, last.inbound AS last_inbound,
        (SELECT CASE WHEN m.direction='outbound' THEN m.recipients->>0 ELSE m.sender END FROM mail.messages m WHERE m.thread_id=t.id ORDER BY m.received_at DESC LIMIT 1) AS counterpart,
        (SELECT coalesce(l.company,l.name,c.company,c.name) FROM mail.business_links b LEFT JOIN os_leads l ON b.entity_kind='lead' AND l.id::text=b.entity_id
           LEFT JOIN os_clients c ON b.entity_kind='client' AND c.id::text=b.entity_id WHERE b.thread_id=t.id AND b.match_status='owner_confirmed' LIMIT 1) AS label,
        (SELECT entity_kind FROM mail.business_links b WHERE b.thread_id=t.id AND b.match_status='owner_confirmed' ORDER BY (entity_kind='client') DESC LIMIT 1) AS kind
      FROM mail.threads t
      CROSS JOIN LATERAL (SELECT max(received_at) FILTER (WHERE direction='inbound') AS inbound, max(received_at) FILTER (WHERE direction='outbound') AS outbound FROM mail.messages WHERE thread_id=t.id) last
      WHERE t.archived=false AND t.trashed=false AND t.quarantine IS NULL AND last.outbound IS NOT NULL
        AND ((t.needs_reply AND last.inbound > last.outbound) OR (t.waiting AND t.follow_up_on IS NOT NULL AND t.follow_up_on <= ${ctx.today}::date))
      ORDER BY t.updated_at DESC LIMIT 20` as ConversationRow[]
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000', '42703'].includes(String(error.code))) return []
    throw error
  }
}

interface BouncedRow { id: string; thread_id: string; subject: string; recipient: string | null; detail: string | null }
/** Outbound messages a delivery report marked as bounced in the last 7 days (lib/mail/bounces.ts).
 * Optional until migration 0020 exists. */
async function bouncedMail(ctx: CapabilityContext): Promise<BouncedRow[]> {
  try {
    return await ctx.sql`SELECT m.id::text, m.thread_id::text, m.subject, split_part(m.delivery_detail, ':', 1) AS recipient, nullif(trim(substr(m.delivery_detail, strpos(m.delivery_detail, ':') + 1)), '') AS detail
      FROM mail.messages m JOIN mail.threads t ON t.id = m.thread_id
      WHERE m.direction = 'outbound' AND m.delivery_state = 'bounced' AND m.delivery_at > now() - interval '7 days' AND t.trashed = false
      ORDER BY m.delivery_at DESC LIMIT 10` as BouncedRow[]
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000', '42703'].includes(String(error.code))) return []
    throw error
  }
}

/* Optional until migration 0015 exists, exactly like the mail and WhatsApp sections. */
async function agentAttention(ctx: CapabilityContext): Promise<StoredAgentEvent[]> {
  try {
    return await openAgentEvents(ctx.sql)
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000'].includes(String(error.code))) return []
    throw error
  }
}

/**
 * Everything /os shows under "what needs Marcel's attention today", in one
 * read: the ranked items (sales, money, clients, system, agents), email
 * threads needing a reply, and the approvals waiting for him. The same
 * collection the brief and the notices use — there is one attention model.
 */
export async function attentionSnapshot(ctx: CapabilityContext) {
  const [items, email, approvals, agentEvents] = await Promise.all([
    collect(ctx),
    emailAttention(ctx),
    q<{ id: string; capability: string; summary: string; preview: Record<string, string>; payload_hash: string; expires_at: Date; requested_by: string; created_at: Date }>(ctx.sql`
      SELECT id, capability, summary, preview, payload_hash, expires_at, requested_by, created_at FROM os_approvals
      WHERE status = 'pending' AND expires_at > now() ORDER BY created_at LIMIT 20`),
    agentAttention(ctx),
  ])
  const ranked = items.sort((a, b) => b.urgency - a.urgency || score(b) - score(a))
  const counts = { SALES: 0, MONEY: 0, CLIENT: 0, SYSTEM: 0, AGENT: 0 }
  for (const i of ranked) counts[i.area]++
  return {
    counts,
    items: ranked.map((i) => ({ area: i.area, text: i.text, msg: i.msg, action: i.action, urgency: i.urgency, ref: i.ref ?? null })),
    email: email.map((e) => ({ id: e.id, subject: e.subject, classification: e.classification, needsReply: e.needs_reply, updatedAt: e.updated_at.toISOString() })),
    approvals: approvals.map((a) => ({
      id: a.id, capability: a.capability, summary: a.summary, preview: a.preview, payloadHash: a.payload_hash,
      requestedBy: a.requested_by, createdAt: a.created_at.toISOString(), expiresAt: a.expires_at.toISOString(),
    })),
    agentEvents: agentEvents.map((e) => ({
      id: e.id, agent: e.agent, kind: e.kind, severity: e.severity, title: e.title, detail: e.detail,
      businessRef: e.business_kind && e.business_id ? { kind: e.business_kind, id: e.business_id } : null,
      approvalId: e.approval_id, occurredAt: e.occurred_at.toISOString(),
    })),
  }
}

/* ── Morning briefing ──────────────────────────────────────────────────── */

/** One fact in the briefing: a message key with record values, optionally a record to open. */
export interface BriefingLine { key: string; params: Record<string, string | number>; ref?: FocusRef | null }
export interface BriefingSnapshot {
  generatedAt: string
  /** What changed in the last 24 hours. Omitted categories had nothing. */
  overnight: BriefingLine[]
  /** The three most valuable actions now, from the attention model. */
  first: { msg: AttentionMessage; text: string; ref: FocusRef | null }[]
  /** Standing state per area; each list empty when nothing needs saying. */
  communications: BriefingLine[]
  money: BriefingLine[]
  agents: BriefingLine[]
}

/** Optional sections (mail 0013/0017, agents 0015) are skipped on a database without them. */
async function optional<T>(query: PromiseLike<unknown>): Promise<T[]> {
  try { return (await query) as T[] } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01', '3F000', '42703'].includes(String(error.code))) return []
    throw error
  }
}

/**
 * The morning briefing: what happened since yesterday and what to do first. Facts only, from the
 * records; nothing is estimated or invented, and an empty category says nothing at all.
 */
export async function briefingSnapshot(ctx: CapabilityContext): Promise<BriefingSnapshot> {
  const [items, invoices, inbound, sent, leads, payments, agentDone, replies, followUps, approvals] = await Promise.all([
    collect(ctx),
    loadInvoicesForMoney(ctx),
    optional<{ id: string; subject: string; sender: string | null }>(ctx.sql`SELECT t.id::text, t.subject, (SELECT sender FROM mail.messages m WHERE m.thread_id=t.id AND m.direction='inbound' ORDER BY received_at DESC LIMIT 1) AS sender
      FROM mail.threads t WHERE t.quarantine IS NULL AND t.trashed=false
      AND EXISTS(SELECT 1 FROM mail.messages m WHERE m.thread_id=t.id AND m.direction='inbound' AND m.received_at > now() - interval '24 hours')
      ORDER BY t.updated_at DESC LIMIT 20`),
    optional<{ n: number }>(ctx.sql`SELECT count(*)::int AS n FROM mail.messages WHERE direction='outbound' AND received_at > now() - interval '24 hours'`),
    q<{ id: string; company: string | null; name: string | null; city: string | null; source: string }>(ctx.sql`SELECT id, company, name, city, source FROM os_leads WHERE created_at > now() - interval '24 hours' ORDER BY created_at DESC LIMIT 10`),
    q<{ amount: string; currency: string }>(ctx.sql`SELECT amount, currency FROM os_payments WHERE created_at > now() - interval '24 hours'`),
    optional<{ agent: string; kind: string; title: string }>(ctx.sql`SELECT agent, kind, title FROM os_agent_events WHERE occurred_at > now() - interval '24 hours' ORDER BY occurred_at DESC LIMIT 20`),
    optional<{ n: number; oldest: Date | null }>(ctx.sql`SELECT count(*)::int AS n, min(t.updated_at) AS oldest FROM mail.threads t WHERE t.needs_reply AND t.quarantine IS NULL AND t.archived=false AND t.trashed=false`),
    optional<{ n: number }>(ctx.sql`SELECT count(*)::int AS n FROM mail.threads t WHERE t.waiting AND t.follow_up_on <= ${ctx.today}::date AND t.quarantine IS NULL AND t.archived=false AND t.trashed=false`),
    q<{ n: number }>(ctx.sql`SELECT count(*)::int AS n FROM os_approvals WHERE status = 'pending' AND expires_at > now()`),
  ])
  const overnight: BriefingLine[] = []
  if (inbound.length) overnight.push({ key: 'newMail', params: { count: inbound.length, who: [...new Set(inbound.map(t => t.sender).filter(Boolean))].slice(0, 3).join(', ') } })
  for (const l of leads.slice(0, 3)) overnight.push({ key: 'newLead', params: { lead: leadLabel(l), source: l.source }, ref: focus('lead', l.id, leadLabel(l)) })
  if (leads.length > 3) overnight.push({ key: 'moreLeads', params: { count: leads.length - 3 } })
  if (payments.length) {
    const per: PerCurrency = {}
    for (const p of payments) addTo(per, p.currency, Number(p.amount))
    overnight.push({ key: 'paymentsIn', params: { amount: formatPerCurrency(per) } })
  }
  if (sent[0]?.n) overnight.push({ key: 'mailSent', params: { count: sent[0].n } })
  const completed = agentDone.filter(e => e.kind === 'completed')
  if (completed.length) overnight.push({ key: 'agentsCompleted', params: { count: completed.length, what: completed.slice(0, 2).map(e => e.title).join(' · ') } })

  const communications: BriefingLine[] = []
  if (replies[0]?.n) communications.push({ key: 'repliesOwed', params: { count: replies[0].n, days: replies[0].oldest ? daysBetween(isoDate(replies[0].oldest)!, ctx.today) : 0 } })
  if (followUps[0]?.n) communications.push({ key: 'followUpsDue', params: { count: followUps[0].n } })
  if (approvals[0]?.n) communications.push({ key: 'approvals', params: { count: approvals[0].n } })

  const rec = receivables(invoices, ctx.today)
  const money: BriefingLine[] = []
  if (Object.keys(rec.outstanding).length) money.push({ key: 'outstanding', params: { amount: formatPerCurrency(rec.outstanding), overdue: Object.keys(rec.overdue).length ? formatPerCurrency(rec.overdue) : '' } })
  for (const b of rec.overdueInvoices.slice(0, 2)) money.push({ key: 'overdueInvoice', params: { client: b.client, amount: eur(b.open, b.currency), number: b.number, days: b.daysOverdue }, ref: focus('invoice', b.id, b.number) })
  if (rec.drafts.length) money.push({ key: 'draftInvoices', params: { count: rec.drafts.length } })

  const agents: BriefingLine[] = agentDone.filter(e => ['failed', 'blocked', 'exception'].includes(e.kind)).slice(0, 3)
    .map(e => ({ key: 'agentProblem', params: { agent: e.agent, kind: e.kind, title: e.title } }))

  const first = items.filter(i => i.area !== 'AGENT' && i.msg.key !== 'approvalsWaiting')
    .sort((a, b) => b.urgency - a.urgency || score(b) - score(a)).slice(0, 3)
    .map(i => ({ msg: i.msg, text: i.text, ref: i.ref ?? null }))
  return { generatedAt: ctx.now.toISOString(), overnight, first, communications, money, agents }
}

const noInput = v.object({})

/* ── owner.attention ───────────────────────────────────────────────────── */

export const ownerAttention: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'owner.attention',
  family: 'BUSINESS_STATUS',
  title: 'What needs my attention?',
  description: 'Only actionable items across sales, money, clients and the OS itself, counted by area, most urgent first.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    const items = (await collect(ctx)).sort((a, b) => b.urgency - a.urgency || score(b) - score(a))
    const counts = { SALES: 0, MONEY: 0, CLIENT: 0, SYSTEM: 0, AGENT: 0 }
    for (const i of items) counts[i.area]++
    const head = (Object.entries(counts) as [keyof typeof counts, number][]).filter(([, n]) => n > 0).map(([a, n]) => `${n} ${a}`).join(' · ')
    return {
      summary: items.length ? head : 'Nothing in the business records needs you right now.',
      lines: items.slice(0, 10).map((i) => `${i.area} · ${i.text}`),
      choices: items.filter((i) => i.ref).slice(0, 6).map((i) => ({ id: i.ref!.id, kind: i.ref!.kind, label: i.text.slice(0, 60) })),
      data: { counts, items: items.map((i) => ({ area: i.area, text: i.text, action: i.action, ref: i.ref ?? null })) },
    }
  },
}

/* ── owner.money_today ─────────────────────────────────────────────────── */

export const ownerMoneyToday: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'owner.money_today',
  family: 'REPORTING',
  title: 'What can make me money today?',
  description: 'Commercial actions only, ranked by money at stake × likelihood × urgency.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    const items = (await collect(ctx)).filter((i) => i.commercial).sort((a, b) => score(b) - score(a))
    return {
      summary: items.length
        ? `${items.length} thing(s) that can bring money in. Top: ${items[0].action}.`
        : 'Nothing commercial is waiting on you in the records today. Time to find new business.',
      lines: items.slice(0, 8).map((i, n) => `${n + 1}. ${i.text}${i.amount ? ` — ${eur(i.amount, i.currency)} at stake` : ''} → “${i.action}”`),
      choices: items.filter((i) => i.ref).slice(0, 6).map((i) => ({ id: i.ref!.id, kind: i.ref!.kind, label: i.action.slice(0, 60) })),
      next: items.slice(0, 3).map((i) => i.action),
      data: { items: items.map((i) => ({ text: i.text, action: i.action, amount: i.amount, currency: i.currency, ref: i.ref ?? null })) },
    }
  },
}

/* ── owner.overview ────────────────────────────────────────────────────── */

export const ownerOverview: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'owner.overview',
  family: 'REPORTING',
  title: 'How is Maxpromo doing?',
  description: 'This month: invoiced, received, outstanding, overdue; open pipeline and weighted pipeline; recurring per month; proposals won and lost this year; best clients; what sells; what blocks revenue.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    const monthStart = `${ctx.today.slice(0, 7)}-01`
    const yearStart = `${ctx.today.slice(0, 4)}-01-01`
    const [invoices, invoicedRows, paidRows, legacyPaid, leads, recurring, proposals, bestClients, sells] = await Promise.all([
      loadInvoicesForMoney(ctx),
      q<{ total: string; currency: string }>(ctx.sql`SELECT total, currency FROM os_invoices WHERE status <> 'cancelled' AND status <> 'draft' AND coalesce(sent_at, created_at) >= ${monthStart}`),
      q<{ amount: string; currency: string }>(ctx.sql`SELECT amount, currency FROM os_payments WHERE received_on >= ${monthStart}`),
      q<{ amount: string; currency: string }>(ctx.sql`SELECT coalesce(restbetrag, total) AS amount, currency FROM os_invoices i WHERE status = 'paid' AND paid_date >= ${monthStart}
              AND NOT EXISTS (SELECT 1 FROM os_payments p WHERE p.invoice_id = i.id)`),
      q<{ status: string; value: string; currency: string }>(ctx.sql`SELECT status, value, currency FROM os_leads WHERE status = ANY(${statusesFor([...OPEN_STAGES])}) AND value IS NOT NULL`),
      q<{ amount: string; currency: string; frequency: 'monthly' | 'quarterly' | 'yearly' }>(ctx.sql`SELECT amount, currency, frequency FROM os_recurring WHERE status = 'active'`),
      q<{ status: string; n: number }>(ctx.sql`SELECT status, count(*)::int AS n FROM os_angebote WHERE created_at >= ${yearStart} GROUP BY status`),
      q<{ client_name: string; currency: string; received: string }>(ctx.sql`SELECT i.client_name, i.currency, sum(coalesce(p.amount, 0))::numeric AS received
              FROM os_invoices i JOIN os_payments p ON p.invoice_id = i.id GROUP BY i.client_name, i.currency ORDER BY received DESC LIMIT 3`),
      q<{ what: string; n: number }>(ctx.sql`SELECT coalesce(service_interest, business_type, 'unspecified') AS what, count(*)::int AS n FROM os_leads
              WHERE status = ANY(${statusesFor(['won'])}) GROUP BY 1 ORDER BY n DESC LIMIT 3`),
    ])
    const sum = (rows: { currency: string }[], pick: (r: never) => number): PerCurrency => {
      const acc: PerCurrency = {}
      for (const r of rows) addTo(acc, r.currency, pick(r as never))
      return acc
    }
    const invoiced = sum(invoicedRows, (r: { total: string }) => Number(r.total))
    const received = sum([...paidRows, ...legacyPaid], (r: { amount: string }) => Number(r.amount))
    const rec = receivables(invoices, ctx.today)
    const pipeline: PerCurrency = {}
    const weighted: PerCurrency = {}
    for (const l of leads) {
      addTo(pipeline, l.currency, Number(l.value))
      addTo(weighted, l.currency, Number(l.value) * STAGE_WEIGHT[leadStage(l.status) ?? 'discovered'])
    }
    const mrr: PerCurrency = {}
    for (const r of recurring) addTo(mrr, r.currency, monthlyEquivalent(Number(r.amount), r.frequency))
    const p = Object.fromEntries(proposals.map((x) => [x.status, x.n])) as Record<string, number>
    const decided = (p.accepted ?? 0) + (p.rejected ?? 0)
    const items = await collect(ctx)
    const blocking = items.filter((i) => i.area === 'MONEY' && i.probability >= 0.8).slice(0, 4).map((i) => i.text)
    return {
      summary: `This month: received ${formatPerCurrency(received)}, invoiced ${formatPerCurrency(invoiced)}. Outstanding ${formatPerCurrency(rec.outstanding)} (overdue ${formatPerCurrency(rec.overdue)}).`,
      lines: [
        `Open pipeline ${formatPerCurrency(pipeline)} · weighted ${formatPerCurrency(weighted)} (planning figure, not a forecast)`,
        `Recurring ${formatPerCurrency(mrr)} per month`,
        `Angebote ${ctx.today.slice(0, 4)}: ${p.accepted ?? 0} won, ${p.rejected ?? 0} lost, ${p.sent ?? 0} waiting${decided ? ` · win rate ${Math.round(((p.accepted ?? 0) / decided) * 100)}%` : ''}`,
        bestClients.length ? `Best clients by money received: ${bestClients.map((c) => `${c.client_name} ${eur(c.received, c.currency)}`).join(' · ')}` : 'Best clients: no payments recorded yet',
        sells.length ? `What sells (won leads): ${sells.map((s) => `${s.what} ×${s.n}`).join(' · ')}` : 'What sells: no won leads recorded yet',
        blocking.length ? `Blocking revenue: ${blocking.join(' · ')}` : 'Nothing on record is blocking revenue.',
      ],
      data: { received, invoiced, outstanding: rec.outstanding, overdue: rec.overdue, pipeline, weighted, mrr, proposals: p },
    }
  },
}

/* ── owner.brief ───────────────────────────────────────────────────────── */

export const ownerBrief: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'owner.brief',
  family: 'BUSINESS_STATUS',
  title: 'Good morning',
  description: 'A short morning brief: money, sales, clients and the three most valuable actions today.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    /* The same snapshot /os renders (briefingSnapshot): the phone and the screen say the same. */
    const b = await briefingSnapshot(ctx)
    const section = (title: string, lines: BriefingLine[]) => (lines.length ? [title, ...lines.map(l => `• ${briefLineEn(l)}`)] : [])
    return {
      summary: b.first.length ? `Good morning. First: ${b.first[0].text}.` : 'Good morning. Nothing in the records needs you first thing.',
      lines: [
        ...section('SINCE YESTERDAY', b.overnight),
        ...(b.first.length ? ['TODAY FIRST', ...b.first.map((f, n) => `${n + 1}. ${f.text}`)] : []),
        ...section('COMMUNICATION', b.communications),
        ...section('MONEY', b.money),
        ...section('AGENTS', b.agents),
      ],
      data: b,
      next: b.first.map(f => f.text),
    }
  },
}

/** English sentences for the briefing lines (Telegram and other text channels). */
export function briefLineEn(l: BriefingLine): string {
  const p = l.params
  switch (l.key) {
    case 'newMail': return `${p.count} new email conversation(s)${p.who ? ` (${p.who})` : ''} — external content`
    case 'newLead': return `New lead: ${p.lead} (${p.source})`
    case 'moreLeads': return `${p.count} more new lead(s)`
    case 'paymentsIn': return `Payments recorded: ${p.amount}`
    case 'mailSent': return `${p.count} email(s) sent by Maxpromo`
    case 'agentsCompleted': return `Agents completed ${p.count} task(s): ${p.what}`
    case 'repliesOwed': return `${p.count} conversation(s) waiting for your reply${Number(p.days) > 0 ? `, the oldest for ${p.days} day(s)` : ''}`
    case 'followUpsDue': return `${p.count} follow-up(s) due`
    case 'approvals': return `${p.count} action(s) waiting for your approval`
    case 'outstanding': return `Outstanding ${p.amount}${p.overdue ? `, overdue ${p.overdue}` : ''}`
    case 'overdueInvoice': return `${p.client} owes ${p.amount} on ${p.number}, ${p.days} days overdue`
    case 'draftInvoices': return `${p.count} draft invoice(s) not sent`
    case 'agentProblem': return `Agent ${p.agent} ${p.kind}: ${p.title}`
    default: return l.key
  }
}

/* ── approvals.pending ─────────────────────────────────────────────────── */

export const approvalsPending: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'approvals.pending',
  family: 'BUSINESS_STATUS',
  title: 'What needs my approval?',
  description: 'Prepared consequential actions waiting for a decision, with what each would do.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    await ctx.sql`UPDATE os_approvals SET status = 'expired' WHERE status = 'pending' AND expires_at <= now()`
    const rows = await ctx.sql`
      SELECT id, capability, summary, preview, payload_hash, expires_at FROM os_approvals
      WHERE status = 'pending' ORDER BY created_at LIMIT 20` as { id: string; capability: string; summary: string; preview: Record<string, string>; payload_hash: string; expires_at: Date }[]
    return {
      summary: rows.length ? `${rows.length} action(s) waiting for your approval.` : 'Nothing is waiting for your approval.',
      lines: rows.map((r) => `${r.summary} (until ${r.expires_at.toISOString().slice(11, 16)} UTC)`),
      data: { approvals: rows.map((r) => ({ id: r.id, capability: r.capability, summary: r.summary, preview: r.preview, payloadHash: r.payload_hash, expiresAt: r.expires_at.toISOString() })) },
      choices: rows.slice(0, 6).map((r) => ({ id: r.id, kind: 'approval' as const, label: r.summary.slice(0, 60) })),
    }
  },
}

/* ── search ────────────────────────────────────────────────────────────── */

const searchInput = v.object({ query: v.string({ max: 200 }) })

export const searchEverything: CapabilityDefinition<ReturnType<typeof searchInput.parse>> = {
  id: 'commercial.search',
  family: 'CRM',
  title: 'Find it',
  description: 'Finds leads, clients, Angebote and invoices from a description: a name, a city, a document number, an amount ("proposal around 1500"), or "overdue".',
  risk: 'GREEN',
  input: searchInput,
  async run(ctx, input): Promise<CapabilityResult> {
    const q = input.query.trim()
    const amount = Number((q.match(/\d[\d.,]*/)?.[0] ?? '').replace(/\./g, '').replace(',', '.'))
    const words = q.replace(/\d[\d.,]*/g, ' ').replace(/\b(proposal|angebot|invoice|rechnung|around|about|ca\.?|etwa|the|that|der|die|das)\b/gi, ' ').trim()
    const choices: NonNullable<CapabilityResult['choices']> = []
    const lines: string[] = []

    if (/overdue|überfällig/i.test(q)) {
      const rec = receivables(await loadInvoicesForMoney(ctx), ctx.today)
      for (const b of rec.overdueInvoices.slice(0, 6)) { choices.push({ id: b.id, kind: 'invoice', label: `${b.number} · ${b.client}` }); lines.push(`Rechnung ${b.number} · ${b.client} · ${eur(b.open, b.currency)} · ${b.daysOverdue}d overdue`) }
    }
    const docNo = q.match(/\b(ANG|MP|EVD)-\d{4}-\d{3,}\b/i)?.[0]
    if (docNo) {
      const a = await ctx.sql`SELECT id, angebot_number, client_name, total, currency, status FROM os_angebote WHERE upper(angebot_number) = upper(${docNo})` as { id: string; angebot_number: string; client_name: string; total: string; currency: string; status: string }[]
      const i = await ctx.sql`SELECT id, invoice_number, client_name, total, currency, status FROM os_invoices WHERE upper(invoice_number) = upper(${docNo})` as { id: string; invoice_number: string; client_name: string; total: string; currency: string; status: string }[]
      for (const x of a) { choices.push({ id: x.id, kind: 'angebot', label: x.angebot_number }); lines.push(`Angebot ${x.angebot_number} · ${x.client_name} · ${eur(x.total, x.currency)} · ${x.status}`) }
      for (const x of i) { choices.push({ id: x.id, kind: 'invoice', label: x.invoice_number }); lines.push(`Rechnung ${x.invoice_number} · ${x.client_name} · ${eur(x.total, x.currency)} · ${x.status}`) }
    } else if (Number.isFinite(amount) && amount >= 10) {
      const lo = amount * 0.9, hi = amount * 1.1
      const a = await ctx.sql`SELECT id, angebot_number, client_name, total, currency, status FROM os_angebote WHERE total BETWEEN ${lo} AND ${hi} ORDER BY created_at DESC LIMIT 5` as { id: string; angebot_number: string; client_name: string; total: string; currency: string; status: string }[]
      const i = /angebot|proposal/i.test(q) ? [] : await ctx.sql`SELECT id, invoice_number, client_name, total, currency, status FROM os_invoices WHERE total BETWEEN ${lo} AND ${hi} ORDER BY created_at DESC LIMIT 5` as { id: string; invoice_number: string; client_name: string; total: string; currency: string; status: string }[]
      for (const x of a) { choices.push({ id: x.id, kind: 'angebot', label: `${x.angebot_number} · ${x.client_name}` }); lines.push(`Angebot ${x.angebot_number} · ${x.client_name} · ${eur(x.total, x.currency)} · ${x.status}`) }
      for (const x of i) { choices.push({ id: x.id, kind: 'invoice', label: `${x.invoice_number} · ${x.client_name}` }); lines.push(`Rechnung ${x.invoice_number} · ${x.client_name} · ${eur(x.total, x.currency)} · ${x.status}`) }
    }
    if (words.length >= 2 && !docNo) {
      for (const l of await searchLeads(ctx.sql, words)) { choices.push({ id: l.id, kind: 'lead', label: leadLabel(l) }); lines.push(`Lead ${leadLabel(l)} · ${stageText(l.status)}`) }
      for (const c of await searchClients(ctx.sql, words)) { choices.push({ id: c.id, kind: 'client', label: clientLabel(c) }); lines.push(`Client ${clientLabel(c)}`) }
    }
    if (!choices.length) return { summary: `Nothing in Maxpromo matches “${q}”.` }
    if (choices.length === 1) return { summary: lines[0], focus: [focus(choices[0].kind, choices[0].id, choices[0].label)] }
    return { summary: `${choices.length} matches for “${q}”. Which one?`, lines, choices: choices.slice(0, 8) }
  },
}


/* ── owner.notices ─────────────────────────────────────────────────────── */

/**
 * Proactive events for an interface that pushes notices. Each carries a key
 * that is stable for as long as the situation is the same — the same overdue
 * invoice keeps the same key for a week, the same follow-up for its day — so
 * the interface's delivered-notice ledger suppresses repeats. Twenty polls of
 * one overdue invoice are one message.
 */
const noticesInput = v.object({
  /** Opt-in: from this Berlin hour, the day's brief is one notice (keyed by date, so once a day). */
  brief_from_hour: v.optional(v.integer({ min: 0, max: 23 })),
})

export const ownerNotices: CapabilityDefinition<ReturnType<typeof noticesInput.parse>> = {
  id: 'owner.notices',
  family: 'MONITORING',
  title: 'Proactive notices',
  description: 'Business events worth a push: new inbound leads, follow-ups due today, invoices newly overdue, renewals due, incidents, uncertain sends — and, when asked for, the morning brief once a day.',
  risk: 'GREEN',
  input: noticesInput,
  async run(ctx, input) {
    const week = `${ctx.today.slice(0, 4)}-w${Math.ceil((daysBetween(`${ctx.today.slice(0, 4)}-01-01`, ctx.today) + 1) / 7)}`
    const [inbound, fups] = await Promise.all([
      q<{ id: string; company: string | null; name: string | null; city: string | null; source: string }>(ctx.sql`SELECT id, company, name, city, source FROM os_leads
              WHERE created_at > now() - interval '2 days' AND source NOT IN ('telegram', 'manual') ORDER BY created_at DESC LIMIT 10`),
      q<{ id: string; reason: string }>(ctx.sql`SELECT id, reason FROM os_followups WHERE status = 'open' AND due_on = ${ctx.today} LIMIT 20`),
    ])
    const items = await collect(ctx)
    const notices: { key: string; severity: 'info' | 'warning' | 'critical'; text: string; action?: string }[] = []
    for (const l of inbound) notices.push({ key: `lead-new:${l.id}`, severity: 'warning', text: `New enquiry (${l.source}): ${leadLabel(l)}`, action: `What happened with ${l.company ?? l.name}?` })
    for (const f of fups) notices.push({ key: `followup:${f.id}:${ctx.today}`, severity: 'info', text: `Follow-up today: ${f.reason}` })
    for (const i of items) {
      if (i.ref?.kind === 'invoice' && /overdue/.test(i.text)) notices.push({ key: `overdue:${i.ref.id}:${week}`, severity: 'warning', text: i.text, action: i.action })
      if (i.ref?.kind === 'incident' && i.urgency >= 3) notices.push({ key: `incident:${i.ref.id}`, severity: 'critical', text: i.text, action: i.action })
      if (/renews/.test(i.text) && i.urgency >= 3) notices.push({ key: `renewal:${i.text}:${ctx.today.slice(0, 7)}`, severity: 'info', text: i.text, action: i.action })
      if (i.area === 'SYSTEM' && /Unclear whether/.test(i.text)) notices.push({ key: `uncertain:${i.text}`, severity: 'critical', text: i.text })
      if (i.msg.key === 'emailBounced' && i.ref) notices.push({ key: `bounce:${i.ref.id}:${i.text.slice(0, 120)}`, severity: 'warning', text: i.text, action: i.action })
      // Disputes, unapplied money and failed payouts: money at risk, pushed once per issue.
      if (i.area === 'MONEY' && i.urgency >= 3 && i.action.startsWith('Money issue ')) notices.push({ key: `money:${i.msg.key}:${i.action.slice(12)}`, severity: 'critical', text: i.text, action: i.action })
    }
    notices.push(...await channelNotices(ctx))
    /* Requests another interface (an agent) prepared and only Marcel can approve. His own
       preparations in /os are decided on the spot and never pushed. */
    const waitingApprovals = await q<{ id: string; summary: string }>(ctx.sql`SELECT id::text, summary FROM os_approvals
      WHERE status = 'pending' AND expires_at > now() AND requested_by <> 'os:marcel' ORDER BY created_at LIMIT 10`)
    for (const a of waitingApprovals) notices.push({ key: `approval:${a.id}`, severity: 'warning', text: `Approval needed: ${a.summary}`, action: 'What needs my approval?' })
    for (const e of await agentAttention(ctx)) {
      if (e.severity === 'info') continue
      notices.push({ key: `agent:${e.id}`, severity: e.severity as Notice['severity'], text: `Agent ${e.agent} ${AGENT_VERB[e.kind] ?? e.kind}: ${e.title}` })
    }
    /* A customer answering a conversation Maxpromo wrote in: the one email event worth a push. */
    for (const c of await conversationAttention(ctx)) {
      if (!c.replied) continue
      notices.push({ key: `email-replied:${c.id}:${c.last_inbound ? new Date(c.last_inbound).toISOString() : ''}`, severity: 'warning', text: `${c.label ?? c.counterpart ?? 'A customer'} replied to your email “${c.subject}” (external content)`, action: `Open email thread ${c.id}` })
    }
    for (const e of await emailAttention(ctx)) {
      if (!e.needs_reply) continue
      notices.push({ key: `email:${e.id}:${e.updated_at.toISOString()}`, severity: ['urgent','security','system'].includes(e.classification) ? 'critical' : 'warning', text: `EMAIL (external content): ${e.subject}\n${e.classification} · Reply needed`, action: `Open email thread ${e.id}` })
    }
    const berlinHour = Number(ctx.now.toLocaleString('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hour12: false }))
    if (input.brief_from_hour !== undefined && berlinHour >= input.brief_from_hour) {
      const brief = await ownerBrief.run!(ctx, {})
      notices.push({ key: `brief:${ctx.today}`, severity: 'info', text: [brief.summary, ...(brief.lines ?? [])].join('\n') })
    }
    return {
      summary: notices.length ? `${notices.length} notice(s).` : 'No notices.',
      data: { notices },
    }
  },
}

/* ── WhatsApp gateway notices ───────────────────────────────────────────── */

type Notice = { key: string; severity: 'info' | 'warning' | 'critical'; text: string; action?: string }

/** Quarantined mail (provider Junk, suspected phishing, owner spam, blocked sender) never
 * reaches attention, the brief or notices (ADR-0022). */
async function emailAttention(ctx: CapabilityContext): Promise<{ id: string; subject: string; classification: string; needs_reply: boolean; updated_at: Date }[]> {
  try {
    return await ctx.sql`SELECT id,subject,classification,needs_reply,updated_at FROM mail.threads
      WHERE archived=false AND trashed=false AND (needs_reply=true OR waiting=true)
      AND quarantine IS NULL AND classification NOT IN ('newsletter','spam','routine')
      ORDER BY needs_reply DESC,updated_at DESC LIMIT 10` as { id: string; subject: string; classification: string; needs_reply: boolean; updated_at: Date }[]
  } catch (error) {
    // Only an absent optional migration is safe to skip. Operational failures must surface.
    if (typeof error === 'object' && error !== null && 'code' in error && ['42P01','3F000'].includes(String(error.code))) return []
    throw error
  }
}

/**
 * What the WhatsApp gateway needs Marcel to know (lib/channels): a customer
 * asked for him, a lead became qualified, a reply failed or may have been
 * delivered twice, the guard held a reply back, a message waited unanswered.
 * Each is one row of the conversation's own trail (chat.events), so its key
 * is the row id and it is delivered once. New WhatsApp leads already arrive
 * through the inbound-enquiry notice above (source 'whatsapp').
 *
 * A database without migration 0012 has no gateway: the section is skipped,
 * never allowed to break the other notices.
 */
async function channelNotices(ctx: CapabilityContext): Promise<Notice[]> {
  try {
    const [events, stuck] = await Promise.all([
      q<{ id: string; event_type: string; payload: Record<string, unknown>; visitor_label: string | null; contact_phone: string | null; facts: Record<string, string> | null }>(ctx.sql`
        SELECT e.id::text, e.event_type, e.payload, s.visitor_label, s.contact_phone, s.facts
        FROM chat.events e JOIN chat.sessions s ON s.id = e.session_id
        WHERE e.created_at > now() - interval '2 days'
          AND e.event_type IN ('wa.handover', 'wa.qualified', 'wa.send_failed', 'wa.send_uncertain', 'wa.guard_blocked',
                               'wa.os_failed', 'wa.identity_ambiguous', 'wa.possible_duplicate', 'wa.sensitive_data', 'wa.held')
        ORDER BY e.created_at DESC LIMIT 20`),
      q<{ id: string; visitor_label: string | null; contact_phone: string | null; facts: Record<string, string> | null; n: number }>(ctx.sql`
        SELECT s.id, s.visitor_label, s.contact_phone, s.facts, count(*)::int AS n
        FROM chat.messages m JOIN chat.sessions s ON s.id = m.session_id
        WHERE m.turn_state = 'pending' AND m.created_at < now() - interval '10 minutes'
        GROUP BY s.id LIMIT 10`),
    ])
    const who = (r: { visitor_label: string | null; contact_phone: string | null; facts: Record<string, string> | null }) => {
      const name = r.facts?.company || r.facts?.contact_name || r.visitor_label || 'Unknown contact'
      return r.contact_phone ? `${name} (+${r.contact_phone})` : name
    }
    const out: Notice[] = []
    for (const e of events) {
      const p = e.payload ?? {}
      const label = who(e)
      switch (e.event_type) {
        case 'wa.handover': {
          const reason = String(p.reason ?? '')
          const why = { asked_for_person: 'asked for you', urgent: 'says it is urgent', complaint: 'has a complaint', existing_client: 'is a client and needs help', model: 'could not be answered by Max' }[reason] ?? 'needs you'
          out.push({ key: `wa:${e.id}`, severity: reason === 'urgent' || reason === 'complaint' ? 'critical' : 'warning',
            text: `WhatsApp: ${label} ${why}.${p.summary ? ` ${String(p.summary)}` : ''} Max has paused — reply from the WhatsApp Business app.` })
          break
        }
        case 'wa.qualified':
          out.push({ key: `wa:${e.id}`, severity: 'info', text: `WhatsApp lead qualified: ${label}. ${String(p.summary ?? '')}`.trim(), action: 'Show my pipeline' })
          break
        case 'wa.send_uncertain':
          out.push({ key: `wa:${e.id}`, severity: 'critical', text: `WhatsApp: unclear whether Max's reply to ${label} was delivered. It will not be resent — check the chat in the app.` })
          break
        case 'wa.send_failed':
          out.push({ key: `wa:${e.id}`, severity: 'warning', text: `WhatsApp: a reply to ${label} could not be sent (${String(p.kind ?? 'error')}${p.code ? ` ${String(p.code)}` : ''}).` })
          break
        case 'wa.guard_blocked':
          out.push({ key: `wa:${e.id}`, severity: 'warning', text: `WhatsApp: Max held back a reply to ${label} (${(p.flags as string[] | undefined)?.join(', ') ?? 'policy'}) and told them you will answer.` })
          break
        case 'wa.os_failed':
          out.push({ key: `wa:${e.id}`, severity: 'warning', text: `WhatsApp: recording ${label} in the OS failed (${String(p.op ?? '')}); it is retried on their next message.` })
          break
        case 'wa.identity_ambiguous':
          out.push({ key: `wa:${e.id}`, severity: 'info', text: `WhatsApp: ${label} matches ${String(p.matches ?? 'several')} records in the OS; not linked to any.` })
          break
        case 'wa.possible_duplicate':
          out.push({ key: `wa:${e.id}`, severity: 'info', text: `WhatsApp: ${label} was saved as a new lead; the name they gave matches ${String(p.matches ?? 'an')} existing record(s). Linked only by phone — merge them if they are the same business.` })
          break
        case 'wa.sensitive_data':
          out.push({ key: `wa:${e.id}`, severity: 'warning', text: `WhatsApp: ${label} sent sensitive personal data. Max asked them not to; consider deleting it from the chat.` })
          break
        case 'wa.held':
          out.push({ key: `wa:${e.id}`, severity: 'warning', text: `WhatsApp: a message from ${label} was not answered automatically (${String(p.hold ?? '')}). Reply from the app.` })
          break
      }
    }
    for (const s of stuck) {
      out.push({ key: `wa-stuck:${s.id}:${ctx.today}`, severity: 'critical', text: `WhatsApp: ${s.n} message(s) from ${who(s)} waiting more than 10 minutes without an answer.` })
    }
    return out
  } catch (err) {
    console.warn('[owner.notices] WhatsApp section skipped:', err instanceof Error ? err.message.slice(0, 160) : err)
    return []
  }
}

export const VIEW_CAPABILITIES: AnyCapability[] = [
  ownerAttention, ownerMoneyToday, ownerOverview, ownerBrief, approvalsPending, searchEverything, ownerNotices,
]
