# ADR-0027 — The model gateway, the lead workflow and a small workflow layer

Date: 2026-10-24 · Status: **accepted with modifications** (Marcel, 2026-10-25) · Parts 1–4 implemented and
**accepted in production 2026-10-25** (manual, controlled); the automatic rules stay off until the owner switches them on · Relates to: ADR-0018
(OS is the commercial system of record), ADR-0020/0023 (Email OS), ADR-0021 (control planes), ADR-0026
(phone-first OS)

## Context

Marcel's direction (2026-10-24): no "MCP zoo" — *add a capability only when it serves a workflow
actually used*. Build next: **OpenRouter + Leads + Agent Bureau + a workflow engine**, then run one
real Maxpromo prospect campaign with them; video, content and social publishing after that.

Acceptance (2026-10-25) locked the direction and modified it:

- **Maxpromo OS** is Marcel's business operating system and owner control plane. **Agent Bureau** is the
  governed workforce behind it. **The model gateway** is the single model-access layer. **Leads + outreach**
  are the next commercial workload; **video + content + social distribution** the one after, once leads prove
  themselves. **OpenClaw is no longer part of the architecture** — nothing is built around it or recreated.
- No MCP zoo, no provider zoo, no generic workflow platform. Build from actual usage.
- OpenRouter stays available but opt-in; production is not switched merely because the gateway exists.
- UWG §7 is a **send** governance boundary, not a reason to stop building discovery, research,
  qualification, drafts, approval, workflow or reply handling.

What the repository already had: two drifted model clients; governed lead and outreach capabilities
(`lead.*`, `outreach.*`, `followup.*`, `pipeline.show`) behind the approval engine, with `outreach.send` on
Resend (risk 127); the Email OS with drafts, revision-bound confirmations, one-time send, threading and business
links; no step that researched a lead, scored it, or reacted to a reply.

The Bureau was audited before anything was added to it (§5): it runs one agent (Intake, deterministic). Its
other nine agents are descriptions; its approvals, tasks, contacts and memory are seed or mock data, or
duplicates of the OS. Nothing in it could run the lead workflow, so the workflow lives in the OS and the Bureau
stays the place future agent identities run.

## Decision

### 1. One model gateway — `packages/ai` (`@maxpromo/ai`) — implemented, in production

Every model call in both applications goes through `complete()` / `completeJson()`.

- **Route** — `AI_GATEWAY` = `anthropic` | `openai` | `openrouter`. Unset: Anthropic if its key exists, else
  OpenAI — the behaviour before the gateway. **OpenRouter is never chosen implicitly.** An unknown name
  configures nothing. The Bureau keeps `AI_PROVIDER` as its name for the route.
- **Tiers, not model names** — `fast` · `standard` · `deep`, mapped per route; `AI_MODEL_<TIER>` overrides.
  Anthropic and OpenAI keep their current models. On OpenRouter each tier names a primary and one fallback
  from a second family. **No automatic router, no cost optimiser, no benchmarking.** Which workloads move to
  OpenRouter is decided later from actual lead/agent usage.
- **OpenRouter data rules, not configurable away:** `data_collection: "deny"`; zero-retention endpoints unless
  `OPENROUTER_ZDR=0`; `require_parameters: true`; `OPENROUTER_REGION=eu` uses `eu.openrouter.ai` (Business plan).
- **Failures** classified once; no credential in any failure, log line or result. **Never executes anything.**
- Proof: `prove:ai-gateway` (gate 32). Shipped `4b5b05c` (2026-10-25); production verified (Ask Max phrased
  answer, scan-client extraction, structured extraction via the enhance route — all on Anthropic).

### 2. Leads — implemented on the existing lead record

**No new lead table.** `os_leads` already had website, city, business type, service interest, stage, next
action and a `research` JSONB. Website research is stored there under one key, `research.site`
(`lib/leads/state.ts`), next to the hand-recorded facts. No migration.

What the Lead Agent needs, and nothing more (collected only where it improves qualification or outreach):

| Category | Fields | Source |
|---|---|---|
| Identity | company, website, city, business type, business email/phone, a contact person named on the site | lead record; the site (Impressum) |
| Business signals | what they do, services; mobile viewport, HTTPS, CMS, online booking tool, contact form, newest copyright year | model from the site's text; **code** from the markup |
| Commercial assessment | verified pain points / opportunities / facts (each with verbatim quote + URL), suggested Maxpromo service family, score with reasons, confidence, caveats, research date, model | model + verification; **code** scores |
| Outreach | basis for email, draft (Email OS), follow-up state, reply state | OS records |

- **Research** (`lead.research`, GREEN, `lib/leads/fetchSite.ts`, `research.ts`): reads the business's own (moved to `packages/research` 2026-10-26; the old path was removed, ADR-0030)
  public site — home page plus up to three same-site pages (Impressum, contact, services, about); refuses
  private/link-local addresses (also after redirects), honours robots.txt, 1.5 MB / 8 s per page, HTML only.
- **Verification:** every finding must carry a verbatim quote found on the page it cites; otherwise it is
  dropped and counted. Model prose is stripped of links and addresses; the contact address is taken only from
  the site's own domain; a person only if the site names them.
- **Qualification** (`lib/leads/qualify.ts`) is code: fit (+15), each verified pain (+12, max 3), opportunity (moved to `packages/research` 2026-10-26; the old path was removed, ADR-0030)
  (+6, max 2), no booking tool where one is expected (+10), not mobile (+8), no HTTPS (+5), stale (+5),
  reachable business email (+10 / −10 without), no angle (−10). Qualified at ≥ 50 unless confidence is low.
  Every point is a reason shown to Marcel.
- **Duplicates** are the existing `findExisting` (email, website domain, phone, folded company + city); the
  lead list now creates through `lead.create` instead of an unchecked insert.
- **Discovery** in this first workflow is manual or arrives by the existing doors (Marcel adds a company with
  its website; an enquiry; an email saved as a lead; Quick Scan). See §6 for the one provider recommended for
  "find businesses in category X around Y".

### 3. A small workflow layer — implemented as five written rules, not an engine

`lib/leads/workflow.ts`. Each rule is EVENT → CONDITION → ACTION through an existing capability (so it is
idempotent, audited and approval-gated like Marcel's own clicks), each transition a line on the lead's timeline:

1. lead has a website, no research, new → `lead.research`
2. research done, qualified, email, no open draft → `outreach.draft` (a draft; nothing is sent)
3. Marcel confirms the draft → `outreach.send` (AMBER) → "if no reply" follow-up
4. follow-up due, still no reply → `outreach.draft` follow-up (a draft, in the same conversation)
5. a reply arrives in the lead's conversation → `activity.log reply_received`: stage → Responded, "if no reply"
   follow-ups cancelled, queued outreach for the lead withdrawn, pending outreach confirmations superseded

**Rules 1, 2 and 4 run on their own only when the owner sets `LEAD_WORKFLOW=1`** (they spend model calls on
real leads); until then they run from the lead screen's buttons. Rule 5 always runs: straight after an inbound
email is accepted, and in every sweep as a catch-up. **Runner:** the existing sweeps — the OS shell poll
(every minute while the OS is open, at most one research per pass) and the daily cron. No new scheduler; a
frequent cron remains the owner decision recorded under risk 120. The workflow never sends.

### 4. Outreach on the Email OS, and the send boundary — implemented

- An email draft from `outreach.draft` is an **Email OS draft** (`mail.drafts`, family `outreach` or
  `follow_up`, linked to the lead, owned by Marcel) — editable in the Inbox; one open draft per lead and kind;
  a revision supersedes any pending confirmation. A follow-up continues the first contact's conversation.
- `outreach.send` sends that draft through **`deliverDraft`** — the one Hostinger send path: one claim, one
  send, never retried, recorded in the conversation with an owner-confirmed business link. **Outreach no longer
  uses Resend** (risk 127 reduced to the contact form and newsletter).
- **The prospect send policy** (`lib/leads/sendPolicy.ts`) separates relationship, transactional, prospect and
  broadcast mail and governs only prospect mail (families `outreach`/`follow_up` on a lead). It requires a
  recorded basis: **enquiry** (an intake receipt, or an email from that address), **consent** or **customer**
  (recorded by Marcel with how and when via `lead.basis`, owner only, audited; can be withdrawn), or **test**
  (every recipient on `OUTREACH_TEST_RECIPIENTS`). Checked at confirmation, again as the mail leaves (scheduled
  sends included), and through the Inbox's `email.deliver` too. A lead who has answered gets no more
  outreach/follow-up mail. `OUTREACH_EMAIL=off` stops all prospect email. **There is no setting that allows
  cold email without a basis**; changing that is a code change after Marcel's legal answer. This ADR gives no
  legal advice.

### 5. The Bureau — what it is used for now

USE NOW: the Intake agent and its outbox; the OS approval projection; the signed OS contract
(`/api/os/agent/v1`) as the extension point — a future research or outreach agent is a new `bureau:<key>`
identity calling OS capabilities, its AMBER actions landing in Marcel's OS approvals. NEEDS SMALL FIX: AI Lab
drafts are not persisted (copy-paste only); `attribution` rows point at a deleted outbox row; the health check
now asks the gateway (done here). DUPLICATE (to remove in a cleanup, not here): Bureau `approvals`,
`agent_proposals`, `approval_events`, `contacts`, `companies`, `tasks`, `projects`, `notes` and their mock APIs.
PLACEHOLDER / FUTURE: waiting room, memory, playbooks, audit console, the nine designed agents, cost tracking.
**Production Bureau has no model key** (`ai-provider: degraded`) — generation there has never been live; the
gateway changed nothing about that.

### 6. Search / scraping — one provider recommended, not added

The first workflow needs no external research provider: the business's own website, read by `fetchSite`, gives
every field in §2's table. Plain HTTP covers typical small-business sites (WordPress, Jimdo, most Wix pages
render server-side); a JavaScript-only site is reported as unreadable rather than guessed. What plain HTTP
cannot do is **discovery** — "businesses in category X around location Y". OpenStreetMap was tried for Neuwied
trades: four results, one website — not enough.

**Recommendation when Marcel wants discovery: Google Places API (New) Text Search**, one provider, behind a
`discover(category, area)` boundary in `lib/leads/`. It returns name, address, website and phone for local
businesses with the best German coverage; the Pro SKU has 5,000 free calls a month (then about $32 per 1,000),
far above Maxpromo's volume. Integration boundary: Places supplies **candidates** only; Google's terms allow
storing the `place_id` but restrict caching other Places content, so the OS stores the `place_id` and treats
the business's own website as the source of record for everything it keeps. Before adding it: Google Cloud
account and key (owner), a check of the current Maps Platform terms, and an entry in the processing record. Not
chosen: a scraping service (no need — sites are read directly), search APIs such as Brave/Tavily/Exa (web
search, weaker for "local businesses in an area"), several MCPs.

### 7. Next workload — video, content, social (recorded, not built)

`IDEA/SIGNAL → RESEARCH → CONTENT ANGLE → SCRIPT → VIDEO/ASSET GENERATION → MARCEL APPROVAL → SOCIAL PUBLISH →
ENGAGEMENT → LEAD/OPPORTUNITY.` Video generation sits behind a Maxpromo provider boundary
(`video.generate()`), never hard-wired to one vendor; social publishing likewise, starting with the one or two
channels Marcel actually uses. Publishing is AMBER (outbound, public). Starts after the first controlled
prospect campaign has shown what the lead workflow needs.

## 8. Production acceptance (2026-10-25)

| Area | Status | Evidence |
|---|---|---|
| Lead research | **production verified** | Maxpromo's own site: 4 pages, 8 verified quotes with source URLs, 2 unsupported claims dropped; after the prompt fix the business is scored on its own operations only (58 → 39, not qualified) |
| Qualification | **production verified** | Score, reasons with points, confidence and caveats on the lead screen |
| Outreach drafting | **production verified** | Email OS draft linked to the lead, recipient from the site's own domain, one open draft per lead and kind, revision v1 → v2 in place, nothing sent by drafting |
| Outreach send governance | **production verified** | No basis: refused at `outreach.send`, Inbox `email.deliver` now and scheduled; test basis: one send to info@maxpromo.digital via Hostinger, two simultaneous confirmations → one send |
| Reply / follow-up | evidence verified (44) | Not exercised live (risk 152) |
| Prompt injection | evidence verified | Pattern screening + verbatim quotes + no tools; not perfect (risk 143) |
| Automatic lead workflow | **OFF / not yet accepted** | `LEAD_WORKFLOW` unset |
| Discovery | **not connected** | risk 147 |
| Real cold outreach | **not authorised** | no setting enables it |

**Recommendation on `LEAD_WORKFLOW=1`: ready for a controlled scope.** The automatic rules only research and draft
(nothing sends without Marcel's confirmation and a recorded basis), at most one research per sweep. Suggested first
scope: switch on while only a handful of hand-picked leads with websites exist, read a week of drafts, then widen.

## Order

1. Gateway ✔ · 2. outreach on the Email OS ✔ · 3. lead data → research/score/approve ✔ · 4. workflow rules ✔ ·
5. **one controlled campaign** (owner: basis and recipients, `LEAD_WORKFLOW`) · then discovery provider if the
campaign needs it · then video/content/social.

## Consequences

- One model implementation for both applications. Bureau error codes are preserved but coarser on two paths.
- Lead research, qualification and drafting work from the lead screen in production once deployed; automatic
  steps wait for `LEAD_WORKFLOW=1`. Prospect email without a recorded basis is impossible by construction.
- Two follow-up records remain for a sent outreach email: the conversation's `follow_up_on` (Email OS) and the
  lead's `os_followups` row (pipeline, notices). Both are cleared by a reply. Unifying them is later work.
- Proofs: `prove:lead-research` (gate 33, offline) and `prove:lead-workflow-evidence` (evidence database).
