#!/usr/bin/env node
/**
 * packages/tooling/check-governance.mjs
 *
 * The gate has one definition, and the things that describe it agree with it.
 *
 * WHY THIS EXISTS
 *
 * `npm run verify` is this repository's merge gate, and by v10.0 three separate
 * things claimed to be it:
 *
 *   package.json          eight gates
 *   apps/<app>/package.json   four gates, under the same script name
 *   .github/workflows     six hand-listed steps
 *
 * The CI workflow enumerated the gates so a failure would be legible in the
 * checks list — a good reason — and so every gate added afterwards had to be
 * remembered in a second place. Three were not: `check:token-inputs`,
 * `check:icons` and `audit:typography` were in the developer's gate and had
 * never run in CI. The workflow that exists to enforce the standard was
 * enforcing a stale subset of it, and reporting green.
 *
 * That is the same failure this repository keeps finding in its own tooling
 * (ADR-0004), one level up: not a check that examines nothing, but a *gate*
 * that enforces less than it says. It cannot be fixed by remembering harder.
 *
 * WHAT IT CHECKS
 *
 *   1. Exactly one workspace defines `verify`. A second definition under the
 *      same name is a second, weaker meaning of the merge gate.
 *   2. CI invokes `npm run verify` rather than restating its steps.
 *   3. Every gate in the verify chain appears in the standards document's gate
 *      table. Documentation that describes a different gate from the one that
 *      runs is the drift this platform stops for.
 *
 * It reads; it never edits.
 *
 *   node packages/tooling/check-governance.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const rootPkgPath = join(ROOT, 'package.json')

if (!existsSync(rootPkgPath)) {
  console.error('governance: no package.json at ' + ROOT)
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'))
const verifyChain = rootPkg.scripts?.verify

if (!verifyChain) {
  console.error('governance: the workspace root defines no `verify` script.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/** The gates the merge gate actually runs, in order. */
const GATES = verifyChain
  .split('&&')
  .map((s) => s.trim())
  .filter((s) => s.startsWith('npm run '))
  .map((s) => s.replace('npm run ', ''))

if (GATES.length === 0) {
  console.error('governance: parsed no gates out of the verify chain.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const findings = []

// ── 1. One definition of the gate. ──────────────────────────────────────────
const workspaces = []
for (const dir of ['apps', 'packages']) {
  const full = join(ROOT, dir)
  if (!existsSync(full)) continue
  for (const name of readdirSync(full)) {
    const p = join(full, name, 'package.json')
    if (existsSync(p)) workspaces.push([`${dir}/${name}`, JSON.parse(readFileSync(p, 'utf8'))])
  }
}
for (const [name, pkg] of workspaces) {
  if (pkg.scripts?.verify) {
    findings.push({
      what: `${name} defines its own \`verify\``,
      why: 'One script name, two meanings. Whichever is weaker is the one somebody runs by accident.',
    })
  }
}

// ── 2. CI calls the gate rather than restating it. ──────────────────────────
const wfDir = join(ROOT, '.github', 'workflows')
let workflowsChecked = 0
if (existsSync(wfDir)) {
  for (const f of readdirSync(wfDir)) {
    if (!f.endsWith('.yml') && !f.endsWith('.yaml')) continue
    const src = readFileSync(join(wfDir, f), 'utf8')
    // Only what the workflow *runs*. The first draft searched the whole file,
    // and the file explains at length why it calls `npm run verify` — so the
    // rule was satisfied by a comment about the rule, and would have passed a
    // workflow that had stopped calling the gate entirely.
    const commands = src
      .split(/\r?\n/)
      .filter((l) => /^\s*(-\s*)?run:/.test(l) || /^\s{6,}npm /.test(l))
      .join(' ')
    if (!commands.includes('npm run')) continue
    workflowsChecked++
    if (commands.includes('npm run verify')) continue
    // A workflow that runs npm scripts but not the gate is either restating it
    // or is not a gate workflow at all. Only the former is a finding, and the
    // way to tell is whether it runs gates the chain also runs.
    const restated = GATES.filter((g) => commands.includes(`npm run ${g}`))
    if (restated.length > 0) {
      const missing = GATES.filter((g) => !commands.includes(`npm run ${g}`))
      findings.push({
        what: `.github/workflows/${f} restates the gate instead of calling it`,
        why: missing.length
          ? `It runs ${restated.length} of ${GATES.length} gates. Missing: ${missing.join(', ')}.`
          : 'It happens to run all of them today, which is exactly how it stops doing so.',
      })
    }
  }
}

// ── 3. The standards document describes the gate that runs. ─────────────────
const standardsPath = join(ROOT, 'docs', 'governance', 'standards.md')
let documented = null
if (existsSync(standardsPath)) {
  const doc = readFileSync(standardsPath, 'utf8')
  // The gate table, not the whole document. Two earlier drafts were wrong here
  // and both looked right: the first matched on a noun stripped from the
  // script name, so `typecheck` read as undocumented against a row saying
  // "TypeScript"; the second matched the whole file, so removing a gate from
  // the table still passed because the script is named further down in the
  // audit-suite table. A rule that cannot fail is not a rule.
  const tableStart = doc.indexOf('| # | Gate |')
  const table = tableStart === -1 ? '' : doc.slice(tableStart, doc.indexOf('\n\n', tableStart))
  if (!table) {
    findings.push({
      what: 'docs/governance/standards.md has no gate table to compare against',
      why: 'The document that defines the merge gate no longer describes it.',
    })
  }
  documented = GATES.filter((g) => table.includes('`' + g + '`'))
  for (const g of GATES) {
    if (!documented.includes(g)) {
      findings.push({
        what: `\`${g}\` runs in the merge gate and is not in the standards table`,
        why: 'A gate nobody documented is a gate nobody can argue with, and one nobody will notice losing.',
      })
    }
  }
}

console.log('='.repeat(74))
console.log('GOVERNANCE')
console.log(`merge gate: ${GATES.length} gate(s) — ${GATES.join(', ')}`)
console.log(`${workspaces.length} workspace(s), ${workflowsChecked} workflow(s) checked` +
  (documented ? `, ${documented.length}/${GATES.length} documented` : ', standards.md not found'))

if (findings.length === 0) {
  console.log('\nGOVERNANCE: clean — one definition of the gate, called by CI, described by the standards')
} else {
  console.log(`\nGOVERNANCE: ${findings.length} finding(s)\n`)
  for (const f of findings) {
    console.log(`  ${f.what}`)
    console.log(`      ${f.why}`)
  }
  console.log('')
  console.log('The gate is defined once, in the root package.json. Everything else')
  console.log('calls it or describes it.')
  process.exitCode = 1
}
