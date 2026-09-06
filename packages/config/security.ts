/**
 * packages/config/security.ts
 *
 * Advisories the platform has looked at and decided to carry, for now.
 *
 * WHY THIS EXISTS
 *
 * `audit:dependencies` blocks a release on a HIGH or CRITICAL advisory that
 * reaches production. That rule is only useful if there is an honest way to say
 * "we have looked at this one and it cannot be fixed yet" — otherwise the first
 * unfixable advisory turns the gate into something people route around, and a
 * gate people route around is worse than no gate.
 *
 * So an acceptance is a record, not a silence. Each one names the advisory, the
 * actual exposure rather than the theoretical one, what is being done instead,
 * who owns it, and the date by which it must be looked at again.
 *
 * WHAT AN ACCEPTANCE IS NOT
 *
 * It is not a way to make a number go down. An accepted advisory is still
 * printed on every run, still counted, and still appears in the release report.
 * It is excluded from *blocking*, and from nothing else.
 *
 * An entry whose `reviewBy` has passed stops excusing anything: the audit
 * reports it as expired and the advisory blocks again. An acceptance that never
 * expires is a decision nobody revisits.
 */

export type Severity = 'critical' | 'high' | 'moderate' | 'low'

export interface AcceptedRisk {
  /** The npm package the advisory is against. */
  readonly package: string
  /** GHSA identifier, so the record can be matched to the advisory itself. */
  readonly advisory: string
  readonly severity: Severity
  /**
   * Where this actually sits: `production` if it can reach a served request,
   * `development` if it only exists on a developer's machine or in CI.
   */
  readonly reach: 'production' | 'development'
  /** What an attacker would actually have to do. Not the advisory's abstract. */
  readonly exposure: string
  /** What is done instead of upgrading. */
  readonly mitigation: string
  /** What would resolve it, and why that is not available today. */
  readonly upgradePath: string
  readonly owner: string
  /** ISO date. After this, the acceptance expires and the advisory blocks. */
  readonly reviewBy: string
}

/**
 * The four advisories carried after v15.1.
 *
 * All four are one chain: `drizzle-kit` → `@esbuild-kit/*` → `esbuild@0.18.20`.
 * They are listed separately because `npm audit` reports them separately and a
 * record that does not match what the tool prints is a record nobody will find.
 */
export const ACCEPTED_RISKS: readonly AcceptedRisk[] = [
  {
    package: 'esbuild',
    advisory: 'GHSA-67mh-4wv8-2f99',
    severity: 'moderate',
    reach: 'development',
    exposure:
      'The flaw is that esbuild\'s development server answers cross-origin requests, so any website a developer visits could read what that server returns. ' +
      'drizzle-kit never starts an esbuild dev server — it uses esbuild only to transpile drizzle.config.ts on invocation. ' +
      'Reaching this would require a developer to be running `esbuild --serve` independently, which nothing in this repository does.',
    mitigation:
      'drizzle-kit is a devDependency and is invoked to generate migrations; it is not part of any build output and never runs on a server. ' +
      'The root esbuild is 0.25.12, outside the affected range; only the copy nested under @esbuild-kit/core-utils is 0.18.20.',
    upgradePath:
      'None available. drizzle-kit@0.31.10 is the latest published version and still depends on @esbuild-kit/esm-loader, which is deprecated and pins the old esbuild. ' +
      'npm suggests drizzle-kit@0.18.1, which is a downgrade three minor versions below the one this schema needs. Resolves when drizzle-kit drops @esbuild-kit.',
    owner: 'Marcel',
    reviewBy: '2026-12-06',
  },
  {
    package: '@esbuild-kit/core-utils',
    advisory: 'GHSA-67mh-4wv8-2f99',
    severity: 'moderate',
    reach: 'development',
    exposure: 'Carrier for the esbuild advisory above. Deprecated package, reached only through drizzle-kit.',
    mitigation: 'Development-only, same as its dependent.',
    upgradePath: 'None. The package is deprecated and drizzle-kit has not yet dropped it.',
    owner: 'Marcel',
    reviewBy: '2026-12-06',
  },
  {
    package: '@esbuild-kit/esm-loader',
    advisory: 'GHSA-67mh-4wv8-2f99',
    severity: 'moderate',
    reach: 'development',
    exposure: 'Carrier for the esbuild advisory above. Deprecated package, reached only through drizzle-kit.',
    mitigation: 'Development-only, same as its dependent.',
    upgradePath: 'None. The package is deprecated and drizzle-kit has not yet dropped it.',
    owner: 'Marcel',
    reviewBy: '2026-12-06',
  },
  {
    package: 'drizzle-kit',
    advisory: 'GHSA-67mh-4wv8-2f99',
    severity: 'moderate',
    reach: 'development',
    exposure:
      'Flagged because of the chain above, not for anything in drizzle-kit itself. It is a migration CLI, run by hand, never on a server.',
    mitigation:
      'Already upgraded to 0.31.10, the latest published version. `drizzle-kit check` validates the existing migration journal cleanly at this version.',
    upgradePath: 'None beyond 0.31.10 until drizzle-kit drops @esbuild-kit.',
    owner: 'Marcel',
    reviewBy: '2026-12-06',
  },
]

/** The acceptance covering this package, if one is live on `today`. */
export function acceptanceFor(pkg: string, today = new Date()): AcceptedRisk | null {
  const entry = ACCEPTED_RISKS.find((r) => r.package === pkg)
  if (!entry) return null
  return new Date(entry.reviewBy) >= today ? entry : null
}

/** Acceptances whose review date has passed. These stop excusing anything. */
export function expiredAcceptances(today = new Date()): readonly AcceptedRisk[] {
  return ACCEPTED_RISKS.filter((r) => new Date(r.reviewBy) < today)
}

/**
 * Does this advisory block a release?
 *
 * Pure, and exported, so the decision can be tested against a truth table
 * rather than inferred from whatever `npm audit` happens to report today. The
 * audit calls this; `prove:security` exercises every branch of it.
 *
 *   critical + production   always blocks. An acceptance cannot excuse it.
 *   high     + production   blocks unless a live acceptance names it.
 *   anything else           reported, never blocking.
 */
export function blocksRelease(input: {
  readonly severity: Severity
  readonly reach: 'production' | 'development'
  readonly accepted: boolean
}): boolean {
  if (input.reach !== 'production') return false
  if (input.severity === 'critical') return true
  if (input.severity === 'high') return !input.accepted
  return false
}
