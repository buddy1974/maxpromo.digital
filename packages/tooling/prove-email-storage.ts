/** Real SQL proof, exclusively against an isolated EVIDENCE_DATABASE_URL.
 * Never sends mail. Only the additive mail migration and this run's synthetic rows are written.
 * Run: npm run prove:email-storage
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { setDefaultResultOrder } from 'node:dns'
import { stripTypeScriptTypes } from 'node:module'
import { neon, Pool } from '@neondatabase/serverless'
import { evidenceDbProblem, EVIDENCE_DB_ENV, EVIDENCE_DOC_PREFIX } from '../config/evidence.ts'

const root = resolve(import.meta.dirname, '../..')
const env: NodeJS.ProcessEnv = { ...process.env }
const productionTargets: { name: string; value: string }[] = []
for (const name of ['NEON_DATABASE_URL', 'DATABASE_URL']) if (env[name]) productionTargets.push({ name, value: env[name]! })
// Read only these database variables. Do not execute dotenv text or print values.
const allowed = new Set(['EVIDENCE_DATABASE_URL', 'DATABASE_URL', 'NEON_DATABASE_URL'])
const envFile = resolve(root, 'apps/web/.env.local')
if (existsSync(envFile)) {
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
if (problem) { console.error(`EMAIL STORAGE: unavailable — ${problem}`); process.exit(2) }
const target = env[EVIDENCE_DB_ENV]!
// URL comparison additionally catches equivalent URLs with different query parameters.
function databaseIdentity(value: string): string {
  const url = new URL(value)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database URL')
  return `${url.hostname.toLowerCase()}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`
}
for (const { name, value } of productionTargets) {
  if (databaseIdentity(target) === databaseIdentity(value)) {
    console.error(`EMAIL STORAGE: refusing — evidence target identifies the same database as ${name}`); process.exit(2)
  }
}
setDefaultResultOrder('ipv4first')
const sql = neon(target)
const pool = new Pool({ connectionString: target, connectionTimeoutMillis: 15_000 })
const moduleUrl = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const normalizationUrl = moduleUrl(stripTypeScriptTypes(readFileSync(resolve(root, 'apps/web/lib/mail/normalization.ts'), 'utf8')))
const storeSource = stripTypeScriptTypes(readFileSync(resolve(root, 'apps/web/lib/mail/store.ts'), 'utf8')).replace("from './normalization'", `from '${normalizationUrl}'`)
const store = await import(moduleUrl(storeSource))
type Inbound = { accountId: string; messageId: string; threadId: string; sender: string; recipients: string[]; cc: string[]; subject: string; text: string; receivedAt: string; attachments: never[] }
const ingest = store.ingestMail as (sql: unknown, input: Inbound) => Promise<boolean>
const suggest = store.suggestBusinessLinks as (sql: unknown, thread: string, sender: string) => Promise<void>
const account = `MAIL-EVIDENCE-${randomUUID()}`
const sender = `${account.toLowerCase()}@example.invalid`
const leadId = randomUUID(); const clientId = randomUUID()
let created = false; let passed = 0
function check(name: string, result: boolean) { assert.ok(result, name); passed++; console.log(`PASS ${name}`) }
async function rejected(query: () => Promise<unknown>): Promise<boolean> { try { await query(); return false } catch { return true } }
try {
  const [foreign] = await sql`SELECT count(*)::int AS n FROM os_invoices WHERE invoice_number NOT LIKE ${EVIDENCE_DOC_PREFIX + '%'}`
  if (Number(foreign.n) > 0) throw new Error('Evidence target contains non-evidence invoices; refusing migration')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(readFileSync(resolve(root, 'apps/web/db/migrations/0013-email-channel.sql'), 'utf8'))
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
  console.log('PASS additive mail migration applied only to guarded evidence target')
  await sql`INSERT INTO mail.accounts(id,address,provider,enabled) VALUES(${account},${sender},'evidence',true)`
  created = true
  const base: Inbound = { accountId: account, messageId: 'fixture-1', threadId: 'fixture-thread', sender, recipients: ['owner@example.invalid'], cc: [], subject: 'Automation inquiry', text: 'Synthetic evidence only.', receivedAt: '2026-10-22T10:00:00Z', attachments: [] }
  const race = await Promise.all(Array.from({ length: 12 }, () => ingest(sql, base)))
  check('12 concurrent duplicate deliveries commit exactly one message', race.filter(Boolean).length === 1)
  const [counts] = await sql`SELECT (SELECT count(*)::int FROM mail.messages WHERE account_id=${account}) AS messages,
    (SELECT count(*)::int FROM mail.events WHERE account_id=${account}) AS events,
    (SELECT count(*)::int FROM mail.threads WHERE account_id=${account}) AS threads`
  check('dedupe leaves exactly one message, event and thread', counts.messages === 1 && counts.events === 1 && counts.threads === 1)
  const [thread] = await sql`SELECT id,needs_reply FROM mail.threads WHERE account_id=${account}`
  check('real classifier sets reply attention', thread.needs_reply === true)
  const [event] = await sql`SELECT thread_id FROM mail.events WHERE account_id=${account}`
  check('claimed event references committed thread', event.thread_id === thread.id)
  await ingest(sql, { ...base, messageId: 'fixture-2', receivedAt: '2026-10-21T10:00:00Z', subject: 'Newsletter', text: 'unsubscribe' })
  const [latest] = await sql`SELECT updated_at,needs_reply FROM mail.threads WHERE id=${thread.id}`
  check('late old delivery preserves latest timestamp and reply attention', new Date(latest.updated_at).toISOString() === base.receivedAt.replace('Z', '.000Z') && latest.needs_reply === true)
  await ingest(sql, { ...base, messageId: 'routine-first', threadId: 'routine-then-urgent', subject: 'Newsletter', text: 'unsubscribe' })
  await ingest(sql, { ...base, messageId: 'urgent-followup', threadId: 'routine-then-urgent', subject: 'Security incident', text: 'urgent issue unsubscribe' })
  const [escalated] = await sql`SELECT classification,needs_reply FROM mail.threads WHERE account_id=${account} AND provider_thread_id='routine-then-urgent'`
  check('urgent follow-up escapes routine suppression', escalated.classification === 'system' && escalated.needs_reply === true)
  await sql`UPDATE mail.accounts SET enabled=false WHERE id=${account}`
  check('disabled account cannot ingest', !(await ingest(sql, { ...base, messageId: 'disabled' })))
  check('unknown account cannot ingest', !(await ingest(sql, { ...base, accountId: `${account}-missing`, messageId: 'unknown' })))
  await sql`INSERT INTO os_leads(id,name,email,source) VALUES(${leadId}::uuid,${account},${sender},'manual')`
  await sql`INSERT INTO os_clients(id,name,email) VALUES(${clientId}::uuid,${account},${sender})`
  await ingest(sql, { ...base, sender: 'changed-retry@example.invalid', threadId: 'forged-retry-thread' })
  const retryLinks = await sql`SELECT entity_id FROM mail.business_links WHERE thread_id=${thread.id}`
  check('changed replay cannot replace sender or thread; repairs use stored identity', retryLinks.length === 2 && retryLinks.some(link => link.entity_id === leadId) && retryLinks.some(link => link.entity_id === clientId))
  await suggest(sql, thread.id, sender)
  await suggest(sql, thread.id, sender)
  const links = await sql`SELECT entity_kind,entity_id,match_status FROM mail.business_links WHERE thread_id=${thread.id}`
  check('real CRM lookup creates two deduplicated possible links', links.length === 2 && links.every(link => link.match_status === 'possible') && links.some(link => link.entity_id === leadId) && links.some(link => link.entity_id === clientId))
  await sql`UPDATE mail.accounts SET enabled=true WHERE id=${account}`
  const clientMessage = { ...base, messageId: 'client-attention', threadId: 'client-thread', subject: 'Hello', text: 'Can we talk?' }
  await ingest(sql, clientMessage)
  const [clientThread] = await sql`SELECT id,classification,needs_reply FROM mail.threads WHERE account_id=${account} AND provider_thread_id='client-thread'`
  check('known-client email relationship raises attention without confirming association', clientThread.needs_reply === true && clientThread.classification === 'client')
  await sql`UPDATE mail.threads SET needs_reply=false WHERE id=${clientThread.id}`
  await ingest(sql, clientMessage)
  const [triaged] = await sql`SELECT needs_reply FROM mail.threads WHERE id=${clientThread.id}`
  check('duplicate delivery cannot undo owner triage', triaged.needs_reply === false)
  await ingest(sql, { ...base, messageId: 'client-newsletter', threadId: 'client-routine', subject: 'Newsletter', text: 'unsubscribe' })
  const [routine] = await sql`SELECT needs_reply FROM mail.threads WHERE account_id=${account} AND provider_thread_id='client-routine'`
  check('routine mail from known relationship does not create attention', routine.needs_reply === false)
  check('invalid business kind rejected by database', await rejected(() => sql`INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status) VALUES(${thread.id},'invalid','fixture','possible')`))
  check('invalid link confidence rejected by database', await rejected(() => sql`INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status) VALUES(${thread.id},'lead','fixture','trusted')`))
  check('unknown thread link rejected by foreign key', await rejected(() => sql`INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status) VALUES(${randomUUID()},'lead','fixture','possible')`))
  check('duplicate mailbox identity rejected by unique key', await rejected(() => sql`INSERT INTO mail.accounts(id,address,provider) VALUES(${account + '-duplicate'},${sender},'evidence')`))
  console.log(`EMAIL STORAGE: ${passed} checks passed against isolated evidence DB; no real mail used`)
} catch (error) {
  // Driver errors can include URLs/SQL parameters. Print only a safe classification.
  const message = error instanceof Error ? error.message : ''
  console.error(`EMAIL STORAGE: failed — ${/fetch|connect|timeout|ENOTFOUND|ECONN|ETIMEDOUT/i.test(message) ? 'evidence database unavailable' : 'assertion or database operation failed; inspect locally without printing credentials'}`)
  process.exitCode = 1
} finally {
  if (created) {
    try {
      await sql`DELETE FROM mail.business_links WHERE thread_id IN (SELECT id FROM mail.threads WHERE account_id=${account})`
      await sql`DELETE FROM mail.events WHERE account_id=${account}`
      await sql`DELETE FROM mail.messages WHERE account_id=${account}`
      await sql`DELETE FROM mail.threads WHERE account_id=${account}`
      await sql`DELETE FROM mail.accounts WHERE id=${account}`
      await sql`DELETE FROM os_leads WHERE id=${leadId}::uuid AND name=${account}`
      await sql`DELETE FROM os_clients WHERE id=${clientId}::uuid AND name=${account}`
      console.log('PASS cleaned only this run\'s MAIL-EVIDENCE rows')
    } catch { console.error(`EMAIL STORAGE: cleanup required for synthetic account ${account}`); process.exitCode = 1 }
  }
  await pool.end()
}
