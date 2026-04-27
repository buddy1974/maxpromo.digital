import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const sql  = getDb()
    const rows = await sql`SELECT * FROM os_jobs ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[/api/os/jobs GET]', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      title: string; client_id?: string; client_name?: string; description?: string
      stage?: string; priority?: string; value?: number; due_date?: string
      tags?: string[]; notes?: string
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO os_jobs
        (title, client_id, client_name, description, stage, priority, value, due_date, tags, notes)
      VALUES
        (${body.title.trim()}, ${body.client_id || null}, ${body.client_name || null},
         ${body.description || null}, ${body.stage || 'lead'}, ${body.priority || 'medium'},
         ${body.value ?? null}, ${body.due_date || null},
         ${body.tags ? `{${body.tags.join(',')}}` : null}, ${body.notes || null})
      RETURNING *`

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/os/jobs POST]', msg)
    return NextResponse.json({ error: 'Failed to create job', detail: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await sql`DELETE FROM os_jobs WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/os/jobs DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql  = getDb()
    const body = await request.json() as {
      id: string; stage?: string; priority?: string; title?: string
      description?: string; notes?: string; value?: number; due_date?: string
      client_name?: string; invoice_id?: string
    }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const rows = await sql`
      UPDATE os_jobs SET
        stage       = COALESCE(${body.stage as string | null}, stage),
        priority    = COALESCE(${body.priority as string | null}, priority),
        title       = COALESCE(${body.title as string | null}, title),
        description = COALESCE(${body.description as string | null}, description),
        notes       = COALESCE(${body.notes as string | null}, notes),
        value       = COALESCE(${body.value ?? null}, value),
        due_date    = COALESCE(${body.due_date as string | null}, due_date),
        client_name = COALESCE(${body.client_name as string | null}, client_name),
        invoice_id  = COALESCE(${body.invoice_id as string | null}, invoice_id)
      WHERE id = ${body.id}
      RETURNING *`

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('[/api/os/jobs PATCH]', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}
