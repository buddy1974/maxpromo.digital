#!/usr/bin/env node
/**
 * packages/tooling/prove-security-gate.mjs
 *
 * The ADR-0004 harness for the dependency security gate.
 *
 *   npm run prove:security
 *
 * A gate that has only ever been seen passing is not known to block. This one
 * decides whether a release ships, so "it looked right" is not enough — and the
 * gate has been green since the moment it was written, because the four
 * advisories the platform actually carries are all development-only.
 *
 * Two things are exercised:
 *
 *   1. The decision, against a full truth table. `blocksRelease` is a pure
 *      function in packages/config/security.ts for exactly this reason.
 *   2. Expiry, by asking the register what it says on a date after a review
 *      date has passed — without editing the register to find out.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const securityPath = join(ROOT, 'packages', 'config', 'security.ts')
if (!existsSync(securityPath)) {
  console.error('prove:security: no risk register at packages/config/security.ts')
  process.exit(1)
}
const { blocksRelease, acceptanceFor, expiredAcceptances, ACCEPTED_RISKS } =
  await import(pathToFileURL(securityPath).href)

const cases = [
  // severity     reach          accepted  expected  why
  ['critical', 'production',  false, true,  'a critical advisory on a production dependency blocks'],
  ['critical', 'production',  true,  true,  'and an acceptance cannot excuse a critical one'],
  ['critical', 'development', false, false, 'a critical advisory that cannot reach a request does not block a release'],
  ['high',     'production',  false, true,  'an unaccepted high on a production dependency blocks'],
  ['high',     'production',  true,  false, 'an accepted one is reported rather than blocking'],
  ['high',     'development', false, false, 'a development-only high does not block'],
  ['moderate', 'production',  false, false, 'moderate is reported, never blocking'],
  ['low',      'production',  false, false, 'low is reported, never blocking'],
]

let failed = 0
console.log('='.repeat(74))
console.log('SECURITY GATE — decision table')
for (const [severity, reach, accepted, expected, why] of cases) {
  const got = blocksRelease({ severity, reach, accepted })
  const ok = got === expected
  if (!ok) failed++
  console.log(
    `${ok ? '  ' : '!!'} ${severity.padEnd(9)} ${reach.padEnd(12)} ${accepted ? 'accepted  ' : 'unaccepted'} ` +
    `→ ${String(got).padEnd(5)} ${ok ? '' : `EXPECTED ${expected}  `}${why}`,
  )
}

// A truth table where every row expects the same answer proves nothing.
const expectations = new Set(cases.map((c) => c[3]))
if (expectations.size < 2) {
  console.error('\nevery case expects the same answer — this table does not discriminate.')
  process.exit(1)
}

// ── Expiry ──────────────────────────────────────────────────────────────────
console.log('\nEXPIRY — asked of the real register, without editing it')
if (ACCEPTED_RISKS.length === 0) {
  console.error('  the register is empty; there is nothing to prove expiry against.')
  process.exit(1)
}
const sample = ACCEPTED_RISKS[0]
const dayBefore = new Date(new Date(sample.reviewBy).getTime() - 86400000)
const dayAfter = new Date(new Date(sample.reviewBy).getTime() + 86400000)

const liveBefore = acceptanceFor(sample.package, dayBefore) !== null
const liveAfter = acceptanceFor(sample.package, dayAfter) !== null
const expiredAfter = expiredAcceptances(dayAfter).some((r) => r.package === sample.package)

const checks = [
  [`${sample.package} is accepted the day before ${sample.reviewBy}`, liveBefore, true],
  [`${sample.package} is no longer accepted the day after`, liveAfter, false],
  [`${sample.package} is reported as expired the day after`, expiredAfter, true],
]
for (const [what, got, expected] of checks) {
  const ok = got === expected
  if (!ok) failed++
  console.log(`${ok ? '  ' : '!!'} ${what.padEnd(58)} ${got}${ok ? '' : `  EXPECTED ${expected}`}`)
}

console.log(`\n${cases.length + checks.length - failed}/${cases.length + checks.length} demonstrated.`)
if (failed > 0) {
  console.log('The gate does not behave as documented. Fix it before trusting a green run.')
  process.exitCode = 1
}
