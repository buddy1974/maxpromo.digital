/**
 * lib/commercial/direct.ts — SERVER ONLY.
 *
 * An OWNER DIRECT ACTION: Marcel pressing a button in /os. It needs no
 * approval — he is the approver — but it is held to the same two guarantees
 * as an approved agent action (ADR-0021):
 *
 *   - it happens once: the provider idempotency key is derived from the
 *     record and the exact content, so a double click or a retried request is
 *     one email; a deliberate resend says so and gets a fresh key;
 *   - it is recorded: one os_audit row per attempt, actor os:marcel, channel
 *     os-web, outcome and provider reference.
 *
 * Agents never reach this module; they request through the capability engine.
 */

import { sendEmail } from '@/lib/email'
import { DOCUMENT_FROM_EMAIL } from '@/lib/documents/emails'
import { writeAudit } from './audit'
import { sha256Hex } from './signing'
import { OWNER_ACTOR } from './engine'
import type { Sql } from './types'

export const DIRECT_CHANNEL = 'os-web'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Recipients from the screen, validated; null when any is unusable. */
export function recipients(list: unknown, fallback: string | null | undefined): string[] | null {
  const raw = Array.isArray(list) && list.length ? list : fallback ? [fallback] : []
  if (raw.length === 0 || raw.length > 10) return null
  const out = raw.map((r) => (typeof r === 'string' ? r.trim().toLowerCase() : ''))
  return out.every((r) => EMAIL.test(r) && r.length <= 254) ? [...new Set(out)] : null
}

export async function sendDocumentDirect(sql: Sql, p: {
  operation: string
  entityType: 'angebot' | 'invoice'
  entityId: string
  to: string[]
  subject: string
  html: string
  copyToOwner: boolean
  resend?: boolean
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const version = sha256Hex(`${[...p.to].sort().join(',')}\n${p.subject}\n${p.html}`).slice(0, 32)
  const key = `os-web:${p.entityType}:${p.entityId}:${version}${p.resend ? `:resend-${Date.now()}` : ''}`
  const result = await sendEmail({
    to: p.to, from: DOCUMENT_FROM_EMAIL, replyTo: 'info@maxpromo.digital', subject: p.subject, html: p.html,
    bcc: p.copyToOwner ? ['info@maxpromo.digital'] : [], idempotencyKey: key,
  })
  await writeAudit(sql, {
    actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, operation: p.operation, entityType: p.entityType, entityId: p.entityId,
    after: { recipients: p.to.length, version, resend: !!p.resend }, outcome: result.success ? 'succeeded' : 'failed',
    externalRef: result.id, error: result.success ? undefined : result.error ?? 'provider refused',
  })
  return result.success ? { ok: true, id: result.id } : { ok: false, error: result.error ?? 'provider refused' }
}
