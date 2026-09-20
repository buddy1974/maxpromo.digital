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
 * THE CLAIMS POSITION, AUDITED 2026-09-20
 *
 * Every figure below is classified before it is shown:
 *
 *   VERIFIED     the figure the homepage already publishes for this project,
 *                with its source and timeframe named. Marcel approved the
 *                conservative direction; these are those numbers.
 *   SOURCE EXISTS the case study carries it, but something about the claim
 *                needs a person's decision before it goes on a commercial
 *                page. Kept in `/case-studies`, not promoted here.
 *   HEDGED       "approximately", "significantly". Reported by
 *                `npm run audit:claims`. Never shown as a headline result.
 *
 * What is deliberately absent:
 *
 *   cs2 as a headline entry. Its £14,000/month figure is stated identically in
 *   both locales, so there is no contradiction to fix, but a German-language
 *   case study quoting pounds to a German buyer is a presentation question
 *   Marcel has to answer rather than one to answer by editing. It also
 *   contains the "94% of invoices" line that was removed from the homepage on
 *   his instruction, and a grid is not a reason to bring it back.
 *
 *   cs3Result2 ("approximately 18 days") and cs3Result4 ("increased
 *   significantly"). Both hedged, both reported by the claims audit, neither
 *   used. The project's headline figure is not hedged and is used.
 */

export type EvidenceKind =
  | 'result'        // a measured figure with a named source and timeframe
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
  /** The one figure this entry leads with. VERIFIED only. */
  readonly headlineKey: string
  /** Supporting results. Each checked individually; hedged ones excluded. */
  readonly resultKeys: readonly string[]
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
    /* VERIFIED. 78%, the homepage's first figure, Operations, 6 weeks. */
    headlineKey: 'cs1Result1',
    /* cs1Result2 and cs1Result3 are specific and unhedged. cs1Result4 is
       qualitative and reads as a feature, so it is left in the case study. */
    resultKeys: ['cs1Result2', 'cs1Result3'],
    beforeKeys: ['cs1b1', 'cs1b2', 'cs1b3'],
    afterKeys: ['cs1s1', 'cs1s2', 'cs1s3'],
    evidence: ['result', 'before-after', 'workflow', 'case-study', 'private-demo'],
    capability: 'workflow-automation',
  },
  {
    id: 'logistics-invoice-cycle',
    cs: 'cs3',
    tagKey: 'cs3Tag',
    timelineKey: 'cs3Timeline',
    /* VERIFIED. 3 days to 4 hours, the homepage's second figure, Logistics,
       8 weeks. */
    headlineKey: 'cs3Result1',
    /* Only cs3Result3 survives. cs3Result2 and cs3Result4 are the two hedged
       claims the audit reports, and they stay out of a commercial page. */
    resultKeys: ['cs3Result3'],
    beforeKeys: ['cs3b1', 'cs3b2', 'cs3b3'],
    afterKeys: ['cs3s1', 'cs3s2', 'cs3s3'],
    evidence: ['result', 'before-after', 'workflow', 'case-study', 'private-demo'],
    capability: 'workflow-automation',
  },
]

/** Where a given entry's capability page lives. */
export const CAPABILITY_HREF: Record<string, string> = {
  'workflow-automation': '/solutions/workflow-automation',
  'custom-applications': '/solutions/custom-applications',
}
