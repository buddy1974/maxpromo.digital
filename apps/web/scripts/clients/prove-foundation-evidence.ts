/**
 * Clients foundation + Inbox hygiene against a REAL Postgres (the evidence database), 2026-10-25.
 * Refuses to run anywhere but the evidence database; removes what it created. No model, no mail.
 *
 *   client: create with website / country / language → duplicate refused with evidence → "a
 *   different client" → match levels → three-state update (set, clear, unchanged) → archive /
 *   restore → delete refused with history → the database refuses a cascade → empty client deleted
 *   through an approval, kept in the audit → client page data → documents (type by bytes, one per
 *   file) → no orphan
 *   inbox: trash keeps state, leaves every count → restore → a new reply brings it back → a
 *   scheduled email in a trashed conversation goes back to a draft → bulk → a new email's draft is
 *   listed for reopening
 */
import assert from 'node:assert/strict'
import { evidenceDbProblem } from '../../../../packages/config/evidence.ts'

const problem = evidenceDbProblem(process.env)
if (problem || process.env.MAXPROMO_EVIDENCE_MODE !== '1') { console.error('refusing to run —', problem ?? 'evidence mode off'); process.exit(1) }

const tag = Date.now().toString(36)
const { getDb } = await import('../../lib/db.ts')
const { runCapability, executeApproval } = await import('../../lib/commercial/engine.ts')
const { addClientDocument, listClientDocuments, readClientDocument } = await import('../../lib/clients/documents.ts')

const sql = getDb()
const marcel = 'os:marcel'
let passed = 0
function check(name: string, ok: boolean) { assert.ok(ok, name); passed++; console.log(`PASS ${name}`) }
let n = 0
const run = (capability: string, input: Record<string, unknown>) => runCapability(sql, { requestId: `cf-${tag}-${++n}`, actor: marcel, channel: 'os', capability, input })
const done = <T>(r: Awaited<ReturnType<typeof run>>) => { assert.equal(r.status, 'done', JSON.stringify(r)); return (r as { result: { data: T } }).result.data }
type C = { id: string; name: string; company: string | null; email: string | null; phone: string | null; website: string | null; country: string; language: string | null; city: string | null; postcode: string | null; notes: string | null; status: string; archived_at: string | null }
const row = async (id: string) => (await sql`SELECT * FROM os_clients WHERE id=${id}::uuid` as C[])[0]
const clients: string[] = []
const threads: string[] = []

try {
  /* ── create ─────────────────────────────────────────────────────── */
  const created = done<{ created: boolean; client: C }>(await run('client.create', {
    name: 'Katrin Probe', company: `Probe Elektro ${tag} GmbH`, email: `info@probe-${tag}.de`, phone: '0201 555 123',
    website: `www.probe-${tag}.de/kontakt/`, address: 'Körnerstr. 8', postcode: '45143', city: 'Essen', country: 'Österreich', language: 'en', notes: 'Test',
  }))
  const A = created.client.id; clients.push(A)
  const a = await row(A)
  check('website is saved, normalised to https without trailing slash', a.website === `https://www.probe-${tag}.de/kontakt`)
  check('country, language, postcode and city are saved as given (postcode not folded into city)', a.country === 'Österreich' && a.language === 'en' && a.postcode === '45143' && a.city === 'Essen')
  check('creation is on the client timeline', (await sql`SELECT 1 FROM os_activities WHERE client_id=${A}::uuid AND kind='client_created'`).length === 1)

  /* ── duplicates ─────────────────────────────────────────────────── */
  const dup = done<{ created: boolean; candidates: { id: string; level: string; reasons: string[] }[] }>(await run('client.create', { name: 'Someone Else', email: `INFO@probe-${tag}.de` }))
  check('the same email is refused as EXACT, naming the existing client — nothing saved', !dup.created && dup.candidates[0]?.id === A && dup.candidates[0].level === 'exact' && dup.candidates[0].reasons.includes('email'))
  const byWebsite = done<{ level: string; candidates: { id: string; level: string }[] }>(await run('client.match', { name: 'X', website: `https://probe-${tag}.de` }))
  check('the same website alone is LIKELY', byWebsite.candidates.some(c => c.id === A && c.level === 'likely'))
  const otherCity = done<{ candidates: { id: string; level: string }[] }>(await run('client.match', { company: `Probe Elektro ${tag} GmbH`, city: 'Hamburg' }))
  check('the same company in another city is only POSSIBLE', otherCity.candidates.some(c => c.id === A && c.level === 'possible'))
  const sameCity = done<{ candidates: { id: string; level: string }[] }>(await run('client.match', { company: `probe elektro ${tag} gmbh`, city: 'Essen' }))
  check('the same company (case folded) in the same city is LIKELY', sameCity.candidates.some(c => c.id === A && c.level === 'likely'))
  const freemail = done<{ candidates: { id: string }[] }>(await run('client.match', { email: `someone-${tag}@gmail.com` }))
  check('a free-mail domain is no evidence', !freemail.candidates.some(c => c.id === A))
  const distinct = done<{ created: boolean; client: C }>(await run('client.create', { name: 'Someone Else', email: `INFO@probe-${tag}.de`, confirmed_distinct_from: [A] }))
  check('after "a different client", it is created (never merged)', distinct.created && distinct.client.id !== A)
  const B = distinct.client.id; clients.push(B)

  /* ── three-state update ─────────────────────────────────────────── */
  const upd = done<{ changed: string[] }>(await run('client.update', { client_id: A, phone: null, country: 'Deutschland', website: '' }))
  const a2 = await row(A)
  check('clearing works: phone null and website "" are cleared', a2.phone === null && a2.website === null)
  check('a changed country is saved', a2.country === 'Deutschland')
  check('fields not sent stay as they were', a2.email === `info@probe-${tag}.de` && a2.notes === 'Test' && a2.language === 'en' && a2.name === 'Katrin Probe')
  check('the update names exactly what changed on the timeline', upd.changed.sort().join(',') === 'country,phone,website' && (await sql`SELECT 1 FROM os_activities WHERE client_id=${A}::uuid AND kind='client_updated'`).length === 1)
  const refused = await run('client.update', { client_id: A, country: null })
  check('a client cannot lose its country', refused.status === 'refused')
  const nothing = done<{ changed: string[] }>(await run('client.update', { client_id: A, email: `info@probe-${tag}.de` }))
  check('sending the same value changes nothing', nothing.changed.length === 0)

  /* ── archive / restore ──────────────────────────────────────────── */
  done(await run('client.archive', { client_id: A }))
  const archived = await row(A)
  const activeIds = (await sql`SELECT id FROM os_clients WHERE archived_at IS NULL` as { id: string }[]).map(r => r.id)
  check('archived: status and timestamp set, out of the active list', archived.status === 'archived' && archived.archived_at !== null && !activeIds.includes(A))
  const stillMatched = done<{ candidates: { id: string; archived: boolean }[] }>(await run('client.match', { email: `info@probe-${tag}.de` }))
  check('an archived client is still matched (flagged), so it is restored rather than duplicated', stillMatched.candidates.some(c => c.id === A && c.archived))
  done(await run('client.restore', { client_id: A }))
  const restored = await row(A)
  check('restored: active again, nothing else changed', restored.status === 'active' && restored.archived_at === null && restored.email === archived.email)
  let shapeHeld = false
  try { await sql`UPDATE os_clients SET status='archived' WHERE id=${A}::uuid` } catch { shapeHeld = true }
  check('the database keeps status and archived_at in step', shapeHeld)

  /* ── delete safeguards ──────────────────────────────────────────── */
  await sql`INSERT INTO os_followups (due_on, reason, client_id, actor) VALUES (current_date + 3, ${`evidence ${tag}`}, ${A}::uuid, ${marcel})`
  const blocked = await run('client.delete', { client_id: A })
  check('a client with business history cannot be deleted; the answer names what is attached', blocked.status === 'done' && /followups/.test(JSON.stringify(blocked)) && (await row(A)) !== undefined)
  let dbRefused = false
  try { await sql`DELETE FROM os_clients WHERE id=${A}::uuid` } catch { dbRefused = true }
  check('the database itself refuses: no cascade erases the follow-up, nothing is orphaned', dbRefused && (await sql`SELECT 1 FROM os_followups WHERE client_id=${A}::uuid`).length === 1)
  const prepared = await run('client.delete', { client_id: B })
  check('an empty client: delete needs an approval', prepared.status === 'approval_required')
  const ap = (prepared as { approval: { id: string; payloadHash: string } }).approval
  const executed = await executeApproval(sql, { actor: marcel, channel: 'os', approvalId: ap.id, payloadHash: ap.payloadHash })
  check('after confirmation the empty client is gone, with its own lifecycle notes', executed.status === 'done' && (await row(B)) === undefined && (await sql`SELECT 1 FROM os_activities WHERE client_id=${B}::uuid`).length === 0)
  check('the deleted record is kept in the append-only audit', (await sql`SELECT 1 FROM os_audit WHERE operation='client.delete' AND entity_id=${B} AND before_state->>'email' IS NOT NULL`).length === 1)
  clients.splice(clients.indexOf(B), 1)

  /* ── client page ────────────────────────────────────────────────── */
  const show = done<{ attention: { kind: string }[]; followups: unknown[]; activity: { kind: string }[]; deletable: boolean }>(await run('client.show', { client_id: A }))
  check('the client page shows the open follow-up as attention, the timeline, and that it is not deletable', show.attention.some(x => x.kind.startsWith('followup')) && show.followups.length === 1 && show.activity.length >= 4 && !show.deletable)

  /* ── documents ──────────────────────────────────────────────────── */
  const pdf = new TextEncoder().encode(`%PDF-1.4\n% evidence ${tag}\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF`)
  const added = await addClientDocument(sql, { clientId: A, actor: marcel, filename: '../../Visitenkarte.pdf', bytes: pdf })
  check('a PDF is kept on the client, the path stripped from its name', !added.duplicate && added.document.filename === 'Visitenkarte.pdf' && added.document.mime_type === 'application/pdf')
  const again = await addClientDocument(sql, { clientId: A, actor: marcel, filename: 'copy.pdf', bytes: pdf })
  check('the same file twice is one document', again.duplicate && (await listClientDocuments(sql, A)).length === 1)
  await assert.rejects(addClientDocument(sql, { clientId: A, actor: marcel, filename: 'evil.pdf', bytes: new TextEncoder().encode('MZ\u0090 not a pdf') }), /not accepted/)
  await assert.rejects(addClientDocument(sql, { clientId: A, actor: marcel, filename: 'page.html', bytes: new TextEncoder().encode('<script>') }), /not accepted/)
  check('a file that is not what its name says, and HTML, are refused', true)
  const back = await readClientDocument(sql, A, added.document.id)
  check('the stored bytes come back exactly', back !== null && Buffer.from(back.content).equals(Buffer.from(pdf)))
  check('a document makes the client undeletable (it is history)', !done<{ deletable: boolean }>(await run('client.show', { client_id: A })).deletable)

  /* ── inbox: trash / restore / reply / scheduled / bulk / drafts ────── */
  const account = (await sql`SELECT id FROM mail.accounts ORDER BY id LIMIT 1` as { id: string }[])[0]
  assert.ok(account, 'evidence database has a mail account')
  const thread = async (subject: string) => {
    const [t] = await sql`INSERT INTO mail.threads (account_id, provider_thread_id, subject, needs_reply, classification)
      VALUES (${account.id}, ${`evidence-${tag}-${subject}`}, ${subject}, true, 'client') RETURNING id` as { id: string }[]
    threads.push(t.id)
    await sql`INSERT INTO mail.messages (thread_id, account_id, provider_message_id, sender, recipients, subject, body_text, received_at, direction)
      VALUES (${t.id}::uuid, ${account.id}, ${`evidence-${tag}-${subject}-1`}, ${`kunde-${tag}@example.org`}, '["info@maxpromo.digital"]'::jsonb, ${subject}, 'Frage', now(), 'inbound')`
    return t.id
  }
  const needsReply = async () => Number((await sql`SELECT count(*)::int AS n FROM mail.threads WHERE needs_reply AND quarantine IS NULL AND archived=false AND trashed=false` as { n: number }[])[0].n)
  const T1 = await thread('Trash me')
  const before = await needsReply()
  done(await run('email.trash', { thread_id: T1 }))
  const t1 = (await sql`SELECT trashed, trashed_at, needs_reply FROM mail.threads WHERE id=${T1}::uuid` as { trashed: boolean; trashed_at: string | null; needs_reply: boolean }[])[0]
  check('trash: no approval needed, out of the reply count, its "needs reply" kept for restore', t1.trashed && t1.trashed_at !== null && t1.needs_reply && (await needsReply()) === before - 1)
  check('trash deletes nothing', (await sql`SELECT 1 FROM mail.messages WHERE thread_id=${T1}::uuid`).length === 1)
  done(await run('email.restore', { thread_id: T1 }))
  check('restore: back in the reply count, unchanged', (await needsReply()) === before)
  done(await run('email.trash', { thread_id: T1 }))
  await sql`INSERT INTO mail.messages (thread_id, account_id, provider_message_id, sender, recipients, subject, body_text, received_at, direction)
    VALUES (${T1}::uuid, ${account.id}, ${`evidence-${tag}-reply`}, ${`kunde-${tag}@example.org`}, '["info@maxpromo.digital"]'::jsonb, 'Re: Trash me', 'Noch eine Frage', now() + interval '1 second', 'inbound')`
  check('a new message from the other side brings a trashed conversation back', (await sql`SELECT trashed FROM mail.threads WHERE id=${T1}::uuid` as { trashed: boolean }[])[0].trashed === false)

  const T2 = await thread('Scheduled')
  const [d] = await sql`INSERT INTO mail.drafts (account_id, thread_id, mode, to_addrs, subject, body, created_by, status, scheduled_for, scheduled_approval)
    VALUES (${account.id}, ${T2}::uuid, 'reply', ${JSON.stringify([`kunde-${tag}@example.org`])}::jsonb, 'Re: Scheduled', 'Später', ${marcel}, 'scheduled', now() + interval '1 day', gen_random_uuid()) RETURNING id` as { id: string }[]
  done(await run('email.trash', { thread_id: T2 }))
  check('trashing a conversation turns its scheduled email back into a draft — nothing leaves from Trash', (await sql`SELECT status, scheduled_for FROM mail.drafts WHERE id=${d.id}::uuid` as { status: string; scheduled_for: string | null }[])[0].status === 'draft')

  const T3 = await thread('Bulk A'), T4 = await thread('Bulk B')
  const bulk = done<{ done: number }>(await run('email.bulk', { thread_ids: [T3, T4], action: 'trash' }))
  check('bulk trash acts on each selected conversation', bulk.done === 2 && (await sql`SELECT count(*)::int AS n FROM mail.threads WHERE id IN (${T3}::uuid, ${T4}::uuid) AND trashed` as { n: number }[])[0].n === 2)
  done(await run('email.bulk', { thread_ids: [T3, T4, T2], action: 'restore' }))
  check('bulk restore brings them all back', (await sql`SELECT count(*)::int AS n FROM mail.threads WHERE id IN (${T2}::uuid, ${T3}::uuid, ${T4}::uuid) AND NOT trashed` as { n: number }[])[0].n === 3)
  done(await run('email.bulk', { thread_ids: [T3], action: 'mark_read' }))
  check('bulk mark read', (await sql`SELECT bool_and(is_read) AS r FROM mail.messages WHERE thread_id=${T3}::uuid` as { r: boolean }[])[0].r === true)
  check('bulk refuses an unknown action', (await run('email.bulk', { thread_ids: [T3], action: 'delete' })).status === 'refused')

  const composed = done<{ draft_id: string }>(await run('email.compose', { mode: 'new', to: [`neu-${tag}@example.org`], subject: `Neu ${tag}`, body: 'Entwurf' }))
  const listed = await sql`SELECT id FROM mail.drafts WHERE thread_id IS NULL AND status IN ('draft','scheduled') AND created_by=${marcel}` as { id: string }[]
  check('a new email’s draft (no conversation yet) is in the Drafts list for reopening', listed.some(r => r.id === composed.draft_id))
  const reopened = done<{ draft_id: string; revision: number }>(await run('email.compose', { draft_id: composed.draft_id, to: [`neu-${tag}@example.org`], subject: `Neu ${tag}`, body: 'Entwurf, bearbeitet' }))
  check('reopening and editing it updates the same draft (no duplicate)', reopened.draft_id === composed.draft_id && reopened.revision > 1 && (await sql`SELECT count(*)::int AS n FROM mail.drafts WHERE subject=${`Neu ${tag}`}` as { n: number }[])[0].n === 1)
  await sql`DELETE FROM mail.drafts WHERE id=${composed.draft_id}::uuid`

  console.log(`\n${passed} foundation evidence checks passed against real Postgres.`)
} finally {
  for (const t of threads) {
    await sql`DELETE FROM mail.drafts WHERE thread_id=${t}::uuid`.catch(() => undefined)
    await sql`DELETE FROM os_approvals WHERE dedupe_key LIKE ${`%${t}%`}`.catch(() => undefined)
    await sql`DELETE FROM mail.action_audit WHERE thread_id=${t}::uuid`.catch(() => undefined)
    await sql`DELETE FROM mail.business_links WHERE thread_id=${t}::uuid`.catch(() => undefined)
    await sql`DELETE FROM mail.messages WHERE thread_id=${t}::uuid`.catch(() => undefined)
    await sql`DELETE FROM mail.threads WHERE id=${t}::uuid`.catch(() => undefined)
  }
  for (const c of clients) {
    await sql`DELETE FROM os_files WHERE client_id=${c}::uuid`.catch(() => undefined)
    await sql`DELETE FROM os_followups WHERE client_id=${c}::uuid`.catch(() => undefined)
    await sql`DELETE FROM os_activities WHERE client_id=${c}::uuid`.catch(() => undefined)
    await sql`DELETE FROM os_approvals WHERE dedupe_key LIKE ${`%${c}%`}`.catch(() => undefined)
    await sql`DELETE FROM os_clients WHERE id=${c}::uuid`.catch(() => undefined)
  }
}
