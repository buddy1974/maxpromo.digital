/**
 * Researching one lead now (ADR-0027 §2): claim, read the site, verify, qualify, record. SERVER ONLY.
 * Used by the lead.research capability (Marcel's button, an agent) and by the workflow sweep.
 */
import type { Sql } from '@/lib/commercial/types'
import { logActivity, type LeadRow } from '@/lib/commercial/records'
import { leadStage } from '@/lib/commercial/pipeline'
import { qualify } from './qualify'
import { researchSite, type ResearchDeps } from './research'
import type { SiteState } from './state'

/** A claim older than this is an attempt that died (timeout, deploy) and may be taken over. */
export const STALE_MINUTES = 10

const setSite = (sql: Sql, id: string, site: SiteState) =>
  sql`UPDATE os_leads SET research = jsonb_set(coalesce(research,'{}'::jsonb), '{site}', ${JSON.stringify(site)}::jsonb), updated_at = now() WHERE id = ${id}::uuid`

/**
 * Research one lead now. Claims it first (one conditional UPDATE: nobody else is researching it, or
 * that attempt is older than 10 minutes), so a double click or two sweeps research it once.
 */
export async function researchLead(sql: Sql, leadId: string, actor: string, deps: ResearchDeps = {}): Promise<{ claimed: false } | { claimed: true; site: SiteState; lead: LeadRow }> {
  const running: SiteState = { state: 'running', at: new Date().toISOString(), by: actor }
  const claimed = await sql`UPDATE os_leads SET research = jsonb_set(coalesce(research,'{}'::jsonb), '{site}', ${JSON.stringify(running)}::jsonb), updated_at = now()
    WHERE id = ${leadId}::uuid AND (coalesce(research->'site'->>'state','') <> 'running' OR (research->'site'->>'at')::timestamptz < now() - make_interval(mins => ${STALE_MINUTES}))
    RETURNING *` as LeadRow[]
  if (!claimed[0]) return { claimed: false }
  const lead = claimed[0]
  const outcome = await researchSite(lead.website, deps)
  if (!outcome.ok) {
    const site: SiteState = { state: 'failed', at: new Date().toISOString(), stage: outcome.stage, reason: outcome.reason, detail: outcome.detail }
    await setSite(sql, lead.id, site)
    await logActivity(sql, { lead_id: lead.id, kind: 'research_failed', actor, summary: `Research failed: ${outcome.detail}`.slice(0, 300), detail: { stage: outcome.stage, reason: outcome.reason } })
    return { claimed: true, site, lead }
  }
  const f = outcome.findings
  const q = qualify(f)
  const site: SiteState = { ...f, qualification: q }
  await setSite(sql, lead.id, site)
  /* Fill what the record lacks from what the site itself says; never overwrite what Marcel entered. */
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
  return { claimed: true, site, lead: updated[0] }
}

