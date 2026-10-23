import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { executeApproval, rejectApproval, runCapability } from '@/lib/commercial/engine'

export const dynamic = 'force-dynamic'
const MAX_BYTES = 16 * 1024
const MAIL = new Set(['email.search','email.read','email.attachments','email.draft','email.send','email.state','email.trash','email.link','email.save_lead','email.summary','email.triage','email.spam'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const headers = { 'Cache-Control': 'private, no-store' }
const reply = (error: string, status: number) => NextResponse.json({ error }, { status, headers })

export const POST = withAuth(async (request, { session }) => {
  // The current OS has one owner. Future staff sessions must not inherit mailbox authority.
  if (session.sub !== 'marcel') return reply('Owner access required', 403)
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply('Invalid origin', 403)
  if (request.headers.get('sec-fetch-site') === 'cross-site') return reply('Invalid origin', 403)
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply('JSON required', 415)
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return reply('Payload too large', 413)
  try {
    const reader = request.body?.getReader()
    if (!reader) return reply('Missing body', 400)
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) { await reader.cancel(); return reply('Payload too large', 413) }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    let body: Record<string, unknown>
    try {
      const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reply('Invalid body', 400)
      body = parsed as Record<string, unknown>
    } catch { return reply('Invalid JSON', 400) }
    const actor = `os:${session.sub}`
    const channel = 'os'
    const sql = getDb()
    if (body.action === 'run') {
      if (Object.keys(body).some(k => !['action','requestId','capability','input'].includes(k))) return reply('Unexpected field', 400)
      if (typeof body.capability !== 'string' || !MAIL.has(body.capability)) return reply('Email capability required', 400)
      if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9:_.-]{8,120}$/.test(body.requestId)) return reply('Invalid request ID', 400)
      return NextResponse.json(await runCapability(sql, { actor, channel, requestId: `${actor}:${body.requestId}`, capability: body.capability, input: body.input ?? {} }), { headers })
    }
    if (body.action !== 'execute' && body.action !== 'reject') return reply('Invalid action', 400)
    if (Object.keys(body).some(k => !['action','approvalId','payloadHash'].includes(k))) return reply('Unexpected field', 400)
    if (typeof body.approvalId !== 'string' || !UUID.test(body.approvalId)) return reply('Invalid approval ID', 400)
    // This cookie route cannot execute another channel's approval or a non-mail capability.
    const rows = await sql`SELECT capability FROM os_approvals WHERE id=${body.approvalId}::uuid AND requested_by=${actor}` as { capability: string }[]
    if (!rows[0] || !MAIL.has(rows[0].capability)) return reply('Email approval not found', 404)
    if (body.action === 'reject') return NextResponse.json(await rejectApproval(sql, { actor, channel, approvalId: body.approvalId }), { headers })
    if (typeof body.payloadHash !== 'string' || !/^[0-9a-f]{64}$/.test(body.payloadHash)) return reply('Invalid payload hash', 400)
    return NextResponse.json(await executeApproval(sql, { actor, channel, approvalId: body.approvalId, payloadHash: body.payloadHash }), { headers })
  } catch {
    return reply('Email action unavailable', 503)
  }
})
