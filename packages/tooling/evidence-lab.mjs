/**
 * packages/tooling/evidence-lab.mjs
 *
 * Snapshot and restore for the evidence lab, shared by every harness that
 * writes through the real allocator and the real routes: the lab must be left
 * as found — every row a run created removed, both document sequences set back.
 *
 * os_audit is append-only by design (a trigger refuses UPDATE and DELETE) and
 * is deliberately NOT restored; the number of rows a run added is reported.
 *
 * Refuses to run unless the evidence gates pass (evidenceDbProblem).
 */

import { neon } from '@neondatabase/serverless'
import { evidenceDbProblem, EVIDENCE_DB_ENV } from '../config/evidence.ts'

export const LAB_TABLES = [
  'os_payments', 'os_followups', 'os_activities', 'os_files', 'os_recurring', 'os_incidents', 'os_approvals',
  'os_invoices', 'os_jobs', 'os_angebote', 'os_leads', 'os_clients', 'os_agent_results', 'os_agent_nonces',
]
const KEY = { os_agent_results: 'request_id', os_agent_nonces: 'nonce' }

export function labSql(env = process.env) {
  const problem = evidenceDbProblem(env)
  if (problem) throw new Error(`evidence lab refused: ${problem}`)
  return neon(env[EVIDENCE_DB_ENV])
}

export async function snapshotLab(sql) {
  const rows = {}
  for (const t of LAB_TABLES) rows[t] = new Set((await sql.query(`SELECT ${KEY[t] ?? 'id'}::text AS k FROM ${t}`)).map((r) => r.k))
  const sequences = await sql`SELECT sequencename, last_value::bigint AS last_value FROM pg_sequences WHERE schemaname = 'doc_seq'`
  const audit = (await sql`SELECT count(*)::int AS n FROM os_audit`)[0].n
  return { rows, sequences, audit }
}

export async function restoreLab(sql, snap, log = console.log) {
  for (const t of LAB_TABLES) {
    const k = KEY[t] ?? 'id'
    const created = (await sql.query(`SELECT ${k}::text AS k FROM ${t}`)).map((r) => r.k).filter((x) => !snap.rows[t].has(x))
    if (created.length) {
      if (t === 'os_invoices') await sql`DELETE FROM os_payments WHERE invoice_id = ANY(${created}::uuid[])`
      await sql.query(`DELETE FROM ${t} WHERE ${k}::text = ANY($1)`, [created])
    }
    log(`  ${t}: ${created.length} row(s) removed`)
  }
  for (const s of snap.sequences) {
    await sql.query(`SELECT setval('doc_seq.${s.sequencename}', ${s.last_value === null ? 1 : s.last_value}, ${s.last_value !== null})`)
  }
  const after = await sql`SELECT sequencename, last_value::bigint AS last_value FROM pg_sequences WHERE schemaname = 'doc_seq'`
  const sequencesRestored = snap.sequences.every((s) => after.find((a) => a.sequencename === s.sequencename)?.last_value === s.last_value)
  const auditAdded = (await sql`SELECT count(*)::int AS n FROM os_audit`)[0].n - snap.audit
  log(`  os_audit: ${auditAdded} row(s) added and kept (append-only by design)`)
  return { sequencesRestored, auditAdded }
}
