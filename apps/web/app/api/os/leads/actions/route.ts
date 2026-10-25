import { withAuth } from '@/lib/auth'
import { ownerCapabilityAction } from '@/lib/commercial/ownerActions'

export const dynamic = 'force-dynamic'
/* Research reads a website and asks a model: it can take most of a minute. */
export const maxDuration = 120
/** What the lead screens may drive (ADR-0027). Sending outreach prepares an approval Marcel confirms
 * on screen; everything else is GREEN and stays inside the OS. agentwork.request (ADR-0030) asks the
 * Research Agent; it reads the lead's website and the result comes back to this lead. */
const LEADS = new Set(['lead.create', 'lead.update', 'lead.research', 'agentwork.request', 'lead.basis', 'outreach.draft', 'outreach.send', 'outreach.whatsapp_link', 'activity.log', 'followup.done', 'email.discard'])

export const POST = withAuth(async (request, { session }) => ownerCapabilityAction(request, session, {
  capabilities: LEADS,
  maxBytes: 16 * 1024,
  messages: { required: 'Lead capability required', notFound: 'Lead approval not found', unavailable: 'Lead action unavailable' },
}))
