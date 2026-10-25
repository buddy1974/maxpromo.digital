/**
 * Everything the lead screen shows, in one read (ADR-0027 §2): who they are, why they qualified
 * and on what evidence, the basis for writing to them, the outreach draft, what is waiting for
 * Marcel, the agent work about it, and the timeline. SERVER ONLY. Changes nothing in the lead; open
 * delegated work is reconciled with the Agent Bureau (lib/agents/work.ts).
 */
import type { Sql } from '@/lib/commercial/types'
import type { LeadRow } from '@/lib/commercial/records'
import { recordedBasis, testRecipients, type Basis } from './sendPolicy'
import { recordedFacts, siteResearch, type SiteState } from './state'
import { workForLead } from '@/lib/agents/work'

export interface LeadWorkspace {
  lead: Omit<LeadRow, 'research'>
  site: SiteState | null
  facts: { fact: string; source?: string }[]
  basis: Basis | null
  drafts: { id: string; family: string; status: string; subject: string; body: string; to_addrs: string[]; revision: number; schedule_error: string | null; updated_at: string; thread_id: string | null }[]
  followups: { id: string; due_on: string; reason: string; unless_reply: boolean }[]
  approvals: { id: string; capability: string; summary: string; preview: Record<string, string>; payload_hash: string; expires_at: string }[]
  timeline: { id: string; kind: string; summary: string; actor: string; created_at: string }[]
  /** Work delegated to Agent Bureau agents about this lead, newest first, open items reconciled (ADR-0030). */
  agentWork: { id: string; agent: string; state: string; source: string; created_at: string; finished_at: string | null; failure: string | null }[]
  /** The newest outreach draft version (os_activities), so a revision builds on it. */
  latestDraftVersion: string | null
}

export async function leadWorkspace(sql: Sql, id: string): Promise<LeadWorkspace | null> {
  const rows = await sql`SELECT * FROM os_leads WHERE id = ${id}::uuid` as LeadRow[]
  const lead = rows[0]
  if (!lead) return null
  const [drafts, followups, approvals, timeline, latest] = await Promise.all([
    sql`SELECT id, family, status, subject, body, to_addrs, revision, schedule_error, updated_at, thread_id FROM mail.drafts
      WHERE entity_kind = 'lead' AND entity_id = ${id} AND family IN ('outreach','follow_up') AND status <> 'discarded' ORDER BY updated_at DESC LIMIT 5`,
    sql`SELECT id, due_on::text AS due_on, reason, unless_reply FROM os_followups WHERE lead_id = ${id}::uuid AND status = 'open' ORDER BY due_on`,
    sql`SELECT id, capability, summary, preview, payload_hash, expires_at FROM os_approvals
      WHERE status = 'pending' AND expires_at > now() AND dedupe_key = ${`outreach.send:lead:${id}`}`,
    sql`SELECT id, kind, summary, actor, created_at FROM os_activities WHERE lead_id = ${id}::uuid ORDER BY created_at DESC LIMIT 25`,
    sql`SELECT id FROM os_activities WHERE lead_id = ${id}::uuid AND kind = 'outreach_draft' AND detail->>'channel' = 'email' ORDER BY created_at DESC LIMIT 1`,
  ])
  const email = lead.email?.toLowerCase()
  const basis: Basis | null = email && testRecipients().has(email) ? 'test' : await recordedBasis(sql, id, email ? [email] : [])
  const work = await workForLead(sql, id)
  const { research, ...rest } = lead
  void research
  return {
    lead: rest, site: siteResearch(lead), facts: recordedFacts(lead), basis,
    drafts: drafts as LeadWorkspace['drafts'], followups: followups as LeadWorkspace['followups'],
    approvals: approvals as LeadWorkspace['approvals'], timeline: timeline as LeadWorkspace['timeline'],
    latestDraftVersion: (latest as { id: string }[])[0]?.id ?? null,
    agentWork: work.map(w => ({ id: w.id, agent: w.agent, state: w.state, source: w.source, created_at: new Date(w.created_at).toISOString(), finished_at: w.finished_at ? new Date(w.finished_at).toISOString() : null, failure: w.failure?.detail ?? null })),
  }
}
