/**
 * lib/commercial/ownerActions.ts — SERVER ONLY.
 *
 * Marcel driving capabilities from an /os screen: run, then execute or reject the approval it
 * prepared. One implementation for every screen that does this (Inbox, Money); each screen names
 * the capabilities it may touch, and a screen can never execute another channel's approval or a
 * capability outside its set.
 */
import { NextResponse, type NextRequest } from 'next/server'
import type { Session } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { readOwnerJson, ownerReply, OWNER_HEADERS } from '@/lib/owner-request'
import { executeApproval, rejectApproval, runCapability } from './engine'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface OwnerActionScope {
  capabilities: ReadonlySet<string>
  maxBytes: number
  messages: { required: string; notFound: string; unavailable: string }
}

export async function ownerCapabilityAction(request: NextRequest, session: Session, scope: OwnerActionScope): Promise<NextResponse> {
  const read = await readOwnerJson(request, session, scope.maxBytes)
  if (!read.ok) return read.response
  const body = read.body
  try {
    const actor = `os:${session.sub}`
    const channel = 'os'
    const sql = getDb()
    if (body.action === 'run') {
      if (Object.keys(body).some(k => !['action', 'requestId', 'capability', 'input', 'language'].includes(k))) return ownerReply('Unexpected field', 400)
      if (typeof body.capability !== 'string' || !scope.capabilities.has(body.capability)) return ownerReply(scope.messages.required, 400)
      if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9:_.-]{8,120}$/.test(body.requestId)) return ownerReply('Invalid request ID', 400)
      const language = body.language === 'de' || body.language === 'en' ? body.language : undefined
      return NextResponse.json(await runCapability(sql, { actor, channel, requestId: `${actor}:${body.requestId}`, capability: body.capability, input: body.input ?? {}, language }), { headers: OWNER_HEADERS })
    }
    if (body.action !== 'execute' && body.action !== 'reject') return ownerReply('Invalid action', 400)
    if (Object.keys(body).some(k => !['action', 'approvalId', 'payloadHash'].includes(k))) return ownerReply('Unexpected field', 400)
    if (typeof body.approvalId !== 'string' || !UUID.test(body.approvalId)) return ownerReply('Invalid approval ID', 400)
    const rows = await sql`SELECT capability FROM os_approvals WHERE id=${body.approvalId}::uuid AND requested_by=${actor}` as { capability: string }[]
    if (!rows[0] || !scope.capabilities.has(rows[0].capability)) return ownerReply(scope.messages.notFound, 404)
    if (body.action === 'reject') return NextResponse.json(await rejectApproval(sql, { actor, channel, approvalId: body.approvalId }), { headers: OWNER_HEADERS })
    if (typeof body.payloadHash !== 'string' || !/^[0-9a-f]{64}$/.test(body.payloadHash)) return ownerReply('Invalid payload hash', 400)
    return NextResponse.json(await executeApproval(sql, { actor, channel, approvalId: body.approvalId, payloadHash: body.payloadHash }), { headers: OWNER_HEADERS })
  } catch {
    return ownerReply(scope.messages.unavailable, 503)
  }
}
