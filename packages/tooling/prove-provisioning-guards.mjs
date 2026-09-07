#!/usr/bin/env node
/**
 * packages/tooling/prove-provisioning-guards.mjs
 *
 * The ADR-0004 harness for the Agent Bureau operator provisioning script:
 * every guard that refuses to touch the database is demonstrated refusing.
 *
 *   npm run prove:provisioning
 *
 * WHY IT EXISTS
 *
 * On 2026-09-07 the documented owner-access procedure failed in a way nobody
 * could read. `vercel env pull` reported success and wrote `DATABASE_URL=""`,
 * because every Agent Bureau variable is stored in Vercel as *sensitive* and a
 * sensitive value is never returned to anyone. The script then said
 * "DATABASE_URL is not set" — accurate, useless, and it cost a round trip to
 * the platform owner to discover.
 *
 * The fix was a better message. A better message that nothing checks is a
 * comment, so these cases run it and read what comes out.
 *
 * SAFETY
 *
 * Every case runs with no reachable database and no terminal, so the script
 * cannot reach a write even if a guard were removed — the failure of a case is
 * a wrong *message*, never a mutated row. No secret is used, produced, or
 * printed: the fake connection string points at `example.invalid`.
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SCRIPT = join('scripts', 'provision-operator-user.mjs')
const CWD = join(ROOT, 'apps', 'bureau')

if (!existsSync(join(CWD, SCRIPT))) {
  console.error(`provisioning: cannot find ${SCRIPT} under apps/bureau`)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/** A URL that resolves to nothing. Never a real credential. */
const UNREACHABLE = 'postgresql://user:pw@example.invalid/db'

const CASES = [
  {
    rule: 'no DATABASE_URL at all, no terminal',
    env: {},
    expect: 'DATABASE_URL is not set',
  },
  {
    rule: 'DATABASE_URL present but EMPTY (a sensitive Vercel pull)',
    env: { DATABASE_URL: '' },
    expect: 'present but EMPTY',
  },
  {
    rule: 'the empty case explains that Vercel never returns a sensitive value',
    env: { DATABASE_URL: '' },
    expect: 'sensitive',
  },
  {
    rule: 'the empty case names Neon as the source of truth',
    env: { DATABASE_URL: '' },
    expect: 'source of truth is Neon',
  },
  {
    rule: 'password below the minimum is refused before any database contact',
    env: { DATABASE_URL: UNREACHABLE, OPERATOR_EMAIL: 'a@b.c', OPERATOR_PASSWORD: 'tooshort' },
    expect: 'at least 12 characters',
  },
  {
    rule: 'no credentials and no terminal refuses rather than hanging',
    env: { DATABASE_URL: UNREACHABLE },
    // Reaches the database first and cannot connect; the point is that it
    // terminates and says so rather than waiting on a prompt that cannot come.
    expect: 'provision',
  },
]

const results = []
for (const c of CASES) {
  let out = ''
  try {
    out = execFileSync(process.execPath, [SCRIPT], {
      cwd: CWD,
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, DATABASE_URL: undefined, OPERATOR_EMAIL: undefined, OPERATOR_PASSWORD: undefined, ...c.env },
    })
    results.push([c.rule, 'DID NOT FAIL', 'script exited 0'])
    continue
  } catch (e) {
    if (e.killed || e.signal) {
      results.push([c.rule, 'HUNG', 'timed out — a guard waited on input it could never get'])
      continue
    }
    out = (e.stdout ?? '') + (e.stderr ?? '')
  }
  results.push([c.rule, out.includes(c.expect) ? 'fires' : 'WRONG MESSAGE', c.expect])
}

// A guard that reaches a write is the one thing this must never observe.
const wrote = results.some(([, v]) => v === 'DID NOT FAIL')

let bad = 0
for (const [rule, verdict, detail] of results) {
  const ok = verdict === 'fires'
  if (!ok) bad++
  console.log(`${ok ? '  ' : '!!'} ${rule.padEnd(58)} ${verdict}${ok ? '' : '  — ' + detail}`)
}
console.log('')
console.log(`${results.length - bad}/${results.length} provisioning guards demonstrated refusing.`)
if (wrote) console.log('!! a case exited 0 — a guard let the script continue toward a write')
process.exitCode = bad === 0 ? 0 : 1
