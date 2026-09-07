#!/usr/bin/env node
/**
 * packages/tooling/prove-trace-contract.mjs
 *
 * The ADR-0004 harness for check-trace-contract.mjs: break the trace contract
 * one way at a time, and check that the gate says so.
 *
 *   npm run prove:trace
 *
 * WARNING — this script EDITS apps/bureau/middleware.ts in place, once per
 * case, and restores it in a `finally`. Run it on a clean tree and check
 * `git diff apps/bureau/middleware.ts` is empty afterwards. It is deliberately
 * not part of `verify` for that reason.
 *
 * WHY IT IS CHECKED IN
 *
 * The gate it proves exists because `apps/bureau` went four sprints without
 * the correlation id while the platform was described as observable. A gate
 * written in response to that, and never demonstrated failing, would be the
 * same class of thing one level up: a rule believed because it is green.
 *
 * Each case names the rule it exercises and the text it expects. A case whose
 * anchor no longer exists reports ANCHOR MISSING rather than passing quietly.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const FILE = 'apps/bureau/middleware.ts'
const ORIGINAL = readFileSync(FILE, 'utf8')

/** Built rather than typed, so no tool between here and disk can rewrite it. */
const EOL = String.fromCharCode(10)

const CASES = [
  {
    rule: '1 middleware stops importing the shared contract',
    from: 'import { newTrace, TRACE_HEADER } from "@maxpromo/observability";',
    to: 'const TRACE_HEADER = "x" + "-mp-trace"; const newTrace = () => "local";',
    expect: 'does not import TRACE_HEADER',
  },
  {
    rule: '2 middleware imports the contract but never applies it',
    from: '    res.headers.set(TRACE_HEADER, trace);',
    to: '    void trace;',
    expect: 'never sets TRACE_HEADER on a response',
  },
  {
    rule: '3 matcher narrowed back to the dashboard subtree',
    from: '  matcher: ["/((?!api|_next|_vercel|.*\\\\.).*)"],',
    to: '  matcher: ["/dashboard/:path*"],',
    expect: 'matcher covers only /dashboard/:path*',
  },
  {
    rule: '4 header name hardcoded instead of imported',
    from: '    res.headers.set(TRACE_HEADER, trace);',
    to: '    res.headers.set("x-mp-trace", trace);',
    expect: "hardcodes the header name 'x-mp-trace'",
  },
  {
    rule: '5 a second trace generator defined locally',
    from: '  const trace = req.headers.get(TRACE_HEADER) ?? newTrace();',
    to: [
      '  const newTrace2 = () => "local-id";',
      '  const trace = req.headers.get(TRACE_HEADER) ?? newTrace2();',
      '  function newTrace() { return "shadow"; }',
    ],
    expect: 'defines its own newTrace',
  },
]

const results = []
try {
  for (const c of CASES) {
    const from = Array.isArray(c.from) ? c.from.join(EOL) : c.from
    const to = Array.isArray(c.to) ? c.to.join(EOL) : c.to
    if (!ORIGINAL.includes(from)) {
      results.push([c.rule, 'ANCHOR MISSING', from.slice(0, 56)])
      continue
    }
    writeFileSync(FILE, ORIGINAL.replace(from, to), 'utf8')
    let out = ''
    try {
      out = execFileSync('node', ['packages/tooling/check-trace-contract.mjs'], { encoding: 'utf8' })
      results.push([c.rule, 'DID NOT FAIL', 'gate exited 0'])
      continue
    } catch (e) {
      out = (e.stdout ?? '') + (e.stderr ?? '')
    }
    results.push([c.rule, out.includes(c.expect) ? 'fires' : 'WRONG FINDING', c.expect])
  }
} finally {
  writeFileSync(FILE, ORIGINAL, 'utf8')
}

let bad = 0
for (const [rule, verdict, detail] of results) {
  const ok = verdict === 'fires'
  if (!ok) bad++
  console.log(`${ok ? '  ' : '!!'} ${rule.padEnd(52)} ${verdict}${ok ? '' : '  — ' + detail}`)
}
console.log(`${EOL}${results.length - bad}/${results.length} rules demonstrated failing.`)
process.exitCode = bad === 0 ? 0 : 1
