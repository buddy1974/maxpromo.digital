/**
 * lib/commercial/direct.ts — SERVER ONLY.
 *
 * An OWNER DIRECT ACTION: Marcel pressing a button in /os. It needs no
 * approval — he is the approver — but it is held to the same two guarantees
 * as an approved agent action (ADR-0021):
 *
 *   - it happens once: a claim key is derived from the
 *     record and the exact content, so a double click or a retried request is
 *     one email; a deliberate resend says so and gets a fresh key;
 *   - it is recorded: one os_audit row per attempt, actor os:marcel, channel
 *     os-web, outcome and provider reference.
 *
 * Agents never reach this module; they request through the capability engine.
 */

import { sendDocumentMail } from '@/lib/mail/outbound'
import type { DocumentMail } from '@/lib/documents/mail'
import { writeAudit } from './audit'
import { sha256Hex } from './signing'
import { OWNER_ACTOR } from './engine'
import { berlinDate } from './money'
import { CapabilityRefusal, UncertainOutcome, type Sql } from './types'

export const DIRECT_CHANNEL = 'os-web'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Recipients from the screen, validated; null when any is unusable. */
export function recipients(list: unknown, fallback: string | null | undefined): string[] | null {
  const raw = Array.isArray(list) && list.length ? list : fallback ? [fallback] : []
  if (raw.length === 0 || raw.length > 10) return null
  const out = raw.map((r) => (typeof r === 'string' ? r.trim().toLowerCase() : ''))
  return out.every((r) => EMAIL.test(r) && r.length <= 254) ? [...new Set(out)] : null
}

/**
 * Marcel sends a stored quotation or invoice from /os (ADR-0021, ADR-0025): through the mailbox,
 * with the PDF attached, recorded in the client's conversation.
 *
 * Once: the mailbox API has no idempotency key, so the OS claims the send itself in
 * os_agent_results under a key derived from the record, the exact email version and the
 * recipients. A double click or a retried request finds the claim and sends nothing; a deliberate
 * resend says so and gets a fresh key. A refused send releases the claim; an unanswered one keeps
 * it (uncertain — never retried automatically).
 */
export async function sendDocumentDirect(sql: Sql, p: {
  operation: string
  entityType: 'angebot' | 'invoice'
  entityId: string
  to: string[]
  mail: DocumentMail
  entity: { kind: 'lead' | 'client'; id: string } | null
  resend?: boolean
}): Promise<{ ok: true; id?: string; duplicate?: boolean } | { ok: false; error: string; uncertain?: boolean; busy?: boolean }> {
  const fingerprint = sha256Hex(`${[...p.to].sort().join(',')}\n${p.mail.version}`).slice(0, 32)
  const key = `os-web:${p.entityType}:${p.entityId}:${fingerprint}${p.resend ? `:resend-${Date.now()}` : ''}`
  const claimed = await sql`INSERT INTO os_agent_results (request_id, capability, input_hash, status) VALUES (${key}, ${p.operation}, ${fingerprint}, 'running')
                            ON CONFLICT (request_id) DO NOTHING RETURNING request_id` as unknown[]
  if (!claimed.length) {
    const prior = await sql`SELECT status, response FROM os_agent_results WHERE request_id = ${key}` as { status: string; response: { ok?: boolean; id?: string; uncertain?: boolean } | null }[]
    if (prior[0]?.status !== 'done') return { ok: false, busy: true, error: 'This document is being sent right now.' }
    if (prior[0].response?.uncertain) return { ok: false, uncertain: true, error: 'An earlier send of this exact email may have been delivered. Check the Sent folder before resending.' }
    return { ok: true, id: prior[0].response?.id, duplicate: true }
  }
  const audit = (outcome: 'succeeded' | 'failed' | 'uncertain', externalRef?: string, error?: string) => writeAudit(sql, {
    actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, operation: p.operation, entityType: p.entityType, entityId: p.entityId,
    after: { recipients: p.to.length, version: p.mail.version, resend: !!p.resend, attachments: p.mail.attachmentMeta.length }, outcome, externalRef, error,
  })
  try {
    const sent = await sendDocumentMail(sql, {
      to: p.to, mail: p.mail, threadKey: `doc:${p.entityType}:${p.entityId}`, sendKey: `doc:${p.entityType}:${p.entityId}:${fingerprint}${p.resend ? `:${Date.now()}` : ''}`,
      entity: p.entity, actor: OWNER_ACTOR, approvalId: null, today: berlinDate(), audit: { document: p.entityType, [`${p.entityType}_id`]: p.entityId }, committed: () => {},
    })
    const id = sent.transport === 'evidence' ? 'evidence-sink' : sent.messageId
    await sql`UPDATE os_agent_results SET status = 'done', response = ${JSON.stringify({ ok: true, id })}::jsonb WHERE request_id = ${key}`
    await audit('succeeded', id)
    return { ok: true, id }
  } catch (error) {
    if (error instanceof UncertainOutcome) {
      await sql`UPDATE os_agent_results SET status = 'done', response = ${JSON.stringify({ ok: false, uncertain: true })}::jsonb WHERE request_id = ${key}`
      await audit('uncertain', undefined, error.message)
      return { ok: false, uncertain: true, error: error.message }
    }
    await sql`DELETE FROM os_agent_results WHERE request_id = ${key} AND status = 'running'`
    const message = error instanceof CapabilityRefusal ? error.message : 'The email could not be sent.'
    await audit('failed', undefined, message)
    return { ok: false, error: message }
  }
}
