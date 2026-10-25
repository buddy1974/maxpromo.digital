# MAXPROMO STATE OF THE UNION — FORENSIC AUDIT

**Date:** 2026-10-25 (Europe/Berlin, late morning) · **Auditor:** Claude (read-only run; no feature code changed)
**Repository HEAD inspected:** `703ec64` (main = origin/main, nothing unpushed)
**Production inspected:** web `maxpromo-digital` deployment created 2026-10-25 09:33 from `247a694` · Bureau
`maxpromo-agents` deployment created 2026-10-25 08:40 reporting `30ac5b5` · legacy `maxpromo-agent-bureau` project
**paused** (`DEPLOYMENT_PAUSED`).
**Databases inspected (read-only SQL):** OS Neon `twilight-boat-66649706` ("maxpromo-automation / production");
Bureau Neon `fancy-dew-58624069` ("maxpromo-agent-bureau", AWS us-east-1).

This document replaces assumptions accumulated across sessions. Where it disagrees with an older document, this
document records the evidence; the older document is listed in §34/§36 as stale or false. It does **not** rewrite
those documents.

## Method and evidence base

| Source | What was done |
|---|---|
| git | Both repos: branch, HEAD, remote, unpushed, worktrees, stash, reachability of the ten named commits, `git log 30ac5b5..HEAD -- apps/bureau packages` |
| Code | Five independent read-only audits (email; clients/capture/Max/money/campaigns; Bureau/contract/auth; remnants/PWA/jobs/dashboard/discovery; risk ledger and docs), each citing file:line, spot-checked by me |
| Vercel | `vercel project ls`, `vercel inspect <domain>`, `vercel env ls production` (names only; no values read) |
| Production HTTP | `/api/health` both apps; authenticated in-browser fetch of every `/os/*` page and key `/api/os/*` reads (all 200) |
| Production UI | Desktop screenshots: Today, Inbox (+ one conversation), Clients, Jobs, Newsletter; Bureau `/dashboard` → login redirect |
| Production DB | OS: table inventory, invoices, leads, clients, approvals by capability/status, `os_agent_results` by capability, Stripe charges/reversals/provider events, intake receipts. Bureau: table inventory, businesses, agent_runs, agent_proposals |
| Phone widths | Production refuses framing (`frame-ancestors 'none'`) and the Chrome window cannot be resized, so 360/390/412 were checked in the local runtime on the same commit against the evidence database (12 screens) |
| Tests | `npm run verify` — **exit 0**, 33 gates |
| Not inspectable | Bureau UI behind login (Claude may not enter passwords); n8n (Cloudflare Access blocks the API); physical phones |

Opening one Inbox conversation in production may have marked it read; nothing else was changed in production.

---

## 1. Executive verdict

Maxpromo OS is a real, deployed, governed business system with a strong core: **Email OS on Hostinger, a governed
capability/approval engine, Money with a proven Stripe sandbox lifecycle, quotes/invoices with PDF and mailbox
delivery, Leads research→draft→governed send, Ask Max grounded on real records, and a phone shell for the daily
screens.** It is genuinely usable daily for mail, money and quotes/invoices.

It is **not** yet what recent instructions assumed:
- **Universal Capture: NOT_BUILT.** Only single-entity image/paste extraction into forms exists. Voice in the OS,
  PDF extraction, typed proposals and multi-action confirmation do not exist. (PDF upload is offered but broken.)
- **Campaign Studio: NOT_BUILT.** Newsletter is a plain-text scaffold via Resend with **no unsubscribe** — not legally
  usable for a real send.
- **Inbox Trash/Restore/bulk: NOT_BUILT in the UI** (a local-only, button-less `email.trash` capability exists).
- **Clients: weakest core module** — CRUD with data-loss bugs, hard delete that cascades history, no client detail page.
- **Agent Bureau: a foundation, not a workforce.** One real agent (Intake, deterministic, no model). The production
  Bureau's only tenant is the seeded **"Maxpromo Demo Operations"** business, so the dashboard mixes 6 fake pending
  proposals and seeded agents with the one real live panel.
- **One login: NO.** Two auth systems, two hosts, two user stores — proven in production.
- **Daily cron is dead in production:** web `CRON_SECRET` is unset, so the morning brief push, the scheduled-mail
  sweep and the lead sweep run only while the OS is open.

## 2. Canonical architecture actually found

| Intended | Found | Match |
|---|---|---|
| OS = business OS + owner control plane | `apps/web` `/os/*`; owns leads, clients, jobs, quotes, invoices, money, mail, approvals, audit | **Yes** |
| Bureau = governed AI workforce | `apps/bureau`; one live deterministic agent; 9 registry agents `designed/offline`; static playbooks; mock/seeded screens | **Foundation only** |
| Max / AI layer | Ask Max (`lib/commercial/ask.ts`) — fixed intent enum, Q&A + one write intent (draft replies); no tool use, no proposals | **Partial** |
| Capabilities / providers | Capability engine (GREEN direct, AMBER prepare→`os_approvals`→execute, RED refused) + one model gateway `packages/ai` + Hostinger + Stripe | **Yes** (one gateway bypass, §17) |
| OpenClaw removed | No runtime. Residue: an `openclaw:` actor pattern in `agent-gate.ts` (door shut), stale docs, `CLAUDE.md` pointer, CI dependency on `docs/openclaw/core-memory.md` | **Code: yes · Docs: no** |
| Telegram not the control plane | Send-only notifier; no inbound bot; owner push gated off (`OWNER_TELEGRAM_NOTICES` unset) | **Yes** |
| Phone-first OS = control plane | PWA shell with bottom nav (Today, Inbox, Money, Max, More); 5 screens phone-first, 5 responsive-only | **Partial** |
| OS and Bureau separate apps, separate DBs | Separate Vercel projects and Neon projects; Bureau never touches OS DB; one signed HMAC door | **Yes** |

## 3. OS repository state

- Canonical: `C:\Users\loneb\Documents\ai-software-dev\projects\maxpromo.digital` (monorepo: `apps/web`, `apps/bureau`, `packages/*`).
- Branch `main` = `origin/main` at `703ec64`; **0 unpushed**; one worktree; one stash (`local claude settings allowlist`, on the checkpoint branch).
- Uncommitted: only ` D .openclaw/project.yaml` (untouched, see §25).
- Local branches `checkpoint/maxpromo-public-i18n-and-os`, `feature/{mobile-business-os,platform-v4,track-b,visual-facelift-v2.1}` — historical, not material.

**Named commits** (all in OS repo, all reachable from HEAD, all on `origin/main`, all deployed to web):

| Commit | Date | Purpose | Status |
|---|---|---|---|
| `c5ab6ad` | 10-24 | Outgoing attachments, delivery reports, one send bookkeeping | live |
| `173b021` | 10-24 | Money domain + Stripe rail; documents through the mailbox with PDF | live |
| `23d6f7f` | 10-24 | ADR-0025 docs | docs |
| `43fea1e` | 10-24 | Reconciliation §24 docs | docs |
| `1e79e44` | 10-24 | Stripe API `2026-09-30.endive` pin; refuse other event versions | live |
| `09f2693` | 10-24 | ADR-0025 amendment docs | docs |
| `9db3416` | 10-24 | Card totals/pending payout net of refunds; sandbox lifecycle evidence | live |
| `4f2fb6d` | 10-24 | Risk 133 doc | docs (later fixed by `invoice.cancel`) |
| `4b5b05c` | 10-24 | One model gateway web + Bureau | live in both |
| `30ac5b5` | 10-25 | Leads research, scoring, outreach on Email OS, prospect send policy | live in both (Bureau health route) |

Later commits: `acfd34c`, `0aa5a75`, `d872729`, `c04e8d5`, `7af041a`, `247a694` (web only) and `703ec64` (docs).
None supersedes another; none reverted.

## 4. Bureau repository state

- **Canonical Bureau = `apps/bureau` in the monorepo.** The separate repo `maxpromo-agent-bureau` (branch
  `feature/platform-v5`, HEAD `af2d2bc`, 2026-09-03) was subtree-imported as `30ec301` the same day and is
  **fully superseded** (no OS client, no Intake). Its Vercel project `maxpromo-agent-bureau` is **paused**. Its
  `origin/main` is ahead of the local branch by unrelated old commits; irrelevant.
- `apps/bureau` last real change: `4b5b05c`/`f04aa04` (gateway, "no mock CRM"); `30ac5b5` touched only its health route.

## 5. Production deployment state

| Domain | Project | Deployment | Commit reported |
|---|---|---|---|
| maxpromo.digital / www | `maxpromo-digital` | 2026-10-25 09:33 | `247a694` |
| agents.maxpromo.digital | `maxpromo-agents` | 2026-10-25 08:40 | **`30ac5b5`** — correct: `ignoreCommand` skips builds when `apps/bureau`, `packages`, root manifests are unchanged; `git log 30ac5b5..HEAD -- apps/bureau packages` is empty |
| maxpromo-agent-bureau.vercel.app | `maxpromo-agent-bureau` | 2026-10-22 | paused (503) |

Bureau health = `degraded` only because the database answered slowly and there is no AI key.

**Environment (names only; values never read).**

| Variable | web | Bureau | State |
|---|---|---|---|
| `EMAIL_PROVIDER`, `HOSTINGER_MAIL_API_TOKEN`, `HOSTINGER_MAILBOX_RESOURCE_ID`, `HOSTINGER_WEBHOOK_SECRET` | present | — | ACTIVE |
| `OS_SESSION_SECRET`, `OS_PASSWORD` | present | — | ACTIVE (OS auth) |
| `NEON_DATABASE_URL` / `DATABASE_URL` | present | present | ACTIVE |
| `ANTHROPIC_API_KEY` | present | **missing** | ACTIVE on web; Bureau AI Lab cannot generate |
| `AI_GATEWAY`, `AI_PROVIDER`, `OPENROUTER_*`, `OPENAI_API_KEY`, `AI_MODEL_*` | missing | missing | Gateway defaults to Anthropic; **OpenRouter INACTIVE** |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | present | — | ACTIVE (sandbox) |
| `STRIPE_LIVE` | missing | — | **Live OFF** |
| `LEAD_WORKFLOW` | missing | — | **Automatic lead rules OFF** |
| `OUTREACH_TEST_RECIPIENTS` | present | — | ACTIVE (Maxpromo's own mailbox only) |
| `CRON_SECRET` | **missing** | present | web daily cron fails closed (503); Bureau intake flush cron works |
| `OS_BUREAU_AGENT_SECRET` | present | present | ACTIVE contract |
| `OS_BUREAU_ALLOWED_AGENTS` | present | — | ACTIVE (contents not read; Bureau approvals panel needs `bureau:console`) |
| `BUREAU_OS_BUSINESS_ID`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` | — | present | ACTIVE |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | present | — | ACTIVE for intake/contact/newsletter pings |
| `TELEGRAM_WEBHOOK_SECRET` | present | — | **UNUSED** (no code reads it) |
| `OWNER_TELEGRAM_NOTICES` | missing | — | owner push OFF |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_EMAIL` | present | — | ACTIVE (contact form, newsletter) |
| `PORTFOLIO_PASSWORD` | present | — | ACTIVE (demo room; `DEMOS=[]`) |
| `WHATSAPP_*` | missing | — | WhatsApp OFF |
| `OS_AGENT_ALLOWED_ACTORS` (legacy door) | missing | — | legacy agent/OpenClaw door CLOSED (503) |
| `MAXPROMO_EVIDENCE_MODE` | missing | — | correct for production |

## 6. Database / migration state

- OS migrations in repo: `0001`–`0023` (`apps/web/db/migrations`) + `schema.sql`. Bureau (Drizzle): `0000`–`0002`.
- **Production OS has 0019–0023 applied** (verified read-only 2026-10-25: `money.*` tables, `mail.draft_attachments`,
  `mail.merge_self_copy`, `money.reversals.payout_id`, `mail.drafts.scheduled_*`). No partial-migration evidence.
  Older migrations were applied in earlier runs (their tables all exist).
- Unused tables: `chat.leads_telegram`, `chat.events`, `cms.posts`, `os_files`, `os_recurring`, `os_incidents`,
  `public.social_*` (n8n era). `os_owner_notices` = 0 rows (no notice was ever dispatched).
- Production OS row counts: leads 8, clients 3, invoices 3, Angebote 1, jobs 0, newsletter subscribers 0, mail
  threads 10 / messages 10 / drafts 2, approvals 8, agent results 34, audit 25, activities 27.
- Bureau DB (us-east-1): `businesses` 1 (**"Maxpromo Demo Operations"**), `agents` 9, `agent_proposals` 7
  (6 pending demo), `playbooks` 10/`playbook_steps` 40, audit/waiting/document/governance seed rows, `agent_runs` 1
  (real), `app_users` 1, `lead_submissions` 0. Region still US (EU move = OWNER, risk 111).
- Separate Neon project `maxpromo-evidence-lab` (us-east-2) is the evidence harness — test data only.

## 7. Email infrastructure

| Capability | Status | Note |
|---|---|---|
| Hostinger webhook receiver | PROVEN | Bearer, size cap, event filter, mailbox pinned |
| Inbound ingestion / threading | PROVEN (evidence DB) · production in use | Unknown senders never threaded |
| Full body retrieval | PARTIAL | Needs REST API + located message; else 200-char preview |
| Attachment download | PROVEN | Owner-only, policy, byte cap, sandbox CSP |
| Provider Junk reconciliation | PROVEN | Runs only via `after()` triggers, no cron |
| Spam quarantine / block sender | PROVEN | OS-local; Hostinger folders never moved |
| Outbound `deliverDraft` | PROVEN + production (controlled send 2026-10-25) | Claim-once, kill switch `MAIL_SEND_DISABLED` |
| Outgoing attachments | PROVEN | |
| Bounce detection | PARTIAL | Parser proven; depends on body retrieval |
| Quote/invoice/reminder emails | Rendering PROVEN · sending production-used (MP-2026-044, 2026-10-24) | No automated send test |
| Scheduled send | PARTIAL | Cron dead (no `CRON_SECRET`); runs when OS opened |
| Conversation linkage | PROVEN | |

**Resend paths still in production** (only transport `lib/email.ts`):
1. Contact form notification to Marcel — transactional/internal.
2. Newsletter welcome email to subscriber — transactional external.
3. Newsletter broadcast to all active subscribers — campaign. Default sender `onboarding@resend.dev` if
   `RESEND_FROM_EMAIL` unset (it is set in production).
No one-to-one, outreach or document mail uses Resend.

## 8. Email OS product

Views present: Inbox, Needs reply, Follow-up, Waiting, Unread, Leads, Clients, Billing, System, Drafts, Sent,
Archive, Spam (PROVEN, visible in production). **No Trash view.**

| Feature | Status |
|---|---|
| Compose / reply / reply-all / forward / CC-BCC / autosave | BUILT_UNVERIFIED (used in production; Composer untested) |
| Attachments in compose | PROVEN (backend) |
| Business context panel | BUILT_UNVERIFIED (visible in production) |
| Max help in compose (`email.assist`: draft, improve, shorten, translate…) | BUILT_UNVERIFIED (1 production use) |
| Follow-up / waiting | BUILT_UNVERIFIED |
| Drafts view | PARTIAL — an unsent **new** (non-reply) draft has no thread and cannot be reopened |
| **Trash/Delete** | **PARTIAL→effectively absent**: AMBER `email.trash` sets `trashed=true` locally; **no button** (production conversation shows Reply, Forward, Archive, Mark unread, Spam, Block sender) |
| **Restore** | **NOT_BUILT** |
| **Bulk actions / multi-select** | **NOT_BUILT** |
| Universal Max composition from anywhere | NOT_BUILT (Ask Max can only draft up to 3 replies) |
| Voice composition | NOT_BUILT in OS (browser speech only on public contact page) |
| Read/archive/spam sync to Hostinger | NOT_BUILT (one-way, OS-local) |

## 9. Clients

| Capability | Status |
|---|---|
| Manual create | BUILT_UNVERIFIED — `website` field collected but never saved |
| Edit | PARTIAL — fields can't be cleared (COALESCE), `country` ignored, notes blanked in edit form |
| Status | PARTIAL — display only |
| Delete | BUILT_UNVERIFIED **hard delete**: cascades activities/follow-ups, orphans invoices/quotes/leads, 500 if recurring exists; not audited, not via capability engine |
| Client detail / 360° | **NOT_BUILT** (no `/os/clients/[id]`) |
| Image / screenshot / business-card extraction | BUILT_UNVERIFIED (two endpoints: legacy `scan-client` free-text JSON, `enhance` structured) |
| PDF extraction | **DEAD/broken** — pickers accept `.pdf`, routes relabel it `image/jpeg` |
| Document stored at creation | NOT_BUILT |
| Auto-fill + preview before save | BUILT_UNVERIFIED |
| Duplicate/entity matching at client create | NOT_BUILT (exists for quote/invoice creation — PROVEN; auto-save uses loose `ILIKE`) |
| Voice-to-client | NOT_BUILT |

## 10. Leads / outreach

`30ac5b5` implemented research, code scoring, Email OS outreach drafts and the prospect send policy; pushed,
deployed, accepted in production 2026-10-25 with follow-up fixes (`acfd34c`…`247a694`). No migration needed.

| Capability | Status |
|---|---|
| Lead creation + duplicate handling (match list, "save anyway") | PROVEN (production) |
| Website research (robots, ≤4 pages, verbatim quotes + source URLs, unsupported claims dropped) | PROVEN (production + 35 checks) |
| Qualification score / reasons / confidence / opportunity angle | PROVEN (production) |
| Outreach draft as Email OS draft, revision in place | PROVEN (production) |
| Send governance (basis required at all three doors; one send on double confirm) | PROVEN (production) |
| Follow-up on send, cleared on close | PROVEN (production) |
| Reply stops outreach | BUILT_UNVERIFIED in production · PROVEN in evidence (44) — risk 152 |
| Opportunity transition (won only via accepted Angebot) | PROVEN (evidence) |
| Audit / timeline | PROVEN (production) |
| `LEAD_WORKFLOW` | **unset = OFF** (not misconfigured) |
| Real cold outreach | **Not authorised; nothing enables it** (only `OUTREACH_TEST_RECIPIENTS` = own mailbox) |

Risks: 144 OPEN (reduced; `won`/follow-up-done still leave conversation date), 145 FIXED, 146 ACCEPTED residual.

## 11. Discovery / scraping

**NOT_BUILT.** No Google Places, SERP, Firecrawl, Apify, Playwright or MCP discovery in code. Only website research
for a known lead (`fetchSite.ts`, SSRF-guarded) and Nominatim address autocomplete. Residual SSRF gaps: DNS
rebinding window, unbounded `res.text()` without content-length, some IPv6 transition ranges, robots not re-checked
after cross-host redirect.

## 12. Money

PROVEN in code (prove:money, prove:money-evidence) and in production sandbox: payments, reversals/refunds,
unapplied money + resolve, disputes (code), payouts (code), manual payment, cancel invoice, attention/briefing/Ask Max
fee grounding. "Ledger" = `os_payments` + reversals (not double-entry — by design).

**Forensic evidence intact (not altered):** invoice `MP-2026-044` (€1.00, status `cancelled`, client "Stripe Sandbox
Test — Maxpromo Digital"); charge €1.00 `applied`, fee €0.28, net €0.72, `livemode=false`; reversal refund €1.00
`succeeded` ("Stripe sandbox lifecycle test"); `os_payments` row via `stripe:webhook`; provider events: 2
`charge.succeeded`, 2 `payment_intent.succeeded`, 1 `checkout.session.completed`, 2 `charge.updated`, 1
`charge.refunded`, 1 `refund.created`, 1 `refund.updated`; approvals `payment.refund` and `money.resolve` executed.
Also present: a second sandbox charge **€20.00 `unapplied`** ("payment not tied to a Maxpromo checkout session",
2026-10-24) — sandbox test data, shows the unapplied path works.

## 13. Stripe

| Item | Status |
|---|---|
| API version pinned `2026-09-30.endive`, other event versions refused | PROVEN |
| Restricted key, sandbox | ACTIVE (key present; values not read) |
| Signed webhook (HMAC, 300 s, constant time, rotation) | PROVEN + production events received |
| Idempotency keys | PROVEN |
| Checkout / pay page (amount from open balance) | PROVEN (evidence + production sandbox) |
| Fee retrieval | PROVEN (production: €0.28) |
| Refund | PROVEN (production sandbox) |
| Cancelled invoice behaviour | PROVEN (evidence) + production (MP-2026-044 cancelled) |
| `STRIPE_LIVE` | OFF; live key ignored without it (PROVEN) |
| Live payment | OWNER (risk 125) |

Risks 132, 133, 135 FIXED (texts stale), 134 FIXED. `prove-money-http.ts` exists but no script runs it.

## 14. Quotes / invoices

| Capability | Status |
|---|---|
| Create from form, image/paste extraction, client match | BUILT_UNVERIFIED (provenance + match PROVEN) |
| Quote edit | BUILT_UNVERIFIED |
| Invoice edit | PARTIAL — API supports it, **no edit page** |
| PDF | PROVEN |
| Send via Email OS | Content PROVEN; production-used |
| Status / history / cancel / GoBD delete rules | BUILT_UNVERIFIED / PROVEN (cancel) |
| Reminders (`reminder.send`, AMBER) | BUILT_UNVERIFIED |
| Money link panel | PROVEN |
| Natural-language "make an invoice for X" | NOT_BUILT |
| `generate-invoice`, `scan-invoice` routes | DEAD (no UI caller) |
| Phone | Responsive only (horizontal-scroll tables) |

## 15. Ask Max

- Route `/api/os/ask` (owner, rate-limited); UI page + floating panel.
- Model: gateway `standard` tier → Anthropic `claude-sonnet-4-6` (all tiers map there on Anthropic). Model used to
  classify intent and to phrase the gathered facts; keyword fallback without a model.
- Grounding: receivables, fees, payouts, refunds, disputes, attention, briefing, leads, follow-ups, mail threads,
  Bureau agent events, jobs, incidents, client/lead history. Language follows the question (PROVEN).
- No server-side conversation memory (each turn stateless).
- **Primarily Q&A.** One write intent: drafts up to 3 email replies (no send, no confirmation step). No tool use, no
  action proposals. → Not an action interface.

## 16. Universal Capture

**NOT_BUILT end-to-end.** No capture pipeline, no typed proposal contract, no multi-action confirmation, no
`audio.transcribe`. Pieces that exist:

| Piece | Status |
|---|---|
| Paste text → client/quote/invoice form | BUILT_UNVERIFIED |
| Image / screenshot / business card → form (camera via `capture="environment"`) | BUILT_UNVERIFIED |
| PDF | DEAD (broken) |
| Voice / audio | NOT_BUILT in OS |
| Entity matching | PARTIAL (documents only) |
| Action proposals / typed contract / multi-action | NOT_BUILT |
| Lead / email / task creation from content | NOT_BUILT |
| Governed execution (approval engine) | Exists but not fed by capture |

## 17. Model gateway / OpenRouter

- `packages/ai/gateway.ts` (raw fetch), PROVEN by `prove:ai-gateway`; used by web (extraction, Ask Max, mail,
  outreach, research, channels) and Bureau (AI Lab).
- Tiers fast/standard/deep: **no-ops on Anthropic and OpenAI** (all map to one model); distinct only on OpenRouter.
- Provider: `AI_GATEWAY` (web) / `AI_PROVIDER` (Bureau) — unset → Anthropic. OpenRouter never implicit; no keys set → **INACTIVE**.
- **Bypass:** public website chat (`lib/chat/claude.ts`, `app/api/chat/message`) uses `@anthropic-ai/sdk` directly;
  the gateway proof's "no bypass" check greps URLs only and cannot see it.
- No cost/usage capture (risk 10).

## 18. Campaigns / newsletter

Nav label "Newsletter"; no Campaigns route. Production: 0 subscribers.

| Item | Status |
|---|---|
| Plain-text editor + fixed HTML shell + preview + send to all | PLACEHOLDER |
| Email HTML uses CSS `var(--brand-*)` (unsupported in email clients) | defect |
| Templates, logo, images, CTA, blocks, AI generation/rewrite, DE/EN, segments | NOT_BUILT |
| Consent field / double opt-in | NOT_BUILT (honeypot + rate limit only) |
| **Unsubscribe link / endpoint / List-Unsubscribe** | **NOT_BUILT — legal blocker** |
| Suppression | only `unsubscribed` status, owner-toggled |
| Test send, scheduling, history, analytics | NOT_BUILT |
| Transport | Resend, unthrottled `Promise.allSettled` |
| Mobile | fits at 360–412 |

## 19. Mobile

Local runtime, same commit, evidence DB, 360/390/412 (no physical device; production not framable):

| Screen | Verdict |
|---|---|
| Today (`/os`) | PHONE-FIRST (bottom nav, attention + briefing cards) |
| Inbox / conversation | PHONE-FIRST |
| Money | PHONE-FIRST |
| Ask Max | PHONE-FIRST (suggested questions, bottom composer) |
| Approvals | PHONE-FIRST (history lines in English) |
| Leads list / lead detail | PHONE-FIRST (cards since `c04e8d5`) |
| Clients | RESPONSIVE ONLY — horizontal-scroll table, actions off-screen |
| Invoices / Quotes | RESPONSIVE ONLY — horizontal-scroll tables |
| Jobs / Kanban | RESPONSIVE ONLY — horizontal board, mostly empty |
| Newsletter | fits |
| Universal Capture | n/a (not built) |
| Bureau | not inspected (login) |

Dev-only Next badge overlaps the bottom-left nav item locally (not in production). Bottom nav has 5 targets; "More"
holds the rest (depth 2).

## 20. PWA

Manifest `/os/manifest.webmanifest` (id/start_url/scope `/os`, standalone, portrait, token colours, 192/512 icons
`any` only — not maskable, shortcuts Inbox/Money/Ask). Service worker `/os/sw.js`: precaches only `/os/offline`,
network-first navigations, **never caches pages, API responses or business data**; manual `VERSION` bump. Static
offline page. No install prompt handler. Status: **BUILT, browser-proven (served 200 in production); physical
Android and iPhone NOT tested.**

## 21. Agent Bureau

| Surface | Class | Canonical status |
|---|---|---|
| Overview LivePanel (intake outbox, agent_runs, OS approvals count) | PARTIAL_REAL | BUILT_UNVERIFIED (UI not seen) |
| Overview metrics/proposals/waiting/audit | MOCK (seeded DB, demo tenant) | PLACEHOLDER |
| Approvals (read-only projection of OS approvals) | USEFUL_REAL | BUILT_UNVERIFIED |
| Audit, Waiting room, Documents | MOCK (seed) | PLACEHOLDER |
| AI governance, Client implementation, Research, Memory, Settings | MOCK (`lib/mock` + notice) | PLACEHOLDER |
| Playbooks, Operating model | static doctrine | PLACEHOLDER |
| Agents registry | PARTIAL_REAL (1 live of 10) | PARTIAL |
| AI Lab (draft generator) | USEFUL_REAL but **no AI key in prod** | OWNER |
| Leads/Contacts/Projects/Tasks/Briefing pages | DUPLICATE_OS → redirect stubs to OS | DEAD (stubs) |
| `/api/contacts`, `/api/projects`, `/api/tasks`, `/api/memory`… | DUPLICATE_OS serving `MOCK_*` | DEAD/remove later |
| `agent_proposals` + `updateProposalStatus` (second approval store) | DEAD | DEAD |
| Public lead form → Intake | USEFUL_REAL | PROVEN in production (receipt 2026-10-23) |
| Demo seed script | no production guard; **production tenant is the demo business** | risk |

## 22. Exactly what agents can do today

| Agent | Trigger | Input | Model/tool | Action | Approval | Output / destination | Audit | Production proven |
|---|---|---|---|---|---|---|---|---|
| **Intake** (`bureau:intake`) | public form POST, daily 06:00 cron, opening Bureau dashboard | form submission | none (deterministic); OS capability `lead.intake` | signed POST to OS; create/match `os_leads` idempotently | No (GREEN) | lead in OS, activity log, Telegram ping; Bureau `agent_runs` | Yes (both sides) | **Yes** — 1 run 2026-10-23 created lead `4a9f088a…` ("maxpromo Digital", Agent Bureau form) |
| `bureau:console` (not an agent) | Bureau page render | — | OS `approvals.requested` | read OS approvals | — | Bureau approvals page | nonce log | not seen (login) |

Everything else (Chief of Staff, Lead, Research, CRM, Calendar, Content, Operations, Document, Follow-Up agents;
playbooks) is **FUTURE — registry text only**. The OS permits the Bureau to call `outreach.draft/send`,
`followup.due` etc., but no Bureau code does. OS-side "agents" in the Leads workflow (ADR-0027 rules) are OS sweeps,
OFF without `LEAD_WORKFLOW`.

## 23. OS ↔ Bureau integration

One signed door `/api/os/agent/v1/{capabilities,run,events}`; HMAC-SHA256 over ts/nonce/method/path/body-hash
(`packages/config/agent-contract.ts`), 300 s window, nonces in `os_agent_nonces` (69 rows); Bureau may not execute or
reject approvals. Business objects are owned by the OS; the Bureau never reads OS tables (separate Neon projects,
verified). Events carry `businessRef` and are stored in `os_agent_events` (0 rows). Contract proofs
(`prove-os-contract.ts`, `prove:control-planes`) are **not in `verify` or CI**. Permission set is wider than use.

## 24. Single-login answer

**NO.** Proven in production: with a valid OS session, `agents.maxpromo.digital/dashboard` redirects to
`/login`. OS: hand-rolled HMAC cookie `maxpromo_os_session` (host-only, 7 d, `OS_PASSWORD`). Bureau: NextAuth v4
credentials, JWT 8 h, `AUTH_SECRET`, argon2id users in Bureau DB `app_users`, host-only cookie. Different hosts,
secrets, cookie formats and user stores. Safest minimal SSO: OS as identity provider — Bureau `/login` redirects to
an OS endpoint that, given a valid OS session, returns a short-lived signed assertion (sub, exp, nonce) that a Bureau
credentials-provider variant verifies and maps to its operator user; no shared parent-domain cookie. Needs an ADR
(architecture + security decision); not implemented.

## 25. OpenClaw remnants

| Group | Class |
|---|---|
| `agent-gate.ts` `openclaw:`/`telegram:` legacy client; default client when header missing; door shut by unset `OS_AGENT_ALLOWED_ACTORS` | ACTIVE_DEPENDENCY (inert) — remove later |
| Comments in `0011-commercial-core.sql`, `capabilities/operations.ts:8` | STALE_DOCUMENTATION |
| `packages/config/index.ts:82` | REUSABLE_GENERIC |
| `packages/tooling/audit-docs.mjs` reads `docs/openclaw/core-memory.md` | ACTIVE_DEPENDENCY (CI path) |
| `prove-mobile-live.mjs` header | STALE |
| `CLAUDE.md:10,19`, `docs/README.md`, `PLATFORM-CONSTITUTION.md`, `docs/openclaw/*`, several ADRs | STALE_DOCUMENTATION |
| `.gitignore` entries in `apps/bureau` and legacy repo | LOCAL_UNRELATED |

`.openclaw/project.yaml`: tracked in HEAD (added by `3c220a6`), **deleted in the working tree, unstaged** — exactly as
found; not touched. Root `.gitignore` does not ignore `.openclaw/`.

## 26. Telegram state

| Function | Class |
|---|---|
| Send-only notifier: contact form, newsletter signup, lead intake pings | ACTIVE (token + chat id set) → REUSABLE_NOTIFICATION_CHANNEL |
| Owner notices / morning brief push | INACTIVE (`OWNER_TELEGRAM_NOTICES` unset; cron dead) |
| Inbound bot / webhook | none; `TELEGRAM_WEBHOOK_SECRET` UNUSED |
| `chat.leads_telegram`, chat `'telegram'` channel, handover TODO | DEAD → REMOVE_LATER |
| Telegram as OS agent client | INACTIVE (door closed) → REMOVE_LATER |
| Bureau mock "Telegram connected" | misleading MOCK |

## 27. Jobs / Kanban

**CRUD scaffold** (production 0 jobs). Drag-and-drop board, 7 stages; raw GET/POST/PATCH/DELETE outside the
capability engine, no audit, hard delete, no stage validation, DB error text returned. Commercial wiring exists
(`proposal.accept` creates a job; `project.status/update` capabilities; attention rules for late/uninvoiced jobs).
No tasks, owners, activity view or AI. Maturity 1.

## 28. Approvals

AMBER capabilities generating approvals: `proposal.send`, `proposal.accept`, `invoice.send`, `payment.record`,
`reminder.send`, `email.send`, `email.trash`, `email.deliver`, `payment.refund`, `payout.reconcile`,
`money.resolve`, `invoice.cancel`, `recurring.create`, `outreach.send`. RED refused. UI: impact class, summary,
proposer, expiry, preview, two-step approve/reject, payload-hash check, history; append-only `os_audit` (trigger).
Production: 8 approvals (outreach.send 1 executed / 5 rejected — test history; payment.refund, money.resolve
executed). No mock approvals in OS. Gaps: previews/history partly English (risk 131); Bureau requesters shown as raw
`bureau:*`. Bureau keeps a dead second store. Status: PROVEN (engine) / BUILT_UNVERIFIED (UI).

## 29. Dashboard / attention

`/os` **is an owner cockpit**: "What needs your attention today" ranked by urgency × amount × probability across
mail, leads, quotes, invoices, jobs, approvals, uncertain sends, disputes, payouts, bounces, agent events; plus the
briefing and metric cards. Production today: 1 email needs reply; MP-2026-002 €156 151 days overdue; Bureau-form
enquiry; draft invoice not sent. Raw metric cards still fetch whole lists. No tasks section.

## 30. Morning briefing

Screen: BUILT and production-visible (overnight mail/leads/payments/sends/agents, top 3 actions, communications,
money) — grounded purely on records. Push: INACTIVE (cron + `CRON_SECRET` + `OWNER_TELEGRAM_NOTICES`). Briefing
wording BUILT_UNVERIFIED; money parts PROVEN.

## 31. Security

Strong: OS session HMAC; middleware on `/os` and `/api/os`; owner-only approvals with payload hash and claim-once;
append-only audit; Hostinger and Stripe webhook signatures; agent HMAC + nonce + allow-list; attachment boundary;
SSRF guard; prompt-injection screening + verbatim-quote evidence for research; recipients never model-chosen;
prospect send policy at send time; Stripe live gate; PWA never caches data; secrets only in Vercel.

Material gaps:
1. Newsletter has no unsubscribe (legal).
2. Client delete is a hard delete that cascades history and bypasses audit; Jobs API likewise.
3. Legacy agent client is the default when the client header is missing and has execute/reject rights — only the unset allow-list keeps it closed.
4. Bureau demo seed has no production guard; production tenant is the demo business.
5. Bureau `/api/contacts|projects|tasks` serve mock CRM data to any signed-in user.
6. Gateway bypass in public chat (direct SDK).
7. Single shared password for the OS, no MFA (accepted risk 11/12).
8. SSRF residuals (§11).
9. Bureau DB in US (EU move OWNER).
10. Jobs API returns DB error text.
No evidence of model-generated bank details or tax: invoice tax is never computed (§19 UStG).

## 32. Product maturity scorecard

| Module | Level | Why |
|---|---|---|
| Dashboard / Today | **3** | Grounded attention + briefing; cockpit; push dead |
| Inbox | **3** | Complete workflow + AI assist; missing trash/restore/bulk, new-draft reopen |
| Money | **3** | Proven sandbox lifecycle, attention integration; live OFF |
| Invoices | **2** | Create/PDF/send/cancel; no edit page; tables not phone-first |
| Quotes | **3** | Create/extract/edit/PDF/send/accept→job |
| Clients | **1** | CRUD with data-loss bugs; no detail; hard delete |
| Leads | **3** | Research→score→draft→governed send proven; automation off |
| Jobs / Kanban | **1** | CRUD scaffold |
| Campaigns | **0** | Placeholder; legally unusable |
| Approvals | **3** | Governed, hash-checked, audited, phone-first |
| Ask Max | **3** | Grounded Q&A; not an action layer |
| Universal Capture | **0** | Not built |
| Agent Bureau integration | **1** | One deterministic agent; read-only projection; separate login |

No module is at level 4 or 5 yet.

## 33. Test / sample / forensic data

| Data | Where | Class |
|---|---|---|
| MP-2026-044, client "Stripe Sandbox Test", €1.00 charge/fee/refund, provider events, approvals | OS prod | FORENSIC_EVIDENCE — keep |
| €20.00 unapplied sandbox charge | OS prod | FORENSIC_EVIDENCE (unapplied path) |
| Leads "TEST Lead-Abnahme…", "TEST Versandsperre…", "MAX AGENTS TEST — do not contact" | OS prod | FORENSIC_EVIDENCE → SAFE_TO_REMOVE_LATER with Marcel's go-ahead |
| Lead "maxpromo Digital" (discovered; Bureau intake receipt) | OS prod | FORENSIC_EVIDENCE (only Intake production run) |
| Leads "maxi maxi", "careforthe old", "ngala", "caRLLHlXDqWjrtNdzeG" (new) | OS prod | ACCIDENTAL_TEST_DATA (likely; Marcel to confirm — the last looks like a bot) |
| Thread "MXP-INBOUND-PROOF-20261023" | OS prod | FORENSIC_EVIDENCE (inbound proof) |
| Invoices MP-2026-001/002, clients Urologie Neuwied, Amaka | OS prod | real business data |
| 29 `social_posts` (25 published Facebook, 4 approved; last 2026-05-31) | OS prod | historical n8n data (n8n not inspectable) |
| Bureau "Maxpromo Demo Operations" tenant + seeded agents/proposals/playbooks/audit/waiting/docs/governance | Bureau prod | PRODUCT_SAMPLE in the real tenant → needs a decision |
| Bureau 1 `agent_runs`, 1 `app_users` | Bureau prod | real / REQUIRED_SEED |
| Bureau `lib/mock/*` (726 lines) | code | PRODUCT_SAMPLE → remove later |
| Evidence DB `maxpromo-evidence-lab` | separate project | test only |
| Web demo room `DEMOS=[]` | code | empty |

Nothing was deleted.

## 34. Documentation discrepancies

| Document / claim | Verdict |
|---|---|
| `CLAUDE.md` → read `docs/openclaw/core-memory.md` (2026-08-27, OpenClaw-centric) | STALE |
| `CLAUDE.md` docs tree / "verify = 4 steps" | STALE (33 gates) |
| `docs/README.md`, `PLATFORM-CONSTITUTION.md` OpenClaw as memory/governor | STALE |
| `docs/README.md` refers to "the roadmap" | MISSING (no roadmap/PROGRESS doc exists) |
| `platform.md` project names `maxpromo-web`/`maxpromo-bureau` | FALSE (`maxpromo-digital`/`maxpromo-agents`) |
| `platform.md` auth table, coupling table, "AI application-local", ADR-0018 "proposed" | STALE |
| `standards.md` gate table | CORRECT · "twenty-six merge gates" STALE |
| `deployment/vercel.md` Hostinger token "not set yet", shadow Bureau "until paused", missing env rows | STALE / MISSING |
| `change-log.md` 2026-10-25 "production now 247a694 (web and Bureau)" (written by me) | FALSE for Bureau (30ac5b5) |
| Product completion ledger: "Bureau serves f04aa04", "two AI adapters", "after 0021/0023" | STALE / FALSE |
| ADRs 0012, 0013 "proposed"; 0020 "not activated"; 0021/0022 "pending push"; 0025 "accepted for implementation" | STALE |
| ADR-0018 OpenClaw client | partly SUPERSEDED, status not updated |
| ADR-0023, 0026, 0027 | CORRECT |
| `known-risks.md`: rows 52–152 under a "Bureau risks… verbatim" heading; rows 132–152 not in a table; closed rows not marked | structurally STALE |
| `apps/bureau/.env.example`, Bureau middleware comment | STALE |
| `npm run audit:docs` | **fails (exit 1) with 3 pre-existing findings** (a missing path in `agent-bureau-auth-readiness.md:168`, "30/31 gates" in `control-plane-reconciliation.md`); not part of `verify`, so nobody sees it |

## 35. Risk ledger reconciliation

Rows not listed below were checked and their ledger status stands (resolved rows FIXED; design/copy debt 20–37 OPEN;
owner rows OWNER).

| Risk | Ledger | Verdict | Evidence |
|---|---|---|---|
| 10 AI cost logging | open | OPEN | no usage capture |
| 48 chat "say yes" | open | FIXED (unmarked) | string gone |
| 56 no AI credit | open | SUPERSEDED | model calls succeed in prod |
| 73, 105 agent door | open | FIXED/contained (unmarked) | allow-list unset → 503 |
| 75 bytes in OpenClaw store | open | OPEN + STALE | writer gone |
| 81, 85–89 OpenClaw Gateway | open | SUPERSEDED | OpenClaw out |
| 103 shadow Bureau deployed | progress | FIXED | paused |
| 104 Bureau leads never reach OS | open | FIXED | Intake + receipt in prod |
| 106 Bureau behind main | open | FIXED | released |
| 111 Bureau DB region | open | OWNER | us-east-1 |
| 112 two AI adapters | open | FALSE/FIXED | one gateway |
| 113, 148 Bureau mock/duplicates | open | OPEN | mock APIs live |
| 120 scheduled-send timing | built | OPEN (understated) | web `CRON_SECRET` unset → cron dead |
| 121 owner notices inactive | open | OWNER | `CRON_SECRET`, `OWNER_TELEGRAM_NOTICES` |
| 125 live card payment | open | OWNER | `STRIPE_LIVE` unset |
| 127 Resend remains | reduced | OPEN | contact + newsletter |
| 131 English previews | reduced | OPEN | visible in Approvals |
| 132 payout around refunds | closed | FIXED (text stale) | 0022 applied |
| 133 cancel invoice | closed | FIXED | `invoice.cancel` |
| 134 Ask Max language/fee | closed | FIXED | prove:money + prod |
| 135 self-sent twice | closed | FIXED (text stale) | 0021 applied |
| 136 migrations | closed | FIXED | verified |
| 138 PWA icons not maskable | open | OPEN | manifest |
| 139 OpenRouter processor | open | OWNER | keys unset |
| 141 lead automation off | open | OWNER | unset |
| 142 third-party research record | open | OWNER | — |
| 143 injection screening | open | ACCEPTED | — |
| 144 two follow-up records | reduced | OPEN | won/follow-up-done gap |
| 145 legacy lead actions | closed | FIXED | GET-only route |
| 146 reply before spam check | reduced | ACCEPTED residual | 15-min wait |
| 147 discovery | open | DEFERRED/OWNER | — |
| 149 English timeline | open | OPEN | — |
| 150 phone widths local | open | ACCEPTED | — |
| 151 test leads | open | OWNER | — |
| 152 no live reply | open | OPEN | — |

**New risks found by this audit (to add to the ledger):** newsletter without unsubscribe; client hard delete
cascades history; client edit data-loss bugs; PDF accepted but broken; Bureau production tenant is the demo
business; Bureau demo seed without production guard; legacy agent client is the default; gateway bypass in public
chat (proof blind); contract proofs not in CI; new-email drafts unreachable; Jobs API outside the engine; web daily
cron dead.

## 36. Forensic discrepancy register

| Claim | Source | Repo reality | Production reality | Verdict |
|---|---|---|---|---|
| Universal Capture built / in progress | instructions (Brief A) | no pipeline, no proposals, no voice; image/paste extraction only | same | **NOT_BUILT** |
| Campaign Studio | instructions (Brief B) | plain-text scaffold | scaffold, 0 subscribers | **NOT_BUILT** |
| Inbox trash/delete exists | ledger "trash (local, reversible)" | AMBER capability, no button, no restore | no button | **FALSE as a product feature** |
| One login OS + Bureau | architecture goal | two auth systems | Bureau redirects to login | **NO** |
| Lead workflow production green | prior reports | code + proofs | manual flow accepted; automation OFF | **Manual PROVEN; automation OFF** |
| Both apps run 247a694 | my 2026-10-25 report, change-log | Bureau build skipped by design | Bureau reports 30ac5b5 | **FALSE (benign)** |
| Morning brief / scheduled mail run daily | ledger, ADR-0024 | cron needs `CRON_SECRET` | secret missing → 503 | **FALSE in production** |
| Gateway: every model call goes through it | gateway header, proof | public chat uses SDK directly | same | **FALSE** |
| Gateway tiers fast/standard/deep | ADR-0027 | identical model on Anthropic | Anthropic | **PARTIAL** |
| Client creation from documents | Brief A goal | images yes, PDF broken, no storage, no voice | same | **PARTIAL** |
| Clients 360° view | Brief B goal; `client-match.ts` comment | no detail route | none | **NOT_BUILT** |
| Bureau = AI workforce | brand / registry | 1 deterministic agent | 1 real run; demo tenant | **Foundation** |
| Bureau shows real business data | dashboard | seeded demo tenant + 1 live panel | demo business is the only tenant | **MIXED/MISLEADING** |
| Payments complete | — | sandbox lifecycle proven, live gated | sandbox only | **Sandbox PROVEN; live OWNER** |
| Mobile complete | prior reports | phone shell for 6 screens | local only | **Phone-first for 6 screens; responsive-only for 4** |
| PWA proven | ledger | built | served; no device | **Browser-level only** |
| OpenClaw removed | decision log | runtime gone; docs + CLAUDE.md + CI path remain | door closed | **Code yes, docs no** |
| Social publishing not built | strategy list | no OS code | 25 Facebook posts published May 2026 via n8n | **Existed historically outside the repo** |
| Agents can draft/send outreach | agent-gate allow list | permitted, never called | none | **Permission only** |
| Ask Max is an action layer | Brief A | Q&A + draft replies | same | **Q&A** |

## 37. Features we thought existed but do not

Universal Capture; voice anywhere in the OS; PDF extraction; Max action proposals; Inbox Trash UI, Restore, bulk;
Campaign Studio, templates, HTML newsletter, unsubscribe; client detail/360°; client duplicate check; single login;
daily cron (brief push, scheduled mail, lead sweep) in production; real tier routing; any Bureau agent beyond Intake;
lead discovery; invoice edit page; Ask Max memory across turns.

## 38. Features that exist but are underused

`email.assist` modes (improve, shorten, translate, formal…); the attention model; approvals with payload hash;
QuickScan image → client/quote/invoice; client match for quotes/invoices; follow-up/waiting views; scheduled send
(once the cron works); Money unapplied/resolve; `invoice.cancel`; Leads research/scoring; Ask Max fee/payout
grounding; Bureau public lead form → Intake; WhatsApp ingest (off); PWA install on the phone.

## 39. Technical debt that actually matters

1. Web `CRON_SECRET` missing (owner) — kills brief push, scheduled mail, lead sweep.
2. Client data integrity (hard delete cascade, edit bugs, lost website, no audit).
3. Newsletter compliance (unsubscribe, consent, CSS vars, Resend sandbox default).
4. Bureau production tenant = demo business; mock APIs; dead second approval store; seed without guard.
5. Legacy agent client default + OpenClaw/Telegram actor regex.
6. Contract and HTTP proofs outside CI (`prove-os-contract`, `prove:control-planes`, `prove-money-http`).
7. Gateway proof blind to SDK bypass.
8. Two client extraction endpoints; dead `generate-invoice`/`scan-invoice`.
9. Risk ledger structure and stale statuses (agents and Marcel rely on it).
10. Jobs API outside the capability engine.

## 40. Technical debt that does not matter yet

Next 16 `middleware`→`proxy` rename; no formatter; PWA maskable icons; dead sealed-URL content path; `chat.leads_telegram`
and other unused tables; English timeline/approval copy; per-instance rate limits; SSRF IPv6 edge ranges; tiers
until OpenRouter; double-entry ledger; icon bundle; design copy debt (risks 20–37).

## 41. Owner boundaries

Set web `CRON_SECRET` (and decide `OWNER_TELEGRAM_NOTICES`); decide `LEAD_WORKFLOW=1` scope; legal answer on cold
email; second-mailbox live reply test; physical Android/iPhone test; Bureau AI key (if AI Lab wanted); Bureau DB EU
move; decide fate of Bureau demo tenant/seeded rows; delete test leads or keep; rotate stale local Anthropic key;
`STRIPE_LIVE` and live webhook (later); OpenRouter processor check (later); Google Places (later); approve an SSO ADR;
approve OpenClaw doc supersession; remove `TELEGRAM_WEBHOOK_SECRET` (unused).

## 42. Top 10 remaining product gaps

1. Clients: detail/360° page + safe edit + archive instead of hard delete + duplicate check.
2. Universal Capture core (paste/image/PDF → typed proposal → confirm → existing capability).
3. Inbox Trash/Restore (+ Hostinger move) and bulk actions; reopen new-email drafts.
4. Daily cron working (brief, scheduled mail, lead sweep).
5. Newsletter/Campaigns legal minimum (unsubscribe, consent, suppression), then Studio.
6. Single login OS → Bureau.
7. Bureau honesty: real tenant, remove mock/demo surfaces from production view.
8. Ask Max as action layer (proposals) + conversation continuity.
9. Phone-first lists for Clients, Invoices, Quotes, Jobs.
10. Jobs as delivery management (tasks, activity) — or hide until needed.

## 43. Recommended task list (strict priority)

| # | Task | Why now |
|---|---|---|
| 1 | **Owner: set web `CRON_SECRET`** (5 min) | Unblocks scheduled mail, lead sweep, brief; zero code |
| 2 | **Clients foundation**: client detail page (mail, quotes, invoices, payments, jobs, timeline), archive instead of delete, fix edit bugs (clearing, country, website, notes), duplicate check at create, route writes through capabilities + audit; cards on phone | Daily frequency, data integrity, prerequisite for Capture (entity matching target) |
| 3 | **Inbox hygiene**: Trash + Restore in UI (OS + Hostinger move to Trash), bulk select (archive/trash/read/spam), new-email drafts reachable | Daily frequency; Marcel asked |
| 4 | **Universal Capture v1** on the existing extraction + capability engine: paste/image/PDF(fix) → typed proposal (client, lead, quote, invoice, email draft) → preview → confirm → capability; entity match; never auto-merge | Biggest typing reduction; depends on 2 |
| 5 | **Leads controlled real use**: 3–5 hand-picked prospects; owner legal answer; then `LEAD_WORKFLOW=1` on that scope | Strategic priority 2–3; engineering ready |
| 6 | **Single login** ADR + OS-as-IdP SSO | Bureau usage depends on it |
| 7 | **Bureau truth pass**: real tenant, hide/remove mock & seeded surfaces, delete dead approval store and mock APIs, seed guard, contract proofs into CI | Makes Bureau trustworthy; small |
| 8 | **Ask Max actions**: route intents to Capture proposals; keep conversation context | Builds on 4 |
| 9 | Newsletter legal minimum (unsubscribe/consent/suppression, email-safe HTML, mailbox or Resend decision) → then Campaign Studio | Only before the first real campaign |
| 10 | Phone-first list views (Invoices, Quotes, Jobs) | After 2 sets the pattern |
| 11 | Docs/ledger repair (CLAUDE.md, OpenClaw supersession ADR, ADR statuses, ledger structure, change-log correction) | Cheap; protects future sessions — can run alongside 2 |
| 12 | Content/video, social publishing | After campaigns |

## 44. What should be removed from the old roadmap

OpenClaw Mission Control / Gateway / governance items (risks 81, 85–89; `docs/openclaw` as authority); Telegram as
owner control plane and inbound bot; Bureau CRM/contacts/projects/tasks surfaces (OS owns them); Bureau second
approval store; "Phase A transport unification" as an undefined item; `apps/os` / `packages/shared` split from
`platform.md` (not needed now).

## 45. What should not be built yet

Google Places/discovery; OpenRouter activation; video generation; social publishing; native apps; Stripe live;
more Bureau agents (before SSO, real tenant and Capture); full Campaign Studio before the legal minimum and a real
list exists; Content Studio; redesigns; WhatsApp automation.

## 46. Is Maxpromo OS ready for daily primary use by Marcel?

**Yes for mail, money, quotes/invoices, approvals and Ask Max** (proven in production use). **Not yet for clients**
(no detail view, unsafe delete) and not for campaigns. On the phone: daily screens are phone-first; client and
document lists are not.

## 47. Is Agent Bureau a real workforce or a foundation?

**A foundation.** One real deterministic agent (Intake), a sound signed contract, a read-only approval projection,
and a large amount of seeded/mock demonstration content shown inside the real production tenant.

## 48. Does one login work?

**No.**

## 49. Are Leads ready for controlled real-world use?

**Yes, manually and controlled** (research, scoring, drafting and governed sending proven in production). Pending
before real sends: the owner's legal answer on cold email and a recorded basis per recipient. Automation
(`LEAD_WORKFLOW=1`) ready for a small hand-picked scope; the daily lead sweep additionally needs `CRON_SECRET`.

## 50. Single next execution run

**"Clients foundation + Inbox hygiene"** (tasks 2 and 3 above) in one milestone, with Marcel first setting web
`CRON_SECRET`. Universal Capture v1 follows immediately, built on the client detail/matching it creates.
