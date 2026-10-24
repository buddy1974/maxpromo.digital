import { NextRequest, NextResponse } from 'next/server'
import { writeAudit } from '@/lib/commercial/audit'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { DIRECT_CHANNEL } from '@/lib/commercial/direct'
import { berlinDate } from '@/lib/commercial/money'
import { markPaidDirect } from '@/lib/commercial/capabilities/documents'
import { cancelInvoice } from '@/lib/commercial/capabilities/money'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
import { getDb } from '@/lib/db'
import { admitLineItems } from '@/lib/documents/extraction-guard'
import { predictNextInvoiceNumber } from '@/lib/documents/numbering'
import { nextInvoiceNumber } from '@/lib/documents/allocate'

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

    /* Always created as a draft (ADR-0025). An invoice becomes `sent` only when the send route has
       actually handed it to the mail server, and `paid` only through the payment path — a form
       field cannot create an issued or paid invoice with nothing behind it. */

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
         'draft', ${body.due_date || null}, ${body.notes || null},
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

/**
 * Only a draft can be deleted. An issued invoice has a number in the legal
 * sequence (GoBD): it is cancelled, never removed, so the series has no gap.
 * Every deletion is audited as an owner direct action.
 */
export async function DELETE(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id || !UUID.test(id)) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const rows = await sql`DELETE FROM os_invoices WHERE id = ${id} AND status = 'draft' RETURNING invoice_number` as { invoice_number: string }[]
    if (!rows.length) {
      const found = await sql`SELECT status FROM os_invoices WHERE id = ${id}` as { status: string }[]
      if (!found.length) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      await writeAudit(sql, { actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, operation: 'invoice.delete.direct', entityType: 'invoice', entityId: id, outcome: 'refused', error: `status ${found[0].status}` })
      return NextResponse.json({ error: `An issued invoice (${found[0].status}) cannot be deleted — cancel it instead.`, code: 'issued' }, { status: 409 })
    }
    await writeAudit(sql, { actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, operation: 'invoice.delete.direct', entityType: 'invoice', entityId: id, before: { invoice_number: rows[0].invoice_number, status: 'draft' }, outcome: 'succeeded' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/invoices DELETE]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      id: string; status?: string; paid_date?: string; sent_at?: string
      due_date?: string; notes?: string; line_items?: unknown[]; subtotal?: number; total?: number
      payment_method?: string; currency?: string; language?: string; reason?: string
    }

    if (!body.id || !UUID.test(body.id)) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    /* Marking paid records the payment behind it (owner direct action), so
       "paid" and the money model never disagree (the old legacyPaid gap). */
    if (body.status === 'paid') {
      const today = berlinDate()
      const done = await markPaidDirect(sql, body.id, body.paid_date ?? today, today, OWNER_ACTOR, DIRECT_CHANNEL)
      if (!done.ok) return NextResponse.json({ error: done.error }, { status: done.status })
      const rows = await sql`SELECT * FROM os_invoices WHERE id = ${body.id}`
      return NextResponse.json(rows[0])
    }

    /* Status moves only along real transitions (ADR-0025). `sent` is set by the send route,
       `paid` by the payment path above; here only cancelling remains, and only while no money is
       recorded against the invoice (refund it first, so the ledger stays true). */
    const current = await sql`SELECT status, currency, money.invoice_paid(id)::numeric AS paid FROM os_invoices WHERE id = ${body.id}` as { status: string; currency: string; paid: string }[]
    if (!current[0]) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    const before = current[0]
    if (body.status !== undefined && body.status !== before.status) {
      if (body.status !== 'cancelled') return NextResponse.json({ error: `Status ${String(body.status)} is set by its own action (send or record payment), not by editing.`, code: 'transition' }, { status: 409 })
      if (Number(before.paid) > 0.009) return NextResponse.json({ error: 'Money is recorded against this invoice. Refund it before cancelling.', code: 'has_payments' }, { status: 409 })
      if (before.status === 'paid') return NextResponse.json({ error: 'A paid invoice is not cancelled.', code: 'transition' }, { status: 409 })
      /* Cancelling has one implementation (invoice.cancel): a reason, the money guard, pay link off,
         open checkouts closed, audit. The screens use the governed capability; this keeps the API equal. */
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (reason.length < 3) return NextResponse.json({ error: 'A reason is required to cancel an invoice.', code: 'reason_required' }, { status: 400 })
      const done = await cancelInvoice(sql, { invoiceId: body.id, expectStatus: before.status, reason: reason.slice(0, 300), actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, today: berlinDate() })
      if (!done.ok) return NextResponse.json({ error: done.reason === 'has_money' ? 'Money is recorded against this invoice. Refund it before cancelling.' : 'The invoice changed; reload it.', code: done.reason }, { status: 409 })
      const rows = await sql`SELECT * FROM os_invoices WHERE id = ${body.id}`
      return NextResponse.json(rows[0])
    }
    if (['paid', 'cancelled'].includes(before.status) && Object.keys(body).some(k => !['id', 'notes', 'language', 'status'].includes(k))) {
      return NextResponse.json({ error: `A ${before.status} invoice keeps its amounts.`, code: 'locked' }, { status: 409 })
    }
    if (body.currency && body.currency !== before.currency && Number(before.paid) > 0.009) {
      return NextResponse.json({ error: 'Payments are recorded in the current currency; it cannot change.', code: 'has_payments' }, { status: 409 })
    }

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
        -- What the invoice asks for follows a corrected total (money.ts reads restbetrag first).
        restbetrag     = CASE WHEN ${body.total ?? null}::numeric IS NULL THEN restbetrag
                              ELSE greatest(${body.total ?? null}::numeric - coalesce(anzahlung, 0), 0) END,
        payment_method = COALESCE(${body.payment_method as string | null}, payment_method),
        currency       = COALESCE(${body.currency as string | null}, currency),
        language       = COALESCE(${body.language as string | null}, language)
      WHERE id = ${body.id}
      RETURNING *` as Record<string, unknown>[]

    /* Changing an issued invoice is allowed (corrections happen) and recorded. */
    if (rows[0] && rows[0].status !== 'draft') {
      await writeAudit(sql, {
        actor: OWNER_ACTOR, channel: DIRECT_CHANNEL, operation: 'invoice.update.direct', entityType: 'invoice', entityId: body.id,
        after: Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'id' && k !== 'line_items')), outcome: 'succeeded',
      })
    }
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/invoices PATCH]', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
