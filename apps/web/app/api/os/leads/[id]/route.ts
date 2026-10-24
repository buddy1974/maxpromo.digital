import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { leadWorkspace } from '@/lib/leads/workspace'

/**
 * GET /api/os/leads/:id — the lead screen in one read (lib/leads/workspace.ts). Owner session,
 * never cached.
 */
export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const GET = withAuth<{ id: string }>(async (_request, { params }) => {
  const id = params.id
  if (!UUID.test(id)) return ownerReply('Invalid lead id', 400)
  try {
    const ws = await leadWorkspace(getDb(), id)
    if (!ws) return ownerReply('Lead not found', 404)
    return NextResponse.json(ws, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/leads/:id]', err instanceof Error ? err.message : err)
    return ownerReply('Lead unavailable', 503)
  }
})
