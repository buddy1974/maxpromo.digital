/**
 * ADR-0033 A2 — the Bureau → OS result hand-back against REAL Postgres (the OS evidence database).
 *
 * The production failure: the Bureau hands a result back under one request id per item
 * (bureau-work-result-<work>). The engine stored a transient failure, or an attempt that died while
 * running, as that request's answer and replayed it to every retry — so the item could never be
 * delivered. These checks put os_agent_results into exactly those states and send the hand-back
 * through the real engine and the real result path (agentwork.result → applyWorkView).
 *
 *    1 a stored retry-safe failure is taken over by the retry, which applies the result
 *    2 a duplicate successful delivery is replayed and applies nothing again
 *    3 a later hand-back under another id finds the item finished and changes nothing
 *    4 an attempt that died while running (stale) is taken over
 *    5 an attempt still running (fresh) is not run twice
 *    6 an uncertain stored failure (retrySafe false) and a stored refusal are replayed, never re-run
 *    7 two concurrent retries of one failed hand-back apply the result once
 *    8 a crash between finishing the item and writing the lead is repaired by the next arrival, once
 *    9 a late result never overwrites a newer research on the lead
 *   10 a finished item is not changed by a late or conflicting report
 *   11 only the Research Agent hands back research results
 *   12 a failed item whose lead was never released is repaired the same way
 * Refuses to run anywhere but the evidence database. Sends no email.
 */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { evidenceDbProblem } from '../../../../packages/config/evidence.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }
if (!process.env.OS_BUREAU_AGENT_SECRET) { console.error('refusing to run — OS_BUREAU_AGENT_SECRET is not set'); process.exit(1) }

const { getDb } = await import('../../lib/db.ts')
const { runCapability } = await import('../../lib/commercial/engine.ts')
const { sha256Hex, stableStringify } = await import('../../lib/commercial/signing.ts')
const { loadWork } = await import('../../lib/agents/work.ts')
const { researchSite, researchWorkResult } = await import('../../../../packages/research/index.ts')

const sql = getDb()
const marcel = 'os:marcel'
const tag = Date.now().toString(36)
let passed = 0, n = 0
function check(name: string, ok: boolean, detail = '') { assert.ok(ok, `${name} ${detail}`); passed++; console.log(`PASS ${name}`) }
type Out = { status: string; code?: string; retrySafe?: boolean; message?: string; result?: { summary: string; data: Record<string, unknown> } }
const run = async (capability: string, input: Record<string, unknown>) => await runCapability(sql, { requestId: `ard-${tag}-${++n}`, actor: marcel, channel: 'os', capability, input }) as unknown as Out
const count = async (q: Promise<unknown>) => Number(((await q) as { n: number }[])[0].n)

/* A stand-in Bureau that accepts delegations (port 3035); the hand-back is what is under test. */
const bureau = createServer(async (req, res) => {
  const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer)
  const b = JSON.parse(Buffer.concat(chunks).toString() || '{}') as { workId: string }
  res.writeHead(req.url?.endsWith('/request') ? 202 : 200, { 'content-type': 'application/json' }).end(JSON.stringify({ work: { workId: b.workId, agent: 'research', state: 'running', createdAt: new Date().toISOString(), startedAt: new Date().toISOString(), finishedAt: null, runtime: { attempt: 1 } } }))
}).listen(3035)
process.env.BUREAU_API_ORIGIN = 'http://localhost:3035'

const host = `praxis-handback-${tag}.de`
const html = `<!doctype html><html><head><title>Praxis</title></head><body><h1>Praxis Dr. Muster — Physiotherapie in Essen</h1>
  <p>Termine ausschließlich telefonisch montags bis freitags von 8 bis 12 Uhr.</p><a href="mailto:info@${host}">info@${host}</a> © 2015</body></html>`
const outcome = await researchSite(`https://${host}`, {
  lookup: async () => ['93.184.216.34'],
  fetch: (async (url: string) => new URL(url).pathname === '/robots.txt' ? new Response('', { status: 404 }) : new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch,
  complete: (async () => ({ ok: true, model: 'fixed', route: 'anthropic', data: {
    summary: 'Physiotherapiepraxis in Essen.', business_type: 'Physiotherapiepraxis', city: 'Essen', services: ['Physiotherapie'],
    facts: [{ id: 'F1', topic: 'appointments', manual: true, text: 'Termine nur telefonisch', quote: 'Termine ausschließlich telefonisch montags bis freitags von 8 bis 12 Uhr.', url: `https://${host}/` }],
    inferences: [], opportunities: [{ solution: 'workflow-automation', hypothesis: 'Online-Terminanfrage.', based_on: ['F1'] }], unknowns: [], contact_person: null, contact_role: null, language: 'de',
  } })) as never,
})
assert.ok(outcome.ok, 'fixture research ran')
const result = researchWorkResult((outcome as unknown as { findings: Parameters<typeof researchWorkResult>[0] }).findings)

async function delegated(label: string) {
  const c = await run('lead.create', { company: `EVD Hand-back ${label} ${tag}`, website: `https://${host}`, stage: 'discovered' })
  let lead = c.result?.data.lead_id as string | undefined
  if (!lead) lead = (await run('lead.create', { company: `EVD Hand-back ${label} ${tag}`, website: `https://${host}`, stage: 'discovered', confirmed_distinct_from: ((c.result?.data.matches as { id: string }[]) ?? []).map(m => m.id) })).result?.data.lead_id as string
  const r = await run('agentwork.request', { agent: 'research', lead_id: lead, source: 'lead-screen' })
  const work = r.result?.data.work_id as string
  assert.ok(lead && work, `delegated ${label}`)
  return { lead, work }
}
const view = (workId: string, state: 'completed' | 'failed' | 'running' = 'completed') => {
  const now = new Date().toISOString()
  return { workId, agent: 'research', state, createdAt: now, startedAt: now, finishedAt: state === 'running' ? null : now,
    ...(state === 'completed' ? { result } : {}), ...(state === 'failed' ? { failure: { category: 'site', reason: 'unreachable', detail: 'praxis did not answer', retryable: true } } : {}),
    runtime: { model: 'fixed', latencyMs: 900, attempt: 1 } }
}
const handBack = (requestId: string, v: ReturnType<typeof view>, actor = 'bureau:research') =>
  runCapability(sql, { requestId, actor, channel: 'bureau', capability: 'agentwork.result', input: { work: v } }) as unknown as Promise<Out>
/* Put a request into a stored state, exactly as the engine would have written it. */
async function stored(requestId: string, v: ReturnType<typeof view>, status: 'done' | 'running', response: unknown, ageMinutes = 0) {
  const hash = sha256Hex(`agentwork.result\n${stableStringify({ work: v })}`)
  await sql`INSERT INTO os_agent_results (request_id, capability, input_hash, status, response, created_at)
    VALUES (${requestId}, 'agentwork.result', ${hash}, ${status}, ${response === null ? null : JSON.stringify(response)}::jsonb, now() - make_interval(mins => ${ageMinutes}))`
}
const transient = { status: 'failed', capability: 'agentwork.result', message: 'The OS could not complete this request.', retrySafe: true }
const state = async (work: string) => (await loadWork(sql, work))!.state
const site = async (lead: string) => ((await sql`SELECT research FROM os_leads WHERE id = ${lead}::uuid`)[0] as { research: { site: { state?: string; work?: string; qualification?: { score: number } } } }).research.site
const applications = (lead: string) => count(sql`SELECT count(*)::int AS n FROM os_activities WHERE lead_id = ${lead}::uuid AND kind = 'research_completed'`)
const audits = (work: string) => count(sql`SELECT count(*)::int AS n FROM os_audit WHERE operation = 'agentwork.result' AND after_state->>'work' = ${work}`)

const before = { outbound: await count(sql`SELECT count(*)::int AS n FROM mail.messages WHERE direction = 'outbound'`), drafts: await count(sql`SELECT count(*)::int AS n FROM mail.drafts`) }

/* 1 */
const A = await delegated('A')
const RA = `bureau-work-result-${A.work}`
const vA = view(A.work)
await stored(RA, vA, 'done', transient)
const a1 = await handBack(RA, vA)
check('1 a stored retry-safe failure is taken over by the retry, which applies the result', a1.status === 'done' && await state(A.work) === 'completed' && (await site(A.lead)).state === 'done' && await applications(A.lead) === 1, JSON.stringify(a1).slice(0, 200))
/* 2 */
const a2 = await handBack(RA, vA)
check('2 a duplicate successful delivery is replayed and applies nothing again', a2.status === 'done' && await applications(A.lead) === 1 && await audits(A.work) === 1)
/* 3 */
const a3 = await handBack(`${RA}-later`, vA)
check('3 a later hand-back under another id finds the item finished and changes nothing', a3.status === 'done' && a3.result?.data.reason === 'already_terminal' && await applications(A.lead) === 1)

/* 4 */
const B = await delegated('B')
const vB = view(B.work)
await stored(`bureau-work-result-${B.work}`, vB, 'running', null, 20)
const b1 = await handBack(`bureau-work-result-${B.work}`, vB)
check('4 an attempt that died while running (stale) is taken over', b1.status === 'done' && await state(B.work) === 'completed' && await applications(B.lead) === 1)

/* 5, 6 */
const C = await delegated('C')
const vC = view(C.work)
await stored(`bureau-work-result-${C.work}`, vC, 'running', null, 1)
const c1 = await handBack(`bureau-work-result-${C.work}`, vC)
check('5 an attempt still running (fresh) is not run twice', c1.status === 'failed' && /still being processed/.test(c1.message ?? '') && await state(C.work) !== 'completed')
await stored(`${C.work}-uncertain`, vC, 'done', { ...transient, retrySafe: false })
await stored(`${C.work}-refused`, vC, 'done', { status: 'refused', capability: 'agentwork.result', code: 'precondition', message: 'refused before' })
const c2 = await handBack(`${C.work}-uncertain`, vC)
const c3 = await handBack(`${C.work}-refused`, vC)
check('6 an uncertain stored failure and a stored refusal are replayed, never re-run', c2.status === 'failed' && c2.retrySafe === false && c3.status === 'refused' && c3.message === 'refused before' && await state(C.work) !== 'completed' && await applications(C.lead) === 0)

/* 7 */
const D = await delegated('D')
const vD = view(D.work)
await stored(`bureau-work-result-${D.work}`, vD, 'done', transient)
const both = await Promise.all([handBack(`bureau-work-result-${D.work}`, vD), handBack(`bureau-work-result-${D.work}`, vD)])
check('7 two concurrent retries of one failed hand-back apply the result once', both.filter(r => r.status === 'done').length >= 1 && await state(D.work) === 'completed' && await applications(D.lead) === 1 && await audits(D.work) === 1, JSON.stringify(both.map(b => b.status)))

/* 8 — the item finished, then the function died before the lead was written. */
const E = await delegated('E')
await sql`UPDATE os_agent_work SET state = 'completed', finished_at = now(),
  summary = ${JSON.stringify({ lead: 'E', origin: `https://${host}/`, score: 61, confidence: 'high', qualified: true, recommendation: 'outreach_draft', evidence: [], evidenceCount: 1, injectionSuspected: false, email: null })}::jsonb
  WHERE id = ${E.work}::uuid`
const leftRunning = (await site(E.lead)).state === 'running'
const e1 = await handBack(`bureau-work-result-${E.work}`, view(E.work))
const e2 = await handBack(`bureau-work-result-${E.work}-pull`, view(E.work))
check('8 a crash between finishing the item and writing the lead is repaired by the next arrival, once',
  leftRunning && e1.result?.data.reason === 'repaired' && (await site(E.lead)).state === 'done' && await applications(E.lead) === 1 && e2.result?.data.reason === 'already_terminal')

/* 9 — the claim went stale and a newer research took the lead over. */
const F = await delegated('F')
const newer = randomUUID()
await sql`UPDATE os_leads SET research = jsonb_set(research, '{site}', ${JSON.stringify({ state: 'running', at: new Date().toISOString(), by: 'os:marcel', work: newer })}::jsonb) WHERE id = ${F.lead}::uuid`
const f1 = await handBack(`bureau-work-result-${F.work}`, view(F.work))
const fs = await site(F.lead)
check('9 a late result never overwrites a newer research on the lead', f1.result?.data.reason === 'superseded' && await state(F.work) === 'completed' && fs.state === 'running' && fs.work === newer && await applications(F.lead) === 0)

/* 10 */
const lateRunning = await handBack(`${A.work}-late-running`, view(A.work, 'running'))
const lateFailed = await handBack(`${A.work}-late-failed`, view(A.work, 'failed'))
check('10 a finished item is not changed by a late or conflicting report', lateRunning.result?.data.reason === 'already_terminal' && lateFailed.result?.data.reason === 'already_terminal' && await state(A.work) === 'completed' && (await loadWork(sql, A.work))!.failure === null)

/* 11 */
const forged = await handBack(`${A.work}-forged`, view(A.work, 'failed'), 'bureau:intake')
check('11 only the Research Agent hands back research results', forged.status === 'refused')

/* 12 — a failure finished on the item, the lead claim never released. */
const G = await delegated('G')
await sql`UPDATE os_agent_work SET state = 'failed', finished_at = now(), failure = ${JSON.stringify({ category: 'site', reason: 'unreachable', detail: 'praxis did not answer', retryable: true })}::jsonb WHERE id = ${G.work}::uuid`
const g1 = await handBack(`bureau-work-result-${G.work}`, view(G.work, 'failed'))
check('12 a failed item whose lead was never released is repaired the same way', g1.result?.data.reason === 'repaired' && (await site(G.lead)).state === 'failed')

check('nothing was sent: no outbound message, no draft', await count(sql`SELECT count(*)::int AS n FROM mail.messages WHERE direction = 'outbound'`) === before.outbound && await count(sql`SELECT count(*)::int AS n FROM mail.drafts`) === before.drafts)

bureau.close()
console.log(`\nAGENT RESULT DELIVERY (evidence database): ${passed} properties proved`)
process.exit(0)
