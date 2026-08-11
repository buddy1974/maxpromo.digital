# Max Agent — Architecture & Implementation Roadmap (v1)

**Status:** Sprint 1 SHIPPED · Sprint 2 (platform skeleton) · Sprint 3 (operating-model + modules) · Sprint 3.5 (schema hardened + applied to Neon) · Sprint 4 (demo seed + safe DB wiring) BUILT. See "Sprint Log".
**Prepared by:** Principal AI Systems Architect (reviewer/validator role)
**Date:** 2026-05-29
**Repo state:** Active Next.js project, pushed to GitHub, deployed on Vercel.

> Reviewed: master handover, project header, locked tech stack, anti-vibe-code standard, `apex.host` (crawled for structure/logic), Shake (executive layout reference). Validated against §19 UStG and DSGVO constraints for the German market.

---

## 0. Strategic framing (why this order)

Your own go-to-market sequence is **validate → presell → manual delivery → build audience → automate**. That dictates build order more than the product roadmap does:

- You do **not** build the platform first. You build the **public offer page** first, then drive traffic to it (organic social + paid ads), capture interested leads, presell/deliver manually (concierge) — and only build the platform once demand is proven.
- **No waitlist.** The page is public from day one so it can be shared directly and promoted with paid spend. The conversion action is a **lead capture / booking CTA**, not a gated signup — same funnel shape as maxpromo.digital's "Business-Systeme Audit anfragen."
- The platform roadmap below is real and locked-in, but **Sprint 1 is the public landing page**, deliberately ahead of platform foundation. This is the cheapest path to a real, paid-traffic-ready signal.

---

## 1. Architecture Proposal

### 1.1 Shape

A **modular monolith** on Next.js App Router for the MVP, with hard internal seams so any layer (agents, integrations, heartbeat) can be extracted into its own service later without rewriting business logic. This matches the locked stack and avoids premature microservices.

### 1.2 Layers (maps directly to the handover's Brain → Bureau → Memory → Gateway model)

```
┌───────────────────────────────────────────────────────────┐
│ PRESENTATION   Next.js App Router (RSC + client islands)    │
│                Executive/calm UI. Dashboard, briefing, etc. │
├───────────────────────────────────────────────────────────┤
│ APPLICATION    Route Handlers + Server Actions              │
│                Every mutation: Zod validate → authorize →   │
│                persist → return typed result + UI feedback  │
├───────────────────────────────────────────────────────────┤
│ DOMAIN         Pure TS, NO framework imports                │
│                prioritization · lead-scoring · briefing     │
│                (testable in isolation — anti-vibe rule)     │
├───────────────────────────────────────────────────────────┤
│ BRAIN          Orchestrator. Routes a request (from user OR │
│ (Chief of      heartbeat) to one or more Skills. Decides    │
│  Staff)        which Agent handles what. NO autonomy in MVP.│
├───────────────────────────────────────────────────────────┤
│ AGENTS         Registry entries = system prompt + allowed   │
│                skills + tool permissions + config (jsonb).  │
│                Lead · Research · CRM · Calendar · Content ·  │
│                Operations. In MVP they are invoked, not     │
│                self-running.                                │
├───────────────────────────────────────────────────────────┤
│ SKILLS         Reusable, typed functions (summarize, draft, │
│                research, qualify, score, schedule). Pure    │
│                I/O contracts. Shared across agents.         │
├───────────────────────────────────────────────────────────┤
│ MEMORY         Neon Postgres = source of truth (entities)   │
│                + pgvector for semantic recall (notes,       │
│                conversations, decisions).                   │
├───────────────────────────────────────────────────────────┤
│ GATEWAY        Adapter pattern per integration. n8n as the  │
│                outbound automation/execution bus. Telegram  │
│                first channel. Read-only/stubbed in MVP.     │
├───────────────────────────────────────────────────────────┤
│ HEARTBEAT      Scheduled jobs (Vercel Cron or n8n cron) →   │
│                orchestrator scans: morning briefing,        │
│                overdue, follow-ups, opportunity scan.       │
│                MVP = single daily briefing only.            │
├───────────────────────────────────────────────────────────┤
│ GUARDRAILS     Every agent action that touches the outside  │
│                world becomes an Action Proposal (pending →  │
│                human approves → executed). Full audit log.  │
│                Human-in-the-loop from day one in the schema.│
└───────────────────────────────────────────────────────────┘
```

### 1.3 Non-negotiable cross-cutting decisions

- **Multi-tenancy from day one.** Every business table carries `org_id`. All reads/writes go through a single data-access layer that injects the caller's `org_id` — isolation is enforced in one place, then tested. This prevents the classic "one tenant sees another's data" leak.
- **One Brain, many Skills** (per handover) — not 6 independent bots. Agents are *configurations over a shared skill set*, stored in the registry.
- **No autonomous external actions in MVP.** Everything outbound is a proposal a human approves. This is both a safety control and a German-market trust/liability requirement.
- **Secrets never in the DB as plaintext.** OAuth tokens/credentials encrypted at rest (or referenced from a vault / Vercel encrypted env). The `integrations` table stores a reference + status, not raw secrets.
- **EU data residency.** Neon region = EU (Frankfurt). Required for DSGVO when storing third-party contact/lead data.

---

## 2. Database Proposal (Neon Postgres + Drizzle)

Tables grouped by domain. All business tables have `org_id`, `created_at`, `updated_at`. `jsonb` used where shape is genuinely flexible (configs, payloads), typed columns everywhere else.

### Identity & tenancy
- `users` — id, email, name, role *(NextAuth)*
- `organizations` — id, name, owner_user_id
- `memberships` — user_id, org_id, role *(MVP: one org per user, but modelled for growth)*

### Operational core (Phase 1 — visibility)
- `projects` — id, org_id, name, status `(planning|active|blocked|done)`, health, owner_user_id, due_date
- `tasks` — id, org_id, project_id?, title, status `(todo|in_progress|done)`, priority, assignee_user_id, due_date, source `(manual|agent)`, created_by
- `briefings` — id, org_id, date, summary `jsonb`, generated_at

### Relationships (Phase 2)
- `companies` — id, org_id, name, domain, industry, size, notes
- `contacts` — id, org_id, company_id?, name, email, phone, tags `text[]`, status, last_contacted_at, owner_user_id
- `leads` — id, org_id, contact_id?, company_id?, source, stage `(new|qualified|contacted|won|lost)`, score `int`, next_action_at, owner_user_id
- `notes` — id, org_id, entity_type, entity_id, body, author_user_id

### Memory (Phase 3)
- `conversations` / `messages` — channel, external_id, contact_id?, direction, body, ts *(comms memory)*
- `memory_embeddings` — id, org_id, source_type, source_id, content, `embedding vector(1536)` *(pgvector, ivfflat index)*

### Agent system (Phase 3)
- `agents` — id, org_id, key `(chief|lead|research|crm|calendar|content|operations)`, name, description, enabled, system_prompt, config `jsonb`
- `skills` — code-defined registry (typed I/O); DB row optional for enable/config only
- `agent_runs` — id, org_id, agent_key, trigger `(manual|heartbeat|webhook)`, input `jsonb`, output `jsonb`, status, tokens, cost_usd, started_at, finished_at

### Guardrails (Phase 3 — schema present from start)
- `action_proposals` — id, org_id, agent_run_id, type, payload `jsonb`, status `(pending|approved|rejected|executed)`, approved_by, executed_at
- `audit_logs` — id, org_id, actor `(user|agent)`, action, target_type, target_id, metadata `jsonb`, created_at

### Integrations (Phase 4)
- `integrations` — id, org_id, provider, status, credentials_ref *(NOT raw secrets)*, config `jsonb`

### Landing / growth (Sprint 1 — needed first)
- `lead_submissions` — id, name, email, phone?, company?, message?, cta_type `(audit|call|contact)`, status `(new|contacted|qualified|won|lost)`, created_at — **public inbound leads from the offer page** (no waitlist)
- `attribution` — captured on each submission: `utm_source/medium/campaign/content`, `ref_code?`, `landing_path`, `referrer` — so organic vs **paid promotion** ROI is measurable from day one
- `partners` — id, code, name, owner_email *(unique referral links for affiliate/partner promo)*
- `referrals` — id, partner_id, lead_submission_id?, converted_at? *(track + pay partners on conversion)*

**Indexes:** `org_id` on all business tables; `due_date` on tasks/leads; partial indexes on open statuses; ivfflat on embeddings; unique on `waitlist_signups.email` and `partners.code`.

---

## 3. Folder Structure

```
maxpromo-agent-bureau/
├─ app/
│  ├─ (marketing)/              # Sprint 1 lives here
│  │  ├─ page.tsx               # landing page
│  │  └─ legal/                 # impressum, datenschutz
│  ├─ (app)/                    # authenticated product shell
│  │  ├─ layout.tsx             # sidebar nav
│  │  ├─ dashboard/  briefing/  tasks/  projects/
│  │  ├─ leads/  contacts/  research/
│  │  ├─ agents/  memory/  settings/
│  ├─ api/                      # route handlers (waitlist, webhooks)
│  ├─ layout.tsx · globals.css
├─ lib/
│  ├─ db/
│  │  ├─ schema/                # drizzle tables split by domain
│  │  ├─ migrations/
│  │  └─ index.ts               # client + data-access (org scoping)
│  ├─ domain/                   # PURE business logic, no framework
│  │  ├─ prioritization/ · lead-scoring/ · briefing/
│  ├─ agents/
│  │  ├─ brain/                 # orchestrator
│  │  ├─ registry.ts            # agent definitions
│  │  ├─ skills/                # reusable typed skills
│  │  └─ guardrails/            # policy + approvals
│  ├─ integrations/
│  │  ├─ gateway.ts             # adapter interface
│  │  └─ telegram/ · gmail/ · n8n/
│  ├─ memory/                   # relational + vector access
│  ├─ auth/                     # NextAuth config
│  ├─ validation/               # zod schemas (shared client+server)
│  └─ utils/
├─ components/
│  ├─ ui/                       # primitives (design system)
│  ├─ app/                      # dashboard widgets
│  └─ marketing/                # landing sections
├─ config/
│  ├─ constants.ts
│  └─ legal.ts                  # §19 UStG text, Impressum data
├─ drizzle.config.ts
└─ ... (tsconfig, tailwind, env schema, CI)
```

**Rule enforced by structure:** business logic in `lib/domain` never imports Next.js/React. UI never queries the DB directly — it goes through `lib/db` data-access. This is what makes the anti-vibe-code "separate business logic / no giant files" standard mechanical rather than aspirational.

---

## 4. MVP Build Plan (visibility-first, per project rule)

The handover is explicit: **build visibility before autonomy.** Phases:

- **Phase 0 — Foundation.** Next.js + TS + Tailwind, Drizzle + Neon (EU), NextAuth, app shell + design tokens (executive/calm), CI/CD to Vercel, typed env validation.
- **Phase 1 — Visibility core.** Dashboard, Tasks, Projects, Daily Briefing (generated from real data, not faked). Each feature: frontend → API → Zod → persist → ownership → real UI feedback.
- **Phase 2 — Relationships.** Companies, Contacts, Leads (manual lead scoring), Notes.
- **Phase 3 — Intelligence scaffolding.** Memory (relational + pgvector), Agent Registry (view/configure), Brain orchestrator running *single* skill calls on demand (summarize/draft/research), Guardrails (action proposals + audit log).
- **Phase 4 — (post-MVP) Automation.** Heartbeat (cron briefings/scans), integrations via gateway (Telegram → Gmail/Calendar), real agent loops — all behind human approval.

**MVP = Phases 0–3.** Autonomy and live integrations are explicitly out of MVP scope.

---

## 5. Sprint Plan (2-week sprints, solo + AI-assisted)

| Sprint | Goal | Output | Validates |
|---|---|---|---|
| **1 (FIRST)** | Public offer page | Public landing + lead-capture CTA + UTM/referral attribution, deployed, legal-compliant, share/ad-ready | Paid-traffic demand signal |
| 2 | Foundation | Auth, DB, app shell, design system, CI/CD | Platform skeleton |
| 3 | Visibility I | Tasks + Projects + Dashboard (full CRUD) | Core usefulness |
| 4 | Visibility II | Daily Briefing + Contacts + Leads | Operational clarity |
| 5 | Intelligence | Memory + Agent Registry + first Skills | "One brain, many skills" |
| 6 | Safety + 1 channel | Guardrails (proposals/audit) + Telegram + cron briefing | Safe automation path |

Sprint 1 ships **before** the platform, on purpose — it's the cheapest real-world signal and feeds the presell + concierge-delivery motion.

---

## 6. Risks (and mitigations)

1. **Over-building before validation.** Your own thesis says presell first. *Mitigation:* Sprint 1 = landing page; gate platform spend on waitlist/presell signal.
2. **DSGVO / data protection (German market).** Storing third-party contacts/leads is processing personal data. *Mitigation:* EU-region Neon, Datenschutzerklärung + Impressum, deletion/export flows, AVV/DPA template for clients, data-minimization in schema.
3. **Autonomous-action liability.** Auto-sending email or moving money is a trust and legal hazard. *Mitigation:* human-in-the-loop approvals + audit log baked into schema from day one; no autonomy in MVP.
4. **Secret management for connectors.** OAuth tokens are a breach target. *Mitigation:* never store plaintext; encrypted refs / vault; least-privilege scopes.
5. **Multi-tenant data leakage.** *Mitigation:* single org-scoped data-access layer + isolation tests.
6. **LLM cost/latency drift.** *Mitigation:* track `cost_usd`/tokens per `agent_run`; cheap models for routing, premium only where needed; cache.
7. **Marketing over-promise.** apex.host sells "autonomous real-execution." If the landing copy promises that but the MVP is visibility-only, demos break trust. *Mitigation:* honest positioning — "your AI operations bureau, with you in control" — outcomes over hype.
8. **Scope sprawl (6 agents + 1000 integrations).** *Mitigation:* registry-not-autonomy; one channel (Telegram) first; integrations behind the gateway adapter, added one at a time.

---

## 7. Recommended First Sprint — "Max Agent Bureau" Landing Page

> ⚠️ **Superseded 2026-08-11.** The "HYBRID (locked)" dark-premium/orange visual
> aesthetic below (Product Owner, 2026-05-29) was fully replaced by the v2.1
> light system (`docs/visual-facelift-v2.1.md`, ADR-002 in `decision-log.md`,
> full supersession approved and implemented). Section list, CTA, lead routing,
> and backend decisions in this sprint plan are still accurate — only the
> **visual aesthetic** paragraphs below are historical, kept for record.

**Objective:** A deployed, **public**, legally-compliant offer page — shareable on social and ready for paid promotion — that captures inbound leads via a booking/contact CTA and tracks campaign attribution. No waitlist. Your validation + presell asset.

**Design logic — HYBRID (locked).** Definition per Product Owner:
> Hybrid = **Maxpromo Digital visual system** + executive business scenes + operational AI dashboard overlays.
> Style anchor = the current **maxpromo.digital** homepage. **Dark premium. Orange accent.** System-installation positioning. **Business owner in control.** **AI agents visible as a supervised operating layer.**

**Anchor elements inherited from maxpromo.digital** (crawled 2026-05-29):
- Dark premium background, single **orange accent**.
- Monospace `// comment` section labels (e.g. `// Klingt bekannt?`, `// Aus laufenden Systemen`).
- **Live system-status ticker** — scrolling feed of agent events (`● Neuer Lead erfasst · ⊟ KI-Agent online — antwortet · → Rechnung erstellt · ● CRM synchronisiert`). This *is* the "agents visible as a supervised operating layer" — reuse it for the Bureau.
- Numbered process steps (`01 → 05`), real stats from live systems ("Keine Demos"), and the "installed & active" positioning.
- Footer Impressum + §19 UStG already correct on maxpromo.digital — mirror it exactly.

**Structure borrowed from Apex** (toned to the Maxpromo system, not cyberpunk): "not another chatbot" framing, Agent Bureau showcase (the team as cards, paralleling Maxpromo's Branchen-Systeme cards), integrations marquee, Before/After "you are the bottleneck" narrative, trust stats, repeated waitlist CTA.

**Coherence note:** "Business owner in control / AI as a supervised layer" is the marketing face of the architecture's **guardrails + human-in-the-loop** model (§1.2, §1.3). The landing's status-ticker and "Sie genehmigen — die Agenten führen aus" messaging must reflect the *real* approval-gated product, not autonomous hype.

**Section list:**
1. Nav — logo · (Systeme/Docs) · primary CTA button
2. Hero — system-installation headline + subhead + **primary CTA** + trust badges + live agent status-ticker (labelled as product preview)
3. Agent Bureau — Chief of Staff + 6 agents as cards ("a team, not a chatbot"; agents as a supervised layer)
4. Integrations marquee — Gmail, Calendar, Telegram, WhatsApp, Slack, n8n…
5. Before / After — "You are the bottleneck" → "Your bureau runs operations, you stay in control"
6. Three outcome pillars — Organization · Follow-through · Clarity (outcomes, not features)
7. Stats / proof ("installed & active, keine Demos" — honest framing)
8. **Lead-capture / booking CTA section** — name + email (+ optional phone/company/message) → real submission
9. Footer — **Impressum** (Marcel Tabit Akwe, Körnerstr. 8, 45143 Essen · St.-Nr. 111/5339/7597 · FA Essen-NordOst), **"Gemäß §19 UStG wird keine Umsatzsteuer berechnet."**, Datenschutz link

**Primary CTA (locked):** **Book a free audit (Geschäfts-Check)** — same proven funnel as maxpromo.digital. Lead form → you sell on the call (fits the concierge/presell motion). Form fields: name, email, phone?, company?, message?.

**Lead routing (locked):** persist to **Neon** *and* send a **Telegram notification** on each submission.
- *Sprint 1 dependency:* a Telegram bot token + target chat ID (BotFather). I'll need these as env vars — please have them ready, or I'll stub the notifier behind a feature flag so the page ships even before the token exists.

**Backend (anti-vibe-code compliant — no fake success):**
- `POST /api/leads` → Zod validate → insert `lead_submissions` + `attribution` (UTM, `?ref=`, referrer, landing path) → fire Telegram notification → real success/error state in UI.
- Capture UTM + `?ref=` so **organic vs paid-ad ROI** is measurable and partners are attributable → `referrals`.

**Done = public page deployed to Vercel, real lead persistence to Neon, UTM/referral attribution working, legal footer present, mobile-reviewed, OG/Twitter share cards set (it's going on social).**

---

## 8. STOPPED — WAITING FOR APPROVAL

No code will be written until you give the go-ahead to start Sprint 1.

### Decisions locked (Product Owner, 2026-05-29)
- **Landing aesthetic:** ~~HYBRID (locked). Maxpromo Digital visual system as anchor — dark premium, orange accent, `// comment` labels, live agent status-ticker, system-installation positioning, business owner in control, agents as a supervised layer. See §7 for full definition.~~ **Superseded 2026-08-11** — see `docs/visual-facelift-v2.1.md` and ADR-002 in `decision-log.md`. Current aesthetic: white-background light system, single orange accent, same `// comment` labels / status-ticker / supervised-layer positioning retained, dark premium background removed.
- **Repo:** **Same repo** — landing under `app/(marketing)`, product under `app/(app)`, shared design system.
- **MVP scope:** **Visibility-first, no autonomous actions.** Confirmed. Agents are invoked, not self-running; all outbound actions are human-approved proposals.
- **Go-to-market:** **No waitlist.** Public offer page from day one — shareable on social, ready for paid promotion.
- **Primary CTA:** **Book a free audit (Geschäfts-Check)** — lead form, sell on the call.
- **Lead routing:** persist to **Neon** + **Telegram notification** per submission. *(Dependency: Telegram bot token + chat ID; will stub behind a flag if not ready.)*

### Awaiting your word to begin Sprint 1
On "go", Sprint 1 delivers: Next.js skeleton + public `(marketing)` Hybrid landing page (Maxpromo dark/orange system) + audit-booking CTA, `POST /api/leads` → Neon persistence + Telegram notify, UTM + `?ref=` attribution, legal footer (Impressum + §19 UStG), OG share cards, mobile review, deploy to Vercel.

---

## Sprint Log

### Sprint 1 — Public offer page · SHIPPED
- Public Hybrid landing (`app/(marketing)`): hero, agent bureau, integrations marquee, before/after, pillars, stats, audit-booking lead form, footer.
- `POST /api/leads`: Zod validate → Neon persist (`lead_submissions` + `attribution`) → flag-gated Telegram notify. Honeypot. No fake success.
- Legal: `/impressum`, `/datenschutz`; footer simplified (link-only) per owner; §19 clause retained in `config/legal.ts` and on Impressum.
- Deployed to Vercel (Next.js preset), Neon (EU) tables pushed, Telegram pipeline live.
- GTM decision: **no waitlist** — details shown openly, conversion is an optional direct booking.

### Sprint 2 — Supervised Chief of Staff platform skeleton · BUILT
**Goal:** realistic, typed product skeleton behind the landing page. All data is MOCK; nothing autonomous; no live integrations wired.

- **Route map (new):** `/dashboard` (overview) + `/briefing /approvals /tasks /projects /leads /contacts /research /agents /memory /settings`. Public landing gains a secondary CTA "System-Vorschau ansehen" → `/dashboard` (main audit CTA and form untouched).
- **Supervision model (everywhere):** Observe → Prepare → Propose → Human Review → Execute → Log. Approve/Reject/Edit buttons are deliberate **non-functional placeholders**. UI labels: System Preview, Supervised Mode, Approval Required, Proposal Ready, Awaiting Review.
- **Components (`components/dashboard`):** DashboardShell, Sidebar, Topbar, MetricCard, StatusBadge, RiskBadge, ActivityFeed, AgentStatusCard, ApprovalCard, BriefingPanel, TaskList, EmptyState.
- **Types (`types/`):** agent, dashboard, task, project, contact, memory, activity, integration.
- **Agent registry (`lib/registry/agents.ts`):** 9 supervised agents (Chief of Staff + Lead, Research, CRM, Calendar, Content, Operations, Document, Follow-Up), each with allowed/blocked actions and `requiresApproval`.
- **Mock layer (`lib/mock/`):** dashboard, tasks, projects, contacts, activity, approvals, memory, integrations — centralised, business-relevant, demo-ready.
- **API skeleton (`app/api/`):** GET summary, agents, agents/[id], approvals, tasks, projects, contacts, memory, activity — all return typed mock via a single `lib/api/response.ts` envelope. No unsafe writes; `TODO(sprint-3)` markers for DB wiring.
- **DB schema (additive, `lib/db/schema/platform.ts`):** businesses, app_users, agents, agent_runs, agent_proposals, approvals, tasks, projects, contacts, companies, notes, memory_entries, activity_logs, integrations + enums (agent_status, risk_level, approval_status, task_status, project_status, integration_status). Existing lead tables untouched. **Not pushed** — review before `db:push`. pgvector embedding column deferred until the extension is enabled.

**What is real vs mock:**
- Real: landing page, lead capture → Neon + Telegram, legal pages, build/deploy.
- Mock: all dashboard data (via `lib/mock`), agent activity, approvals. The platform schema exists but is not connected.

**Needs later QA / security review:**
- Approve/reject/execute path (must add auth + audit + org-scoping before any real action).
- AuthN/AuthZ (NextAuth) and multi-tenant row scoping — not yet present; dashboard is currently unauthenticated and shows mock data only.
- `db:push` of the platform schema (review FKs/enums against live data first).

**Next recommended sprint:** NextAuth + `businesses`/`app_users`, org-scoped data-access layer, wire ONE read path (tasks or dashboard summary) from mock → real DB end-to-end, behind login.

### Sprint 3 — Core operating model + strategic modules · BUILT
**Frame:** The dashboard is the visible surface; the product is organised around the backbone **Audit → Diagnose → Design Agent Team → Manual Delivery → Systemize → Install → Maintain**. The product must support manual/concierge delivery before automation. Supervision (Observe→Prepare→Propose→Human Review→Execute→Log) is enforced in the UI; all action controls remain non-functional placeholders. Still all-mock, no autonomy, no live integrations.

- **Operating-model core (`lib/core/`):** `operating-model.ts` (7 stages, safe-action lifecycle, audit categories, agent-team recommendations, installation + maintenance), `business-stages.ts` (diagnosis catalogue + helpers), `agent-hierarchy.ts` (org chart), `playbooks.ts` (10 reusable playbooks).
- **Agent hierarchy:** registry extended — each of the 9 agents now declares `supportedOperatingStages`, `auditPainsSolved`, `playbooks`, `businessOutcomes`.
- **Backbone routes:** `/dashboard/operating-model`, `/dashboard/playbooks`, `/dashboard/client-implementation` (concierge/manual delivery).
- **5 strategic modules:** Module 1 **AI Audit Console** (`/dashboard/audit`), Module 2 **Customer Waiting Room** (`/dashboard/waiting-room`), Module 3 **Approval Desk** (`/dashboard/approvals`, expanded with lifecycle timeline + risk summary), Module 4 **Document Intake Desk** (`/dashboard/documents`), Module 5 **Shadow AI Governance** (`/dashboard/ai-governance`).
- **Overview:** gained an operating-model status band (audit status, current stage, recommended team) + Manual Delivery and Maintenance Watchlist panels.
- **Sidebar:** regrouped into Steuerung / Arbeitsbereich / System, with all backbone + module routes.
- **Types (new):** operating-model, audit, waiting-room, approval, document-intake, ai-governance, playbook.
- **Components (new, 15):** AuditFindingCard, AuditPriorityMatrix, AgentRecommendationCard, WaitingCustomerCard, WaitingRoomQueue, ResponseSuggestionPanel, ApprovalTimeline, ApprovalRiskSummary, DocumentIntakeCard, DocumentRiskBadge, RequiredActionPanel, AIToolRegister, GovernanceRiskCard, PolicyChecklist, DataSensitivityMatrix.
- **Mock (new):** audit, waiting-room, documents, ai-governance, operating-model (manual delivery), client-implementation; approvals extended with Approval-Desk items.
- **APIs (new, 7):** audit, waiting-room, documents, ai-governance, operating-model, playbooks, client-implementation — typed mock via the shared envelope, `TODO(sprint-4)` for DB wiring.
- **Schema (additive, `lib/db/schema/operating.ts`):** operating_models, audit_sessions, audit_findings, diagnosis_findings, agent_recommendations, implementation_notes, playbooks, playbook_steps, client_installations, maintenance_checks, waiting_room_items, document_intake_items, document_required_actions, ai_tool_register, ai_governance_risks, ai_policy_checklists, approval_events + enums (audit_status, audit_priority, waiting_room_status, document_status, document_risk_level, ai_tool_status, governance_risk_level). Lead + platform tables untouched. **Not pushed** — review before `db:push`.
- **Landing:** untouched except the existing "System-Vorschau" secondary CTA. Footer legal block stays simplified; Impressum/Datenschutz intact; lead capture unbroken.

**What is real vs mock (Sprint 3):** real = landing + lead capture + legal + deploy. Mock = everything under `/dashboard`, including all 5 modules and the operating-model data. The Sprint 3 schema exists but is not connected.

**Needs later QA / security review:** approve/reject/execute wiring (auth + audit + org scope first); NextAuth + multi-tenant scoping (dashboard still unauthenticated, mock-only); `db:push` review of the platform + operating schemas; no OCR/upload, no real sending, no AI tool scanning — all deferred by design.

### Sprint 3.5 — Schema hardened + applied to Neon · DONE
- Hardened `platform.ts`/`operating.ts`: `cost_usd`→`cost_cents`; `audit_findings.session_id` + `approval_events.proposal_id` made `NOT NULL`; `approval_events.proposal_id` FK→`agent_proposals`; unique constraints on `app_users(business_id,email)`, `agents(business_id,key)`, `playbooks(business_id,key)`.
- Applied the **31 new tables + enums** to Neon as an additive change (lead tables untouched). DB now has the full 35-table schema.
- **Migration-tracking caveat (open):** the apply was done via raw SQL; `lib/db/migrations/meta/` is not a clean Drizzle baseline. Before the next `db:generate`, reconcile with `drizzle-kit pull` (introspect live DB → baseline snapshot) so future migrations diff incrementally.

### Sprint 4 — Demo workspace seed + safe DB wiring · BUILT
**Goal:** turn the static skeleton into a demo-ready operating system backed by Neon — still supervised, no autonomy, no outbound actions.

- **Demo workspace** identified by name **"Maxpromo Demo Operations"** (`config/demo.ts`; no schema change — `businesses` has no key column).
- **Seed system** (`lib/seed/*.mjs`, plain JS run by Node 24 via `npm run db:seed:demo`): business, 9 agents, audit session+findings, waiting-room, documents+actions, governance (tools/risks/policy), 7 proposals (+approval_events), 10 playbooks (+steps), activity, operating_model. **Idempotent** (find-or-create business by name; each child set inserted only when empty), parameterized SQL, no deletes, never touches lead tables.
- **Read layer** (`lib/db/queries/*.ts`): demo-scoped, read-only, wrapped in `safeRead` → returns empty on no-DB/no-seed/any error (so `next build` and unseeded envs never crash).
- **API routes wired to Neon (GET, `force-dynamic`):** dashboard/summary, agents, audit, waiting-room, documents, ai-governance, approvals, playbooks, activity. POST/execution intentionally absent.
- **Pages wired to Neon** (`force-dynamic` + empty states): `/dashboard`, `/dashboard/audit`, `/dashboard/waiting-room`, `/dashboard/approvals`, `/dashboard/documents`.
- **Still on mock/registry/core (documented):** agents, ai-governance, playbooks, operating-model, client-implementation, briefing, tasks, projects, leads, contacts, research, memory. Their API routes read DB, but the pages keep richer registry/core renders pending a later reconciliation.
- **Safety:** approval/execute buttons remain non-functional placeholders; no outbound messaging, no OCR/upload, no AI scanning, no OAuth, no payment, no autonomous execution. Empty states prompt "Run demo seed".

**Run order (local, you):** review seed → `npm run db:seed:demo` → reload dashboard. The seed writes only to the demo business.

### Sprint 5 — Supervised approval workflow persistence · BUILT
**Goal:** make the demo interactive + auditable. A human can approve/reject/mark-reviewed a proposal; the decision is persisted with an audit event + activity log. **No real-world execution** — no message/email/calendar/CRM action is performed.

- **API:** `PATCH /api/approvals/[id]` — Zod-validated `{action: approve|reject|mark_reviewed, note?}`. Loads proposal; only acts on `pending` (else `409 already_*`); updates `agent_proposals.status` (`approve→approved`, `reject→rejected`, `mark_reviewed→` unchanged); inserts an `approval_events` row (step `reviewed`) + an `activity_logs` row. No execution, no external calls. Consistent `{ok,...}` envelope.
- **Why `mark_reviewed` keeps status pending:** the `approval_status` enum has no `reviewed` value; recording a review event avoids an enum migration (none was needed this sprint).
- **DB write helpers** (`lib/db/queries/approvals.ts`, `activity.ts`): `getProposalById`, `updateProposalStatus`, `createApprovalEvent`, `getApprovalEventsForProposal`, `createActivityLog` — centralized, parameterized, errors propagate (no `safeRead`) so failures aren't masked.
- **UI:** `components/dashboard/ApprovalActions.tsx` (client) — Approve Preview / Reject Proposal / Mark Reviewed buttons → PATCH → success/error message + `router.refresh()` (so `/dashboard` counts + activity update). Approvals page rewired; **safety banner** added. Decided proposals show a recorded-decision note instead of buttons.
- **Demo status:** `GET /api/demo/status` — read-only counts (business exists, agents, proposals, waiting-room, documents, playbooks, activity). No reset/delete endpoint.
- **Types:** `ApprovalAction`, `ApprovalEventInput`, `ApprovalTransitionResult` (`types/approval.ts`); `ActivityLogInput` (in activity query). Activity actor is `user` (not "human") to match the existing `ActivityFeed` glyph map.
- **Untouched:** landing, lead capture, Impressum/Datenschutz, schema (no `db:push`, no migration), seed data.

### Sprint 6A — OpenAI-first AI provider layer · BUILT
**Goal:** safe AI **draft** generation behind a clean provider abstraction. AI prepares proposals/recommendations only — **no execution, no outbound action, no DB writes from generation.**

- **Provider strategy:** OpenAI default (cost-effective); Anthropic a deliberate placeholder (`ai_provider_not_implemented`) for premium reasoning later.
- **Env (`config/env.ts`, server-only):** `getAIConfig`, `hasOpenAIConfig`, `getOpenAIModel`. Vars: `OPENAI_API_KEY` (optional), `AI_PROVIDER=openai`, `AI_MODEL=gpt-4.1-mini`, `AI_TEMPERATURE=0.3`. **Never required at boot** — dashboard builds/renders without it; keys never `NEXT_PUBLIC_`.
- **Provider layer (`lib/ai/`):** `types.ts`, `prompts.ts` (supervised system prompt + per-task instructions; JSON-only output), `safety.ts` (input bounds; sensitive-domain risk floor → tax/legal/medical/HR/finance/customer default high; outbound-adjacent drafts default medium), `openai-provider.ts` (fetch to `/v1/responses`, no SDK dep, robust text extraction + JSON parse with raw fallback, handles missing key / 429 / errors without leaking bodies), `provider.ts` (selector). Tasks: follow_up_draft, audit_summary, document_summary, waiting_room_response, governance_recommendation, proposal_draft.
- **API:** `POST /api/ai/generate` (Zod-validated, key checked in-route → `ai_not_configured`, returns `{title, summary, draft, riskLevel, recommendedNextAction, requiresApproval:true, safetyNote}`, **no DB write**); `GET /api/ai/status` (`{provider, model, configured}`, never the key).
- **AI Lab** (`/dashboard/ai-lab`, internal, sidebar item ✦): task selector + input + generate → result panel + safety note; "Create proposal" disabled ("Coming next"); not-configured message guides adding `OPENAI_API_KEY` in Vercel. Not on the landing page.
- **Visual clarity layer (added on top of 6A, no rebuild):** `AgentIdentityCard` (operational card — status/risk/approval badges, Observiert/Bereitet vor/Freigabe nötig, connected systems, last activity, next action; **no faces/avatars**) now powers `/dashboard/agents` (Chief primary + specialists). Marketing `AgentBureau` refined to short Observiert/Bereitet-vor/Freigabe-nötig cards (+ Governance-Agent positioning). Two infographics — `SafeActionLifecycle` (6 steps, "Ausführen" gated behind "Menschliche Freigabe") and `BusinessFlowInfographic` (problem → prepared → owner approval → logged → organised) — inserted into the landing after the team and after Before/After. Operating-model page gained a 7-stage chain strip. Copy reinforces "KI bereitet vor. Der Mensch entscheidet."
- **Untouched:** hero, lead capture, Impressum/Datenschutz, footer legal, schema (no migration/push), seed, approval flow.

### Sprint 6 Candidate
- admin seed controls (reseed/reset demo, guarded)
- lead-to-client conversion flow
- **auth boundary (NextAuth)** + business context from session (replaces the demo-by-name lookup); scope approval writes to the authed business
- client workspace setup (real onboarding beyond the demo)
- n8n integration planning (the actual execution bus behind approvals)
- reconcile Drizzle migration baseline (`drizzle-kit pull`)

---

## Next Security Roadmap

> **Rule:** Do not onboard real client data until Auth-1 through Auth-4 are complete.

### Auth-0 — Drizzle Baseline Reconcile ✓ COMPLETE
- Commits: `f620e1f` (archive old manual migration) + `f00f53b` (generate baseline SQL and journal)
- Baseline: `0000_burly_black_bird.sql` — DO-NOT-APPLY phantom; Neon already has this schema
- Rule: `drizzle-kit migrate` must not run until strategy is intentionally changed
- Unblocks: Auth-1

### Auth-1A — Auth Columns Migration ✓ APPLIED TO NEON
- Migration: `lib/db/migrations/0001_auth_user_columns.sql`
- Schema: `app_users.password_hash` (text nullable) + `app_users.last_login_at` (timestamptz nullable)
- Columns confirmed live in Neon by Marcel.

### Auth-1B — Auth Foundation ✓ COMPLETE
- next-auth@4.24.14 + argon2@0.44.0 installed; added to package.json
- `auth.ts`: NextAuth config — Credentials provider, JWT callbacks, 8h session, argon2id verify
- `app/api/auth/[...nextauth]/route.ts`: App Router handler (runtime: nodejs)
- `lib/auth/password.ts`: hashPassword / verifyPassword (argon2id)
- `lib/auth/session.ts`: getCurrentUser, requireUser, AuthRequiredError
- `lib/auth/tenancy.ts`: getCurrentBusinessId, requireCurrentBusiness, requireBusinessAccess, BusinessAccessError
- `types/next-auth.d.ts`: Session/User/JWT augmentation (userId, businessId, role)
- `app/login/page.tsx`: Login page (server, German, dark premium, no public signup)
- `components/auth/LoginForm.tsx`: signIn("credentials") client island
- `components/auth/Providers.tsx`: SessionProvider root wrapper
- `app/api/auth-status/route.ts`: GET → {authenticated, user} in API envelope
- `app/layout.tsx`: Providers wrapper added
- `components/dashboard/Sidebar.tsx`: logout button (signOut → /login)
- `.env.example`: AUTH_SECRET, NEXTAUTH_URL added
- **To complete**: add AUTH_SECRET + NEXTAUTH_URL to .env.local and Vercel env vars

### Auth-1C — Operator Provisioning Script ✓ COMPLETE
- `scripts/provision-operator-user.mjs`: one-off local script to hash + store operator credentials
- Reads DATABASE_URL, OPERATOR_EMAIL, OPERATOR_PASSWORD, OPERATOR_NAME from env
- Finds demo business by name; fails safely if not found
- Upserts app_users row with argon2id hash; idempotent
- Never logs password or hash; prints safe summary only
- `package.json`: added `auth:provision-operator` npm script
- **To run**: set OPERATOR_EMAIL + OPERATOR_PASSWORD in `.env.local`, then `npm run auth:provision-operator`

### Auth-2 — Protect Dashboard ✓ COMPLETE
- `middleware.ts`: `withAuth` from `next-auth/middleware`, matcher `/dashboard/:path*`
- Unauthenticated → `/login?callbackUrl=<path>` (automatic via withAuth)
- Authenticated → request passes through; no role check at middleware level
- Login page already redirects authenticated users → `/dashboard` (Auth-1B)
- Logout button in Sidebar (Auth-1B, signOut → /login)
- `requireUser()` / `requireCurrentBusiness()` helpers in `lib/auth/session.ts` + `tenancy.ts` (Auth-1B, ready for Auth-3)
- **API routes remain unprotected — Auth-3 next**
- `/api/ai/generate` remains open cost surface — Auth-3/Auth-4
- `/api/approvals/[id]` remains mutable without auth — Auth-3

### Auth-3 — Protect APIs + Ownership Checks ✓ COMPLETE

**Commit:** Auth-3: protect API routes + ownership checks

- `lib/auth/api-guard.ts` — `requireApiUser`, `requireApiBusinessId`, `assertBusinessAccess`, `unauthorizedResponse`, `forbiddenResponse`
- 19 API route files updated with auth guards
- `POST /api/ai/generate` — gated (no anonymous OpenAI cost surface)
- `GET /api/ai/status` — gated
- `PATCH /api/approvals/[id]` — 401 if no session; 404 if businessId mismatch (IDOR guard); actorName from session (not hardcoded)
- `GET /api/demo/status` — owner/operator role check
- All dashboard GET APIs: session + businessId required
- Public (unchanged): `/api/leads`, `/api/auth/**`, `/api/auth-status`

### Auth-4 — Rate Limiting ✓ COMPLETE

**Commit:** Auth-4: add API rate limiting

- `lib/security/rate-limit.ts` — fixed-window limiter, Upstash REST production, in-memory fallback for local dev
- `POST /api/leads` — 5 req/60s per IP
- `POST /api/ai/generate` — 10 req/60s per authenticated user
- `PATCH /api/approvals/[id]` — 20 req/60s per authenticated user
- Login (`auth.ts` authorize callback) — 10 attempts/900s per email
- All 429 responses: `{ ok: false, error: "rate_limited" }`
- Env: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` required in production

### Auth-5 — Session Business Context ✓ COMPLETE
- Remove `getDemoBusinessId()` runtime calls from all query files
- Replace with session-derived `businessId` passed from route handlers
- `config/demo.ts` constants retired from application runtime (kept for seeding only)
- Affected files: `lib/db/queries/activity.ts`, `agents.ts`, `approvals.ts`, `audit.ts`, `documents.ts`, `governance.ts`, `playbooks.ts`, `waiting-room.ts`, `app/api/demo/status/route.ts`

### Auth-6 — Demo/Admin Controls + Preview Decision
- Guarded demo reset endpoint (admin/operator role required)
- Decision on public preview route (deferred from earlier sprints)
- Vercel preview deployment protection review

---

## Document Package Agent — Capability Roadmap

> Full definition: `docs/capability-document-package-agent.md`

**Status:** Backlog / Post-auth module  
**Do not build before:** Auth-1 through Auth-5 complete.

> ✅ Auth-1 through Auth-5 complete. Platform is tenant-isolated and production-safe for first real client onboarding.

### What it does
Prepares review-ready document packages from scattered business data, files, forms, spreadsheets, and system records. Checks for missing fields, inconsistent data, required attachments, deadlines, and review risks. Does not send, certify, or submit anything without human approval.

### Pattern
Scattered business data → AI prepares complete package → AI checks gaps → human approves → package delivered/logged.

### Broad use cases
Tax preparation · Client onboarding · Insurance claims · Tender/application · Supplier delivery · HR onboarding · Technical/admin packages (e.g. machine shop COC-style review packages pulling QuickBooks + Excel + heat numbers + inspection notes)

### Positioning line
*From scattered files and business data to approval-ready packages.*

### Service name (consulting)
Document Package Automation

### Implementation stages (all post-auth)
| Stage | Description |
|---|---|
| 1 | Manual package checklist + AI draft in AI Lab |
| 2 | Create package proposal into Approval Desk |
| 3 | Document intake with upload and OCR |
| 4 | Integrations with business tools and spreadsheets |
| 5 | Package export and delivery under approval |

### Training simulations (future — no UI yet)
Chief of Staff · Document Package Agent · Operations Agent · Governance Agent · Follow-Up Agent · Approval Desk · AI Lab draft-to-proposal · Client discovery call with objections

---

## Version 2 Backlog
Not to be implemented now — captured for sequencing after the platform is wired to real data:

- Deeper industry-specific agent teams (per-vertical bureaus).
- Real integrations via the gateway (Gmail, Calendar, WhatsApp, Slack, HubSpot, Stripe — read-first).
- OCR + document upload pipeline for the Document Intake Desk.
- Inbox / calendar OAuth.
- Partner / referral tracking surfaced in-product (schema already supports it).
- Paid audit pipeline (charged Geschäfts-Check → implementation).
- Reporting exports.
- Voice layer.
- Industry templates: RestaurantOS, HandwerkOS, PraxisOS, TaxKontrol, PublishingOS.
