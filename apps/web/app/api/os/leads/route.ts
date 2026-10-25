import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/*
 * The leads list, read only. Every change goes through the governed capabilities on
 * /api/os/leads/actions (lead.create, lead.update — duplicate check, timeline, audit). The old
 * unaudited POST/PATCH and the hard DELETE were removed (risk 145); a lead is closed, never deleted.
 */
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
