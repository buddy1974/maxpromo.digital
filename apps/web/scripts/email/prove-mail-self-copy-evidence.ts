/**
 * Risk 135 against a REAL Postgres (migration 0021): mail the mailbox sends to itself is the same
 * message, not new business. Sends go to a capturing sink; mail.accept_hostinger is called with the
 * exact payload shape the webhook uses. Refuses to run anywhere but the evidence database; removes
 * everything it created.
 */
import assert from 'node:assert/strict'
import { evidenceDbProblem } from '../../../../packages/config/evidence.ts'
import { getDb } from '../../lib/db.ts'
import { runCapability } from '../../lib/commercial/engine.ts'
import { deliverDraft, type TransportChoice } from '../../lib/mail/outbound.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }
const sql = getDb()
const actor = 'os:marcel'
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }

const tag = Date.now().toString(36)
const created = { threads: new Set<string>(), client: '' }
const [account] = await sql`SELECT id, lower(address) AS address FROM mail.accounts WHERE provider='hostinger' AND enabled LIMIT 1` as { id: string; address: string }[]
assert.ok(account, 'evidence mailbox account')
const sink: TransportChoice = { mode: 'evidence', transport: { async send() { /* captured, never sent */ } } }

async function send(to: string, subject: string): Promise<{ threadId: string; messageId: string }> {
  const c = await runCapability(sql, { requestId: `self-${tag}-${subject}`, actor, channel: 'os', capability: 'email.compose', input: { mode: 'new', to: [to], subject, body: 'Proof.', family: 'reply', language: 'de' } })
  assert.equal(c.status, 'done')
  const draftId = (c.status === 'done' ? c.result.data as { draft_id: string } : null)!.draft_id
  const [{ revision }] = await sql`SELECT revision FROM mail.drafts WHERE id=${draftId}::uuid` as { revision: number }[]
  const sent = await deliverDraft(sql, { draftId, revision, approvalId: crypto.randomUUID(), actor, today, committed: () => {} }, sink)
  created.threads.add(sent.threadId)
  return sent
}
async function accept(p: { sender: string; messageId: string; subject: string; inReplyTo?: string; to?: string }) {
  const n = crypto.randomUUID()
  const payload = { deliveryId: `dlv-${n}`, eventId: `evt-${n}`, mailbox: account.address, messageId: p.messageId, inReplyTo: p.inReplyTo ?? '', references: p.inReplyTo ? [p.inReplyTo] : [],
    subject: p.subject, sender: p.sender, recipients: [p.to ?? account.address], cc: [], eventAt: new Date().toISOString(), emailDate: new Date().toISOString(), previewText: 'Proof.',
    attachments: [], classification: 'inquiry', needsReply: true, riskSignals: [], suspect: false }
  const [r] = await sql`SELECT * FROM mail.accept_hostinger(${account.id}, ${JSON.stringify(payload)}::jsonb, '{}'::jsonb, ${new Date(Date.now() + 86_400_000).toISOString()}::timestamptz)` as { created: boolean; message_id: string; thread_id: string }[]
  if (r.thread_id) created.threads.add(r.thread_id)
  return r
}
const thread = async (id: string) => (await sql`SELECT needs_reply, archived, classification FROM mail.threads WHERE id=${id}::uuid` as { needs_reply: boolean; archived: boolean; classification: string }[])[0]

try {
  // A client whose address is the mailbox itself (the MP-2026-044 situation).
  created.client = (await sql`INSERT INTO os_clients (name, company, email) VALUES (${`Self proof ${tag}`}, 'Self proof', ${account.address}) RETURNING id` as { id: string }[])[0].id

  // (1) Sent to ourselves, Message-ID already read back: the delivered copy IS the sent message.
  const a = await send(account.address, `Rechnung self ${tag} A`)
  const rfcA = `<self-a-${tag}@maxpromo.digital>`
  await sql`UPDATE mail.messages SET rfc_message_id=${rfcA} WHERE id=${a.messageId}::uuid`
  const ra = await accept({ sender: account.address, messageId: rfcA, subject: `Rechnung self ${tag} A` })
  check('a copy of our own sent message is recorded against it: no new message, no new conversation', ra.created === false && ra.message_id === a.messageId && ra.thread_id === a.threadId)
  check('…and the conversation does not start asking for a reply', (await thread(a.threadId)).needs_reply === false)
  const dl = await sql`SELECT count(*)::int AS n FROM mail.deliveries WHERE message_id=${a.messageId}::uuid` as { n: number }[]
  check('the delivery is kept (provider truth) on the sent message', dl[0].n === 1)

  // (2) The copy arrives before the readback: kept, archived, never attention, never linked.
  const b = await send(account.address, `Rechnung self ${tag} B`)
  const rfcB = `<self-b-${tag}@maxpromo.digital>`
  const rb = await accept({ sender: account.address, messageId: rfcB, subject: `Rechnung self ${tag} B` })
  const tb = await thread(rb.thread_id)
  const links = await sql`SELECT count(*)::int AS n FROM mail.business_links WHERE thread_id=${rb.thread_id}::uuid` as { n: number }[]
  const sig = await sql`SELECT risk_signals ? 'self_copy' AS s FROM mail.messages WHERE id=${rb.message_id}::uuid` as { s: boolean }[]
  check('an early self copy is kept but filed: archived system conversation, no needs-reply', rb.created === true && rb.thread_id !== b.threadId && tb.archived && !tb.needs_reply && tb.classification === 'system')
  check('…not linked to the client that shares the mailbox address, and marked self_copy', links[0].n === 0 && sig[0].s === true)
  // The readback arrives: the copy folds into the sent message and its conversation goes.
  await sql`UPDATE mail.messages SET rfc_message_id=${rfcB} WHERE id=${b.messageId}::uuid`
  const [{ merged }] = await sql`SELECT mail.merge_self_copy(${account.id}, ${b.messageId}::uuid) AS merged` as { merged: number }[]
  const gone = await sql`SELECT count(*)::int AS n FROM mail.threads WHERE id=${rb.thread_id}::uuid` as { n: number }[]
  const moved = await sql`SELECT count(*)::int AS n FROM mail.deliveries WHERE message_id=${b.messageId}::uuid` as { n: number }[]
  check('after the readback the copy is merged: its delivery points at the sent message, the extra conversation is gone', merged === 1 && gone[0].n === 0 && moved[0].n === 1)
  created.threads.delete(rb.thread_id)

  // (3) A real customer reply still threads and still asks for a reply.
  const customer = `proof-${tag}@weber.example`
  const c = await send(customer, `Angebot self ${tag} C`)
  const rfcC = `<self-c-${tag}@maxpromo.digital>`
  await sql`UPDATE mail.messages SET rfc_message_id=${rfcC} WHERE id=${c.messageId}::uuid`
  const rc = await accept({ sender: customer, messageId: `<reply-${tag}@weber.example>`, subject: `Re: Angebot self ${tag} C`, inReplyTo: rfcC })
  check('a customer reply joins the conversation and asks for a reply, as before', rc.created === true && rc.thread_id === c.threadId && (await thread(c.threadId)).needs_reply === true)

  // (4) A note from Marcel's own phone answering that conversation is not the customer answering.
  await sql`UPDATE mail.threads SET needs_reply=false WHERE id=${c.threadId}::uuid`
  const rd = await accept({ sender: account.address, messageId: `<note-${tag}@maxpromo.digital>`, subject: `Re: Angebot self ${tag} C`, inReplyTo: rfcC, to: customer })
  check('mail from the mailbox itself in a customer conversation joins it without asking for a reply', rd.created === true && rd.thread_id === c.threadId && (await thread(c.threadId)).needs_reply === false)

  console.log(`\n${passed} self-copy assertions passed against the evidence database.`)
} finally {
  const ids = [...created.threads]
  if (ids.length) {
    const msgs = (await sql`SELECT id FROM mail.messages WHERE thread_id = ANY(${ids}::uuid[])` as { id: string }[]).map(r => r.id)
    await sql`UPDATE mail.drafts SET sent_message_id=NULL, source_message_id=NULL WHERE thread_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM mail.drafts WHERE thread_id = ANY(${ids}::uuid[])`
    if (msgs.length) {
      await sql`DELETE FROM mail.deliveries WHERE message_id = ANY(${msgs}::uuid[])`
      await sql`DELETE FROM mail.content_assets WHERE message_id = ANY(${msgs}::uuid[])`
      await sql`DELETE FROM mail.content_jobs WHERE message_id = ANY(${msgs}::uuid[])`
      await sql`UPDATE mail.messages SET delivery_report=NULL WHERE thread_id = ANY(${ids}::uuid[])`
    }
    await sql`DELETE FROM mail.messages WHERE thread_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM mail.business_links WHERE thread_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM mail.action_audit WHERE thread_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM mail.events WHERE thread_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM mail.threads WHERE id = ANY(${ids}::uuid[])`
  }
  if (created.client) {
    await sql`DELETE FROM os_activities WHERE client_id=${created.client}::uuid`
    await sql`DELETE FROM os_clients WHERE id=${created.client}::uuid`
  }
  console.log(`cleanup: ${ids.length} conversation(s), test client removed`)
}
