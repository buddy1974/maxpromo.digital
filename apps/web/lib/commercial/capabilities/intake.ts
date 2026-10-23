/**
 * lib/commercial/capabilities/intake.ts
 *
 * The one way an enquiry captured outside the OS becomes business state
 * (ADR-0021). The Agent Bureau's public form calls it through the signed door;
 * any later channel does the same. No other plane keeps a lead table.
 *
 * Idempotent forever, not just for a retry window: the receipt ledger
 * (os_intake_receipts, keyed by source + external_ref) is claimed in the same
 * statement that creates the lead, so a replayed, retried or concurrent
 * delivery of one enquiry finds its receipt and creates nothing.
 *
 * An enquiry from an address already on a lead is recorded on that lead, not
 * as a second one, and still reaches Marcel: a repeat enquiry is news.
 */

import { randomUUID } from 'node:crypto'
import { buildIntakeMessage, sendTelegramNotification } from '@/lib/telegram'
import { focus, logActivity, touchLead } from '../records'
import type { AnyCapability, CapabilityDefinition, CapabilityResult } from '../types'
import { CapabilityRefusal } from '../types'
import { v } from '../validate'

const intakeInput = v.object({
  /** Who captured it, e.g. agent_bureau_form. Lowercase identifier. */
  source: v.string({ min: 2, max: 41 }),
  /** The capturing system's own id for this enquiry. */
  external_ref: v.string({ min: 1, max: 120 }),
  received_at: v.optional(v.string({ max: 40 })),
  name: v.optional(v.string({ max: 200 })),
  email: v.optional(v.email()),
  phone: v.optional(v.string({ max: 40 })),
  company: v.optional(v.string({ max: 200 })),
  message: v.optional(v.string({ max: 2000 })),
  /** What the person asked for on the form, e.g. audit / demo. */
  interest: v.optional(v.string({ max: 60 })),
})

const SOURCE = /^[a-z][a-z0-9_]{1,40}$/

export const leadIntake: CapabilityDefinition<ReturnType<typeof intakeInput.parse>> = {
  id: 'lead.intake',
  family: 'LEAD',
  title: 'Receive an enquiry',
  description: 'Records an enquiry captured by a channel or the Agent Bureau: creates a lead, or attaches it to the existing lead with the same email. Idempotent by source and external reference.',
  risk: 'GREEN',
  input: intakeInput,
  async run(ctx, input): Promise<CapabilityResult> {
    if (!SOURCE.test(input.source)) throw new CapabilityRefusal('source must be a lowercase identifier', 'precondition')
    if (!input.email && !input.phone) throw new CapabilityRefusal('An enquiry needs an email or a phone number to be answerable.', 'precondition')
    const receivedAt = input.received_at && Number.isFinite(Date.parse(input.received_at)) ? new Date(input.received_at) : ctx.now
    const email = input.email ?? ''
    const newId = randomUUID()
    const summary = [input.interest ? `Interest: ${input.interest}` : null, input.message ?? null].filter(Boolean).join('\n').slice(0, 500) || null

    /* One statement: match, claim, create. The receipt is the claim; the lead
       is inserted only when this statement won the claim and found no match.
       Foreign keys are checked at the end of the statement, so the receipt
       may name the lead inserted beside it. */
    const rows = await ctx.sql`
      WITH m AS (
        SELECT id FROM os_leads WHERE ${email} <> '' AND lower(email) = ${email} ORDER BY created_at LIMIT 1
      ), claim AS (
        INSERT INTO os_intake_receipts (source, external_ref, lead_id, outcome, actor, received_at)
        SELECT ${input.source}, ${input.external_ref}, COALESCE((SELECT id FROM m), ${newId}::uuid),
               CASE WHEN EXISTS (SELECT 1 FROM m) THEN 'matched' ELSE 'created' END, ${ctx.actor}, ${receivedAt.toISOString()}::timestamptz
        ON CONFLICT (source, external_ref) DO NOTHING
        RETURNING lead_id, outcome
      ), ins AS (
        INSERT INTO os_leads (id, name, email, phone, company, source, summary, status, service_interest, last_interaction_at)
        SELECT ${newId}::uuid, ${input.name ?? null}, ${input.email ?? null}, ${input.phone ?? null}, ${input.company ?? null},
               ${input.source}, ${summary}, 'discovered', ${input.interest ?? null}, ${receivedAt.toISOString()}::timestamptz
        FROM claim WHERE claim.outcome = 'created'
        RETURNING id
      )
      SELECT claim.lead_id::text AS lead_id, claim.outcome FROM claim` as { lead_id: string; outcome: 'created' | 'matched' }[]

    if (rows.length === 0) {
      /* Already received. The same answer as the first time, and nothing new. */
      const prior = await ctx.sql`SELECT lead_id::text AS lead_id, outcome FROM os_intake_receipts
                                  WHERE source = ${input.source} AND external_ref = ${input.external_ref}` as { lead_id: string | null; outcome: string }[]
      return {
        summary: 'This enquiry was already received. Nothing new was recorded.',
        data: { created: false, duplicate: true, lead_id: prior[0]?.lead_id ?? null, outcome: prior[0]?.outcome ?? null },
        focus: prior[0]?.lead_id ? [focus('lead', prior[0].lead_id, input.company ?? input.name ?? 'Lead')] : undefined,
      }
    }

    const { lead_id: leadId, outcome } = rows[0]
    await logActivity(ctx.sql, {
      lead_id: leadId, kind: outcome === 'created' ? 'lead_created' : 'enquiry_received', channel: ctx.channel, actor: ctx.actor,
      summary: outcome === 'created' ? `Enquiry received via ${input.source}` : `Repeat enquiry via ${input.source}`,
      detail: { source: input.source, external_ref: input.external_ref }, external_ref: `${input.source}:${input.external_ref}`,
    })
    if (outcome === 'matched') await touchLead(ctx.sql, leadId)

    /* Marcel hears about it once: only the delivery that won the claim notifies. */
    await sendTelegramNotification(buildIntakeMessage({
      source: input.source, outcome, name: input.name, company: input.company, email: input.email, phone: input.phone, message: input.message,
    }))

    const label = input.company ?? input.name ?? input.email ?? 'Lead'
    return {
      summary: outcome === 'created' ? `New lead ${label} recorded.` : `Enquiry recorded on the existing lead ${label}.`,
      data: { created: outcome === 'created', duplicate: false, lead_id: leadId, outcome },
      focus: [focus('lead', leadId, label)],
    }
  },
}

/* ── approvals.requested ───────────────────────────────────────────────── */

const noInput = v.object({})

/**
 * The approvals an interface's own agents asked for, and what became of them.
 * Scoped to the caller's client prefix (bureau:*), so one client never reads
 * another's — or the owner's own — pending business actions. Read-only: the
 * decision is the owner's, in the OS.
 */
export const approvalsRequested: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'approvals.requested',
  family: 'BUSINESS_STATUS',
  title: 'What did my agents ask for?',
  description: 'Approvals requested by this client’s agents in the last 30 days, with their state. The owner decides them in Maxpromo OS.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    const prefix = ctx.actor.includes(':') ? `${ctx.actor.slice(0, ctx.actor.indexOf(':'))}:%` : ctx.actor
    const rows = await ctx.sql`
      SELECT id, capability, summary, status, requested_by, created_at, expires_at, decided_at
      FROM os_approvals
      WHERE requested_by LIKE ${prefix} AND created_at > now() - interval '30 days'
      ORDER BY created_at DESC LIMIT 50` as { id: string; capability: string; summary: string; status: string; requested_by: string; created_at: Date; expires_at: Date; decided_at: Date | null }[]
    const live = (r: typeof rows[number]) => r.status === 'pending' && r.expires_at.getTime() <= ctx.now.getTime() ? 'expired' : r.status
    return {
      summary: rows.length ? `${rows.filter((r) => live(r) === 'pending').length} waiting, ${rows.length} in the last 30 days.` : 'No approvals requested.',
      data: {
        approvals: rows.map((r) => ({
          id: r.id, capability: r.capability, summary: r.summary, status: live(r), requestedBy: r.requested_by,
          createdAt: r.created_at.toISOString(), expiresAt: r.expires_at.toISOString(), decidedAt: r.decided_at?.toISOString() ?? null,
        })),
      },
    }
  },
}

export const INTAKE_CAPABILITIES: AnyCapability[] = [leadIntake, approvalsRequested]
