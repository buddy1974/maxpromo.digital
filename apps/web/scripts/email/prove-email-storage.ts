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
import { Pool } from '@neondatabase/serverless'
import { getDb } from '../../lib/db.ts'
import { evidenceDbProblem, EVIDENCE_DB_ENV, EVIDENCE_DOC_PREFIX } from '../../../../packages/config/evidence.ts'

const root = resolve(import.meta.dirname, '../../../..')
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
process.env.MAXPROMO_EVIDENCE_MODE='1'
process.env[EVIDENCE_DB_ENV]=target
const sql = getDb()
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
const leadId = randomUUID(); const clientId = randomUUID(); const emptyLeadId = randomUUID()
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
    // Remove only this mission's earlier evidence-only prototype signature, never data.
    await client.query('DROP FUNCTION IF EXISTS mail.complete_content(uuid,uuid,text,jsonb)')
    await client.query(readFileSync(resolve(root, 'apps/web/db/migrations/0014-hostinger-contract.sql'), 'utf8'))
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
  await sql`UPDATE mail.accounts SET provider='hostinger' WHERE id=${account}`
  const contract={deliveryId:randomUUID() as string,eventId:`contract:${randomUUID()}`,mailbox:sender,messageId:`<${randomUUID()}@example.invalid>`,inReplyTo:'',references:[] as string[],
    subject:'Contract enquiry',sender,recipients:['owner@example.invalid'],cc:[],eventAt:new Date().toISOString(),emailDate:'2026-04-03T06:21:33Z',previewText:'Preview only',
    attachments:[{id:'attachment-1',filename:'document.pdf',size:5,contentType:'application/octet-stream'}],classification:'lead',needsReply:true}
  const expires=new Date(Date.now()+60*60*1000).toISOString()
  const accept=async(p:typeof contract)=>await sql`SELECT * FROM mail.accept_hostinger(${account},${JSON.stringify(p)}::jsonb,'{"ciphertext":"synthetic-ciphertext-not-url"}'::jsonb,${expires}::timestamptz)`
  const contractRace=await Promise.all(Array.from({length:12},()=>accept(contract)))
  check('real Hostinger delivery race accepts exactly once',contractRace.filter(result=>result[0]?.created).length===1)
  const [accepted]=await sql`SELECT m.*,t.updated_at FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id WHERE m.account_id=${account} AND provider_message_id=${contract.eventId}`
  check('eventId is mailbox message identity and preview is not authoritative body',accepted.provider_message_id===contract.eventId && accepted.body_state==='preview' && accepted.body_text==='' && accepted.preview_text===contract.previewText)
  check('provider event timestamp and email Date are stored independently',new Date(accepted.event_at).toISOString()===contract.eventAt && new Date(accepted.email_date).toISOString()==='2026-04-03T06:21:33.000Z')
  const secondDelivery={...contract,deliveryId:randomUUID()}
  check('same event through a different webhook delivery does not ingest twice',!(await accept(secondDelivery))[0].created)
  const [durable]=await sql`SELECT (SELECT count(*)::int FROM mail.deliveries WHERE account_id=${account} AND provider_event_id=${contract.eventId}) AS deliveries,
    (SELECT count(*)::int FROM mail.content_jobs WHERE message_id=${accepted.id}) AS jobs,
    (SELECT count(*)::int FROM mail.content_assets WHERE message_id=${accepted.id}) AS assets`
  check('distinct deliveries retained while content work/assets remain once',durable.deliveries===2 && durable.jobs===1 && durable.assets===1)
  const [afterDuplicate]=await sql`SELECT updated_at FROM mail.threads WHERE id=${accepted.thread_id}`
  check('duplicates cannot generate new owner notice timestamp',new Date(afterDuplicate.updated_at).getTime()===new Date(accepted.updated_at).getTime())
  const [noEffects]=await sql`SELECT j.attempts,(SELECT count(*)::int FROM mail.action_audit WHERE thread_id=${accepted.thread_id}) AS actions FROM mail.content_jobs j WHERE j.message_id=${accepted.id}`
  check('webhook acceptance runs no AI or outbound action',noEffects.attempts===0 && noEffects.actions===0)
  check('delivery ID cannot be rebound to another event',await rejected(()=>accept({...contract,eventId:'different-event'})))
  check('database mailbox binding rejects a different mailbox',await rejected(()=>accept({...contract,deliveryId:randomUUID(),eventId:'wrong-mailbox-event',mailbox:'other@example.invalid'})))
  const [leadCount]=await sql`SELECT count(*)::int AS n FROM os_leads WHERE email=${sender}`
  check('duplicate webhook acceptance cannot create leads',leadCount.n===1)
  const reply={...contract,deliveryId:randomUUID(),eventId:`reply:${randomUUID()}`,messageId:`<${randomUUID()}@example.invalid>`,inReplyTo:contract.messageId,references:[contract.messageId],attachments:[]}
  const replyResult=(await accept(reply))[0]
  check('RFC reply references reconstruct same-sender thread',replyResult.thread_id===accepted.thread_id)
  const foreignReply={...reply,deliveryId:randomUUID(),eventId:`foreign:${randomUUID()}`,messageId:`<${randomUUID()}@example.invalid>`,sender:'stranger@example.invalid'}
  check('spoofed reference from another sender cannot join business thread',(await accept(foreignReply))[0].thread_id!==accepted.thread_id)
  const sameSubject={...contract,deliveryId:randomUUID(),eventId:`subject:${randomUUID()}`,messageId:`<${randomUUID()}@example.invalid>`,attachments:[]}
  check('subject matching alone never merges threads',(await accept(sameSubject))[0].thread_id!==accepted.thread_id)
  // Provider IDs are opaque: printable characters Hostinger never promised to avoid stay literal parameters.
  const opaque={...contract,deliveryId:`delivery "quoted"/${randomUUID()}`,eventId:`opaque id/with 'quotes'; -- \u00fcnicode \u2603${randomUUID()}`,messageId:'',attachments:[]}
  const opaqueRace=await Promise.all(Array.from({length:4},()=>accept(opaque)))
  const [opaqueRow]=await sql`SELECT provider_message_id FROM mail.messages WHERE account_id=${account} AND provider_message_id=${opaque.eventId}`
  check('opaque provider identifiers round-trip exactly and dedupe once',opaqueRace.filter(result=>result[0]?.created).length===1 && opaqueRow?.provider_message_id===opaque.eventId)
  // Unknown senders use a reserved .invalid address; even a lead with an empty email never matches.
  await sql`INSERT INTO os_leads(id,name,email,source) VALUES(${emptyLeadId}::uuid,${account},'','manual')`
  const unknown={...contract,deliveryId:randomUUID(),eventId:`unknown:${randomUUID()}`,messageId:'',sender:'unknown-sender@sender.invalid',attachments:[{id:'large-0',filename:'large.bin',size:50*1024*1024,contentType:'application/octet-stream'}]}
  const unknownResult=(await accept(unknown))[0]
  const [unknownLinks]=await sql`SELECT count(*)::int AS n FROM mail.business_links WHERE thread_id=${unknownResult.thread_id}::uuid`
  check('unknown sender never links to CRM records',unknownResult.created && unknownLinks.n===0)
  const [large]=await sql`SELECT size_bytes FROM mail.content_assets WHERE message_id=${unknownResult.message_id}::uuid`
  check('attachment metadata above the download limit is retained, not refused',Number(large.size_bytes)===50*1024*1024)
  const [job]=await sql`UPDATE mail.content_jobs SET state='processing',lease_token=gen_random_uuid(),lease_until=now()+interval '1 minute' WHERE message_id=${accepted.id} RETURNING id,lease_token`
  const [wrongLease]=await sql`SELECT mail.complete_content(${job.id},${randomUUID()},'Full body','[]'::jsonb,'other',false) AS done`
  check('stale content worker cannot complete another lease',wrongLease.done===false)
  const asset=[{id:'attachment-1',storageRef:'private:sha256-fixture',sha256:'a'.repeat(64),size:5,contentType:'application/pdf'}]
  const [completion]=await sql`SELECT mail.complete_content(${job.id},${job.lease_token},'Full body beyond a 200-character preview: urgent security incident',${JSON.stringify(asset)}::jsonb,'system',true) AS done`
  const [retained]=await sql`SELECT m.body_state,m.body_text,j.sealed_locator,a.storage_ref FROM mail.messages m JOIN mail.content_jobs j ON j.message_id=m.id JOIN mail.content_assets a ON a.message_id=m.id WHERE m.id=${accepted.id}`
  check('full body and private durable attachment reference commit together',completion.done && retained.body_state==='complete' && retained.body_text.startsWith('Full body') && retained.storage_ref===asset[0].storageRef)
  check('completed content clears temporary locator ciphertext',JSON.stringify(retained.sealed_locator)==='{}')
  const [fullTriage]=await sql`SELECT classification FROM mail.threads WHERE id=${accepted.thread_id}`
  check('authoritative full body can escalate preview triage atomically',fullTriage.classification==='system')
  const [completeReplay]=await sql`SELECT mail.complete_content(${job.id},${job.lease_token},'Changed on replay',${JSON.stringify(asset)}::jsonb,'other',false) AS done`
  check('completed content replay cannot overwrite authoritative body',completeReplay.done===false)
  await accept(contract)
  const [retryBody]=await sql`SELECT body_state,body_text FROM mail.messages WHERE id=${accepted.id}`
  check('webhook retry cannot replace completed full body with its preview',retryBody.body_state==='complete' && retryBody.body_text===retained.body_text)
  // Compare complete rows, not just counts: a replay must preserve bodies, leases,
  // attachment references, owner triage and the related synthetic CRM records.
  // Every snapshot predicate is restricted to this run's randomly named fixture.
  const replayClient = await pool.connect()
  try {
    await replayClient.query('BEGIN')
    const snapshot = async () => {
      const result = await replayClient.query<{ mail: unknown; business: unknown }>(`
        SELECT jsonb_build_object(
          'accounts', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.id),'[]'::jsonb) FROM mail.accounts a WHERE a.id=$1),
          'threads', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]'::jsonb) FROM mail.threads t WHERE t.account_id=$1),
          'messages', (SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.id),'[]'::jsonb) FROM mail.messages m WHERE m.account_id=$1),
          'links', (SELECT coalesce(jsonb_agg(to_jsonb(b) ORDER BY b.thread_id,b.entity_kind,b.entity_id),'[]'::jsonb) FROM mail.business_links b JOIN mail.threads t ON t.id=b.thread_id WHERE t.account_id=$1),
          'events', (SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.id),'[]'::jsonb) FROM mail.events e WHERE e.account_id=$1),
          'audit', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.id),'[]'::jsonb) FROM mail.action_audit a JOIN mail.threads t ON t.id=a.thread_id WHERE t.account_id=$1),
          'deliveries', (SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.delivery_id),'[]'::jsonb) FROM mail.deliveries d WHERE d.account_id=$1),
          'jobs', (SELECT coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.id),'[]'::jsonb) FROM mail.content_jobs j JOIN mail.messages m ON m.id=j.message_id WHERE m.account_id=$1),
          'assets', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.id),'[]'::jsonb) FROM mail.content_assets a JOIN mail.messages m ON m.id=a.message_id WHERE m.account_id=$1)
        ) AS mail,
        jsonb_build_object(
          'lead', (SELECT to_jsonb(l) FROM os_leads l WHERE l.id=$2::uuid AND l.name=$1),
          'client', (SELECT to_jsonb(c) FROM os_clients c WHERE c.id=$3::uuid AND c.name=$1)
        ) AS business`, [account, leadId, clientId])
      return result.rows[0]
    }
    const beforeReplay = await snapshot()
    for (let replay = 1; replay <= 2; replay++) {
      await replayClient.query(readFileSync(resolve(root, 'apps/web/db/migrations/0013-email-channel.sql'), 'utf8'))
      await replayClient.query(readFileSync(resolve(root, 'apps/web/db/migrations/0014-hostinger-contract.sql'), 'utf8'))
      const afterReplay = await snapshot()
      check(`migration replay ${replay} preserves complete synthetic mail rows`, JSON.stringify(afterReplay.mail) === JSON.stringify(beforeReplay.mail))
      check(`migration replay ${replay} preserves complete synthetic lead/client rows`, JSON.stringify(afterReplay.business) === JSON.stringify(beforeReplay.business))
    }
    await replayClient.query('COMMIT')
  } catch (error) { await replayClient.query('ROLLBACK'); throw error } finally { replayClient.release() }
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
      await sql`DELETE FROM mail.content_assets WHERE message_id IN (SELECT id FROM mail.messages WHERE account_id=${account})`
      await sql`DELETE FROM mail.content_jobs WHERE message_id IN (SELECT id FROM mail.messages WHERE account_id=${account})`
      await sql`DELETE FROM mail.deliveries WHERE account_id=${account}`
      await sql`DELETE FROM mail.events WHERE account_id=${account}`
      await sql`DELETE FROM mail.messages WHERE account_id=${account}`
      await sql`DELETE FROM mail.threads WHERE account_id=${account}`
      await sql`DELETE FROM mail.accounts WHERE id=${account}`
      await sql`DELETE FROM os_leads WHERE id IN (${leadId}::uuid,${emptyLeadId}::uuid) AND name=${account}`
      await sql`DELETE FROM os_clients WHERE id=${clientId}::uuid AND name=${account}`
      console.log('PASS cleaned only this run\'s MAIL-EVIDENCE rows')
    } catch { console.error(`EMAIL STORAGE: cleanup required for synthetic account ${account}`); process.exitCode = 1 }
  }
  await pool.end()
}
