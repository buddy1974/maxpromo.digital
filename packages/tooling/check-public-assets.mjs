#!/usr/bin/env node
/**
 * packages/tooling/check-public-assets.mjs
 *
 * The files anyone can download without logging in may not carry the
 * business's private document identity.
 *
 * WHY THIS IS A GATE
 *
 * Next.js serves every client JavaScript chunk from /_next/static to anyone
 * who asks, whether or not the page that loads it is behind a login. The
 * document screens of the back office imported their letterhead, bank and
 * MoMo details as constants, so the street address, tax number, IBAN and MoMo
 * number sat in five public chunks — unlinked from any public page, but one
 * request away for anyone who found the file name (known risk 69). Nothing
 * else could catch it: the pages were correct, the screens were behind
 * authentication, and the SEO audit reads HTML, not chunks.
 *
 * The values now live server-side in apps/web/lib/documents/identity.ts and
 * reach the screens through an authenticated API. This gate scans the build
 * output and the public directory for each value, so an import that drags
 * them back into a client bundle fails the build instead of shipping.
 *
 * The legal pages print the street address and tax number in their HTML by
 * law; that is server-rendered page content, not a static asset, and is not
 * what this checks.
 *
 *   node packages/tooling/check-public-assets.mjs        (after `npm run build`)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const WEB = join(ROOT, 'apps', 'web')
const STATIC = join(WEB, '.next', 'static')

if (!existsSync(STATIC)) {
  console.error('public-assets: apps/web/.next/static does not exist — run `npm run build` first.')
  console.error('Refusing to report clean without having checked anything.')
  process.exit(1)
}

const { BUSINESS } = await import(pathToFileURL(join(ROOT, 'packages', 'config', 'legal.ts')).href)
const identitySource = readFileSync(join(WEB, 'lib', 'documents', 'identity.ts'), 'utf8')
const field = (name) => identitySource.match(new RegExp(`${name}:\\s*'([^']+)'`))?.[1]

const iban = field('iban')
const momo = field('number')
const SECRETS = [
  ['street address', BUSINESS.street],
  ['postal line', BUSINESS.city],
  ['tax number', BUSINESS.steuernummer],
  ['IBAN', iban],
  ['IBAN (compact)', iban?.replace(/\s/g, '')],
  ['MoMo number', momo],
]
const missing = SECRETS.filter(([, v]) => !v).map(([k]) => k)
if (missing.length) {
  console.error(`public-assets: could not read ${missing.join(', ')} from their sources — the check would be blind.`)
  process.exit(1)
}

/* JavaScript may carry a string escaped: "Körnerstr." for "Körnerstr." */
const escaped = (s) => s.replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
const needles = SECRETS.flatMap(([label, v]) => [[label, v], [label, escaped(v)]])

const TEXT = new Set(['.js', '.mjs', '.css', '.json', '.map', '.txt', '.html', '.xml', '.svg', '.webmanifest'])
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (TEXT.has(extname(e))) out.push(p)
  }
  return out
}

const files = [...walk(STATIC), ...walk(join(WEB, 'public'))]
const findings = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  for (const [label, needle] of needles) {
    if (text.includes(needle)) findings.push(`${relative(ROOT, f)}  contains the ${label}`)
  }
}

console.log('='.repeat(74))
if (findings.length) {
  console.log(`PUBLIC ASSETS: ${findings.length} finding(s) across ${files.length} public file(s)\n`)
  for (const f of [...new Set(findings)]) console.log(`  ${f}`)
  console.log('\nDocument identity belongs in lib/documents/identity.ts and reaches a screen through')
  console.log('GET /api/os/document-identity, never through a client-side import.')
  process.exitCode = 1
} else {
  console.log(`PUBLIC ASSETS: clean — ${files.length} public file(s), none carries the street address, tax number, IBAN or MoMo number`)
}
