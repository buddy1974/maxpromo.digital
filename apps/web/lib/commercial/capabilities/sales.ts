/**
 * lib/commercial/capabilities/sales.ts
 *
 * Leads, the pipeline, notes, interactions and follow-ups.
 *
 * Every write here is to an internal record Marcel can see and correct in the
 * OS, so these are GREEN. None of them contacts anybody: outreach, documents
 * and money are in their own modules and are AMBER where they leave the
 * building.
 */

import {
  addDays, findExisting, focus, getLead, isoDate, leadLabel, logActivity, resolveLead,
  stageText, touchLead, type LeadRow,
} from '../records'
import {
  COLD_AFTER_DAYS, LEAD_STAGES, OPEN_STAGES, STAGE_WEIGHT, WAITING_ON_THEM, leadStage, statusesFor,
  type LeadStage,
} from '../pipeline'
import { addTo, daysBetween, formatPerCurrency, type PerCurrency } from '../money'
import { CapabilityRefusal, type AnyCapability, type CapabilityDefinition, type CapabilityResult } from '../types'
import { v } from '../validate'

const leadRef = {
  lead_id: v.optional(v.uuid()),
  query: v.optional(v.string({ max: 200 })),
}

const researchFact = v.object({
  fact: v.string({ max: 400 }),
  source: v.optional(v.string({ max: 400 })),
})

/* ── lead.check ─────────────────────────────────────────────────────────── */

const checkInput = v.object({
  company: v.optional(v.string({ max: 200 })),
  name: v.optional(v.string({ max: 200 })),
  email: v.optional(v.email()),
  phone: v.optional(v.string({ max: 40 })),
  website: v.optional(v.string({ max: 300 })),
  city: v.optional(v.string({ max: 100 })),
})

export const leadCheck: CapabilityDefinition<typeof checkInput extends { parse(...a: never[]): infer T } ? T : never> = {
  id: 'lead.check',
  family: 'CRM',
  title: 'Do we know them?',
  description: 'Checks leads and clients for the same business by email, website, phone or company name.',
  risk: 'GREEN',
  input: checkInput,
  async run(ctx, input) {
    if (!input.company && !input.email && !input.phone && !input.website) {
      throw new CapabilityRefusal('Give at least a company name, email, phone or website to check.')
    }
    const matches = await findExisting(ctx.sql, input)
    if (!matches.length) {
      return {
        summary: `${input.company ?? input.email ?? input.website ?? 'This business'} is not in Maxpromo yet.`,
        next: ['Save them', 'Research them'],
        data: { known: false },
      }
    }
    return {
      summary: matches.length === 1
        ? `Known: ${matches[0].label} (${matches[0].kind}, matched on ${matches[0].basis}).`
        : `${matches.length} existing records match. Which one is it?`,
      data: { known: true, matches },
      focus: matches.length === 1 ? [focus(matches[0].kind, matches[0].id, matches[0].label)] : undefined,
      choices: matches.length > 1 ? matches.map((m) => ({ id: m.id, kind: m.kind, label: `${m.label} · ${m.kind} · ${m.basis}` })) : undefined,
    }
  },
}

/* ── lead.create ────────────────────────────────────────────────────────── */

const createInput = v.object({
  company: v.string({ max: 200 }),
  name: v.optional(v.string({ max: 200 })),
  email: v.optional(v.email()),
  phone: v.optional(v.string({ max: 40 })),
  website: v.optional(v.string({ max: 300 })),
  city: v.optional(v.string({ max: 100 })),
  business_type: v.optional(v.string({ max: 100 })),
  service_interest: v.optional(v.string({ max: 300 })),
  language: v.optional(v.enumOf(['de', 'en', 'fr'] as const)),
  source: v.optional(v.string({ max: 60 })),
  summary: v.optional(v.string({ max: 1000 })),
  stage: v.optional(v.enumOf(LEAD_STAGES)),
  value: v.optional(v.number({ min: 0, max: 10_000_000 })),
  research: v.optional(v.array(researchFact, { max: 30 })),
  /** Set only after Marcel has seen the duplicate and said it is a different business. */
  confirmed_distinct_from: v.optional(v.array(v.uuid(), { max: 10 })),
})

export const leadCreate: CapabilityDefinition<ReturnType<typeof createInput.parse>> = {
  id: 'lead.create',
  family: 'LEAD',
  title: 'Save a lead',
  description: 'Creates a lead in the OS after checking it is not already a lead or client.',
  risk: 'GREEN',
  input: createInput,
  async run(ctx, input) {
    const matches = (await findExisting(ctx.sql, input))
      .filter((m) => !(input.confirmed_distinct_from ?? []).includes(m.id))
    if (matches.length) {
      return {
        summary: matches.length === 1
          ? `Already in Maxpromo as ${matches[0].label} (${matches[0].kind}, same ${matches[0].basis}). Nothing new was saved.`
          : `${matches.length} existing records match. Nothing new was saved — is it one of these?`,
        focus: matches.length === 1 ? [focus(matches[0].kind, matches[0].id, matches[0].label)] : undefined,
        choices: matches.map((m) => ({ id: m.id, kind: m.kind, label: `${m.label} · ${m.basis}` })),
        data: { created: false, matches },
        next: ['It is a different business — save anyway'],
      }
    }
    const research = Object.fromEntries((input.research ?? []).map((r, i) => [`f${i + 1}`, r]))
    const rows = await ctx.sql`
      INSERT INTO os_leads (name, email, phone, company, website, city, business_type, service_interest,
                            language, source, summary, status, value, research, last_interaction_at)
      VALUES (${input.name ?? null}, ${input.email ?? null}, ${input.phone ?? null}, ${input.company},
              ${input.website ?? null}, ${input.city ?? null}, ${input.business_type ?? null},
              ${input.service_interest ?? null}, ${input.language ?? null}, ${input.source ?? ctx.channel},
              ${input.summary ?? null}, ${input.stage ?? 'discovered'}, ${input.value ?? null},
              ${JSON.stringify(research)}::jsonb, now())
      RETURNING *` as LeadRow[]
    const lead = rows[0]
    await logActivity(ctx.sql, {
      lead_id: lead.id, kind: 'lead_created', channel: ctx.channel, actor: ctx.actor,
      summary: `Lead saved from ${ctx.channel}`, detail: { facts: input.research?.length ?? 0 },
    })
    return {
      summary: `Saved ${leadLabel(lead)} as a lead (${stageText(lead.status)}).`,
      focus: [focus('lead', lead.id, leadLabel(lead))],
      data: { created: true, lead_id: lead.id },
      next: ['What could we offer them?', 'Write them in German', 'Follow up Friday'],
    }
  },
}

/* ── lead.update ────────────────────────────────────────────────────────── */

const updateInput = v.object({
  ...leadRef,
  stage: v.optional(v.enumOf(LEAD_STAGES)),
  value: v.optional(v.number({ min: 0, max: 10_000_000 })),
  currency: v.optional(v.enumOf(['EUR', 'GBP'] as const)),
  next_action: v.optional(v.string({ max: 300 })),
  next_action_at: v.optional(v.date()),
  service_interest: v.optional(v.string({ max: 300 })),
  name: v.optional(v.string({ max: 200 })),
  email: v.optional(v.email()),
  phone: v.optional(v.string({ max: 40 })),
  website: v.optional(v.string({ max: 300 })),
  city: v.optional(v.string({ max: 100 })),
  language: v.optional(v.enumOf(['de', 'en', 'fr'] as const)),
  lost_reason: v.optional(v.string({ max: 300 })),
  research: v.optional(v.array(researchFact, { max: 30 })),
})

export const leadUpdate: CapabilityDefinition<ReturnType<typeof updateInput.parse>> = {
  id: 'lead.update',
  family: 'LEAD',
  title: 'Update a lead',
  description: 'Changes a lead’s stage, value, next action or contact details.',
  risk: 'GREEN',
  input: updateInput,
  async run(ctx, input) {
    const r = await resolveLead(ctx.sql, input)
    if ('result' in r) return r.result
    const before = r.lead
    if (input.stage === 'won') {
      throw new CapabilityRefusal('A lead is marked won by accepting its Angebot, so the client and project are created with it. Say “they accepted”.')
    }
    const research = input.research
      ? { ...before.research, ...Object.fromEntries(input.research.map((f, i) => [`f${Object.keys(before.research ?? {}).length + i + 1}`, f])) }
      : null
    const rows = await ctx.sql`
      UPDATE os_leads SET
        status           = COALESCE(${input.stage ?? null}, status),
        value            = COALESCE(${input.value ?? null}, value),
        currency         = COALESCE(${input.currency ?? null}, currency),
        next_action      = COALESCE(${input.next_action ?? null}, next_action),
        next_action_at   = COALESCE(${input.next_action_at ?? null}::date, next_action_at),
        service_interest = COALESCE(${input.service_interest ?? null}, service_interest),
        name             = COALESCE(${input.name ?? null}, name),
        email            = COALESCE(${input.email ?? null}, email),
        phone            = COALESCE(${input.phone ?? null}, phone),
        website          = COALESCE(${input.website ?? null}, website),
        city             = COALESCE(${input.city ?? null}, city),
        language         = COALESCE(${input.language ?? null}, language),
        lost_reason      = COALESCE(${input.lost_reason ?? null}, lost_reason),
        research         = COALESCE(${research ? JSON.stringify(research) : null}::jsonb, research),
        updated_at       = now()
      WHERE id = ${before.id}
      RETURNING *` as LeadRow[]
    const after = rows[0]
    const changes: string[] = []
    if (input.stage && input.stage !== leadStage(before.status)) changes.push(`stage ${stageText(before.status)} → ${stageText(after.status)}`)
    if (input.value !== undefined) changes.push(`value ${input.value}`)
    if (input.next_action || input.next_action_at) changes.push(`next: ${after.next_action ?? '—'} ${isoDate(after.next_action_at) ?? ''}`.trim())
    if (input.research) changes.push(`${input.research.length} research fact(s)`)
    const other = Object.keys(input).filter((k) => !['lead_id', 'query', 'stage', 'value', 'next_action', 'next_action_at', 'research'].includes(k))
    if (other.length) changes.push(other.join(', '))
    await logActivity(ctx.sql, {
      lead_id: after.id, kind: input.stage ? 'stage_change' : 'lead_updated', channel: ctx.channel, actor: ctx.actor,
      summary: changes.join('; ') || 'updated', detail: { from: before.status, to: after.status },
    })
    return {
      summary: `${leadLabel(after)}: ${changes.join('; ') || 'nothing changed'}.`,
      focus: [focus('lead', after.id, leadLabel(after))],
    }
  },
}

/* ── note.add ───────────────────────────────────────────────────────────── */

const noteInput = v.object({
  ...leadRef,
  client_id: v.optional(v.uuid()),
  job_id: v.optional(v.uuid()),
  text: v.string({ max: 4000 }),
})

export const noteAdd: CapabilityDefinition<ReturnType<typeof noteInput.parse>> = {
  id: 'note.add',
  family: 'CRM',
  title: 'Add a note',
  description: 'Adds a note to a lead, client or project history.',
  risk: 'GREEN',
  input: noteInput,
  async run(ctx, input) {
    let leadId: string | undefined
    let label = ''
    if (!input.client_id && !input.job_id) {
      const r = await resolveLead(ctx.sql, input)
      if ('result' in r) return r.result
      leadId = r.lead.id
      label = leadLabel(r.lead)
    }
    await logActivity(ctx.sql, {
      lead_id: leadId, client_id: input.client_id, job_id: input.job_id,
      kind: 'note', channel: ctx.channel, actor: ctx.actor, summary: input.text.slice(0, 300),
      detail: { text: input.text },
    })
    if (leadId) await touchLead(ctx.sql, leadId)
    return { summary: `Note added${label ? ` to ${label}` : ''}.` }
  },
}

/* ── activity.log ───────────────────────────────────────────────────────── */

const ACTIVITY_KINDS = ['call', 'whatsapp_sent', 'meeting', 'email_received', 'reply_received', 'visit'] as const
const activityInput = v.object({
  ...leadRef,
  client_id: v.optional(v.uuid()),
  kind: v.enumOf(ACTIVITY_KINDS),
  summary: v.string({ max: 2000 }),
})

export const activityLog: CapabilityDefinition<ReturnType<typeof activityInput.parse>> = {
  id: 'activity.log',
  family: 'CRM',
  title: 'Log an interaction',
  description: 'Records a call, visit, WhatsApp message Marcel sent himself, or a reply received. Moves a waiting lead to Responded when they replied.',
  risk: 'GREEN',
  input: activityInput,
  async run(ctx, input) {
    let lead: LeadRow | null = null
    if (!input.client_id) {
      const r = await resolveLead(ctx.sql, input)
      if ('result' in r) return r.result
      lead = r.lead
    }
    const channel = input.kind === 'whatsapp_sent' ? 'whatsapp' : input.kind === 'call' ? 'phone' : input.kind.startsWith('email') ? 'email' : null
    await logActivity(ctx.sql, {
      lead_id: lead?.id, client_id: input.client_id, kind: input.kind, channel, actor: ctx.actor,
      summary: input.summary.slice(0, 300), detail: { text: input.summary, logged_by: 'marcel' },
    })
    const lines: string[] = []
    if (lead) {
      await touchLead(ctx.sql, lead.id)
      const stage = leadStage(lead.status)
      let moved: LeadStage | null = null
      if ((input.kind === 'reply_received' || input.kind === 'email_received') && stage && WAITING_ON_THEM.includes(stage)) moved = stage === 'proposal' ? 'negotiation' : 'responded'
      if (input.kind === 'whatsapp_sent' && stage && ['discovered', 'qualified', 'outreach_prepared'].includes(stage)) moved = 'contacted'
      if (moved) {
        await ctx.sql`UPDATE os_leads SET status = ${moved}, updated_at = now() WHERE id = ${lead.id}`
        await logActivity(ctx.sql, { lead_id: lead.id, kind: 'stage_change', actor: ctx.actor, summary: `stage ${stageText(lead.status)} → ${stageText(moved)}`, detail: { from: lead.status, to: moved } })
        lines.push(`Stage: ${stageText(lead.status)} → ${stageText(moved)}`)
      }
      if (input.kind === 'reply_received' || input.kind === 'email_received') {
        /* They wrote first: reminders that existed only in case they did not
           are no longer needed. */
        const cancelled = await ctx.sql`
          UPDATE os_followups SET status = 'cancelled', done_at = now()
          WHERE lead_id = ${lead.id} AND status = 'open' AND unless_reply
          RETURNING id` as { id: string }[]
        if (cancelled.length) lines.push(`${cancelled.length} “if no reply” reminder(s) cleared`)
      }
    }
    return {
      summary: `Logged ${input.kind.replace('_', ' ')}${lead ? ` for ${leadLabel(lead)}` : ''}.`,
      lines,
      focus: lead ? [focus('lead', lead.id, leadLabel(lead))] : undefined,
    }
  },
}

/* ── lead.find ──────────────────────────────────────────────────────────── */

const findInput = v.object({ query: v.string({ max: 200 }) })

export const leadFind: CapabilityDefinition<ReturnType<typeof findInput.parse>> = {
  id: 'lead.find',
  family: 'CRM',
  title: 'Find a lead',
  description: 'Finds leads by name, company, city, type or website.',
  risk: 'GREEN',
  input: findInput,
  async run(ctx, input) {
    const r = await resolveLead(ctx.sql, { query: input.query })
    if ('result' in r) return r.result
    return {
      summary: `${leadLabel(r.lead)} · ${stageText(r.lead.status)}`,
      focus: [focus('lead', r.lead.id, leadLabel(r.lead))],
    }
  },
}

/* ── lead.history ───────────────────────────────────────────────────────── */

const historyInput = v.object({ ...leadRef, limit: v.optional(v.integer({ min: 1, max: 50 })) })

export const leadHistory: CapabilityDefinition<ReturnType<typeof historyInput.parse>> = {
  id: 'lead.history',
  family: 'CRM',
  title: 'What happened with them?',
  description: 'The complete commercial history of a lead: stage, interactions, documents, money, follow-ups.',
  risk: 'GREEN',
  input: historyInput,
  async run(ctx, input) {
    const r = await resolveLead(ctx.sql, input)
    if ('result' in r) return r.result
    const lead = r.lead
    const [acts, fups, angebote, invoices, jobs] = await Promise.all([
      ctx.sql`SELECT kind, channel, summary, created_at FROM os_activities WHERE lead_id = ${lead.id}
              OR (client_id IS NOT NULL AND client_id = ${lead.client_id}) ORDER BY created_at DESC LIMIT ${input.limit ?? 20}`,
      ctx.sql`SELECT due_on::text AS due_on, reason FROM os_followups WHERE lead_id = ${lead.id} AND status = 'open' ORDER BY due_on`,
      ctx.sql`SELECT angebot_number, status, total, currency FROM os_angebote WHERE lead_id = ${lead.id} ORDER BY created_at DESC`,
      ctx.sql`SELECT invoice_number, status, total, currency FROM os_invoices
              WHERE angebot_id IN (SELECT id FROM os_angebote WHERE lead_id = ${lead.id}) ORDER BY created_at DESC`,
      ctx.sql`SELECT id, title, stage FROM os_jobs WHERE lead_id = ${lead.id}`,
    ]) as [
      { kind: string; channel: string | null; summary: string; created_at: Date }[],
      { due_on: string; reason: string }[],
      { angebot_number: string; status: string; total: string; currency: string }[],
      { invoice_number: string; status: string; total: string; currency: string }[],
      { id: string; title: string; stage: string }[],
    ]
    const facts = Object.values(lead.research ?? {}) as { fact: string }[]
    const lines = [
      `Stage: ${stageText(lead.status)}${lead.value ? ` · value ${lead.value} ${lead.currency}` : ''}`,
      lead.next_action ? `Next: ${lead.next_action}${lead.next_action_at ? ` (${isoDate(lead.next_action_at)})` : ''}` : 'Next action: none set',
      ...fups.map((f) => `Follow-up ${f.due_on}: ${f.reason}`),
      ...angebote.map((a) => `Angebot ${a.angebot_number}: ${a.status}, ${a.total} ${a.currency}`),
      ...invoices.map((i) => `Rechnung ${i.invoice_number}: ${i.status}, ${i.total} ${i.currency}`),
      ...jobs.map((j) => `Project: ${j.title} (${j.stage})`),
      ...(facts.length ? [`Research: ${facts.slice(0, 3).map((f) => f.fact).join(' · ')}`] : []),
      ...acts.map((a) => `${isoDate(a.created_at)} ${a.kind.replace(/_/g, ' ')}: ${a.summary}`),
    ]
    return {
      summary: `${leadLabel(lead)} — ${stageText(lead.status)}, first seen ${isoDate(lead.created_at)}, last contact ${isoDate(lead.last_interaction_at) ?? 'never'}.`,
      lines,
      focus: [focus('lead', lead.id, leadLabel(lead))],
      data: { lead_id: lead.id, contact: { email: lead.email, phone: lead.phone, website: lead.website } },
    }
  },
}

/* ── pipeline.show ──────────────────────────────────────────────────────── */

const PIPELINE_VIEWS = ['all', 'hot', 'cold', 'no_next_action', 'waiting_reply', 'new', 'closable'] as const
const pipelineInput = v.object({ view: v.optional(v.enumOf(PIPELINE_VIEWS)) })

export const pipelineShow: CapabilityDefinition<ReturnType<typeof pipelineInput.parse>> = {
  id: 'pipeline.show',
  family: 'PIPELINE',
  title: 'Show my pipeline',
  description: 'Open leads by stage, or one view: hot, going cold, no next action, waiting for a reply, new, closable.',
  risk: 'GREEN',
  input: pipelineInput,
  async run(ctx, input) {
    const view = input.view ?? 'all'
    const leads = await ctx.sql`
      SELECT * FROM os_leads WHERE status = ANY(${statusesFor([...OPEN_STAGES, 'on_hold'])})
      ORDER BY coalesce(last_interaction_at, created_at) DESC LIMIT 400` as LeadRow[]
    const today = ctx.today
    const age = (l: LeadRow) => daysBetween(isoDate(l.last_interaction_at ?? l.created_at) ?? today, today)
    const stageOf = (l: LeadRow) => leadStage(l.status) ?? 'discovered'
    const picked = leads.filter((l) => {
      const s = stageOf(l)
      switch (view) {
        case 'hot': return ['responded', 'discovery', 'negotiation'].includes(s) || (s === 'proposal' && age(l) <= 7)
        case 'cold': return s !== 'on_hold' && age(l) >= COLD_AFTER_DAYS
        case 'no_next_action': return s !== 'on_hold' && !l.next_action && !l.next_action_at
        case 'waiting_reply': return WAITING_ON_THEM.includes(s)
        case 'new': return s === 'discovered' && daysBetween(isoDate(l.created_at) ?? today, today) <= 7
        case 'closable': return ['negotiation', 'proposal', 'discovery'].includes(s)
        default: return s !== 'on_hold'
      }
    })
    const value: PerCurrency = {}
    const weighted: PerCurrency = {}
    for (const l of picked) {
      if (!l.value) continue
      addTo(value, l.currency, Number(l.value))
      addTo(weighted, l.currency, Number(l.value) * STAGE_WEIGHT[stageOf(l)])
    }
    const byStage = new Map<LeadStage, number>()
    for (const l of picked) byStage.set(stageOf(l), (byStage.get(stageOf(l)) ?? 0) + 1)
    const order = [...LEAD_STAGES]
    const lines = picked.slice(0, 12).map((l) =>
      `${leadLabel(l)} · ${stageText(l.status)}${l.value ? ` · ${l.value} ${l.currency}` : ''} · ${age(l)}d${l.next_action ? ` · next: ${l.next_action}` : ''}`)
    if (picked.length > 12) lines.push(`…and ${picked.length - 12} more`)
    const title = view === 'all' ? 'Pipeline' : view.replace(/_/g, ' ')
    return {
      summary: picked.length
        ? `${title}: ${picked.length} lead(s). ${[...byStage.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([s, c]) => `${stageText(s)} ${c}`).join(' · ')}.`
          + (Object.keys(value).length ? ` Pipeline value ${formatPerCurrency(value)} (weighted ${formatPerCurrency(weighted)}, a planning figure, not a forecast).` : '')
        : `${title}: nothing here.`,
      lines,
      choices: picked.slice(0, 8).map((l) => ({ id: l.id, kind: 'lead' as const, label: leadLabel(l) })),
      data: { view, count: picked.length, value, weighted },
    }
  },
}

/* ── follow-ups ─────────────────────────────────────────────────────────── */

const followupInput = v.object({
  ...leadRef,
  client_id: v.optional(v.uuid()),
  angebot_id: v.optional(v.uuid()),
  invoice_id: v.optional(v.uuid()),
  due_on: v.date(),
  reason: v.string({ max: 300 }),
  unless_reply: v.optional(v.boolean()),
})

export const followupCreate: CapabilityDefinition<ReturnType<typeof followupInput.parse>> = {
  id: 'followup.create',
  family: 'FOLLOW_UP',
  title: 'Follow up on a date',
  description: 'Creates a reminder for Marcel, tied to a lead, client, Angebot or invoice. Never contacts anyone.',
  risk: 'GREEN',
  input: followupInput,
  async run(ctx, input) {
    if (input.due_on < ctx.today) throw new CapabilityRefusal(`${input.due_on} is in the past.`)
    let leadId: string | null = null
    let label = ''
    if (!input.client_id && !input.angebot_id && !input.invoice_id) {
      const r = await resolveLead(ctx.sql, input)
      if ('result' in r) return r.result
      leadId = r.lead.id
      label = leadLabel(r.lead)
    }
    const rows = await ctx.sql`
      INSERT INTO os_followups (due_on, reason, lead_id, client_id, angebot_id, invoice_id, unless_reply, actor)
      VALUES (${input.due_on}, ${input.reason}, ${leadId}, ${input.client_id ?? null}, ${input.angebot_id ?? null},
              ${input.invoice_id ?? null}, ${input.unless_reply ?? false}, ${ctx.actor})
      ON CONFLICT DO NOTHING
      RETURNING id` as { id: string }[]
    if (leadId) {
      await ctx.sql`UPDATE os_leads SET next_action = ${input.reason}, next_action_at = ${input.due_on}, updated_at = now() WHERE id = ${leadId}`
    }
    if (!rows.length) return { summary: `A follow-up${label ? ` for ${label}` : ''} on ${input.due_on} already exists.` }
    return {
      summary: `Follow-up set${label ? ` for ${label}` : ''}: ${input.due_on} — ${input.reason}${input.unless_reply ? ' (cleared if they reply first)' : ''}.`,
      data: { followup_id: rows[0].id },
    }
  },
}

const dueInput = v.object({ within_days: v.optional(v.integer({ min: 0, max: 60 })) })

export const followupDue: CapabilityDefinition<ReturnType<typeof dueInput.parse>> = {
  id: 'followup.due',
  family: 'FOLLOW_UP',
  title: 'Who needs follow-up?',
  description: 'Open follow-ups due today or overdue (or within N days), with the record each one is about.',
  risk: 'GREEN',
  input: dueInput,
  async run(ctx, input) {
    const until = addDays(ctx.today, input.within_days ?? 0)
    const rows = await ctx.sql`
      SELECT f.id, f.due_on::text AS due_on, f.reason, f.lead_id, l.company, l.name, l.city,
             a.angebot_number, i.invoice_number, c.name AS client_name, c.company AS client_company
      FROM os_followups f
      LEFT JOIN os_leads l    ON l.id = f.lead_id
      LEFT JOIN os_angebote a ON a.id = f.angebot_id
      LEFT JOIN os_invoices i ON i.id = f.invoice_id
      LEFT JOIN os_clients c  ON c.id = f.client_id
      WHERE f.status = 'open' AND f.due_on <= ${until}
      ORDER BY f.due_on, f.created_at LIMIT 40` as {
        id: string; due_on: string; reason: string; lead_id: string | null; company: string | null; name: string | null; city: string | null
        angebot_number: string | null; invoice_number: string | null; client_name: string | null; client_company: string | null
      }[]
    const subject = (r: typeof rows[number]) =>
      r.company || r.name ? leadLabel(r) : r.angebot_number ? `Angebot ${r.angebot_number}` : r.invoice_number ? `Rechnung ${r.invoice_number}` : r.client_company || r.client_name || '—'
    return {
      summary: rows.length ? `${rows.length} follow-up(s) due${input.within_days ? ` within ${input.within_days} days` : ' today or overdue'}.` : 'No follow-ups due.',
      lines: rows.map((r) => `${r.due_on < ctx.today ? `OVERDUE ${r.due_on}` : r.due_on} · ${subject(r)} · ${r.reason}`),
      choices: rows.filter((r) => r.lead_id).slice(0, 8).map((r) => ({ id: r.lead_id!, kind: 'lead' as const, label: subject(r) })),
      data: { followups: rows.map((r) => ({ id: r.id, due_on: r.due_on, reason: r.reason, subject: subject(r) })) },
    }
  },
}

const doneInput = v.object({ followup_id: v.uuid(), outcome: v.optional(v.enumOf(['done', 'cancelled'] as const)) })

export const followupDone: CapabilityDefinition<ReturnType<typeof doneInput.parse>> = {
  id: 'followup.done',
  family: 'FOLLOW_UP',
  title: 'Close a follow-up',
  description: 'Marks a follow-up done or cancelled.',
  risk: 'GREEN',
  input: doneInput,
  async run(ctx, input) {
    const rows = await ctx.sql`
      UPDATE os_followups SET status = ${input.outcome ?? 'done'}, done_at = now()
      WHERE id = ${input.followup_id} AND status = 'open' RETURNING reason, lead_id` as { reason: string; lead_id: string | null }[]
    if (!rows.length) return { summary: 'That follow-up is not open.' }
    if (rows[0].lead_id) {
      await ctx.sql`UPDATE os_leads SET next_action = NULL, next_action_at = NULL, updated_at = now()
                    WHERE id = ${rows[0].lead_id} AND next_action = ${rows[0].reason}`
    }
    return { summary: `Follow-up ${input.outcome ?? 'done'}: ${rows[0].reason}.` }
  },
}

export const SALES_CAPABILITIES: AnyCapability[] = [
  leadCheck, leadCreate, leadUpdate, noteAdd, activityLog, leadFind, leadHistory, pipelineShow,
  followupCreate, followupDue, followupDone,
]

export async function leadOrThrow(sql: Parameters<typeof getLead>[0], id: string): Promise<LeadRow> {
  return getLead(sql, id)
}

export type { CapabilityResult }
