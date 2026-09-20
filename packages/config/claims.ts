/**
 * packages/config/claims.ts
 *
 * Every public claim about a delivered client outcome, and what the company
 * can actually show for it.
 *
 * WHY THIS EXISTS
 *
 * The forensic inventory (docs/research/evidence-inventory-2026.md) established
 * that four figures the site publishes entered the repository in a workspace
 * restructuring commit with no measurement artefact, no client record and no
 * source document behind any of them. One of the four had been published at two
 * different values in two currencies, seventeen per cent apart.
 *
 * None of that made the numbers false. It made them unevidenced, which is a
 * different thing and needs a different response: not deletion, not defence,
 * but a record of what is known and a rule about where an unknown may appear.
 *
 * WHAT THIS IS NOT
 *
 * It is not a second claims audit. `packages/tooling/audit-claims.mjs` reads
 * the message catalogues looking for problems nobody has noticed yet: the same
 * magnitude in two currencies, a hedge word inside a result. It discovers.
 * It reports and never blocks, because resolving what it finds needs knowledge
 * of delivered work that a tool does not have (ADR-0007).
 *
 * This file is the opposite end of the same subject. It records decisions that
 * have already been made, and `check:claims` enforces them. Where the audit
 * asks "is something wrong here", this asks "is a claim we already know to be
 * unevidenced appearing somewhere it is not allowed to appear". That is
 * mechanical, the fix is always "take it off the page", and so it blocks.
 */

/**
 * How well a claim is evidenced. Deliberately not a boolean: the useful
 * distinction is not true versus false, it is what the company could show if
 * asked tomorrow.
 */
export type ClaimStatus =
  /** An artefact exists and has been checked. Nothing currently holds this. */
  | 'VERIFIED'
  /** The company states it; this repository holds no artefact behind it. */
  | 'SOURCE_EXISTS_NEEDS_REVIEW'
  /** Published at two different values. At least one was wrong in public. */
  | 'CONTRADICTED'
  /** A result stated as an estimate. `audit-claims` reports these. */
  | 'HEDGED'

/**
 * Where a claim may appear.
 *
 * `commercial` is a page whose job is to persuade: the homepage, What We Do,
 * a capability page, Work. A claim on one of those reads as a fact about
 * delivered work whatever words surround it, which is why status governs it.
 *
 * `archive` is a page that exists to record what was said: the case studies.
 * Removing history there would be worse than leaving it, and the page carries
 * its own framing. Historical material is preserved, per the governance rule
 * that decisions stay legible with their history.
 */
export type ClaimSurface = 'commercial' | 'archive'

export interface Claim {
  /** Stable id, referenced from the evidence inventory. */
  readonly id: string
  /** The figure or statement, in the shortest form that identifies it. */
  readonly claim: string
  /** Message keys that carry it, so a reader can find every instance. */
  readonly keys: readonly string[]
  readonly status: ClaimStatus
  /** Where the number came from, as far as the repository can establish. */
  readonly source: string
  /** Surfaces this claim is permitted on today. */
  readonly allowedOn: readonly ClaimSurface[]
  /** What would have to exist for the status to improve. */
  readonly toUpgrade: string
}

/**
 * The publication rule, stated once so no page has to decide for itself:
 *
 *   VERIFIED                   → commercial and archive
 *   SOURCE_EXISTS_NEEDS_REVIEW → archive only
 *   CONTRADICTED               → archive only, and never as a headline
 *   HEDGED                     → archive only
 *
 * Nothing is deleted. A claim that cannot appear on a commercial page keeps
 * its place in the case studies, where the page's own framing applies and
 * where the company's history stays readable.
 */
export const CLAIM_RULE: Record<ClaimStatus, readonly ClaimSurface[]> = {
  VERIFIED:                   ['commercial', 'archive'],
  SOURCE_EXISTS_NEEDS_REVIEW: ['archive'],
  CONTRADICTED:               ['archive'],
  HEDGED:                     ['archive'],
}

export const CLAIMS: readonly Claim[] = [
  {
    id: 'cs1-78-percent',
    claim: '78% reduction in manual processing time',
    keys: ['caseStudies.cs1Headline', 'caseStudies.cs1Result1'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source:
      'Entered in commit 1b4c73f, a workspace restructuring. No measurement ' +
      'artefact, client record or source document in this repository.',
    allowedOn: ['archive'],
    toUpgrade:
      'The measurement it came from: a report, a dashboard export, or a ' +
      'written statement from the client naming the figure and the period.',
  },
  {
    id: 'cs1-12-hours',
    claim: '12 staff hours saved per week',
    keys: ['caseStudies.cs1Result2'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source: 'Same commit, same absence.',
    allowedOn: ['archive'],
    toUpgrade: 'The measurement behind it, with its period.',
  },
  {
    id: 'cs1-error-rate',
    claim: 'Error rate dropped from 8% to under 0.5%',
    keys: ['caseStudies.cs1Result3'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source: 'Same commit, same absence.',
    allowedOn: ['archive'],
    toUpgrade: 'The before and after measurement, and how error was defined.',
  },
  {
    id: 'cs2-14000',
    claim: '£14,000/month saved in operational costs',
    keys: ['caseStudies.cs2Headline', 'caseStudies.cs2Result1'],
    status: 'CONTRADICTED',
    source:
      'Published as EUR 14k/month on the homepage and GBP 14,000/month on the ' +
      'case studies page at the same time (ADR-0007). The euro instance was ' +
      'deleted in f75fc50, so the audit is quiet now; the disagreement was ' +
      'resolved by deletion rather than by evidence. The two values differ by ' +
      'about seventeen per cent, so at least one was wrong in public.',
    allowedOn: ['archive'],
    toUpgrade:
      'Marcel confirming which currency and which value was correct, and the ' +
      'document it came from. Until then it is not a headline anywhere.',
  },
  {
    id: 'cs2-94-percent',
    claim: '94% of invoices processed without human intervention',
    keys: ['caseStudies.cs2Result3'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source:
      'Same commit, same absence. Already withdrawn from the homepage on ' +
      "Marcel's instruction, as automation language rather than as a claims " +
      'decision. The evidence position is separate and is recorded here.',
    allowedOn: ['archive'],
    toUpgrade: 'The measurement, and what counted as intervention.',
  },
  {
    id: 'cs3-3-days-4-hours',
    claim: 'Invoice cycle from 3 days to 4 hours',
    keys: ['caseStudies.cs3Headline', 'caseStudies.cs3Result1'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source: 'Same commit, same absence.',
    allowedOn: ['archive'],
    toUpgrade: 'The measurement of both the before and the after cycle.',
  },
  {
    id: 'cs3-91-percent',
    claim: 'Zero manual compilation for 91% of invoices',
    keys: ['caseStudies.cs3Result3'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source: 'Same commit, same absence.',
    allowedOn: ['archive'],
    toUpgrade: 'The measurement, over a stated number of invoices.',
  },
  {
    id: 'cs3-cash-flow',
    claim: 'Cash flow improved by approximately 18 days per quarter',
    keys: ['caseStudies.cs3Result2'],
    status: 'HEDGED',
    source: 'Reported by audit-claims: a result stated as an estimate.',
    allowedOn: ['archive'],
    toUpgrade: 'A figure without the hedge, and the measurement behind it.',
  },
  {
    id: 'cs3-satisfaction',
    claim: 'Client satisfaction scores increased significantly',
    keys: ['caseStudies.cs3Result4'],
    status: 'HEDGED',
    source: 'Reported by audit-claims: a result stated as an estimate.',
    allowedOn: ['archive'],
    toUpgrade: 'The scores, before and after, and who measured them.',
  },
]

/** Claims that may not appear on a page whose job is to persuade. */
export const COMMERCIAL_FORBIDDEN: readonly Claim[] =
  CLAIMS.filter((c) => !CLAIM_RULE[c.status].includes('commercial'))
