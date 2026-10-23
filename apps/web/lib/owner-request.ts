/**
 * lib/owner-request.ts — SERVER ONLY.
 *
 * The guard for an owner decision made in /os itself (approve, reject,
 * acknowledge): Marcel's session, same origin, JSON, bounded. The same rules
 * the Inbox actions route applies, for the routes that decide business
 * actions on the owner's behalf.
 */

import { NextResponse, type NextRequest } from 'next/server'
import type { Session } from '@/lib/auth'

export const OWNER_HEADERS = { 'Cache-Control': 'private, no-store' }

export const ownerReply = (error: string, status: number) => NextResponse.json({ error }, { status, headers: OWNER_HEADERS })

export type OwnerBody = { ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }

export async function readOwnerJson(request: NextRequest, session: Session, maxBytes = 16 * 1024): Promise<OwnerBody> {
  const fail = (error: string, status: number): OwnerBody => ({ ok: false, response: ownerReply(error, status) })
  // One owner today. A future staff session must not inherit decision authority.
  if (session.sub !== 'marcel') return fail('Owner access required', 403)
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail('Invalid origin', 403)
  if (request.headers.get('sec-fetch-site') === 'cross-site') return fail('Invalid origin', 403)
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return fail('JSON required', 415)
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return fail('Payload too large', 413)
  const reader = request.body?.getReader()
  if (!reader) return fail('Missing body', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) { await reader.cancel(); return fail('Payload too large', 413) }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fail('Invalid body', 400)
    return { ok: true, body: parsed as Record<string, unknown> }
  } catch {
    return fail('Invalid JSON', 400)
  }
}
