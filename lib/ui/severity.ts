/**
 * lib/ui/severity.ts
 *
 * One severity-to-style map for the whole dashboard.
 *
 * Before this file existed the same low/medium/high lookup was declared
 * independently in ten places: RiskBadge, DocumentRiskBadge, StatusBadge,
 * GovernanceRiskCard, AuditFindingCard, TaskList, WaitingCustomerCard,
 * DataSensitivityMatrix, and the projects and client-implementation pages. Ten
 * copies of one idea is how a design system drifts, and it is why some of them
 * used amber-600 (3.1:1 on white — fails WCAG AA) while others used amber-700.
 *
 * These are semantic colours, not brand colours. They resolve to the
 * --semantic-* tokens, which are deliberately outside the --brand-* namespace:
 * the brand carries identity, these carry meaning, and the platform rule is
 * that the two never share a value. Success is blue-shifted emerald precisely
 * so it cannot be mistaken for the green brand.
 *
 * Moves to packages/ui in the monorepo consolidation.
 */

/** Ordered least to most urgent. */
export type Severity = 'low' | 'medium' | 'high' | 'critical'

/** Operational state of a thing that runs. */
export type RunState = 'active' | 'paused' | 'blocked' | 'done' | 'pending'

/** Text-only treatment — table cells, inline labels. */
export const SEVERITY_TEXT: Record<Severity, string> = {
  low: 'text-ink-secondary',
  medium: 'text-warning',
  high: 'text-danger',
  critical: 'text-danger',
}

/** Badge treatment — bordered pill with a soft fill. */
export const SEVERITY_BADGE: Record<Severity, string> = {
  low: 'border-hairline bg-surface-subtle text-ink-secondary',
  medium: 'border-warning/30 bg-warning-soft text-warning',
  high: 'border-danger/30 bg-danger-soft text-danger',
  critical: 'border-danger/50 bg-danger-soft text-danger',
}

export const RUN_STATE_TEXT: Record<RunState, string> = {
  active: 'text-success',
  paused: 'text-warning',
  blocked: 'text-danger',
  done: 'text-ink-secondary',
  pending: 'text-ink-muted',
}

export const RUN_STATE_BADGE: Record<RunState, string> = {
  active: 'border-success/30 bg-success-soft text-success',
  paused: 'border-warning/30 bg-warning-soft text-warning',
  blocked: 'border-danger/30 bg-danger-soft text-danger',
  done: 'border-hairline bg-surface-subtle text-ink-secondary',
  pending: 'border-hairline bg-surface-subtle text-ink-muted',
}

/**
 * Data sensitivity. Distinct from severity: a confidential document is not a
 * problem, it is a constraint. Kept as its own scale so the two never get
 * conflated in a component that shows both.
 */
export type Sensitivity = 'public' | 'internal' | 'confidential' | 'restricted'

export const SENSITIVITY_TEXT: Record<Sensitivity, string> = {
  public: 'text-ink-secondary',
  internal: 'text-info',
  confidential: 'text-warning',
  restricted: 'text-danger',
}
