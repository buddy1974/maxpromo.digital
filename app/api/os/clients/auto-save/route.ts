import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * POST /api/os/clients/auto-save
 * Upserts a client from invoice data and links the invoice to the client.
 * Non-destructive: never overwrites existing client records.
 */
export async function POST(request: NextRequest) {
  try {
    const sql = getDb()
    const body = await request.json() as {
      name: string
      email?: string
      address?: string
      city?: string
      phone?: string
      invoice_id?: string
      angebot_id?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    const name  = body.name.trim()
    const email = body.email?.trim() || null

    // 1. Check if client already exists (by email or by name)
    const existing = await sql`
      SELECT id FROM os_clients
      WHERE (${email}::text IS NOT NULL AND email = ${email})
         OR name ILIKE ${name}
      LIMIT 1`

    let clientId: string
    let created = false

    if (existing.length > 0) {
      clientId = existing[0].id as string
    } else {
      // 2. Auto-create from invoice data
      const rows = await sql`
        INSERT INTO os_clients (name, email, address, city, phone, status, notes)
        VALUES (
          ${name},
          ${email},
          ${body.address || null},
          ${body.city || null},
          ${body.phone || null},
          'active',
          'Auto-added from invoice'
        )
        RETURNING id`
      clientId = rows[0].id as string
      created  = true
    }

    // 3. Link document to client if document_id provided
    if (body.invoice_id) {
      await sql`
        UPDATE os_invoices SET client_id = ${clientId}
        WHERE id = ${body.invoice_id} AND (client_id IS NULL OR client_id = '')`
        .catch(() => { /* non-blocking — old DB may not have client_id */ })
    }
    if (body.angebot_id) {
      await sql`
        UPDATE os_angebote SET client_id = ${clientId}
        WHERE id = ${body.angebot_id} AND (client_id IS NULL OR client_id = '')`
        .catch(() => {})
    }

    return NextResponse.json({ clientId, created })
  } catch (error) {
    console.error('[/api/os/clients/auto-save]', error)
    return NextResponse.json({ error: 'auto-save failed' }, { status: 500 })
  }
}
