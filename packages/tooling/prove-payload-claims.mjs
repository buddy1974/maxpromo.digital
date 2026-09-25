#!/usr/bin/env node
/**
 * packages/tooling/prove-payload-claims.mjs
 *
 * A withdrawn claim may not ship on a page that does not make it.
 *
 * WHY THIS EXISTS (risk 55)
 *
 * `check:claims` scans what a page *renders*. This scans what a page *serves*.
 * The two were assumed to be the same thing and are not.
 *
 * `<NextIntlClientProvider>` with no `messages` prop serialises the whole
 * message tree into every page. So `/de/friction-check`, which displays no
 * commercial figures at all, served `cs2Headline` carrying
 * "14.000 £/Monat an Betriebskosten" — the figure ADR-0007 records as
 * CONTRADICTED, published as €14k/mo and £14,000/month simultaneously and
 * resolved by deleting it from the pages. It was deleted from what pages
 * render. It was never deleted from what they send.
 *
 * Anything reading raw HTML — a crawler, a model, a scraper, a "view source" —
 * saw a withdrawn figure attributed to this company on a page that
 * deliberately makes no such claim.
 *
 * TWO LAYERS, BECAUSE ONE IS NOT ENOUGH
 *
 * SOURCE, always: the provider passes an explicit narrowed list; every
 * namespace a client component reads is declared; and no forbidden namespace
 * is on the client list. This runs without a server and is what makes the gate
 * part of `verify`.
 *
 * PAYLOAD, when a dev server is reachable: fetch real routes and assert the
 * forbidden strings are absent from the bytes actually sent. This is the only
 * layer that proves the defect is closed rather than merely configured, so
 * when it cannot run it says so loudly and claims nothing.
 *
 *   node packages/tooling/prove-payload-claims.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()
const BASE = process.env.PAYLOAD_BASE ?? 'http://localhost:3020'

const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

console.log('='.repeat(74))
console.log('PAYLOAD CLAIMS')
console.log('')

/* ── The contract ──────────────────────────────────────────────────────── */
const nsPath = join(ROOT, 'apps', 'web', 'i18n', 'client-namespaces.ts')
if (!existsSync(nsPath)) {
  console.error('payload claims: no client namespace contract at apps/web/i18n/client-namespaces.ts')
  process.exit(1)
}
const { CLIENT_NAMESPACES, NEVER_CLIENT_NAMESPACES, pickClientMessages } =
  await import(pathToFileURL(nsPath).href)

console.log('The provider ships a declared subset, not everything')

const layout = stripComments(
  readFileSync(join(ROOT, 'apps', 'web', 'app', '[locale]', 'layout.tsx'), 'utf8'),
)
check(
  'NextIntlClientProvider is given an explicit messages prop',
  /<NextIntlClientProvider\s+messages=\{/.test(layout),
  /<NextIntlClientProvider>/.test(layout) ? 'found a bare provider, which serialises everything' : '',
)
check('the messages come from the narrowing helper', /pickClientMessages\(/.test(layout))

console.log('')
console.log('The forbidden namespaces are refused, not merely omitted')

for (const ns of NEVER_CLIENT_NAMESPACES) {
  check(`${ns} is not on the client list`, !CLIENT_NAMESPACES.includes(ns))
}

/* The helper must actually drop them, not just be documented as dropping. */
const probe = Object.fromEntries(
  [...CLIENT_NAMESPACES, ...NEVER_CLIENT_NAMESPACES].map((n) => [n, { x: 1 }]),
)
const picked = pickClientMessages(probe)
check(
  'the helper drops every forbidden namespace',
  NEVER_CLIENT_NAMESPACES.every((n) => !(n in picked)),
)
check(
  'and keeps every declared one',
  CLIENT_NAMESPACES.every((n) => n in picked),
)

console.log('')
console.log('Every client component reads a declared namespace')

/* Walk apps/web for 'use client' files and collect their namespaces. A client
   component reading an undeclared namespace throws at runtime, so this is also
   what stops the narrowing from breaking a page. */
const used = new Map()
const walk = (dir) => {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return
  for (const e of readdirSync(abs)) {
    if (e === 'node_modules' || e === '.next') continue
    const rel = `${dir}/${e}`
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
    else if (/\.tsx?$/.test(e)) {
      const raw = readFileSync(join(ROOT, rel), 'utf8')
      if (!/^\s*['"]use client['"]/m.test(raw.slice(0, 200))) continue
      const src = stripComments(raw)
      for (const m of src.matchAll(/useTranslations\(\s*['"]([a-zA-Z][\w.]*)['"]\s*\)/g)) {
        if (!used.has(m[1])) used.set(m[1], rel)
      }
    }
  }
}
walk('apps/web/app')
walk('apps/web/components')

const undeclared = [...used].filter(([ns]) => !CLIENT_NAMESPACES.includes(ns))
check(
  'no client component reads an undeclared namespace',
  undeclared.length === 0,
  undeclared.map(([ns, f]) => `${ns} in ${f}`).join(', '),
)
console.log(`  note  ${used.size} namespace(s) read by client components; ${CLIENT_NAMESPACES.length} declared`)

const unusedDecl = CLIENT_NAMESPACES.filter((ns) => !used.has(ns))
if (unusedDecl.length) {
  console.log(`  note  declared but read by no client component: ${unusedDecl.join(', ')} — candidates for removal`)
}

/* ── The layer that actually proves it ─────────────────────────────────── */
console.log('')
console.log('The served bytes carry no withdrawn claim')

/**
 * Strings that must not appear in the HTML of a route that does not make the
 * claim. Drawn from the figures the registry marks unresolved or contradicted.
 */
const FORBIDDEN = [
  { label: '£14,000/month (CONTRADICTED, ADR-0007)', re: /14[.,]000\s*£|£\s*14[.,]000/ },
  { label: '€14k/mo (CONTRADICTED, ADR-0007)', re: /14[.,]000\s*(?:€|EUR)|€\s*14[.,]000|14k\s*€/ },
  { label: '78 % (SOURCE_EXISTS_NEEDS_REVIEW)', re: /78\s*(?:%|&#37;|Prozent)/ },
  { label: '91 % (SOURCE_EXISTS_NEEDS_REVIEW)', re: /91\s*(?:%|&#37;|Prozent)/ },
  { label: '94 % (SOURCE_EXISTS_NEEDS_REVIEW)', re: /94\s*(?:%|&#37;|Prozent)/ },
]

/** Routes that make none of those claims and must therefore carry none. */
const CLEAN_ROUTES = [
  '/de/friction-check', '/en/friction-check',
  '/de/contact', '/en/contact',
  '/de/resources/what-to-automate-first', '/en/resources/what-to-automate-first',
  '/de/impressum',
]

let server = false
try {
  const ping = await fetch(`${BASE}/de`, { signal: AbortSignal.timeout(8000) })
  server = ping.ok
} catch { server = false }

if (!server) {
  console.log('')
  console.log('  ' + '!'.repeat(66))
  console.log('  PAYLOAD LAYER NOT RUN. No dev server answered at ' + BASE + '.')
  console.log('  The source layer above passed, which proves the provider is')
  console.log('  CONFIGURED to narrow its payload. It does not prove the bytes')
  console.log('  on the wire are clean. Start the web app and re-run to prove it:')
  console.log('    npm run dev:web')
  console.log('  ' + '!'.repeat(66))
} else {
  for (const route of CLEAN_ROUTES) {
    let html = ''
    try {
      const res = await fetch(BASE + route, { signal: AbortSignal.timeout(45000) })
      html = await res.text()
    } catch (e) {
      check(`${route} could be fetched`, false, e.message.slice(0, 50))
      continue
    }
    const hits = FORBIDDEN.filter((f) => f.re.test(html)).map((f) => f.label)
    check(`${route} carries no withdrawn claim`, hits.length === 0, hits.join(' · '))
  }

  /* The namespace itself should not be on the wire either — the claim strings
     are the symptom, the namespace is the cause. */
  try {
    const html = await (await fetch(`${BASE}/de/friction-check`, { signal: AbortSignal.timeout(45000) })).text()
    for (const ns of NEVER_CLIENT_NAMESPACES) {
      /* A namespace serialises as an OBJECT. A same-named key inside another
         namespace serialises as a string — `nav` legitimately carries a `work`
         label, and an unanchored search reads that as the `work` namespace and
         reports a leak that is not there. Requiring `{` after the colon
         separates the two. */
      const asNamespace = new RegExp(`\\\\?"${ns}\\\\?"\\s*:\\s*\\{`)
      check(`the ${ns} namespace is absent from an unrelated route's payload`,
        !asNamespace.test(html))
    }
  } catch { /* already reported above */ }
}

console.log('')
const bad = results.filter((r) => !r).length
console.log('='.repeat(74))
if (bad === 0) {
  console.log(`PAYLOAD CLAIMS: clean — ${results.length} propert(ies) proved${server ? '' : ' (source layer only)'}`)
} else {
  console.log(`PAYLOAD CLAIMS: ${bad} of ${results.length} FAILED\n`)
  console.log('A claim the company withdrew may not travel in the HTML of a page')
  console.log('that does not make it. Rendering and delivery are different things.')
  process.exitCode = 1
}
