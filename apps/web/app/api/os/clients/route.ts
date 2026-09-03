import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async () => {
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM os_clients ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[/api/os/clients GET]', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
})

async function postHandler(request: NextRequest) {
  if (!(process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL)) {
    console.error('[/api/os/clients POST] DATABASE_URL is not set')
    return NextResponse.json(
      { error: 'Database not configured', detail: 'DATABASE_URL environment variable is missing. Add it to .env.local (dev) and Vercel environment variables (production).' },
      { status: 503 }
    )
  }
  try {
    console.log('[/api/os/clients POST] called')
    const sql = getDb()
    const body = await request.json() as {
      name: string; company?: string; email?: string; phone?: string
      address?: string; city?: string; country?: string; notes?: string; status?: string
    }
    console.log('[/api/os/clients POST] body:', { name: body.name, email: body.email })

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Single-tenant: Marcel is the only owner (0003-multi-tenancy.sql).
    const OWNER_ID = '00000000-0000-0000-0000-000000000001'

    const rows = await sql`
      INSERT INTO os_clients (owner_id, name, company, email, phone, address, city, country, notes, status)
      VALUES (${OWNER_ID}, ${body.name.trim()}, ${body.company || null}, ${body.email || null},
              ${body.phone || null}, ${body.address || null}, ${body.city || null},
              ${body.country || 'Deutschland'}, ${body.notes || null}, ${body.status || 'active'})
      RETURNING *`

    console.log('[/api/os/clients POST] inserted id:', rows[0]?.id)
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/clients POST] ERROR:', msg)
    return NextResponse.json({ error: 'Failed to create client', detail: msg }, { status: 500 })
  }
}
export const POST = withAuth(postHandler)

export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await sql`DELETE FROM os_clients WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/clients DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
})

export const PATCH = withAuth(async (request: NextRequest) => {
  try {
    const sql = getDb()
    const body = await request.json() as { id: string; [key: string]: unknown }
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const rows = await sql`
      UPDATE os_clients SET
        name    = COALESCE(${fields.name as string | null}, name),
        company = COALESCE(${fields.company as string | null}, company),
        email   = COALESCE(${fields.email as string | null}, email),
        phone   = COALESCE(${fields.phone as string | null}, phone),
        address = COALESCE(${fields.address as string | null}, address),
        city    = COALESCE(${fields.city as string | null}, city),
        notes   = COALESCE(${fields.notes as string | null}, notes),
        status  = COALESCE(${fields.status as string | null}, status)
      WHERE id = ${id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/clients PATCH]', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
})
