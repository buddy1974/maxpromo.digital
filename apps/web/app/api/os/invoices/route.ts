import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { admitLineItems } from '@/lib/documents/extraction-guard'
import { predictNextInvoiceNumber } from '@/lib/documents/numbering'

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

/**
 * What the next saved invoice will be numbered, WITHOUT consuming a number.
 *
 * Risk 63. The blank invoice form asked `?next=true` on mount and this route
 * answered by calling `nextInvoiceNumber()` — `nextval()` — so opening a form
 * burned an invoice number, twice under StrictMode, exactly the defect fixed
 * for quotations on 26 September (risk 57). The form then sent that number
 * back and POST stored it, so the browser chose the persisted number.
 *
 * Now as for quotations: the preview reads the sequence the allocator
 * advances, without advancing it, and predicts through
 * lib/documents/numbering.ts what `next_invoice_number()` will issue. POST
 * allocates, once, and ignores any number in the request.
 */
async function previewInvoiceNumber(): Promise<string> {
  const sql = getDb()
  const rows = await sql`
    WITH y AS (SELECT EXTRACT(YEAR FROM now())::int AS year)
    SELECT
      y.year,
      to_regprocedure('next_invoice_number(integer)') IS NOT NULL AS has_allocator,
      s.sequencename IS NOT NULL AS has_sequence,
      s.last_value::bigint   AS last_value,
      s.start_value::bigint  AS start_value,
      s.increment_by::bigint AS increment_by,
      (SELECT max(split_part(invoice_number, '-', 3)::int) FROM os_invoices
        WHERE invoice_number ~ ('^MP-' || y.year || '-[0-9]+$')) AS max_suffix
    FROM y
    LEFT JOIN pg_sequences s
      ON s.schemaname = 'doc_seq' AND s.sequencename = 'invoice_' || y.year` as Array<{
    year: number; has_allocator: boolean; has_sequence: boolean
    last_value: string | null; start_value: string | null; increment_by: string | null
    max_suffix: number | null
  }>
  const r = rows[0]
  return predictNextInvoiceNumber({
    year: Number(r.year),
    hasAllocator: r.has_allocator,
    sequence: r.has_sequence
      ? {
          lastValue: r.last_value === null ? null : Number(r.last_value),
          startValue: Number(r.start_value ?? 1),
          incrementBy: Number(r.increment_by ?? 1),
        }
      : null,
    maxStoredSuffix: r.max_suffix === null ? null : Number(r.max_suffix),
  })
}

export async function GET(request: NextRequest) {
  try {
    const sql  = getDb()
    const { searchParams } = new URL(request.url)
    const id   = searchParams.get('id')
    const next = searchParams.get('next')

    if (next === 'true') {
      /* A preview. Reading a form must not consume a document number. */
      return NextResponse.json({ number: await previewInvoiceNumber(), preview: true })
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
      client_id?: string; client_name: string
      client_email?: string; client_address?: string; line_items: unknown[]
      subtotal: number; total: number; status?: string; due_date?: string; notes?: string
      anzahlung?: number; anzahlung_date?: string; anzahlung_method?: string; restbetrag?: number
      payment_method?: string; currency?: string; language?: string
    }

    const admitted = admitLineItems(body.line_items)
    if (admitted.held.length > 0) {
      /* Persistence boundary: a line the provenance guard held, and no person
         resolved, is not stored. See admitLineItems in extraction-guard.ts. */
      return NextResponse.json(
        { error: 'Line items hold content the source does not support', held: admitted.held },
        { status: 422 },
      )
    }

    /*
     * Always allocated here, never taken from the request (risk 63). A
     * browser-supplied number let two open forms store the same one — the
     * second save failing on the unique constraint — and let the browser, not
     * the sequence, decide a number an auditor reads.
     */
    const invoice_number = await nextInvoiceNumber()

    // Single-tenant: Marcel is the only owner (0003-multi-tenancy.sql).
    const OWNER_ID = '00000000-0000-0000-0000-000000000001'

    const rows = await sql`
      INSERT INTO os_invoices
        (owner_id, invoice_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, due_date, notes,
         anzahlung, anzahlung_date, anzahlung_method, restbetrag,
         payment_method, currency, language)
      VALUES
        (${OWNER_ID}, ${invoice_number}, ${body.client_id || null}, ${body.client_name},
         ${body.client_email || null}, ${body.client_address || null},
         ${JSON.stringify(admitted.items)}::jsonb, ${body.subtotal}, ${body.total},
         ${body.status || 'draft'}, ${body.due_date || null}, ${body.notes || null},
         ${body.anzahlung ?? 0}, ${body.anzahlung_date || null},
         ${body.anzahlung_method || null}, ${body.restbetrag ?? body.total},
         ${body.payment_method || 'bank'}, ${body.currency || 'EUR'}, ${body.language || 'de'})
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
      payment_method?: string; currency?: string; language?: string
    }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const admitted = body.line_items ? admitLineItems(body.line_items) : null
    if (admitted && admitted.held.length > 0) {
      /* Persistence boundary: a line the provenance guard held, and no person
         resolved, is not stored. See admitLineItems in extraction-guard.ts. */
      return NextResponse.json(
        { error: 'Line items hold content the source does not support', held: admitted.held },
        { status: 422 },
      )
    }

    const rows = await sql`
      UPDATE os_invoices SET
        status         = COALESCE(${body.status as string | null}, status),
        paid_date      = COALESCE(${body.paid_date as string | null}, paid_date),
        sent_at        = COALESCE(${body.sent_at as string | null}, sent_at),
        due_date       = COALESCE(${body.due_date as string | null}, due_date),
        notes          = COALESCE(${body.notes as string | null}, notes),
        line_items     = COALESCE(${admitted ? JSON.stringify(admitted.items) : null}::jsonb, line_items),
        subtotal       = COALESCE(${body.subtotal ?? null}, subtotal),
        total          = COALESCE(${body.total ?? null}, total),
        payment_method = COALESCE(${body.payment_method as string | null}, payment_method),
        currency       = COALESCE(${body.currency as string | null}, currency),
        language       = COALESCE(${body.language as string | null}, language)
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/invoices PATCH]', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
