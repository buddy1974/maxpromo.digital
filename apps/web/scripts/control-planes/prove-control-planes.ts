/** Real SQL proof of the OS ↔ Agent Bureau contract (ADR-0021), exclusively against an
 * isolated EVIDENCE_DATABASE_URL. Imports the real gate, engine, capabilities and attention
 * code. Never sends anything: evidence mode suppresses Telegram and email.
 * Run: npm run prove:control-planes
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { setDefaultResultOrder } from 'node:dns'
import { evidenceDbProblem, EVIDENCE_DB_ENV } from '../../../../packages/config/evidence.ts'

const root = resolve(import.meta.dirname, '../../../..')
const env: NodeJS.ProcessEnv = { ...process.env }
const productionTargets: { name: string; value: string }[] = []
for (const name of ['NEON_DATABASE_URL', 'DATABASE_URL']) if (env[name]) productionTargets.push({ name, value: env[name]! })
// Read only these database variables. Do not execute dotenv text or print values.
const allowed = new Set(['EVIDENCE_DATABASE_URL', 'DATABASE_URL', 'NEON_DATABASE_URL'])
for (const envFile of [resolve(root, 'apps/web/.env.local'), resolve(root, '.env.local')]) {
  if (!existsSync(envFile)) continue
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (!match || !allowed.has(match[1])) continue
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    else value = value.replace(/\s+#.*$/, '')
    if (match[1] !== 'EVIDENCE_DATABASE_URL') productionTargets.push({ name: match[1], value })
    if (env[match[1]] === undefined) env[match[1]] = value
  }
}
env.MAXPROMO_EVIDENCE_MODE = '1'
const problem = evidenceDbProblem(env)
if (problem) { console.error(`CONTROL PLANES: unavailable — ${problem}`); process.exit(2) }
const target = env[EVIDENCE_DB_ENV]!
function databaseIdentity(value: string): string {
  const url = new URL(value)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database URL')
  return `${url.hostname.toLowerCase()}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`
}
for (const { name, value } of productionTargets) {
  if (databaseIdentity(target) === databaseIdentity(value)) {
    console.error(`CONTROL PLANES: refusing — evidence target identifies the same database as ${name}`); process.exit(2)
  }
}
setDefaultResultOrder('ipv4first')
for (const k of ['NEON_DATABASE_URL', 'DATABASE_URL']) delete process.env[k]
process.env.MAXPROMO_EVIDENCE_MODE = '1'
process.env[EVIDENCE_DB_ENV] = target

const { getDb } = await import('@/lib/db')
const { Pool } = await import('@neondatabase/serverless')
const { runCapability, executeApproval, rejectApproval, OWNER_ACTOR } = await import('@/lib/commercial/engine')
const { admitAgentRequest, clientMayUse, CLIENT_POLICIES } = await import('@/lib/commercial/agent-gate')
const { recordAgentEvents, acknowledgeAgentEvent } = await import('@/lib/commercial/agent-events')
const { attentionSnapshot } = await import('@/lib/commercial/capabilities/views')
const { berlinDate } = await import('@/lib/commercial/money')
const { signedHeaders } = await import('@maxpromo/config/agent-contract')

const sql = getDb()
let passed = 0
function check(name: string, result: boolean) { assert.ok(result, name); passed++; console.log(`PASS ${name}`) }

const run = `CP-EVIDENCE-${randomUUID().slice(0, 8)}`
const source = `evidence_${run.slice(-8).toLowerCase()}`
const bureauSecret = 'b'.repeat(48)
const legacySecret = 'l'.repeat(48)
const path = '/api/os/agent/v1/run'
const headersOf = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null })
const gate = (o: { client?: 'bureau' | 'legacy'; secret?: string; action?: 'run' | 'execute' | 'events' | 'capabilities'; body?: Record<string, unknown>; env?: Record<string, string | undefined>; headers?: Record<string, string> }) => {
  const body = JSON.stringify(o.body ?? { actor: 'bureau:intake', channel: 'bureau' })
  const h = o.headers ?? signedHeaders({ client: o.client ?? 'bureau', secret: o.secret ?? bureauSecret, method: 'POST', path, body })
  return admitAgentRequest({
    sql, action: o.action ?? 'run', method: 'POST', path, rawBody: body, headers: headersOf(h),
    env: o.env ?? { OS_BUREAU_AGENT_SECRET: bureauSecret, OS_BUREAU_ALLOWED_AGENTS: 'bureau:intake', OS_AGENT_SECRET: legacySecret },
  })
}

try {
  /* ── migration ─────────────────────────────────────────────────────── */
  const pool = new Pool({ connectionString: target, connectionTimeoutMillis: 15_000 })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(readFileSync(resolve(root, 'apps/web/db/migrations/0015-control-planes.sql'), 'utf8'))
    await client.query(readFileSync(resolve(root, 'apps/web/db/migrations/0015-control-planes.sql'), 'utf8'))
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release(); await pool.end() }
  check('migration 0015 applies, and replays, on the guarded evidence target', true)

  /* ── gate: per-client credentials and authority ────────────────────── */
  const admitted = await gate({})
  check('a Bureau request signed with the Bureau secret is admitted', admitted.ok && admitted.client.id === 'bureau' && admitted.actor === 'bureau:intake')
  const shared = await gate({ env: { OS_BUREAU_AGENT_SECRET: bureauSecret, OS_BUREAU_ALLOWED_AGENTS: 'bureau:intake', OS_AGENT_SECRET: bureauSecret } })
  check('a Bureau secret equal to the legacy secret fails closed (old credentials never become new ones)', !shared.ok && shared.status === 503)
  const crossSigned = await gate({ secret: legacySecret })
  check('a request signed with the legacy secret but claiming the Bureau client is refused', !crossSigned.ok && crossSigned.status === 401)
  const executeByBureau = await gate({ action: 'execute' })
  check('the Bureau may not execute approvals', !executeByBureau.ok && executeByBureau.status === 403 && executeByBureau.error === 'action_not_allowed')
  const legacyBody = { actor: 'telegram:6090014884', channel: 'telegram' }
  const legacyUnlisted = await gate({ client: 'legacy', secret: legacySecret, body: legacyBody })
  check('the legacy client with no allow-list refuses everyone (production state since 2026-10-23)', !legacyUnlisted.ok && legacyUnlisted.status === 503)
  const unknownAgent = await gate({ body: { actor: 'bureau:someone-else', channel: 'bureau' } })
  check('a Bureau agent not on OS_BUREAU_ALLOWED_AGENTS is refused', !unknownAgent.ok && unknownAgent.status === 403)
  const wrongShape = await gate({ body: { actor: 'telegram:6090014884', channel: 'bureau' } })
  check('a Telegram actor cannot be claimed through the Bureau client', !wrongShape.ok && wrongShape.status === 400)
  const h = signedHeaders({ client: 'bureau', secret: bureauSecret, method: 'POST', path, body: JSON.stringify({ actor: 'bureau:intake', channel: 'bureau' }) })
  const first = await gate({ headers: h }); const replay = await gate({ headers: h })
  check('a replayed Bureau nonce is refused', first.ok && !replay.ok && replay.status === 401)
  const bureau = CLIENT_POLICIES.bureau
  check('Bureau authority covers intake and requesting outreach, never payments, sends of documents or deletes',
    clientMayUse(bureau, 'lead.intake') && clientMayUse(bureau, 'outreach.send') && !clientMayUse(bureau, 'payment.record')
    && !clientMayUse(bureau, 'proposal.send') && !clientMayUse(bureau, 'invoice.send') && !clientMayUse(bureau, 'proposal.accept'))

  /* ── lead.intake: canonical, idempotent ────────────────────────────── */
  const ref = randomUUID()
  const email = `${run.toLowerCase()}@example.invalid`
  const intake = (requestId: string, over: Record<string, unknown> = {}) => runCapability(sql, {
    requestId, actor: 'bureau:intake', channel: 'bureau', capability: 'lead.intake',
    input: { source, external_ref: ref, name: 'Evidence Person', email, company: run, message: 'Synthetic evidence only.', interest: 'audit', ...over },
  })
  const race = await Promise.all(Array.from({ length: 10 }, (_, i) => intake(`${run}-race-${i}`)))
  const createdAnswers = race.filter((r) => r.status === 'done' && (r.result.data as { created?: boolean })?.created === true)
  const [counts] = await sql`SELECT (SELECT count(*)::int FROM os_leads WHERE company = ${run}) AS leads,
    (SELECT count(*)::int FROM os_intake_receipts WHERE source = ${source}) AS receipts`
  check('10 concurrent deliveries of one enquiry create exactly one lead and one receipt', createdAnswers.length === 1 && counts.leads === 1 && counts.receipts === 1)
  check('…and every other delivery answers duplicate, not failure', race.filter((r) => r.status === 'done' && (r.result.data as { duplicate?: boolean })?.duplicate === true).length === 9)
  const [lead] = await sql`SELECT id, status, source FROM os_leads WHERE company = ${run}`
  check('the lead is in the OS pipeline as discovered, under its capturing source', lead.status === 'discovered' && lead.source === source)
  const again = await intake(`${run}-later-retry`)
  check('a retry days later (new request id, same enquiry) still creates nothing', again.status === 'done' && (again.result.data as { lead_id?: string }).lead_id === lead.id && (again.result.data as { duplicate?: boolean }).duplicate === true)
  const repeat = await runCapability(sql, { requestId: `${run}-repeat`, actor: 'bureau:intake', channel: 'bureau', capability: 'lead.intake',
    input: { source, external_ref: randomUUID(), name: 'Evidence Person', email, message: 'Second enquiry.' } })
  const [after] = await sql`SELECT count(*)::int AS n FROM os_leads WHERE lower(email) = ${email}`
  const activities = await sql`SELECT kind FROM os_activities WHERE lead_id = ${lead.id} ORDER BY created_at`
  check('a second enquiry from the same email attaches to the existing lead', repeat.status === 'done' && (repeat.result.data as { outcome?: string }).outcome === 'matched' && after.n === 1)
  check('…and is recorded on its timeline', activities.some((a) => a.kind === 'lead_created') && activities.some((a) => a.kind === 'enquiry_received'))
  const unanswerable = await runCapability(sql, { requestId: `${run}-noreach`, actor: 'bureau:intake', channel: 'bureau', capability: 'lead.intake',
    input: { source, external_ref: randomUUID(), name: 'Nobody' } })
  check('an enquiry with neither email nor phone is refused, not stored', unanswerable.status === 'refused')
  const [noApprovals] = await sql`SELECT count(*)::int AS n FROM os_approvals WHERE requested_by = 'bureau:intake' AND created_at > now() - interval '5 minutes'`
  check('intake creates no approval and needs none (GREEN, no external effect beyond the owner notice)', noApprovals.n === 0)

  /* ── agent events: projection, idempotency, attention ──────────────── */
  const eventId = `${run}-evt-1`
  const ev = { id: eventId, kind: 'failed', severity: 'warning', title: `${run} intake could not reach the OS`, occurredAt: new Date().toISOString(), runId: 'run-1', businessRef: { kind: 'lead', id: lead.id } }
  const stored = await recordAgentEvents(sql, { client: 'bureau', actor: 'bureau:intake', events: [ev] })
  const resent = await recordAgentEvents(sql, { client: 'bureau', actor: 'bureau:intake', events: [ev] })
  check('an agent event is stored once; a resend is a duplicate', stored.status === 'done' && stored.accepted === 1 && resent.status === 'done' && resent.accepted === 0 && resent.duplicates === 1)
  const bad = await recordAgentEvents(sql, { client: 'bureau', actor: 'bureau:intake', events: [{ ...ev, id: `${run}-evt-ok` }, { ...ev, id: `${run}-evt-bad`, kind: 'deleted_everything' }] })
  const [partial] = await sql`SELECT count(*)::int AS n FROM os_agent_events WHERE event_id = ${`${run}-evt-ok`}`
  check('a batch with one malformed event stores nothing', bad.status === 'refused' && partial.n === 0)
  const dangling = await recordAgentEvents(sql, { client: 'bureau', actor: 'bureau:intake', events: [{ ...ev, id: `${run}-evt-dangling`, approvalId: randomUUID() }] })
  const [dang] = await sql`SELECT approval_id FROM os_agent_events WHERE event_id = ${`${run}-evt-dangling`}`
  check('an event naming an approval that does not exist is kept without the false reference', dangling.status === 'done' && dang.approval_id === null)
  const legacyEvents = await recordAgentEvents(sql, { client: 'legacy', actor: 'telegram:1', events: [ev] })
  check('only the Agent Bureau may report agent events', legacyEvents.status === 'refused')
  const now = new Date()
  const ctx = { sql, actor: OWNER_ACTOR, channel: 'os', now, today: berlinDate(now), committed: () => {} }
  const snap = await attentionSnapshot(ctx)
  const ours = snap.agentEvents.find((e: { title: string }) => e.title === ev.title)
  check('the agent failure appears in /os attention under AGENT', !!ours && snap.counts.AGENT >= 1 && snap.items.some((i: { area: string; text: string }) => i.area === 'AGENT' && i.text.includes(run)))
  /* Risk 109: /os renders each item in the viewer's locale from a key and its record values. */
  const { OS_DICTIONARY } = await import('@/lib/os-i18n/dictionary')
  const viewsSource = readFileSync(resolve(root, 'apps/web/lib/commercial/capabilities/views.ts'), 'utf8')
  const union = viewsSource.slice(viewsSource.indexOf('export type AttentionKey ='), viewsSource.indexOf('export interface AttentionMessage'))
  const keys = [...union.matchAll(/'([a-zA-Z]+)'/g)].map((k) => k[1])
  const sample = { lead: 'L', days: 3, since: '2026-10-01', reason: 'R', number: 'N', client: 'C', amount: '1 €', date: '2026-10-02', title: 'T', service: 'S', severity: 'high', status: 'open', count: 2, operation: 'O', agent: 'intake', kind: 'failed' }
  const dict = (l: 'de' | 'en') => OS_DICTIONARY[l].attention.items as Record<string, (p: typeof sample) => string>
  check(`every attention key (${keys.length}) has a German and an English sentence, and they differ`,
    keys.length >= 18 && keys.every((k) => typeof dict('de')[k] === 'function' && typeof dict('en')[k] === 'function' && dict('de')[k](sample) !== dict('en')[k](sample)))
  const enquiryItem = snap.items.find((i: { msg?: { key: string; params: Record<string, string | number> } }) => i.msg?.key === 'enquiryNew' && String(i.msg.params.source) === source)
  check('an enquiry received through intake and still unanswered is a SALES attention item', !!enquiryItem)
  const agentItem = snap.items.find((i: { area: string; text: string }) => i.area === 'AGENT' && i.text.includes(run)) as { msg: { key: string; params: typeof sample } } | undefined
  check('the live agent item carries its key and values; German renders it in German', agentItem?.msg.key === 'agentEvent' && dict('de').agentEvent(agentItem.msg.params).includes('ist fehlgeschlagen') && dict('de').agentEvent(agentItem.msg.params).includes(run))
  const owner = await runCapability(sql, { requestId: `${run}-notices`, actor: 'telegram:1', channel: 'telegram', capability: 'owner.notices', input: {} })
  check('…and in owner.notices, once, keyed by the event (the future Telegram owner plane)',
    owner.status === 'done' && (((owner as { result: { data: unknown } }).result.data as { notices: { key: string }[] }).notices.filter((n) => n.key === `agent:${ours!.id}`).length === 1))
  check('acknowledging removes it', await acknowledgeAgentEvent(sql, ours!.id, OWNER_ACTOR) && !(await attentionSnapshot(ctx)).agentEvents.some((e: { id: string }) => e.id === ours!.id))
  check('acknowledging twice is refused (no silent double decision)', !(await acknowledgeAgentEvent(sql, ours!.id, OWNER_ACTOR)))

  /* ── approvals: requester/executor binding ─────────────────────────── */
  const mkApproval = async (by: string) => (await sql`
    INSERT INTO os_approvals (capability, risk, summary, preview, payload, payload_hash, expires_at, requested_by)
    VALUES ('evidence.noop', 'AMBER', ${`${run} noop`}, '{}'::jsonb, '{}'::jsonb, ${'f'.repeat(64)}, now() + interval '10 minutes', ${by})
    RETURNING id`)[0].id as string
  const bureauAsk = await mkApproval('bureau:intake')
  const stolen = await executeApproval(sql, { approvalId: bureauAsk, payloadHash: 'f'.repeat(64), actor: 'telegram:1', channel: 'telegram' })
  const [still] = await sql`SELECT status FROM os_approvals WHERE id = ${bureauAsk}`
  check('another interface cannot execute an approval an agent requested', stolen.status === 'refused' && (stolen as { code: string }).code === 'not_requester' && still.status === 'pending')
  const rejectSteal = await rejectApproval(sql, { approvalId: bureauAsk, actor: 'telegram:1', channel: 'telegram' })
  check('…nor reject it', rejectSteal.status === 'refused')
  const ownerDecides = await executeApproval(sql, { approvalId: bureauAsk, payloadHash: 'f'.repeat(64), actor: OWNER_ACTOR, channel: 'os' })
  const [decided] = await sql`SELECT status, decided_by FROM os_approvals WHERE id = ${bureauAsk}`
  check('the owner in /os passes the binding (an unknown capability then fails safely, nothing executed)', ownerDecides.status === 'refused' && decided.decided_by === OWNER_ACTOR && decided.status === 'failed')
  const ownAsk = await mkApproval('os:marcel')
  const scoped = await runCapability(sql, { requestId: `${run}-requested`, actor: 'bureau:intake', channel: 'bureau', capability: 'approvals.requested', input: {} })
  const seen = ((scoped as { result: { data: { approvals: { id: string }[] } } }).result).data.approvals.map((a) => a.id)
  check('approvals.requested shows the Bureau its own requests and never the owner’s', scoped.status === 'done' && seen.includes(bureauAsk) && !seen.includes(ownAsk))
  await sql`UPDATE os_approvals SET status = 'rejected' WHERE id = ${ownAsk}`

  console.log(`CONTROL PLANES: ${passed} checks passed against isolated evidence DB; nothing sent`)
} finally {
  /* Evidence rows from this run only, identified by their markers. */
  await sql`DELETE FROM os_agent_events WHERE title LIKE ${run + '%'}`.catch(() => {})
  await sql`DELETE FROM os_approvals WHERE summary LIKE ${run + '%'}`.catch(() => {})
  await sql`DELETE FROM os_activities WHERE lead_id IN (SELECT id FROM os_leads WHERE lower(email) = ${`${run.toLowerCase()}@example.invalid`})`.catch(() => {})
  await sql`DELETE FROM os_intake_receipts WHERE source = ${source}`.catch(() => {})
  await sql`DELETE FROM os_leads WHERE lower(email) = ${`${run.toLowerCase()}@example.invalid`}`.catch(() => {})
}
