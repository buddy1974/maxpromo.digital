/**
 * Research Agent field calibration against REAL Postgres (the OS evidence database).
 *
 * Research runs are delegated through the real capability (agentwork.request) to a stand-in Bureau that
 * accepts them; results are read from fixture sites by @maxpromo/research — the code the Research Agent
 * runs — and handed back through applyWorkView, the OS's own result path. Then Marcel judges them.
 * Refuses to run anywhere but the evidence database. Sends no email.
 *
 *    1 a review attaches to the run it names
 *    2 the earlier research run is unchanged by reviews
 *    3 two runs of one lead carry independent reviews
 *    4 agree, partly and disagree are each accepted; anything else is refused
 *    5 issue tags persist
 *    6 the note persists
 *    7 the research result cannot be changed through a review
 *    8 the score cannot be changed through a review
 *    9 nothing is sent: no draft, approval, outbound message or basis
 *   10 only Marcel reviews; only finished research runs can be reviewed
 *   11 the summary counts real reviewed runs only
 *   12 the lead screen links the shown result to its run and review
 */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { evidenceDbProblem } from '../../../../packages/config/evidence.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }
if (!process.env.OS_BUREAU_AGENT_SECRET) { console.error('refusing to run — OS_BUREAU_AGENT_SECRET is not set'); process.exit(1) }

const { getDb } = await import('../../lib/db.ts')
const { runCapability } = await import('../../lib/commercial/engine.ts')
const { applyWorkView, loadWork } = await import('../../lib/agents/work.ts')
const { calibrationRuns, summarize } = await import('../../lib/agents/calibration.ts')
const { leadWorkspace } = await import('../../lib/leads/workspace.ts')
const { researchSite, researchWorkResult } = await import('../../../../packages/research/index.ts')

const sql = getDb()
/* Migration 0028 on the evidence database (idempotent). */
const root = resolve(import.meta.dirname, '../../../..')
for (const stmt of readFileSync(resolve(root, 'apps/web/db/migrations/0028-research-calibration.sql'), 'utf8').replace(/--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean)) await sql.query(stmt)

const marcel = 'os:marcel'
const tag = Date.now().toString(36)
let passed = 0, n = 0
function check(name: string, ok: boolean, detail = '') { assert.ok(ok, `${name} ${detail}`); passed++; console.log(`PASS ${name}`) }
type Out = { status: string; result?: { summary: string; data: Record<string, unknown> }; error?: { message?: string } }
const run = async (capability: string, input: Record<string, unknown>, actor = marcel) => await runCapability(sql, { requestId: `cal-${tag}-${++n}`, actor, channel: 'os', capability, input }) as unknown as Out
const count = async (q: Promise<unknown>) => Number(((await q) as { n: number }[])[0].n)

/* A stand-in Bureau that accepts delegations (port 3034); results come back through applyWorkView. */
const bureau = createServer(async (req, res) => {
  const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer)
  const b = JSON.parse(Buffer.concat(chunks).toString() || '{}') as { workId: string }
  res.writeHead(req.url?.endsWith('/request') ? 202 : 200, { 'content-type': 'application/json' }).end(JSON.stringify({ work: { workId: b.workId, agent: 'research', state: 'running', createdAt: new Date().toISOString(), startedAt: new Date().toISOString(), finishedAt: null, runtime: { attempt: 1 } } }))
}).listen(3034)
process.env.BUREAU_API_ORIGIN = 'http://localhost:3034'

const host = `praxis-kalibrierung-${tag}.de`
const page = (body: string) => `<!doctype html><html><head><title>Praxis</title></head><body>${body}</body></html>`
const siteA = page(`<h1>Praxis Dr. Muster — Physiotherapie in Essen</h1>
  <p>Termine ausschließlich telefonisch montags bis freitags von 8 bis 12 Uhr.</p>
  <p>Anmeldebogen bitte ausdrucken und ausgefüllt zum ersten Termin mitbringen.</p>
  <a href="mailto:info@${host}">info@${host}</a> © 2015 Praxis Dr. Muster`)
const siteB = page('<h1>Praxis Dr. Muster</h1><p>Willkommen auf unserer Website. Hier entsteht in Kürze unser neuer Internetauftritt.</p>')
const deps = (html: string) => ({
  lookup: async () => ['93.184.216.34'],
  fetch: (async (url: string) => new URL(url).pathname === '/robots.txt' ? new Response('', { status: 404 }) : new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch,
})
const modelA = async () => ({ ok: true as const, model: 'fixed', route: 'anthropic' as const, data: {
  summary: 'Physiotherapiepraxis in Essen.', business_type: 'Physiotherapiepraxis', city: 'Essen', services: ['Physiotherapie'],
  facts: [
    { id: 'F1', topic: 'appointments', manual: true, text: 'Termine nur telefonisch', quote: 'Termine ausschließlich telefonisch montags bis freitags von 8 bis 12 Uhr.', url: `https://${host}/` },
    { id: 'F2', topic: 'contact', manual: true, text: 'Anmeldebogen auf Papier', quote: 'Anmeldebogen bitte ausdrucken und ausgefüllt zum ersten Termin mitbringen.', url: `https://${host}/` },
  ],
  inferences: [{ text: 'Terminvergabe und Anmeldung laufen über Telefon und Papier.', based_on: ['F1', 'F2'] }],
  opportunities: [{ solution: 'workflow-automation', hypothesis: 'Online-Terminanfrage und digitaler Anmeldebogen.', based_on: ['F1', 'F2'] }],
  unknowns: ['Gibt es eine Buchung über eine Plattform?'], contact_person: null, contact_role: null, language: 'de',
} })
const modelB = async () => ({ ok: true as const, model: 'fixed', route: 'anthropic' as const, data: {
  summary: 'Praxis.', business_type: 'Praxis', city: null, services: [], facts: [], inferences: [], opportunities: [], unknowns: ['Welche Leistungen bietet die Praxis an?'],
  contact_person: null, contact_role: null, language: 'de',
} })

async function lead(company: string) {
  const r = await run('lead.create', { company, website: `https://${host}`, stage: 'discovered' })
  let id = r.result?.data.lead_id as string | undefined
  if (!id) { const m = (r.result?.data.matches as { id: string }[] | undefined) ?? []; id = (await run('lead.create', { company, website: `https://${host}`, stage: 'discovered', confirmed_distinct_from: m.map(x => x.id) })).result?.data.lead_id as string }
  assert.ok(id, `lead ${company}`)
  return id
}
async function research(leadId: string, html: string, model: () => Promise<unknown>) {
  const r = await run('agentwork.request', { agent: 'research', lead_id: leadId, source: 'lead-screen' })
  const workId = r.result?.data.work_id as string
  assert.ok(workId, `work requested ${JSON.stringify(r).slice(0, 200)}`)
  const outcome = await researchSite(`https://${host}`, { ...deps(html), complete: model as never })
  assert.ok(outcome.ok, `fixture research ran ${JSON.stringify(outcome).slice(0, 300)}`)
  const result = researchWorkResult((outcome as unknown as { findings: Parameters<typeof researchWorkResult>[0] }).findings)
  const now = new Date().toISOString()
  const applied = await applyWorkView(sql, { workId, agent: 'research', state: 'completed', createdAt: now, startedAt: now, finishedAt: now, result, runtime: { model: 'fixed', latencyMs: 1234, attempt: 1 } })
  assert.ok(applied.applied, 'result applied')
  return workId
}
const workRow = async (id: string) => (await sql`SELECT state, summary, failure, runtime, finished_at FROM os_agent_work WHERE id = ${id}::uuid`)[0]
const leadRow = async (id: string) => (await sql`SELECT status, research FROM os_leads WHERE id = ${id}::uuid`)[0] as { status: string; research: { site: { qualification: { score: number } } } }
const reviews = async (work: string) => await sql`SELECT verdict, issues, note, reviewed_by FROM os_agent_work_review WHERE work_id = ${work}::uuid ORDER BY created_at, id` as { verdict: string; issues: string[]; note: string | null; reviewed_by: string }[]

const before = {
  drafts: await count(sql`SELECT count(*)::int AS n FROM mail.drafts`),
  outbound: await count(sql`SELECT count(*)::int AS n FROM mail.messages WHERE direction = 'outbound'`),
  approvals: await count(sql`SELECT count(*)::int AS n FROM os_approvals`),
}

const L = await lead(`Kalibrierung Praxis ${tag}`)
const W1 = await research(L, siteA, modelA)
const w1 = JSON.stringify(await workRow(W1))
const lead1 = await leadRow(L)
const W2 = await research(L, siteB, modelB)
const w2 = JSON.stringify(await workRow(W2))
const lead2 = await leadRow(L)
const s1 = (await loadWork(sql, W1))!.summary!
check('0 the calibration record is kept with the run: business type, pages, facts, opportunities, unknowns, limitations, duration',
  s1.record?.businessType === 'Physiotherapiepraxis' && s1.record.pages.length >= 1 && s1.record.facts.length === 2 && s1.record.opportunities.length === 1 && s1.record.unknowns.length >= 1 && Array.isArray(s1.record.limitations) && (await loadWork(sql, W1))!.runtime?.latencyMs === 1234)

/* 1, 5, 6 */
const r1 = await run('agentwork.review', { work_id: W1, verdict: 'partly', issues: ['missed_signal', 'score_too_high'], note: 'Online-Buchung über Doctolib übersehen.' })
check('1 the review is recorded against the run it names', r1.status === 'done' && (await reviews(W1)).length === 1 && (await reviews(W2)).length === 0, JSON.stringify(r1).slice(0, 200))
const got1 = (await reviews(W1))[0]
check('5 issue tags persist', JSON.stringify(got1.issues) === JSON.stringify(['missed_signal', 'score_too_high']))
check('6 the note persists, and who judged', got1.note === 'Online-Buchung über Doctolib übersehen.' && got1.reviewed_by === marcel)

/* 3 */
await run('agentwork.review', { work_id: W2, verdict: 'disagree', issues: ['misunderstood'] })
check('3 the second run has its own review; the first run\'s is untouched', (await reviews(W2))[0]?.verdict === 'disagree' && (await reviews(W1)).length === 1 && (await reviews(W1))[0].verdict === 'partly')

/* 4 */
const agree = await run('agentwork.review', { work_id: W1, verdict: 'agree' })
const partly = await run('agentwork.review', { work_id: W1, verdict: 'partly' })
const disagree = await run('agentwork.review', { work_id: W1, verdict: 'disagree', note: 'Bewertung zu hoch für eine Einzelpraxis.' })
const bad = await run('agentwork.review', { work_id: W1, verdict: 'maybe' })
const badTag = await run('agentwork.review', { work_id: W1, verdict: 'partly', issues: ['too_slow'] })
const longNote = await run('agentwork.review', { work_id: W1, verdict: 'partly', note: 'x'.repeat(501) })
check('4 agree, partly and disagree are each accepted', [agree, partly, disagree].every(r => r.status === 'done'))
check('4 an unknown verdict, an unknown tag and an over-long note are refused, and nothing is stored for them', bad.status !== 'done' && badTag.status !== 'done' && longNote.status !== 'done' && (await reviews(W1)).length === 4)
const history = await reviews(W1)
check('4 changing the judgement keeps the earlier ones; the newest is current', history.map(r => r.verdict).join(',') === 'partly,agree,partly,disagree')

/* 2, 7, 8 */
check('2 the earlier run is unchanged after its reviews and the later run', JSON.stringify(await workRow(W1)) === w1)
check('7 the later run\'s result is unchanged by its review', JSON.stringify(await workRow(W2)) === w2)
const extra = await run('agentwork.review', { work_id: W1, verdict: 'agree', score: 99 } as Record<string, unknown>)
const extra2 = await run('agentwork.review', { work_id: W1, verdict: 'agree', summary: { score: 99 } } as Record<string, unknown>)
check('8 a review cannot carry a score or a result: extra fields are refused', extra.status !== 'done' && extra2.status !== 'done')
const leadNow = await leadRow(L)
check('8 the lead\'s score, research and stage are what the research made them', JSON.stringify(leadNow) === JSON.stringify(lead2) && lead1.research.site.qualification.score !== undefined)

/* 9 */
check('9 nothing was sent or prepared: no draft, outbound message or approval', await count(sql`SELECT count(*)::int AS n FROM mail.drafts`) === before.drafts
  && await count(sql`SELECT count(*)::int AS n FROM mail.messages WHERE direction = 'outbound'`) === before.outbound
  && await count(sql`SELECT count(*)::int AS n FROM os_approvals`) === before.approvals)
check('9 no basis for email was recorded on the lead', await count(sql`SELECT count(*)::int AS n FROM os_activities WHERE lead_id = ${L}::uuid AND kind = 'contact_basis'`) === 0)
check('9 every review is in the audit, as Marcel\'s', await count(sql`SELECT count(*)::int AS n FROM os_audit WHERE operation = 'agentwork.review' AND entity_id = ${L} AND actor = ${marcel}`) === 5)

/* 12 — before the failing run below replaces the lead's result */
const ws = await leadWorkspace(sql, L)
check('12 the lead screen\'s result belongs to the latest finished run, with that run\'s review', ws?.calibration?.workId === W2 && ws.calibration.review?.verdict === 'disagree')

/* 10 */
const asAgent = await run('agentwork.review', { work_id: W1, verdict: 'agree' }, 'bureau:research')
const asOther = await run('agentwork.review', { work_id: W1, verdict: 'agree' }, 'max')
check('10 the Research Agent and any other actor cannot review; nothing stored', asAgent.status !== 'done' && asOther.status !== 'done' && (await reviews(W1)).length === 4)
const open = await run('agentwork.request', { agent: 'research', lead_id: L, source: 'lead-screen' })
const W3 = open.result?.data.work_id as string
const openReview = await run('agentwork.review', { work_id: W3, verdict: 'agree' })
const ghost = await run('agentwork.review', { work_id: '00000000-0000-4000-8000-000000000000', verdict: 'agree' })
check('10 work still running and unknown work cannot be reviewed', openReview.status !== 'done' && ghost.status !== 'done' && (await reviews(W3)).length === 0)
await applyWorkView(sql, { workId: W3, agent: 'research', state: 'failed', createdAt: new Date().toISOString(), startedAt: null, finishedAt: new Date().toISOString(), failure: { category: 'site', reason: 'unreachable', detail: 'The site did not answer.', retryable: true } })
check('10 a failed run cannot be reviewed', (await run('agentwork.review', { work_id: W3, verdict: 'disagree' })).status !== 'done')

/* 11 */
const T = await lead(`EVD Kalibrierung Test ${tag}`)
const WT = await research(T, siteA, modelA)
await run('agentwork.review', { work_id: WT, verdict: 'disagree' })
const runs = await calibrationRuns(sql, 1000)
const sum = summarize(runs)
const testRun = runs.find(r => r.workId === WT)
const realReviewed = runs.filter(r => !r.test && r.state === 'completed' && r.summary && r.review)
check('11 the test lead\'s run is shown and marked test', testRun?.test === true && testRun.review?.verdict === 'disagree')
check('11 the summary counts exactly the real reviewed runs; the test review is not counted',
  sum.reviewed === realReviewed.length && sum.agreement.agree + sum.agreement.partly + sum.agreement.disagree === realReviewed.length && realReviewed.every(r => r.workId !== WT))
check('11 our two real runs are counted with their current judgements', runs.find(r => r.workId === W1)?.review?.verdict === 'disagree' && runs.find(r => r.workId === W1)?.review?.revisions === 4 && runs.find(r => r.workId === W2)?.review?.verdict === 'disagree')
check('11 a failed run counts as failed and unreadable, not as researched', runs.find(r => r.workId === W3)?.state === 'failed' && sum.failed >= 1)

bureau.close()
console.log(`\n${passed} checks passed — research calibration (evidence database)`)
process.exit(0)
