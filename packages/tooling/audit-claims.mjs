#!/usr/bin/env node
/**
 * packages/tooling/audit-claims.mjs
 *
 * What the public site claims, and whether it agrees with itself.
 *
 * WHY THIS EXISTS
 *
 * The case-studies page opens by promising: "Where a number appears, it came
 * from the system rather than from an estimate. Where we cannot evidence
 * something, it is not here." That is the strongest evidentiary standard on
 * the site, and it is the reason this check exists — a page that invites
 * scrutiny has to survive it.
 *
 * Two things went wrong under it, and neither is visible from any single
 * string:
 *
 *   1. The same claimed client saving appears as €14k/mo on the homepage and
 *      £14,000/month on the case-studies page — in both languages, on a site
 *      selling to German SMEs. One page or the other is wrong, and no reader
 *      sees both at once.
 *
 *   2. Results hedge. "Cash flow improved by approximately 18 days per
 *      quarter" and "Client satisfaction scores increased significantly" sit
 *      under a promise that numbers come from systems rather than estimates.
 *      A hedge in a result is an estimate wearing a result's clothes.
 *
 * REPORT, DO NOT EDIT
 *
 * This reports and never rewrites, for the same reason audit-platform never
 * deletes: resolving a claim means knowing something about delivered work that
 * a tool cannot know, and the wrong fix here invents a fact about a client.
 * `--strict` makes it fail, for use once the findings have been answered.
 *
 *   node packages/tooling/audit-claims.mjs
 *   node packages/tooling/audit-claims.mjs --strict
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const STRICT = process.argv.includes('--strict')

/**
 * Scan targets: the message catalogues, which is where customer-facing copy
 * lives. Resolved explicitly and counted, per ADR-0004.
 */
const CATALOGUES = (() => {
  const out = []
  const appsDir = join(ROOT, 'apps')
  if (!existsSync(appsDir)) return out
  for (const app of readdirSync(appsDir)) {
    const dir = join(appsDir, app, 'messages')
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.json')) out.push(join(dir, f))
    }
  }
  return out
})()

if (CATALOGUES.length === 0) {
  console.error('claims: no message catalogue found under ' + ROOT + '/apps/*/messages')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

/** Flatten a catalogue to dotted key → string, including strings inside arrays. */
function flatten(value, prefix, out) {
  if (typeof value === 'string') {
    out.push([prefix, value])
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, prefix + '[' + i + ']', out))
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      flatten(v, prefix ? prefix + '.' + k : k, out)
    }
  }
  return out
}

/**
 * Keys that present a claim as fact. A hedge is fine in a situation — "over
 * 60% of staff time" describes the problem the client arrived with. It is not
 * fine in a result, which is a statement about what was delivered.
 */
const RESULT_KEY = /(result|headline|metric|proof|stat|value|outcome)/i
const SITUATION_KEY = /(challenge|situation|problem|lede|desc|subtitle|body)/i

/** Words that turn a number into an estimate. English and German. */
const HEDGES = [
  'approximately', 'approx', 'roughly', 'around', 'about', 'significantly',
  'substantially', 'up to', 'more than', 'over', 'nearly', 'almost',
  'ungefähr', 'etwa', 'rund', 'circa', 'ca.', 'deutlich', 'erheblich',
  'bis zu', 'mehr als', 'fast', 'nahezu',
]

/** Currency markers, and the magnitudes they attach to. */
const CURRENCY = [
  ['€', /(?:€\s?([\d.,]+\s?k?)|([\d.,]+\s?k?)\s?€)/gi],
  ['£', /(?:£\s?([\d.,]+\s?k?)|([\d.,]+\s?k?)\s?£)/gi],
  ['$', /(?:\$\s?([\d.,]+\s?k?)|([\d.,]+\s?k?)\s?\$)/gi],
]

/** 14k, 14.000, 14,000 and 14000 are the same magnitude. */
function magnitude(raw) {
  if (!raw) return null
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, '')
  let mult = 1
  if (s.endsWith('k')) { mult = 1000; s = s.slice(0, -1) }
  s = s.replace(/[.,]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n * mult : null
}

const hedged = []
const money = new Map()   // magnitude -> Map(symbol -> [where])
let stringsChecked = 0

for (const file of CATALOGUES) {
  const rel = relative(ROOT, file).split(sep).join('/')
  let data
  try { data = JSON.parse(readFileSync(file, 'utf8')) } catch { continue }
  for (const [key, text] of flatten(data, '', [])) {
    stringsChecked++

    // ── Rule A. A result that hedges.
    if (RESULT_KEY.test(key) && !SITUATION_KEY.test(key)) {
      const lower = text.toLowerCase()
      for (const h of HEDGES) {
        if (!lower.includes(h)) continue
        // Only when the hedge sits near a figure or a comparative claim.
        // German puts the stem change in the participle — "gestiegen", not
        // "gestieget" — so a stem list built from the infinitive matches the
        // English half of a pair and misses the German one, which is the most
        // convincing way for a rule to look correct while doing half its job.
        if (!/\d/.test(text) && !/increase|decrease|improv|reduc|steig|stieg|sink|sank|gesunken|verbesser|senk|gesenkt|wuchs|wachs/i.test(text)) continue
        hedged.push({ file: rel, key, hedge: h, text })
        break
      }
    }

    // ── Rule B. The same magnitude, two currencies.
    for (const [symbol, re] of CURRENCY) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(text)) !== null) {
        const mag = magnitude(m[1] ?? m[2])
        if (mag === null || mag === 0) continue
        if (!money.has(mag)) money.set(mag, new Map())
        const bySymbol = money.get(mag)
        if (!bySymbol.has(symbol)) bySymbol.set(symbol, [])
        bySymbol.get(symbol).push(rel + ' · ' + key)
      }
    }
  }
}

const currencyConflicts = [...money.entries()].filter(([, bySymbol]) => bySymbol.size > 1)

console.log('='.repeat(74))
console.log('CLAIMS')
console.log(`${CATALOGUES.length} catalogue(s), ${stringsChecked} string(s) checked\n`)

if (currencyConflicts.length) {
  console.log(`Same figure, more than one currency — ${currencyConflicts.length}\n`)
  for (const [mag, bySymbol] of currencyConflicts) {
    console.log(`  ${mag.toLocaleString('en-GB')} appears as ${[...bySymbol.keys()].join(' and ')}`)
    for (const [symbol, wheres] of bySymbol) {
      for (const w of wheres) console.log(`      ${symbol}  ${w}`)
    }
  }
  console.log('')
}

if (hedged.length) {
  console.log(`Results stated as estimates — ${hedged.length}\n`)
  for (const f of hedged) {
    console.log(`  ${f.file} · ${f.key}`)
    console.log(`      "${f.text.slice(0, 96)}"`)
    console.log(`      hedged by: ${f.hedge}`)
  }
  console.log('')
}

const total = currencyConflicts.length + hedged.length
if (total === 0) {
  console.log('CLAIMS: clean — every figure agrees with itself, no result is stated as an estimate')
} else {
  console.log(`CLAIMS: ${total} finding(s)`)
  console.log('')
  console.log('This check reports and never rewrites. Resolving a claim means knowing')
  console.log('something about delivered work that a tool cannot know, and the wrong fix')
  console.log('here invents a fact about a client. Answer the finding, then edit the copy.')
  if (STRICT) process.exitCode = 1
}
