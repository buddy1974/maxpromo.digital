import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

async function nextInvoiceNumber(): Promise<string> {
  const sql = getDb()
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
    }

    const invoice_number = body.invoice_number || await nextInvoiceNumber()

    const rows = await sql`
      INSERT INTO os_invoices
        (invoice_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, due_date, notes)
      VALUES
        (${invoice_number}, ${body.client_id || null}, ${body.client_name},
         ${body.client_email || null}, ${body.client_address || null},
         ${JSON.stringify(body.line_items)}::jsonb, ${body.subtotal}, ${body.total},
         ${body.status || 'draft'}, ${body.due_date || null}, ${body.notes || null})
      RETURNING *`

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error('[/api/os/invoices POST]', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
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
        line_items = COALESCE(${body.line_items ? JSON.stringify(body.line_items) + '::jsonb' : null}, line_items),
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
