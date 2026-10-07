/**
 * lib/commercial/engine.ts
 *
 * The one path every agent request takes through the commercial OS.
 *
 *   run       GREEN executes now. AMBER is prepared into an approval and
 *             nothing changes. RED and unknown capabilities are refused.
 *   execute   performs one pending approval, once, by the exact payload hash
 *             it was prepared with, before it expires.
 *   reject    closes a pending approval without doing it.
 *
 * Idempotency is layered rather than hoped for:
 *
 *   - the caller names every logical request; a retry of a request the OS
 *     already answered gets the stored answer (os_agent_results);
 *   - an approval is claimed with one conditional UPDATE, so two concurrent
 *     executions cannot both win; a replay of an executed approval returns
 *     what the first execution returned and does nothing else;
 *   - editing a payload means a new preparation and a new hash. An old
 *     approval cannot authorise a newer payload, and preparing a different
 *     payload for the same action supersedes the older pending approval.
 *
 * Outcomes the OS cannot know — an email handed to the provider and then a
 * timeout — are recorded as `uncertain`, never as sent and never as failed.
 */

import { writeAudit } from './audit'
import { payloadHash, sha256Hex, stableStringify } from './signing'
import { berlinDate } from './money'
import { CAPABILITIES } from './registry'
import {
  CapabilityRefusal, UncertainOutcome, isPrepared,
  type CapabilityContext, type CapabilityResult, type Sql,
} from './types'
import { InputError } from './validate'

export type EngineResponse =
  | { status: 'done'; capability: string; result: CapabilityResult }
  | {
      status: 'approval_required'
      capability: string
      approval: { id: string; payloadHash: string; summary: string; preview: Record<string, string>; expiresAt: string }
    }
  | { status: 'refused'; capability: string; code: string; message: string }
  | { status: 'failed'; capability: string; message: string; retrySafe: boolean }

export interface EngineRequest {
  requestId: string
  actor: string
  channel: string
  capability: string
  input: unknown
}

interface Commitment { what: string; externalRef?: string }

function context(sql: Sql, actor: string, channel: string, now = new Date()): CapabilityContext & { commitment: () => Commitment | null } {
  let commitment: Commitment | null = null
  return {
    sql, actor, channel, now, today: berlinDate(now),
    committed: (what, externalRef) => { commitment = { what, ...(externalRef ? { externalRef } : {}) } },
    commitment: () => commitment,
  }
}

function refusal(capability: string, err: unknown): EngineResponse | null {
  if (err instanceof InputError) return { status: 'refused', capability, code: 'invalid_input', message: err.message }
  if (err instanceof CapabilityRefusal) return { status: 'refused', capability, code: err.code, message: err.message }
  return null
}

export async function runCapability(sql: Sql, req: EngineRequest): Promise<EngineResponse> {
  const cap = CAPABILITIES.get(req.capability)
  if (!cap) {
    return { status: 'refused', capability: req.capability, code: 'unknown_capability', message: 'The OS has no such capability.' }
  }
  if (cap.risk === 'RED') {
    await writeAudit(sql, { actor: req.actor, channel: req.channel, operation: cap.id, outcome: 'refused', error: 'RED capability' })
    return { status: 'refused', capability: cap.id, code: 'red', message: 'This action is never performed from a remote interface.' }
  }

  /* Request-level idempotency. Same id, same input → same answer. Same id,
     different input → refused: an id may not be reused for another request. */
  const inputHash = sha256Hex(`${cap.id}\n${stableStringify(req.input ?? {})}`)
  const claimed = await sql`
    INSERT INTO os_agent_results (request_id, capability, input_hash, status)
    VALUES (${req.requestId}, ${cap.id}, ${inputHash}, 'running')
    ON CONFLICT (request_id) DO NOTHING
    RETURNING request_id` as { request_id: string }[]
  if (claimed.length === 0) {
    const prior = await sql`SELECT capability, input_hash, status, response FROM os_agent_results WHERE request_id = ${req.requestId}` as
      { capability: string; input_hash: string; status: string; response: EngineResponse | null }[]
    const p = prior[0]
    if (!p || p.capability !== cap.id || p.input_hash !== inputHash) {
      return { status: 'refused', capability: cap.id, code: 'request_id_reused', message: 'That request id was already used for a different request.' }
    }
    if (p.status === 'done' && p.response) return p.response
    return { status: 'failed', capability: cap.id, message: 'The same request is still being processed.', retrySafe: true }
  }

  const ctx = context(sql, req.actor, req.channel)
  let response: EngineResponse
  try {
    const input = cap.input.parse(req.input ?? {}, '')
    if (cap.risk === 'GREEN') {
      if (!cap.run) throw new Error(`capability ${cap.id} has no run binding`)
      response = { status: 'done', capability: cap.id, result: await cap.run(ctx, input) }
    } else {
      if (!cap.prepare || !cap.execute) throw new Error(`capability ${cap.id} has no prepare/execute binding`)
      const prepared = await cap.prepare(ctx, input)
      if (!isPrepared(prepared)) {
        /* A preparation can conclude there is nothing to approve: an
           ambiguous target, nothing owed, already done. That is an answer. */
        response = { status: 'done', capability: cap.id, result: prepared }
      } else {
        response = await createApproval(ctx, cap.id, cap.risk, prepared)
      }
    }
  } catch (err) {
    const r = refusal(cap.id, err)
    if (r) {
      response = r
    } else {
      console.error(`[commercial] ${cap.id} failed`, err instanceof Error ? err.message : err)
      /* A GREEN read or a preparation changed nothing consequential, so a
         retry under a new request id is safe. */
      response = { status: 'failed', capability: cap.id, message: 'The OS could not complete this request.', retrySafe: true }
    }
  }

  await sql`UPDATE os_agent_results SET status = 'done', response = ${JSON.stringify(response)}::jsonb WHERE request_id = ${req.requestId}`
  /* Bounded growth: a stored answer only matters while its request could be retried. */
  if (Math.random() < 0.02) await sql`DELETE FROM os_agent_results WHERE created_at < now() - interval '7 days'`
  return response
}

async function createApproval(
  ctx: CapabilityContext, capability: string, risk: 'AMBER' | 'RED', p: import('./types').Prepared,
): Promise<EngineResponse> {
  const hash = payloadHash(capability, p.payload)
  const minutes = Math.min(Math.max(p.expiresInMinutes ?? 30, 1), 7 * 24 * 60)
  const dedupe = p.dedupeKey ? `${capability}:${p.dedupeKey}` : null

  if (dedupe) {
    /* The same action prepared again. Identical payload → the same approval.
       A different payload → the old one is superseded, so it can no longer
       be executed by a stale button. */
    const existing = await ctx.sql`
      SELECT id, payload_hash, summary, preview, expires_at FROM os_approvals
      WHERE dedupe_key = ${dedupe} AND status = 'pending' AND expires_at > now()` as
      { id: string; payload_hash: string; summary: string; preview: Record<string, string>; expires_at: string }[]
    if (existing[0]?.payload_hash === hash) {
      const e = existing[0]
      return { status: 'approval_required', capability, approval: { id: e.id, payloadHash: hash, summary: e.summary, preview: e.preview, expiresAt: new Date(e.expires_at).toISOString() } }
    }
    await ctx.sql`UPDATE os_approvals SET status = 'superseded', decided_at = now(), decided_by = ${ctx.actor}
                  WHERE dedupe_key = ${dedupe} AND status = 'pending'`
  }

  const rows = await ctx.sql`
    INSERT INTO os_approvals (capability, risk, summary, preview, payload, payload_hash, expires_at, requested_by, dedupe_key)
    VALUES (${capability}, ${risk}, ${p.summary}, ${JSON.stringify(p.preview)}::jsonb, ${JSON.stringify(p.payload)}::jsonb,
            ${hash}, now() + make_interval(mins => ${minutes}), ${ctx.actor}, ${dedupe})
    RETURNING id, expires_at` as { id: string; expires_at: string }[]
  return {
    status: 'approval_required',
    capability,
    approval: { id: rows[0].id, payloadHash: hash, summary: p.summary, preview: p.preview, expiresAt: new Date(rows[0].expires_at).toISOString() },
  }
}

interface ApprovalRow {
  id: string
  capability: string
  payload: Record<string, unknown>
  payload_hash: string
  status: string
  expires_at: string
  result: EngineResponse | null
}

export async function executeApproval(
  sql: Sql,
  req: { approvalId: string; payloadHash: string; actor: string; channel: string },
): Promise<EngineResponse> {
  /* Claim. One statement decides: pending, same hash, not expired. */
  const claimed = await sql`
    UPDATE os_approvals SET status = 'executing', decided_by = ${req.actor}, decided_at = now()
    WHERE id = ${req.approvalId} AND status = 'pending' AND payload_hash = ${req.payloadHash} AND expires_at > now()
    RETURNING id, capability, payload, payload_hash, status, expires_at, result` as ApprovalRow[]

  if (claimed.length === 0) {
    const found = await sql`SELECT id, capability, payload, payload_hash, status, expires_at, result FROM os_approvals WHERE id = ${req.approvalId}` as ApprovalRow[]
    const a = found[0]
    const capability = a?.capability ?? 'unknown'
    let message: string
    let code: string
    if (!a) { code = 'not_found'; message = 'There is no such approval.' }
    else if (a.payload_hash !== req.payloadHash) { code = 'payload_changed'; message = 'This approval was for a different version of the action. Nothing was done.' }
    else if (a.status === 'executed' && a.result) {
      /* A replay or a double tap. The first answer, and nothing new. */
      await writeAudit(sql, { actor: req.actor, channel: req.channel, operation: `${capability}.replay`, approvalId: a.id, outcome: 'refused', error: 'already executed' })
      return a.result
    }
    else if (a.status === 'executing') { code = 'in_progress'; message = 'This action is already being carried out.' }
    else if (a.status === 'pending') { code = 'expired'; message = 'This approval has expired. Nothing was done; prepare it again.' ; await sql`UPDATE os_approvals SET status = 'expired' WHERE id = ${a.id} AND status = 'pending'` }
    else { code = a.status; message = `This approval is ${a.status}. Nothing was done.` }
    await writeAudit(sql, { actor: req.actor, channel: req.channel, operation: `${capability}.execute`, approvalId: req.approvalId, payloadHash: req.payloadHash, outcome: 'refused', error: code })
    return { status: 'refused', capability, code, message }
  }

  const a = claimed[0]
  const cap = CAPABILITIES.get(a.capability)
  if (!cap?.execute || cap.risk === 'RED') {
    await sql`UPDATE os_approvals SET status = 'failed' WHERE id = ${a.id}`
    return { status: 'refused', capability: a.capability, code: 'unsupported', message: 'This action can no longer be executed.' }
  }

  const ctx = context(sql, req.actor, req.channel)
  let response: EngineResponse
  let finalStatus: 'executed' | 'failed'
  try {
    const result = await cap.execute(ctx, a.payload, a.id)
    response = { status: 'done', capability: a.capability, result }
    finalStatus = 'executed'
  } catch (err) {
    const r = refusal(a.capability, err)
    const done = ctx.commitment()
    if (done) {
      /* The external effect happened; what failed was recording it. Say both. */
      console.error(`[commercial] ${a.capability} committed, then failed to record`, err instanceof Error ? err.message : err)
      response = {
        status: 'done',
        capability: a.capability,
        result: {
          summary: `${done.what} — but the OS could not finish recording it (history, status or follow-up may be missing). Do not send it again.`,
        },
      }
      finalStatus = 'executed'
      await writeAudit(sql, {
        actor: req.actor, channel: req.channel, operation: a.capability, approvalId: a.id, payloadHash: a.payload_hash,
        outcome: 'succeeded', externalRef: done.externalRef, error: `recording incomplete: ${err instanceof Error ? err.message : String(err)}`,
      })
    } else if (r) {
      response = r
      finalStatus = 'failed'
    } else {
      const uncertain = err instanceof UncertainOutcome
      console.error(`[commercial] execute ${a.capability} failed`, err instanceof Error ? err.message : err)
      response = {
        status: 'failed',
        capability: a.capability,
        message: uncertain
          ? `${(err as UncertainOutcome).message} Check before trying again.`
          : 'The action failed. Nothing was recorded as done.',
        retrySafe: !uncertain,
      }
      finalStatus = 'failed'
      await writeAudit(sql, {
        actor: req.actor, channel: req.channel, operation: a.capability, approvalId: a.id,
        payloadHash: a.payload_hash, outcome: uncertain ? 'uncertain' : 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  await sql`UPDATE os_approvals SET status = ${finalStatus}, result = ${JSON.stringify(response)}::jsonb WHERE id = ${a.id}`
  return response
}

export async function rejectApproval(
  sql: Sql, req: { approvalId: string; actor: string; channel: string },
): Promise<EngineResponse> {
  const rows = await sql`
    UPDATE os_approvals SET status = 'rejected', decided_by = ${req.actor}, decided_at = now()
    WHERE id = ${req.approvalId} AND status = 'pending'
    RETURNING capability, summary` as { capability: string; summary: string }[]
  if (!rows.length) return { status: 'refused', capability: 'approval.reject', code: 'not_pending', message: 'Nothing is waiting under that approval.' }
  await writeAudit(sql, { actor: req.actor, channel: req.channel, operation: `${rows[0].capability}.reject`, approvalId: req.approvalId, outcome: 'succeeded' })
  return { status: 'done', capability: rows[0].capability, result: { summary: `Cancelled: ${rows[0].summary}` } }
}
