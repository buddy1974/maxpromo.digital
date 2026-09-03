/**
 * lib/chat/memory.ts
 *
 * Neon-backed conversation memory for Max.
 * All writes go to the `chat` schema created in migration 0006.
 *
 * Caller is responsible for ensuring the session ID (originId) is a
 * stable per-visitor identifier — the cookie value from mp_chat_sid.
 */

import { getDb } from '@/lib/db'
import type { ChatSession, ChatMessage, ChatRole, ChatChannel, HandoverState } from './types'

// ── Row mappers ────────────────────────────────────────────────────────────────

function mapSession(row: Record<string, unknown>): ChatSession {
  return {
    id:             row.id             as string,
    origin:         row.origin         as string,
    originId:       row.origin_id      as string,
    host:           row.host           as string,
    productSlug:   (row.product_slug   as string | null) ?? null,
    locale:         row.locale         as string,
    handoverState: (row.handover_state as HandoverState) ?? 'bot',
    firstSeenAt:    new Date(row.first_seen_at as string),
    lastSeenAt:     new Date(row.last_seen_at  as string),
    visitorLabel:  (row.visitor_label  as string | null) ?? null,
    emotionalState:(row.emotional_state as string | null) ?? null,
    metadata:      (row.metadata        as Record<string, unknown>) ?? {},
  }
}

function mapMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id:        row.id         as number,
    sessionId: row.session_id as string,
    role:      row.role       as ChatRole,
    content:   row.content    as string,
    channel:   row.channel    as ChatChannel,
    createdAt: new Date(row.created_at as string),
    metadata: (row.metadata   as Record<string, unknown>) ?? {},
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Upserts a web session row. Updates last_seen_at and host on returning visits.
 * Returns the session — always from the DB, never a local object.
 */
export async function getOrCreateSession(
  originId: string,
  ctx: { host: string; productSlug: string | null; locale: string },
): Promise<ChatSession> {
  const sql = getDb()

  await sql`
    INSERT INTO chat.sessions (origin, origin_id, host, product_slug, locale)
    VALUES ('web', ${originId}, ${ctx.host}, ${ctx.productSlug}, ${ctx.locale})
    ON CONFLICT (origin, origin_id) DO UPDATE
      SET last_seen_at = now(),
          host         = EXCLUDED.host
  `

  const rows = await sql`
    SELECT * FROM chat.sessions
    WHERE  origin = 'web' AND origin_id = ${originId}
  `

  return mapSession(rows[0] as Record<string, unknown>)
}

/** Appends a message and returns the persisted row. */
export async function appendMessage(
  sessionId: string,
  role:      ChatRole,
  content:   string,
  channel:   ChatChannel = 'web',
): Promise<ChatMessage> {
  const sql = getDb()

  const rows = await sql`
    INSERT INTO chat.messages (session_id, role, content, channel)
    VALUES (${sessionId}, ${role}, ${content}, ${channel})
    RETURNING *
  `

  return mapMessage(rows[0] as Record<string, unknown>)
}

/**
 * Returns the last `limit` messages for a session, oldest first.
 * (DESC in SQL so we respect LIMIT, then reversed for chronological order.)
 */
export async function loadRecentMessages(
  sessionId: string,
  limit = 20,
): Promise<ChatMessage[]> {
  const sql = getDb()

  const rows = await sql`
    SELECT * FROM chat.messages
    WHERE  session_id = ${sessionId}
    ORDER  BY created_at DESC
    LIMIT  ${limit}
  `

  return (rows as Record<string, unknown>[]).map(mapMessage).reverse()
}
