import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { ask } from '@/lib/commercial/ask'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { OWNER_HEADERS, ownerReply, readOwnerJson } from '@/lib/owner-request'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/os/ask  { question, locale } — Ask Max: a question about the business, answered from
 * the OS records with links to them (lib/commercial/ask.ts). Owner session, same origin.
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request, { session }) => {
  const blocked = enforceRateLimit(request, { scope: 'os-ask', limit: 40, windowMs: 10 * 60_000 })
  if (blocked) return blocked
  const read = await readOwnerJson(request, session, 4 * 1024)
  if (!read.ok) return read.response
  const { body } = read
  if (Object.keys(body).some(k => !['question', 'locale'].includes(k))) return ownerReply('Unexpected field', 400)
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  if (!question || question.length > 500) return ownerReply('Question required (at most 500 characters)', 400)
  const locale = body.locale === 'en' ? 'en' : 'de'
  try {
    const now = new Date()
    const answer = await ask({ sql: getDb(), actor: OWNER_ACTOR, channel: 'os-ask', now, today: berlinDate(now), committed: () => {} }, question, locale)
    return NextResponse.json(answer, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/ask]', err instanceof Error ? err.message : err)
    return ownerReply('Ask Max is unavailable', 503)
  }
})
