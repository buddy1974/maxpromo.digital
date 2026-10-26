/**
 * Lead research and the basis for writing to a lead (ADR-0027 §2, §4).
 *
 * lead.research (GREEN) reads the business's own public website, keeps only findings whose quote
 * is on the page, and scores the lead by code (lib/leads/*). It changes the lead's record and
 * nothing outside the OS: reading a public site is not an external action.
 *
 * lead.basis (GREEN, owner only) records why Maxpromo may email this business — documented
 * consent, or an existing customer relationship — or withdraws it. It is a statement Marcel makes,
 * so no agent may make it: any other actor is refused. The prospect send policy reads it.
 */
import { researchLead } from '@/lib/leads/run'
import { writeAudit } from '../audit'
import { focus, leadLabel, logActivity, resolveLead } from '../records'
import { CapabilityRefusal, OWNER_ACTOR, type AnyCapability, type CapabilityDefinition } from '../types'
import { v } from '../validate'

const researchInput = v.object({ lead_id: v.optional(v.uuid()), query: v.optional(v.string({ max: 200 })) })

export const leadResearch: CapabilityDefinition<ReturnType<typeof researchInput.parse>> = {
  id: 'lead.research',
  family: 'RESEARCH',
  title: 'Research a lead',
  description: 'Reads the lead\'s own public website (home page plus up to three pages such as Impressum and services), keeps only findings quoted from the site, and scores the lead with its reasons. Sends nothing.',
  risk: 'GREEN',
  input: researchInput,
  async run(ctx, input) {
    const r = await resolveLead(ctx.sql, input)
    if ('result' in r) return r.result
    if (!r.lead.website?.trim()) throw new CapabilityRefusal(`${leadLabel(r.lead)} has no website on record. Add it first; research reads only the business's own site.`)
    const done = await researchLead(ctx.sql, r.lead.id, ctx.actor)
    if (!done.claimed) return { summary: `${leadLabel(r.lead)} is being researched right now.`, focus: [focus('lead', r.lead.id, leadLabel(r.lead))] }
    const site = done.site
    if (site.state === 'failed') {
      return { summary: `Research of ${leadLabel(r.lead)} did not work: ${site.detail}. Nothing was changed except the note on the lead.`, data: { state: 'failed', reason: site.reason }, focus: [focus('lead', r.lead.id, leadLabel(r.lead))] }
    }
    if (site.state !== 'done') return { summary: 'Research did not finish.' }
    const q = site.qualification
    return {
      summary: `${leadLabel(done.lead)}: opportunity ${q.score}/100, research confidence ${q.confidence} — ${q.verdict.replace('_', ' ')}. ${site.evidence.length} fact(s) quoted from their website.`,
      lines: [
        ...q.reasons.map(x => `${x.points > 0 ? '+' : ''}${x.points} ${x.code}${x.value ? `: ${x.value}` : ''}`),
        ...q.unknowns.map(x => `? ${x.code}${x.value ? `: ${x.value}` : ''}`),
      ],
      data: { state: 'done', score: q.score, confidence: q.confidence, qualified: q.qualified, verdict: q.verdict },
      focus: [focus('lead', done.lead.id, leadLabel(done.lead))],
      next: q.qualified ? ['Write them'] : [],
    }
  },
}

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

export const LEAD_CAPABILITIES: AnyCapability[] = [leadResearch, leadBasis]
