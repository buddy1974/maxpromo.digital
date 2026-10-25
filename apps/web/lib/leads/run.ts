/**
 * Researching one lead (ADR-0027 §2, ADR-0030): claim, read the site, verify, qualify, record. SERVER ONLY.
 * In this process for the lead.research capability and the workflow sweep. The claim and the recording are
 * also how delegated Bureau work (lib/agents/work.ts) reaches the lead: whoever read the site, the OS scores
 * with the one rule set and writes the record.
 */
import type { Sql } from '@/lib/commercial/types'
import { logActivity, type LeadRow } from '@/lib/commercial/records'
import { leadStage } from '@/lib/commercial/pipeline'
import { qualify, researchSite, type ResearchDeps, type ResearchOutcome } from '@maxpromo/research'
import type { SiteState } from './state'

/** A claim older than this is an attempt that died (timeout, deploy) and may be taken over. */
export const STALE_MINUTES = 10

const setSite = (sql: Sql, id: string, site: SiteState) =>
  sql`UPDATE os_leads SET research = jsonb_set(coalesce(research,'{}'::jsonb), '{site}', ${JSON.stringify(site)}::jsonb), updated_at = now() WHERE id = ${id}::uuid`

/**
 * Claim a lead for research with one conditional UPDATE: nobody else is researching it, or that attempt is
 * older than STALE_MINUTES. A double click, two sweeps, or a sweep and a delegation research it once.
 * `work` marks a claim held by delegated Bureau work.
 */
export async function claimResearch(sql: Sql, leadId: string, by: string, work?: string): Promise<LeadRow | null> {
  const running: SiteState = { state: 'running', at: new Date().toISOString(), by, ...(work ? { work } : {}) }
  const claimed = await sql`UPDATE os_leads SET research = jsonb_set(coalesce(research,'{}'::jsonb), '{site}', ${JSON.stringify(running)}::jsonb), updated_at = now()
    WHERE id = ${leadId}::uuid AND (coalesce(research->'site'->>'state','') <> 'running' OR (research->'site'->>'at')::timestamptz < now() - make_interval(mins => ${STALE_MINUTES}))
    RETURNING *` as LeadRow[]
  return claimed[0] ?? null
}

/** Release a claim this work holds (the delegation never started), leaving any other claim alone. */
export async function releaseResearchClaim(sql: Sql, leadId: string, work: string, site: SiteState): Promise<void> {
  await sql`UPDATE os_leads SET research = jsonb_set(coalesce(research,'{}'::jsonb), '{site}', ${JSON.stringify(site)}::jsonb), updated_at = now()
    WHERE id = ${leadId}::uuid AND research->'site'->>'work' = ${work}`
}

/**
 * Record a research outcome on the lead: the findings with the qualification computed HERE, the fields the
 * site fills (never overwriting what Marcel entered), the stage, the timeline.
 */
export async function applyResearchOutcome(sql: Sql, lead: LeadRow, outcome: ResearchOutcome, actor: string): Promise<{ site: SiteState; lead: LeadRow }> {
  if (!outcome.ok) {
    const site: SiteState = { state: 'failed', at: new Date().toISOString(), stage: outcome.stage, reason: outcome.reason, detail: outcome.detail }
    await setSite(sql, lead.id, site)
    await logActivity(sql, { lead_id: lead.id, kind: 'research_failed', actor, summary: `Research failed: ${outcome.detail}`.slice(0, 300), detail: { stage: outcome.stage, reason: outcome.reason } })
    return { site, lead }
  }
  const f = outcome.findings
  const q = qualify(f)
  const site: SiteState = { ...f, qualification: q }
  await setSite(sql, lead.id, site)
  const stage = leadStage(lead.status)
  const next = q.qualified && stage === 'discovered' ? 'qualified' : null
  const updated = await sql`UPDATE os_leads SET
      business_type = coalesce(business_type, ${f.business_type}), city = coalesce(city, ${f.city}),
      email = coalesce(email, ${f.contact.email}), phone = coalesce(phone, ${f.contact.phone}),
      name = coalesce(name, ${f.contact.person}), summary = coalesce(summary, ${f.summary || null}),
      language = coalesce(language, ${f.language}), service_interest = coalesce(service_interest, ${f.angle?.solution ?? null}),
      status = coalesce(${next}, status), updated_at = now()
    WHERE id = ${lead.id}::uuid RETURNING *` as LeadRow[]
  await logActivity(sql, {
    lead_id: lead.id, kind: 'research_completed', actor,
    summary: `Researched ${new URL(f.origin).hostname}: score ${q.score}, confidence ${q.confidence}, ${f.evidence.length} verified finding(s)${f.rejected ? `, ${f.rejected} unverified dropped` : ''}`,
    detail: { score: q.score, confidence: q.confidence, qualified: q.qualified, pages: f.pages.map(p => p.url), model: f.model },
  })
  if (next) await logActivity(sql, { lead_id: lead.id, kind: 'stage_change', actor, summary: `stage discovered → qualified (score ${q.score})`, detail: { from: lead.status, to: next, score: q.score } })
  return { site, lead: updated[0] ?? lead }
}

/** Research one lead now, in this process. */
export async function researchLead(sql: Sql, leadId: string, actor: string, deps: ResearchDeps = {}): Promise<{ claimed: false } | { claimed: true; site: SiteState; lead: LeadRow }> {
  const lead = await claimResearch(sql, leadId, actor)
  if (!lead) return { claimed: false }
  const done = await applyResearchOutcome(sql, lead, await researchSite(lead.website, deps), actor)
  return { claimed: true, ...done }
}
