import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * Atomic per-year angebot numbering — uses the Postgres sequence from
 * db/migrations/0001-document-numbering.sql. Falls back to SELECT-MAX
 * if the migration hasn't run yet.
 */
async function nextAngebotNumber(): Promise<string> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT next_angebot_number() AS number` as { number: string }[]
    if (rows[0]?.number) return rows[0].number
  } catch (err) {
    console.warn('[angebote] next_angebot_number() missing — falling back to SELECT-MAX', err instanceof Error ? err.message : err)
  }
  const year = new Date().getFullYear()
  const prefix = `ANG-${year}-`
  const rows = await sql`
    SELECT angebot_number FROM os_angebote
    WHERE angebot_number LIKE ${prefix + '%'}
    ORDER BY angebot_number DESC LIMIT 1`
  if (rows.length === 0) return `${prefix}001`
  const last = (rows[0] as { angebot_number: string }).angebot_number
  const num  = parseInt(last.replace(prefix, ''), 10)
  return `${prefix}${String(num + 1).padStart(3, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const sql  = getDb()
    const { searchParams } = new URL(request.url)
    const id   = searchParams.get('id')
    const next = searchParams.get('next')

    if (next === 'true') {
      return NextResponse.json({ number: await nextAngebotNumber() })
    }
    if (id) {
      const rows = await sql`SELECT * FROM os_angebote WHERE id = ${id}`
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(rows[0])
    }

    const rows = await sql`SELECT * FROM os_angebote ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[/api/os/angebote GET]', error)
    return NextResponse.json({ error: 'Failed to fetch angebote' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      angebot_number?: string; client_id?: string; client_name: string
      client_email?: string; client_address?: string; line_items: unknown[]
      subtotal: number; total: number; status?: string; valid_until?: string; notes?: string
      anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string
    }

    const angebot_number = body.angebot_number || await nextAngebotNumber()
    const rows = await sql`
      INSERT INTO os_angebote
        (angebot_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, valid_until, notes,
         anzahlung, anzahlung_date, anzahlung_method)
      VALUES
        (${angebot_number}, ${body.client_id || null}, ${body.client_name},
         ${body.client_email || null}, ${body.client_address || null},
         ${JSON.stringify(body.line_items)}::jsonb, ${body.subtotal}, ${body.total},
         ${body.status || 'draft'}, ${body.valid_until || null}, ${body.notes || null},
         ${body.anzahlung ?? 0}, ${body.anzahlung_date || null}, ${body.anzahlung_method || null})
      RETURNING *`

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/angebote POST]', msg)
    return NextResponse.json({ error: 'Failed to create angebot', detail: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await sql`DELETE FROM os_angebote WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/angebote DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete angebot' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      id: string; status?: string; sent_at?: string; valid_until?: string
      notes?: string; converted_to_invoice?: boolean
    }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const rows = await sql`
      UPDATE os_angebote SET
        status               = COALESCE(${body.status as string | null}, status),
        sent_at              = COALESCE(${body.sent_at as string | null}, sent_at),
        valid_until          = COALESCE(${body.valid_until as string | null}, valid_until),
        notes                = COALESCE(${body.notes as string | null}, notes),
        converted_to_invoice = COALESCE(${body.converted_to_invoice ?? null}, converted_to_invoice)
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/angebote PATCH]', error)
    return NextResponse.json({ error: 'Failed to update angebot' }, { status: 500 })
  }
}
