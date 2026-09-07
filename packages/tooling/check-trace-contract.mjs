#!/usr/bin/env node
/**
 * packages/tooling/check-trace-contract.mjs
 *
 * Every application stamps the same correlation id, from the same place.
 *
 * WHY THIS EXISTS
 *
 * v15.0 built `packages/observability` — five log levels, redaction, a trace
 * id, one header name — and wired it into `apps/web`. `apps/bureau` was never
 * wired in, and nothing said so. The gap was found on 2026-09-07 by production
 * verification, twenty-four hours after the platform was described as
 * observable: `agents.maxpromo.digital` returned no `x-mp-trace` on a served
 * page and none on a 404, because its middleware matched only
 * `/dashboard/:path*` and never imported the header.
 *
 * A contract that holds in one of two applications is not a platform contract,
 * and "we wired the other one in too" is not a thing a repository can remember.
 * So it is checked.
 *
 * WHAT IT CHECKS
 *
 *   1. Every application with a middleware imports `TRACE_HEADER` and
 *      `newTrace` from `@maxpromo/observability`. One implementation.
 *   2. That middleware actually sets the header on a response. An import that
 *      nothing calls is the shape this repository keeps finding.
 *   3. Its matcher has a catch-all entry, so the contract holds on a public
 *      page and on a 404 — not only on the subtree someone remembered.
 *   4. Nobody hardcodes the header name. `'x-mp-trace'` as a literal outside
 *      the observability package is a second source of truth for the one
 *      string that has to agree across two applications and a log drain.
 *   5. Nobody mints trace ids locally. A second generator is a second format.
 *
 * ADR-0004: it prints how many middlewares it examined and refuses to report
 * clean having examined none. `prove:trace` demonstrates each rule failing.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments.mjs'

/**
 * Every rule below reads stripped source.
 *
 * The first version did not, and its own first run reported the middleware
 * that satisfies the contract as violating it — because the doc comment
 * explaining the contract names the header. `check-token-inputs` was broken
 * the same way and fixed the same way; the standards have required this since
 * ADR-0004. A rule that cannot tell prose from code reports the file that
 * documents the rule.
 */
const code = (file) => stripComments(readFileSync(file, 'utf8'))

const ROOT = process.cwd()
const APPS_DIR = join(ROOT, 'apps')
const PACKAGE = '@maxpromo/observability'

const findings = []
const add = (what, why) => findings.push({ what, why })

if (!existsSync(APPS_DIR)) {
  console.error('trace: no apps/ directory')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const apps = readdirSync(APPS_DIR).filter((n) => statSync(join(APPS_DIR, n)).isDirectory())

/** Source files that may legitimately mention the header, per application. */
function sourceFiles(dir) {
  const out = []
  const skip = new Set(['node_modules', '.next', '.turbo', 'public', 'dist'])
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      if (skip.has(name)) continue
      const full = join(d, name)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(full)
    }
  }
  walk(dir)
  return out
}

let examined = 0

for (const app of apps) {
  const appDir = join(APPS_DIR, app)
  const middlewarePath = ['middleware.ts', 'middleware.js', 'src/middleware.ts']
    .map((p) => join(appDir, p))
    .find((p) => existsSync(p))

  if (!middlewarePath) {
    // An application with no middleware has no request funnel to stamp. Said
    // out loud rather than skipped silently.
    console.log(`  · apps/${app} has no middleware — nothing to stamp`)
    continue
  }

  examined++
  const src = code(middlewarePath)
  const where = `apps/${app}/${middlewarePath.slice(appDir.length + 1).replace(/\\/g, '/')}`

  // 1. imports the shared contract
  const importsPackage = new RegExp(`from\\s+["']${PACKAGE}["']`).test(src)
  const importsHeader = /\bTRACE_HEADER\b/.test(src)
  const importsMint = /\bnewTrace\b/.test(src)
  if (!importsPackage || !importsHeader) {
    add(
      `${where} does not import TRACE_HEADER from ${PACKAGE}`,
      'The correlation id has one definition. An application that does not read it does not carry it.',
    )
  }
  if (!importsPackage || !importsMint) {
    add(
      `${where} does not import newTrace from ${PACKAGE}`,
      'A request that arrives without a trace id needs one minted in the one place every request passes through.',
    )
  }

  // 2. actually sets it on a response
  if (!/headers\s*\.\s*set\(\s*TRACE_HEADER/.test(src)) {
    add(
      `${where} never sets TRACE_HEADER on a response`,
      'Importing the contract and not applying it is the failure ADR-0004 exists for.',
    )
  }

  // 3. the matcher reaches more than one subtree
  const matcherBlock = /matcher\s*:\s*\[([\s\S]*?)\]/.exec(src)
  if (!matcherBlock) {
    add(`${where} declares no matcher`, 'Without one the middleware’s scope cannot be read here.')
  } else {
    const entries = [...matcherBlock[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1])
    if (entries.length === 0) {
      add(`${where} has an empty matcher`, 'It runs for nothing.')
    } else {
      const catchAll = entries.some((e) => /^\/\(\(\?!/.test(e) || e === '/:path*' || e === '/(.*)')
      if (!catchAll) {
        add(
          `${where} matcher covers only ${entries.join(', ')}`,
          'No catch-all entry, so a public page and a 404 leave without a correlation id — which is exactly how apps/bureau came to have none.',
        )
      }
    }
  }

  // 4 & 5. no second implementation anywhere in the application
  for (const file of sourceFiles(appDir)) {
    const text = code(file)
    const rel = `apps/${app}/${file.slice(appDir.length + 1).replace(/\\/g, '/')}`
    if (/["'`]x-mp-trace["'`]/.test(text)) {
      add(
        `${rel} hardcodes the header name 'x-mp-trace'`,
        `It is exported as TRACE_HEADER from ${PACKAGE}. Two spellings of one header is how a log drain stops correlating.`,
      )
    }
    if (/(?:const|let|function)\s+newTrace\b/.test(text)) {
      add(
        `${rel} defines its own newTrace`,
        'A second generator is a second id format. There is one.',
      )
    }
  }
}

console.log('='.repeat(74))
console.log('TRACE CONTRACT')
console.log(`${examined} middleware(s) examined across ${apps.length} application(s)`)

if (examined === 0) {
  console.error('\ntrace: found no application middleware to check')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

if (findings.length === 0) {
  console.log('\nTRACE CONTRACT: clean — every application stamps the same id from the same place')
  process.exit(0)
}

console.log(`\n${findings.length} finding(s):`)
for (const f of findings) {
  console.log(`  !! ${f.what}`)
  console.log(`     ${f.why}`)
}
process.exit(1)
