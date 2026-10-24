import { withAuth } from '@/lib/auth'
import { ownerCapabilityAction } from '@/lib/commercial/ownerActions'

export const dynamic = 'force-dynamic'
const MAIL = new Set(['email.search','email.read','email.attachments','email.draft','email.send','email.state','email.trash','email.link','email.save_lead','email.summary','email.triage','email.spam',
  'email.compose','email.deliver','email.discard','email.followup','email.assist'])

// The current OS has one owner; future staff sessions must not inherit mailbox authority.
// This cookie route cannot execute another channel's approval or a non-mail capability.
export const POST = withAuth(async (request, { session }) => ownerCapabilityAction(request, session, {
  capabilities: MAIL,
  // A full draft (20,000 characters of text plus recipients) must fit; JSON escaping can double it.
  maxBytes: 64 * 1024,
  messages: { required: 'Email capability required', notFound: 'Email approval not found', unavailable: 'Email action unavailable' },
}))
