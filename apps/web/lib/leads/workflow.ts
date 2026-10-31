/**
 * The lead workflow (ADR-0027 §3). SERVER ONLY.
 *
 * Not a workflow engine. Five rules, written down here, each one EVENT → CONDITION → ACTION, every
 * action an existing capability through the engine (so it is idempotent, audited and approval-gated
 * exactly like Marcel's own clicks), every transition a line on the lead's timeline:
 *
 *   1. lead has a website, no research yet, new           → the Research Agent      (reads the site; the ONE
 *                                                             research path, ADR-0033 A3: requestResearch,
 *                                                             exactly what the lead screen and Max use)
 *   2. research done, qualified, email, no open draft      → outreach.draft         (GREEN: writes a draft)
 *   3. draft confirmed by Marcel                            → outreach.send          (AMBER: Marcel confirms; policy)
 *                                                             → follow-up "if no reply" (in outreach.send)
 *   4. follow-up due, still no reply, prospect mail allowed → outreach.draft follow_up (GREEN: a draft, not a send)
 *   5. a reply arrives in a conversation with the lead      → activity.log reply_received: stage → responded,
 *                                                             "if no reply" follow-ups cancelled; open
 *                                                             outreach drafts/sends for the lead withdrawn
 *
 * Nothing in here sends. The only send is rule 3, and it is Marcel's confirmation. Rules 1, 2 and 4
 * run on their own only when the owner sets LEAD_WORKFLOW=1; until then they run when Marcel presses
 * the button on the lead screen. Rule 5 always runs.
 *
 * WHO RUNS IT: `sweepLeads` — after each OS screen load (the shell sweep, like scheduled mail) and
 * from the daily cron; `applyLeadReply` also straight after an inbound email is accepted. A sweep
 * does at most one research per call (a model call costs money and seconds) and a few cheap steps.
 * Two sweeps at once are safe: research is claimed with one conditional UPDATE, and every other
 * step goes through runCapability with a deterministic request id, so a repeat returns the first
 * answer instead of acting twice.
 */
import { requestResearch } from '@/lib/agents/work'
import { runCapability } from '@/lib/commercial/engine'
import type { LeadRow } from '@/lib/commercial/records'
import type { Sql } from '@/lib/commercial/types'
import { STALE_MINUTES } from './run'

export const WORKFLOW_ACTOR = 'os:workflow'

/** Whether the provider's spam folder is read for inbound mail (the Hostinger REST API is connected). */
export const spamCheckOn = (env: Record<string, string | undefined> = process.env) =>
  !!env.HOSTINGER_MAIL_API_TOKEN && !!env.HOSTINGER_MAILBOX_RESOURCE_ID && env.MAXPROMO_EVIDENCE_MODE !== '1'

/** Minutes a reply waits for its spam verdict before it counts anyway (the check failed or is slow). */
export const SPAM_WAIT_MINUTES = 15

/** Rule 5 — an inbound email in a conversation that is the lead's and where Maxpromo wrote first.
 * Spam must not move a lead (risk 146): a message the provider filed as Junk, or in a quarantined
 * conversation, never counts; while spam checking is on, an unverified message waits for its verdict
 * (at most SPAM_WAIT_MINUTES — the sweep catches it up). */
export async function applyLeadReply(sql: Sql, messageId: string, env: Record<string, string | undefined> = process.env): Promise<{ applied: number }> {
  const verify = spamCheckOn(env)
  const rows = await sql`
    SELECT m.id, m.subject, m.sender, bl.entity_id AS lead_id FROM mail.messages m
    JOIN mail.threads t ON t.id = m.thread_id AND t.quarantine IS NULL
    JOIN mail.business_links bl ON bl.thread_id = m.thread_id AND bl.entity_kind = 'lead' AND bl.match_status = 'owner_confirmed'
    WHERE m.id = ${messageId}::uuid AND m.direction = 'inbound'
      AND m.provider_state IS DISTINCT FROM 'junk'
      AND (NOT ${verify} OR m.provider_state IS DISTINCT FROM 'unverified' OR m.received_at < now() - make_interval(mins => ${SPAM_WAIT_MINUTES}))
      AND EXISTS (SELECT 1 FROM mail.messages o WHERE o.thread_id = m.thread_id AND o.direction = 'outbound' AND o.received_at <= m.received_at)` as { id: string; subject: string; sender: string; lead_id: string }[]
  let applied = 0
  for (const r of rows) {
    const res = await runCapability(sql, {
      requestId: `lead-reply:${r.id}:${r.lead_id}`, actor: 'os:mail', channel: 'email', capability: 'activity.log',
      input: { lead_id: r.lead_id, kind: 'reply_received', summary: `Reply by email: ${r.subject || '(no subject)'}`.slice(0, 2000) },
    })
    if (res.status !== 'done') continue
    applied++
    /* Nothing more goes out to someone who just answered: unsent outreach for this lead is withdrawn. */
    await sql`UPDATE mail.drafts SET status = 'draft', scheduled_for = NULL, scheduled_approval = NULL, schedule_error = 'They replied — this outreach was not sent.', revision = revision + 1, updated_at = now()
      WHERE entity_kind = 'lead' AND entity_id = ${r.lead_id} AND family IN ('outreach','follow_up') AND status = 'scheduled'`
    await sql`UPDATE os_approvals SET status = 'superseded', decided_at = now(), decided_by = 'os:mail'
      WHERE status = 'pending' AND (dedupe_key = ${`outreach.send:lead:${r.lead_id}`}
        OR dedupe_key IN (SELECT 'email.deliver:draft:' || id FROM mail.drafts WHERE entity_kind = 'lead' AND entity_id = ${r.lead_id} AND family IN ('outreach','follow_up')))`
  }
  return { applied }
}

export interface SweepResult { researched: number; drafted: number; followUps: number; replies: number }

/** Rules 1, 2 and 4 act on their own and spend model calls, so they run only when the owner has
 * switched them on (LEAD_WORKFLOW=1). Rule 5 only ever stops things and always runs. */
export const automaticRulesOn = (env: Record<string, string | undefined> = process.env) => env.LEAD_WORKFLOW === '1'

/** One pass over the rules. Cheap unless it researches (at most one lead). */
export interface SweepDeps {
  env?: Record<string, string | undefined>
  /** Starts research of one lead; true when it started. Default: delegate to the Research Agent. */
  research?: (sql: Sql, lead: LeadRow) => Promise<boolean>
}

const delegateResearch = async (sql: Sql, lead: LeadRow) => {
  const r = await requestResearch(sql, { lead, requestedBy: WORKFLOW_ACTOR, source: 'workflow' })
  return r.ok
}

export async function sweepLeads(sql: Sql, today: string, deps: SweepDeps = {}): Promise<SweepResult> {
  const out: SweepResult = { researched: 0, drafted: 0, followUps: 0, replies: 0 }

  /* Rule 5, catching up on anything the inbound hook missed (deterministic request ids make it a no-op otherwise). */
  const recent = await sql`SELECT m.id FROM mail.messages m JOIN mail.business_links bl ON bl.thread_id = m.thread_id AND bl.entity_kind = 'lead' AND bl.match_status = 'owner_confirmed'
    WHERE m.direction = 'inbound' AND m.received_at > now() - interval '3 days' ORDER BY m.received_at DESC LIMIT 20` as { id: string }[]
  for (const m of recent) out.replies += (await applyLeadReply(sql, m.id, deps.env ?? process.env)).applied

  if (!automaticRulesOn(deps.env)) return out

  /* Rule 1: research one new lead that has a website (requested explicitly first, then fresh ones). */
  const candidate = await sql`SELECT id FROM os_leads
    WHERE website IS NOT NULL AND btrim(website) <> '' AND status IN ('discovered','new','qualified')
      AND (research->'site'->>'state' = 'requested'
           OR (research->'site' IS NULL AND created_at > now() - interval '14 days')
           OR (research->'site'->>'state' = 'running' AND (research->'site'->>'at')::timestamptz < now() - make_interval(mins => ${STALE_MINUTES})))
    ORDER BY (research->'site'->>'state' = 'requested') DESC NULLS LAST, created_at DESC LIMIT 1` as { id: string }[]
  if (candidate[0]) {
    const lead = (await sql`SELECT * FROM os_leads WHERE id = ${candidate[0].id}::uuid` as LeadRow[])[0]
    if (lead && await (deps.research ?? delegateResearch)(sql, lead)) out.researched++
  }

  /* Rule 2: a qualified lead with an email and no outreach draft yet gets one (a draft; nothing is sent). */
  const ready = await sql`SELECT l.id FROM os_leads l
    WHERE l.status = 'qualified' AND l.email IS NOT NULL AND l.research->'site'->'qualification'->>'qualified' = 'true'
      AND NOT EXISTS (SELECT 1 FROM mail.drafts d WHERE d.entity_kind = 'lead' AND d.entity_id = l.id::text AND d.family IN ('outreach','follow_up') AND d.status <> 'discarded')
    ORDER BY l.updated_at DESC LIMIT 2` as { id: string }[]
  for (const l of ready) {
    const r = await runCapability(sql, { requestId: `workflow-draft:${l.id}`, actor: WORKFLOW_ACTOR, channel: 'os', capability: 'outreach.draft', input: { lead_id: l.id, channel: 'email' } })
    if (r.status === 'done') out.drafted++
  }

  /* Rule 4: an "if no reply" follow-up that is due on a lead still waiting gets a follow-up draft, once. */
  const due = await sql`SELECT f.id, f.lead_id FROM os_followups f JOIN os_leads l ON l.id = f.lead_id
    WHERE f.status = 'open' AND f.unless_reply AND f.due_on <= ${today} AND l.status = 'contacted'
      AND NOT EXISTS (SELECT 1 FROM mail.drafts d WHERE d.entity_kind = 'lead' AND d.entity_id = f.lead_id::text AND d.family = 'follow_up' AND d.status IN ('draft','scheduled','sending'))
    ORDER BY f.due_on LIMIT 2` as { id: string; lead_id: string }[]
  for (const f of due) {
    const r = await runCapability(sql, { requestId: `workflow-followup:${f.id}`, actor: WORKFLOW_ACTOR, channel: 'os', capability: 'outreach.draft', input: { lead_id: f.lead_id, channel: 'email', follow_up: true } })
    if (r.status === 'done') out.followUps++
  }
  return out
}

