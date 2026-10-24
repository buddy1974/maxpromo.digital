import { NextRequest, NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { admitAgentRequest, clientMayUse, type AgentAction } from '@/lib/commercial/agent-gate'
import { executeApproval, rejectApproval, runCapability } from '@/lib/commercial/engine'
import { census } from '@/lib/commercial/registry'
import { recordAgentEvents } from '@/lib/commercial/agent-events'
import { scheduleOwnerNotices } from '@/lib/owner/schedule'

/**
 * The cross-plane door into the Business Control Plane (ADR-0018, ADR-0021).
 *
 * One signed door for machine clients — the Agent Bureau, and later a
 * Telegram owner client. It is not reachable with the OS session cookie and
 * the session cookie is not reachable with it: middleware lets
 * `/api/os/agent/` through only to this handler, and this handler admits
 * nothing without a valid signature over the exact body, a fresh nonce, an
 * allowed actor and a client allowed to take this action
 * (lib/commercial/agent-gate.ts).
 *
 *   POST /api/os/agent/v1/capabilities   the census this client may use
 *   POST /api/os/agent/v1/run            { requestId, actor, channel, capability, input }
 *   POST /api/os/agent/v1/execute        { approvalId, payloadHash, actor, channel }   (not the Bureau)
 *   POST /api/os/agent/v1/reject         { approvalId, actor, channel }                (not the Bureau)
 *   POST /api/os/agent/v1/events         { actor, channel, events: AgentEvent[] }      (Bureau only)
 *
 * Every answer is JSON with a `status` the caller must read: done,
 * approval_required, refused or failed. A 200 is never a claim that something
 * consequential happened unless `status` is `done`.
 */

export const maxDuration = 60

const ACTIONS = new Set<AgentAction>(['capabilities', 'run', 'execute', 'reject', 'events'])

export async function POST(request: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  if (!ACTIONS.has(action as AgentAction)) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const rawBody = await request.text()
  if (rawBody.length > 256 * 1024) return NextResponse.json({ error: 'too_large' }, { status: 413 })

  const sql = isDatabaseConfigured() ? getDb() : null
  const gate = await admitAgentRequest({
    sql,
    env: process.env,
    action: action as AgentAction,
    headers: request.headers,
    method: 'POST',
    path: new URL(request.url).pathname,
    rawBody,
  })
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const db = sql!
  const { client, actor, channel, body } = gate

  try {
    if (action === 'capabilities') {
      return NextResponse.json({ status: 'done', capabilities: census().filter((c) => clientMayUse(client, c.id)) })
    }
    if (action === 'events') {
      const recorded = await recordAgentEvents(db, { client: client.id, actor, events: body.events })
      // A failure, block or exception reaches Marcel's phone once (ADR-0024); completions do not.
      scheduleOwnerNotices('agent')
      return NextResponse.json(recorded)
    }
    if (action === 'run') {
      const requestId = typeof body.requestId === 'string' && /^[A-Za-z0-9:_.-]{8,120}$/.test(body.requestId) ? body.requestId : null
      const capability = typeof body.capability === 'string' ? body.capability : null
      if (!requestId || !capability) return NextResponse.json({ error: 'requestId and capability are required' }, { status: 400 })
      if (!clientMayUse(client, capability)) {
        return NextResponse.json({ status: 'refused', capability, code: 'not_permitted', message: 'This client may not use that capability.' })
      }
      const response = await runCapability(db, { requestId, actor, channel, capability, input: body.input ?? {} })
      // An agent asked for something only Marcel can approve: tell him once.
      if (response.status === 'approval_required') scheduleOwnerNotices('agent')
      return NextResponse.json(response)
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
