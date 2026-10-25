import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { OWNER_HEADERS, ownerReply, readOwnerJson } from '@/lib/owner-request'
import { act, MaxRefusal, proposalNow, type MaxAction } from '@/lib/max/max'

/**
 * POST /api/os/max/proposals — Marcel's decision on one Universal Max proposal (ADR-0029).
 *
 *   { action: 'edit',    proposal_id, edits: { field: value } }   re-grounds; runs nothing
 *   { action: 'choose',  proposal_id, choice }                    a server-offered candidate; runs nothing
 *   { action: 'reject',  proposal_id }
 *   { action: 'confirm', proposal_id, payload_hash }              runs the registered capability, once
 *   { action: 'approve', proposal_id, payload_hash }              an AMBER capability's own approval
 *   { action: 'follow',  proposal_id }                            a finished research's recommended draft, as a new card
 *
 * Owner session, same origin, JSON. The capability is never named by the request: it is the
 * proposal type's registered capability, for the payload whose hash the preview carried.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 90

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HASH = /^[0-9a-f]{64}$/

/**
 * GET /api/os/max/proposals?id=… — one proposal as it is now. A card with open delegated work polls
 * this; the OS asks the Bureau about the work (rate-limited per item) and answers with its state.
 */
export const GET = withAuth(async (request, { session }) => {
  const limited = enforceRateLimit(request, { scope: 'os-max-poll', limit: 600, windowMs: 10 * 60_000 })
  if (limited) return limited
  const url = new URL(request.url)
  const id = url.searchParams.get('id') ?? ''
  if (!UUID.test(id)) return ownerReply('Invalid proposal', 400)
  try {
    const proposal = await proposalNow(getDb(), `os:${session.sub}`, id, url.searchParams.get('locale') === 'en' ? 'en' : 'de')
    return NextResponse.json({ proposal }, { headers: OWNER_HEADERS })
  } catch (e) {
    if (e instanceof MaxRefusal) return NextResponse.json({ error: e.message, code: e.code }, { status: 404, headers: OWNER_HEADERS })
    console.error('[os/max/proposals GET]', e instanceof Error ? e.message : e)
    return ownerReply('Max is unavailable.', 503)
  }
})

export const POST = withAuth(async (request, { session }) => {
  const limited = enforceRateLimit(request, { scope: 'os-max-act', limit: 120, windowMs: 10 * 60_000 })
  if (limited) return limited
  const read = await readOwnerJson(request, session, 64 * 1024)
  if (!read.ok) return read.response
  const b = read.body
  if (typeof b.proposal_id !== 'string' || !UUID.test(b.proposal_id)) return ownerReply('Invalid proposal', 400)
  let a: MaxAction
  const keys = (allowed: string[]) => Object.keys(b).every(k => allowed.includes(k))
  switch (b.action) {
    case 'edit':
      if (!keys(['action', 'proposal_id', 'edits', 'locale']) || !b.edits || typeof b.edits !== 'object' || Array.isArray(b.edits) || Object.keys(b.edits).length > 20) return ownerReply('Invalid edits', 400)
      a = { action: 'edit', proposal_id: b.proposal_id, edits: b.edits as Record<string, unknown> }; break
    case 'choose':
      if (!keys(['action', 'proposal_id', 'choice', 'locale']) || typeof b.choice !== 'string' || b.choice.length > 80) return ownerReply('Invalid choice', 400)
      a = { action: 'choose', proposal_id: b.proposal_id, choice: b.choice }; break
    case 'reject':
      if (!keys(['action', 'proposal_id', 'locale'])) return ownerReply('Unexpected field', 400)
      a = { action: 'reject', proposal_id: b.proposal_id }; break
    case 'follow':
      if (!keys(['action', 'proposal_id', 'locale'])) return ownerReply('Unexpected field', 400)
      a = { action: 'follow', proposal_id: b.proposal_id }; break
    case 'confirm':
    case 'approve':
      if (!keys(['action', 'proposal_id', 'payload_hash', 'locale']) || typeof b.payload_hash !== 'string' || !HASH.test(b.payload_hash)) return ownerReply('Invalid confirmation', 400)
      a = { action: b.action, proposal_id: b.proposal_id, payload_hash: b.payload_hash }; break
    default:
      return ownerReply('Invalid action', 400)
  }
  try {
    const proposal = await act(getDb(), `os:${session.sub}`, a, b.locale === 'en' ? 'en' : 'de')
    return NextResponse.json({ proposal }, { headers: OWNER_HEADERS })
  } catch (e) {
    if (e instanceof MaxRefusal) return NextResponse.json({ error: e.message, code: e.code }, { status: e.code === 'not_found' ? 404 : 409, headers: OWNER_HEADERS })
    console.error('[os/max/proposals]', e instanceof Error ? e.message : e)
    return ownerReply('Max is unavailable. Nothing was changed.', 503)
  }
})
