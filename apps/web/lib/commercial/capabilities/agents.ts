/**
 * Delegated agent work (ADR-0030). SERVER ONLY.
 *
 * agentwork.request (GREEN, owner only) asks an Agent Bureau agent to do specialist work on an OS
 * record. Today one agent: research → read the lead's own public website and return verified evidence.
 * Reading a public site sends nothing and decides nothing, so it runs on Marcel's confirmation alone.
 * No agent may delegate work: a request from any actor but the owner is refused.
 *
 * agentwork.result (GREEN, the Research Agent only) is how the Bureau hands a result back. The OS checks
 * it, scores it with its own rules and writes the lead (lib/agents/work.ts). The result is evidence; it
 * authorises nothing — a recommended introduction is a separate proposal Marcel confirms.
 */
import { WORK_STATES, WORK_FAILURES, type WorkView } from '@maxpromo/config/agent-contract'
import { applyWorkView, requestResearch, RESEARCH_AGENT_ACTOR } from '@/lib/agents/work'
import { writeAudit } from '../audit'
import { focus, leadLabel, resolveLead } from '../records'
import { CapabilityRefusal, OWNER_ACTOR, type AnyCapability, type CapabilityDefinition } from '../types'
import { v, type Validator } from '../validate'

const requestInput = v.object({
  agent: v.enumOf(['research'] as const),
  lead_id: v.optional(v.uuid()),
  query: v.optional(v.string({ max: 200 })),
  source: v.optional(v.enumOf(['max', 'lead-screen'] as const)),
  max_proposal: v.optional(v.uuid()),
  language: v.optional(v.enumOf(['de', 'en'] as const)),
})

export const agentWorkRequest: CapabilityDefinition<ReturnType<typeof requestInput.parse>> = {
  id: 'agentwork.request',
  family: 'RESEARCH',
  title: 'Delegate work to an agent',
  description: 'Asks the Agent Bureau\'s Research Agent to read a lead\'s own public website and return verified evidence; the OS scores it and records it on the lead. Owner only. Sends nothing.',
  risk: 'GREEN',
  input: requestInput,
  async run(ctx, input) {
    if (ctx.actor !== OWNER_ACTOR) throw new CapabilityRefusal('Only Marcel delegates work to an agent.', 'unsupported')
    const r = await resolveLead(ctx.sql, input)
    if ('result' in r) return r.result
    const out = await requestResearch(ctx.sql, { lead: r.lead, requestedBy: ctx.actor, source: input.source ?? 'max', maxProposal: input.max_proposal ?? null, language: input.language })
    if (!out.ok) throw new CapabilityRefusal(out.code === 'no_website' ? `${out.message} Add it first; the Research Agent reads only the business's own site.` : out.message)
    const w = out.work
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'agentwork.request', entityType: 'lead', entityId: r.lead.id, after: { work: w.id, agent: w.agent, state: w.state }, outcome: w.state === 'failed' ? 'failed' : 'succeeded', error: w.failure?.reason })
    return {
      summary: w.state === 'failed'
        ? `The Research Agent could not start on ${leadLabel(r.lead)}: ${w.failure?.detail ?? 'unknown reason'}`
        : `The Research Agent is researching ${leadLabel(r.lead)}. The result comes back to the lead.`,
      data: { work_id: w.id, agent: w.agent, state: w.state },
      focus: [focus('lead', r.lead.id, leadLabel(r.lead))],
    }
  },
}

/** The Bureau's report on one item, checked field by field before anything reads it. */
const workView: Validator<WorkView> = {
  describe: '{workId, agent, state, createdAt, startedAt, finishedAt, result?, failure?, runtime?}',
  parse(x, f) {
    const o = x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : null
    const fail = (why: string): never => { throw new CapabilityRefusal(`${f || 'work'} ${why}`) }
    if (!o) fail('must be an object')
    const workId = v.uuid().parse(o!.workId, 'workId')
    if (o!.agent !== 'research') fail('agent must be research')
    if (!(WORK_STATES as readonly unknown[]).includes(o!.state)) fail('state is not a work state')
    const iso = (k: string) => { const s = o![k]; if (s === null || s === undefined) return null; if (typeof s !== 'string' || Number.isNaN(Date.parse(s))) fail(`${k} must be a timestamp`); return s as string }
    let failure: WorkView['failure']
    if (o!.failure !== undefined && o!.failure !== null) {
      const fl = o!.failure as Record<string, unknown>
      if (!(WORK_FAILURES as readonly unknown[]).includes(fl?.category)) fail('failure.category is unknown')
      failure = { category: fl.category as NonNullable<WorkView['failure']>['category'], reason: v.string({ max: 80 }).parse(fl.reason, 'failure.reason'), detail: v.string({ max: 300 }).parse(fl.detail, 'failure.detail'), retryable: fl.retryable === true }
    }
    const rt = o!.runtime as Record<string, unknown> | undefined
    const runtime = rt && typeof rt === 'object' ? {
      model: typeof rt.model === 'string' ? rt.model.slice(0, 80) : null,
      latencyMs: typeof rt.latencyMs === 'number' && rt.latencyMs >= 0 ? Math.round(rt.latencyMs) : null,
      attempt: typeof rt.attempt === 'number' && rt.attempt >= 1 && rt.attempt <= 10 ? Math.round(rt.attempt) : 1,
    } : undefined
    if (JSON.stringify(o!.result ?? null).length > 120_000) fail('result is too large')
    return {
      workId, agent: 'research', state: o!.state as WorkView['state'],
      createdAt: iso('createdAt') ?? new Date().toISOString(), startedAt: iso('startedAt'), finishedAt: iso('finishedAt'),
      ...(o!.result !== undefined ? { result: o!.result } : {}), ...(failure ? { failure } : {}), ...(runtime ? { runtime } : {}),
    }
  },
}
const resultInput = v.object({ work: workView })

export const agentWorkResult: CapabilityDefinition<ReturnType<typeof resultInput.parse>> = {
  id: 'agentwork.result',
  family: 'RESEARCH',
  title: 'Receive an agent result',
  description: 'The Research Agent reports the state or result of work the OS delegated. The OS checks the findings, scores them with its own rules and records them on the lead. Bureau Research Agent only.',
  risk: 'GREEN',
  input: resultInput,
  async run(ctx, input) {
    if (ctx.actor !== RESEARCH_AGENT_ACTOR) throw new CapabilityRefusal('Only the Research Agent reports research results.', 'unsupported')
    const out = await applyWorkView(ctx.sql, input.work)
    return { summary: out.applied ? `Work ${input.work.workId} is ${out.state}.` : `Nothing changed (${out.reason ?? 'no change'}).`, data: out }
  },
}

export const AGENT_WORK_CAPABILITIES: AnyCapability[] = [agentWorkRequest, agentWorkResult]
