#!/usr/bin/env node
/**
 * packages/tooling/prove-friction-check.mjs
 *
 * The Business Friction Check may not grow a score, and must be able to say no.
 *
 * WHY THIS IS A GATE AND NOT A COMMENT
 *
 * Two properties make this tool worth publishing, and both are the kind that
 * erode quietly under pressure to convert.
 *
 * It has no score. Not a percentage, not a maturity level, not a readiness
 * rating. Six self-reported answers cannot support a number about a business
 * nobody has seen, and inventing one is the same offence as an unsupported
 * quantitative claim on any other surface — pointed at the visitor instead of
 * at a client.
 *
 * It can conclude that the visitor does not need this company. Answer the
 * low-friction option throughout and it says so. A diagnostic that always
 * finds a problem is a sales script, and the day that outcome stops being
 * reachable is the day this stops being worth linking to.
 *
 * Also proved: one emphatic answer is not a pattern, so the check is not
 * credulous; and the same answers always produce the same result, because a
 * diagnostic that reorders itself between runs is not one.
 *
 *   node packages/tooling/prove-friction-check.mjs
 */

import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const ROOT = process.cwd()
const { scoreFriction, FRICTION_QUESTIONS } = await import(
  pathToFileURL(join(ROOT, 'apps', 'web', 'lib', 'friction-check.ts')).href,
)

const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}
const pick = (letter) => Object.fromEntries(FRICTION_QUESTIONS.map((q) => [q.id, letter]))

console.log('='.repeat(74))
console.log('BUSINESS FRICTION CHECK')
console.log('')
console.log('It can tell the visitor they do not need us')

const low = scoreFriction(pick('a'))
check('all low-friction answers name no pattern', low.patterns.length === 0)
check('and the result says so explicitly', low.lowFriction === true)
check('every tally is zero', Object.values(low.tally).every((v) => v === 0))

console.log('')
console.log('A business in trouble still gets a usable answer')

const worst = scoreFriction(pick('d'))
check('names at least one pattern', worst.patterns.length >= 1)
check('never names more than two', worst.patterns.length <= 2, `named ${worst.patterns.length}`)
check('is not reported as low friction', worst.lowFriction === false)

console.log('')
console.log('One emphatic answer is not a pattern')

const single = scoreFriction({ q5: 'd' })
check(
  'a single answer names nothing',
  single.patterns.length === 0,
  `strongest tally was ${Math.max(...Object.values(single.tally))}`,
)

console.log('')
console.log('Deterministic, and honest about its own coverage')

const some = { q1: 'c', q5: 'c', q6: 'b' }
check(
  'the same answers give the same result twice',
  JSON.stringify(scoreFriction(some)) === JSON.stringify(scoreFriction(some)),
)
check('counts only the questions actually answered', scoreFriction(some).answered === 3)
check('reports the real total', scoreFriction(some).total === FRICTION_QUESTIONS.length)
check('ignores an option id it does not recognise', scoreFriction({ q1: 'zzz' }).answered === 0)

console.log('')
console.log('No score, by construction')

const keys = Object.keys(worst)
check(
  'the result exposes no score, percentage, rating or level',
  !keys.some((k) => /score|percent|rating|level|grade/i.test(k)),
  keys.join(', '),
)
/* The source is checked too, because a score could be computed for display
   without ever entering the result object. */
const src = (await import('node:fs')).readFileSync(
  join(ROOT, 'apps', 'web', 'app', '[locale]', 'friction-check', 'page.tsx'), 'utf8')
check(
  'the page renders no percentage',
  !/%\s*<|toFixed|Math\.round\([^)]*100|percent/i.test(src.replace(/width: `\$\{[^`]*\}%`/g, '')),
)

console.log('')
const bad = results.filter((r) => !r).length
console.log('='.repeat(74))
if (bad === 0) {
  console.log(`FRICTION CHECK: clean — ${results.length} propert(ies) proved`)
} else {
  console.log(`FRICTION CHECK: ${bad} of ${results.length} FAILED\n`)
  console.log('This tool is publishable because it has no score and can say no.')
  console.log('If either stopped being true, it stopped being worth linking to.')
  process.exitCode = 1
}
