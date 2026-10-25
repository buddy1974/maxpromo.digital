import { withAuth } from '@/lib/auth'
import { ownerCapabilityAction } from '@/lib/commercial/ownerActions'

export const dynamic = 'force-dynamic'
/** What the client screens may drive. Every write to a client goes through these capabilities
 * (audited, on the client's timeline); a permanent delete is AMBER and only for an empty client. */
const CLIENTS = new Set(['client.match', 'client.create', 'client.update', 'client.archive', 'client.restore', 'client.delete', 'client.show'])

export const POST = withAuth(async (request, { session }) => ownerCapabilityAction(request, session, {
  capabilities: CLIENTS,
  maxBytes: 24 * 1024,
  messages: { required: 'Client capability required', notFound: 'Client approval not found', unavailable: 'Client action unavailable' },
}))
