#!/usr/bin/env node
/**
 * packages/tooling/smoke-agent-production.mjs  —  `npm run smoke:agent-production`
 *
 * A production smoke test of the commercial agent API that makes NO external
 * send and touches no client record.
 *
 *   AGENT_SECRET_FILE=<Mission Control .data/auth/maxpromo-os-agent-secret> \
 *   AGENT_ACTOR=telegram:<owner id> node packages/tooling/smoke-agent-production.mjs
 *
 * It proves, against https://www.maxpromo.digital:
 *   - unsigned, wrong-secret, stale, replayed and disallowed-actor requests are refused;
 *   - the census and the owner's read capabilities answer from production;
 *   - with ONE clearly labelled test lead (contact address: Maxpromo's own inbox),
 *     an outreach send is PREPARED, its approval is CANCELLED, a stale/replayed
 *     execute is refused — and nothing is ever executed or sent.
 *
 * The test lead is reused across runs (found by name), never deleted, and
 * marked lost so it never appears in the pipeline.
 */

import { createHash, createHmac, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

const BASE = process.env.AGENT_BASE ?? 'https://www.maxpromo.digital'
const ACTOR = process.env.AGENT_ACTOR
const SECRET = process.env.AGENT_SECRET_FILE ? readFileSync(process.env.AGENT_SECRET_FILE, 'utf8').trim() : ''
const TEST_COMPANY = 'MAX AGENTS TEST — do not contact'
const TEST_EMAIL = 'info@maxpromo.digital'

if (!ACTOR || SECRET.length < 32) { console.error('AGENT_ACTOR and AGENT_SECRET_FILE are required.'); process.exit(1) }

let pass = 0, fail = 0
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`) }

function headers(path, body, { secret = SECRET, ts = Math.floor(Date.now() / 1000), nonce = randomBytes(18).toString('base64url') } = {}) {
  const canonical = `${ts}\n${nonce}\nPOST\n${path}\n${createHash('sha256').update(body).digest('hex')}`
  return { 'content-type': 'application/json', 'x-maxpromo-agent-timestamp': String(ts), 'x-maxpromo-agent-nonce': nonce, 'x-maxpromo-agent-signature': createHmac('sha256', secret).update(canonical).digest('base64url') }
}
async function call(action, payload, opts = {}) {
  const path = `/api/os/agent/v1/${action}`
  const body = JSON.stringify({ actor: opts.actor ?? ACTOR, channel: 'telegram', ...payload })
  const h = opts.headers ?? headers(path, body, opts)
  const res = await fetch(BASE + path, { method: 'POST', headers: h, body })
  let json = null; try { json = await res.json() } catch { /* */ }
  return { status: res.status, json, h, body }
}
const rid = () => `smoke-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
const run = (capability, input = {}) => call('run', { requestId: rid(), capability, input }).then((r) => r.json)

console.log(`AGENT API PRODUCTION SMOKE — ${BASE}`)

console.log('\nThe door')
{
  const path = '/api/os/agent/v1/capabilities'
  const body = JSON.stringify({ actor: ACTOR, channel: 'telegram' })
  let r = await fetch(BASE + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body })
  check('unsigned → 401', r.status === 401, String(r.status))
  r = await fetch(BASE + path, { method: 'POST', headers: headers(path, body, { secret: 'x'.repeat(48) }), body })
  check('wrong secret → 401', r.status === 401, String(r.status))
  r = await fetch(BASE + path, { method: 'POST', headers: headers(path, body, { ts: Math.floor(Date.now() / 1000) - 3600 }), body })
  check('an hour-old signature → 401', r.status === 401, String(r.status))
  const h = headers(path, body)
  const first = await fetch(BASE + path, { method: 'POST', headers: h, body })
  const again = await fetch(BASE + path, { method: 'POST', headers: h, body })
  check('a valid signed request is admitted', first.status === 200, String(first.status))
  check('the same request replayed → 401', again.status === 401, String(again.status))
  const stranger = await call('capabilities', {}, { actor: 'telegram:999999999' })
  check('a correctly signed request for another actor → 403', stranger.status === 403, String(stranger.status))
  r = await fetch(BASE + '/api/os/invoices')
  check('the browser OS stays behind its own login (401)', r.status === 401, String(r.status))
  const cap = (await call('capabilities', {})).json
  check('census answers from production', Array.isArray(cap?.capabilities) && cap.capabilities.length === 42, String(cap?.capabilities?.length))
}

console.log('\nReads from production')
for (const [capability, input] of [['owner.attention', {}], ['owner.money_today', {}], ['pipeline.show', {}], ['receivables.show', {}], ['owner.overview', {}], ['approvals.pending', {}]]) {
  const r = await run(capability, input)
  check(`${capability}: ${r?.result?.summary?.slice(0, 90) ?? JSON.stringify(r).slice(0, 90)}`, r?.status === 'done')
}

console.log('\nOne approval, prepared and cancelled — nothing executed')
{
  let found = await run('lead.find', { query: TEST_COMPANY })
  let leadId = found?.result?.focus?.find((f) => f.kind === 'lead')?.id
  if (!leadId) {
    const created = await run('lead.create', { company: TEST_COMPANY, email: TEST_EMAIL, source: 'smoke-test', summary: 'Controlled test record for the Max Agents rollout. Not a client.' })
    leadId = created?.result?.data?.lead_id
    check('a labelled test lead exists (created)', Boolean(leadId), JSON.stringify(created).slice(0, 200))
  } else check('a labelled test lead exists (reused)', true)
  const draft = await run('outreach.draft', { lead_id: leadId, channel: 'email', language: 'de', subject: 'Max Agents Test', body: 'Dies ist eine Testnachricht des Max-Agents-Rollouts. Bitte ignorieren.' })
  const draftId = draft?.result?.data?.draft_id
  check('a draft is stored (Marcel\'s own wording, no model)', Boolean(draftId), JSON.stringify(draft).slice(0, 200))
  const prep = await run('outreach.send', { draft_id: draftId })
  check('sending is AMBER: an approval naming the exact recipient', prep?.status === 'approval_required' && prep.approval.preview.TO === TEST_EMAIL, JSON.stringify(prep).slice(0, 200))
  const forged = await call('execute', { approvalId: prep.approval.id, payloadHash: '0'.repeat(64) })
  check('an execute with a different payload hash is refused', forged.json?.status === 'refused' && forged.json.code === 'payload_changed', JSON.stringify(forged.json))
  const rej = await call('reject', { approvalId: prep.approval.id })
  check('the approval is cancelled', rej.json?.status === 'done', JSON.stringify(rej.json))
  const late = await call('execute', { approvalId: prep.approval.id, payloadHash: prep.approval.payloadHash })
  check('executing a cancelled approval is refused — nothing sent', late.json?.status === 'refused', JSON.stringify(late.json))
  const replayH = late.h
  const replay = await fetch(`${BASE}/api/os/agent/v1/execute`, { method: 'POST', headers: replayH, body: late.body })
  check('replaying that exact signed execute → 401', replay.status === 401, String(replay.status))
  const rid1 = rid()
  const d1 = await call('run', { requestId: rid1, capability: 'lead.find', input: { query: TEST_COMPANY } })
  const d2 = await call('run', { requestId: rid1, capability: 'lead.find', input: { query: 'something else' } })
  check('a request id reused for a different request is refused', d2.json?.status === 'refused' && d2.json.code === 'request_id_reused', JSON.stringify(d2.json))
  void d1
  const lost = await run('lead.update', { lead_id: leadId, stage: 'lost', lost_reason: 'test record' })
  check('the test lead is parked as lost (never in the pipeline)', lost?.status === 'done', JSON.stringify(lost).slice(0, 160))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exitCode = fail ? 1 : 0
