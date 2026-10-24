/**
 * Scheduled send against a REAL Postgres (migration 0023). Sends go to a capturing sink; nothing
 * leaves the machine. Refuses to run anywhere but the evidence database; removes what it created.
 */
import assert from 'node:assert/strict'
import { evidenceDbProblem } from '../../../../packages/config/evidence.ts'
import { getDb } from '../../lib/db.ts'
import { runCapability, executeApproval } from '../../lib/commercial/engine.ts'
import { sweepScheduledMail, type TransportChoice } from '../../lib/mail/outbound.ts'
import { scheduleInstant } from '../../lib/commercial/capabilities/mailWorkspace.ts'
import { CapabilityRefusal } from '../../lib/commercial/types.ts'
import { MailProviderError, type SendPayload } from '../../lib/mail/provider.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }
const sql = getDb()
const actor = 'os:marcel'
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }
const tag = Date.now().toString(36)
const created: string[] = []
const sent: SendPayload[] = []
const sink: TransportChoice = { mode: 'evidence', transport: { async send(p) { sent.push(p) } } }
const refusing: TransportChoice = { mode: 'evidence', transport: { async send() { throw new MailProviderError('failed', 550) } } }

async function draft(subject: string): Promise<string> {
  const c = await runCapability(sql, { requestId: `sched-${tag}-${subject}`, actor, channel: 'os', capability: 'email.compose', input: { mode: 'new', to: [`sched-${tag}@weber.example`], subject, body: 'Geplanter Versand.', family: 'reply', language: 'de' } })
  assert.equal(c.status, 'done')
  const id = (c.status === 'done' ? c.result.data as { draft_id: string } : null)!.draft_id
  created.push(id)
  return id
}
const row = async (id: string) => (await sql`SELECT status, scheduled_for, schedule_error, revision FROM mail.drafts WHERE id=${id}::uuid` as { status: string; scheduled_for: Date | null; schedule_error: string | null; revision: number }[])[0]
async function scheduleFor(id: string, minutes: number) {
  const at = new Date(Date.now() + minutes * 60_000).toISOString()
  const prep = await runCapability(sql, { requestId: `sched-${tag}-${id}-${minutes}`, actor, channel: 'os', capability: 'email.deliver', input: { draft_id: id, send_at: at } })
  assert.equal(prep.status, 'approval_required')
  return prep
}
const makeDue = (id: string) => sql`UPDATE mail.drafts SET scheduled_for = now() - interval '1 minute' WHERE id=${id}::uuid`

try {
  const now = new Date()
  check('a send time under 2 minutes or over 60 days ahead is refused; a valid one is an instant', (() => {
    const bad = (s: string) => { try { scheduleInstant(s, now); return false } catch (e) { return e instanceof CapabilityRefusal } }
    return bad(new Date(now.getTime() + 30_000).toISOString()) && bad(new Date(now.getTime() + 61 * 86_400_000).toISOString()) && bad('tomorrow')
      && scheduleInstant(new Date(now.getTime() + 3_600_000).toISOString(), now) instanceof Date && scheduleInstant(undefined, now) === null
  })())

  const a = await draft(`Sched A ${tag}`)
  const prep = await scheduleFor(a, 60)
  check('the confirmation names the send time in Berlin', prep.status === 'approval_required' && /^Scheduled: .*\(Berlin\)$/.test(prep.approval.preview.SEND ?? ''))
  if (prep.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: prep.approval.id, payloadHash: prep.approval.payloadHash })
  check('confirming schedules the draft and sends nothing', (await row(a)).status === 'scheduled' && sent.length === 0)
  await sweepScheduledMail(sql, today, sink)
  check('a sweep before the time sends nothing', (await row(a)).status === 'scheduled' && sent.length === 0)
  await makeDue(a)
  const [s1, s2] = await Promise.all([sweepScheduledMail(sql, today, sink), sweepScheduledMail(sql, today, sink)])
  check('when due it is sent exactly once, even with two sweeps at the same moment', sent.length === 1 && s1.sent + s2.sent === 1 && (await row(a)).status === 'sent')
  await sweepScheduledMail(sql, today, sink)
  check('a later sweep never sends it again', sent.length === 1)
  const audit = await sql`SELECT count(*)::int AS n FROM os_audit WHERE operation='email.scheduled.send' AND entity_id=${a} AND outcome='succeeded'` as { n: number }[]
  check('the scheduled send is audited', audit[0].n === 1)

  const b = await draft(`Sched B ${tag}`)
  const pb = await scheduleFor(b, 60)
  if (pb.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: pb.approval.id, payloadHash: pb.approval.payloadHash })
  const revBefore = (await row(b)).revision
  const un = await runCapability(sql, { requestId: `sched-${tag}-un`, actor, channel: 'os', capability: 'email.unschedule', input: { draft_id: b } })
  const after = await row(b)
  check('taking it back returns a draft with a new revision; the old confirmation can no longer send it', un.status === 'done' && after.status === 'draft' && after.scheduled_for === null && after.revision === revBefore + 1)
  await makeDue(b)
  await sweepScheduledMail(sql, today, sink)
  check('…and no sweep picks it up', sent.length === 1 && (await row(b)).status === 'draft')

  const c = await draft(`Sched C ${tag}`)
  const pc = await scheduleFor(c, 60)
  if (pc.status === 'approval_required') await executeApproval(sql, { actor, channel: 'os', approvalId: pc.approval.id, payloadHash: pc.approval.payloadHash })
  await makeDue(c)
  const fail = await sweepScheduledMail(sql, today, refusing)
  const rc = await row(c)
  check('a refused scheduled send comes back as a draft with the reason, visible and not retried', fail.failed === 1 && rc.status === 'draft' && Boolean(rc.schedule_error) && rc.scheduled_for === null)
  await sweepScheduledMail(sql, today, sink)
  check('…the next sweep does not retry it on its own', sent.length === 1)

  console.log(`\n${passed} scheduled-send assertions passed against the evidence database.`)
} finally {
  if (created.length) {
    const threads = (await sql`SELECT DISTINCT thread_id FROM mail.drafts WHERE id = ANY(${created}::uuid[]) AND thread_id IS NOT NULL` as { thread_id: string }[]).map(r => r.thread_id)
    await sql`UPDATE mail.drafts SET sent_message_id=NULL WHERE id = ANY(${created}::uuid[])`
    await sql`DELETE FROM mail.draft_attachments WHERE draft_id = ANY(${created}::uuid[])`
    await sql`DELETE FROM mail.drafts WHERE id = ANY(${created}::uuid[])`
    if (threads.length) {
      const msgs = (await sql`SELECT id FROM mail.messages WHERE thread_id = ANY(${threads}::uuid[])` as { id: string }[]).map(r => r.id)
      if (msgs.length) await sql`DELETE FROM mail.deliveries WHERE message_id = ANY(${msgs}::uuid[])`
      await sql`DELETE FROM mail.messages WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.business_links WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.action_audit WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.events WHERE thread_id = ANY(${threads}::uuid[])`
      await sql`DELETE FROM mail.threads WHERE id = ANY(${threads}::uuid[])`
    }
  }
  console.log(`cleanup: ${created.length} draft(s) removed`)
}
