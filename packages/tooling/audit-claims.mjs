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

/**
 * Rule C — one commitment, one value.
 *
 * A duration the site states publicly is a commitment, and the site states
 * several of them more than once. The first conversation is "30 minutes" on
 * the homepage and "around 45 minutes" on /about and all six industry pages,
 * in sentences whose second halves are identical word for word. Building and
 * going live is "1-4 weeks" in the homepage process and "2 to 6 weeks" in the
 * homepage FAQ four sections below it.
 *
 * Neither is visible from one page, and neither is a formatting error: they
 * are two answers to a question a buyer plans around.
 *
 * Durations often sit in a sibling key rather than in the sentence itself —
 * `process.p4Time` is "1-4 wks" and the subject is in `process.p4Title`. So a
 * value with no subject of its own borrows one from its siblings.
 */
const COMMITMENT_KINDS = [
  {
    kind: 'the first conversation',
    subject: /(conversation|call\b|meeting|business check|gespr[äa]ch|erstgespr[äa]ch|termin)/i,
    unit: /(minute|\bmin\b|stunde|\bhour)/i,
  },
  {
    kind: 'building and going live',
    subject: /(build|install|go live|launch|deploy|aufbau|installation|umsetzung|\blive\b)/i,
    unit: /(week|\bwks?\b|woche)/i,
  },
  {
    kind: 'replying to an enquiry',
    subject: /(repl(y|ies)|respond|answer|antwort|melden|r[üu]ckmeldung)/i,
    unit: /(business day|working day|werktag)/i,
  },
]

const WORD_NUMBER = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10, fifteen: 15,
  twenty: 20, thirty: 30, forty: 40, fortyfive: 45, sixty: 60,
  ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, f\u00fcnf: 5, sechs: 6, zehn: 10,
  zwanzig: 20, drei\u00dfig: 30, vierzig: 40, sechzig: 60,
}

/** "30 min", "Thirty minutes", "1-4 wks", "2 and 6 weeks" -> a comparable form. */
function durations(text) {
  const out = []
  // German pluralises with -n and -en, not -s: "Minuten", "Wochen",
  // "Werktagen". A trailing `s?` matches every English duration on the site
  // and no German one, so the rule found the English half of each conflicting
  // pair and reported it as though it were the whole finding. Same shape as
  // the hedge rule's missing participle, one release earlier.
  const numeric = /(\d+)\s*(?:[-\u2013\u2014]|to|and|und|bis)?\s*(\d+)?\s*(minute|min|hour|stunde|week|wks?|wo\.?|woche|business day|working day|werktag)(?:s|n|en)?\b/gi
  let m
  while ((m = numeric.exec(text)) !== null) {
    const unit = m[3].toLowerCase()
      .replace(/^wks?$/, 'week').replace(/^wo\.?$/, 'week').replace(/^min$/, 'minute')
      .replace(/^woche$/, 'week').replace(/^stunde$/, 'hour')
      .replace(/^(werktag|working day)$/, 'business day')
    out.push(m[2] ? `${m[1]}-${m[2]} ${unit}` : `${m[1]} ${unit}`)
  }
  const worded = /\b([a-z\u00e4\u00f6\u00fc\u00df]+)\s+(minute|hour|stunde|week|woche|business day|werktag)(?:s|n|en)?\b/gi
  while ((m = worded.exec(text)) !== null) {
    const n = WORD_NUMBER[m[1].toLowerCase()]
    if (!n) continue
    const unit = m[2].toLowerCase()
      .replace(/^woche$/, 'week').replace(/^stunde$/, 'hour').replace(/^werktag$/, 'business day')
    out.push(`${n} ${unit}`)
  }
  return out
}

/**
 * Keys describing the same thing. `ctaDesc` and `ctaTitle` group; a `q`/`a`
 * pair with nothing to strip groups on its parent object, which for a FAQ item
 * is exactly the question and its answer.
 */
function groupOf(parent, leaf) {
  const stripped = leaf.replace(/\d+$/, '').replace(/[A-Z][a-z]*$/, '')
  return stripped && stripped !== leaf ? parent + '.' + stripped : parent
}

/**
 * A case study is evidence, not a commitment. "Delivered in 8 weeks" describes
 * one project; comparing it with "1-4 weeks" on the process section would be
 * comparing what happened once with what is promised generally, and a script
 * should not draw that conclusion. A human should — and did, in known-risk 40.
 */
const NOT_A_COMMITMENT = /^caseStudies\./

const commitments = new Map()   // kind -> Map(value -> [where])

for (const file of CATALOGUES) {
  const rel = relative(ROOT, file).split(sep).join('/')
  let data
  try { data = JSON.parse(readFileSync(file, 'utf8')) } catch { continue }
  const entries = flatten(data, '', [])
  const byKey = new Map(entries)

  for (const [key, text] of entries) {
    const found = durations(text)
    if (found.length === 0) continue

    // The subject is in this string, or in a sibling that describes the same
    // thing. Getting "sibling" right took three attempts and the failures are
    // the useful part:
    //
    //   key stem only  — finds `p4Time` beside `p4Title` and nothing else. It
    //                    missed the FAQ (duration in `items[0].a`, question in
    //                    `items[0].q`) and /about (duration in `ctaDesc`, the
    //                    word "conversation" in `ctaTitle`): two of the three
    //                    real conflicts.
    //   whole parent   — found all three, and also read a case study's
    //                    "90 minutes" of invoice processing as a commitment
    //                    about the length of a first meeting, because forty
    //                    unrelated strings shared one parent object.
    //   shared prefix  — this. `ctaDesc` and `ctaTitle` group; `cs2Headline`
    //                    and `cs2Result2` do not group with a `cs2Challenge`
    //                    paragraph forty keys away.
    //
    // Case-study timelines drop out of the rule entirely, and that is correct:
    // a project that took eight weeks is evidence, not a commitment, and the
    // two should not be compared by a script.
    const parent = key.replace(/(\.[^.\[\]]+|\[\d+\])$/, '')
    const leaf = key.slice(parent.length).replace(/^[.\[]/, '').replace(/\]$/, '')
    const group = groupOf(parent, leaf)
    let context = text
    for (const [k, v] of entries) {
      if (k === key || typeof v !== 'string') continue
      const p2 = k.replace(/(\.[^.\[\]]+|\[\d+\])$/, '')
      const l2 = k.slice(p2.length).replace(/^[.\[]/, '').replace(/\]$/, '')
      if (groupOf(p2, l2) === group) context += ' ' + v
    }

    if (NOT_A_COMMITMENT.test(key)) continue

    for (const { kind, subject, unit } of COMMITMENT_KINDS) {
      if (!subject.test(context)) continue
      for (const d of found) {
        if (!unit.test(d)) continue
        if (!commitments.has(kind)) commitments.set(kind, new Map())
        const byValue = commitments.get(kind)
        if (!byValue.has(d)) byValue.set(d, [])
        byValue.get(d).push(rel + ' \u00b7 ' + key)
      }
    }
  }
}

const commitmentConflicts = [...commitments.entries()].filter(([, byValue]) => byValue.size > 1)



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

if (commitmentConflicts.length) {
  console.log(`One commitment, more than one value — ${commitmentConflicts.length}
`)
  for (const [kind, byValue] of commitmentConflicts) {
    console.log(`  ${kind} is committed to as ${[...byValue.keys()].join(' and ')}`)
    for (const [value, wheres] of byValue) {
      for (const w of wheres) console.log(`      ${value.padEnd(16)} ${w}`)
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

const total = currencyConflicts.length + hedged.length + commitmentConflicts.length
if (total === 0) {
  console.log('CLAIMS: clean — every figure agrees with itself, every commitment has one value,')
  console.log('        and no result is stated as an estimate')
} else {
  console.log(`CLAIMS: ${total} finding(s)`)
  console.log('')
  console.log('This check reports and never rewrites. Resolving a claim means knowing')
  console.log('something about delivered work that a tool cannot know, and the wrong fix')
  console.log('here invents a fact about a client. Answer the finding, then edit the copy.')
  if (STRICT) process.exitCode = 1
}
