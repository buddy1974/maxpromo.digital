/**
 * lib/commercial/agent-gate.ts — SERVER ONLY.
 *
 * The checks every machine request passes before any capability sees it,
 * separated from the route so the proof can drive them directly (ADR-0018,
 * ADR-0021).
 *
 *   1. the request names a known client; that client's secret is configured
 *      and differs from every other client's (else 503 — fail closed);
 *   2. the signature is valid over timestamp, nonce, method, path and body;
 *   3. the nonce has never been seen (replay → 401);
 *   4. the actor is well formed for that client and is on that client's
 *      allow-list (required: an unset list refuses everyone).
 *
 * Authority is per client, not per secret holder: the Agent Bureau may read,
 * report and *request* business actions; only the owner decides them. A
 * Bureau request can never execute or reject an approval.
 */

import { AGENT_HEADERS, AGENT_CLIENTS, type AgentClientId } from '@maxpromo/config/agent-contract'
import { verifySignature } from './signing'
import type { Sql } from './types'

export type AgentAction = 'capabilities' | 'run' | 'execute' | 'reject' | 'events' | 'model'

export interface ClientPolicy {
  id: AgentClientId
  /** Env names, so a proof can see which credential a client uses without reading it. */
  secretEnv: string
  allowListEnv: string
  actor: RegExp
  actions: ReadonlySet<AgentAction>
  /** null = every registered capability. */
  capabilities: ReadonlySet<string> | null
}

/**
 * What an agent in the Agent Control Plane may ask of the business. Reads,
 * intake, drafting and *preparing* consequential actions — which only creates
 * an approval Marcel decides in the OS. Deliberately not: execute, reject,
 * deletes, payments recorded on its own say-so.
 */
export const BUREAU_CAPABILITIES: ReadonlySet<string> = new Set([
  'lead.intake', 'lead.check', 'lead.find', 'lead.history', 'pipeline.show', 'followup.due',
  'outreach.draft', 'outreach.send', 'proposal.show', 'proposal.list', 'receivables.show',
  'commercial.search', 'approvals.requested',
  /* ADR-0030: the Research Agent hands delegated work back. agentwork.request is not here: no agent delegates. */
  'agentwork.result',
])

export const CLIENT_POLICIES: Readonly<Record<AgentClientId, ClientPolicy>> = {
  /** OpenClaw Mission Control / Telegram (ADR-0018). Production has no allow-list since 2026-10-23. */
  legacy: {
    id: 'legacy', secretEnv: 'OS_AGENT_SECRET', allowListEnv: 'OS_AGENT_ALLOWED_ACTORS',
    actor: /^(telegram:\d{4,15}|openclaw:[a-z0-9][a-z0-9-]{1,40})$/,
    actions: new Set<AgentAction>(['capabilities', 'run', 'execute', 'reject']),
    capabilities: null,
  },
  /** Agent Bureau (ADR-0021). Actor = bureau:<agent key>. */
  bureau: {
    id: 'bureau', secretEnv: 'OS_BUREAU_AGENT_SECRET', allowListEnv: 'OS_BUREAU_ALLOWED_AGENTS',
    actor: /^bureau:[a-z0-9][a-z0-9-]{1,40}$/,
    /* model (ADR-0030): a registered model task through the OS gateway; the Bureau holds no model key. */
    actions: new Set<AgentAction>(['capabilities', 'run', 'events', 'model']),
    capabilities: BUREAU_CAPABILITIES,
  },
}

export type GateResult =
  | { ok: true; client: ClientPolicy; actor: string; channel: string; body: Record<string, unknown> }
  | { ok: false; status: 401 | 403 | 400 | 503; error: string }

const CHANNEL = /^[a-z][a-z0-9-]{1,20}$/

export function allowedActors(env: string | undefined): Set<string> | null {
  const list = (env ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return list.length ? new Set(list) : null
}

export function clientFromHeader(value: string | null): ClientPolicy | null {
  const id = value ?? 'legacy'
  return (AGENT_CLIENTS as readonly string[]).includes(id) ? CLIENT_POLICIES[id as AgentClientId] : null
}

export async function admitAgentRequest(p: {
  sql: Sql | null
  env: Record<string, string | undefined>
  action: AgentAction
  headers: { get(name: string): string | null }
  method: string
  path: string
  rawBody: string
  nowSeconds?: number
}): Promise<GateResult> {
  const client = clientFromHeader(p.headers.get(AGENT_HEADERS.client))
  if (!client) return { ok: false, status: 400, error: 'unknown_client' }
  const secret = p.env[client.secretEnv]

  /* One credential per client. A secret shared with another client is a
     configuration error: it would let one client sign as the other. */
  const shared = Object.values(CLIENT_POLICIES).some((other) => other.id !== client.id && secret && p.env[other.secretEnv] === secret)
  if (shared) {
    console.error('[agent-api] refused: two clients share one secret')
    return { ok: false, status: 503, error: 'agent_api_not_configured' }
  }

  const verdict = verifySignature({ secret, headers: p.headers, method: p.method, path: p.path, body: p.rawBody, nowSeconds: p.nowSeconds })
  if (!verdict.ok) {
    if (verdict.reason === 'not_configured') return { ok: false, status: 503, error: 'agent_api_not_configured' }
    /* One answer for every signature failure. Which check failed is logged
       for the operator, not told to the caller. */
    console.warn('[agent-api] refused:', client.id, verdict.reason)
    return { ok: false, status: 401, error: 'unauthorized' }
  }
  if (!p.sql) return { ok: false, status: 503, error: 'database_not_configured' }

  /* Replay. The primary key decides, atomically. */
  const fresh = await p.sql`INSERT INTO os_agent_nonces (nonce) VALUES (${verdict.nonce}) ON CONFLICT DO NOTHING RETURNING nonce` as { nonce: string }[]
  if (!fresh.length) {
    console.warn('[agent-api] refused: replayed nonce')
    return { ok: false, status: 401, error: 'unauthorized' }
  }
  /* Housekeeping, cheap and bounded: nonces outside every possible window. */
  if (Math.random() < 0.05) await p.sql`DELETE FROM os_agent_nonces WHERE received_at < now() - interval '1 day'`

  let body: Record<string, unknown>
  try {
    const parsed: unknown = p.rawBody ? JSON.parse(p.rawBody) : {}
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return { ok: false, status: 400, error: 'invalid_json' }
  }

  const actor = typeof body.actor === 'string' ? body.actor : ''
  const channel = typeof body.channel === 'string' ? body.channel : ''
  if (!client.actor.test(actor) || !CHANNEL.test(channel)) return { ok: false, status: 400, error: 'invalid_actor' }
  /* Fail closed: without a declared list of who may act, nobody may. */
  const allow = allowedActors(p.env[client.allowListEnv])
  if (!allow) return { ok: false, status: 503, error: 'agent_api_not_configured' }
  if (!allow.has(actor)) {
    console.warn('[agent-api] refused: actor not on', client.allowListEnv)
    return { ok: false, status: 403, error: 'actor_not_allowed' }
  }
  if (!client.actions.has(p.action)) {
    console.warn('[agent-api] refused:', client.id, 'may not', p.action)
    return { ok: false, status: 403, error: 'action_not_allowed' }
  }
  return { ok: true, client, actor, channel, body }
}

/** May this client ask for this capability at all? Checked before the engine sees it. */
export function clientMayUse(client: ClientPolicy, capability: string): boolean {
  return client.capabilities === null || client.capabilities.has(capability)
}
