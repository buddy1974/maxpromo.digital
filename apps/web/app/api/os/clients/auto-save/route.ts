import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { withAuth } from '@/lib/auth'
import { runCapability } from '@/lib/commercial/engine'
import { findClientMatches } from '@/lib/clients/match'

/**
 * POST /api/os/clients/auto-save — after an invoice is saved for a customer typed by hand, add
 * that customer to the client list and link the invoice. Never guesses:
 *
 *   one EXACT existing client (same email, or same website and company) → link the invoice to it
 *   any other candidate (likely / possible)                            → change nothing; the
 *                                                                        invoice stays unlinked
 *   nobody matches                                                      → client.create (audited),
 *                                                                        then link
 *
 * The form writes the name as "Person — Company"; both halves are matched. Before 2026-10-25 this
 * route matched `name ILIKE` and created through raw SQL.
 */
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const POST = withAuth(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json() as { name?: string; email?: string; address?: string; city?: string; phone?: string; invoice_id?: string; angebot_id?: string }
    const full = body.name?.trim().slice(0, 300)
    if (!full) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const [person, company] = full.split(' — ').map(s => s.trim())
    const cityRaw = body.city?.trim() ?? ''
    const postcode = cityRaw.match(/^(\d{4,5})\s+/)?.[1]
    const city = postcode ? cityRaw.slice(postcode.length).trim() : cityRaw
    const email = body.email?.trim().toLowerCase() || undefined
    const sql = getDb()

    const matches = await findClientMatches(sql, { name: person, company: company || undefined, email, phone: body.phone, city, postcode })
    let clientId: string | null = null
    let created = false
    if (matches.candidates.length === 1 && matches.level === 'exact') {
      clientId = matches.candidates[0].id
    } else if (matches.candidates.length === 0) {
      const ref = body.invoice_id ?? body.angebot_id ?? crypto.randomUUID()
      const r = await runCapability(sql, {
        actor: `os:${session.sub}`, channel: 'os', requestId: `os:${session.sub}:auto-save:${ref}`, capability: 'client.create',
        input: { name: person, company: company || undefined, email, phone: body.phone || undefined, address: body.address || undefined, postcode, city: city || undefined, source: body.invoice_id ? 'invoice' : 'quote' },
      })
      const data = r.status === 'done' ? r.result.data as { created?: boolean; client?: { id: string } } : null
      if (data?.created && data.client) { clientId = data.client.id; created = true }
    } else {
      return NextResponse.json({ clientId: null, created: false, candidates: matches.candidates })
    }

    if (clientId && body.invoice_id && UUID.test(body.invoice_id)) {
      await sql`UPDATE os_invoices SET client_id = ${clientId} WHERE id = ${body.invoice_id} AND client_id IS NULL`
    }
    if (clientId && body.angebot_id && UUID.test(body.angebot_id)) {
      await sql`UPDATE os_angebote SET client_id = ${clientId} WHERE id = ${body.angebot_id} AND client_id IS NULL`
    }
    return NextResponse.json({ clientId, created })
  } catch (error) {
    console.error('[/api/os/clients/auto-save]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'auto-save failed' }, { status: 500 })
  }
})
