/**
 * @maxpromo/ui — status tone
 *
 * One place where "this thing is fine / needs attention / is wrong" becomes a
 * set of classes.
 *
 * ── WHY A TONE, AND NOT A SEVERITY ─────────────────────────────────────────
 * Eleven components in the dashboard each declared their own lookup table, and
 * they did not share a vocabulary: AgentRiskLevel, DocumentRiskLevel,
 * AgentStatus, TaskPriority, DataSensitivity, ProjectHealth. What they *did*
 * share, character for character, was the style strings.
 *
 * So the shared thing is not the vocabulary — a document's risk and an agent's
 * status are genuinely different domains and should keep their own types. The
 * shared thing is the tone. Each component maps its own domain to a tone; the
 * styling is defined once here.
 *
 * This is why the earlier attempt at a single SEVERITY map went unused: it
 * assumed every caller spoke the same language, and none of them did.
 *
 * ── COLOUR RULE ────────────────────────────────────────────────────────────
 * These resolve to --semantic-* tokens, deliberately outside the --brand-*
 * namespace. The brand carries identity; these carry meaning; the platform
 * rule is that the two never share a value. `accent` is the one exception and
 * is for an active or selected state, not for a status.
 */

/** The full set. A component maps its own vocabulary onto these. */
export type Tone =
  /** Nothing to report. The default. */
  | 'neutral'
  /** Working, healthy, complete. */
  | 'positive'
  /** Needs attention but is not broken. */
  | 'caution'
  /** Broken, blocked, or overdue. */
  | 'critical'
  /** Informational, not a judgement. */
  | 'info'
  /** Currently selected or active. Not a status. */
  | 'accent'

/** Text-only treatment: table cells, inline labels, figures. */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-ink-muted',
  positive: 'text-success',
  caution: 'text-warning',
  critical: 'text-danger',
  info: 'text-info',
  accent: 'text-ink',
}

/** Badge treatment: a bordered pill with a soft fill. */
export const TONE_BADGE: Record<Tone, string> = {
  neutral: 'border-hairline bg-surface-subtle text-ink-muted',
  positive: 'border-success/30 bg-success-soft text-success',
  caution: 'border-warning/30 bg-warning-soft text-warning',
  critical: 'border-danger/30 bg-danger-soft text-danger',
  info: 'border-info/30 bg-info-soft text-info',
  accent: 'border-accent bg-accent-soft text-ink',
}

/** A left rule, for list rows that carry a state. */
export const TONE_RULE: Record<Tone, string> = {
  neutral: 'border-l-2 border-hairline',
  positive: 'border-l-2 border-success',
  caution: 'border-l-2 border-warning',
  critical: 'border-l-2 border-danger',
  info: 'border-l-2 border-info',
  accent: 'border-l-2 border-accent',
}

/**
 * Build a typed domain-to-tone mapper.
 *
 * Keeps each component's own union type intact while the styling stays here:
 *
 *   const riskTone = toneMap<AgentRiskLevel>({
 *     low: 'positive', medium: 'caution', high: 'critical', critical: 'critical',
 *   })
 *   <span className={TONE_BADGE[riskTone(level)]}>…</span>
 */
export function toneMap<T extends string>(map: Record<T, Tone>) {
  return (value: T): Tone => map[value] ?? 'neutral'
}
