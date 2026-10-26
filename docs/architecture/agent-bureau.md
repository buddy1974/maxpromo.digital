# Agent Bureau — what it is and what it does (ADR-0030)

`agents.maxpromo.digital` · Vercel project `maxpromo-agents` (root `apps/bureau` in this repository)
· Neon project `maxpromo-agent-bureau` (us-east-1, migration to the EU pending, ADR-0021 §8).

The standalone repository `maxpromo-agent-bureau` is the pre-merge history (ADR-0001), archived on
GitHub; its old Vercel project still has a running deployment without credentials (risk 103). All
Bureau work happens in `apps/bureau`.

## 1. Reality check (2026-10-26, before this work)

| Capability | Verdict | Evidence |
|---|---|---|
| Intake (site enquiry → `lead.intake`) | PROVEN | 1 completed run (2026-10-23), outbox empty |
| Agent registry (10 agents) | 1 real, 9 PLACEHOLDER | names, catalogue text, no code; DB `agents` rows with fake statuses (`active`, `proposing`) |
| Proposals / approvals (`agent_proposals`, `approvals`, `approval_events`) | SAMPLE + DUPLICATE | 7 seeded proposals from 2026-05-29; business approvals belong to the OS (ADR-0021) |
| Approvals screen | PROVEN (projection) | reads OS `approvals.requested` as `bureau:console` |
| Waiting room | SAMPLE | 5 fictional customers |
| Audit console, documents, AI governance, operating model, playbooks, client implementation, memory, settings | SAMPLE / PLACEHOLDER | seed rows or `lib/mock` |
| Contacts, companies, projects, tasks, notes | DUPLICATE_OS_DOMAIN | empty tables + mock APIs |
| AI Lab | DEAD in production | no model key; drafts not persisted |
| Execution runtime / work items | NOT_BUILT | only `agent_runs` for Intake |
| Model calls | NOT_BUILT in production | no key |
| Memory, playbooks, cost tracking | PLACEHOLDER / NOT_BUILT | |
| OS contract | PROVEN one way (Bureau → OS) | signed door, ADR-0021 |
| Authentication | PROVEN (credentials) | one owner user; no link to the OS login |
| Tenant model | PROVEN, misleadingly named | one business, "Maxpromo Demo Operations", linked by `BUREAU_OS_BUSINESS_ID` |

The overview presented the seed as live work ("open approvals", "active agents", "waiting customers").

## 2. Agents after this work

| Agent | Trigger | Input | Model | Tools | Code | Output | Durable state | OS result path | Production proof | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Intake | site form submission, cron, dashboard | the enquiry | none | `lead.intake` | `lib/agents/intake.ts` | OS lead | `agent_runs`, outbox | `run lead.intake` | 2026-10-23 run | REAL (deterministic) |
| Research Agent | OS work request (Max or lead screen, owner confirmed) | website + language | `claude-sonnet-4-6` via the OS gateway task `lead.research` | public site reader (`fetchSite`) | `lib/agents/research.ts` + `@maxpromo/research` | facts (verified quotes), code-read signals, grounded inferences and opportunities, unknowns, qualification (opportunity score, research confidence, verdict), recommendation with what to check (ADR-0031) | `agent_work`, `agent_runs` | `run agentwork.result` + OS pull | work `cd4c28b2…` completed (45/100, 7 quotes, 27 s); `64e668dc…` failed honestly | REAL |

No other agent exists in the registry.

## 3. Architecture

```
Marcel ─ Max (AGENT_WORK) / lead screen ─▶ OS agentwork.request (owner only)
   OS: os_agent_work row, lead claimed for the work, POST bureau /api/work/v1/request (signed, client os)
   Bureau: agent_work row (tenant from credential) ─ 202 ─ after(): Research Agent
      fetchSite (public hosts, SSRF/robots/limits) ─▶ POST os /api/os/agent/v1/model {task: lead.research, content}
      verify quotes on the cited page ─▶ qualify ─▶ recommendNext
      POST os /api/os/agent/v1/run agentwork.result  (as bureau:research)
   OS: parseFindings ─▶ qualify again ─▶ applyResearchOutcome (lead, timeline) ─▶ os_agent_work summary ─▶ audit
   Max card / lead screen: poll ─▶ reconcileWork (Bureau status) when open
```

| Plane | Owns |
|---|---|
| Maxpromo OS | the lead and everything written to it, the score, approvals, attention, the audit, the model key and the gateway |
| Agent Bureau | the work item, its runtime state and evidence, agent runs, failures, delivery state |
| `@maxpromo/research` | the research and qualification rules (one implementation) |

## 4. The contract

| Concept | How |
|---|---|
| Authentication | HMAC-SHA256 over timestamp, nonce, method, path, body (`packages/config/agent-contract.ts`); work door key = `workDoorSecret()` |
| Replay | nonce recorded (`work_nonces`, OS `os_agent_nonces`), 5-minute window |
| Tenant | from the credential (`BUREAU_OS_BUSINESS_ID`); other tenants' work is "not found" |
| Actor | `requestedBy` = `os:marcel`; results as `bureau:research` (allow-listed in `OS_BUREAU_ALLOWED_AGENTS`) |
| Object reference | `subject: { kind: 'lead', id, label }` |
| Capability | `agent: 'research'` → `WORK_AGENTS.research.capability = 'lead.research'` |
| Work id / idempotency | chosen by the OS; same id → existing item (`duplicate: true`) |
| Status | `queued · running · completed · failed · cancelled` |
| Result | `{ findings, qualification, recommendation }`, checked by `parseFindings`, re-scored by the OS |
| Failure | `{ category, reason, detail, retryable }` |
| Approval | none needed (GREEN, reads a public site); Marcel's confirmation of the Max card is the start |
| Audit | OS `os_audit`: `agentwork.request` (owner), `max.AGENT_WORK`, `agentwork.result` (agent); lead timeline; Bureau `agent_runs` |

## 5. Failure and retry

Site unreachable, robots, not HTML, blocked host, model unavailable → `failed` with a category; the
lead says research failed; a `failed` agent event becomes an attention item on `/os`. Work running
past 10 minutes is failed as `timeout` (Bureau `failStale`, OS `reconcileWork`). The work is never
retried automatically; Marcel starts new work. Hand-backs are idempotent and retried.

## 6. One login

Machine authentication never uses a browser session. For Marcel: the OS sidebar / phone menu link
`/api/os/bureau/handoff` → one-time ticket (60 s, fragment) → `agents.maxpromo.digital/sso` → the
Bureau's own session for its owner user. Verified in production 2026-10-26.

## 7. Bureau screens

Overview (runtime: Intake and OS approvals projection; delegated work; connections; failures in 7
days), Work (every item with state, duration, model, score or failure, delivery), Agents (the two
agents with a runtime), Approvals (OS projection). No sample data.

## 8. What the Bureau cannot do

Discover leads, send anything, change a business record itself, remember across work items, run
playbooks, delegate to itself, act without an owner-confirmed request, or run any agent but the two
above.

## 9. Evidence (2026-10-26)

**Production** (`a04a31d`, `572e61e`, `8e148c4`, `531419d`, `010fe57`):

| # | Scenario | Result |
|---|---|---|
| 1 | Signed request → one item; duplicate | one `agent_work` row, attempt 1, one run (direct duplicate replay needs the production key — proven in evidence) |
| 2 | Invalid authentication | no client 400; wrong key 401 at the work door, at status for the real work id, at the OS model and result doors; probe work id absent |
| 3 | Research | `www.maxpromo.digital` read, `claude-sonnet-4-6` via the OS gateway (26 s), 7 verbatim quotes, 1 claim rejected |
| 4 | Qualification | 45/100, not qualified, confidence high — OS and Bureau agree |
| 5 | OS result | lead score 45, timeline `research_completed` by `bureau:research`, audit chain request → max → result |
| 6 | Max delegation | "Research this lead and tell me whether it's worth contacting." on the lead screen → AGENT_WORK preview → Start research |
| 7 | Status | "Waiting for the Research Agent" → "Research Agent working" → "Research finished" |
| 8 | Completion | score, verdict, confidence, recommendation, evidence with sources in the Max card |
| 9 | Recommendation governance | not reachable in production (no qualified test lead); proven in evidence |
| 10 | Failure | `.invalid` website → failed (site, not retryable), attention item, lead "research failed", 0 outbound |
| 11 | Prompt injection (website) | evidence only (no hostile test site in production) |
| 12 | Tenant/auth isolation | wrong keys refused in production; tenant isolation proven in evidence |

**Evidence** (`prove:agent-work-evidence`, 57 checks): both scenario sets above across a running OS,
a running Bureau, both evidence databases, real site reads, with a local stand-in answering only the
model step. **Offline gate** (`prove:agent-work`, 44 checks).

## 10. Real-lead repair (ADR-0031, 2026-10-26)

**The first real prospect** — a surgical practice in Essen, `http://www.mediza-chirurgie.de/` (lead
`a5a1f417…`), started by Marcel through Max at 07:07 — scored 28/100, not qualified, confidence low,
with no evidence. **Root cause: the fetch.** The home page is a 2009 FrontPage frameset; the reader
took its `<noframes>` sentence (108 characters, umlaut broken by UTF-8 decoding of windows-1252) as the
site and never read the four frames, where every useful statement was. Absence rules then scored the
unseen pages (no email −10, no booking +10), an unverified model sentence became the angle, and the
verdict ("not qualified") contradicted the recommendation ("review"). Full trace in ADR-0031.

| Trace | Before (work `61583a68`, 07:07) | After (work `86e5b3d4` from Max 08:14, `fce1f996` from the lead screen 08:25) |
|---|---|---|
| Requests | robots, home | robots, home, 4 frames, contact, office hours, services, one HTTPS check |
| Pages read | 1 (the frameset shell) | 7 — `head`, `buttons`, `main-chirurgie`, `unten` (frames), `main-kontakt`, `main-sprechzeiten`, `main-leistungen` |
| Text, charset | 108 characters, decoded as UTF-8 (wrong) | 4 161 characters, windows-1252 |
| Signals | FrontPage, no viewport, nothing else | + HTTP only (HTTPS fails at TLS), © 2009, published address `chirurgie@mediza.de` (other domain) |
| Model step | 6.7 s; 0 kept, 1 rejected | 41.1 s; 12 and 10 facts kept, 0 rejected, 4 and 3 inferences, 3 opportunities, 0 and 4 open questions |
| Score | 28: fit 15, no booking 10, not mobile 8, no HTTPS 5, no email −10 | 67: fit 15, telephone-only pain 12, 2 opportunities 12, no booking 10, not mobile 8, no HTTPS 5, © 2009 5; the off-domain address ±0 (check) |
| Confidence, verdict | low, "not qualified" + "review" | high, **qualified**; next step: confirm an address of their own, then introduce |
| Duration | 7.1 s | 41.5 s in the Bureau (fetch ≈ 0.4 s), 44 s click to result |
| Sent | nothing | nothing (0 messages, 0 drafts, 0 approvals; no basis recorded — UWG §7 notice unchanged) |

The 28 is kept: Bureau and OS work records, the timeline, and `research.site_history` on the lead
(shown as "Earlier research"). The lead moved Discovered → Qualified (the stage rule for a qualified
verdict). The first after-run showed one fact whose text interpreted its quote ("created 2009, not
updated since" over "© 2009"); `78ad9d7` replaces such a paraphrase by the quote and the task says so;
the second run had none.

| # | Production acceptance | Result |
|---|---|---|
| 1 | Modern site still works | TEST lead (maxpromo.digital), work `afe5b85f`: 4 pages, 12 facts, 0 pains, 0 opportunities → 0, not qualified, confidence high (its own offering is not its problem) |
| 2 | Legacy site | Mediza: frameset, windows-1252, HTTP only — read fully (7 pages) |
| 3 | Facts have verified sources | every fact: verbatim quote + page URL; code-read signals S1–S5 |
| 4 | Inference not shown as fact | "Our reading — the website does not say this", each citing fact/signal ids |
| 5 | Opportunity not shown as fact | "Possible opportunities — hypotheses", each citing ids |
| 6 | Low confidence ≠ low opportunity | proven offline and end to end (thin read → review); in production both after-runs read well (high) |
| 7 | Unknown vs negative | the off-domain address is a ±0 check, not −10; booking absence scored only because the office-hours page was read |
| 8 | Duplicates | the telephone-only statement (two pages) is one fact, scored once |
| 9 | Lead page | verdict, both dimensions, next step + checks, facts, signals, reading, opportunities, score, earlier research |
| 10 | Max card | verdict, top facts, reading, opportunities, what to check, Open lead (352 px panel, no overflow) |
| 11 | Prompt injection | evidence (hostile fixture, end to end): claims, inferences, opportunities and questions built on or addressing it all dropped |
| 12 | Mediza rerun explainable | yes — see the table above |

Proofs: lead research 70, agent work 47, agent work evidence 59, lead workflow evidence 44, Max 46 and
46, control planes 33; `npm run verify` 36/36.

## 11. Field calibration (ADR-0032, 2026-10-26)

Marcel judges finished Research Agent runs on the lead screen (agree / partly / disagree, optional issue
tags and note). One judgement per run, append-only (`os_agent_work_review`, migration 0028); the
newest row is current. `agentwork.review` is owner-only, GREEN, on the lead screen's action route and
not a Max proposal; it writes the review and `os_audit` and nothing else. Each finished run keeps its
calibration record in `os_agent_work.summary.record`. The summary at `/os/leads/calibration` counts real
prospects only and shows patterns from five judged runs. The Research Agent itself is unchanged.

Evidence: `prove:research-calibration-evidence` (23, evidence database) — a review attaches to its run;
earlier runs and results unchanged; two runs, independent reviews; the three verdicts, tags and note
persist, invalid input refused; no score or result field accepted; lead score, research and stage
unchanged; no draft, outbound message, approval or basis; only the owner, only completed runs; the
summary counts real judged runs only; the lead screen links its result to the right run.
