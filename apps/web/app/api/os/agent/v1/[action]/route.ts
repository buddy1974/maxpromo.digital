import { NextRequest, NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { admitAgentRequest } from '@/lib/commercial/agent-gate'
import { executeApproval, rejectApproval, runCapability } from '@/lib/commercial/engine'
import { census } from '@/lib/commercial/registry'

/**
 * The commercial agent API (ADR-0018).
 *
 * One signed door for machine callers — OpenClaw Mission Control today. It is
 * not reachable with the OS session cookie and the session cookie is not
 * reachable with it: middleware lets `/api/os/agent/` through only to this
 * handler, and this handler admits nothing without a valid signature over the
 * exact body, a fresh nonce and an allowed actor (lib/commercial/agent-gate.ts).
 *
 *   POST /api/os/agent/v1/capabilities   the census
 *   POST /api/os/agent/v1/run            { requestId, actor, channel, capability, input }
 *   POST /api/os/agent/v1/execute        { approvalId, payloadHash, actor, channel }
 *   POST /api/os/agent/v1/reject         { approvalId, actor, channel }
 *
 * Every answer is JSON with a `status` the caller must read: done,
 * approval_required, refused or failed. A 200 is never a claim that something
 * consequential happened unless `status` is `done`.
 */

export const maxDuration = 60

const ACTIONS = new Set(['capabilities', 'run', 'execute', 'reject'])

export async function POST(request: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  if (!ACTIONS.has(action)) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const rawBody = await request.text()
  if (rawBody.length > 256 * 1024) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  const sql = isDatabaseConfigured() ? getDb() : null
  const gate = await admitAgentRequest({
    sql,
    secret: process.env.OS_AGENT_SECRET,
    allowList: process.env.OS_AGENT_ALLOWED_ACTORS,
    headers: request.headers,
    method: 'POST',
    path: new URL(request.url).pathname,
    rawBody,
  })
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const db = sql!
  const { actor, channel, body } = gate

  try {
    if (action === 'capabilities') {
      return NextResponse.json({ status: 'done', capabilities: census() })
    }
    if (action === 'run') {
      const requestId = typeof body.requestId === 'string' && /^[A-Za-z0-9:_.-]{8,120}$/.test(body.requestId) ? body.requestId : null
      const capability = typeof body.capability === 'string' ? body.capability : null
      if (!requestId || !capability) return NextResponse.json({ error: 'requestId and capability are required' }, { status: 400 })
      return NextResponse.json(await runCapability(db, { requestId, actor, channel, capability, input: body.input ?? {} }))
    }
    const approvalId = typeof body.approvalId === 'string' && /^[0-9a-f-]{36}$/i.test(body.approvalId) ? body.approvalId : null
    if (!approvalId) return NextResponse.json({ error: 'approvalId is required' }, { status: 400 })
    if (action === 'execute') {
      const payloadHash = typeof body.payloadHash === 'string' && /^[0-9a-f]{64}$/.test(body.payloadHash) ? body.payloadHash : null
      if (!payloadHash) return NextResponse.json({ error: 'payloadHash is required' }, { status: 400 })
      return NextResponse.json(await executeApproval(db, { approvalId, payloadHash, actor, channel }))
    }
    return NextResponse.json(await rejectApproval(db, { approvalId, actor, channel }))
  } catch (err) {
    console.error('[agent-api]', action, err instanceof Error ? err.message : err)
    return NextResponse.json({ status: 'failed', message: 'The OS could not complete this request.', retrySafe: action === 'capabilities' }, { status: 500 })
  }
}
