# ADR-0033 — Operational Foundation V2: hardening gate (A1–A5) and the reconciled blueprint

Date: 2026-10-31
Status: **Part A accepted and implemented (owner brief "Operational Foundation V2 — architecture
reconciliation + foundation hardening gate"). Part B — the blueprint
(`docs/architecture/operational-foundation-v2.md`) — PROPOSED, awaiting Marcel.** No Phase 1 programme is
started by this ADR.

## Context

The operational capability assessment (2026-10-31) found defects that become dangerous once Maxpromo gains
stronger execution: gaps in the research reader's address protection, a result hand-back that could never be
redelivered, two research execution paths, a fabricated provider route in agent evidence, and a scheduled
email that the screen promised for a time the OS could not keep. Each was traced in code before repair.

## Decisions

**A1 — The research reader checks the address when it connects.** `packages/research/net.ts`:
`guardedFetch` resolves the host itself, refuses if any address is not public, and connects to the address
it checked (DNS rebinding reaches nothing); every redirect hop is a new checked connection; bodies are read
only up to the cap whatever Content-Length says; GET/HEAD only. `isPrivateAddress` parses IPv6 fully and
judges IPv4 inside IPv6 (mapped in any notation, compatible, NAT64, 6to4), refuses Teredo, documentation,
fe80::/10, fec0::/10, fc00::/7, multicast, and the remaining non-public IPv4 ranges (192.0.0/24, TEST-NETs,
198.18/15); anything unparseable is refused. `fetchSite` uses it by default (also for the HTTPS probe).
Mediza's HTTP-only frameset reads exactly as before (7 pages, 4 frames, 4,161 characters, windows-1252).

**A2 — A stored answer is final only when it is an answer.** The engine's request-level idempotency
replayed a stored retry-safe failure, or a dead "running" attempt, to every retry with the same request id —
so a Bureau result (`bureau-work-result-<id>`) or intake (`bureau-intake-<id>`) that failed once could never be
delivered. Now a retry takes over such a request once (one conditional UPDATE; stale = 15 minutes, beyond
every route's limit); successes, refusals and uncertain outcomes are replayed unchanged; a GREEN failure after
`ctx.committed()` is not retry-safe. On the OS side: a completed result writes the lead only while that work
still holds the lead's research claim (taken once with a conditional UPDATE), so a late result never
overwrites newer research; a crash between finishing the item and writing the lead is repaired by the next
arrival of the same terminal report, once.

**A3 — Research has one execution path: the Research Agent.** The in-process `lead.research` capability (on
the lead route's allow-list, used by no screen and not by Max, outside the owner-only delegation rule, leaving
no work record) and `researchLead` are retired. Workflow rule 1 (`LEAD_WORKFLOW=1`, off) now starts research
through `requestResearch` — the door the lead screen and Max use.

**A4 — Evidence names the route that actually answered.** The OS model door returns the gateway's route; the
Bureau takes it (validated) instead of writing `"anthropic"`; the findings carry `route`; `WorkView.runtime`
and `os_agent_work.runtime` keep it. When no route is reported none is recorded.

**A5 — The screen says when a scheduled email really goes.** `/api/cron/mail-schedule` exists and is on no
schedule (register: `docs/deployment/scheduled-work.md`; risk 120). The Inbox and composer now say a
scheduled email goes at the next run after its time — at once while the OS is open, otherwise at the daily
morning run — instead of implying the exact minute. Scheduling the frequent cron is an owner decision.

**Part B.** The reconciled blueprint is `docs/architecture/operational-foundation-v2.md` (PROPOSED).

## Evidence

- `prove:lead-research` 79 (was 70): address rules in every notation, a real local socket refused at connect
  time (rebinding), IP literals and non-reads refused, gzip, an endless body capped, redirect to `[::1]`.
- `prove:agent-result-delivery-evidence` 13 (new, evidence database): the production failure states put into
  `os_agent_results` and driven through the real engine — fails on the code before this ADR at check 1.
- `prove:agent-work` 60 (was 53): one research path; route reported, carried, validated.
- `prove:lead-workflow-evidence` 44, `prove:research-calibration-evidence` 23, `prove:max` 46.
- `npm run verify`: 36 gates green (web JS 1,499 of 1,500 KB).

## Consequences

Risks 180–194 (`docs/governance/known-risks.md`). The Agent Bureau and the OS must both be deployed for A4's
route to appear (either order is safe: absent route ⇒ none recorded).
