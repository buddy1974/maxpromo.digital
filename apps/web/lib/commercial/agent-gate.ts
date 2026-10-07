/**
 * lib/commercial/agent-gate.ts — SERVER ONLY.
 *
 * The checks every agent request passes before any capability sees it,
 * separated from the route so the proof can drive them directly.
 *
 *   1. a secret is configured (else 503 — fail closed, never open);
 *   2. the signature is valid over timestamp, nonce, method, path and body;
 *   3. the nonce has never been seen (replay → 401);
 *   4. the actor is well formed and is on OS_AGENT_ALLOWED_ACTORS (required:
 *      an unset list refuses everyone) — the OS's own copy of "only Marcel", independent of
 *      the caller's binding table.
 */

import { verifySignature } from './signing'
import type { Sql } from './types'

export type GateResult =
  | { ok: true; actor: string; channel: string; body: Record<string, unknown> }
  | { ok: false; status: 401 | 403 | 400 | 503; error: string }

const ACTOR = /^(telegram:\d{4,15}|openclaw:[a-z0-9][a-z0-9-]{1,40})$/
const CHANNEL = /^[a-z][a-z0-9-]{1,20}$/

export function allowedActors(env: string | undefined): Set<string> | null {
  const list = (env ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return list.length ? new Set(list) : null
}

export async function admitAgentRequest(p: {
  sql: Sql | null
  secret: string | undefined
  allowList: string | undefined
  headers: { get(name: string): string | null }
  method: string
  path: string
  rawBody: string
  nowSeconds?: number
}): Promise<GateResult> {
  const verdict = verifySignature({ secret: p.secret, headers: p.headers, method: p.method, path: p.path, body: p.rawBody, nowSeconds: p.nowSeconds })
  if (!verdict.ok) {
    if (verdict.reason === 'not_configured') return { ok: false, status: 503, error: 'agent_api_not_configured' }
    /* One answer for every signature failure. Which check failed is logged
       for the operator, not told to the caller. */
    console.warn('[agent-api] refused:', verdict.reason)
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
  if (!ACTOR.test(actor) || !CHANNEL.test(channel)) return { ok: false, status: 400, error: 'invalid_actor' }
  /* Fail closed: without a declared list of who may act, nobody may. */
  const allow = allowedActors(p.allowList)
  if (!allow) return { ok: false, status: 503, error: 'agent_api_not_configured' }
  if (!allow.has(actor)) {
    console.warn('[agent-api] refused: actor not on OS_AGENT_ALLOWED_ACTORS')
    return { ok: false, status: 403, error: 'actor_not_allowed' }
  }
  return { ok: true, actor, channel, body }
}
