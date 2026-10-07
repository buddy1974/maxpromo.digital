/**
 * lib/commercial/audit.ts
 *
 * The append-only record of consequential commercial actions (os_audit).
 *
 * Records who, through which interface, did what to which record, from what
 * state to what state, under which approval, and how it ended — including
 * refusals and outcomes nobody can be sure of. Never request text, never a
 * credential: `redactForAudit` removes anything that looks like one before a
 * value is stored.
 */

import type { Sql } from './types'

export type AuditOutcome = 'succeeded' | 'failed' | 'refused' | 'uncertain'

export interface AuditEntry {
  actor: string
  channel: string
  operation: string
  entityType?: string
  entityId?: string
  before?: unknown
  after?: unknown
  payloadHash?: string
  approvalId?: string
  outcome: AuditOutcome
  externalRef?: string
  error?: string
}

const SECRETISH = /(sk-[A-Za-z0-9_-]{8,}|re_[A-Za-z0-9]{8,}|\b\d{8,10}:[A-Za-z0-9_-]{30,}\b|Bearer\s+[A-Za-z0-9._-]+|postgres(ql)?:\/\/\S+|password\s*[=:]\s*\S+)/gi

export function redactForAudit(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(SECRETISH, '[redacted]')
  if (Array.isArray(value)) return value.map(redactForAudit)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = /secret|token|password|api[_-]?key|iban|signature/i.test(k) ? '[redacted]' : redactForAudit(v)
    }
    return out
  }
  return value
}

export async function writeAudit(sql: Sql, e: AuditEntry): Promise<void> {
  try {
    await sql`
      INSERT INTO os_audit
        (actor, channel, operation, entity_type, entity_id, before_state, after_state,
         payload_hash, approval_id, outcome, external_ref, error)
      VALUES
        (${e.actor}, ${e.channel}, ${e.operation}, ${e.entityType ?? null}, ${e.entityId ?? null},
         ${e.before === undefined ? null : JSON.stringify(redactForAudit(e.before))}::jsonb,
         ${e.after === undefined ? null : JSON.stringify(redactForAudit(e.after))}::jsonb,
         ${e.payloadHash ?? null}, ${e.approvalId ?? null}, ${e.outcome},
         ${e.externalRef ?? null}, ${e.error ? String(redactForAudit(e.error)).slice(0, 500) : null})`
  } catch (err) {
    /* An audit failure is reported loudly but does not undo a completed
       action: the action happened, and pretending otherwise would be worse.
       ADR-0010 — nothing fails silently. */
    console.error('[audit] FAILED to record', e.operation, e.outcome, err instanceof Error ? err.message : err)
  }
}
