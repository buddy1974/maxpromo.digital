/**
 * lib/agents/calibration.ts — Research Agent field calibration. SERVER ONLY.
 *
 * Marcel judges a finished research run: agree, partly, disagree, optionally what was wrong and why.
 * The judgement is evidence about the agent, nothing more. It is stored beside the run
 * (os_agent_work_review, migration 0028) and changes nothing else: not the run's result, the score,
 * the lead, its stage, a draft or a message. Nothing here tunes the agent; Marcel decides what the
 * evidence means.
 *
 * Reviews are only added. Changing his mind adds a row; the newest row of a run is its review.
 */
import type { Sql } from '@/lib/commercial/types'
import type { WorkFailure } from '@maxpromo/config/agent-contract'
import { testRecipients } from '@/lib/leads/sendPolicy'
import type { WorkSummary } from './work'

export const REVIEW_VERDICTS = ['agree', 'partly', 'disagree'] as const
export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number]
/** What the agent got wrong. The same list is the table's CHECK constraint. */
export const REVIEW_ISSUES = ['missed_signal', 'overstated', 'misunderstood', 'score_too_high', 'score_too_low', 'wrong_next_step'] as const
export type ReviewIssue = (typeof REVIEW_ISSUES)[number]
/** Below this many reviewed real runs, the summary shows counts and draws no patterns. */
export const PATTERN_MINIMUM = 5

export interface Review { id: string; work_id: string; verdict: ReviewVerdict; issues: ReviewIssue[]; note: string | null; reviewed_by: string; created_at: string }

export type ReviewOutcome =
  | { ok: true; review: Review; lead: string }
  | { ok: false; code: 'unknown_work' | 'not_research' | 'not_finished' }

/** Record one judgement of one finished research run. Writes os_agent_work_review only. */
export async function recordReview(sql: Sql, p: { workId: string; verdict: ReviewVerdict; issues: ReviewIssue[]; note: string | null; by: string }): Promise<ReviewOutcome> {
  const rows = await sql`SELECT agent, state, subject_id::text FROM os_agent_work WHERE id = ${p.workId}::uuid` as { agent: string; state: string; subject_id: string }[]
  const w = rows[0]
  if (!w) return { ok: false, code: 'unknown_work' }
  if (w.agent !== 'research') return { ok: false, code: 'not_research' }
  if (w.state !== 'completed') return { ok: false, code: 'not_finished' }
  const issues = [...new Set(p.issues)]
  const note = p.note?.trim() ? p.note.trim().slice(0, 500) : null
  const inserted = await sql`INSERT INTO os_agent_work_review (work_id, verdict, issues, note, reviewed_by)
    VALUES (${p.workId}::uuid, ${p.verdict}, ${issues}::text[], ${note}, ${p.by})
    RETURNING id::text, work_id::text, verdict, issues, note, reviewed_by, created_at` as Review[]
  return { ok: true, review: inserted[0], lead: w.subject_id }
}

/** The current review (newest) of each run, and how many times it was reviewed. */
export async function currentReviews(sql: Sql, workIds: string[]): Promise<Map<string, Review & { revisions: number }>> {
  const out = new Map<string, Review & { revisions: number }>()
  if (workIds.length === 0) return out
  let rows: (Review & { revisions: number })[]
  try {
    rows = await sql`SELECT DISTINCT ON (work_id) id::text, work_id::text, verdict, issues, note, reviewed_by, created_at,
        count(*) OVER (PARTITION BY work_id)::int AS revisions
      FROM os_agent_work_review WHERE work_id = ANY(${workIds}::uuid[]) ORDER BY work_id, created_at DESC, id` as (Review & { revisions: number })[]
  } catch (err) {
    /* Before migration 0028 there is nothing to show; the lead screen must not fail for it. */
    if ((err as { code?: string }).code === '42P01') return out
    throw err
  }
  for (const r of rows) out.set(r.work_id, r)
  return out
}

/* ── the calibration summary ───────────────────────────────────────────── */

export interface CalibrationRun {
  workId: string
  leadId: string
  business: string
  website: string | null
  category: string | null
  state: 'completed' | 'failed'
  at: string
  durationMs: number | null
  /** Our own site, a test recipient or a TEST/EVD lead — shown, never counted. */
  test: boolean
  summary: WorkSummary | null
  failure: WorkFailure | null
  review: (Review & { revisions: number }) | null
}

export interface CalibrationSummary {
  runs: CalibrationRun[]
  researched: number
  failed: number
  reviewed: number
  agreement: Record<ReviewVerdict, number>
  verdicts: Record<string, number>
  confidence: Record<string, number>
  averageDurationMs: number | null
  /** Read only in part (thin, one page, no verified fact) or not at all (the read failed). */
  partial: number
  issues: Record<ReviewIssue, number>
  /** Marcel's notes on reviews with a given issue, newest first. */
  notes: { issue: ReviewIssue; business: string; note: string; workId: string }[]
  /** Only from PATTERN_MINIMUM reviewed runs: agreement broken down by what the agent said. */
  patterns: { by: 'verdict' | 'confidence' | 'category' | 'reading'; key: string; reviewed: number; agree: number; partly: number; disagree: number }[] | null
}

const OWN_SITE = /(^|\.)maxpromo\.digital$/i
const TEST_NAME = /^(test|evd)\b/i

export function isTestProspect(lead: { company: string | null; name: string | null; email: string | null; website: string | null }, env: Record<string, string | undefined> = process.env): boolean {
  if (TEST_NAME.test((lead.company || lead.name || '').trim())) return true
  if (lead.email && testRecipients(env).has(lead.email.toLowerCase())) return true
  try {
    const w = lead.website?.trim()
    if (w && OWN_SITE.test(new URL(/^https?:\/\//i.test(w) ? w : `https://${w}`).hostname)) return true
  } catch { /* an unparseable website is not ours */ }
  return false
}

const ms = (a: Date | string | null, b: Date | string | null) => (a && b ? Math.max(0, new Date(b).getTime() - new Date(a).getTime()) : null)

/** Every finished research run (completed or failed), newest first, with its current review. */
export async function calibrationRuns(sql: Sql, limit = 200): Promise<CalibrationRun[]> {
  const rows = await sql`SELECT w.id::text, w.subject_id::text AS lead_id, w.state, w.summary, w.failure, w.runtime, w.created_at, w.started_at, w.finished_at,
      l.company, l.name, l.email, l.website, l.business_type
    FROM os_agent_work w LEFT JOIN os_leads l ON l.id = w.subject_id
    WHERE w.agent = 'research' AND w.state IN ('completed', 'failed') ORDER BY w.finished_at DESC NULLS LAST LIMIT ${limit}` as {
      id: string; lead_id: string; state: 'completed' | 'failed'; summary: WorkSummary | null; failure: WorkFailure | null; runtime: { latencyMs?: number | null } | null
      created_at: string; started_at: string | null; finished_at: string | null; company: string | null; name: string | null; email: string | null; website: string | null; business_type: string | null
    }[]
  const reviews = await currentReviews(sql, rows.map(r => r.id))
  return rows.map(r => ({
    workId: r.id, leadId: r.lead_id,
    business: r.company || r.name || r.summary?.lead || '—',
    website: r.website, category: r.summary?.record?.businessType ?? r.business_type ?? null,
    state: r.state, at: new Date(r.finished_at ?? r.created_at).toISOString(),
    /* The Bureau's own measure when it gave one; else from the OS timestamps. */
    durationMs: r.runtime?.latencyMs ?? ms(r.started_at ?? r.created_at, r.finished_at),
    test: isTestProspect(r),
    summary: r.summary, failure: r.failure, review: reviews.get(r.id) ?? null,
  }))
}

const tally = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map(k => [k, 0])) as Record<K, number>

function partialRead(r: CalibrationRun): boolean {
  if (r.state === 'failed') return r.failure?.category !== 'delivery'
  const lim = r.summary?.record?.limitations
  if (lim) return lim.some(c => c.code === 'thin' || c.code === 'one_page' || c.code === 'no_evidence')
  return (r.summary?.evidenceCount ?? 0) === 0
}

/** What the agent said, in the words the summary groups by. A run before ADR-0031 has no verdict. */
const verdictOf = (s: WorkSummary) => s.verdict ?? (s.qualified ? 'qualified' : 'not_qualified')

/** The summary counts real prospects only; a review of a test run is kept but not counted. */
export function summarize(all: CalibrationRun[]): CalibrationSummary {
  const real = all.filter(r => !r.test)
  const done = real.filter(r => r.state === 'completed' && r.summary)
  const reviewed = done.filter(r => r.review)
  const agreement = tally(REVIEW_VERDICTS)
  const issues = tally(REVIEW_ISSUES)
  const notes: CalibrationSummary['notes'] = []
  for (const r of reviewed) {
    agreement[r.review!.verdict]++
    for (const i of r.review!.issues) {
      issues[i]++
      if (r.review!.note) notes.push({ issue: i, business: r.business, note: r.review!.note, workId: r.workId })
    }
  }
  const verdicts: Record<string, number> = {}, confidence: Record<string, number> = {}
  for (const r of done) {
    const v = verdictOf(r.summary!); verdicts[v] = (verdicts[v] ?? 0) + 1
    confidence[r.summary!.confidence] = (confidence[r.summary!.confidence] ?? 0) + 1
  }
  const durations = done.map(r => r.durationMs).filter((d): d is number => typeof d === 'number')

  let patterns: CalibrationSummary['patterns'] = null
  if (reviewed.length >= PATTERN_MINIMUM) {
    const groups = new Map<string, { by: 'verdict' | 'confidence' | 'category' | 'reading'; key: string; reviewed: number; agree: number; partly: number; disagree: number }>()
    const add = (by: 'verdict' | 'confidence' | 'category' | 'reading', key: string, v: ReviewVerdict) => {
      const g = groups.get(`${by}:${key}`) ?? { by, key, reviewed: 0, agree: 0, partly: 0, disagree: 0 }
      g.reviewed++; g[v]++; groups.set(`${by}:${key}`, g)
    }
    for (const r of reviewed) {
      const v = r.review!.verdict
      add('verdict', verdictOf(r.summary!), v)
      add('confidence', r.summary!.confidence, v)
      add('category', (r.category ?? '—').slice(0, 60), v)
      add('reading', partialRead(r) ? 'partial' : 'full', v)
    }
    patterns = [...groups.values()]
  }

  return {
    runs: all,
    researched: done.length,
    failed: real.filter(r => r.state === 'failed').length,
    reviewed: reviewed.length,
    agreement, verdicts, confidence,
    averageDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    partial: real.filter(partialRead).length,
    issues,
    notes: notes.slice(0, 20),
    patterns,
  }
}
