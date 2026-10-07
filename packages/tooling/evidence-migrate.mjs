#!/usr/bin/env node
/**
 * packages/tooling/evidence-migrate.mjs
 *
 * Applies one migration file to the EVIDENCE database, and only there.
 *
 *     node --env-file=apps/web/.env.local packages/tooling/evidence-migrate.mjs apps/web/db/migrations/0011-commercial-core.sql
 *
 * The same two gates as the evidence seed (apps/web/lib/evidence/seed.mjs):
 *
 *   1. evidence mode is armed, EVIDENCE_DATABASE_URL is set, and it is not
 *      the value of any production database variable;
 *   2. the target holds no invoice that the evidence environment did not
 *      write. A database with real paperwork in it is production or a copy of
 *      it, whatever its variable is called.
 *
 * There is no flag that targets another database. Applying a migration to
 * production is Marcel's decision and is done by hand, per db/README.md.
 *
 * The file runs as one multi-statement transaction over the Neon websocket
 * driver, so a failure part-way leaves nothing applied.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Pool } from '@neondatabase/serverless'
import { evidenceDbProblem, EVIDENCE_DB_ENV, EVIDENCE_DOC_PREFIX } from '../config/evidence.ts'

const file = process.argv[2]
if (!file) {
  console.error('usage: evidence-migrate.mjs <migration.sql>')
  process.exit(2)
}

const problem = evidenceDbProblem(process.env)
if (problem) {
  console.error('evidence-migrate: refusing to run.')
  console.error('  ' + problem)
  process.exit(1)
}

const sqlText = readFileSync(resolve(file), 'utf8')
const pool = new Pool({ connectionString: process.env[EVIDENCE_DB_ENV] })

try {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      'SELECT COUNT(*)::int AS foreign FROM os_invoices WHERE invoice_number NOT LIKE $1',
      [EVIDENCE_DOC_PREFIX + '%'],
    )
    if (rows[0].foreign > 0) {
      console.error('evidence-migrate: refusing to run.')
      console.error(`  The target holds ${rows[0].foreign} invoice(s) the evidence environment did not write.`)
      process.exit(1)
    }
    await client.query('BEGIN')
    await client.query(sqlText)
    await client.query('COMMIT')
    console.log(`evidence-migrate: applied ${file} to the evidence database.`)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
} catch (err) {
  console.error('evidence-migrate: failed —', err instanceof Error ? err.message : String(err))
  process.exitCode = 1
} finally {
  await pool.end()
}
