import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * Atomic per-year invoice numbering. Uses the Postgres sequence created
 * in db/migrations/0001-document-numbering.sql — concurrent inserts can
 * no longer collide on the same number.
 *
 * Falls back to the legacy SELECT-MAX strategy if the function is missing
 * (e.g. running against a pre-migration database in dev).
 */
async function nextInvoiceNumber(): Promise<string> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT next_invoice_number() AS number` as { number: string }[]
    if (rows[0]?.number) return rows[0].number
  } catch (err) {
    console.warn('[invoices] next_invoice_number() missing — falling back to SELECT-MAX', err instanceof Error ? err.message : err)
  }
  const year = new Date().getFullYear()
  const prefix = `MP-${year}-`
  const rows = await sql`
    SELECT invoice_number FROM os_invoices
    WHERE invoice_number LIKE ${prefix + '%'}
    ORDER BY invoice_number DESC LIMIT 1`
  if (rows.length === 0) return `${prefix}001`
  const last = (rows[0] as { invoice_number: string }).invoice_number
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
      return NextResponse.json({ number: await nextInvoiceNumber() })
    }

    if (id) {
      const rows = await sql`
        SELECT * FROM os_invoices WHERE id = ${id}`
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(rows[0])
    }

    const rows = await sql`SELECT * FROM os_invoices ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[/api/os/invoices GET]', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      invoice_number?: string; client_id?: string; client_name: string
      client_email?: string; client_address?: string; line_items: unknown[]
      subtotal: number; total: number; status?: string; due_date?: string; notes?: string
      anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string; restbetrag?: number
    }

    const invoice_number = body.invoice_number || await nextInvoiceNumber()

    const rows = await sql`
      INSERT INTO os_invoices
        (invoice_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, due_date, notes,
         anzahlung, anzahlung_date, anzahlung_method, restbetrag)
      VALUES
        (${invoice_number}, ${body.client_id || null}, ${body.client_name},
         ${body.client_email || null}, ${body.client_address || null},
         ${JSON.stringify(body.line_items)}::jsonb, ${body.subtotal}, ${body.total},
         ${body.status || 'draft'}, ${body.due_date || null}, ${body.notes || null},
         ${body.anzahlung ?? 0}, ${body.anzahlung_date || null},
         ${body.anzahlung_method || null}, ${body.restbetrag ?? body.total})
      RETURNING *`

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/invoices POST]', msg)
    return NextResponse.json({ error: 'Failed to create invoice', detail: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await sql`DELETE FROM os_invoices WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/invoices DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      id: string; status?: string; paid_date?: string; sent_at?: string
      due_date?: string; notes?: string; line_items?: unknown[]; subtotal?: number; total?: number
    }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const rows = await sql`
      UPDATE os_invoices SET
        status     = COALESCE(${body.status as string | null}, status),
        paid_date  = COALESCE(${body.paid_date as string | null}, paid_date),
        sent_at    = COALESCE(${body.sent_at as string | null}, sent_at),
        due_date   = COALESCE(${body.due_date as string | null}, due_date),
        notes      = COALESCE(${body.notes as string | null}, notes),
        line_items = COALESCE(${body.line_items ? JSON.stringify(body.line_items) : null}::jsonb, line_items),
        subtotal   = COALESCE(${body.subtotal ?? null}, subtotal),
        total      = COALESCE(${body.total ?? null}, total)
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/invoices PATCH]', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
