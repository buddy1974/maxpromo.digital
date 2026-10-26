/**
 * Where a lead's website research lives: `os_leads.research.site` (JSONB, next to the hand-recorded
 * facts `f1…fn`). No new table and no migration — one key, one shape. Types only and a reader, so
 * capabilities can read it without importing the workflow (which imports the engine).
 */
import type { LeadRow } from '@/lib/commercial/records'
import type { Qualification, ResearchFindings } from '@maxpromo/research'

export type SiteState =
  | { state: 'requested'; at: string; by: string }
  | { state: 'running'; at: string; by: string; work?: string }
  | { state: 'failed'; at: string; stage: 'site' | 'model'; reason: string; detail: string }
  | (ResearchFindings & { qualification: Qualification })

export function siteResearch(lead: Pick<LeadRow, 'research'>): SiteState | null {
  const s = (lead.research ?? {}) as { site?: SiteState }
  return s.site && typeof s.site === 'object' && 'state' in s.site ? s.site : null
}

/** Earlier finished research of this lead, newest first, one line each (`research.site_history`, ADR-0031). */
export interface SiteHistoryEntry { at: string; score: number; confidence: string; verdict: string; facts: number; pages: number; model?: string }
export function siteHistory(lead: Pick<LeadRow, 'research'>): SiteHistoryEntry[] {
  const h = (lead.research ?? {} as Record<string, unknown>) as { site_history?: unknown }
  return Array.isArray(h.site_history) ? (h.site_history as SiteHistoryEntry[]).filter(e => e && typeof e.score === 'number').slice(0, 5) : []
}

/** The hand- or agent-recorded facts ({fact, source}), without the site research. */
export function recordedFacts(lead: Pick<LeadRow, 'research'>): { fact: string; source?: string }[] {
  return Object.values(lead.research ?? {}).filter((f): f is { fact: string; source?: string } => !!f && typeof (f as { fact?: unknown }).fact === 'string')
}
