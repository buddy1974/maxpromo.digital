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

import { neon } from '../../apps/web/scripts/evidenceDatabase.ts'
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
  const threads = new Set((await sql`SELECT id::text AS k FROM mail.threads`.catch(() => [])).map((r) => r.k))
  return { rows, sequences, audit, threads }
}

export async function restoreLab(sql, snap, log = console.log) {
  /* Conversations a run created: document emails now leave through the mailbox and are recorded
     in mail.threads (ADR-0025), so a run leaves Inbox conversations behind unless they go too. */
  if (snap.threads) {
    const threads = (await sql`SELECT id::text AS k FROM mail.threads`).map((r) => r.k).filter((x) => !snap.threads.has(x))
    if (threads.length) {
      await sql`DELETE FROM mail.action_audit WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.business_links WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.drafts WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`UPDATE mail.messages SET delivery_report = NULL WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.messages WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.threads WHERE id = ANY(${threads}::uuid[])`
    }
    log(`  mail.threads: ${threads.length} conversation(s) removed`)
  }
  for (const t of LAB_TABLES) {
    const k = KEY[t] ?? 'id'
    const created = (await sql.query(`SELECT ${k}::text AS k FROM ${t}`)).map((r) => r.k).filter((x) => !snap.rows[t].has(x))
    if (created.length) {
      if (t === 'os_invoices') {
        // Rail records point at invoices with ON DELETE RESTRICT (migration 0019).
        for (const table of ['money.provider_events', 'money.reversals', 'money.charges', 'money.disputes', 'money.checkout_sessions', 'money.payment_links']) {
          await sql.query(`DELETE FROM ${table} WHERE invoice_id = ANY($1::uuid[])`, [created]).catch(() => undefined)
        }
        await sql`DELETE FROM os_payments WHERE invoice_id = ANY(${created}::uuid[])`
      }
      await sql.query(`DELETE FROM ${t} WHERE ${k}::text = ANY($1)`, [created])
    }
    log(`  ${t}: ${created.length} row(s) removed`)
  }
  for (const s of snap.sequences) {
    await sql.query('SELECT setval($1::regclass, $2, $3)', [`doc_seq.${s.sequencename}`, s.last_value === null ? 1 : s.last_value, s.last_value !== null])
  }
  const after = await sql`SELECT sequencename, last_value::bigint AS last_value FROM pg_sequences WHERE schemaname = 'doc_seq'`
  const sequencesRestored = snap.sequences.every((s) => after.find((a) => a.sequencename === s.sequencename)?.last_value === s.last_value)
  const auditAdded = (await sql`SELECT count(*)::int AS n FROM os_audit`)[0].n - snap.audit
  log(`  os_audit: ${auditAdded} row(s) added and kept (append-only by design)`)
  return { sequencesRestored, auditAdded }
}
