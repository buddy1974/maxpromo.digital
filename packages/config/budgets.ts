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
  {
    id: 'web.total-css',
    scope: 'web',
    what: 'total CSS emitted by the build',
    unit: 'KB',
    measured: 50,
    limit: 80,
    why:
      'One stylesheet, because the design system is one system. A second file ' +
      'appearing here, or this number stepping up, is the signal that a ' +
      'component has started shipping styles of its own.',
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
