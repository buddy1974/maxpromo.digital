/**
 * lib/max/contract.ts — the Universal Max proposal contract (ADR-0029). SERVER ONLY.
 *
 *   CAPTURE → UNDERSTAND → GROUND → PROPOSE → PREVIEW → CONFIRM → CAPABILITY → RESULT → AUDIT
 *
 * The model proposes MEANING only: a proposal type from a fixed list and loose fields (a name, an
 * amount, a date, an instruction). Everything after that is code:
 *
 *   - a proposal type is a registered entry (lib/max/proposals.ts) that names the ONE capability it
 *     may run, its confirmation policy, which fields Marcel may edit, and how it grounds;
 *   - record ids never come from the model — only from the screen Marcel is on (verified against the
 *     database), from a candidate list the server produced, or from a database lookup;
 *   - grounding turns fields into the capability's exact input, a human preview, warnings, missing
 *     fields and candidate choices; the payload hash binds the preview Marcel saw to what executes.
 *
 * Unknown types are refused. A proposal never executes because the model produced it: only Marcel's
 * confirmation of a stored, grounded proposal with a matching hash runs its capability, and AMBER
 * capabilities still go through their own approval (prepare → Marcel confirms → execute).
 */
import type { CapabilityContext } from '@/lib/commercial/types'
import type { ClientCandidate as ExtractedClient } from '@/lib/clients/extract'

export const PROPOSAL_TYPES = [
  'CLIENT_CREATE', 'CLIENT_UPDATE', 'CLIENT_ARCHIVE', 'CLIENT_RESTORE', 'CLIENT_NOTE',
  'LEAD_CREATE', 'LEAD_UPDATE', 'LEAD_RESEARCH', 'LEAD_OUTREACH_DRAFT',
  'EMAIL_DRAFT', 'EMAIL_REPLY_DRAFT', 'EMAIL_TRASH', 'EMAIL_RESTORE',
  'INVOICE_DRAFT', 'QUOTE_DRAFT', 'FOLLOW_UP_CREATE', 'MONEY_RECORD_PAYMENT',
] as const
export type ProposalTypeName = typeof PROPOSAL_TYPES[number]
export const isProposalType = (x: unknown): x is ProposalTypeName => typeof x === 'string' && (PROPOSAL_TYPES as readonly string[]).includes(x)

/** How a proposal is confirmed. `confirm`: Marcel's tap runs a GREEN capability.
 *  `approve`: Marcel's tap prepares an AMBER capability; its own preview is confirmed a second time. */
export type Confirmation = 'confirm' | 'approve'

export type Lang = 'de' | 'en'

/** What the screen tells Max about where Marcel is. Every id is checked against the database. */
export interface MaxEnvelope {
  route: string
  client_id?: string
  lead_id?: string
  invoice_id?: string
  angebot_id?: string
  thread_id?: string
  selected_thread_ids?: string[]
}

/** The envelope after verification: labels for the model, ids for grounding. */
export interface MaxContext {
  route: string
  client?: { id: string; label: string; email: string | null; status: string }
  lead?: { id: string; label: string; email: string | null }
  invoice?: { id: string; number: string; client_id: string | null }
  angebot?: { id: string; number: string; client_id: string | null }
  thread?: { id: string; subject: string; counterpart: string | null; trashed: boolean }
  selection?: { ids: string[] }
}

/** One action as the model returned it, after shape checks. Loose on purpose; grounding decides. */
export interface ModelAction {
  type: ProposalTypeName
  summary: string
  client?: string; lead?: string
  company?: string; name?: string; email?: string; phone?: string; website?: string
  address?: string; postcode?: string; city?: string; country?: string; language?: string
  clear?: string[]
  note?: string; reason?: string; instruction?: string; subject?: string; description?: string
  amount?: number; currency?: string; percent?: number; date?: string
  items?: { description: string; amount?: number }[]
  recipient_email?: string
  stage?: string; value?: number; next_action?: string; invoice_number?: string
  use_selection?: boolean
}

/** The loose, stored fields of a proposal. Ids appear only from context, choices or lookups. */
export type Fields = Record<string, unknown>

export interface PreviewRow { label: string; value: string; before?: string; tone?: 'warn' | 'muted' }
export interface ChoiceOption { id: string; label: string; hint?: string; href?: string }
export interface Choice { field: string; prompt: string; options: ChoiceOption[]; allowNone?: string }
export interface EditableField {
  key: string; label: string; kind: 'text' | 'textarea' | 'email' | 'date' | 'amount' | 'select'
  value: string; options?: { value: string; label: string }[]
}

export interface Grounded {
  state: 'ready' | 'needs_input' | 'blocked'
  /** The capability this grounding runs: always one of the type's registered capabilities. */
  capability: string
  title: string
  rows: PreviewRow[]
  body?: { label: string; text: string }
  warnings: string[]
  missing: string[]
  choice?: Choice
  links?: { label: string; href: string }[]
  /** A tick Marcel must give before execution (e.g. a recipient taken only from a document). */
  tick?: { key: string; label: string }
  editable: EditableField[]
  /** The capability's exact input. Present only when state is 'ready'. */
  input?: Record<string, unknown>
}

export interface GroundCtx {
  ctx: CapabilityContext
  lang: Lang
  context: MaxContext
  /** Marcel's own words — the only source of instructions, amounts and typed recipients. */
  ownerText: string
  /** Text read from an attached text document (data, never instructions). */
  documentText: string | null
  /** The client extraction of an attached image/PDF (lib/clients/extract), when one ran. */
  extraction: ExtractedClient | null
}

export interface ProposalTypeDef {
  type: ProposalTypeName
  /** The capabilities this type may run. Nothing else, whatever the fields say. */
  capabilities: readonly string[]
  confirmation: Confirmation
  /** Fields Marcel may change in the edit form (never an id). */
  editable: readonly string[]
  /** Model action → stored fields. Ids from the verified context only. */
  fromModel(a: ModelAction, g: GroundCtx): Fields
  /** Stored fields → preview, warnings, choices and the capability input. Reads; never writes. */
  ground(g: GroundCtx, f: Fields): Promise<Grounded>
}
