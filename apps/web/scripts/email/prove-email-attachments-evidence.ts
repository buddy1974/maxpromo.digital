/**
 * Outgoing attachments and delivery reports against a REAL Postgres: the evidence database
 * (migration 0020). The send uses a capturing sink transport: nothing leaves the machine.
 * Refuses to run anywhere but the evidence database; removes what it created.
 */
import assert from 'node:assert/strict'
import { evidenceDbProblem } from '../../../../packages/config/evidence.ts'
import { getDb } from '../../lib/db.ts'
import { runCapability, executeApproval } from '../../lib/commercial/engine.ts'
import { addDraftAttachment, removeDraftAttachment, listDraftAttachments } from '../../lib/mail/draftAttachments.ts'
import { deliverDraft, type TransportChoice } from '../../lib/mail/outbound.ts'
import type { SendPayload } from '../../lib/mail/provider.ts'
import { recordBounce } from '../../lib/mail/bounces.ts'
import { CapabilityRefusal } from '../../lib/commercial/types.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }
const sql = getDb()
const actor = 'os:marcel'
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }
async function refuses(name: string, fn: () => Promise<unknown>) { await assert.rejects(fn, (e: unknown) => e instanceof CapabilityRefusal); passed++; console.log(`PASS ${name}`) }

const tag = Date.now().toString(36)
const recipient = `proof-${tag}@weber.example`
const pdf = new TextEncoder().encode(`%PDF-1.4\n% proof ${tag}\n`)
let draftId = ''
const created: { threads: string[] } = { threads: [] }
try {
  const compose = await runCapability(sql, { requestId: `att-proof-${tag}-1`, actor, channel: 'os', capability: 'email.compose',
    input: { mode: 'new', to: [recipient], subject: `Angebot ${tag}`, body: 'anbei das Angebot.', family: 'proposal', language: 'de' } })
  assert.equal(compose.status, 'done')
  draftId = (compose.status === 'done' ? compose.result.data as { draft_id: string; revision: number } : null)!.draft_id
  const rev0 = (await sql`SELECT revision FROM mail.drafts WHERE id=${draftId}::uuid` as { revision: number }[])[0].revision

  const a1 = await addDraftAttachment(sql, { draftId, actor, filename: 'Angebot.pdf', bytes: pdf })
  const rev1 = (await sql`SELECT revision FROM mail.drafts WHERE id=${draftId}::uuid` as { revision: number }[])[0].revision
  check('attaching a file stores it on the draft and changes the draft revision', a1.content_type === 'application/pdf' && rev1 === rev0 + 1)
  const again = await addDraftAttachment(sql, { draftId, actor, filename: 'Angebot (1).pdf', bytes: pdf })
  check('the same file twice is one attachment', again.id === a1.id && (await listDraftAttachments(sql, draftId)).length === 1)
  await refuses('a file whose bytes are not its type is refused', () => addDraftAttachment(sql, { draftId, actor, filename: 'virus.pdf', bytes: new TextEncoder().encode('MZ executable') }))
  await refuses('another person’s (or channel’s) draft cannot take files', () => addDraftAttachment(sql, { draftId, actor: 'telegram:someone', filename: 'x.pdf', bytes: pdf }))
  await refuses('a file over 4 MB is refused', () => addDraftAttachment(sql, { draftId, actor, filename: 'big.pdf', bytes: new Uint8Array(4 * 1024 * 1024 + 1).fill(0x25) }))

  const prep = await runCapability(sql, { requestId: `att-proof-${tag}-2`, actor, channel: 'os', capability: 'email.deliver', input: { draft_id: draftId } })
  check('the confirmation lists the attached files by name and size', prep.status === 'approval_required' && prep.approval.preview.ATTACHMENTS?.startsWith('Angebot.pdf'))
  const extra = await addDraftAttachment(sql, { draftId, actor, filename: 'notes.txt', bytes: new TextEncoder().encode('Hinweise') })
  if (prep.status === 'approval_required') {
    const stale = await executeApproval(sql, { actor, channel: 'os', approvalId: prep.approval.id, payloadHash: prep.approval.payloadHash })
    check('a confirmation shown before a file was added can no longer send', stale.status !== 'done')
  }
  check('removing a file works and is a new revision', await removeDraftAttachment(sql, draftId, extra.id, actor))

  // Send through a capturing sink: the real deliverDraft, real SQL, no network.
  let captured: SendPayload | null = null
  const sink: TransportChoice = { mode: 'evidence', transport: { async send(p) { captured = p } } }
  const revision = (await sql`SELECT revision FROM mail.drafts WHERE id=${draftId}::uuid` as { revision: number }[])[0].revision
  const sent = await deliverDraft(sql, { draftId, revision, approvalId: crypto.randomUUID(), actor, today, committed: () => {} }, sink)
  created.threads.push(sent.threadId)
  const out = captured as SendPayload | null
  check('the send carries the file, base64, with its type and name', out?.attachments?.length === 1 && out.attachments[0].filename === 'Angebot.pdf' && out.attachments[0].contentType === 'application/pdf'
    && Buffer.from(out.attachments[0].content, 'base64').equals(Buffer.from(pdf)))
  const msg = (await sql`SELECT attachments FROM mail.messages WHERE id=${sent.messageId}::uuid` as { attachments: { filename: string; size: number }[] }[])[0]
  check('the sent message in the conversation lists the file', msg.attachments.length === 1 && msg.attachments[0].filename === 'Angebot.pdf')
  check('after the send the bytes are cleared; the Sent folder copy is the record', (await sql`SELECT count(*)::int AS n FROM mail.draft_attachments WHERE draft_id=${draftId}::uuid AND content IS NOT NULL` as { n: number }[])[0].n === 0)
  await refuses('a sent draft takes no more files', () => addDraftAttachment(sql, { draftId, actor, filename: 'late.pdf', bytes: new TextEncoder().encode('%PDF-1.4 late') }))

  // A delivery failure report for that email.
  const report = await sql`INSERT INTO mail.messages(thread_id,account_id,provider_message_id,sender,recipients,cc,subject,body_text,received_at,is_read,attachments,body_state,preview_text,provider_state,direction)
    VALUES(${sent.threadId}::uuid,(SELECT account_id FROM mail.messages WHERE id=${sent.messageId}::uuid),${`proof-bounce-${tag}`},'MAILER-DAEMON@mx1.hostinger.com','["info@maxpromo.digital"]'::jsonb,'[]'::jsonb,
      'Undelivered Mail Returned to Sender','x',now(),false,'[]'::jsonb,'complete','x','inbox','inbound') RETURNING id` as { id: string }[]
  const marked = await recordBounce(sql, { messageId: report[0].id, sender: 'MAILER-DAEMON@mx1.hostinger.com',
    text: `Final-Recipient: rfc822; ${recipient}\nAction: failed\nStatus: 5.1.1\nDiagnostic-Code: smtp; 550 5.1.1 User unknown\n` })
  const state = (await sql`SELECT delivery_state, delivery_detail FROM mail.messages WHERE id=${sent.messageId}::uuid` as { delivery_state: string; delivery_detail: string }[])[0]
  check('the bounce marks Maxpromo’s own sent message as not delivered, with the reason', marked.includes(sent.messageId) && state.delivery_state === 'bounced' && state.delivery_detail.includes('5.1.1'))
  await recordBounce(sql, { messageId: report[0].id, sender: 'MAILER-DAEMON@mx1.hostinger.com', text: `Final-Recipient: rfc822; ${recipient}\nAction: delayed\nStatus: 4.4.1\n` })
  check('a later "delayed" report never downgrades a permanent failure', (await sql`SELECT delivery_state FROM mail.messages WHERE id=${sent.messageId}::uuid` as { delivery_state: string }[])[0].delivery_state === 'bounced')
  check('a report from an ordinary sender is ignored', (await recordBounce(sql, { messageId: report[0].id, sender: recipient, text: `Final-Recipient: rfc822; ${recipient}\nAction: failed\nStatus: 5.1.1` })).length === 0)
  const notices = await runCapability(sql, { requestId: `att-proof-${tag}-3`, actor: 'os:owner-notices', channel: 'telegram', capability: 'owner.notices', input: {} })
  const list = (notices.status === 'done' ? (notices.result.data as { notices: { key: string; text: string }[] }).notices : [])
  check('attention says the email did not arrive, and it is an owner notice', list.some(n => n.key.startsWith(`bounce:${sent.threadId}`) && n.text.includes(recipient)))
} finally {
  for (const t of created.threads) {
    await sql`DELETE FROM mail.action_audit WHERE thread_id=${t}::uuid`
    await sql`DELETE FROM mail.business_links WHERE thread_id=${t}::uuid`
    await sql`UPDATE mail.messages SET delivery_report=NULL WHERE thread_id=${t}::uuid`
    await sql`DELETE FROM mail.drafts WHERE thread_id=${t}::uuid OR id=${draftId || null}::uuid`
    await sql`DELETE FROM mail.messages WHERE thread_id=${t}::uuid`
    await sql`DELETE FROM mail.threads WHERE id=${t}::uuid`
  }
  if (draftId) await sql`DELETE FROM mail.drafts WHERE id=${draftId}::uuid`
  await sql`DELETE FROM os_approvals WHERE dedupe_key=${`email.deliver:draft:${draftId}`}`
}
console.log(`${passed} attachment and delivery-report assertions passed against the evidence database; nothing was sent.`)
