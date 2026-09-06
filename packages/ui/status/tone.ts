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

/**
 * The same tones as custom properties, for surfaces that style inline.
 *
 * TONE_TEXT and TONE_BADGE are Tailwind class strings, which is why the
 * internal OS could not use them: it styles with inline `style` objects and
 * CSS custom properties, so a class name is no use to it. The result was the
 * situation ADR-0002 describes, happening a second time in a different
 * application — eight status maps across the OS, with different vocabularies
 * (invoice status, quotation status, lead status, job priority, log type) and
 * style values that were identical character for character.
 *
 * They had drifted, as eleven copies did before them. The dashboard coloured a
 * new lead with the brand accent while the leads page coloured it amber, so
 * the same status was two colours on two screens — and the accent as a status
 * is forbidden twice over: brand colours are never semantic colours, and Brand
 * Lime as text measures 1.51:1.
 *
 * The lesson of ADR-0002 holds: the shared thing is the tone, not the
 * vocabulary. This is the same six tones in the form the OS can consume.
 */
export const TONE_VARS: Record<Tone, { text: string; bg: string; border: string }> = {
  neutral: {
    text: 'var(--brand-text-secondary)',
    bg: 'var(--brand-surface-sunken)',
    border: 'var(--brand-border)',
  },
  positive: {
    text: 'var(--semantic-success)',
    bg: 'color-mix(in srgb, var(--semantic-success) 12%, transparent)',
    border: 'color-mix(in srgb, var(--semantic-success) 30%, transparent)',
  },
  caution: {
    text: 'var(--semantic-warning)',
    bg: 'color-mix(in srgb, var(--semantic-warning) 12%, transparent)',
    border: 'color-mix(in srgb, var(--semantic-warning) 30%, transparent)',
  },
  critical: {
    text: 'var(--semantic-danger)',
    bg: 'color-mix(in srgb, var(--semantic-danger) 12%, transparent)',
    border: 'color-mix(in srgb, var(--semantic-danger) 30%, transparent)',
  },
  info: {
    text: 'var(--semantic-info)',
    bg: 'color-mix(in srgb, var(--semantic-info) 12%, transparent)',
    border: 'color-mix(in srgb, var(--semantic-info) 30%, transparent)',
  },
  /**
   * Selected or active — not a status. The text is the accessible accent at
   * 5.00:1, never --brand-primary, which is a fill and measures 1.51:1 as
   * text. Four OS maps used the fill.
   */
  accent: {
    text: 'var(--brand-primary-text)',
    bg: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
    border: 'var(--brand-primary-edge)',
  },
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
