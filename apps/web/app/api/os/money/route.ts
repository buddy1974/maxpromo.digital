import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { OWNER_ACTOR } from '@/lib/commercial/engine'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { invoiceMoney, moneySnapshot } from '@/lib/money/state'

/**
 * GET /api/os/money — the Money domain as /os shows it (ADR-0025): receivables, money received,
 * card money and fees, payouts to Revolut, and what needs reconciling. `?invoice=<id>` returns one
 * invoice's payment ledger, pay link and payment attempts. Read-only; owner only.
 */
export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const GET = withAuth(async (request, { session }) => {
  if (session.sub !== 'marcel') return ownerReply('Owner access required', 403)
  try {
    const invoice = new URL(request.url).searchParams.get('invoice')
    if (invoice !== null) {
      if (!UUID.test(invoice)) return ownerReply('Invalid invoice', 400)
      return NextResponse.json(await invoiceMoney(getDb(), invoice), { headers: OWNER_HEADERS })
    }
    const now = new Date()
    return NextResponse.json(await moneySnapshot({ sql: getDb(), actor: OWNER_ACTOR, channel: 'os', now, today: berlinDate(now), committed: () => {} }), { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/money]', err instanceof Error ? err.message : err)
    return ownerReply('Money unavailable', 503)
  }
})
