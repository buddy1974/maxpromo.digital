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
 * THE PUBLICATION RULE
 *
 *   An unsupported quantitative claim may not be used to persuade.
 *
 * That is the whole rule, and it is deliberately broader than the distinction
 * it replaced. The first version of this registry separated a "result" from a
 * "before state", on the reasoning that a number describing the problem a
 * client arrived with is not a claim about delivered work. ADR-0007 makes that
 * distinction and it is a reasonable one.
 *
 * Marcel's decision, 2026-09-20: it is not the rule this company runs. A figure
 * with no evidence behind it does the same persuading whichever end of the
 * story it sits at. "Over 60% of staff time went on manual data entry" is doing
 * work on the page, and the repository cannot support it any better than it can
 * support the 78% that followed it.
 *
 * So the rule applies to a quantity regardless of what it describes:
 *
 *   before state · after state · result · saving · time · percentage ·
 *   volume · performance · improvement · duration
 *
 * By status:
 *
 *   VERIFIED                   → commercial and archive
 *   SOURCE_EXISTS_NEEDS_REVIEW → archive only
 *   CONTRADICTED               → archive only, and never as a headline
 *   HEDGED                     → archive only
 *
 * Nothing is deleted. A claim that cannot appear on a commercial page keeps
 * its place in the case studies, where the page records what was said and
 * where the company's history stays readable.
 *
 * WHAT IS NOT A QUANTITATIVE CLAIM
 *
 * A counting word doing grammatical work: "into one pipeline", "a second
 * system". The test is whether removing the number changes what the sentence
 * asserts about an outcome. "One pipeline" survives the test; "three working
 * days" does not.
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
    id: 'cs1-60-percent-before',
    claim: 'Over 60% of staff time went on manual data entry',
    keys: ['caseStudies.cs1b1'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source:
      'Same commit, same absence. Describes the state the client arrived in ' +
      'rather than the outcome, which ADR-0007 treats as a softer case. The ' +
      'publication rule above deliberately does not.',
    allowedOn: ['archive'],
    toUpgrade: 'How the 60% was arrived at, and over what period.',
  },
  {
    id: 'cs3-3-days-before',
    claim: 'Three full working days per billing cycle',
    keys: ['caseStudies.cs3b2'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source:
      'Same commit, same absence. This is the "before" half of the 3-days-to-' +
      '4-hours claim, so publishing it while withholding the other half would ' +
      'state the same unevidenced measurement with one end hidden.',
    allowedOn: ['archive'],
    toUpgrade: 'The measurement of the original cycle.',
  },
  {
    id: 'cs1-timeline',
    claim: 'Delivered in 6 weeks',
    keys: ['caseStudies.cs1Timeline'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source:
      'Same commit, same absence. A duration is a quantity and the rule names ' +
      'time explicitly. It describes how long Maxpromo took rather than what ' +
      'the client measured, which makes it the easiest of these to evidence ' +
      'and does not exempt it in the meantime.',
    allowedOn: ['archive'],
    toUpgrade: 'A project record showing the start and the go-live date.',
  },
  {
    id: 'cs3-timeline',
    claim: 'Delivered in 8 weeks',
    keys: ['caseStudies.cs3Timeline'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source: 'Same commit, same absence. Same reasoning as cs1-timeline.',
    allowedOn: ['archive'],
    toUpgrade: 'A project record showing the start and the go-live date.',
  },
  {
    id: 'home-durations',
    claim: 'Project durations shown beside the homepage evidence items',
    keys: ['home.evidence.p1Source', 'home.evidence.p3Source'],
    status: 'SOURCE_EXISTS_NEEDS_REVIEW',
    source:
      'Written during Phase A as "Operations · 6 weeks" and "Logistics · 8 ' +
      'weeks". The sector is not a claim; the duration is the same unevidenced ' +
      'figure as cs1-timeline and cs3-timeline, restated in different words.',
    allowedOn: ['archive'],
    toUpgrade: 'The same project records.',
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
