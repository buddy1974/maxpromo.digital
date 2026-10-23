/** End-to-end proof of the OS ↔ Bureau contract over real HTTP (ADR-0021).
 * Drives the Bureau's own lib/os/client.ts against a running Maxpromo OS
 * (OS_API_ORIGIN, e.g. a local evidence-mode `next dev`). Synthetic evidence
 * data only; it never targets production unless pointed there deliberately,
 * and refuses https://www.maxpromo.digital without --production.
 * Run: OS_API_ORIGIN=http://localhost:3020 OS_BUREAU_AGENT_SECRET=... node --experimental-transform-types apps/bureau/scripts/prove-os-contract.ts
 */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { runOsCapability, reportAgentEvents } from '../lib/os/client.ts'

const origin = process.env.OS_API_ORIGIN ?? ''
if (!origin || (/maxpromo\.digital/.test(origin) && !process.argv.includes('--production'))) {
  console.error('OS CONTRACT: set OS_API_ORIGIN to a non-production OS (or pass --production deliberately)'); process.exit(2)
}
let passed = 0
const check = (name: string, ok: boolean, detail = '') => { assert.ok(ok, `${name} ${detail}`); passed++; console.log(`PASS ${name}`) }
const run = `E2E-${randomUUID().slice(0, 8)}`
const ref = randomUUID()
const input = { source: 'agent_bureau_form', external_ref: ref, name: `${run} Person`, email: `${run.toLowerCase()}@example.invalid`, company: run, message: 'Synthetic end-to-end evidence.', interest: 'audit' }

const first = await runOsCapability('intake', `bureau-intake-${ref}`, 'lead.intake', input)
const created = first.ok && first.response.status === 'done' && (first.response.result?.data as { created?: boolean })?.created === true
check('the Bureau client signs, the OS admits it, and lead.intake creates the lead', created, JSON.stringify(first).slice(0, 300))
const retry = await runOsCapability('intake', `bureau-intake-${ref}`, 'lead.intake', input)
const leadOf = (c: typeof first) => c.ok && c.response.status === 'done' ? (c.response.result?.data as { lead_id?: string })?.lead_id : undefined
check('a retried delivery (same request id) gets the stored answer, no second lead', retry.ok && retry.response.status === 'done' && !!leadOf(first) && leadOf(retry) === leadOf(first))
const later = await runOsCapability('intake', `bureau-intake-${ref}-retry-2`, 'lead.intake', input)
check('a later redelivery under a new request id is a duplicate, not a lead', later.ok && later.response.status === 'done' && (later.response.result?.data as { duplicate?: boolean })?.duplicate === true)
const forbidden = await runOsCapability('intake', `${run}-pay`, 'payment.record', { invoice_id: randomUUID() })
check('a Bureau agent asking for payment.record is refused by the OS', forbidden.ok && forbidden.response.status === 'refused' && (forbidden.response as { code: string }).code === 'not_permitted')
const ev = { id: `${run}-evt`, kind: 'completed' as const, severity: 'warning' as const, title: `${run} intake handed an enquiry to the OS`, occurredAt: new Date().toISOString() }
const e1 = await reportAgentEvents('intake', [ev])
const e2 = await reportAgentEvents('intake', [ev])
const counts = (c: typeof e1) => (c.ok ? c.response : {}) as { accepted?: number; duplicates?: number }
check('an agent event reaches the OS once; a resend is a duplicate', counts(e1).accepted === 1 && counts(e2).duplicates === 1)
const scoped = await runOsCapability('console', `${run}-approvals`, 'approvals.requested', {})
check('the console reads the approvals its agents requested', scoped.ok && scoped.response.status === 'done')
const rogue = await runOsCapability('rogue', `${run}-rogue`, 'lead.find', { query: 'x' })
check('an agent not on the OS allow-list is refused at the door', !rogue.ok && rogue.reason === 'unauthorized')
console.log(`OS CONTRACT: ${passed} checks passed over HTTP against ${new URL(origin).host}; evidence marker ${run}`)
