# Control-plane reconciliation — forensic baseline

Status: **Current-state forensic baseline and target delta.** Phase 1 of the post-activation
sequence (`tasks/todo.md`). Written 2026-10-23 against main `4013782`. Nothing was moved,
merged, deleted, rotated or deployed to produce it.

Method: three independent code traces (OS in `apps/web`, both Agent Bureau copies,
OpenClaw/Max Agents/Telegram), plus direct production evidence: Vercel project, deployment,
alias and env-name inventory (names only), 30 days of production request logs for the agent
door, anonymous probes of both Bureau deployments, an authenticated read-only look at `/os`,
and the read-only production SQL already recorded for the email activation. Every claim
below cites code or a production observation. "Documented only" marks a claim the code or
production does not show.

Locked target (Marcel, 2026-10-23): Maxpromo OS = **Business Control Plane**, Max Agent
Bureau = **Agent Control Plane**, Telegram = **Owner Control Plane**, Max Agents =
**intelligence/orchestration layer**. Channels feed the OS and are never independent brains.
`/os` is Marcel's primary daily home. Reconciliation does not mean merging the applications.

---

## 1. Executive architecture summary

1. **There are not two systems but three, and the third is gone.** Telegram and "Max Agents"
   ran in OpenClaw Mission Control on Marcel's Windows machine (ADR-0018). Codex logs show it
   in use on 2026-10-16. By 2026-10-22 there was no `~/.openclaw`, no `openclaw` command, no
   Gateway task and nothing listening on port 18789 (`docs/deployment/hostinger-activation.md`).
   No document records its removal. Production logs agree: the last authenticated agent-door
   call was 2026-10-16 11:52Z. **The Owner Control Plane does not exist today.**
2. **"Two repositories" is already one.** ADR-0001 moved Agent Bureau into this monorepo as
   `apps/bureau` (subtree, 2026-09-03). The standalone repository has no commit the monorepo
   lacks; its HEAD is the subtree split point. But it was **never archived**. Its own Vercel
   project (`maxpromo-agent-bureau`) is still connected and **rebuilt its June code as a
   Production deployment on 2026-10-22**. It holds `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`,
   `DATABASE_URL` and `AUTH_SECRET`, at `maxpromo-agent-bureau.vercel.app`.
3. **The Agent Bureau is a supervised-agent product demo, not a control plane.**
   - Agents are static records (`status: "active"` hard-coded).
   - There is no runtime, scheduler, queue or tool use. `agent_runs` and `memory_entries` are
     never written.
   - 14 of 19 dashboard pages render `lib/mock/*` or static data. The five DB-backed pages show
     demo seed data.
   - Approving changes a status row and runs nothing.
   - Marcel's only login lives in the tenant "Maxpromo Demo Operations".
   - Production reports "no provider key — the agents cannot run".
   - Its only real-data path is the public lead form, and those leads never reach the OS.
4. **The OS is the only real system of record and the only real governance.** It has 53
   capabilities (9 AMBER, 44 GREEN, 0 RED), hash-bound single-use approvals (`os_approvals`), an
   append-only audit (`os_audit`), HMAC actor identity with nonce replay protection and request
   idempotency. But that governance is reachable only from the agent door, the Inbox and the
   WhatsApp bridge. **Every other `/os` screen writes the same tables through older CRUD
   routes**, with no approval, audit or idempotency. Several of them send email.
5. **"What needs Marcel's attention today?" is already computed, and nobody sees it.**
   `owner.attention`, `owner.brief`, `owner.notices` and `approvals.pending`
   (`lib/commercial/capabilities/views.ts`) cover leads, follow-ups, quotes, receivables,
   renewals, incidents, late jobs, approvals, uncertain sends, WhatsApp handovers and email
   needing reply. Only the (now absent) Mission Control could pull them. The `/os` dashboard
   shows four counters and recent lists.
6. **"Max Agents" is a name, not an implementation.** It covers five different things: the
   Bureau demo agents, OpenClaw's removed `max-agents` runtime agent, ADR wording ("Max Agents
   orchestrates"), a dead public "MaxAgent" audit endpoint, and "Max", the website chat and
   WhatsApp assistant. No orchestration code connects business state, agents and execution.

## 2. Current Maxpromo OS (`apps/web`, `/os`)

- **Runtime:** Next.js 16.4.2, one Vercel project (`maxpromo-digital`) serving ten public
  domains plus `/os`. Neon eu-central-1. Production is `016ceb5`
  (`dpl_GQwE9b3vtfvKRFcMt1EdwLrRSNvy`). Health ok.
- **Auth:**
  - One shared `OS_PASSWORD`, so the session subject is always `marcel`.
  - HMAC cookie with a 7-day TTL, no server-side revocation, no 2FA, no staff role.
  - `OS_SESSION_SECRET` also derives the mail locator key, so rotating it affects stored mail.
  - The agent door has its own HMAC (`OS_AGENT_SECRET`, `OS_AGENT_ALLOWED_ACTORS`).
  - Middleware skips every `/api/*` outside `/api/os`.
- **Real screens:** Dashboard, Clients, Invoices, Quotes, Jobs, Leads, Newsletter, Inbox, the
  AI Assistant slide-over and Quick Scan.
- **No screen exists for** approvals, audit, activities, follow-ups, payments, recurring,
  incidents, files or WhatsApp conversations. These are reachable only through capabilities.
- **Governed path:** `lib/commercial/engine.ts` and `lib/commercial/registry.ts`.
- **Ungoverned paths:**
  - `/api/os/send-angebot` takes its recipients from the request body.
  - `/api/os/send-invoice` builds the email from request amounts (risk 80).
  - `/api/os/newsletter` sends a bulk HTML broadcast.
  - `PATCH /api/os/invoices` can mark an invoice paid without an `os_payments` row.
  - Hard `DELETE` works on leads, clients, quotes, issued invoices and jobs.
  - None of these is audited or idempotent.
  - The idempotency rule in `prove:commercial-boundary` only checks `lib/commercial/`.
- **AI:**
  - About 13 call sites, all Anthropic `claude-sonnet-4-6` with an OpenAI `gpt-4o-mini`
    fallback.
  - No model has real tools; the only tool is a forced `respond` JSON schema.
  - Untrusted content (email, WhatsApp, contact form, research facts) reaches outreach and
    email drafting inside data-not-instructions framing. Sending still needs a full-text AMBER
    approval.
  - `/api/voice-enhance` is a **public, unauthenticated model proxy**. The contact page's voice
    widget uses it, and its only guard is an in-memory 20/min limit.
- **Ask Max:** three unrelated assistants share the name:
  - the website chat (`/api/chat/message`);
  - the OS AI Assistant (`/api/os/ai`), a stateless chat with no tools and no writes, whose
    system prompt duplicates the address and IBAN held in `lib/documents/identity.ts`;
  - the WhatsApp responder, whose output drives replies and four GREEN capabilities.
- **Scheduling:** none. There are no crons. The mail content worker is unscheduled, and notices
  and the brief are pull-only.
- **Telegram:** `lib/telegram.ts` is send-only to one chat, from `/api/contact`,
  `/api/newsletter/subscribe` and `/api/max-agent/submit`. Mission Control's `owner.notices`
  poll also emitted `lead-new` for the same contact leads, so one enquiry could notify twice.

## 3. Current Max Agent Bureau

| | Production `agents.maxpromo.digital` | Shadow `maxpromo-agent-bureau.vercel.app` |
|---|---|---|
| Source | monorepo `apps/bureau`, Vercel `maxpromo-agents` | standalone repo `main` `a89882b` (2026-06-08) |
| Deployed | `c0bf517`, 2026-10-08 (`dpl_DDjETwCBa3nLeggAfWt8ub1pkUMY`) | rebuilt **2026-10-22 19:32Z** (`dpl_EsHzidBgkKJKZ8H2NBRJ2RDKDkYH`) |
| Next.js | 16.3.8 (main is 16.4.2) | 16.1.6 |
| Env names | `DATABASE_URL`, `AUTH_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_SITE_URL` (**no AI key**) | the same plus `ANTHROPIC_API_KEY`, `NEXTAUTH_URL`, `UPSTASH_*` |
| Public | marketing page, login, lead form; APIs 401 | the same; `/api/health` 404 (older code) |

`DATABASE_URL` and `TELEGRAM_*` were created on both projects the same day (147 days ago). The
shadow copy probably writes to the production Bureau database and Telegram chat. That is
**unproven**: confirming it means comparing secret values, which this phase does not decrypt.

**Release drift.** Eight commits touching `apps/bureau` or `packages` have landed since
`c0bf517`. One is the Next.js 16.4.2 fix for GHSA-2464-fhr4-w9xw (critical, unauthenticated
RCE in Image Optimization). They never deployed: `apps/bureau/vercel.json` still diffs only
`HEAD^..HEAD` and ignores the root lockfile. That is risk 67, fixed for web on 2026-10-06 and
deliberately left for the Bureau. The Bureau does not use `next/image` or configure remote/SVG
images, and Vercel's edge optimizer answers `/_next/image` itself
(`X-Vercel-Error: INVALID_IMAGE_OPTIMIZE_REQUEST`), so the vulnerable in-function path was not
reachable. No emergency containment was needed, but the drift is real.

**Code reality** (identical in both copies apart from i18n, health and tokens):
- **Database:** 35 drizzle tables, separate Neon in **us-east-1**. 17 tables are never read or
  written.
- **Seed-only tables:** agents, agent_proposals, approval_events, activity_logs, playbooks.
- **Empty business tables:** companies, contacts, projects, tasks, notes.
- **`lead_submissions` is the exception: real public leads**, written by `/api/leads` and pinged
  to Telegram. They are displayed nowhere and never reach `os_leads`. `/dashboard/leads` shows
  mock contacts instead.
- **AI:** the only caller is `/dashboard/ai-lab`. Raw input of up to 8,000 characters goes into
  the prompt, and the output returns to the browser only.
- **Approvals:**
  - Proposals come from the seed only.
  - Approving writes `approval_events` with actor "user" and executes nothing.
  - The status update is not atomic (`lib/db/queries/approvals.ts`), there is no idempotency
    key, and `approvals.decided_by` is unused.
- **Auth:**
  - NextAuth credentials, JWT for 8 hours, argon2id.
  - Login matches on email alone, but emails are unique only per business.
  - No CSP/HSTS headers and no MFA.
  - Rate limiting fails open if Upstash fails.
  - `safeRead` swallows database errors.
- **Tests and docs:** no unit tests; covered by `npm run verify` only. The README is stale
  (Next 15, OpenAI-first).

## 4. Current Max Agents implementation

| Meaning | Evidence | State |
|---|---|---|
| Bureau "agents" | the Bureau's static agent registry and hierarchy files | static demo records, no runtime |
| OpenClaw `max-agents` | risk 81, ADR-0018 go-live conditions, Codex logs | **removed** about 2026-10-16, unrecorded |
| "Max Agents orchestrates" | ADR-0018, `docs/openclaw/core-memory.md` | wording, no code |
| "MaxAgent" audit widget | `/api/max-agent/submit` | **dead**: public endpoint still deployed, no caller since e9f245b, Telegram only |
| "Max" assistant | `/api/chat/message`, WhatsApp runtime | live (website); WhatsApp 503 in prod |

Verdict: a **mixture**. One real governed execution path exists, the OS capability engine, and
its only real client was Mission Control. The same orchestration idea exists in four places:
Bureau approvals, OS approvals, Mission Control Confirm/Cancel, and the abandoned
`_ai-command-center` scaffold, a separate directory last touched 2026-06-12.

## 5. Current Telegram implementation

- **Senders:** `apps/web/lib/telegram.ts` (suppressed in evidence mode) and the Bureau's
  `lib/integrations/telegram/notify.ts` (not suppressed; removed 2026-10-23 by ADR-0021). They are near-identical, use the same
  env names and both live outside `packages/`. Three Vercel projects hold a
  `TELEGRAM_BOT_TOKEN`: web (154 days), and both Bureau projects (147 days).
- **Inbound:** no inbound Telegram path exists in either repository. Inbound worked only
  through the OpenClaw Gateway's long poll (risk 85), which is now gone.
- **Push notices:** `notifyActors` was never configured (risk 89).
- **`TELEGRAM_WEBHOOK_SECRET`** exists in web production, but no code reads it.
- **`chat.leads_telegram`:** no writer, a dead table.
- **Unrelated scheduled task:** `\CC Telegram Ingest` on this machine is broken (bare
  `cmd.exe`, last result 0x800710E0) and has no Maxpromo link.

## 6. Capability matrix

Target owners: BCP Business Control Plane, ACP Agent Control Plane, OCP Owner Control Plane,
IL intelligence layer, CH external channel, SC shared contract.

| Capability | Where it is today (evidence) | Production use | Write authority, approval and audit | Target |
|---|---|---|---|---|
| Leads | OS `os_leads` (CRUD, capabilities, `/api/contact`); Bureau `lead_submissions` (public form) | OS yes; Bureau yes (orphaned) | OS CRUD has no audit; capabilities log activity; Bureau write is unaudited | **BCP** (Bureau form feeds OS) |
| Clients, jobs/projects, quotes, invoices, payments, follow-ups, recurring, incidents, files | OS only (Bureau projects/tasks/contacts are empty) | yes | dual path: governed capabilities vs ungoverned CRUD | **BCP** |
| Money (owed, receivables) | `lib/commercial/money.ts`, `views.ts` | yes | read-only | **BCP** |
| Inbox / email | OS `mail.*`, Hostinger webhook | yes (GREEN 2026-10-23) | engine for `email.*`; send disabled | **BCP**, fed by **CH** |
| WhatsApp | OS `lib/channels/*` | code yes, prod 503 | 4 GREEN capabilities via bridge | **CH** into BCP |
| Website chat (Max) | OS `lib/chat/*` | yes | chat tables only; no handover | **CH** into BCP |
| Newsletter | OS `/api/os/newsletter`, `/api/newsletter/subscribe` | screen yes; public subscribe has no caller | bulk send, no approval or audit | **BCP** |
| Briefing / attention | OS `views.ts` capabilities | computed, **not displayed** | read-only | **BCP**, projected to **OCP** |
| Ask Max (OS assistant) | `/api/os/ai` | yes | no writes | **BCP** UI over **IL** |
| Capability registry / census | OS `lib/commercial/registry.ts` | yes | — | **SC** (BCP publishes, ACP and OCP consume) |
| Business-action approval | OS `os_approvals` (real); Bureau `agent_proposals`/`approvals` (demo) | OS yes | hash-bound, single-use, audited (OS) | **BCP stores and executes**; ACP and OCP request and decide (see §15) |
| Agent registry | Bureau static files | demo | none | **ACP** |
| Agent runtime / execution | none (OpenClaw removed); WhatsApp orchestrator in OS | WhatsApp only | — | **ACP**; channel responders stay in **CH** |
| Agent results / failures | `os_agent_results` (request cache), `os_incidents` | partial | — | **ACP** owns them; projected to BCP |
| Waiting room | Bureau DB seed | demo | non-atomic | **ACP** |
| Playbooks, operating model | Bureau static and seed | demo | — | **ACP** |
| Agent memory | Bureau mock; OpenClaw `.data` (gone); OS `os_activities`/`chat.*` | none real | — | **ACP** for agent memory; business history stays BCP |
| AI governance / tool register | Bureau static; OS per-call-site rules (ADR-0019) | rules yes, register demo | — | **ACP** policy; enforcement at each executor |
| AI Lab | Bureau `/dashboard/ai-lab` | demo (no key in prod) | none | **ACP** |
| Model/provider config | duplicated: `apps/web/lib/ai.ts`, the Bureau's `lib/ai/*` | yes / no | — | **IL** shared package |
| Audit | OS `os_audit` (governed only), `os_activities`, `mail.action_audit`; Bureau `activity_logs`, `approval_events` | OS yes | see §10 | BCP for business, ACP for agents; **SC** event shape |
| Telegram | two senders; Gateway removed | send-only | none | **OCP** |
| Notifications | Telegram pushes plus pull notices | partial | — | **OCP** delivery of BCP/ACP events |
| Outreach | OS `outreach.draft` / `outreach.send` (AMBER) | via agent door only | governed | **BCP** executes; IL drafts |
| Voice enhance | `/api/voice-enhance` public | yes | none | **CH** helper; needs abuse bounds |

## 7. Data ownership matrix

| Domain | Canonical store today | Other copies or writers | Split-brain risk | Target owner |
|---|---|---|---|---|
| Leads | OS `os_leads` (Neon eu-central-1) | Bureau `lead_submissions` (Neon us-east-1); Telegram messages | **Yes**: Bureau leads never reach the OS | BCP |
| Contacts/companies/projects/tasks | OS `os_clients`/`os_jobs`/`os_followups` | Bureau tables (empty, never written) | latent | BCP; drop or project in the Bureau |
| Documents, numbering, legal identity | OS (`lib/documents/*`, `doc_seq`) | IBAN duplicated in the `/api/os/ai` prompt | low | BCP |
| Business approvals and audit | OS `os_approvals`, `os_audit` | Bureau `approvals`, `approval_events` (demo) | naming and concept duplication | BCP |
| Agent definitions, proposals, runs, playbooks, memory, governance | Bureau DB (seed/static) | OpenClaw `.data` (gone) | none live | ACP |
| Conversations | OS `chat.*`, `mail.*` | OpenClaw `.data/mobile-command` (gone) | none | BCP (channel data) |
| Request idempotency / nonces | OS `os_agent_results`, `os_agent_nonces` | — | — | BCP (door) |
| Client file bytes | OpenClaw attachment store on one machine (risk 75) | — | **bytes likely gone with OpenClaw** | BCP storage, undecided |
| Browser state | Inbox filters, `mp_chat_sid` cookie | — | none | — |
| Caches | in-memory rate limits; Bureau Upstash (shadow only) | — | — | — |

Neither app connects to the other's database. The only shared-database risk is the two Bureau
deployments probably sharing one Bureau database.

## 8. API and integration map (today)

```
Browser ──cookie──▶ /os + /api/os/* (CRUD, sends) ─────────┐
Hostinger ──Bearer──▶ /api/channels/mail ──▶ mail.accept_hostinger
Meta WA ──signature──▶ /api/channels/whatsapp (503) ──▶ os-bridge (4 GREEN)
Public ──▶ /api/contact, /api/chat/*, /api/voice-enhance, /api/max-agent/submit
                                                          ▼
OpenClaw MC (GONE) ──HMAC──▶ /api/os/agent/v1/* ──▶ engine ─▶ os_* tables (Neon EU)
Public ──▶ agents.maxpromo.digital/api/leads ─▶ Bureau DB (Neon US) ─▶ Telegram
Public ──▶ maxpromo-agent-bureau.vercel.app (shadow, same routes, probably same DB)
apps/web ──▶ Telegram (send)   apps/bureau ──▶ Telegram (send)   nothing ──▶ Telegram (receive)
```

Coupling between the OS and the Bureau: **build-time packages only** (`@maxpromo/config`,
`ui`, `design-tokens`, `observability`). There is no HTTP call, no shared database, no event,
no queue and no shared secret. The only cross-system contract that exists is the signed agent
door, and its only client is gone.

## 9. Agent inventory

| Component | Runtime / model | Tools | Business writes | Approval | Memory | Status |
|---|---|---|---|---|---|---|
| OS capability engine (agent door) | Vercel / — | 53 capabilities | yes | AMBER by hash | `os_activities` | live, no client |
| `outreach.draft`, `email.draft`, `email.summary` | sonnet-4-6 | forced JSON | drafts only | send is AMBER | — | live (door / Inbox) |
| WhatsApp Max | sonnet-4-6 (`WHATSAPP_MODEL`) | none; 4 GREEN via bridge | lead, note, incident | none (GREEN) | `chat.*` | prod 503 |
| Website Max | sonnet-4-6 | none | chat rows | — | `chat.*` session | live |
| OS AI Assistant | sonnet-4-6 | none | none | — | none | live |
| Extraction (`/api/os/ai/enhance`, scan-client) | sonnet-4-6 vision | forced tool | form fill; human saves | provenance guard | — | live |
| Bureau AI Lab | sonnet-4-6 | none | none | "needs approval" label | — | no key in prod |
| Bureau registry agents | none | none | none | — | mock | demo |
| OpenClaw `max-agents` | OpenClaw 2026.6.1 / 2026.9.2 | `openclaw_mobile` only (documented) | via the door | Confirm token | `.data` | **removed** |

## 10. Approval map

| Action | Requester | Approver | Executor | Approval store | Audit | Bypass | Retry duplicates? |
|---|---|---|---|---|---|---|---|
| Send quote | agent door / browser | Marcel (MC Confirm) / none | OS | `os_approvals` / — | `os_audit` / — | **browser `send-angebot`** | governed: no; browser: possible |
| Send invoice | same | same | OS | same | same | **browser `send-invoice`** | same |
| Record payment / mark paid | agent / browser | Marcel / none | OS | `os_approvals` / — | `os_audit` / — | **`PATCH invoices` status paid** | — |
| Reminder, outreach, recurring | agent door | Marcel | OS | `os_approvals` | `os_audit` | none | no (key `approval-<id>`) |
| Email reply / trash | Inbox | Marcel | OS | `os_approvals` + `mail.action_audit` | `mail.action_audit` (mutable) | — | disabled |
| Newsletter broadcast | browser | none | OS | — | — | n/a (never governed) | yes |
| Lead/client/job/doc create, update, delete | browser / GREEN capability | none | OS | — | activity (capabilities only) | CRUD and hard delete | — |
| Bureau proposal approve | Bureau user | Bureau user | nothing | `agent_proposals` | `approval_events`, `activity_logs` | — | non-atomic |
| Telegram notification | public form | none | OS / Bureau | — | — | — | yes |
| WhatsApp reply | model | none (ADR-0019) | OS | — | `chat.events` | — | guarded by state |

Shadow approval systems: the Bureau's `approvals` / `agent_proposals` (demo, executes nothing)
and Mission Control's Confirm/Cancel (gone). One more weakness: an agent-door `execute` does not
check that the executing actor requested the approval. The Inbox route does check.

## 11. Audit map

`os_audit` (append-only trigger) records governed AMBER outcomes, refusals and failures. GREEN
writes are never in it. `os_activities` is the business timeline and doubles as a draft store.
`mail.action_audit` doubles as the email draft store and is mutable. `mail.events`,
`mail.deliveries` and `chat.events` record channel receipts. The Bureau has `activity_logs` and
`approval_events` (actor "user"). **Unaudited:** every `/api/os/*` CRUD and send route, the
public lead routes, all Telegram sends, and every Bureau lead.

## 12. Security and trust boundaries

| Boundary | Control | Finding |
|---|---|---|
| Browser → OS | shared password, 7-day HMAC cookie | no revocation, no 2FA, single identity; ungoverned sends |
| Agent client → OS | HMAC + nonce + actor allow-list | **door still enabled with no living client.** The client's copy of `OS_AGENT_SECRET` was in a directory that no longer exists, and nobody recorded what happened to it. Risk 86 recorded Codex-sandbox write access to that tree. No authenticated call since 2026-10-16; nine unsigned probes since 2026-10-22, all 401 `missing_headers` (consistent with this team's own boundary checks) |
| Public → OS | rate limits (in-memory) | public model proxy `/api/voice-enhance`; client-controlled host headers into the website chat prompt |
| Public → Bureau | lead form, no auth | writes personal data to a US database; shadow copy duplicates the surface |
| Bureau login | NextAuth credentials | email ambiguity across tenants; no security headers or MFA |
| Business content → models | data-not-instructions framing, no tools, AMBER for sends | sound; WhatsApp output can create leads, notes and incidents (GREEN) |
| Secrets | Vercel per project | `TELEGRAM_BOT_TOKEN` in three projects; `ANTHROPIC_API_KEY` in the shadow project; `OS_SESSION_SECRET` doubles as the mail key; n8n bridge secrets in plain text in `~/.claude.json`; an unnamed value in `apps/web/.env.local` (risk 83) |
| Legal claims | Bureau hero and privacy page | "in der EU gehostet" and "Neon, Region Frankfurt", while the database is us-east-1 and functions run in iad1. **Open since September**, unresolved |
| Mail SSRF | sealed locators, no fetcher | intact (see the email activation evidence) |

## 13. Duplication map

| Duplicated thing | Copies | Classification |
|---|---|---|
| Agent Bureau application | `apps/bureau` vs standalone repo and live shadow deployment | **D stale legacy**, still deployed |
| Leads | `os_leads` vs `lead_submissions` | **E competing source of truth** |
| Approvals | `os_approvals` vs Bureau `approvals`/`agent_proposals` vs MC Confirm | **C accidental** (Bureau demo); MC was **A projection** of OS approval |
| Audit / activity | `os_audit`/`os_activities` vs `activity_logs`/`approval_events` | **C accidental**; eventually **B shared contract** |
| Business objects | OS tables vs Bureau contacts/companies/projects/tasks | **D stale** (empty) |
| Telegram sender | `lib/telegram.ts` vs the Bureau's `notify.ts` | **C accidental** (violates "never two implementations") |
| Telegram notices | direct pushes vs `owner.notices` poll | **C accidental** (double notification) |
| AI provider wrapper | `apps/web/lib/ai.ts` vs the Bureau's `lib/ai/*` | **C accidental** |
| "Max Agent" lead intake | `/api/max-agent/submit` vs Bureau lead form | **D stale** (OS copy dead) |
| Assistants named Max | website, OS, WhatsApp | **G naming only** |
| IBAN/address | `lib/documents/identity.ts` vs `/api/os/ai` prompt | **C accidental** |
| Agent registry | Bureau static only | no duplication |

No dangerous cross-plane mutation (F) exists today, because nothing crosses planes.

## 14. Dead and stale surfaces

| Surface | Confidence |
|---|---|
| Standalone Bureau repo (no unique commit) | **PROVEN STALE**, yet deployed |
| `maxpromo-agent-bureau` Vercel project deployment | **ACTIVE (unintended)** |
| `/api/max-agent/submit` | LIKELY DEAD (public, deployed) |
| `/api/newsletter/subscribe` | LIKELY DEAD (public; writes the database, sends email and Telegram) |
| `/api/os/ai/generate-invoice`, `/api/os/ai/scan-invoice` | LIKELY DEAD (behind login) |
| `lib/env.ts`, `lib/registry/adapters/os.adapter.ts` (exposes demo credentials for a page that does not exist) | PROVEN DEAD |
| `buildDiagnosticMessage`, `buildAuditMessage`, `buildAuditLeadEmailHtml`, `buildFullReportEmailHtml` | PROVEN DEAD |
| Tables `chat.leads_telegram`, `cms.posts` | PROVEN DEAD |
| Bureau: 19 GET API routes with no caller | LIKELY DEAD |
| Bureau: 17 untouched tables, three unused mock files, honeypot branch | PROVEN DEAD |
| Bureau mock pages (contacts, projects, tasks, memory, research, client implementation, operating model, leads view) | demo presented in a production dashboard |
| `TELEGRAM_WEBHOOK_SECRET` (web) | UNKNOWN (no reader in code) |
| `_ai-command-center` directory | abandoned scaffold (outside both repositories) |
| `mobile-business-os.md` line 25 vs §12, and the register calling the standalone repo "archived" | stale documentation |
| Lead "mtQVDHitZDuXgcPvpbWW" (CONTACT_FORM, NEW) in production | probable bot submission in the CRM |

Nothing was deleted.

## 15. Target ownership map

| Capability | Target | Why |
|---|---|---|
| Leads, clients, projects/jobs, quotes, invoices, payments, follow-ups, files, money, Inbox | **BCP** | legal numbering, identity, money and the record of truth already live there (ADR-0018) |
| Attention / brief / notices computation | **BCP** | it reads business state; already implemented |
| Business-action approval **record and execution** | **BCP** | the executor must check the exact payload hash atomically with the write. Splitting record and executor across databases loses that guarantee |
| Approval **decision surface** | OCP (Telegram), `/os`, and the Bureau as viewer | the owner decides wherever he is; the decision travels as `{approvalId, payloadHash}` |
| Agent definitions, policies, run state, proposals, failures, costs, memory, playbooks, AI governance, AI Lab | **ACP** | the intelligence governance the locked architecture assigns to the Bureau |
| Model/provider adapters, prompt framing | **IL** (shared package) | one implementation for both apps |
| Telegram transport, owner commands, notification delivery | **OCP** | pocket command centre, not a database |
| Email, WhatsApp, website chat, website forms (including the Bureau's lead form) | **CH** into BCP | channels feed the OS |
| Capability census, signed request envelope, approval binding, agent event/result schema | **SC** | the one explicit cross-plane contract |

**Contradiction recorded, not overridden.** The locked architecture lists "approvals" under the
Agent Control Plane. The only proven approval system binds a business action's payload hash to
its single execution inside the business database. Moving that record to the Bureau would
either make the Bureau execute business writes (a second write path into commercial state) or
lose the atomic hash check. Recommended reading: **the ACP owns agent governance (who may
propose what, policies, run state, the waiting room); the BCP owns the approval record and
execution of business actions; the OCP and `/os` are where Marcel decides.** Confirming this
interpretation is Marcel's decision.

**Second open question.** The Bureau is built and marketed as a multi-tenant product for
clients ("Your supervised AI operations team"), but the locked architecture uses it as
Maxpromo's internal Agent Control Plane. These can coexist (Maxpromo as tenant 1), but that
choice determines the tenant model, the region and the data-protection posture. It is Marcel's
decision.

## 16. Current → target gap analysis

Priorities: P0 security/data integrity, P1 architectural blocker, P2 control-plane cleanup,
P3 UX/operations, P4 tech debt, P5 optional.

| # | P | Problem | Evidence | Target | Change | Repo | Risk / rollback | Verify |
|---|---|---|---|---|---|---|---|---|
| G1 | **P0** (owner) | Public EU-hosting claims are false | §12; register "OPEN — Agent Bureau claims EU hosting" | ACP | Marcel decides: correct the copy and the privacy notice, **or** migrate the Bureau database and functions to the EU | bureau | copy change is low risk; migration is a data move (escalation item) | live page text; Neon region; Vercel function region |
| G2 | **P0** (owner) | Agent door enabled with no client; secret custody unknown | §1, §12 | SC | Marcel: unset `OS_AGENT_ALLOWED_ACTORS` (door returns 503 until the OCP is rebuilt) **or** rotate `OS_AGENT_SECRET`; redeploy | web (env) | reversible env change; no live client is affected | unsigned and signed probes refused; logs |
| G3 | P1 | Shadow Bureau deployment live with an AI key, a Telegram token and a probably shared database | §3 | — | Marcel: remove the production deployment or disconnect the git integration and pause the `maxpromo-agent-bureau` project; archive the GitHub repo (ADR-0001) | Vercel / GitHub | reversible (pause, unarchive) | the vercel.app alias stops serving; no new deploys |
| G4 | P1 | Bureau production 8 relevant commits behind, including the critical Next.js fix | §3, risk 67 | ACP | Apply the web ignore-command form to `apps/bureau/vercel.json`, then do a normal release | monorepo | independent rollback per project | health `release.commit` = main; `next@16.4.2` |
| G5 | P1 | Real Bureau leads never reach the OS | §3, §7 | BCP | Route the Bureau lead form into `os_leads`: a signed OS lead-intake capability, or post to the OS contact pipeline. Reconcile the existing `lead_submissions` rows | both | personal-data move from US to EU: escalate with G1 | lead appears in `/os/leads`; `lead_submissions` stops growing |
| G6 | P1 | No attention surface exists anywhere | §1.5, §2 | BCP | Render `owner.attention`, `owner.notices` and `approvals.pending` on the `/os` dashboard through a cookie-authenticated read (reuse `views.ts`; no new logic). This is Phase 3 | web | read-only UI | dashboard matches `owner.brief` |
| G7 | P1 | Two write paths into commercial state | §2, §10 | BCP | Route browser sends, mark-paid and delete through the engine (new cookie-actor channel like the Inbox); extend the idempotency proof to `app/api/os` | web | behaviour change on the main screens; per-route rollout | proof shows no send outside the engine; double-click sends once |
| G8 | P1 | No Owner Control Plane | §5 | OCP | Rebuild the Telegram lane against the existing signed door (Phase 6). Decide the runtime (OpenClaw reinstall vs a small governed bot) | new / web | new secret, new actor | ADR-0018 go-live conditions re-proved on a running system |
| G9 | P2 | The Bureau holds business objects and demo pages presented as product | §3 | ACP | Remove or label the business tables and mock pages; keep agent-domain tables; make agent pages read the database | bureau | UI only | no mock import in a dashboard route |
| G10 | P2 | Bureau approvals non-atomic; no decider id | §3 | ACP | Conditional update on `status='pending'`, record `decided_by` | bureau | low | concurrent approve test |
| G11 | P2 | Two Telegram senders, double notices | §5 | OCP | One sender in `packages/`; one notification path (events → OCP) | both | low | one message per lead |
| G12 | P2 | Two AI provider wrappers; IBAN in a prompt | §13 | IL | One provider package; prompt reads identity from `@maxpromo/config` | both | low | grep shows one implementation |
| G13 | P2 | Agent-door execute does not bind the requester | §10 | SC | Require `actor = requested_by` (or an explicit approver set) | web | low | proof case |
| G14 | P3 | Public model proxy `/api/voice-enhance` | §2 | CH | Durable rate limit, size cap, origin check, cost metric | web | low | abuse probe throttled |
| G15 | P3 | `os_approvals`, follow-ups, payments, incidents and WhatsApp have no `/os` screen | §2 | BCP | Phase 3 command-centre views | web | read-mostly | screens list rows |
| G16 | P4 | Dead surfaces (§14) | §14 | — | Remove after one release of no traffic; drop dead tables by migration | both | reversible by revert | logs show zero calls |
| G17 | P4 | Stale docs: mobile-business-os contradiction, register says "archived", Bureau README | §14 | — | Correct in place | monorepo | none | `npm run audit:docs` |
| G18 | P4 | `OS_SESSION_SECRET` doubles as the mail key | §2 | BCP | Separate key with dual-read migration before any rotation | web | medium | old mail still decrypts |
| G19 | P5 | Shared password, 7-day sessions, no 2FA | §2 | BCP | Owner-only 2FA/passkey and revocation | web | medium | login proofs |

## 17. Risks of the migration itself

- Moving leads or other personal data from the US Bureau database into the EU OS changes the
  data-protection story. Do it only after G1 is decided.
- Routing browser sends through the engine changes the daily screens. Roll out per route behind
  the existing proofs, and keep the old route until the engine path is proven in production.
- Rebuilding the Owner Control Plane creates a new privileged client. Re-prove ADR-0018's go-live
  conditions on the running system; documentation of a past install is not evidence.
- Pausing the shadow project or tightening the door might break an unknown dependency. Logs show
  none (no authenticated door call since 2026-10-16), and both actions are reversible.

## 18. Recommended migration sequence

0. **Owner decisions now** (no code): G1 claim or region, G2 door posture, G3 shadow project,
   and confirmation of the §15 approval interpretation and the Bureau's product/tenant role.
1. **Hygiene release:** G4 Bureau ignore rule plus release; G17 doc corrections; G13 requester
   binding; G10 Bureau atomic approval. Small, independent, reversible.
2. **Phase 2 — lock the contract:** the signed door becomes the only cross-plane write contract.
   - Add a `bureau:` actor class.
   - Define an agent event envelope (proposal, result, failure, waiting) that the OS stores as
     attention input.
   - Define the Bureau lead-intake capability (G5).
   - Write it as an ADR extending ADR-0018.
3. **Phase 3 — `/os` command centre:** G6 and G15 on the existing `views.ts`, then G7 governed
   browser actions.
4. **Phase 4 — Email OS facelift** inside that structure.
5. **Phase 5 — Bureau refinement:** G9, real agent runs writing `agent_runs` and emitting events
   to the OS, AI key decision, region per G1.
6. **Phase 6 — Owner Control Plane:** G8 and G11, push notices from the same events.
7. **Phase 7 — convergence and productization:** G12, G14, G16, G18, G19.

## 19. Verification plan

| Step | Proof |
|---|---|
| G2 | signed request with an old actor → 503/403; logs show no authenticated door traffic after the change |
| G3 | `maxpromo-agent-bureau.vercel.app` no longer serves the app; no new deployments on the project |
| G4 | agents.maxpromo.digital `/api/health` `release.commit` equals main; deployed lockfile has Next 16.4.2 |
| G5 | a test lead (evidence mode) appears once in `os_leads`, once in attention, never in `lead_submissions` |
| G6 | dashboard items equal `owner.attention` for the same instant (evidence runtime) |
| G7 | extended `prove:commercial-boundary`: no `sendEmail` outside `lib/commercial`; replayed browser send sends once |
| Each phase | `npm run verify`, the relevant live proofs, and the production observation for anything with live behaviour |

## 20. Evidence log for this baseline

- Vercel CLI (read-only):
  - `inspect agents.maxpromo.digital` → `maxpromo-agents` `dpl_DDjE…` 2026-10-08;
  - `inspect` of the shadow deployment → standalone `main` `a89882b`, 2026-10-22;
  - `list` per project; `env ls` (names only) on all three projects.
- Production probes (anonymous GET):
  - both Bureau hosts: `/`, `/login`, `/dashboard`, the APIs and `/_next/image`;
  - Bureau health `release.commit c0bf517`, ai-provider degraded.
- Production logs: per-day agent-door scan 2026-10-03…23. Last authenticated call 2026-10-16
  11:52Z. 50+ calls on 2026-10-08/09 (go-live). 401 `missing_headers` on 2026-10-22/23.
- Authenticated `/os` (read-only): dashboard counters and lists; AI Assistant panel. The Bureau
  dashboard was not inspected: it needs a password, which the agent does not enter.
- Code traces: OS, Bureau (both copies, 204 files each, divergence by hash) and
  OpenClaw/Telegram (filesystem, scheduled tasks, ports, Codex logs).

## 21. Implementation status — 2026-10-23 (ADR-0021)

Owner decisions locked the approval interpretation (§15), the Bureau's dual role (Maxpromo is
tenant 1) and EU infrastructure as the target. Implemented in the repository and verified;
the production release waits for the owner push (the session could not push or deploy).

| Gap | State | Evidence |
|---|---|---|
| G2 agent door | **Contained in production**: `OS_AGENT_ALLOWED_ACTORS` and then `OS_AGENT_SECRET` removed; a deployment built after the removal is live (health `release.commit` empty = CLI build). Door code kept; per-client credentials added | Vercel env listing; ADR-0021 |
| G3 shadow Bureau | **Retired except its running deployment**: Git disconnected, every credential removed from the project (0 env vars), GitHub repository archived. No unique code (subtree split point), no unique data (it shares the one Bureau database, proven by the Neon project list and endpoint). Pausing the project is an owner action (CLI requires interactive confirmation) | §20 |
| G4 Bureau drift | Ignore rule fixed (web form, counts root lockfile); ships on the next push | `apps/bureau/vercel.json` |
| G5 leads | `lead.intake` (receipt ledger) plus the Intake agent and outbox; the Bureau keeps no lead after the OS confirms. The one existing submission (2026-05-30) is forwarded by the first flush after release | `prove:control-planes` 30/30, HTTP contract 7/7 |
| G6/G15 attention | `/os` dashboard leads with the attention panel; `/os/approvals` decides; agent events project in and can be acknowledged | local evidence-mode browser check, desktop and 390 px |
| G7 browser writes | Document sends from the stored record, idempotent and audited; newsletter idempotent, audited, honest counts; mark-paid records the payment; issued invoices cannot be deleted | `prove:commercial-boundary` 48/48, `prove:document-numbering` 35/35 |
| G9 Bureau demo | Registry honest (nine agents `offline`, Intake `live`); dashboard Live section separated from a labelled sample-data preview; shadow approval route and buttons removed | i18n gate |
| G10 Bureau approvals | Moot: the decision route is removed; the page is a read-only OS projection | — |
| G11 Telegram | Bureau sender removed; the OS is the only sender; Bureau Telegram variables removed | grep, Vercel env |
| G12 AI wrapper | **Open**: two provider adapters remain (web `lib/ai.ts`, Bureau `lib/ai/*`); the Bureau has no production key | known risk |
| G13 executor binding | Done in SQL claim | mutation-tested |
| G14 voice-enhance | Origin and same-site check, body and context caps, rate limit kept | code |
| G16 dead code | Removed: `lib/env.ts`, the OS registry adapter, four dead message builders, `/api/max-agent/submit`, the Bureau approval routes and their client component | reference search before each deletion |
| G17 docs | This report, ADR-0021, the risk register, deployment notes | `audit:docs` |
| G1 EU | Functions pinned to `fra1` (web and Bureau). Privacy notices made factual; the Bureau hero's legal claim removed. **The database move awaits an EU Neon project, which the session could not create (owner action)**. Rehearsal proved the copy: 35 tables, 125 rows, identical counts and checksums | `migrate-to-eu.mjs --rehearse` |

### EU database cutover — runbook

1. In the Neon console create project `maxpromo-agent-bureau-eu`, region AWS Europe Central 1
   (Frankfurt), **PostgreSQL 17** (the source is 17.11; the tool uses PostgreSQL 17 clients). Put its connection string in a local file as
   `DATABASE_URL=...` (never in chat).
2. `node apps/bureau/scripts/migrate-to-eu.mjs --migrate <current-bureau-env-file> <eu-env-file>`.
   It refuses a non-EU, non-empty or identical target. It fingerprints the source, dumps,
   restores, compares every table, applies the outbox migration and compares again.
3. Replace `DATABASE_URL` on the `maxpromo-agents` Vercel project with the EU URL.
4. In the same release set `databaseRegion: "eu-central-1"` in `apps/bureau/config/infrastructure.ts`.
   The privacy notice then states the EU region, which is now true.
5. Deploy, outside 06:00 UTC and with no form traffic expected (a few minutes). Check `/api/health`
   database ok and that `agents.maxpromo.digital` responds.
6. `node apps/bureau/scripts/migrate-to-eu.mjs --recheck <current-bureau-env-file> <evidence.json>`
   (the path printed by step 2). It must report identical; otherwise replay the listed tables
   before going further.
7. Keep the US project for 14 days as the recovery point, then delete it.

Rollback: restore the previous `DATABASE_URL` and redeploy. The US database is untouched by
the migration.

## 22. Release closure status — 2026-10-23 (evening)

The mega-run (control planes ADR-0021, provider spam ADR-0022, attention i18n) was held back by a
release blocker and is now **released** (see Release below). A pre-push forensic check found a release blocker,
and the remaining steps are owner-gated by the session's permission policy.

### Release blocker found before pushing

The Bureau's new schema selects three outbox columns (`apps/bureau/lib/db/migrations/0002_intake_outbox.sql`).
A read-only check of the Bureau production database (Neon `fancy-dew-58624069`, production
branch) showed **none of them exist** (1 lead submission, 0 agent runs). The Bureau build does not
run migrations. Pushing first would break the Bureau lead form and dashboard. Applying the
additive SQL from the session was refused by the permission policy, so the push was not made.

| Item | State |
|---|---|
| Code: ADR-0021 + ADR-0022 + risk 109 (10 commits, e0a7c07..ab9b6c5) | **DONE**, verified locally; not pushed |
| OS migrations 0015, 0016 | **DEPLOYED** to production OS database, verified |
| Bureau migration 0002 (outbox) | **OWNER ACTION REQUIRED**: not applied; blocks the release |
| Web production | containment CLI build (legacy agent door closed); health ok; boundaries verified |
| Bureau production | old release `c0bf517` (Next.js security fix not yet live) |
| Hostinger provider-state reconciler | code done; `HOSTINGER_MAIL_API_TOKEN` and `HOSTINGER_MAILBOX_RESOURCE_ID` absent |
| Production Junk message | `billing` / Needs reply, `unverified` (unchanged, as designed) |
| Shadow Bureau | credentials 0, Git disconnected, SSO on deployment URLs; `maxpromo-agent-bureau.vercel.app` still serves a static page |
| Bureau database region | us-east-1; EU project not created |
| G12 two AI adapters, G9 seeded demo data | open product decisions (risks 112, 113) |

### Owner release runbook (in this order)

1. **Bureau outbox migration.** Neon console → project `maxpromo-agent-bureau` → branch
   `production` → SQL Editor → run:

   ```sql
   BEGIN;
   ALTER TABLE "lead_submissions" ADD COLUMN IF NOT EXISTS "forward_attempts" integer DEFAULT 0 NOT NULL;
   ALTER TABLE "lead_submissions" ADD COLUMN IF NOT EXISTS "last_forward_at" timestamp with time zone;
   ALTER TABLE "lead_submissions" ADD COLUMN IF NOT EXISTS "last_forward_error" text;
   COMMIT;
   SELECT string_agg(column_name, ',' ORDER BY column_name) FROM information_schema.columns
   WHERE table_name='lead_submissions' AND column_name LIKE '%forward%';
   ```

   Expected: `forward_attempts,last_forward_at,last_forward_error`. Additive; old code keeps working.
2. **Hostinger REST credentials** (recommended before the push, so the first release already reads
   the Junk folder). Vercel → `maxpromo-digital` → Settings → Environment Variables → Production:
   - `HOSTINGER_MAILBOX_RESOURCE_ID` = `AC1ed17f505bab0e80dbce2fb31cc7` (not a secret: the mailbox
     id returned by the Hostinger Mail API `GET /me` for info@maxpromo.digital);
   - `HOSTINGER_MAIL_API_TOKEN` = a Hostinger Mail API token for info@maxpromo.digital, created in
     hPanel where Mail API / agent access tokens are issued (mark it Sensitive). It enables only the
     read-only folder lookup (ADR-0022); the code never sends, moves, flags or deletes with it.
3. **Push:** `! git push origin main`. Vercel builds both projects (web and `maxpromo-agents`).
4. **Verification after the push** (the session can run all of it):
   - `www.maxpromo.digital/api/health` and `agents.maxpromo.digital/api/health` report the new commit;
   - `/os` attention panel and `/os/approvals` (German and English), `/os/inbox` Spam view;
   - the Bureau outbox forwards the 2026-05-30 submission (dashboard view or the 06:00 cron) and it
     appears in `/os/leads`;
   - with step 2 done: opening `/os/inbox` triggers the reconciler; the Junk message then shows under
     Spam as "Von Hostinger als Spam eingestuft" with "Hostinger-Ordner: INBOX.Junk", and the log shows
     `mail.provider_state` with `quarantined: 1`.
5. **Junk message without step 2:** `/os/inbox` → open "(#B2NDI4SR) Ihre Rechnung…" → **Als Spam markieren**.
   The reconciler can still correct it automatically until 2026-11-06 (14-day lookback).
6. **Shadow Bureau:** Vercel dashboard → `maxpromo-agent-bureau` → Settings → Pause Project
   (this CLI version has no pause command).
7. **EU database:** the runbook in §21 (create `maxpromo-agent-bureau-eu`, Frankfurt, PostgreSQL 17;
   `migrate-to-eu.mjs --migrate`; switch `DATABASE_URL`; flip `databaseRegion`; deploy).

### Release — 2026-10-23 20:3x UTC

- Owner applied Bureau migration 0002; independently verified read-only: `forward_attempts` integer
  NOT NULL default 0, `last_forward_at` timestamptz, `last_forward_error` text; 1 submission
  (2026-05-30) intact, 0 attempts, 0 runs.
- `git push origin main` 4013782..1bfa5cf. Vercel production: web `dpl_4GGd98RRNvuA8pbxgKPaFUBJp9dW`
  Ready; Bureau `maxpromo-agents-lnkmh6exl` Ready. Both `/api/health` report `release.commit 1bfa5cf`;
  both functions answer from `fra1`.
- Verified in production: auth boundaries (owner pages redirect, owner APIs 401), webhook 405/401,
  WhatsApp 503, legacy agent door 503 (fail closed), Bureau client 401 on a bad signature, unknown
  client 400, `/api/max-agent/submit` 404, cross-origin voice-enhance 403, Bureau dashboard login-gated,
  Bureau cron flush 401 without secret, public intake rejects invalid input 400/422 before writing.
- Authenticated owner browser (read-only): `/os` attention panel, `/os/approvals` (5 historical
  rejections from 2026-10-08/09), `/os/inbox` with Spam view (0) and the Junk message showing
  "Hostinger spam check not connected" and Mark as spam / Block sender; German and English attention
  sentences; 390 px without horizontal scroll on `/os`, `/os/inbox` (detail) and `/os/approvals`.
- Unchanged: leads 5, clients 2, invoices 2, quotes 1, jobs 0; both mails still unread; no non-GET
  2xx in production logs since the release; Hostinger Sent unchanged since 07:26Z; downloads not wired.
- Pending: the first positive Bureau → OS signed call (intake flush) runs on a Bureau dashboard view or
  the daily 06:00 UTC cron and forwards the 2026-05-30 submission into `/os/leads`.

### Closure continuation — 2026-10-23 (late evening)

**First positive Bureau → OS call (production).** Triggered the Bureau's own daily job early with
`vercel crons run /api/agents/intake/flush` (Vercel supplies `CRON_SECRET`; nothing secret handled):
- 20:52:38.770Z cron invoked → Bureau `GET /api/agents/intake/flush` 200 (20:52:39) → signed
  `POST /api/os/agent/v1/run` 200 on the OS (20:52:40).
- OS (read-only SQL): leads 5 → 6; `os_intake_receipts` 1 row
  `agent_bureau_form : 011b093a-d322-4dd8-98d3-a9c3f3451fcc : created : 4a9f088a-adff-4391-a35f-b282b2bd2ff9`;
  lead row exists, source `agent_bureau_form`, status `discovered`, created 20:52:41Z (the
  2026-05-30 enquiry date is kept as receipt `received_at` and lead `last_interaction_at`); one
  request-idempotency row; one activity; approvals 5, clients 2, invoices 2, threads 2 unchanged; 0 audit rows.
- Bureau (read-only SQL): outbox empty; one `agent_runs` row `intake / completed / created /
  os_lead 4a9f088a… / submission 011b093a…`, finished 20:52:41.817Z.
- Replay: a second cron run (20:55:39Z) returned 200 and made **no** OS call (outbox empty). A
  re-sent submission is answered `duplicate` by the receipt ledger (evidence proof: 10 concurrent
  deliveries → 1 lead; HTTP contract 7/7). The OS sends its single new-lead Telegram notice by design.

**Defect found and fixed:** the forwarded enquiry was in the pipeline but raised no `/os` attention
item. Attention now includes `enquiryNew` for intake-received leads still in `discovered`
(control planes 33/33).

**Shadow Bureau — OBSOLETE / PAUSED / CANDIDATE FOR DELETION.** Project `maxpromo-agent-bureau`
(`prj_3OWjluaJPD4Rcrnupylmpwq1Vgqf`): no Git link, 0 env vars, 0 cron definitions, only its own
`*.vercel.app` aliases; `agents.maxpromo.digital` belongs to `maxpromo-agents` (DNS → vercel-dns);
no code references (docs only); 32 requests in 3 days (forensic probes and crawlers). Paused via
the Vercel API (`paused: true`); its alias now answers 503 while `agents.maxpromo.digital` and its
health stay 200. Project and archived repository kept until the owner authorizes deletion.

**Hostinger reconciler.** `HOSTINGER_MAILBOX_RESOURCE_ID` set on `maxpromo-digital` production
(non-secret). `HOSTINGER_MAIL_API_TOKEN` remains an owner action. The reconciler now also runs after
`GET /api/os/attention`, so an earlier failed check cannot leave provider Junk on the dashboard.

**EU database readiness (not migrated).** Source: Neon `fancy-dew-58624069`, us-east-1,
PostgreSQL 17.11; consumers: only `maxpromo-agents` (`DATABASE_URL`); the shadow is paused with no
variables. Writers: public enquiry form, Intake agent (cron 06:00 UTC and dashboard view), activity
and login. Rate limits live in Redis, not this database. The tool copies with pg_dump custom format
(ids, sequences and timestamps preserved), refuses non-EU / identical / non-empty targets and compares
every table's count and checksum. **Gap fixed:** it could not detect writes reaching the US database
after the dump and before the `DATABASE_URL` switch; `--recheck <source-env> <evidence.json>` now
proves none happened (or lists the tables to replay). Cutover requires a short write-free window
(away from 06:00 UTC); rollback is restoring the old `DATABASE_URL` (the US database is never written
by the tool), losing only writes made to the EU database after cutover.

### Next phase (not started)

**STRIPE ↔ MAXPROMO MONEY ARCHITECTURE** — Stripe as a payment rail inside the Money domain of the
Business Control Plane (quote → invoice → payment → webhook → ledger → reconciliation → fee →
balance → payout → Revolut → `/os` attention and briefing). Maxpromo OS stays the source of truth.
Starts only after this run is closed, under separate instruction.
