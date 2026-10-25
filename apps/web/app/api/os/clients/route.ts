import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { withAuth } from '@/lib/auth'

/**
 * GET /api/os/clients — the client list for screens and pickers. Read-only: every change to a
 * client goes through /api/os/clients/actions (client.create / update / archive / restore /
 * delete), so it is validated, duplicate-checked and on the client's timeline.
 *   ?archived=1  archived clients only · ?all=1  both · default: active clients
 */
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const sql = getDb()
    const p = new URL(request.url).searchParams
    const scope = p.get('all') === '1' ? 'all' : p.get('archived') === '1' ? 'archived' : 'active'
    const rows = await sql`
      SELECT c.*,
        (SELECT count(*)::int FROM os_invoices i WHERE i.client_id = c.id AND i.status NOT IN ('draft', 'cancelled', 'paid')) AS open_invoices,
        (SELECT count(*)::int FROM os_angebote a WHERE a.client_id = c.id AND a.status = 'sent') AS open_quotes
      FROM os_clients c
      WHERE ${scope} = 'all' OR (${scope} = 'archived') = (c.archived_at IS NOT NULL)
      ORDER BY c.created_at DESC`
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[/api/os/clients GET]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
})
