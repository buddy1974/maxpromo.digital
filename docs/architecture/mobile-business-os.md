# Maxpromo from the phone — the mobile business operating layer

Status: **built and proved against the evidence lab; not merged, not migrated, not deployed.**
Last updated: 2026-10-07. Decision record: **ADR-0018** (proposed).

Telegram is the interface. OpenClaw is the execution layer. **Maxpromo OS is the commercial system
of record.** This document is the single reference for how the three fit; it does not restate the
code, it says where things live and why.

---

## 1. What existed (forensic inventory, 2026-10-07)

| Capability | Where | Classification |
|---|---|---|
| Clients, leads, Angebote, Rechnungen, jobs board | Maxpromo OS (`apps/web` `/os`, Neon eu-central-1, `os_*`) | **EXISTS** — browser-only (session cookie) |
| Per-year document numbering | `next_angebot_number()` / `next_invoice_number()`, `doc_seq.*` | **EXISTS** — allocators were duplicated inside two routes → moved to `lib/documents/allocate.ts` |
| Legal identity, §19 UStG, bank, MoMo | `@maxpromo/config` + `lib/documents/identity.ts` (server only) | **EXISTS** |
| Document emails | inside `send-angebot` / `send-invoice` routes | **EXISTS** → moved to `lib/documents/emails.ts` |
| Line-item provenance guard | `lib/documents/extraction-guard.ts` | **EXISTS** — gate extended to `lib/` writers |
| Outstanding / overdue | dashboard + invoice list, two copies | **BROKEN** — counted deposits as owed, added EUR to GBP, `overdue` never set (risk 58) → one definition, `lib/commercial/money.ts` |
| Lead pipeline stages | `os_leads.status`: 5 triage words, screens and schema disagreed | **PARTIAL** → one vocabulary, `lib/commercial/pipeline.ts`, legacy words mapped in code |
| Activities, follow-ups, payments, recurring, incidents, files, approvals, audit | — | **MISSING** → migration 0011 |
| Outbound Telegram notifications (forms → Marcel) | `lib/telegram.ts` | **EXISTS** — one-way, unchanged |
| Telegram as a governed client | OpenClaw Mission Control *Mobile Command* (`feature/telegram-mobile-command`, 2026-10-07) | **EXISTS, unmerged, Gateway plugin not installed** |
| OpenClaw CRM (contacts, opportunities, follow-ups) | Mission Control `.data/crm` (JSON) | **DUPLICATE** — 0 records in production → superseded for commercial use |
| Angebot / Rechnung from the phone | Mission Control census | **BLOCKED** ("no numbering/VAT/bank source") → unblocked through the OS |
| Task runtime, research, investigation, repo checks | Mission Control task runtime + worker | **EXISTS** |
| Platform health, event log | Mission Control | **EXISTS** |
| Scheduler | none in Mission Control server code (static-lint forbids timers); Gateway plugin polls every 60 s | **PARTIAL** → notices ride the existing poll; no new scheduler |
| Email sending | Resend, one transport (`lib/email.ts`) | **EXISTS** — gained provider idempotency keys |
| Mailbox reading (Gmail/Hostinger) | — | **EXTERNAL AUTH REQUIRED** (not connected to either system) |
| WhatsApp sending | — | **MISSING by design** — the OS opens WhatsApp with text filled in; it never sends |
| Deploy from phone | Mission Control `deployment.release` | **UNAVAILABLE** (unchanged; no governed deploy path) |
| Vercel / Cloudflare / DNS status | Mission Control `infrastructure.status` | **UNAVAILABLE** (no adapter) |
| n8n | Mission Control (governed provider step) | **NEEDS CONFIG** per its census |
| Backups | Neon point-in-time restore (provider); MC `.data` backup machinery | **NOT VERIFIED here** — see §11 |

## 2. Architecture

```
Marcel's phone ── Telegram ──▶ OpenClaw Gateway (one bot, long polling)
                                   │  plugin openclaw-mobile-command (tool, buttons, notices poll)
                                   ▼  loopback + scoped bearer
                         Mission Control  /api/mobile-command/*
                           identity (numeric id) → profile → route (regex, deterministic)
                           → census readiness → target (never guessed) → Confirm token (AMBER)
                           → operation ──┬─ OpenClaw domain (tasks, health, repos, files, research)
                                         └─ commerce bridge ──▶ HTTPS, HMAC-signed
                                                                 ▼
                              Maxpromo OS  /api/os/agent/v1/{run,execute,reject,capabilities}
                                gate (signature, nonce, actor) → engine (idempotency, approvals)
                                → capability registry (42) → Neon eu-central-1 (os_*)
                                → Resend (only after an executed approval)
```

## 3. Source of truth

| Entity | Authoritative system | Others hold |
|---|---|---|
| Company / client | Maxpromo OS `os_clients` | MC: focus reference |
| Contact person | Maxpromo OS (`os_leads.name`, `os_clients.name`) | — (MC CRM superseded) |
| Lead / opportunity / pipeline stage | Maxpromo OS `os_leads` | MC: focus reference |
| Conversation (chat context) | Mission Control `.data/mobile-command/conversations` | — |
| Activity / interaction / note | Maxpromo OS `os_activities` | MC event log: that a turn happened, not what |
| Follow-up | Maxpromo OS `os_followups` | — |
| Angebot (proposal) | Maxpromo OS `os_angebote` + `doc_seq.angebot_*` | — |
| Rechnung (invoice) | Maxpromo OS `os_invoices` + `doc_seq.invoice_*` | — |
| Payment received | Maxpromo OS `os_payments` | bank account (actual money) |
| Recurring service | Maxpromo OS `os_recurring` | — |
| Project | Maxpromo OS `os_jobs` | MC Workspace Registry: the *repository* |
| File (business) | metadata: Maxpromo OS `os_files`; bytes: OpenClaw attachment store | never Telegram (the column refuses `telegram:`) |
| Repository, tests, CI | GitHub / MC Workspace Intelligence | — |
| Deployment state | Vercel | — |
| Domain / DNS | registrar / Cloudflare | — |
| Mailbox | Resend (sent); the mailbox provider (received) | OS activity: that it was sent |
| Approval of a commercial action | Maxpromo OS `os_approvals` | MC pending: the Confirm token bound to it |
| Commercial audit | Maxpromo OS `os_audit` (append-only) | MC event log: `mobile.turn`, `mobile.confirmation` |
| Incident (client system) | Maxpromo OS `os_incidents` | MC: engineering task when investigated |
| Background job | Mission Control task runtime | — |

## 4. Capability registry and risk

Defined once in `apps/web/lib/commercial/registry.ts`; Mission Control's census mirrors each as
`os.<id>` (`commerce-capabilities.ts`) and binds them from one table.

| Family | GREEN (runs) | AMBER (prepare → Confirm → execute once) |
|---|---|---|
| Owner | `owner.attention`, `owner.money_today`, `owner.overview`, `owner.brief`, `owner.notices`, `approvals.pending`, `commercial.search` | — |
| Leads & pipeline | `lead.check`, `lead.create`, `lead.update`, `lead.find`, `lead.history`, `pipeline.show`, `note.add`, `activity.log`, `followup.create/due/done` | — |
| Outreach | `outreach.draft`, `outreach.whatsapp_link` | `outreach.send` |
| Documents | `proposal.create/show/list`, `invoice.create` | `proposal.send`, `proposal.accept`, `invoice.send` |
| Money | `receivables.show`, `payments.list`, `recurring.show` | `payment.record`, `reminder.send`, `recurring.create` |
| Projects & support | `project.status/update`, `file.attach/list`, `incident.create/update/list`, `upsell.suggest` | — |

RED (secrets, credential changes, deletion, security weakening) has no capability and is refused by
Mission Control before routing.

**Why drafts are GREEN.** A numbered draft Angebot or Rechnung is an internal record Marcel can see
and correct; numbering at save is the OS's existing rule (risks 57/63). Nothing reaches a client
until an AMBER send is executed.

## 5. The approval model

- **Prepare** (`run` on an AMBER capability): the OS resolves the target, fixes the full payload
  (recipient, subject, body, amount, document version), stores `os_approvals` with
  `sha256(capability + stable payload)` and an expiry, and returns the one-screen preview.
- **Bind**: Mission Control stores `{approvalId, payloadHash}` as the parameters of its own pending
  action, digested; the Confirm token (16 random bytes, only its hash stored) is bound to it.
- **Execute**: one conditional `UPDATE … WHERE status='pending' AND payload_hash=$ AND expires_at>now()`
  claims it; two simultaneous Confirms execute once. A replay returns the first result. A different
  hash is refused. A send is bound to the hash of the rendered email (every printed field) and
  re-checks the document's status, so an edited, accepted, paid or cancelled document is not sent.
- **Commit**: the moment an external effect happens the execution says so (`ctx.committed`); a
  failure after it is reported as done-but-not-fully-recorded, never as "nothing done".
- **Supersede**: preparing a different payload for the same action (same lead, same Angebot, …)
  supersedes the older pending approval, so an old button can never send an old version.
- **Cancel**: MC's Cancel rejects the OS approval too.
- **Queue**: "What needs my approval?" lists pending approvals; each can be reviewed and confirmed.

## 6. The contract

`POST /api/os/agent/v1/<action>` with headers `x-maxpromo-agent-timestamp`, `-nonce`, `-signature`,
where `signature = base64url(HMAC-SHA256(OS_AGENT_SECRET, ts\nnonce\nPOST\npath\nsha256hex(body)))`.
Both sides carry a shared test vector. Body: `{ actor: "telegram:<id>", channel, requestId,
capability, input }` (run) or `{ approvalId, payloadHash }` (execute/reject). Answer: `status` =
`done | approval_required | refused | failed`; only `done` after `execute` means a consequential
thing happened.

## 7. Data model (migration 0011)

Additive and idempotent; applied to the evidence lab only. `os_leads` gains pipeline fields; links
`angebot↔lead/job`, `invoice↔angebot/job` (+ `kind` deposit/final/standard, unique per Angebot);
new `os_activities`, `os_followups` (one open per record per day), `os_payments`,
`os_recurring`, `os_incidents` (open dedupe key), `os_files` (refuses `telegram:` storage),
`os_approvals`, `os_audit` (append-only trigger), `os_agent_nonces`, `os_agent_results`
(request idempotency). No existing value is rewritten.

## 8. Conversation and context

Mission Control keeps, per actor and chat, the OS records the conversation is about (newest first,
one per kind), the last business checked but not saved, and the request awaiting a choice.
"Them" fills the lead; "send it" the draft, Angebot or invoice; "shorter" the draft — **only when
the request names nothing else**. Several matches become buttons (`use lead <id>`); picking one
continues a GREEN request, and re-asks an AMBER one so it is prepared and confirmed afresh.

## 9. Proactive events and scheduling

No scheduler was added. The Gateway plugin already polls Mission Control every 60 s for notices;
Mission Control now adds the OS's `owner.notices` — new inbound enquiries, follow-ups due today,
invoices overdue (one key per invoice per week), critical incidents, renewals, uncertain sends —
each with a stable key, delivered once, at most five per poll, most severe first. The morning brief
joins as one notice per day from an opt-in hour (`morningBriefHour` in the link config).

## 10. Security

| Threat | Control | Proved by |
|---|---|---|
| Stranger finds the bot | numeric-id binding in MC; OS `OS_AGENT_ALLOWED_ACTORS` (required) | MC tests; agent proof (403); boundary gate rule 1b |
| A non-owner profile reads the business | business sections and notices only for profiles allowed `os.*` | MC tests |
| An old button after the world moved on | sends re-check status at execute and are bound to the rendered email's hash | agent proof (stale send after acceptance, cancelled invoice, changed payment terms) |
| Money twice | final invoice refused while a deposit is owed; payments re-checked under a row lock | agent proof (double billing, concurrent payments) |
| Words misread as acts | questions and negations never route to payment or acceptance; named businesses searched by name; unreadable amounts refused | MC tests |
| A send whose bookkeeping fails | `ctx.committed` — reported as sent, never as "nothing done" | boundary gate rule 7 |
| Spoofed / forged call to the OS | HMAC over body+path+method+time; fail closed | boundary gate; agent proof; live forged-secret test |
| Replay | nonce PK; ±300 s window; request-id idempotency; single-use approvals | agent proof (replay, double tap, concurrent confirm) |
| Approval reused for another payload | payload hash binding; supersede; document version | agent proof |
| Agent credential opens the OS screens | middleware exempts only `/api/os/agent/`; cookie routes unchanged | boundary gate; agent proof (401 on `/api/os/invoices`) |
| Prompt injection in researched content | drafting prompt treats facts as data; research job told the same; nothing executes from model output — every consequential act needs Confirm | agent proof (hostile research fact) |
| Secret leakage | secrets in files/env only; audit redaction; MC `redactForChat`; no secret in any response | client test (secret never on the wire) |
| Double send after timeout | Resend idempotency key = approval id; uncertain outcome reported as UNCERTAIN | engine; bridge tests |
| Unknown commercial action | registry refuses unknown ids and unexpected input fields | agent proof |

## 11. Backup and recovery

The new tables live in the same Neon database as the rest of the OS and are therefore inside
whatever protects it — **which this build did not verify** (Neon point-in-time restore depends on
the plan and retention configured; not inspected). Mission Control's conversation state is
reconstructible references; losing it loses context, not business data. File bytes in the
OpenClaw attachment store are on one machine (known risk 75).

## 12. Rollout status

| | |
|---|---|
| **LIVE** | nothing new — production is untouched |
| **READY, NEEDS CONFIG** (Marcel) | migration 0011 in production; `OS_AGENT_SECRET` + `OS_AGENT_ALLOWED_ACTORS` on the web project; merge + deploy web; MC link (`ensure-maxpromo-os-link.mjs`); merge + deploy Mission Control |
| **READY, NEEDS AUTH** (Marcel) | Gateway plugin install + Telegram actor binding + tool policy (AF-33) — the Telegram side of Mobile Command, as documented in its own handover |
| **READY, NEEDS BUSINESS DATA** | pipeline values, recurring services, payments recorded going forward (history before 0011 has none) |
| **FUTURE** | mailbox reading, WhatsApp sending, deploy and infrastructure from the phone, durable file storage, staff roles, Telegram Mini App |

## 13. Operations

```bash
npm run verify                                   # includes prove:commercial-boundary
npm run evidence:migrate -- apps/web/db/migrations/0011-commercial-core.sql   # evidence lab only
OS_AGENT_SECRET=… OS_AGENT_ALLOWED_ACTORS=telegram:100000001 npm run dev:web  # evidence runtime
OS_AGENT_SECRET=… npm run prove:commercial-agent                              # 85 properties
OS_AGENT_SECRET=… MISSION_CONTROL_DIR=… npm run prove:mobile-live            # both systems
```
