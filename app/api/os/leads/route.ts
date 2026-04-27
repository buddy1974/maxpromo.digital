import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const sql  = getDb()
    const rows = await sql`SELECT * FROM os_leads ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[/api/os/leads GET]', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      name?: string; email?: string; phone?: string; company?: string
      source?: string; category?: string; summary?: string; status?: string; notes?: string
    }

    const rows = await sql`
      INSERT INTO os_leads (name, email, phone, company, source, category, summary, status, notes)
      VALUES (${body.name || null}, ${body.email || null}, ${body.phone || null},
              ${body.company || null}, ${body.source || 'manual'}, ${body.category || null},
              ${body.summary || null}, ${body.status || 'new'}, ${body.notes || null})
      RETURNING *`

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/leads POST]', msg)
    return NextResponse.json({ error: 'Failed to create lead', detail: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await sql`DELETE FROM os_leads WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/leads DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      id: string; status?: string; notes?: string; converted?: boolean
    }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const rows = await sql`
      UPDATE os_leads SET
        status    = COALESCE(${body.status as string | null}, status),
        notes     = COALESCE(${body.notes as string | null}, notes),
        converted = COALESCE(${body.converted ?? null}, converted)
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/leads PATCH]', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
