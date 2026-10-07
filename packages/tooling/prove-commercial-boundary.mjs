#!/usr/bin/env node
/**
 * packages/tooling/prove-commercial-boundary.mjs  —  `npm run prove:commercial-boundary`
 *
 * The commercial agent API is a second door into the OS (ADR-0018). This gate
 * holds the properties that keep it narrow, offline, on every merge. The
 * end-to-end behaviour against a live runtime is `prove:commercial-agent`.
 *
 *   SIGNING   a valid request verifies; wrong secret, missing headers, stale
 *             time, malformed nonce, and any change to body, path or method
 *             fail; a short or missing secret fails closed; the approval hash
 *             ignores key order and changes with content.
 *   MONEY     outstanding subtracts deposits and payments, never mixes
 *             currencies, derives overdue from the due date (risk 58), never
 *             counts a draft, and reads a driver DATE by its calendar day.
 *   PIPELINE  legacy statuses map to stages; an unknown word is not guessed.
 *   SOURCE    every route under api/os/agent passes the gate before anything
 *             else; middleware exempts exactly that prefix and sets no staff
 *             identity on it; the service allocates numbers only through the
 *             shared allocator and never takes one from input; every
 *             commercial send carries a provider idempotency key; nothing in
 *             the commercial layer computes VAT.
 *
 * Each SOURCE rule is first shown failing on a bad fixture (ADR-0004: every
 * check must be able to fail), then run against the real files.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripComments } from './strip-comments.mjs'

const ROOT = join(import.meta.dirname, '..', '..')
const WEB = join(ROOT, 'apps', 'web')
const load = (...p) => import(pathToFileURL(join(ROOT, ...p)).href)
/* Line endings are normalised: a CRLF file must not slip past a pattern written with \n. */
const source = (text) => stripComments(text.replace(/\r\n/g, '\n'))
const read = (...p) => source(readFileSync(join(ROOT, ...p), 'utf8'))

let failed = 0
let passed = 0
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✓ ${name}`) }
  else { failed++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('='.repeat(74))
console.log('COMMERCIAL BOUNDARY')

/* ── SIGNING ───────────────────────────────────────────────────────────── */
console.log('\nSigning')
{
  const { verifySignature, signRequest, payloadHash, AGENT_HEADERS } = await load('apps', 'web', 'lib', 'commercial', 'signing.ts')
  const secret = 's'.repeat(40)
  const now = 1_800_000_000
  const base = { timestamp: String(now), nonce: 'n'.repeat(24), method: 'POST', path: '/api/os/agent/v1/run', body: '{"a":1}' }
  const headersFor = (p, sig) => {
    const h = new Map([[AGENT_HEADERS.timestamp, p.timestamp], [AGENT_HEADERS.nonce, p.nonce], [AGENT_HEADERS.signature, sig]])
    return { get: (k) => h.get(k) ?? null }
  }
  const good = signRequest(secret, base)
  const verify = (over = {}, sig = good, sec = secret) => {
    const p = { ...base, ...over }
    return verifySignature({ secret: sec, headers: headersFor(p, sig), method: p.method, path: p.path, body: p.body, nowSeconds: now })
  }
  check('a correctly signed request verifies', verify().ok === true)
  check('the wrong secret fails', verify({}, signRequest('x'.repeat(40), base)).ok === false)
  check('a changed body fails', verify({ body: '{"a":2}' }).ok === false)
  check('a changed path fails', verify({ path: '/api/os/agent/v1/execute' }).ok === false)
  check('a changed method fails', verify({ method: 'GET' }).ok === false)
  check('a request outside the window fails as stale', verify({ timestamp: String(now - 301) }, signRequest(secret, { ...base, timestamp: String(now - 301) })).reason === 'stale')
  check('a malformed nonce fails', verify({ nonce: 'short' }, signRequest(secret, { ...base, nonce: 'short' })).reason === 'bad_nonce')
  check('missing headers fail', verifySignature({ secret, headers: { get: () => null }, method: 'POST', path: base.path, body: base.body, nowSeconds: now }).reason === 'missing_headers')
  check('no secret fails closed', verifySignature({ secret: undefined, headers: headersFor(base, good), method: 'POST', path: base.path, body: base.body, nowSeconds: now }).reason === 'not_configured')
  check('a secret under 32 characters fails closed', verify({}, good, 'short-secret').reason === 'not_configured')
  check('the approval hash ignores key order', payloadHash('x', { a: 1, b: { c: 2, d: 3 } }) === payloadHash('x', { b: { d: 3, c: 2 }, a: 1 }))
  check('the approval hash changes with content', payloadHash('x', { a: 1 }) !== payloadHash('x', { a: 2 }))
  check('the approval hash changes with the capability', payloadHash('x', { a: 1 }) !== payloadHash('y', { a: 1 }))
}

/* ── MONEY ─────────────────────────────────────────────────────────────── */
console.log('\nMoney')
{
  const { invoiceBalance, receivables, isoDate, formatPerCurrency } = await load('apps', 'web', 'lib', 'commercial', 'money.ts')
  const inv = (o) => ({ id: 'i', invoice_number: 'MP-2026-001', client_name: 'C', status: 'sent', total: 1000, currency: 'EUR', due_date: '2026-10-20', ...o })
  const today = '2026-10-07'
  check('a deposit acknowledged on the invoice is not owed', invoiceBalance(inv({ anzahlung: 400 }), today).open === 600)
  check('a stored restbetrag is what was asked', invoiceBalance(inv({ anzahlung: 400, restbetrag: 650 }), today).open === 650)
  check('recorded payments reduce the open balance', invoiceBalance(inv({ paid_amount: 250 }), today).open === 750)
  check('a sent invoice past its due date is overdue (risk 58)', invoiceBalance(inv({ due_date: '2026-09-30' }), today).state === 'overdue')
  check('…and says by how many days', invoiceBalance(inv({ due_date: '2026-09-30' }), today).daysOverdue === 7)
  check('a draft is never owed', receivables([inv({ status: 'draft' })], today).invoices.length === 0)
  check('a paid invoice owes nothing', invoiceBalance(inv({ status: 'paid' }), today).open === 0)
  const mixed = receivables([inv({ currency: 'EUR' }), inv({ id: 'j', currency: 'GBP', total: 300 })], today)
  check('EUR and GBP are never added together', mixed.outstanding.EUR === 1000 && mixed.outstanding.GBP === 300)
  check('…and are stated separately', /1\.000,00\s€/.test(formatPerCurrency(mixed.outstanding)) && /£/.test(formatPerCurrency(mixed.outstanding)))
  check('a driver DATE is read by its calendar day, not shifted by UTC', isoDate(new Date(2026, 8, 16)) === '2026-09-16')
  check('the wrong reading would have failed here (the trap is real east of UTC)', new Date(2026, 8, 16).getTimezoneOffset() >= 0 || new Date(2026, 8, 16).toISOString().slice(0, 10) !== '2026-09-16')
}

/* ── PIPELINE ──────────────────────────────────────────────────────────── */
console.log('\nPipeline')
{
  const { leadStage, statusesFor } = await load('apps', 'web', 'lib', 'commercial', 'pipeline.ts')
  check('legacy "new" is Discovered', leadStage('new') === 'discovered')
  check('legacy "converted" is Won and "archived" is Lost', leadStage('converted') === 'won' && leadStage('archived') === 'lost')
  check('an unknown status is reported, not guessed', leadStage('maybe') === null)
  check('a stage query includes its legacy spellings', statusesFor(['won']).includes('converted'))
}

/* ── SOURCE ────────────────────────────────────────────────────────────── */
console.log('\nSource')
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}
const rel = (p) => relative(WEB, p).split(sep).join('/')
const files = new Map(['app', 'lib'].flatMap((d) => walk(join(WEB, d))).map((p) => [rel(p), source(readFileSync(p, 'utf8'))]))

/* Rule 1: an agent route passes the gate before engine or JSON. */
const gatedFirst = (s) => {
  const gate = s.indexOf('admitAgentRequest(')
  if (gate === -1) return false
  const firstUse = Math.min(...['runCapability(', 'executeApproval(', 'rejectApproval(', 'census(', 'JSON.parse(', 'request.json('].map((t) => { const i = s.indexOf(t); return i === -1 ? Infinity : i }))
  return gate < firstUse && /if \(!gate\.ok\) return/.test(s)
}
check('rule 1 fails on a route that runs before the gate', !gatedFirst("runCapability(x); const gate = await admitAgentRequest({}); if (!gate.ok) return"))
const agentRoutes = [...files.keys()].filter((p) => /^app\/api\/os\/agent\/.*route\.ts$/.test(p))
check('every route under api/os/agent is gated before it does anything', agentRoutes.length > 0 && agentRoutes.every((p) => gatedFirst(files.get(p))),
  `${agentRoutes.length} route(s): ${agentRoutes.filter((p) => !gatedFirst(files.get(p))).join(', ')}`)

/* Rule 1b: no actor list means nobody may act — never "everybody". */
const failsClosed = (s) => /if \(!allow\) return \{ ok: false, status: 503/.test(s) && !/if \(allow && !allow\.has/.test(s)
check('rule 1b fails on an allow-list that is optional', !failsClosed("const allow = allowedActors(x)\n  if (allow && !allow.has(actor)) {"))
check('the agent gate refuses every actor when OS_AGENT_ALLOWED_ACTORS is unset', failsClosed(read('apps', 'web', 'lib', 'commercial', 'agent-gate.ts')))

/* Rule 2: middleware exempts exactly the agent prefix and sets no identity there. */
const mw = read('apps', 'web', 'middleware.ts')
const exemption = (s) => {
  const m = s.match(/const AGENT_API_PREFIX = '([^']+)'/)
  if (!m || m[1] !== '/api/os/agent/') return false
  const block = s.slice(s.indexOf('pathname.startsWith(AGENT_API_PREFIX)'), s.indexOf('pathname.startsWith(AGENT_API_PREFIX)') + 120)
  return /return pass\(\)/.test(block) && !/x-os-user/.test(block)
}
check('rule 2 fails on a broadened prefix', !exemption("const AGENT_API_PREFIX = '/api/os/'\nif (pathname.startsWith(AGENT_API_PREFIX)) { return pass() }"))
check('middleware exempts exactly /api/os/agent/ and sets no staff identity on it', exemption(mw))

/* Rule 3: numbers come from the shared allocator, never from input. */
const commercial = [...files.entries()].filter(([p]) => p.startsWith('lib/commercial/'))
const allocOk = (s) => !/nextval|setval/i.test(s) && !/input\.(angebot_number|invoice_number)\b/.test(s) &&
  (!/INSERT INTO os_(angebote|invoices)/.test(s) || (/await nextAngebotNumber\(\)|await nextInvoiceNumber\(\)/.test(s) && /from '@\/lib\/documents\/allocate'/.test(s)))
check('rule 3 fails on a service that takes the number from input', !allocOk("INSERT INTO os_invoices (invoice_number) VALUES (${input.invoice_number})"))
check('the commercial layer allocates document numbers only through lib/documents/allocate', commercial.every(([, s]) => allocOk(s)),
  commercial.filter(([, s]) => !allocOk(s)).map(([p]) => p).join(', '))

/* Rule 4: every commercial send carries an idempotency key. */
const sendsOk = (s) => (s.match(/sendEmail\(\{[\s\S]*?\}\)/g) ?? []).every((call) => /idempotencyKey:/.test(call))
check('rule 4 fails on a send without a key', !sendsOk("sendEmail({ to, subject, html })"))
const senders = commercial.filter(([, s]) => /sendEmail\(/.test(s))
check('every commercial email send carries a provider idempotency key', senders.length > 0 && senders.every(([, s]) => sendsOk(s)),
  `${senders.length} sender(s)`)

/* Rule 5: no VAT arithmetic in the commercial layer (§19 UStG). */
const vatFree = (s) => !/\b(vat_?rate|mwst|umsatzsteuer\s*\(|tax_?rate)\b|\*\s*0?\.19\b|\*\s*1\.19\b/i.test(s)
check('rule 5 fails on a VAT calculation', !vatFree('const gross = net * 1.19'))
check('nothing in the commercial layer calculates VAT', commercial.every(([, s]) => vatFree(s)), commercial.filter(([, s]) => !vatFree(s)).map(([p]) => p).join(', '))

/* Rule 6: an AMBER capability defines both halves. */
const amberComplete = (s) => (s.match(/risk: 'AMBER',[\s\S]*?(?=\nexport const |\n\/\* ── |$)/g) ?? []).every((b) => /async prepare\(/.test(b) && /async execute\(/.test(b))
check('rule 6 fails on an AMBER capability without execute', !amberComplete("risk: 'AMBER',\n  async prepare(ctx) {}\n"))
check('every AMBER capability defines prepare and execute', commercial.every(([, s]) => amberComplete(s)))

/* Rule 7: an execution that sends or writes declares the moment it happened,
   so a failure after it is never reported as "nothing done". */
const executeBlocks = (s) => (s.match(/async execute\([\s\S]*?(?=\n  },\n\})/g) ?? [])
const commitsEffects = (s) => {
  const helperCommits = !/async function sendDocumentEmail/.test(s) || /async function sendDocumentEmail[\s\S]*?ctx\.committed\(/.test(s)
  return helperCommits && executeBlocks(s).every((b) => {
    const effect = /sendEmail\(|sendDocumentEmail\(|\.transaction\(|INSERT INTO/.test(b)
    return !effect || /ctx\.committed\(|sendDocumentEmail\(ctx,/.test(b)
  })
}
check('rule 7 fails on an execution that sends without declaring it', !commitsEffects("  async execute(ctx, payload) {\n    await sendEmail({ to })\n    await logActivity()\n  },\n}"))
const executors = commercial.filter(([, s]) => /async execute\(/.test(s))
const executeCount = executors.reduce((n, [, s]) => n + executeBlocks(s).length, 0)
const amberCount = commercial.reduce((n, [, s]) => n + (s.match(/risk: 'AMBER',/g) ?? []).length, 0)
check('rule 7 examined every AMBER execution (one block per AMBER capability)', executeCount > 0 && executeCount === amberCount, `${executeCount} block(s), ${amberCount} AMBER capabilities`)
check('every AMBER execution that sends or writes declares its commitment', executors.length > 0 && executors.every(([, s]) => commitsEffects(s)),
  executors.filter(([, s]) => !commitsEffects(s)).map(([p]) => p).join(', '))
const engine = read('apps', 'web', 'lib', 'commercial', 'engine.ts')
check('the engine reports a committed effect as done, never as failed', /const done = ctx\.commitment\(\)/.test(engine) && /if \(done\) \{[\s\S]{0,600}status: 'done'/.test(engine))

console.log('\n' + '='.repeat(74))
console.log(`${passed} passed, ${failed} failed`)
process.exitCode = failed ? 1 : 0
