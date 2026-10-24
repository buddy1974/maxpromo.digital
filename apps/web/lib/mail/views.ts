/**
 * Which conversation appears in which Inbox view (ADR-0023). Pure and client-safe; the state
 * itself is computed on the server (lib/mail/context.ts conversationState).
 *
 * Quarantined mail appears only under Spam: never in the Inbox, a work view or a business view.
 */
export type ConversationState = 'needs_reply' | 'customer_replied' | 'follow_up_overdue' | 'follow_up_due' | 'waiting' | 'no_next_step' | 'quarantined' | 'archived'
export type Quarantine = 'provider_junk' | 'suspected_phishing' | 'owner_spam' | 'blocked_sender'
export interface MailThread {
  id: string; subject: string; classification: string; needs_reply: boolean; waiting: boolean; archived: boolean; trashed: boolean
  updated_at: string; sender: string | null; preview?: string | null; unread: boolean
  business_label?: string | null; business_kind?: 'client' | 'lead' | 'project' | null
  /** A record whose email equals the sender, not yet confirmed by the owner. */
  possible_kind?: 'client' | 'lead' | null
  quarantine?: Quarantine | null; owner_verdict?: 'spam' | 'not_spam' | null; provider_state?: string | null
  follow_up_on?: string | null; next_action?: string | null; last_direction?: 'inbound' | 'outbound' | null
  last_inbound?: string | null; last_outbound?: string | null; message_count?: number; has_attachments?: boolean; has_draft?: boolean
  state: ConversationState
}

export const VIEW_GROUPS = {
  work: ['inbox', 'needs_reply', 'follow_up', 'waiting', 'unread'],
  business: ['leads', 'clients', 'billing', 'system'],
  mailbox: ['drafts', 'sent', 'archived', 'spam'],
} as const
export type View = typeof VIEW_GROUPS[keyof typeof VIEW_GROUPS][number]
export const VIEWS: View[] = [...VIEW_GROUPS.work, ...VIEW_GROUPS.business, ...VIEW_GROUPS.mailbox]
export const isView = (value: unknown): value is View => typeof value === 'string' && (VIEWS as string[]).includes(value)

/** A lead the owner confirmed, a record matching the sender, or an enquiry not yet in the CRM. */
export function leadKind(t: MailThread): 'confirmed' | 'possibleMatch' | 'potential' | null {
  if (t.business_kind === 'lead') return 'confirmed'
  if (t.business_kind === 'client' || t.possible_kind === 'client') return null
  if (t.possible_kind === 'lead') return 'possibleMatch'
  if (t.classification === 'lead') return 'potential'
  return null
}
/** A client the owner confirmed, or a client record matching the sender. */
export function clientKind(t: MailThread): 'confirmed' | 'possibleMatch' | null {
  if (t.business_kind === 'client') return 'confirmed'
  if (!t.business_kind && t.possible_kind === 'client') return 'possibleMatch'
  return null
}

export function inView(t: MailThread, view: View): boolean {
  if (t.trashed) return false
  if (view === 'spam') return Boolean(t.quarantine)
  if (t.quarantine) return false
  if (view === 'archived') return t.archived
  if (view === 'drafts') return Boolean(t.has_draft)
  if (view === 'sent') return Boolean(t.last_outbound)
  if (t.archived) return false
  switch (view) {
    case 'inbox': return true
    case 'needs_reply': return t.state === 'needs_reply' || t.state === 'customer_replied'
    case 'follow_up': return t.state === 'follow_up_due' || t.state === 'follow_up_overdue'
    case 'waiting': return t.state === 'waiting'
    case 'unread': return t.unread
    case 'leads': return leadKind(t) !== null
    case 'clients': return clientKind(t) !== null || t.classification === 'client'
    case 'billing': return t.classification === 'billing'
    case 'system': return t.classification === 'system'
  }
  return false
}

export function viewCounts(threads: MailThread[]): Record<View, number> {
  const out = Object.fromEntries(VIEWS.map(v => [v, 0])) as Record<View, number>
  for (const t of threads) for (const v of VIEWS) if (inView(t, v)) out[v]++
  return out
}

/** Work order inside a view: what needs Marcel first, then newest. */
const URGENCY: Record<ConversationState, number> = { customer_replied: 0, needs_reply: 1, follow_up_overdue: 2, follow_up_due: 3, waiting: 5, no_next_step: 6, archived: 7, quarantined: 8 }
export function sortForView(threads: MailThread[], view: View): MailThread[] {
  const byDate = (a: MailThread, b: MailThread) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
  if (view === 'inbox' || view === 'needs_reply' || view === 'follow_up') return [...threads].sort((a, b) => URGENCY[a.state] - URGENCY[b.state] || byDate(a, b))
  if (view === 'waiting') return [...threads].sort((a, b) => (a.follow_up_on ?? '9999').localeCompare(b.follow_up_on ?? '9999') || byDate(a, b))
  return [...threads].sort(byDate)
}

/** Whether a state is one Marcel must act on (shown emphasised). */
export const ACTIONABLE: ReadonlySet<ConversationState> = new Set(['needs_reply', 'customer_replied', 'follow_up_overdue', 'follow_up_due'])
