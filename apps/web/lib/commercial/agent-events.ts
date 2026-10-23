/**
 * lib/commercial/agent-events.ts — SERVER ONLY.
 *
 * The OS's projection of what the Agent Control Plane reports (ADR-0021):
 * an agent blocked, failed, finished important work, found an exception or
 * recommends something. The Bureau owns the run; the OS keeps only what it
 * shows on /os so Marcel has one place to look.
 *
 * Idempotent by (client, event_id): a resent batch stores nothing twice.
 * Agent text is data — rendered as text, never interpreted.
 */

import { AGENT_EVENT_KINDS, AGENT_EVENT_SEVERITIES } from '@maxpromo/config/agent-contract'
import type { Sql } from './types'

const BUSINESS_KINDS = ['lead', 'client', 'angebot', 'invoice', 'job', 'email_thread'] as const
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EVENT_ID = /^[A-Za-z0-9:_.-]{8,120}$/
const MAX_BATCH = 20

/** Printable single-line text, bounded. Control characters are removed, never interpreted. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const clean = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
  return clean ? clean.slice(0, max) : null
}

export interface StoredAgentEvent {
  id: string
  agent: string
  kind: string
  severity: string
  title: string
  detail: string | null
  run_id: string | null
  business_kind: string | null
  business_id: string | null
  approval_id: string | null
  occurred_at: Date
  received_at: Date
}

export type EventsResponse =
  | { status: 'done'; accepted: number; duplicates: number }
  | { status: 'refused'; code: 'invalid_events'; message: string; index?: number }

export async function recordAgentEvents(
  sql: Sql, p: { client: 'legacy' | 'bureau'; actor: string; events: unknown },
): Promise<EventsResponse> {
  if (p.client !== 'bureau') return { status: 'refused', code: 'invalid_events', message: 'Only the Agent Bureau reports agent events.' }
  if (!Array.isArray(p.events) || p.events.length === 0 || p.events.length > MAX_BATCH) {
    return { status: 'refused', code: 'invalid_events', message: `Send 1–${MAX_BATCH} events.` }
  }
  const agent = p.actor.slice('bureau:'.length)
  const rows = []
  for (const [index, raw] of p.events.entries()) {
    const e = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : null
    const id = typeof e?.id === 'string' && EVENT_ID.test(e.id) ? e.id : null
    const kind = (AGENT_EVENT_KINDS as readonly unknown[]).includes(e?.kind) ? String(e!.kind) : null
    const severity = (AGENT_EVENT_SEVERITIES as readonly unknown[]).includes(e?.severity) ? String(e!.severity) : null
    const title = text(e?.title, 200)
    const occurred = typeof e?.occurredAt === 'string' && Number.isFinite(Date.parse(e.occurredAt)) ? new Date(e.occurredAt) : null
    const ref = e?.businessRef && typeof e.businessRef === 'object' ? e.businessRef as Record<string, unknown> : null
    const businessKind = ref && (BUSINESS_KINDS as readonly unknown[]).includes(ref.kind) ? String(ref.kind) : null
    const businessId = ref && typeof ref.id === 'string' && UUID.test(ref.id) ? ref.id : null
    const approvalId = typeof e?.approvalId === 'string' && UUID.test(e.approvalId) ? e.approvalId : null
    if (!id || !kind || !severity || !title || !occurred || (ref && (!businessKind || !businessId)) || (e?.approvalId !== undefined && !approvalId)) {
      return { status: 'refused', code: 'invalid_events', message: 'An event is malformed. Nothing was stored.', index }
    }
    /* An event cannot claim to be from the future: clocks drift, but not by a day. */
    if (occurred.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return { status: 'refused', code: 'invalid_events', message: 'An event is dated in the future. Nothing was stored.', index }
    }
    rows.push({
      event_id: id, agent, kind, severity, title,
      detail: text(e?.detail, 1000), run_id: text(e?.runId, 120),
      business_kind: businessKind, business_id: businessId, approval_id: approvalId,
      occurred_at: occurred.toISOString(),
    })
  }

  let accepted = 0
  for (const r of rows) {
    /* An approval id must name a real approval; a dangling one is dropped, not trusted. */
    const inserted = await sql`
      INSERT INTO os_agent_events (client, event_id, agent, kind, severity, title, detail, run_id,
                                   business_kind, business_id, approval_id, occurred_at)
      VALUES (${p.client}, ${r.event_id}, ${r.agent}, ${r.kind}, ${r.severity}, ${r.title}, ${r.detail}, ${r.run_id},
              ${r.business_kind}, ${r.business_id},
              (SELECT id FROM os_approvals WHERE id = ${r.approval_id}::uuid), ${r.occurred_at}::timestamptz)
      ON CONFLICT (client, event_id) DO NOTHING
      RETURNING id` as { id: string }[]
    accepted += inserted.length
  }
  return { status: 'done', accepted, duplicates: rows.length - accepted }
}

/** Unacknowledged events the owner has not seen, newest first. Failures and exceptions lead. */
export async function openAgentEvents(sql: Sql, limit = 20): Promise<StoredAgentEvent[]> {
  return await sql`
    SELECT id, agent, kind, severity, title, detail, run_id, business_kind, business_id, approval_id, occurred_at, received_at
    FROM os_agent_events
    WHERE acknowledged_at IS NULL AND received_at > now() - interval '30 days'
    ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, received_at DESC
    LIMIT ${limit}` as StoredAgentEvent[]
}

export async function acknowledgeAgentEvent(sql: Sql, id: string, by: string): Promise<boolean> {
  if (!UUID.test(id)) return false
  const rows = await sql`UPDATE os_agent_events SET acknowledged_at = now(), acknowledged_by = ${by}
                         WHERE id = ${id}::uuid AND acknowledged_at IS NULL RETURNING id` as { id: string }[]
  return rows.length === 1
}
