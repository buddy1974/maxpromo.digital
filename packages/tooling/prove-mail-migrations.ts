/** Fresh PostgreSQL proof. No environment files, network, ports, persistent volumes or production DB. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const container = `maxpromo-mail-migration-${randomUUID()}`
let started = false
let passed = 0
function docker(args: string[], input?: string, allowFailure = false) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })
  if (!allowFailure && (result.error || result.status !== 0)) throw new Error('Isolated Docker/PostgreSQL operation failed')
  return result
}
function sql(input: string, allowFailure = false) {
  return docker(['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], input, allowFailure)
}
function check(name: string, condition: boolean) {
  assert.ok(condition, name); passed++; console.log(`PASS ${name}`)
}
const migration13 = readFileSync(resolve(root, 'apps/web/db/migrations/0013-email-channel.sql'), 'utf8')
const migration14 = readFileSync(resolve(root, 'apps/web/db/migrations/0014-hostinger-contract.sql'), 'utf8')
try {
  docker(['run', '-d', '--rm', '--pull=never', '--network', 'none', '--tmpfs', '/var/lib/postgresql/data', '--name', container,
    '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17-alpine'])
  started = true
  const deadline = Date.now() + 30_000
  while (docker(['exec', container, 'pg_isready', '-U', 'postgres'], undefined, true).status !== 0) {
    if (Date.now() >= deadline) throw new Error('Isolated PostgreSQL startup timed out')
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
  }
  const inspected = JSON.parse(docker(['inspect', container]).stdout)[0] as {
    HostConfig: { NetworkMode: string; PortBindings: Record<string, unknown> | null; Binds: unknown[] | null }
    Mounts: { Type: string }[]
  }
  check('container has no network, published ports or host volumes', inspected.HostConfig.NetworkMode === 'none'
    && Object.keys(inspected.HostConfig.PortBindings ?? {}).length === 0 && !(inspected.HostConfig.Binds?.length)
    && inspected.Mounts.every(mount => mount.Type === 'tmpfs'))
  sql(readFileSync(resolve(root, 'apps/web/db/schema.sql'), 'utf8') + '\n' + migration13 + '\n' + migration14)
  check('baseline plus only mail migrations applies to fresh PostgreSQL 17', sql("SELECT to_regclass('mail.messages') IS NOT NULL AND to_regclass('chat.sessions') IS NULL AND to_regclass('os_approvals') IS NULL;").stdout.trim() === 't')
  check('migrations do not provision or enable any account', sql('SELECT count(*) FROM mail.accounts;').stdout.trim() === '0')
  sql(`
    INSERT INTO os_clients(id,name,email) VALUES('00000000-0000-0000-0000-000000000101','Synthetic baseline client','sender@example.invalid');
    INSERT INTO os_leads(id,name,email,source) VALUES('00000000-0000-0000-0000-000000000102','Synthetic baseline lead','sender@example.invalid','manual');
    INSERT INTO mail.accounts(id,address,provider,enabled) VALUES('fixture','owner@example.invalid','hostinger',true);
    SELECT * FROM mail.accept_hostinger('fixture','{
      "deliveryId":"delivery-1","eventId":"event-1","mailbox":"owner@example.invalid",
      "messageId":"<one@example.invalid>","inReplyTo":"","references":[],
      "subject":"Synthetic enquiry","sender":"sender@example.invalid","recipients":["owner@example.invalid"],"cc":[],
      "eventAt":"2026-10-22T10:00:00Z","emailDate":"2026-10-22T09:00:00Z","previewText":"Synthetic preview",
      "attachments":[{"id":"a1","filename":"fixture.pdf","size":5}],"classification":"lead","needsReply":true
    }'::jsonb,'{}'::jsonb,'2026-10-23T10:00:00Z');
  `)
  check('actual acceptance works without commercial or WhatsApp migrations', sql("SELECT (SELECT count(*) FROM mail.messages)=1 AND (SELECT count(*) FROM mail.business_links)=2 AND (SELECT count(*) FROM mail.content_assets)=1;").stdout.trim() === 't')
  // Stable JSON captures every column in all mail and seeded business tables.
  const snapshot = `SELECT jsonb_object_agg(name,rows ORDER BY name) FROM (
    SELECT 'accounts' name,coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') rows FROM mail.accounts t
    UNION ALL SELECT 'threads',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM mail.threads t
    UNION ALL SELECT 'messages',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM mail.messages t
    UNION ALL SELECT 'links',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.thread_id,t.entity_kind,t.entity_id),'[]') FROM mail.business_links t
    UNION ALL SELECT 'events',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM mail.events t
    UNION ALL SELECT 'audit',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM mail.action_audit t
    UNION ALL SELECT 'deliveries',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.account_id,t.delivery_id),'[]') FROM mail.deliveries t
    UNION ALL SELECT 'jobs',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM mail.content_jobs t
    UNION ALL SELECT 'assets',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM mail.content_assets t
    UNION ALL SELECT 'clients',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM os_clients t
    UNION ALL SELECT 'leads',coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]') FROM os_leads t
  ) s;`
  const before = sql(snapshot).stdout.trim()
  for (let replay = 1; replay <= 2; replay++) {
    sql(`BEGIN;\n${migration13}\n${migration14}\nCOMMIT;`)
    check(`populated fresh migration replay ${replay} preserves every row`, sql(snapshot).stdout.trim() === before)
  }
  const failed = sql("BEGIN; UPDATE os_clients SET name='Must roll back'; CREATE TABLE mail.must_roll_back(id integer); SELECT 1/0; COMMIT;", true)
  check('deliberate transaction failure is detected', failed.status !== 0)
  check('failed migration transaction preserves existing business and mail rows', sql(snapshot).stdout.trim() === before)
  check('failed migration transaction leaves no partial schema change', sql("SELECT to_regclass('mail.must_roll_back') IS NULL;").stdout.trim() === 't')
  console.log(`MAIL MIGRATIONS: ${passed} checks passed on fresh isolated PostgreSQL 17; no production access`)
} catch {
  console.error('MAIL MIGRATIONS: failed; isolated Docker/PostgreSQL assertion or operation failed')
  process.exitCode = 1
} finally {
  if (started) {
    const stopped = docker(['stop', '--time', '1', container], undefined, true)
    if (stopped.status !== 0) { console.error('MAIL MIGRATIONS: isolated container cleanup failed'); process.exitCode = 1 }
  }
}
