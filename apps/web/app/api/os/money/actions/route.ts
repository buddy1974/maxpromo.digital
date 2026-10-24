import { withAuth } from '@/lib/auth'
import { ownerCapabilityAction } from '@/lib/commercial/ownerActions'

export const dynamic = 'force-dynamic'
/** What the Money screen may drive (ADR-0025). Refunds, payout confirmations and resolutions
 * prepare an approval Marcel confirms on screen; recording a received payment stays payment.record. */
const MONEY = new Set(['payment.link', 'payment.refund', 'payment.record', 'money.overview', 'payout.reconcile', 'money.resolve', 'reminder.send'])

export const POST = withAuth(async (request, { session }) => ownerCapabilityAction(request, session, {
  capabilities: MONEY,
  maxBytes: 8 * 1024,
  messages: { required: 'Money capability required', notFound: 'Money approval not found', unavailable: 'Money action unavailable' },
}))
