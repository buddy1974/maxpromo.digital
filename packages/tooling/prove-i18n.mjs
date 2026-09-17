#!/usr/bin/env node
/**
 * packages/tooling/prove-i18n.mjs
 *
 * The ADR-0004 harness for `check:i18n`.
 *
 *   npm run prove:i18n
 *
 * An audit that has only ever been seen passing is not known to catch
 * anything, and this one guards a product that was mixed-language for months
 * without any gate noticing. So the failure is staged: each of the five
 * regressions it claims to catch is introduced on purpose, the audit is run,
 * and the harness asserts both that it failed AND that it failed for the right
 * reason.
 *
 * IT EDITS REAL FILES AND PUTS THEM BACK.
 * Every case writes to `apps/bureau/messages/*.json` or to a scratch source
 * file, runs the check, and restores the exact bytes it read — the originals
 * are held in memory and written back in a `finally`, so an exception or a
 * Ctrl-C between the two still leaves a clean tree. It is therefore not part
 * of `verify`: run it on a clean tree, as with `prove:domains`.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const DE = join(ROOT, 'apps/bureau/messages/de.json')
const EN = join(ROOT, 'apps/bureau/messages/en.json')
const SCRATCH = join(ROOT, 'apps/bureau/components/__i18n_probe.tsx')

for (const p of [DE, EN]) {
  if (!existsSync(p)) {
    console.error(`prove:i18n: ${p} is missing — nothing to prove against.`)
    process.exit(1)
  }
}

/** Run the audit. Returns { failed, output }. */
function runCheck() {
  try {
    const output = execFileSync('node', ['packages/tooling/check-i18n.mjs'], {
      cwd: ROOT, encoding: 'utf8',
    })
    return { failed: false, output }
  } catch (error) {
    return { failed: true, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

const originalDe = readFileSync(DE, 'utf8')
const originalEn = readFileSync(EN, 'utf8')

let failures = 0
let proved = 0

function expectCaught(label, expectInOutput) {
  const { failed, output } = runCheck()
  proved++
  const matched = failed && expectInOutput.test(output)
  if (!matched) failures++
  console.log(
    `${matched ? '  ' : '!!'} ${matched ? 'caught' : 'NOT CAUGHT'}  ${label}`,
  )
  if (!matched) {
    const first = output.split('\n').filter((l) => l.trim().startsWith('bureau:') || l.trim().startsWith('apps/'))[0]
    console.log(`      the audit said: ${first ?? '(nothing)'}`)
  }
}

console.log('='.repeat(74))
console.log('I18N AUDIT — proving it can fail')
console.log('='.repeat(74))

try {
  // ── 0. The tree is clean to begin with ────────────────────────────────────
  const baseline = runCheck()
  proved++
  if (baseline.failed) {
    failures++
    console.log('!! the audit already fails on an unmodified tree — fix that first')
    console.log(baseline.output)
  } else {
    console.log('   clean  the audit passes on the unmodified tree')
  }

  // ── 1. A key missing from English ─────────────────────────────────────────
  {
    const en = JSON.parse(originalEn)
    delete en.sections.approvals
    writeFileSync(EN, JSON.stringify(en, null, 2) + '\n')
    expectCaught('a key that exists in German and not in English', /sections\.approvals exists in de and not in en/)
    writeFileSync(EN, originalEn)
  }

  // ── 2. A key missing from German ──────────────────────────────────────────
  {
    const de = JSON.parse(originalDe)
    delete de.login.password
    writeFileSync(DE, JSON.stringify(de, null, 2) + '\n')
    expectCaught('a key that exists in English and not in German', /login\.password exists in en and not in de/)
    writeFileSync(DE, originalDe)
  }

  // ── 3. An empty translation ───────────────────────────────────────────────
  {
    const en = JSON.parse(originalEn)
    en.hero.ctaPrimary = '   '
    writeFileSync(EN, JSON.stringify(en, null, 2) + '\n')
    expectCaught('a translation that is only whitespace', /en\.hero\.ctaPrimary is empty/)
    writeFileSync(EN, originalEn)
  }

  // ── 4. A translation left as its own key ──────────────────────────────────
  {
    const en = JSON.parse(originalEn)
    en.shell.supervisedMode = 'supervisedMode'
    writeFileSync(EN, JSON.stringify(en, null, 2) + '\n')
    expectCaught('a value that is its own key', /shell\.supervisedMode is its own key/)
    writeFileSync(EN, originalEn)
  }

  // ── 5. A German string copied into the English file ───────────────────────
  {
    const en = JSON.parse(originalEn)
    en.approvals.context = JSON.parse(originalDe).approvals.context
    writeFileSync(EN, JSON.stringify(en, null, 2) + '\n')
    expectCaught('the same text in both languages', /approvals\.context is the same text in both languages/)
    writeFileSync(EN, originalEn)
  }

  // ── 6. A list that lost an item in one language ───────────────────────────
  {
    const en = JSON.parse(originalEn)
    en.agentRegistry['chief-of-staff'].blocked = en.agentRegistry['chief-of-staff'].blocked.slice(0, -1)
    writeFileSync(EN, JSON.stringify(en, null, 2) + '\n')
    expectCaught(
      "an agent's blocked-action list shorter in one language",
      /agentRegistry\.chief-of-staff\.blocked/,
    )
    writeFileSync(EN, originalEn)
  }

  // ── 7. German written straight into a component ───────────────────────────
  {
    writeFileSync(
      SCRATCH,
      'export function Probe() {\n' +
      '  return <p>Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.</p>;\n' +
      '}\n',
    )
    expectCaught('German text hardcoded in a component', /__i18n_probe\.tsx.*German text in source/s)
    unlinkSync(SCRATCH)
  }

  // ── 8. And an exemption marker silences exactly that, and only that ───────
  {
    writeFileSync(
      SCRATCH,
      '/* i18n-exempt — a probe, restored by prove-i18n.mjs. */\n' +
      'export function Probe() {\n' +
      '  return <p>Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.</p>;\n' +
      '}\n',
    )
    const { failed } = runCheck()
    proved++
    if (failed) {
      failures++
      console.log('!! NOT HONOURED  an i18n-exempt marker did not silence the line below it')
    } else {
      console.log('   honoured  an i18n-exempt marker silences the block it introduces')
    }
    unlinkSync(SCRATCH)
  }
} finally {
  // Whatever happened above, the tree goes back exactly as it was found.
  writeFileSync(DE, originalDe)
  writeFileSync(EN, originalEn)
  if (existsSync(SCRATCH)) unlinkSync(SCRATCH)
}

/* ── The tree really is clean again ───────────────────────────────────────── */

const restored =
  readFileSync(DE, 'utf8') === originalDe &&
  readFileSync(EN, 'utf8') === originalEn &&
  !existsSync(SCRATCH)

proved++
if (!restored) {
  failures++
  console.log('!! the harness did not restore the files it edited — CHECK GIT STATUS')
} else {
  console.log('   restored  every file this harness touched is byte-identical again')
}

const final = runCheck()
proved++
if (final.failed) {
  failures++
  console.log('!! the audit fails on the restored tree — the harness broke something')
} else {
  console.log('   clean  the audit passes again on the restored tree')
}

console.log('\n' + '='.repeat(74))
if (failures) {
  console.log(`I18N PROOF: ${failures} of ${proved} did not behave as required.`)
  console.log('The audit cannot be trusted until this reads clean.')
  process.exitCode = 1
} else {
  console.log(`I18N PROOF: ${proved}/${proved} demonstrated.`)
  console.log('Every regression it claims to catch was staged, caught, and undone.')
}
