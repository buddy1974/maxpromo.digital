#!/usr/bin/env node
/**
 * apps/bureau/scripts/migrate-to-eu.mjs — move the Agent Bureau database to an
 * EU-region Neon project with proof (ADR-0021, EU infrastructure decision).
 *
 *   node apps/bureau/scripts/migrate-to-eu.mjs --rehearse <source-env-file>
 *       Dumps the source read-only, restores it into a throwaway local Docker
 *       PostgreSQL 17 and compares every table's row count and content checksum.
 *       Touches no target. Proves the dump/restore is faithful.
 *
 *   node apps/bureau/scripts/migrate-to-eu.mjs --migrate <source-env-file> <target-env-file>
 *       The same into the EU target, then applies the intake-outbox migration
 *       there and proves the result again.
 *
 * Each env file holds DATABASE_URL=... (the source file is the current Bureau
 * configuration; the target file holds only the new EU project's URL). Values
 * are never printed — only hosts, regions, counts and checksums.
 *
 * Guards: the target host must be an EU region, must differ from the source,
 * and must contain no tables before restore. The source is only ever read.
 * Uses Docker's postgres:17-alpine for pg_dump/pg_restore/psql, so no local
 * PostgreSQL tooling is needed.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const [mode, sourceFile, targetFile] = process.argv.slice(2)
if (!['--rehearse', '--migrate', '--recheck'].includes(mode) || !sourceFile || (mode !== '--rehearse' && !targetFile)) {
  console.error('usage: --rehearse <source-env> | --migrate <source-env> <target-env> | --recheck <source-env> <evidence.json>')
  process.exit(2)
}
const IMAGE = 'postgres:17-alpine'
const OUTBOX = resolve(import.meta.dirname, '..', 'lib', 'db', 'migrations', '0002_intake_outbox.sql')

function urlFrom(file) {
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find((l) => /^\s*DATABASE_URL\s*=/.test(l))
  if (!line) throw new Error(`${file} has no DATABASE_URL`)
  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
}
/** pg_dump needs a session connection: use the direct endpoint, not the pooler. */
function direct(url) {
  const u = new URL(url)
  u.hostname = u.hostname.replace('-pooler.', '.')
  if (!u.searchParams.has('sslmode')) u.searchParams.set('sslmode', 'require')
  return u.toString()
}
const hostOf = (url) => new URL(url).hostname
function docker(args, opts = {}) {
  const r = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 15 * 60_000, ...opts })
  if (r.error || r.status !== 0) {
    // Never echo argv: it carries connection strings.
    throw new Error(`docker ${args[0]} failed: ${(r.stderr || '').replace(/postgres(ql)?:\/\/\S+/g, '[url]').slice(0, 400)}`)
  }
  return r.stdout
}
/** Run SQL with psql in a disposable container; the URL travels as an env var, not argv. */
function psql(url, sql, network = 'bridge') {
  return docker(['run', '--rm', '-i', `--network=${network}`, '-e', `DBURL=${url}`, IMAGE, 'sh', '-c', 'psql "$DBURL" -X -v ON_ERROR_STOP=1 -At'], { input: sql })
}

const FINGERPRINT_SQL = `
SELECT json_object_agg(t, j) FROM (
  SELECT format('%I.%I', n.nspname, c.relname) AS t,
         (xpath('/row/j/text()', query_to_xml(format(
           'SELECT json_build_object(''rows'', count(*), ''md5'', md5(coalesce(string_agg(x::text, ''|'' ORDER BY x::text), ''''))) AS j FROM %I.%I x',
           n.nspname, c.relname), false, true, '')))[1]::text::json AS j
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
  ORDER BY 1
) s;`
const fingerprint = (url, network) => JSON.parse(psql(url, FINGERPRINT_SQL, network).trim() || '{}')

function compare(a, b, label) {
  const tables = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  let ok = true
  for (const t of tables) {
    const same = a[t] && b[t] && a[t].rows === b[t].rows && a[t].md5 === b[t].md5
    if (!same) { ok = false; console.log(`  ✗ ${t}: source ${JSON.stringify(a[t] ?? null)} vs ${label} ${JSON.stringify(b[t] ?? null)}`) }
  }
  const rows = Object.values(a).reduce((n, x) => n + x.rows, 0)
  console.log(`  ${ok ? '✓' : '✗'} ${tables.length} tables, ${rows} rows: counts and content checksums ${ok ? 'identical' : 'DIFFER'} (${label})`)
  return ok
}

const source = direct(urlFrom(sourceFile))
console.log(`source host ${hostOf(source)}`)

/* --recheck: run AFTER DATABASE_URL points at the EU database and the release is live.
   A write that reached the US source between the dump and the switch would otherwise be
   lost silently. Identical fingerprints prove nothing was written after the copy. */
if (mode === '--recheck') {
  const evidence = JSON.parse(readFileSync(targetFile, 'utf8'))
  if (evidence.mode !== '--migrate' || evidence.sourceHost !== hostOf(source)) {
    console.error('evidence is not from a --migrate run of this source; refusing'); process.exit(2)
  }
  const now = fingerprint(source)
  const ok = compare(evidence.tables, now, 'source now vs. source at copy time')
  if (!ok) console.error('Writes reached the US source after the copy. Do not delete it: replay the differing tables into the EU database first.')
  process.exit(ok ? 0 : 1)
}
const work = mkdtempSync(join(tmpdir(), 'bureau-eu-'))
const dumpName = 'bureau.dump'
let local = null
try {
  console.log('1. fingerprint source (read-only)')
  const before = fingerprint(source)
  console.log(`   ${Object.keys(before).length} tables`)

  console.log('2. pg_dump (custom format, no owners, no privileges)')
  docker(['run', '--rm', '-e', `DBURL=${source}`, '-v', `${work}:/out`, IMAGE, 'sh', '-c',
    `pg_dump "$DBURL" --format=custom --no-owner --no-privileges --file=/out/${dumpName}`])

  let target
  let network = 'bridge'
  if (mode === '--rehearse') {
    local = `bureau-eu-rehearsal-${randomUUID().slice(0, 8)}`
    docker(['run', '-d', '--rm', '--name', local, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', IMAGE])
    for (let i = 0; i < 60; i++) {
      if (spawnSync('docker', ['exec', local, 'pg_isready', '-U', 'postgres']).status === 0) break
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
    }
    target = 'postgresql://postgres@localhost/postgres'
    network = `container:${local}`
    console.log('3. restore into a throwaway local PostgreSQL 17 (rehearsal)')
  } else {
    target = direct(urlFrom(targetFile))
    const host = hostOf(target)
    if (!/\.eu-[a-z]+-\d\.aws\.neon\.tech$/.test(host)) throw new Error(`target ${host} is not an EU Neon region; refusing`)
    if (host.split('.')[0] === hostOf(source).split('.')[0]) throw new Error('target is the source; refusing')
    const existing = psql(target, "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');").trim()
    if (existing !== '0') throw new Error(`target already has ${existing} table(s); refusing to overwrite`)
    console.log(`3. restore into EU target ${host}`)
  }
  docker(['run', '--rm', `--network=${network}`, '-e', `DBURL=${target}`, '-v', `${work}:/out`, IMAGE, 'sh', '-c',
    `pg_restore --dbname="$DBURL" --no-owner --no-privileges --exit-on-error /out/${dumpName}`])

  console.log('4. fingerprint restored copy and compare')
  const after = fingerprint(target, network)
  if (!compare(before, after, mode === '--rehearse' ? 'rehearsal' : 'EU target')) throw new Error('copy differs from source')

  console.log('5. apply 0002_intake_outbox (additive, replay-safe) and re-check')
  psql(target, readFileSync(OUTBOX, 'utf8').replace(/--> statement-breakpoint/g, ''), network)
  psql(target, readFileSync(OUTBOX, 'utf8').replace(/--> statement-breakpoint/g, ''), network)
  const cols = psql(target, "SELECT string_agg(column_name, ',' ORDER BY column_name) FROM information_schema.columns WHERE table_name='lead_submissions' AND column_name LIKE '%forward%';", network).trim()
  console.log(`   outbox columns: ${cols}`)
  const afterOutbox = fingerprint(target, network)
  const sameRows = Object.keys(before).every((t) => afterOutbox[t] && afterOutbox[t].rows === before[t].rows)
  console.log(`  ${sameRows ? '✓' : '✗'} row counts unchanged by the outbox migration`)
  if (!sameRows || cols !== 'forward_attempts,last_forward_at,last_forward_error') throw new Error('outbox migration check failed')

  writeFileSync(join(work, 'evidence.json'), JSON.stringify({ mode, sourceHost: hostOf(source), targetHost: mode === '--rehearse' ? 'local-rehearsal' : hostOf(target), tables: before }, null, 2))
  console.log(`MIGRATION ${mode === '--rehearse' ? 'REHEARSAL' : ''} PASSED — evidence (counts/checksums only) in ${join(work, 'evidence.json')}`)
} finally {
  if (local) spawnSync('docker', ['rm', '-f', local])
  rmSync(join(work, dumpName), { force: true })
}
