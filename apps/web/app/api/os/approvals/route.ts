import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { executeApproval, rejectApproval, OWNER_ACTOR } from '@/lib/commercial/engine'
import { OWNER_HEADERS, ownerReply, readOwnerJson } from '@/lib/owner-request'

/**
 * The owner deciding a prepared business action in /os (ADR-0021).
 *
 * GET  /api/os/approvals   pending approvals and the last 30 decided, with who asked
 * POST /api/os/approvals   { action: 'execute', approvalId, payloadHash } | { action: 'reject', approvalId }
 *
 * An agent prepares; Maxpromo OS holds the approval and executes it once, by
 * the exact payload hash, in the same engine the agent door uses. Decisions
 * here are recorded as os:marcel.
 */

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const GET = withAuth(async (_request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  try {
    const sql = getDb()
    await sql`UPDATE os_approvals SET status = 'expired' WHERE status = 'pending' AND expires_at <= now()`
    const rows = await sql`
      SELECT id, capability, risk, summary, preview, payload_hash, status, requested_by, decided_by, created_at, expires_at, decided_at
      FROM os_approvals
      WHERE status = 'pending' OR created_at > now() - interval '30 days'
      ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 60` as Record<string, unknown>[]
    return NextResponse.json({ approvals: rows }, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/approvals]', err instanceof Error ? err.message : err)
    return ownerReply('Approvals unavailable', 503)
  }
})

export const POST = withAuth(async (request, { session }) => {
  const read = await readOwnerJson(request, session, 2048)
  if (!read.ok) return read.response
  const { body } = read
  if (body.action !== 'execute' && body.action !== 'reject') return ownerReply('Invalid action', 400)
  if (Object.keys(body).some((k) => !['action', 'approvalId', 'payloadHash'].includes(k))) return ownerReply('Unexpected field', 400)
  if (typeof body.approvalId !== 'string' || !UUID.test(body.approvalId)) return ownerReply('Invalid approval ID', 400)
  try {
    const sql = getDb()
    if (body.action === 'reject') {
      return NextResponse.json(await rejectApproval(sql, { actor: OWNER_ACTOR, channel: 'os', approvalId: body.approvalId }), { headers: OWNER_HEADERS })
    }
    if (typeof body.payloadHash !== 'string' || !/^[0-9a-f]{64}$/.test(body.payloadHash)) return ownerReply('Invalid payload hash', 400)
    return NextResponse.json(await executeApproval(sql, { actor: OWNER_ACTOR, channel: 'os', approvalId: body.approvalId, payloadHash: body.payloadHash }), { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/approvals] decide', err instanceof Error ? err.message : err)
    return ownerReply('Approval unavailable', 503)
  }
})
