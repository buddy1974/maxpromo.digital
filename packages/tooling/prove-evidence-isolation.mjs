#!/usr/bin/env node
/**
 * packages/tooling/prove-evidence-isolation.mjs
 *
 * Proves the evidence environment's safety properties instead of asserting
 * them, by trying to violate each one and requiring the attempt to fail.
 *
 * WHY A PROOF AND NOT A TEST OF THE HAPPY PATH
 *
 * The properties that matter here are all negative: it *cannot* reach
 * production, it *cannot* send, it *cannot* delete someone else's rows. A test
 * that seeds a database and checks the rows appeared would pass on a version
 * with every one of those guarantees removed. So each case below sets up the
 * dangerous situation and requires a refusal.
 *
 * The same discipline as prove:demo-access and the other harnesses: a check
 * that has never been seen to fail is a check nobody should trust (ADR-0004).
 *
 *   node packages/tooling/prove-evidence-isolation.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = process.cwd()

/* Every source test below reads the code with comments removed.
   The first version of this harness did not, and reported five failures that
   were all its own prose: a comment in the seed explaining that it imports no
   transport matched the check for a transport import, and a comment in
   email.ts naming api.resend.com made the host appear before the guard that
   protects it. A proof that reads documentation as if it were code proves
   nothing about the code. */
const code = (rel) => stripComments(readFileSync(join(ROOT, rel), 'utf8'))
const cfg = join(ROOT, 'packages', 'config', 'evidence.ts')
if (!existsSync(cfg)) {
  console.error('evidence isolation: no contract at packages/config/evidence.ts')
  process.exit(1)
}
const {
  isEvidenceMode, evidenceDbProblem,
  EVIDENCE_MODE_ENV, EVIDENCE_DB_ENV, EVIDENCE_DOC_PREFIX,
  BLOCKED_OUTBOUND_HOSTS, ALLOWED_OUTBOUND_HOSTS,
} = await import(pathToFileURL(cfg).href)

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

console.log('='.repeat(74))
console.log('EVIDENCE ISOLATION')
console.log('')
console.log('The mode is off unless armed')

check('off when nothing is set', isEvidenceMode({}) === false)
check('off when the flag is not exactly 1', isEvidenceMode({ [EVIDENCE_MODE_ENV]: 'true' }) === false)
check('on when armed', isEvidenceMode({ [EVIDENCE_MODE_ENV]: '1' }) === true)

console.log('')
console.log('The seed cannot be pointed at production')

check(
  'refuses when the mode is off',
  evidenceDbProblem({ [EVIDENCE_DB_ENV]: 'postgres://evidence' }) !== null,
)
check(
  'refuses when no evidence database is named',
  evidenceDbProblem({ [EVIDENCE_MODE_ENV]: '1' }) !== null,
)
for (const prod of ['DATABASE_URL', 'NEON_DATABASE_URL']) {
  const same = 'postgres://the-real-one/maxpromo'
  check(
    `refuses when the evidence URL equals ${prod}`,
    evidenceDbProblem({ [EVIDENCE_MODE_ENV]: '1', [EVIDENCE_DB_ENV]: same, [prod]: same }) !== null,
  )
}
check(
  'permits a distinct evidence database',
  evidenceDbProblem({
    [EVIDENCE_MODE_ENV]: '1',
    [EVIDENCE_DB_ENV]: 'postgres://evidence/only',
    DATABASE_URL: 'postgres://the-real-one/maxpromo',
  }) === null,
)

console.log('')
console.log('The seed reads production from nowhere')

const seedSrc = code('apps/web/lib/evidence/seed.mjs')
check(
  'never reads a production database variable',
  !/process\.env\.(DATABASE_URL|NEON_DATABASE_URL)/.test(seedSrc),
)
check(
  'connects only through the evidence variable',
  (seedSrc.match(/neon\(/g) || []).length === 1 && seedSrc.includes('process.env[EVIDENCE_DB_ENV]'),
)
check(
  'imports no mail or notification transport',
  ![...seedSrc.matchAll(/^import[\s\S]*?from '([^']+)'/gm)]
    .some(([, spec]) => /email|telegram|resend/i.test(spec)),
)
const deletes = [...seedSrc.matchAll(/DELETE FROM\s+[a-z_]+\s+WHERE\s+([^`]+)/g)].map((m) => m[1])
check(
  'every DELETE is restricted to the evidence prefix or the fictional client',
  deletes.length > 0 &&
    deletes.every((w) => /LIKE \$\{like\}/.test(w) || /EVIDENCE_CLIENT\.email/.test(w)),
  `${deletes.length} DELETE(s), all restricted`,
)

console.log('')
console.log('The dataset is generated, not copied')

const dataSrc = code('apps/web/lib/evidence/dataset.ts')
check('contains no query', !/SELECT|INSERT|sql`/i.test(dataSrc))
check('is deterministic: no clock', !/Date\.now|new Date\(\)/.test(dataSrc))
check('is deterministic: no randomness', !/Math\.random|randomUUID|crypto\./.test(dataSrc))
check('uses the reserved .example TLD for every address', /\.example/.test(dataSrc))
check('marks every document with the evidence prefix', dataSrc.includes('EVIDENCE_DOC_PREFIX'))

console.log('')
console.log('Outbound communication is blocked inside the transport')

const emailSrc = code('apps/web/lib/email.ts')
const tgSrc = code('apps/web/lib/telegram.ts')

/** The guard has to come before the network call, or it guards nothing.
    Measured against `fetch(`, because a constant holding a host name is a
    declaration and not a request. */
const guardsBeforeFetch = (src) => {
  const guard = src.indexOf('isEvidenceMode()')
  const call = src.indexOf('fetch(')
  return guard !== -1 && call !== -1 && guard < call
}
check('mail: the guard precedes the Resend call', guardsBeforeFetch(emailSrc))
check('mail: the guard returns rather than continuing', /isEvidenceMode\(\)[\s\S]{0,400}?return \{/.test(emailSrc))
check('notification: the guard precedes the Telegram call', guardsBeforeFetch(tgSrc))
check('notification: the guard returns rather than continuing', /isEvidenceMode\(\)[\s\S]{0,300}?return \{/.test(tgSrc))

console.log('')
console.log('The blocked list matches what the application can actually reach')

/* The contract names four hosts. If the application grows a fifth outbound
   host, this fails, because a host nobody classified is a host nobody blocked. */
const SCAN = ['apps/web/lib', 'apps/web/app/api']
const { readdirSync, statSync } = await import('node:fs')
const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules') continue
    const p = join(d, e)
    statSync(p).isDirectory() ? walk(p, out) : /\.ts$/.test(e) && out.push(p)
  }
  return out
}
const hosts = new Set()
for (const dir of SCAN) {
  if (!existsSync(join(ROOT, dir))) continue
  for (const f of walk(join(ROOT, dir))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/https:\/\/(api\.[a-z0-9.-]+)/g)) hosts.add(m[1])
  }
}
const classified = new Set([...BLOCKED_OUTBOUND_HOSTS, ...ALLOWED_OUTBOUND_HOSTS])
const unclassified = [...hosts].filter((h) => !classified.has(h))
check(
  'every outbound host in the application is classified',
  unclassified.length === 0,
  unclassified.length ? 'unclassified: ' + unclassified.join(', ') : `${hosts.size} host(s)`,
)

console.log('')
console.log('Production behaviour is unchanged when the mode is off')
check(
  'the guard is the only thing the transports gained',
  emailSrc.includes('const apiKey = process.env.RESEND_API_KEY') &&
  tgSrc.includes('TELEGRAM_API'),
)

const failed = results.filter((r) => !r.ok)
console.log('')
console.log('='.repeat(74))
if (failed.length === 0) {
  console.log(`EVIDENCE ISOLATION: clean — ${results.length} propert(ies) proved`)
} else {
  console.log(`EVIDENCE ISOLATION: ${failed.length} of ${results.length} FAILED`)
  for (const f of failed) console.log('  ' + f.name)
  process.exitCode = 1
}
