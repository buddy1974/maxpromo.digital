/**
 * lib/commercial/pipeline.ts
 *
 * The sales pipeline's vocabulary, defined once.
 *
 * `os_leads.status` is the one field that says where a lead stands. Until
 * 0011 it held five triage words (new, contacted, qualified, converted, and
 * the screen's "lost" where the schema comment said "archived"), which is not
 * enough to run a pipeline on: nothing could say "proposal sent", "waiting on
 * them" or "parked until spring". The vocabulary below replaces it in code.
 *
 * Existing rows are not rewritten. A legacy value is read through
 * `leadStage()`, which is the only place the old words are known, so a lead
 * saved by the contact form as `new` is a DISCOVERED lead without a data
 * migration touching production.
 *
 * Pure and dependency-free.
 */

export const LEAD_STAGES = [
  'discovered',
  'qualified',
  'outreach_prepared',
  'contacted',
  'responded',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'on_hold',
] as const

export type LeadStage = typeof LEAD_STAGES[number]

/** Words stored before 0011, and what each one means now. */
const LEGACY_STATUS: Readonly<Record<string, LeadStage>> = {
  new: 'discovered',
  converted: 'won',
  archived: 'lost',
}

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === 'string' && (LEAD_STAGES as readonly string[]).includes(value)
}

/** The stage a stored status means. Unknown words are reported, not guessed. */
export function leadStage(status: string | null | undefined): LeadStage | null {
  if (!status) return 'discovered'
  if (isLeadStage(status)) return status
  return LEGACY_STATUS[status] ?? null
}

/** Statuses, including legacy spellings, that mean a given stage — for SQL. */
export function statusesFor(stages: readonly LeadStage[]): string[] {
  const out = new Set<string>(stages)
  for (const [legacy, stage] of Object.entries(LEGACY_STATUS)) if (stages.includes(stage)) out.add(legacy)
  return [...out]
}

export const CLOSED_STAGES: readonly LeadStage[] = ['won', 'lost']
export const OPEN_STAGES: readonly LeadStage[] = LEAD_STAGES.filter((s) => !CLOSED_STAGES.includes(s) && s !== 'on_hold')

/** Stages in which the other side owes the next move, not Marcel. */
export const WAITING_ON_THEM: readonly LeadStage[] = ['contacted', 'proposal']

/**
 * How likely an open stage is to close. A planning weight for ranking work,
 * never presented as a forecast: no history exists yet to calibrate it, and
 * the owner view labels anything derived from it as weighted pipeline.
 */
export const STAGE_WEIGHT: Readonly<Record<LeadStage, number>> = {
  discovered: 0.05,
  qualified: 0.1,
  outreach_prepared: 0.1,
  contacted: 0.15,
  responded: 0.3,
  discovery: 0.4,
  proposal: 0.5,
  negotiation: 0.7,
  won: 1,
  lost: 0,
  on_hold: 0.05,
}

export const STAGE_LABEL: Readonly<Record<LeadStage, { de: string; en: string }>> = {
  discovered:        { de: 'Entdeckt',            en: 'Discovered' },
  qualified:         { de: 'Qualifiziert',        en: 'Qualified' },
  outreach_prepared: { de: 'Ansprache vorbereitet', en: 'Outreach prepared' },
  contacted:         { de: 'Kontaktiert',         en: 'Contacted' },
  responded:         { de: 'Geantwortet',         en: 'Responded' },
  discovery:         { de: 'Bedarfsanalyse',      en: 'Discovery' },
  proposal:          { de: 'Angebot',             en: 'Proposal' },
  negotiation:       { de: 'Verhandlung',         en: 'Negotiation' },
  won:               { de: 'Gewonnen',            en: 'Won' },
  lost:              { de: 'Verloren',            en: 'Lost' },
  on_hold:           { de: 'Pausiert',            en: 'On hold' },
}

/** Days without an interaction after which an open lead is going cold. */
export const COLD_AFTER_DAYS = 14
