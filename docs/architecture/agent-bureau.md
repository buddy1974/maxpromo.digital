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
| Research Agent | OS work request (Max or lead screen, owner confirmed) | website + language | `claude-sonnet-4-6` via the OS gateway task `lead.research` | public site reader (`fetchSite`) | `lib/agents/research.ts` + `@maxpromo/research` | verified findings, qualification, recommendation | `agent_work`, `agent_runs` | `run agentwork.result` + OS pull | work `cd4c28b2…` completed (45/100, 7 quotes, 27 s); `64e668dc…` failed honestly | REAL |

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
