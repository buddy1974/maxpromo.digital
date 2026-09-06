import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession, loadRecentMessages } from '@/lib/chat/memory'

const COOKIE = 'mp_chat_sid'

/** Returns the current session + last 20 messages, or 204 when no cookie exists. */
export async function GET(req: NextRequest) {
  const sid = req.cookies.get(COOKIE)?.value
  if (!sid) return new NextResponse(null, { status: 204 })

  try {
    const session = await getOrCreateSession(sid, {
      host:        req.headers.get('x-mp-host') ?? req.headers.get('host') ?? 'unknown',
      productSlug: req.headers.get('x-mp-slug') || null,
      locale:      req.headers.get('x-mp-default-locale') ?? 'de',
    })
    const messages = await loadRecentMessages(session.id, 20)
    return NextResponse.json({ session, messages })
  } catch (err) {
    console.error('[chat/session GET]', err)
    // Fail open so the widget still renders — just without history
    return new NextResponse(null, { status: 204 })
  }
}
