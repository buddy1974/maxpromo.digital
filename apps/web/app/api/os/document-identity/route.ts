import { NextResponse } from 'next/server'
import { DOCUMENT_IDENTITY } from '@/lib/documents/identity'

/**
 * The letterhead, bank and MoMo details the document screens print.
 *
 * Served here, behind the /api/os authentication in middleware.ts, instead of
 * being imported by client components — which compiled them into public
 * static JavaScript (known risk 69). `private, no-store`: a shared cache may
 * not keep a copy.
 */
export function GET() {
  return NextResponse.json(DOCUMENT_IDENTITY, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
