#!/usr/bin/env node
/**
 * packages/tooling/prove-health-semantics.mjs
 *
 * A health check may not report a dependency working on the strength of an
 * environment variable existing.
 *
 * WHY THIS EXISTS
 *
 * `/api/health` reported the AI provider `ok`, with the note
 * "configured; not called", while every actual call to that provider returned
 * `401 invalid x-api-key`. The note was honest; the state was not. A browser QA
 * pass found it, and it had been true in three places across both applications
 * — the web provider probe, the web mail probe, and Agent Bureau's provider
 * probe — because the pattern was copied rather than shared.
 *
 * The rule is not "health must validate everything". `health.ts` forbids a
 * check that costs money, and a health endpoint that spends per probe is one
 * nobody can afford to poll. The rule is that a state may not claim more than
 * the check established, which is what `unvalidated` is for.
 *
 * WHAT THIS PROVES
 *
 *   1. `unvalidated` exists in the shared contract, so the honest option is
 *      actually available to a probe author.
 *   2. It does not affect the overall report state, because a surface is not
 *      degraded by a dependency nobody contacted — and if it were, every
 *      correctly configured deployment would sit at `degraded` forever.
 *   3. `unvalidated` is served with 200, not 503.
 *   4. No probe in either application returns `ok` from a branch whose only
 *      evidence is that configuration is present. Checked against the class,
 *      not a list of files, so the next copy of the pattern is caught too.
 *
 * Its own ability to fail was demonstrated by reverting each correction in turn.
 *
 *   node packages/tooling/prove-health-semantics.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()
const code = (rel) => stripComments(readFileSync(join(ROOT, rel), 'utf8'))

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

console.log('='.repeat(74))
console.log('HEALTH SEMANTICS')
console.log('')
console.log('The contract offers an honest state for an uncontacted dependency')

const contractPath = join(ROOT, 'packages', 'observability', 'health.ts')
if (!existsSync(contractPath)) {
  console.error('health semantics: no contract at packages/observability/health.ts')
  process.exit(1)
}
const { runHealth, healthStatus } = await import(pathToFileURL(contractPath).href)
const contractSrc = code('packages/observability/health.ts')

check(
  "'unvalidated' is part of HealthState",
  /export type HealthState\s*=[^\n]*'unvalidated'/.test(contractSrc),
)

console.log('')
console.log("'unvalidated' is honest without being alarming")

const report = await runHealth('test', [
  { name: 'contacted', critical: true, timeoutMs: 500, probe: async () => ({ state: 'ok' }) },
  { name: 'uncontacted', critical: false, timeoutMs: 500, probe: async () => ({ state: 'unvalidated' }) },
])
check('an unvalidated check leaves the overall report ok', report.state === 'ok', `overall: ${report.state}`)
check('it is served with 200, not 503', healthStatus(report) === 200, `status: ${healthStatus(report)}`)

/* A genuinely degraded dependency must still be reported, or this change would
   have bought honesty by going blind. */
const degraded = await runHealth('test', [
  { name: 'slow', critical: false, timeoutMs: 500, probe: async () => ({ state: 'degraded' }) },
])
check('a degraded check still degrades the report', degraded.state === 'degraded')
const down = await runHealth('test', [
  { name: 'gone', critical: true, timeoutMs: 500, probe: async () => ({ state: 'down' }) },
])
check('a critical down check still returns 503', healthStatus(down) === 503)

console.log('')
console.log('No probe reports ok on the strength of configuration alone')

/* Find every health route in the repository rather than naming them. */
const routes = []
const walk = (dir) => {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return
  for (const e of readdirSync(abs)) {
    if (e === 'node_modules' || e === '.next') continue
    const rel = `${dir}/${e}`
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
    else if (/^route\.tsx?$/.test(e) && rel.includes('/health/')) routes.push(rel)
  }
}
for (const app of existsSync(join(ROOT, 'apps')) ? readdirSync(join(ROOT, 'apps')) : []) {
  walk(`apps/${app}/app`)
}
console.log(`  health route(s) found: ${routes.length}${routes.length ? ' — ' + routes.map((r) => r.split('/')[1]).join(', ') : ''}`)
check('at least one health route was found to check', routes.length > 0)

/*
 * The shape being forbidden:
 *
 *   const configured = Boolean(process.env.SOMETHING)
 *   return configured ? { state: 'ok', … }
 *
 * The rule applies to EXTERNAL dependencies only, and getting that boundary
 * right matters more than catching every case. The first version of this check
 * flagged three probes that are entitled to say `ok`:
 *
 *   authentication   Boolean(OS_SESSION_SECRET && OS_PASSWORD)
 *   legal-identity   completeness of the BUSINESS constant
 *   documents        completeness of document identity
 *
 * None of those has anything to contact. The configuration IS the subject of
 * the check, so its presence is a complete answer and `unvalidated` would mean
 * nothing. Forcing them to change would have made the endpoint less truthful,
 * not more.
 *
 * What distinguishes a real offender is that the credential belongs to
 * something on the network. An API key or a bot token is by definition a
 * credential for a remote service; this application's own session secret and
 * operator password are not. So the test is: an env var named like a
 * third-party credential, excluding our own `OS_*` configuration.
 *
 * Adding a name to that pattern is a deliberate act, which is the point.
 */
const EXTERNAL_CREDENTIAL = /process\.env\.(?!OS_)\w*(?:_API_KEY|_BOT_TOKEN|_TOKEN|_ACCESS_KEY)\b/

const offenders = []
for (const rel of routes) {
  const src = code(rel)
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*Boolean\(([^;]*?)\)\s*;?/g)) {
    const [, name, expr] = m
    if (!EXTERNAL_CREDENTIAL.test(expr)) continue
    /* something was actually contacted — then `ok` is earned */
    if (/await|fetch\(/.test(expr)) continue
    const after = src.slice(m.index, m.index + 400)
    const ternary = new RegExp(`return\\s+${name}\\s*\\?\\s*\\{\\s*state:\\s*['"\`]ok['"\`]`)
    if (ternary.test(after)) offenders.push(`${rel} (${name})`)
  }
}
check(
  'no probe returns ok from a configuration-only branch',
  offenders.length === 0,
  offenders.join(', '),
)

console.log('')
const bad = results.filter((r) => !r.ok)
console.log('='.repeat(74))
if (bad.length === 0) {
  console.log(`HEALTH SEMANTICS: clean — ${results.length} propert(ies) proved`)
} else {
  console.log(`HEALTH SEMANTICS: ${bad.length} of ${results.length} FAILED\n`)
  console.log('A health state may not claim more than the check established.')
  console.log("Use 'unvalidated' when configuration is present and nothing was contacted.")
  process.exitCode = 1
}
