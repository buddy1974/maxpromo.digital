import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { predictNextAngebotNumber } from '@/lib/documents/numbering'
import { admitLineItems } from '@/lib/documents/extraction-guard'
import { nextAngebotNumber } from '@/lib/documents/allocate'

/**
 * Atomic per-year angebot numbering — uses the Postgres sequence from
 * db/migrations/0001-document-numbering.sql. Falls back to SELECT-MAX
 * if the migration hasn't run yet.
 */
/**
 * What the next number will probably be, WITHOUT consuming one.
 *
 * `next_angebot_number()` calls `nextval()`, which permanently advances a
 * Postgres sequence. The new-quotation form asked for a number on mount, so
 * merely opening a blank form burned a document number — and burned two,
 * because React's development StrictMode invokes an effect twice. A governed
 * browser run watched the sequence go 010 → 012 → 014 across three page loads
 * without a single quotation being saved.
 *
 * Opening a blank form is not a business event. A document number is
 * allocated when a person saves, which is the moment a document starts to
 * exist. Until then the form shows a preview, computed from what is already
 * stored, and says nothing to the sequence.
 *
 * The preview can be wrong — two forms open at once will show the same one.
 * That is correct and harmless: `POST` allocates authoritatively, and a
 * preview that is occasionally superseded is a far smaller problem than a
 * numbering series with silent gaps in it.
 *
 * It is read from the sequence the allocator advances, not from stored rows.
 * Rows and sequence disagree whenever a number was issued without a row —
 * which is the very defect above — and the evidence run showed the form
 * promising ANG-2026-001 while the save correctly issued ANG-2026-015. The
 * prediction itself lives in lib/documents/numbering.ts.
 */
async function previewAngebotNumber(): Promise<string> {
  const sql = getDb()
  const rows = await sql`
    WITH y AS (SELECT EXTRACT(YEAR FROM now())::int AS year)
    SELECT
      y.year,
      to_regprocedure('next_angebot_number(integer)') IS NOT NULL AS has_allocator,
      s.sequencename IS NOT NULL AS has_sequence,
      s.last_value::bigint   AS last_value,
      s.start_value::bigint  AS start_value,
      s.increment_by::bigint AS increment_by,
      (SELECT max(split_part(angebot_number, '-', 3)::int) FROM os_angebote
        WHERE angebot_number ~ ('^ANG-' || y.year || '-[0-9]+$')) AS max_suffix
    FROM y
    LEFT JOIN pg_sequences s
      ON s.schemaname = 'doc_seq' AND s.sequencename = 'angebot_' || y.year` as Array<{
    year: number; has_allocator: boolean; has_sequence: boolean
    last_value: string | null; start_value: string | null; increment_by: string | null
    max_suffix: number | null
  }>
  const r = rows[0]
  return predictNextAngebotNumber({
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
      return NextResponse.json({ number: await previewAngebotNumber(), preview: true })
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
      payment_method?: string; currency?: string; language?: string
    }

    /*
     * Always allocated here, never taken from the request.
     *
     * The client holds a preview from `?next=true`, and it used to send that
     * preview back to be stored. Two forms open at once would then both store
     * the same number, and the unique constraint would reject the second save
     * as an opaque failure. The number the document keeps is the one the
     * sequence issues at the moment of saving.
     */
    const admitted = admitLineItems(body.line_items)
    if (admitted.held.length > 0) {
      /* Persistence boundary: a line the provenance guard held, and no person
         resolved, is not stored. See admitLineItems in extraction-guard.ts. */
      return NextResponse.json(
        { error: 'Line items hold content the source does not support', held: admitted.held },
        { status: 422 },
      )
    }

    const angebot_number = await nextAngebotNumber()
    // Single-tenant: Marcel is the only owner (0003-multi-tenancy.sql).
    // When multi-user auth lands, replace this with the session user's owner_id.
    const OWNER_ID = '00000000-0000-0000-0000-000000000001'

    const rows = await sql`
      INSERT INTO os_angebote
        (owner_id, angebot_number, client_id, client_name, client_email, client_address,
         line_items, subtotal, total, status, valid_until, notes,
         anzahlung, anzahlung_date, anzahlung_method, payment_method, currency, language)
      VALUES
        (${OWNER_ID}, ${angebot_number}, ${body.client_id || null}, ${body.client_name},
         ${body.client_email || null}, ${body.client_address || null},
         ${JSON.stringify(admitted.items)}::jsonb, ${body.subtotal}, ${body.total},
         ${body.status || 'draft'}, ${body.valid_until || null}, ${body.notes || null},
         ${body.anzahlung ?? 0}, ${body.anzahlung_date || null}, ${body.anzahlung_method || null},
         ${body.payment_method || 'bank'}, ${body.currency || 'EUR'}, ${body.language || 'de'})
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
      id: string
      // Status / workflow fields
      status?: string
      sent_at?: string
      valid_until?: string
      converted_to_invoice?: boolean
      // Client fields
      client_id?: string | null
      client_name?: string
      client_email?: string
      client_address?: string
      // Line items + amounts
      line_items?: unknown[]
      subtotal?: number
      total?: number
      // Anzahlung
      anzahlung?: number
      anzahlung_date?: string | null
      anzahlung_method?: string
      // Enrichment
      payment_terms?: string
      included_items?: string[]
      notes?: string
      payment_method?: string
      currency?: string
      language?: string
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
      UPDATE os_angebote SET
        status               = COALESCE(${body.status as string | null}, status),
        sent_at              = COALESCE(${body.sent_at as string | null}, sent_at),
        valid_until          = COALESCE(${body.valid_until as string | null}, valid_until),
        converted_to_invoice = COALESCE(${body.converted_to_invoice ?? null}, converted_to_invoice),
        client_id            = COALESCE(${body.client_id ?? null}, client_id),
        client_name          = COALESCE(${body.client_name as string | null}, client_name),
        client_email         = COALESCE(${body.client_email as string | null}, client_email),
        client_address       = COALESCE(${body.client_address as string | null}, client_address),
        line_items           = COALESCE(${admitted ? JSON.stringify(admitted.items) : null}::jsonb, line_items),
        subtotal             = COALESCE(${body.subtotal ?? null}, subtotal),
        total                = COALESCE(${body.total ?? null}, total),
        anzahlung            = COALESCE(${body.anzahlung ?? null}, anzahlung),
        anzahlung_date       = COALESCE(${body.anzahlung_date ?? null}, anzahlung_date),
        anzahlung_method     = COALESCE(${body.anzahlung_method as string | null}, anzahlung_method),
        payment_terms        = COALESCE(${body.payment_terms as string | null}, payment_terms),
        included_items       = COALESCE(${body.included_items ? JSON.stringify(body.included_items) : null}::jsonb, included_items),
        notes                = COALESCE(${body.notes as string | null}, notes),
        payment_method       = COALESCE(${body.payment_method as string | null}, payment_method),
        currency             = COALESCE(${body.currency as string | null}, currency),
        language             = COALESCE(${body.language as string | null}, language)
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/angebote PATCH]', msg)
    return NextResponse.json({ error: 'Failed to update angebot', detail: msg }, { status: 500 })
  }
}
