/**
 * lib/channels/store.ts — SERVER ONLY.
 *
 * The conversation store on Neon (schema `chat`, migrations 0006 + 0012).
 *
 * Every write that a webhook retry could repeat is insert-once by a key the
 * provider gave us (the message id) or we derived (the reply key), so the
 * database — not the code path — decides that the second delivery is a no-op.
 * The processing lease is a conditional UPDATE against the database clock, so
 * two serverless instances cannot both answer one conversation.
 */

import type { Sql } from '@/lib/commercial/types'
import type {
  Conversation, ConversationPatch, ConversationStore, OutboundStatus, StoredMessage, TrailKind,
} from './orchestrator'
import type { HandoverState, Lang } from './policy'
import type { ContactRef, InboundKind } from './types'
import type { Facts, Intent } from './understanding'

const ORIGIN = 'whatsapp'
const CHANNEL = 'whatsapp'

type Row = Record<string, unknown>
const d = (x: unknown): Date | null => (x ? new Date(x as string) : null)

function dayText(x: unknown): string | null {
  if (!x) return null
  if (x instanceof Date) {
    /* DATE comes back as local midnight from the driver (risk 58's trap). */
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  }
  return String(x).slice(0, 10)
}

function mapConversation(r: Row): Conversation {
  return {
    id: r.id as string,
    contact: {
      ...(r.contact_phone ? { phone: r.contact_phone as string } : {}),
      ...(r.contact_user_id ? { userId: r.contact_user_id as string } : {}),
      ...(r.visitor_label ? { profileName: r.visitor_label as string } : {}),
    },
    handoverState: ((r.handover_state as string) || 'bot') as HandoverState,
    handoverReason: (r.handover_reason as string | null) ?? null,
    handoverAt: d(r.handover_at),
    humanLastAt: d(r.human_last_at),
    lastInboundAt: d(r.last_inbound_at),
    language: r.locale === 'en' || r.locale === 'de' ? (r.locale as Lang) : null,
    identity: (r.identity as Conversation['identity']) ?? 'unresolved',
    leadId: (r.lead_id as string | null) ?? null,
    clientId: (r.client_id as string | null) ?? null,
    knownFirstName: (r.known_first_name as string | null) ?? null,
    facts: (r.facts as Facts) ?? {},
    intent: (r.intent as Intent | null) ?? null,
    qualifiedAt: d(r.qualified_at),
    disclosedAt: d(r.disclosed_at),
    modelTurnsDay: dayText(r.model_turns_day),
    modelTurns: Number(r.model_turns ?? 0),
  }
}

function mapMessage(r: Row): StoredMessage {
  return {
    id: String(r.id),
    externalId: (r.external_id as string | null) ?? null,
    role: r.role as StoredMessage['role'],
    kind: ((r.kind as string) || 'text') as InboundKind,
    text: (r.content as string) ?? '',
    at: new Date(r.at as string),
  }
}

/** Patch field → column. Anything not listed cannot be written through `update`. */
const COLUMNS: Record<keyof ConversationPatch, { col: string; cast?: string; map?: (v: unknown) => unknown }> = {
  handoverState: { col: 'handover_state' },
  handoverReason: { col: 'handover_reason' },
  handoverAt: { col: 'handover_at', cast: 'timestamptz' },
  /* 'und' (BCP 47: undetermined) until the conversation's language is known; the
     column is NOT NULL with a 'de' default from the web chat, which would make
     every new WhatsApp conversation look German before anyone has written. */
  language: { col: 'locale', map: (v) => v ?? 'und' },
  identity: { col: 'identity' },
  leadId: { col: 'lead_id', cast: 'uuid' },
  clientId: { col: 'client_id', cast: 'uuid' },
  knownFirstName: { col: 'known_first_name' },
  facts: { col: 'facts', cast: 'jsonb', map: (v) => JSON.stringify(v ?? {}) },
  intent: { col: 'intent' },
  qualifiedAt: { col: 'qualified_at', cast: 'timestamptz' },
  disclosedAt: { col: 'disclosed_at', cast: 'timestamptz' },
  modelTurnsDay: { col: 'model_turns_day', cast: 'date' },
  modelTurns: { col: 'model_turns', cast: 'integer' },
}

export function createConversationStore(sql: Sql): ConversationStore {
  async function sessionFor(contact: ContactRef): Promise<string> {
    if (contact.userId) {
      const byUser = await sql`SELECT id FROM chat.sessions WHERE origin = ${ORIGIN} AND contact_user_id = ${contact.userId}` as Row[]
      if (byUser.length) {
        await sql`UPDATE chat.sessions SET last_seen_at = now(),
                    contact_phone = COALESCE(contact_phone, ${contact.phone ?? null}),
                    visitor_label = COALESCE(${contact.profileName ?? null}, visitor_label)
                  WHERE id = ${byUser[0].id as string}`
        return byUser[0].id as string
      }
    }
    const originId = contact.phone ?? `u:${contact.userId}`
    const rows = await sql`
      INSERT INTO chat.sessions (origin, origin_id, host, locale, contact_phone, contact_user_id, visitor_label)
      VALUES (${ORIGIN}, ${originId}, 'channel:whatsapp', 'und', ${contact.phone ?? null}, ${contact.userId ?? null}, ${contact.profileName ?? null})
      ON CONFLICT (origin, origin_id) DO UPDATE SET
        last_seen_at    = now(),
        contact_user_id = COALESCE(chat.sessions.contact_user_id, EXCLUDED.contact_user_id),
        visitor_label   = COALESCE(EXCLUDED.visitor_label, chat.sessions.visitor_label)
      RETURNING id` as Row[]
    return rows[0].id as string
  }

  return {
    async recordInbound(m, answerable) {
      const sessionId = await sessionFor(m.contact)
      const rows = await sql`
        INSERT INTO chat.messages (session_id, role, content, channel, external_id, kind, turn_state, sent_at)
        VALUES (${sessionId}, 'user', ${m.text}, ${CHANNEL}, ${m.externalId}, ${m.kind},
                ${answerable ? 'pending' : 'held'}, ${m.sentAt.toISOString()})
        ON CONFLICT (channel, external_id) WHERE external_id IS NOT NULL DO NOTHING
        RETURNING id` as Row[]
      if (!rows.length) return { conversationId: sessionId, duplicate: true }
      /* The window runs from the customer's newest message; an out-of-order
         older one must not move it backwards. */
      await sql`UPDATE chat.sessions SET last_inbound_at = GREATEST(COALESCE(last_inbound_at, '-infinity'::timestamptz), ${m.sentAt.toISOString()}::timestamptz)
                WHERE id = ${sessionId}`
      return { conversationId: sessionId, duplicate: false }
    },

    async recordEcho(e, isHuman) {
      const sessionId = await sessionFor(e.contact)
      const rows = await sql`
        INSERT INTO chat.messages (session_id, role, content, channel, external_id, kind, sent_at, metadata)
        VALUES (${sessionId}, ${isHuman ? 'human_agent' : 'system'}, ${e.text}, ${CHANNEL}, ${e.externalId}, ${e.kind},
                ${e.sentAt.toISOString()}, ${JSON.stringify({ source: isHuman ? 'business_app' : 'business_app_auto' })}::jsonb)
        ON CONFLICT (channel, external_id) WHERE external_id IS NOT NULL DO NOTHING
        RETURNING id` as Row[]
      if (!rows.length) return { conversationId: sessionId, duplicate: true }
      if (isHuman) {
        /* Marcel is in the chat. Max goes quiet until he has been silent for the idle period. */
        await sql`UPDATE chat.sessions SET
                    handover_state  = 'human',
                    handover_reason = COALESCE(handover_reason, 'marcel_replied'),
                    handover_at     = COALESCE(handover_at, now()),
                    human_last_at   = GREATEST(COALESCE(human_last_at, '-infinity'::timestamptz), ${e.sentAt.toISOString()}::timestamptz)
                  WHERE id = ${sessionId}`
      }
      return { conversationId: sessionId, duplicate: false }
    },

    async recordStatus(s) {
      /* Monotonic: a late "delivered" never overwrites "read". */
      const rows = await sql`
        UPDATE chat.messages SET delivery = ${s.state}, delivery_at = ${s.at.toISOString()},
               out_error = CASE WHEN ${s.state} = 'failed' THEN ${s.errorCode != null ? `delivery_failed ${s.errorCode}` : 'delivery_failed'} ELSE out_error END
        WHERE channel = ${CHANNEL} AND external_id = ${s.externalId}
          AND (delivery IS NULL OR ${s.state} = 'failed'
               OR (CASE ${s.state} WHEN 'sent' THEN 1 WHEN 'delivered' THEN 2 WHEN 'read' THEN 3 ELSE 0 END)
                > (CASE delivery WHEN 'sent' THEN 1 WHEN 'delivered' THEN 2 WHEN 'read' THEN 3 ELSE 0 END))
        RETURNING session_id` as Row[]
      if (rows.length && s.state === 'failed') {
        await sql`INSERT INTO chat.events (session_id, event_type, payload)
                  VALUES (${rows[0].session_id as string}, 'wa.send_failed', ${JSON.stringify({ kind: 'delivery', code: s.errorCode ?? null })}::jsonb)`
      }
      return rows.length > 0
    },

    async acquire(id, _now, ttlMs) {
      const rows = await sql`
        UPDATE chat.sessions SET lease_until = now() + make_interval(secs => ${Math.round(ttlMs / 1000)})
        WHERE id = ${id} AND (lease_until IS NULL OR lease_until < now())
        RETURNING id` as Row[]
      return rows.length > 0
    },

    async release(id) {
      await sql`UPDATE chat.sessions SET lease_until = NULL WHERE id = ${id}`
    },

    async load(id) {
      const rows = await sql`SELECT * FROM chat.sessions WHERE id = ${id}` as Row[]
      if (!rows.length) throw new Error('conversation not found')
      return mapConversation(rows[0])
    },

    async pending(id) {
      const rows = await sql`
        SELECT id, external_id, role, kind, content, COALESCE(sent_at, created_at) AS at FROM chat.messages
        WHERE session_id = ${id} AND turn_state = 'pending'
        ORDER BY COALESCE(sent_at, created_at), id LIMIT 20` as Row[]
      return rows.map(mapMessage)
    },

    async history(id, limit) {
      /* What the customer actually saw: failed, suppressed and in-flight replies are not part of it. */
      const rows = await sql`
        SELECT id, external_id, role, kind, content, COALESCE(sent_at, created_at) AS at FROM chat.messages
        WHERE session_id = ${id} AND NOT content_erased
          AND (out_status IS NULL OR out_status IN ('sent', 'draft', 'uncertain'))
        ORDER BY COALESCE(sent_at, created_at) DESC, id DESC LIMIT ${limit}` as Row[]
      return rows.map(mapMessage).reverse()
    },

    async update(id, patch) {
      const sets: string[] = []
      const params: unknown[] = []
      for (const [k, v] of Object.entries(patch)) {
        const c = COLUMNS[k as keyof ConversationPatch]
        if (!c) throw new Error(`unknown conversation field ${k}`)
        const value = c.map ? c.map(v) : v instanceof Date ? v.toISOString() : v ?? null
        params.push(value)
        sets.push(`${c.col} = $${params.length}${c.cast ? `::${c.cast}` : ''}`)
      }
      if (!sets.length) return
      params.push(id)
      await sql.query(`UPDATE chat.sessions SET ${sets.join(', ')} WHERE id = $${params.length}::uuid`, params)
    },

    async settle(ids, state, note) {
      if (!ids.length) return
      await sql`UPDATE chat.messages SET turn_state = ${state}, turn_note = ${note ?? null}
                WHERE id = ANY(${ids.map(Number)}::bigint[]) AND turn_state = 'pending'`
    },

    async claimOutbound(id, key, text) {
      const rows = await sql`
        INSERT INTO chat.messages (session_id, role, content, channel, out_key, out_status, kind)
        VALUES (${id}, 'assistant', ${text}, ${CHANNEL}, ${key}, 'sending', 'text')
        ON CONFLICT (session_id, out_key) WHERE out_key IS NOT NULL DO NOTHING
        RETURNING id` as Row[]
      if (rows.length) return { id: String(rows[0].id), existing: null }
      const prior = await sql`SELECT id, out_status FROM chat.messages WHERE session_id = ${id} AND out_key = ${key}` as Row[]
      return { id: String(prior[0]?.id ?? ''), existing: (prior[0]?.out_status as OutboundStatus) ?? 'sending' }
    },

    async finishOutbound(msgId, r) {
      await sql`UPDATE chat.messages SET out_status = ${r.status}, external_id = ${r.providerMessageId ?? null},
                  out_error = ${r.error?.slice(0, 300) ?? null}
                WHERE id = ${Number(msgId)} AND out_status = 'sending'`
      if (r.status === 'sent') {
        await sql`UPDATE chat.sessions SET last_outbound_at = now()
                  WHERE id = (SELECT session_id FROM chat.messages WHERE id = ${Number(msgId)})`
      }
    },

    async trail(id, kind: TrailKind, detail) {
      await sql`INSERT INTO chat.events (session_id, event_type, payload) VALUES (${id}, ${kind}, ${JSON.stringify(detail)}::jsonb)`
    },
  }
}

/* ── privacy operations ───────────────────────────────────────────────── */

/**
 * Retention: message text older than the configured days is erased in place;
 * the derived state (facts, links, takeover history) stays, because that is
 * what the business record is. Bounded per call.
 */
export async function eraseExpiredContent(sql: Sql, days: number): Promise<number> {
  const rows = await sql`
    UPDATE chat.messages SET content = '', content_erased = true
    WHERE id IN (SELECT id FROM chat.messages
                 WHERE channel = ${CHANNEL} AND NOT content_erased AND created_at < now() - make_interval(days => ${days})
                 LIMIT 500)
    RETURNING id` as Row[]
  return rows.length
}

/**
 * Erasure request for one contact: the conversation, its messages and its
 * trail are deleted. A lead or client record in the OS is a separate business
 * record and is handled through the OS — reported, not silently deleted.
 */
export async function eraseContact(sql: Sql, phoneDigits: string): Promise<{ conversations: number; linkedLeads: string[]; linkedClients: string[] }> {
  const rows = await sql`
    DELETE FROM chat.sessions WHERE origin = ${ORIGIN} AND (contact_phone = ${phoneDigits} OR origin_id = ${phoneDigits})
    RETURNING lead_id, client_id` as Row[]
  return {
    conversations: rows.length,
    linkedLeads: rows.map((r) => r.lead_id as string).filter(Boolean),
    linkedClients: rows.map((r) => r.client_id as string).filter(Boolean),
  }
}
