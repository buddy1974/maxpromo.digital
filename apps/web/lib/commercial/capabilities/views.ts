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
import type { AnyCapability, CapabilityContext, CapabilityDefinition, CapabilityResult, FocusRef } from '../types'
import { v } from '../validate'

interface Item {
  area: 'SALES' | 'MONEY' | 'CLIENT' | 'SYSTEM'
  text: string
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

function score(i: Item): number {
  return (i.amount || 100) * i.probability * i.urgency
}

async function collect(ctx: CapabilityContext): Promise<Item[]> {
  const today = ctx.today
  const [leads, fups, sentAngebote, acceptedNoDeposit, completedNoFinal, renewals, incidents, lateJobs, approvals, uncertain, invoices] = await Promise.all([
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
    q<{ operation: string; entity_type: string | null; entity_id: string | null; created_at: Date }>(ctx.sql`SELECT operation, entity_type, entity_id, created_at FROM os_audit WHERE outcome = 'uncertain' AND created_at > now() - interval '7 days'`),
    loadInvoicesForMoney(ctx),
  ])

  const items: Item[] = []
  const leadValue = (l: { value: string | null }) => Number(l.value ?? 0)

  for (const l of leads) {
    const s = leadStage(l.status)!
    const idle = daysBetween(isoDate(l.last_interaction_at ?? l.created_at) ?? today, today)
    const ref = focus('lead', l.id, leadLabel(l))
    if (s === 'responded') items.push({ area: 'SALES', text: `${leadLabel(l)} replied — answer them`, amount: leadValue(l), currency: l.currency, probability: 0.4, urgency: 3, action: `Write ${l.company ?? l.name}`, ref, commercial: true })
    else if (s === 'negotiation' && idle >= 5) items.push({ area: 'SALES', text: `Negotiation with ${leadLabel(l)} quiet for ${idle} days`, amount: leadValue(l), currency: l.currency, probability: STAGE_WEIGHT.negotiation, urgency: 2, action: `What happened with ${l.company ?? l.name}?`, ref, commercial: true })
    else if (s === 'discovery' && !l.next_action_at) items.push({ area: 'SALES', text: `${leadLabel(l)} in discovery with no next step — prepare the Angebot?`, amount: leadValue(l), currency: l.currency, probability: STAGE_WEIGHT.discovery, urgency: 2, action: `Prepare an Angebot for ${l.company ?? l.name}`, ref, commercial: true })
  }
  for (const f of fups) {
    const overdue = f.due_on < today
    items.push({
      area: 'SALES', text: `${overdue ? `Overdue since ${f.due_on}: ` : ''}${f.reason}${f.company || f.name ? ` — ${leadLabel(f)}` : ''}`,
      amount: Number(f.value ?? 0), currency: f.currency ?? 'EUR', probability: 0.2, urgency: overdue ? 3 : 2,
      action: f.lead_id ? `What happened with ${f.company ?? f.name}?` : 'Who needs follow-up?', ref: f.lead_id ? focus('lead', f.lead_id, leadLabel(f)) : undefined, commercial: true,
    })
  }
  for (const a of sentAngebote) {
    const age = a.sent_at ? daysBetween(isoDate(a.sent_at)!, today) : 0
    const expired = a.valid_until && a.valid_until < today
    if (age >= 5 || expired) items.push({ area: 'SALES', text: `Angebot ${a.angebot_number} (${a.client_name}, ${eur(a.total, a.currency)}) ${expired ? `expired ${a.valid_until}` : `waiting ${age} days`}`, amount: Number(a.total), currency: a.currency, probability: expired ? 0.2 : STAGE_WEIGHT.proposal, urgency: expired ? 3 : 2, action: `Chase Angebot ${a.angebot_number}`, ref: focus('angebot', a.id, a.angebot_number), commercial: true })
  }
  for (const a of acceptedNoDeposit) {
    items.push({ area: 'MONEY', text: `Angebot ${a.angebot_number} accepted (${a.client_name}) and not invoiced`, amount: Number(a.total) / 2, currency: a.currency, probability: 0.95, urgency: 3, action: `Invoice 50% deposit for ${a.angebot_number}`, ref: focus('angebot', a.id, a.angebot_number), commercial: true })
  }
  for (const j of completedNoFinal) {
    items.push({ area: 'MONEY', text: `Project “${j.title}” completed and not finally invoiced`, amount: Number(j.value ?? 0), currency: 'EUR', probability: 0.95, urgency: 3, action: `Create final invoice for ${j.title}`, ref: focus('job', j.id, j.title), commercial: true })
  }
  const rec = receivables(invoices, today)
  for (const b of rec.overdueInvoices) {
    items.push({ area: 'MONEY', text: `${b.client} owes ${eur(b.open, b.currency)} on ${b.number}, ${b.daysOverdue} days overdue`, amount: b.open, currency: b.currency, probability: 0.8, urgency: b.daysOverdue > 14 ? 3 : 2, action: `Remind ${b.number}`, ref: focus('invoice', b.id, b.number), commercial: true })
  }
  for (const b of rec.drafts) {
    items.push({ area: 'MONEY', text: `Draft invoice ${b.number} (${b.client}, ${eur(b.open, b.currency)}) not sent`, amount: b.open, currency: b.currency, probability: 0.9, urgency: 2, action: `Send invoice ${b.number}`, ref: focus('invoice', b.id, b.number), commercial: true })
  }
  for (const r of renewals) {
    items.push({ area: 'MONEY', text: `${r.company ?? r.name}: ${r.service} renews ${r.next_renewal} (${eur(r.amount, r.currency)})`, amount: Number(r.amount), currency: r.currency, probability: 0.85, urgency: r.next_renewal <= today ? 3 : 1, action: 'Show recurring revenue', commercial: true })
  }
  for (const i of incidents) {
    const sev = ['critical', 'high'].includes(i.severity)
    items.push({ area: i.client_id ? 'CLIENT' : 'SYSTEM', text: `${i.severity.toUpperCase()} incident: ${i.title} (${i.status})`, amount: 0, currency: 'EUR', probability: 0, urgency: sev ? 3 : 1, action: 'Any incidents?', ref: focus('incident', i.id, i.title), commercial: false })
  }
  for (const j of lateJobs) {
    items.push({ area: 'CLIENT', text: `Project “${j.title}” past its deadline ${j.due_date}`, amount: 0, currency: 'EUR', probability: 0, urgency: 2, action: `Status of ${j.title}`, ref: focus('job', j.id, j.title), commercial: false })
  }
  if (approvals.length) {
    items.push({ area: 'MONEY', text: `${approvals.length} action(s) waiting for your approval`, amount: 0, currency: 'EUR', probability: 0, urgency: 2, action: 'What needs my approval?', commercial: false })
  }
  for (const u of uncertain) {
    items.push({ area: 'SYSTEM', text: `Unclear whether ${u.operation} on ${isoDate(u.created_at)} reached the recipient — check before resending`, amount: 0, currency: 'EUR', probability: 0, urgency: 3, action: 'Show what is uncertain', commercial: false })
  }
  if (rec.reconcile.length) {
    items.push({ area: 'MONEY', text: `${rec.reconcile.length} invoice(s) where status and recorded payments disagree`, amount: 0, currency: 'EUR', probability: 0, urgency: 1, action: 'Who owes me money?', commercial: false })
  }
  return items
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
    const counts = { SALES: 0, MONEY: 0, CLIENT: 0, SYSTEM: 0 }
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
    const items = await collect(ctx)
    const rec = receivables(await loadInvoicesForMoney(ctx), ctx.today)
    const top = items.filter((i) => i.commercial).sort((a, b) => score(b) - score(a)).slice(0, 3)
    const count = (area: Item['area']) => items.filter((i) => i.area === area).length
    const sales = items.filter((i) => i.area === 'SALES')
    const clients = items.filter((i) => i.area === 'CLIENT')
    const system = items.filter((i) => i.area === 'SYSTEM')
    return {
      summary: `Good morning. Outstanding ${formatPerCurrency(rec.outstanding)}, overdue ${formatPerCurrency(rec.overdue)}. ${count('SALES')} sales item(s), ${count('CLIENT')} client item(s).`,
      lines: [
        'MONEY',
        ...(rec.overdueInvoices.length ? rec.overdueInvoices.slice(0, 3).map((b) => `• ${b.client} ${eur(b.open, b.currency)} overdue ${b.daysOverdue}d`) : ['• nothing overdue']),
        'SALES',
        ...(sales.length ? sales.slice(0, 3).map((i) => `• ${i.text}`) : ['• nothing waiting']),
        'CLIENTS',
        ...(clients.length ? clients.slice(0, 3).map((i) => `• ${i.text}`) : ['• no open client issues']),
        ...(system.length ? ['SYSTEM', ...system.slice(0, 2).map((i) => `• ${i.text}`)] : []),
        'TODAY',
        ...(top.length ? top.map((i, n) => `${n + 1}. ${i.action}`) : ['• find new business']),
      ],
      next: top.map((i) => i.action),
    }
  },
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
export const ownerNotices: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'owner.notices',
  family: 'MONITORING',
  title: 'Proactive notices',
  description: 'Business events worth a push: new inbound leads, follow-ups due today, invoices newly overdue, renewals due, incidents, uncertain sends.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
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
    }
    return {
      summary: notices.length ? `${notices.length} notice(s).` : 'No notices.',
      data: { notices },
    }
  },
}

export const VIEW_CAPABILITIES: AnyCapability[] = [
  ownerAttention, ownerMoneyToday, ownerOverview, ownerBrief, approvalsPending, searchEverything, ownerNotices,
]
