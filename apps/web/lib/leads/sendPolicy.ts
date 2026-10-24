/**
 * The prospect send policy (ADR-0027 §4). SERVER ONLY.
 *
 * Maxpromo writes four kinds of email, and they are not governed alike:
 *
 *   relationship   one-to-one with someone already in conversation (a reply, a project update)
 *   transactional  invoices, quotations, reminders — commercial documents
 *   prospect       a first contact or follow-up to a LEAD (families `outreach` and `follow_up` on a lead)
 *   broadcast      newsletter — its own consent list, not this module
 *
 * Only `prospect` is checked here, because only it can be unsolicited advertising. In Germany that
 * generally needs the recipient's prior express consent, businesses included (UWG §7(2) Nr. 2). The
 * OS does not decide the law; it records a basis and refuses to send without one:
 *
 *   enquiry   the business asked first: an intake receipt, or an email from that address
 *   consent   Marcel recorded documented consent (lead.basis, owner only, audited)
 *   customer  Marcel recorded an existing customer relationship (lead.basis)
 *   test      every recipient is on OUTREACH_TEST_RECIPIENTS — the evidence/test route
 *
 * With none of these the send is refused at confirmation AND again at the moment of sending (a
 * scheduled send included), so a basis withdrawn or a reply received in between still stops it.
 * `OUTREACH_EMAIL=off` refuses every prospect email. No setting allows cold email without a basis;
 * changing that is a code change after Marcel's legal answer, not a switch.
 *
 * A lead who has answered gets no more `outreach`/`follow_up` mail: replying happens in the
 * conversation (family `reply`), which is relationship mail.
 */
import type { Sql } from '@/lib/commercial/types'

export type Basis = 'enquiry' | 'consent' | 'customer' | 'test'
export type PolicyResult = { allowed: true; basis: Basis | 'not_prospect' } | { allowed: false; code: 'off' | 'no_basis' | 'replied' | 'closed'; reason: string }

const PROSPECT_FAMILIES = new Set(['outreach', 'follow_up'])
const ANSWERED = new Set(['responded', 'discovery', 'proposal', 'negotiation', 'won'])

export function testRecipients(env: Record<string, string | undefined> = process.env): Set<string> {
  return new Set((env.OUTREACH_TEST_RECIPIENTS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(s => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)))
}

export function isProspectMail(d: { family: string; entity_kind: string | null }): boolean {
  return d.entity_kind === 'lead' && PROSPECT_FAMILIES.has(d.family)
}

/** The basis on record for writing to this lead, or null. Reads; changes nothing. */
export async function recordedBasis(sql: Sql, leadId: string, recipients: string[]): Promise<Exclude<Basis, 'test'> | null> {
  const owner = await sql`SELECT detail->>'basis' AS basis FROM os_activities WHERE lead_id=${leadId}::uuid AND kind='contact_basis' ORDER BY created_at DESC LIMIT 1` as { basis: string | null }[]
  if (owner[0]?.basis === 'consent' || owner[0]?.basis === 'customer') return owner[0].basis
  if (owner[0]?.basis === 'withdrawn') return null
  const intake = await sql`SELECT 1 FROM os_intake_receipts WHERE lead_id=${leadId}::uuid LIMIT 1`
  if (intake.length) return 'enquiry'
  if (recipients.length) {
    const wrote = await sql`SELECT 1 FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id
      WHERE m.direction='inbound' AND t.quarantine IS NULL AND lower(m.sender) = ANY(${recipients.map(r => r.toLowerCase())}) LIMIT 1`
    if (wrote.length) return 'enquiry'
  }
  return null
}

export async function prospectPolicy(sql: Sql, d: { family: string; entity_kind: string | null; entity_id: string | null; to_addrs: string[]; cc_addrs: string[]; bcc_addrs: string[] },
  env: Record<string, string | undefined> = process.env): Promise<PolicyResult> {
  if (!isProspectMail(d) || !d.entity_id) return { allowed: true, basis: 'not_prospect' }
  if (env.OUTREACH_EMAIL === 'off') return { allowed: false, code: 'off', reason: 'Prospect email is switched off (OUTREACH_EMAIL=off). Nothing was sent.' }
  const lead = await sql`SELECT status FROM os_leads WHERE id=${d.entity_id}::uuid` as { status: string }[]
  if (!lead[0] || lead[0].status === 'lost') return { allowed: false, code: 'closed', reason: 'This lead is closed. Nothing was sent.' }
  if (ANSWERED.has(lead[0].status)) return { allowed: false, code: 'replied', reason: 'They have answered: reply in the conversation instead of sending outreach. Nothing was sent.' }
  const all = [...d.to_addrs, ...d.cc_addrs, ...d.bcc_addrs].map(a => a.toLowerCase())
  const tests = testRecipients(env)
  if (all.length && all.every(a => tests.has(a))) return { allowed: true, basis: 'test' }
  const basis = await recordedBasis(sql, d.entity_id, all)
  if (basis) return { allowed: true, basis }
  return { allowed: false, code: 'no_basis', reason: 'No lawful basis is recorded for emailing this business (UWG §7: advertising email needs prior consent, also to companies). Record their enquiry or consent first, or contact them by phone or letter. Nothing was sent.' }
}
