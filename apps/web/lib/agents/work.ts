/**
 * lib/agents/work.ts — delegated agent work, the OS side (ADR-0030). SERVER ONLY.
 *
 *   OS (owner, through Max or the lead screen)
 *     → agentwork.request: row in os_agent_work, the lead claimed for this work, signed POST to the
 *       Bureau's work door (/api/work/v1/request) with a bounded snapshot — the website, never the lead
 *   Bureau Research Agent
 *     → reads the site, asks the OS gateway for the model step (/api/os/agent/v1/model), verifies quotes
 *     → agentwork.result through the OS door (/api/os/agent/v1/run), as bureau:research
 *   OS
 *     → checks the findings' shape, scores them with the ONE rule set (@maxpromo/research), writes the lead
 *
 * Push first, pull as the safety net: whenever the OS shows open work it asks the Bureau for its state
 * (reconcileWork) — so a lost result push still arrives, and work the Bureau lost is said to have failed
 * rather than shown as running for ever.
 *
 * The Bureau never reads or writes the OS database, the OS never reads the Bureau's. The work id is chosen
 * here and is the Bureau's idempotency key: a repeated request returns the item that exists.
 */
import { randomUUID } from 'node:crypto'
import {
  isTerminalWork, signedHeaders, WORK_AGENTS, WORK_CLIENT, WORK_CONTRACT_VERSION, workDoorSecret,
  type WorkFailure, type WorkRequest, type WorkState, type WorkView,
} from '@maxpromo/config/agent-contract'
import { investigationPlan, parseFindings, qualify, recommendNext, type Check, type Qualification, type ResearchFindings, type ResearchRecommendation, type Verdict } from '@maxpromo/research'
import { isEvidenceMode } from '@maxpromo/config'
import { recordAgentEvents } from '@/lib/commercial/agent-events'
import { writeAudit } from '@/lib/commercial/audit'
import { leadLabel, type LeadRow } from '@/lib/commercial/records'
import type { Sql } from '@/lib/commercial/types'
import { applyResearchOutcome, claimResearch, releaseResearchClaim, STALE_MINUTES } from '@/lib/leads/run'

const DEFAULT_BUREAU_ORIGIN = 'https://agents.maxpromo.digital'
const TIMEOUT_MS = 10_000
/** Pull at most this often per item while it is open. */
const CHECK_SECONDS = 8
/** Research reads one site and asks one model: anything open longer has died. */
export const WORK_DEADLINE_MINUTES = STALE_MINUTES
export const RESEARCH_AGENT_ACTOR = 'bureau:research'

type Env = Record<string, string | undefined>

export interface WorkRow {
  id: string
  agent: 'research'
  capability: string
  subject_kind: 'lead'
  subject_id: string
  requested_by: string
  source: string
  max_proposal: string | null
  state: WorkState
  summary: WorkSummary | null
  failure: WorkFailure | null
  runtime: WorkView['runtime'] | null
  created_at: Date | string
  started_at: Date | string | null
  finished_at: Date | string | null
  checked_at: Date | string | null
}

/** What Marcel sees of a finished research: the deterministic outcome and the best evidence. */
export interface WorkSummary {
  lead: string
  origin: string
  score: number
  confidence: 'high' | 'medium' | 'low'
  qualified: boolean
  recommendation: ResearchRecommendation
  /** The top verified facts (what pages say, with quotes), manual-work facts first. */
  evidence: { kind: string; text: string; quote: string; url: string }[]
  evidenceCount: number
  injectionSuspected: boolean
  email: string | null
  /* ADR-0031 — absent on work finished before it. */
  verdict?: Verdict
  /** Interpretations of the facts, never shown as what the site said. */
  inferences?: string[]
  /** Hypotheses about what Maxpromo might improve. */
  opportunities?: { solution: string; hypothesis: string }[]
  /** What to check: code unknowns and the open questions the pages raised. */
  checks?: Check[]
  /** Field calibration — the whole result as it was decided, kept with the run because a later run
   *  replaces the lead's research. Absent on work finished before it. */
  record?: CalibrationRecord
}

export interface CalibrationRecord {
  businessType: string | null
  pages: string[]
  facts: { text: string; quote: string; url: string }[]
  opportunities: { solution: string; hypothesis: string }[]
  unknowns: Check[]
  limitations: Qualification['caveats']
}

/** The facts worth showing first: manual work, then the rest; never an old-style quoted "opportunity". */
export function topFacts(findings: ResearchFindings, n = 3): WorkSummary['evidence'] {
  const facts = findings.evidence.filter(e => e.kind !== 'opportunity')
  return [...facts.filter(e => e.kind === 'pain_point'), ...facts.filter(e => e.kind !== 'pain_point')].slice(0, n).map(e => ({ kind: e.kind, text: e.text, quote: e.quote, url: e.url }))
}

/* ── the signed client to the Bureau ───────────────────────────────────── */

export function bureauWorkConfigured(env: Env = process.env): boolean {
  return Boolean(workDoorSecret(env))
}

function bureauOrigin(env: Env): string {
  const url = new URL(env.BUREAU_API_ORIGIN?.trim() || DEFAULT_BUREAU_ORIGIN)
  /* The secret never travels in clear, except to a local Bureau in an evidence run. */
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(local && isEvidenceMode(env as NodeJS.ProcessEnv))) throw new Error('BUREAU_API_ORIGIN must be https')
  return url.origin
}

export type BureauCall =
  | { ok: true; work: WorkView }
  | { ok: false; reason: 'not_configured' | 'unauthorized' | 'not_found' | 'unreachable' | 'http_error' | 'invalid'; status?: number }

export interface WorkDeps { env?: Env; fetch?: typeof fetch }

async function callBureau(action: 'request' | 'status' | 'cancel', payload: unknown, deps: WorkDeps = {}): Promise<BureauCall> {
  const env = deps.env ?? process.env
  const secret = workDoorSecret(env)
  if (!secret) return { ok: false, reason: 'not_configured' }
  const path = `/api/work/${WORK_CONTRACT_VERSION}/${action}`
  const body = JSON.stringify(payload)
  try {
    const res = await (deps.fetch ?? fetch)(`${bureauOrigin(env)}${path}`, {
      method: 'POST',
      headers: signedHeaders({ client: WORK_CLIENT, secret, method: 'POST', path, body }),
      body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthorized', status: res.status }
    if (res.status === 404) return { ok: false, reason: 'not_found', status: 404 }
    if (!res.ok) return { ok: false, reason: 'http_error', status: res.status }
    const json = await res.json() as { work?: WorkView }
    return json.work && typeof json.work.workId === 'string' ? { ok: true, work: json.work } : { ok: false, reason: 'invalid' }
  } catch {
    return { ok: false, reason: 'unreachable' }
  }
}

/* ── rows ──────────────────────────────────────────────────────────────── */

export async function loadWork(sql: Sql, id: string): Promise<WorkRow | null> {
  const rows = await sql`SELECT id::text, agent, capability, subject_kind, subject_id::text, requested_by, source, max_proposal::text, state, summary, failure, runtime,
    created_at, started_at, finished_at, checked_at FROM os_agent_work WHERE id = ${id}::uuid` as WorkRow[]
  return rows[0] ?? null
}

async function loadLead(sql: Sql, id: string): Promise<LeadRow | null> {
  const rows = await sql`SELECT * FROM os_leads WHERE id = ${id}::uuid` as LeadRow[]
  return rows[0] ?? null
}

/** Move an open item to a terminal state once. Returns false when it was already terminal. */
async function finish(sql: Sql, id: string, state: 'completed' | 'failed' | 'cancelled', p: { summary?: WorkSummary; failure?: WorkFailure; runtime?: WorkView['runtime'] }): Promise<boolean> {
  const rows = await sql`UPDATE os_agent_work SET state = ${state}, summary = ${p.summary ? JSON.stringify(p.summary) : null}::jsonb,
      failure = ${p.failure ? JSON.stringify(p.failure) : null}::jsonb, runtime = coalesce(${p.runtime ? JSON.stringify(p.runtime) : null}::jsonb, runtime),
      finished_at = now(), checked_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND state IN ('queued', 'running') RETURNING id` as { id: string }[]
  return rows.length > 0
}

/* ── request ───────────────────────────────────────────────────────────── */

export type RequestOutcome =
  | { ok: true; work: WorkRow }
  | { ok: false; code: 'busy' | 'no_website'; message: string }

/**
 * Delegate research of one lead to the Research Agent. The lead is claimed for this work first (so the
 * lead screen, the workflow sweep and a second request see it running), then the Bureau is asked. If
 * the Bureau cannot be reached the work fails honestly at once and the claim is released.
 */
export async function requestResearch(sql: Sql, p: { lead: LeadRow; requestedBy: string; source: string; maxProposal?: string | null; language?: 'de' | 'en' }, deps: WorkDeps = {}): Promise<RequestOutcome> {
  const website = p.lead.website?.trim()
  if (!website) return { ok: false, code: 'no_website', message: `${leadLabel(p.lead)} has no website on record.` }
  const id = randomUUID()
  const claimed = await claimResearch(sql, p.lead.id, RESEARCH_AGENT_ACTOR, id)
  if (!claimed) return { ok: false, code: 'busy', message: `${leadLabel(p.lead)} is being researched right now.` }

  await sql`INSERT INTO os_agent_work (id, agent, capability, subject_kind, subject_id, requested_by, source, max_proposal)
    VALUES (${id}::uuid, 'research', ${WORK_AGENTS.research.capability}, 'lead', ${p.lead.id}::uuid, ${p.requestedBy}, ${p.source}, ${p.maxProposal ?? null}::uuid)`
  const request: WorkRequest = {
    workId: id, agent: 'research', requestedBy: p.requestedBy, source: p.source,
    subject: { kind: 'lead', id: p.lead.id, label: leadLabel(p.lead).slice(0, 200) },
    input: { website, ...(p.language ? { language: p.language } : {}) },
    objective: 'Research the business from its own public website and return verified evidence for qualification.',
    constraints: { publicWebsiteOnly: true, sendsNothing: true },
  }
  const call = await callBureau('request', request, deps)
  if (!call.ok) {
    const failure: WorkFailure = { category: 'delivery', reason: call.reason, detail: 'The Agent Bureau could not be reached, so the work did not start.', retryable: call.reason !== 'unauthorized' && call.reason !== 'not_configured' }
    await finish(sql, id, 'failed', { failure })
    await releaseResearchClaim(sql, p.lead.id, id, { state: 'failed', at: new Date().toISOString(), stage: 'site', reason: 'delivery', detail: failure.detail })
    return { ok: true, work: (await loadWork(sql, id))! }
  }
  await applyWorkView(sql, call.work)
  return { ok: true, work: (await loadWork(sql, id))! }
}

/* ── result ────────────────────────────────────────────────────────────── */

export type ApplyOutcome = { applied: boolean; state: WorkState; reason?: string }

/**
 * Apply what the Bureau reports about one item — from its push (agentwork.result) or from a pull. A
 * terminal item is never changed again, so a duplicate push or a push after a pull is a no-op.
 */
export async function applyWorkView(sql: Sql, view: WorkView): Promise<ApplyOutcome> {
  const row = await loadWork(sql, view.workId)
  if (!row) return { applied: false, state: 'failed', reason: 'unknown_work' }
  if (row.agent !== view.agent) return { applied: false, state: row.state, reason: 'agent_mismatch' }
  if (isTerminalWork(row.state)) return { applied: false, state: row.state, reason: 'already_terminal' }

  if (view.state === 'queued' || view.state === 'running') {
    await sql`UPDATE os_agent_work SET state = ${view.state}, started_at = coalesce(started_at, ${view.startedAt ?? null}::timestamptz),
      runtime = coalesce(${view.runtime ? JSON.stringify(view.runtime) : null}::jsonb, runtime), checked_at = now(), updated_at = now()
      WHERE id = ${row.id}::uuid AND state IN ('queued', 'running')`
    return { applied: true, state: view.state }
  }

  const lead = await loadLead(sql, row.subject_id)
  const ownsClaim = (l: LeadRow | null) => !!l && (l.research as { site?: { work?: string } } | null)?.site?.work === row.id

  if (view.state === 'completed') {
    const findings = parseFindings((view.result as { findings?: unknown } | undefined)?.findings)
    if (!findings) return failWork(sql, row, lead, { category: 'invalid', reason: 'result_shape', detail: 'The agent returned a result the OS could not accept.', retryable: true }, view.runtime)
    if (!lead) return failWork(sql, row, null, { category: 'invalid', reason: 'lead_gone', detail: 'The lead no longer exists.', retryable: false }, view.runtime)
    /* The OS's own scoring (the same rules applyResearchOutcome stores), so the item is never seen
       completed without its outcome. */
    const q = qualify(findings)
    const summary: WorkSummary = {
      lead: leadLabel(lead), origin: findings.origin,
      score: q.score, confidence: q.confidence, qualified: q.qualified,
      recommendation: recommendNext(findings, q),
      evidence: topFacts(findings),
      evidenceCount: findings.evidence.length, injectionSuspected: findings.injection_suspected,
      email: lead.email ?? findings.contact.email ?? null,
      verdict: q.verdict,
      inferences: (findings.inferences ?? []).slice(0, 2).map(i => i.text),
      opportunities: (findings.opportunities ?? []).slice(0, 2).map(o => ({ solution: o.solution, hypothesis: o.hypothesis })),
      checks: investigationPlan(findings, q, 3),
      record: {
        businessType: findings.business_type,
        pages: findings.pages.map(p => p.url).slice(0, 12),
        facts: findings.evidence.filter(e => e.kind !== 'opportunity').slice(0, 15).map(e => ({ text: e.text, quote: e.quote, url: e.url })),
        opportunities: (findings.opportunities ?? []).slice(0, 6).map(o => ({ solution: o.solution, hypothesis: o.hypothesis })),
        unknowns: investigationPlan(findings, q, 10),
        limitations: q.caveats,
      },
    }
    /* Claim first: two arrivals of the same result apply it once. */
    if (!await finish(sql, row.id, 'completed', { summary, runtime: view.runtime })) return { applied: false, state: 'completed', reason: 'already_terminal' }
    await applyResearchOutcome(sql, lead, { ok: true, findings }, RESEARCH_AGENT_ACTOR)
    await writeAudit(sql, { actor: RESEARCH_AGENT_ACTOR, channel: 'bureau', operation: 'agentwork.result', entityType: 'lead', entityId: row.subject_id, after: { work: row.id, state: 'completed', score: summary.score, qualified: summary.qualified, recommendation: summary.recommendation }, outcome: 'succeeded' })
    return { applied: true, state: 'completed' }
  }

  if (view.state === 'cancelled') {
    if (!await finish(sql, row.id, 'cancelled', { runtime: view.runtime })) return { applied: false, state: 'cancelled', reason: 'already_terminal' }
    if (lead && ownsClaim(lead)) await releaseResearchClaim(sql, lead.id, row.id, { state: 'failed', at: new Date().toISOString(), stage: 'site', reason: 'cancelled', detail: 'The research was cancelled.' })
    await writeAudit(sql, { actor: RESEARCH_AGENT_ACTOR, channel: 'bureau', operation: 'agentwork.result', entityType: 'lead', entityId: row.subject_id, after: { work: row.id, state: 'cancelled' }, outcome: 'succeeded' })
    return { applied: true, state: 'cancelled' }
  }

  const failure: WorkFailure = view.failure ?? { category: 'internal', reason: 'unspecified', detail: 'The agent reported a failure without a reason.', retryable: true }
  return failWork(sql, row, lead, failure, view.runtime)
}

async function failWork(sql: Sql, row: WorkRow, lead: LeadRow | null, failure: WorkFailure, runtime?: WorkView['runtime']): Promise<ApplyOutcome> {
  if (!await finish(sql, row.id, 'failed', { failure, runtime })) return { applied: false, state: 'failed', reason: 'already_terminal' }
  if (lead && (lead.research as { site?: { work?: string } } | null)?.site?.work === row.id) {
    await applyResearchOutcome(sql, lead, { ok: false, stage: failure.category === 'model' ? 'model' : 'site', reason: failure.reason, detail: failure.detail }, RESEARCH_AGENT_ACTOR)
  }
  await writeAudit(sql, { actor: RESEARCH_AGENT_ACTOR, channel: 'bureau', operation: 'agentwork.result', entityType: 'lead', entityId: row.subject_id, after: { work: row.id, state: 'failed', category: failure.category, reason: failure.reason }, outcome: 'failed', error: failure.reason })
  /* A failure is something Marcel may need to act on: it is an attention item, once. */
  await recordAgentEvents(sql, {
    client: 'bureau', actor: RESEARCH_AGENT_ACTOR,
    events: [{
      id: `work-failed-${row.id}`, kind: 'failed', severity: 'warning',
      title: `Research of ${lead ? leadLabel(lead) : 'a lead'} failed`,
      detail: `${failure.detail}${failure.retryable ? ' It can be started again.' : ''}`.slice(0, 500),
      runId: row.id, businessRef: { kind: 'lead', id: row.subject_id }, occurredAt: new Date().toISOString(),
    }],
  }).catch(err => console.error('[agent-work] attention event not recorded:', err instanceof Error ? err.message : err))
  return { applied: true, state: 'failed' }
}

/* ── reconcile (pull) ──────────────────────────────────────────────────── */

const ms = (d: Date | string | null) => (d ? new Date(d).getTime() : 0)

/**
 * Ask the Bureau about an open item when the OS shows it. Rate-limited per item. Work the Bureau does not
 * know, or work open past its deadline that the Bureau cannot account for, fails honestly.
 */
export async function reconcileWork(sql: Sql, id: string, deps: WorkDeps & { now?: Date } = {}): Promise<WorkRow | null> {
  const row = await loadWork(sql, id)
  if (!row || isTerminalWork(row.state)) return row
  const now = (deps.now ?? new Date()).getTime()
  if (now - ms(row.checked_at) < CHECK_SECONDS * 1000) return row
  await sql`UPDATE os_agent_work SET checked_at = now() WHERE id = ${id}::uuid`
  const call = await callBureau('status', { workId: id }, deps)
  if (call.ok) await applyWorkView(sql, call.work)
  else if (call.reason === 'not_found') await failWork(sql, row, await loadLead(sql, row.subject_id), { category: 'delivery', reason: 'unknown_to_bureau', detail: 'The Agent Bureau has no record of this work.', retryable: true })
  else if (now - ms(row.created_at) > WORK_DEADLINE_MINUTES * 60_000) {
    await failWork(sql, row, await loadLead(sql, row.subject_id), { category: 'timeout', reason: call.reason, detail: 'The work did not finish in time and the Agent Bureau could not be asked about it.', retryable: true })
  }
  return loadWork(sql, id)
}

/** Open items of one subject, reconciled. For the lead screen. */
export async function workForLead(sql: Sql, leadId: string, deps: WorkDeps = {}): Promise<WorkRow[]> {
  const rows = await sql`SELECT id::text FROM os_agent_work WHERE subject_kind = 'lead' AND subject_id = ${leadId}::uuid ORDER BY created_at DESC LIMIT 5` as { id: string }[]
  const out: WorkRow[] = []
  for (const r of rows) { const w = await reconcileWork(sql, r.id, deps); if (w) out.push(w) }
  return out
}
