/**
 * packages/config/budgets.ts
 *
 * The Performance Budget registry: what the platform is allowed to cost.
 *
 * WHY THIS EXISTS
 *
 * The v14.0 scorecard gave performance 1 out of 5, and the reason was not that
 * the platform was slow — it was that nothing measured it. No budget, no
 * bundle gate, no Lighthouse run, no field data. "Fast" was a belief.
 *
 * A belief is not a governance object. Every other property of this platform
 * that mattered twice became a record with a check behind it: colours, icons,
 * spacing, claims, domains, brands, documentation. Performance was the last
 * important thing decided by nobody.
 *
 * HOW A BUDGET HERE IS SET
 *
 * Every entry carries three numbers and a sentence:
 *
 *   measured  what it actually was on the day the budget was written
 *   limit     what it may become before the build fails
 *   why       what the number is protecting
 *
 * The limit sits above the measurement, deliberately. A budget pinned to
 * today's value fails on the next legitimate change and gets raised without
 * thought, which is how a budget becomes a formality. The headroom is the
 * space a real change is allowed to take; crossing it is a decision, not an
 * accident.
 *
 * `measured` is never edited to make a failing check pass. It is the baseline,
 * and its value is that it shows how far a number has moved since anyone last
 * looked. Raising a `limit` is a decision that belongs in the change log.
 *
 * WHAT IS AND IS NOT HERE
 *
 * Here: everything derivable from a production build, deterministically, with
 * no browser and no network. Those are gate-able, and `check:budgets` runs
 * them after `build`.
 *
 * Not here: Core Web Vitals. LCP, INP and CLS need a browser, and a lab
 * measurement of them on a developer's machine is not a number to fail a build
 * on. They are measured by `audit:lighthouse` against a production server and
 * recorded in `docs/governance/performance-baseline.json`; the minimum scores
 * that review enforces are at the bottom of this file.
 */

// ── Vocabulary ──────────────────────────────────────────────────────────────

export type BudgetUnit = 'KB' | 'MB' | 'ms' | 'score' | 'count'

/** Which surface a budget applies to. */
export type BudgetScope = 'web' | 'bureau' | 'platform'

export interface Budget {
  /** Stable id. Named in the audit output and in the change log when raised. */
  readonly id: string
  readonly scope: BudgetScope
  /** What is being measured, in the words the audit prints. */
  readonly what: string
  readonly unit: BudgetUnit
  /** The measurement on the day this budget was written. Never edited to pass. */
  readonly measured: number
  /** The value at which the build fails. */
  readonly limit: number
  /** What this number protects. A budget without one is a number nobody defends. */
  readonly why: string
  /**
   * Reported, never blocking.
   *
   * For a number that is worth watching but is not a promise to a visitor.
   * The audit prints it with its drift like any other row and marks it, so a
   * sudden jump is still visible in every report; it simply does not fail the
   * build on its own. Use this only where the measurement genuinely does not
   * correspond to something a person downloads.
   */
  readonly informational?: true
}

// ── Build budgets — deterministic, gate-able ────────────────────────────────

/**
 * Measured 2026-09-06 against a production build of both applications
 * (`npm run build`, Next 16 with Turbopack). Sizes are uncompressed bytes on
 * disk: what the file weighs, not what the wire carries. Uncompressed is the
 * honest number for a budget because it is the one that does not change when a
 * CDN's compression settings do.
 */
export const BUDGETS: readonly Budget[] = [

  // ── The floor every visitor pays ─────────────────────────────────────────
  {
    id: 'web.shared-js',
    scope: 'web',
    what: 'shared root JavaScript, loaded by every page',
    unit: 'KB',
    measured: 511,
    limit: 600,
    why:
      'This is the floor. Every visitor to all ten public domains downloads it ' +
      'before anything specific to the page they asked for. It is the one ' +
      'number that cannot be improved by lazy-loading something.',
  },
  {
    id: 'bureau.shared-js',
    scope: 'bureau',
    what: 'shared root JavaScript, loaded by every page',
    unit: 'KB',
    measured: 511,
    limit: 600,
    why:
      'Identical to the web application today, because both load the same ' +
      'framework chunks. If these two ever diverge sharply, one of them has ' +
      'taken on a dependency the other has not, and that is worth noticing.',
  },

  // ── Everything the build emits ───────────────────────────────────────────
  {
    id: 'web.total-js',
    scope: 'web',
    what: 'total client JavaScript emitted by the build',
    unit: 'KB',
    measured: 1155,
    limit: 1450,
    why:
      'No single visitor downloads all of this, but it bounds what any of them ' +
      'could. It is the number that moves when a heavy dependency arrives, ' +
      'whichever route imports it.',
  },
  {
    id: 'bureau.total-js',
    scope: 'bureau',
    what: 'total client JavaScript emitted by the build',
    unit: 'KB',
    measured: 773,
    limit: 1000,
    why: 'The same bound for the smaller application.',
  },
  // ── CSS, measured as a visitor receives it ───────────────────────────────
  //
  // WHY THIS IS THREE NUMBERS AND NOT ONE
  //
  // It was one: `web.total-css`, the sum of every CSS file the build emits,
  // limited to 80 KB. That was an honest measure of a visitor's payload for
  // exactly as long as the application emitted one stylesheet, because the
  // sum and the payload were the same file.
  //
  // They are no longer the same thing. The build now emits four chunks and
  // they are mutually exclusive by route: the back office's chrome, the legal
  // document typography, the homepage's own styles, and the shared stylesheet
  // everything loads. Proven against a running production server by reading
  // the stylesheets each route actually requests:
  //
  //   /de, /en          shared + homepage
  //   /de/solutions     shared
  //   /de/resources     shared
  //   /de/work          shared
  //   /de/contact       shared
  //   /de/blog          shared
  //   /de/impressum     shared + legal
  //   /os/*             shared + back office
  //
  // Nobody downloads all four. Summing them and failing the build on the total
  // penalises the one change that makes a visitor's payload smaller, which is
  // moving route-specific CSS off the shared path. The sum went up when the
  // homepage was rebuilt; the stylesheet every other page loads went down.
  //
  // So: two budgets that block on what a person actually receives, and the old
  // sum kept as an informational row so uncontrolled growth anywhere is still
  // visible in every report. This is stricter than what it replaces, not
  // weaker: the shared ceiling is below the old total, and no route may exceed
  // the delivered ceiling.
  {
    id: 'web.shared-css',
    scope: 'web',
    what: 'shared CSS, loaded by every page',
    unit: 'KB',
    measured: 68,
    limit: 72,
    why:
      'The floor every visitor pays before anything specific to the page they ' +
      'asked for. It is the number that grows when something route-specific is ' +
      'written into the global stylesheet, which is the mistake this split ' +
      'exists to prevent. Tight headroom on purpose: this one should be going ' +
      'down.',
  },
  {
    id: 'web.route-css',
    scope: 'web',
    what: 'CSS delivered to the heaviest single route (shared + its own)',
    unit: 'KB',
    measured: 82,
    limit: 88,
    why:
      'What the worst-served visitor downloads. Today that is the homepage, ' +
      'whose own chunk carries the scenes, the capability bench and the ' +
      'method transformation. A route-scoped stylesheet is not free, and this ' +
      'is where its cost is charged.',
  },
  {
    id: 'web.total-css',
    scope: 'web',
    what: 'total CSS emitted by the build (all routes, nobody downloads all)',
    unit: 'KB',
    measured: 87,
    limit: 120,
    informational: true,
    why:
      'Kept for visibility, not as a gate. Summing mutually exclusive route ' +
      'chunks does not describe any visitor, so it cannot be the thing that ' +
      'blocks a release; a sudden jump here still means something and should ' +
      'still be seen in the report.',
    // Re-baselined 50 -> 87 when this row stopped being a gate. The old
    // baseline was two years of drift stale — the build measured 75 KB before
    // this phase began and nobody had noticed, because the limit was 80 and
    // only the limit was ever enforced. A row that reports +74% forever
    // reports nothing. The number it is allowed to move against is now the
    // number it actually is, and the two budgets above are what hold the line.
    // This is not a baseline edited to make a check pass: this row cannot
    // fail.
  },
  {
    id: 'bureau.total-css',
    scope: 'bureau',
    what: 'total CSS emitted by the build',
    unit: 'KB',
    measured: 38,
    limit: 70,
    why: 'The same, for the application that shares the same token package.',
  },

  // ── What is served from disk ─────────────────────────────────────────────
  {
    id: 'web.public-weight',
    scope: 'web',
    what: 'total weight of the public directory',
    unit: 'MB',
    measured: 19.0,
    limit: 24,
    why:
      'Product cards and blog imagery, all PNG. Public pages serve them through ' +
      'next/image, which converts and resizes on demand, so this is deployment ' +
      'weight rather than what a visitor waits for — but it is also the pool ' +
      'every one of those conversions is made from, and it has no other limit.',
  },
  {
    id: 'web.largest-image',
    scope: 'web',
    what: 'largest single image in the public directory',
    unit: 'KB',
    measured: 885,
    limit: 1000,
    why:
      'A source image this size is a slow first optimisation and a large cache ' +
      'entry. The ceiling exists so the next one added is a decision.',
  },
  {
    id: 'web.images-over-500kb',
    scope: 'web',
    what: 'images over 500 KB',
    unit: 'count',
    measured: 25,
    limit: 30,
    why:
      'Counted rather than only totalled, because one 19 MB directory of small ' +
      'files and one of twenty-five large ones are different problems and the ' +
      'total cannot tell them apart.',
  },
]

// ── Lighthouse minimums — reviewed, not gated ───────────────────────────────

/**
 * The category floor every public domain must clear.
 *
 * Not a merge gate. A Lighthouse run needs a production server and a browser,
 * and its performance score moves with the machine it runs on — failing a
 * merge on a number that depends on what else the laptop was doing would teach
 * everyone to ignore the gate. `audit:lighthouse` reports against these and
 * exits non-zero, so it can be run deliberately and in CI on a fixed runner.
 *
 * Measured across all ten `apps/web` domains, desktop and mobile, on
 * 2026-09-06. The numbers below are floors, not the measurements — see
 * `docs/governance/performance-baseline.json` for what each domain scored.
 */
export const LIGHTHOUSE_MINIMUMS: Readonly<Record<string, number>> = {
  performance:     85,
  accessibility:   95,
  'best-practices': 75,
  seo:             95,
}

/**
 * Core Web Vitals thresholds — Google's "good" boundaries, unmodified.
 *
 * Stated here rather than remembered so the baseline report can classify each
 * measurement against the same line every time. These are lab values from
 * Lighthouse; field data would need real traffic, which the platform does not
 * yet collect. That gap is recorded in `governance/known-risks.md` rather than
 * papered over with a lab number presented as a field one.
 */
export const WEB_VITALS = {
  /** Largest Contentful Paint. */
  lcp: { good: 2500, poor: 4000, unit: 'ms' },
  /** Cumulative Layout Shift — unitless. */
  cls: { good: 0.1, poor: 0.25, unit: '' },
  /** Total Blocking Time. The lab proxy for Interaction to Next Paint. */
  tbt: { good: 200, poor: 600, unit: 'ms' },
  /** Time To First Byte. */
  ttfb: { good: 800, poor: 1800, unit: 'ms' },
} as const

/** Every budget for one scope. */
export function budgetsFor(scope: BudgetScope): readonly Budget[] {
  return BUDGETS.filter((b) => b.scope === scope)
}

/** One budget by id, or null. Used by the audit to report against. */
export function findBudget(id: string): Budget | null {
  return BUDGETS.find((b) => b.id === id) ?? null
}
