/**
 * lib/work-entries.ts
 *
 * What the Work page is allowed to show, and what evidence exists for it.
 *
 * WHY THIS IS A REGISTRY AND NOT A LAYOUT
 * The Work page is the proof surface the capability pages and, later, the
 * guides point at (ADR-0016). Its entries will accumulate unevenly: one
 * project has an approved screenshot and no figures, the next has figures and
 * nothing that can be shown. If the page is written as a layout, every new
 * entry has to be either padded to fit or the layout has to change. So the
 * page renders what each entry declares it has, and an entry declares nothing
 * it cannot support.
 *
 * TRUTH OVER SYMMETRY. An entry with two pieces of evidence renders two.
 *
 * THE CLAIMS POSITION
 *
 * Status lives in `packages/config/claims.ts` and is enforced by
 * `check:claims`. This file does not decide it and must not restate it, because
 * two places recording the same status is how they come to disagree.
 *
 * What that registry currently says, and why this page shows no figures: every
 * number these two case studies carry is SOURCE_EXISTS_NEEDS_REVIEW. They
 * entered the repository in a workspace restructuring commit with no
 * measurement artefact, no client record and no source document behind them
 * (docs/research/evidence-inventory-2026.md). None of that makes them false.
 * It makes them unevidenced, and the rule is that an unevidenced figure belongs
 * on the case studies, where the page records what was said, and not on a page
 * whose job is to persuade.
 *
 * So each entry leads with the change to the work instead. That is a claim
 * about what was built, the same case study describes it, and it needs no
 * measurement to stand behind.
 *
 * An earlier version of this comment said the £14,000 figure was "stated
 * identically in both locales, so there is no contradiction to fix". That was
 * wrong. ADR-0007 records it published as euros on the homepage and pounds on
 * the case studies at the same time; the euro instance was later deleted, which
 * is why the audit is quiet. The registry classifies it CONTRADICTED.
 */

export type EvidenceKind =
  | 'result'        // a measured figure with a named source and timeframe.
                    // Nothing carries this today; it exists so an entry can
                    // declare one the day a figure becomes VERIFIED.
  | 'before-after'  // how the work ran, and how it runs now
  | 'workflow'      // the system, drawn
  | 'screenshot'    // a real capture, once a client has approved it
  | 'human'         // where a person stays in the loop
  | 'case-study'    // the long version
  | 'private-demo'  // can be shown running, on request

export interface WorkEntry {
  readonly id: string
  /** Message key prefix under the `caseStudies` namespace. */
  readonly cs: string
  /** Sector and duration, both already governed in that namespace. */
  readonly tagKey: string
  readonly timelineKey: string
  /**
   * What this entry leads with: the change to the work, not a measurement.
   *
   * It used to be `headlineKey`, pointing at a figure in the case studies.
   * The evidence inventory established that none of those figures has an
   * artefact behind it in this repository, and `packages/config/claims.ts`
   * now records that and forbids them on a page whose job is to persuade.
   *
   * The replacement is not a weaker number. It is a statement about what was
   * built, which the same case study describes and which the company can
   * stand behind without producing a measurement.
   */
  readonly headlineKey: string
  /** Before, then after. Three and three in the existing catalogue. */
  readonly beforeKeys: readonly string[]
  readonly afterKeys: readonly string[]
  /** What this entry can actually show. Drives what renders. */
  readonly evidence: readonly EvidenceKind[]
  /** Capability this belongs to, for the link back. */
  readonly capability: string
}

export const WORK_ENTRIES: readonly WorkEntry[] = [
  {
    id: 'operations-document-pipeline',
    cs: 'cs1',
    tagKey: 'cs1Tag',
    timelineKey: 'cs1Timeline',
    /* The figure this entry used to lead with, 78%, is
       SOURCE_EXISTS_NEEDS_REVIEW in the claims registry and is not published
       here. The system change is. */
    headlineKey: 'w1Headline',
    beforeKeys: ['cs1b1', 'cs1b2', 'cs1b3'],
    afterKeys: ['cs1s1', 'cs1s2', 'cs1s3'],
    evidence: ['before-after', 'workflow', 'case-study', 'private-demo'],
    capability: 'workflow-automation',
  },
  {
    id: 'logistics-invoice-cycle',
    cs: 'cs3',
    tagKey: 'cs3Tag',
    timelineKey: 'cs3Timeline',
    /* Same position: the 3-days-to-4-hours figure is not published here. */
    headlineKey: 'w2Headline',
    beforeKeys: ['cs3b1', 'cs3b2', 'cs3b3'],
    afterKeys: ['cs3s1', 'cs3s2', 'cs3s3'],
    evidence: ['before-after', 'workflow', 'case-study', 'private-demo'],
    capability: 'workflow-automation',
  },
]

/** Where a given entry's capability page lives. */
export const CAPABILITY_HREF: Record<string, string> = {
  'workflow-automation': '/solutions/workflow-automation',
  'custom-applications': '/solutions/custom-applications',
}
