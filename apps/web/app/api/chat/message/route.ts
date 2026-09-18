import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession, appendMessage, loadRecentMessages } from '@/lib/chat/memory'
import { runMaxTurn } from '@/lib/chat/claude'
import { enforceRateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const COOKIE        = 'mp_chat_sid'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30  // 30 days

function generateSessionId(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  // Rate limit: 30 messages/min per IP (approximate — see lib/rate-limit.ts)
  const blocked = enforceRateLimit(req, { scope: 'chat-message', limit: 30, windowMs: 60_000 })
  if (blocked) return blocked

  let body: { content?: string }
  try {
    body = await req.json() as { content?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const content = body.content?.trim()
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: 'content_too_long' }, { status: 400 })
  }

  const isNewSession = !req.cookies.get(COOKIE)?.value
  const sid          = req.cookies.get(COOKIE)?.value ?? generateSessionId()

  const host   = req.headers.get('x-mp-host') ?? req.headers.get('host') ?? 'unknown'
  const slug   = req.headers.get('x-mp-slug') || null
  const locale = req.headers.get('x-mp-default-locale') ?? 'de'

  let stage: 'session' | 'persist_user' | 'provider' | 'persist_reply' = 'session'

  try {
    const session        = await getOrCreateSession(sid, { host, productSlug: slug, locale })
    stage = 'persist_user'
    await appendMessage(session.id, 'user', content)

    stage = 'provider'
    const recentMessages = await loadRecentMessages(session.id, 20)
    const reply          = await runMaxTurn({ session, recentMessages })
    stage = 'persist_reply'
    await appendMessage(session.id, 'assistant', reply)

    // TODO(phase3b): if reply contains qualification trigger → handover to Telegram

    const res = NextResponse.json({ sessionId: session.id, reply })

    if (isNewSession) {
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
      res.headers.set(
        'Set-Cookie',
        `${COOKIE}=${sid}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`,
      )
    }

    return res
  } catch (err) {
    /**
     * The response stays `503 chat_unavailable` — a visitor learns nothing
     * useful from a provider's billing state, and the composer already says
     * the truthful thing in their own language.
     *
     * What changed is the log. This branch recorded `{ status, type: err.name }`
     * and nothing else, and `err.name` on an SDK error is the string "Error",
     * so every provider failure logged identically:
     *
     *     [chat/message POST] provider failure { status: 400, type: 'Error' }
     *
     * A 400 that says "your credit balance is too low" and a 400 that says
     * "messages: at least one message is required" are the same line. One is
     * an account problem and one is a code bug, and telling them apart took a
     * second endpoint with better logging and a production log dive. The
     * provider's own message and `request_id` are the two things that identify
     * the fault; they are not secrets, and the API key is never part of an
     * error body.
     */
    if (err instanceof Anthropic.APIError) {
      console.error('[chat/message POST] provider failure', {
        stage,
        status:    err.status,
        type:      err.constructor?.name ?? 'APIError',
        message:   err.message?.slice(0, 300),
        requestId: err.requestID ?? null,
      })
      return NextResponse.json({ error: 'chat_unavailable' }, { status: 503 })
    }
    const reason = err instanceof Error && err.message.includes('is not set')
      ? 'configuration'
      : 'internal'
    console.error('[chat/message POST] failed', {
      reason,
      stage,
      message: err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300),
    })
    return NextResponse.json({ error: 'chat_unavailable' }, { status: 503 })
  }
}
