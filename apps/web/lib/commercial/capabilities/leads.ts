/**
 * The basis for writing to a lead (ADR-0027 §4).
 *
 * Research is not here: it has ONE path, the Research Agent (agentwork.request, lib/agents/work.ts),
 * used by the lead screen, Max and the workflow sweep alike (ADR-0033 A3). The in-process
 * lead.research capability that duplicated it was retired.
 *
 * lead.basis (GREEN, owner only) records why Maxpromo may email this business — documented
 * consent, or an existing customer relationship — or withdraws it. It is a statement Marcel makes,
 * so no agent may make it: any other actor is refused. The prospect send policy reads it.
 */
import { writeAudit } from '../audit'
import { focus, leadLabel, logActivity, resolveLead } from '../records'
import { CapabilityRefusal, OWNER_ACTOR, type AnyCapability, type CapabilityDefinition } from '../types'
import { v } from '../validate'

const basisInput = v.object({
  lead_id: v.uuid(),
  basis: v.enumOf(['consent', 'customer', 'withdrawn'] as const),
  /** How and when: "Einwilligung per Formular am 12.10.", "Kunde seit 2025, Rechnung MP-2025-014". */
  note: v.string({ max: 500 }),
})

export const leadBasis: CapabilityDefinition<ReturnType<typeof basisInput.parse>> = {
  id: 'lead.basis',
  family: 'CRM',
  title: 'Record the basis for emailing a lead',
  description: 'Records documented consent or an existing customer relationship for a lead, with how and when, or withdraws it. Owner only; the prospect send policy reads it.',
  risk: 'GREEN',
  input: basisInput,
  async run(ctx, input) {
    if (ctx.actor !== OWNER_ACTOR) throw new CapabilityRefusal('Only Marcel can record the basis for emailing a business.', 'unsupported')
    if (input.note.trim().length < 10) throw new CapabilityRefusal('Say how and when (at least a short sentence): it is the record if anyone asks.')
    const r = await resolveLead(ctx.sql, { lead_id: input.lead_id })
    if ('result' in r) return r.result
    await logActivity(ctx.sql, { lead_id: r.lead.id, kind: 'contact_basis', actor: ctx.actor, summary: `Basis for email: ${input.basis} — ${input.note.trim()}`.slice(0, 300), detail: { basis: input.basis, note: input.note.trim() } })
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'lead.basis', entityType: 'lead', entityId: r.lead.id, after: { basis: input.basis }, outcome: 'succeeded' })
    return { summary: input.basis === 'withdrawn' ? `No basis for emailing ${leadLabel(r.lead)} any more.` : `Recorded: ${input.basis} for ${leadLabel(r.lead)}.`, focus: [focus('lead', r.lead.id, leadLabel(r.lead))] }
  },
}

export const LEAD_CAPABILITIES: AnyCapability[] = [leadBasis]
