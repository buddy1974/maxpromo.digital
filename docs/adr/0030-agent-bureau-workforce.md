# ADR-0030 — The first governed workforce: delegated work, the Research Agent, one login

Date: 2026-10-26
Status: **Accepted (owner brief "Agent Bureau reality + first workforce activation"); implemented and
production verified 2026-10-26** (commits `a04a31d` … `010fe57`). Extends ADR-0021 (control planes,
signed door), ADR-0027 (gateway, lead research) and ADR-0029 (Universal Max).

## Context

The reality check of 2026-10-25/26 (`docs/architecture/agent-bureau.md` §1) found the Bureau mostly
a foundation: one deterministic agent (Intake) with one run in its history, a production database
whose only tenant is named "Maxpromo Demo Operations" and still carries seeded demo rows (7 fake
proposals, 5 fictional waiting customers, fake "active" agent statuses), an overview that presented
that seed as live work, nine agents that were names without code, mock APIs for contacts, projects
and tasks, an AI Lab that could not run (no model key), and a contract that went only one way
(Bureau → OS). The OS meanwhile had a proven research and qualification engine (ADR-0027 §2).

The brief: make ONE real specialist capability work end to end —
`Marcel → Max/OS → Bureau → real work → governed result → OS → Marcel` — without duplicating the
OS's lead logic, without a second CRM, without autonomy and without architecture theatre.

## Decisions

1. **First capability: Lead Research + Qualification as one work package**, done by the
   **Research Agent** (`bureau:research`). Business value (leads are the current priority), the
   strongest existing foundation, a natural long-running unit (≈30 s), no external communication,
   evidence-backed output. Splitting research from qualification would add orchestration for no
   gain: qualification is deterministic code over the research.
2. **One engine, extracted, not copied.** `fetchSite`, `research` and `qualify` move from
   `apps/web/lib/leads` into `packages/research` (`@maxpromo/research`) with the model step as a
   named task (`RESEARCH_TASK`) and a result contract (`parseFindings`, `recommendNext`). The OS's
   own `lead.research` and the Research Agent call the same functions.
3. **Execution in the Bureau, authority in the OS.** The Bureau fetches the site (SSRF, robots,
   limits), runs the model step, verifies every quote against the cited page and qualifies. The OS
   checks the returned findings' shape and bounds, **re-scores them with the same rules**, and is
   the only writer of the lead (`applyResearchOutcome`). The Bureau keeps a reference to the lead and
   a bounded input snapshot (website, language) — never the lead record.
4. **Model access through the OS gateway, by task name.** The Bureau holds no model key and no
   provider logic. `POST /api/os/agent/v1/model` runs a registered task (`lead.research`) for the one
   agent allowed to run it; the system prompt, schema and limits are the task's; the caller sends
   only user content. One key custodian, one gateway (ADR-0027), no general model proxy.
5. **The work contract — the other direction of ADR-0021.** `POST {bureau}/api/work/v1/request |
   status | cancel`, signed with the shared signing code (client `os`), nonce replay protection,
   the tenant taken from the credential (`BUREAU_OS_BUSINESS_ID`), never from the body. The OS
   chooses the work id; it is the Bureau's idempotency key — a repeated request returns the
   existing item and never runs it twice.
6. **One stored credential, separate keys.** `workDoorSecret()`: `BUREAU_WORK_SECRET` when set,
   otherwise `HMAC(OS_BUREAU_AGENT_SECRET, "maxpromo/work-door/v1")`; the owner handoff uses its own
   label. Both planes already hold the credential, so a second stored secret would add only rotation
   granularity; key separation keeps a signature for one door from verifying at another. (Writing
   new secrets to the Vercel store was refused by the session's permission policy; this design needs
   none.)
7. **Work unit and lifecycle.** OS `os_agent_work` (migration 0027) and Bureau `agent_work`
   (Bureau migration 0003) with `queued → running → completed | failed | cancelled`. No waiting
   state: nothing in research waits on a person. Failures carry a category (`site`, `model`,
   `timeout`, `delivery`, `invalid`, `internal`, `cancelled`), a reason, a detail and `retryable`.
   No automatic retry of the work; a retry is new work with a new id, started by Marcel. Hand-backs
   (idempotent) are retried by the Bureau cron and on dashboard view.
8. **Push and pull.** The Bureau hands the result back through the OS door (`run agentwork.result`,
   GREEN, Research Agent only). The OS also asks the Bureau (`status`) whenever it shows open work,
   so a lost push still arrives and work that died is said to have failed (deadline 10 minutes).
9. **Universal Max delegates through one type.** `AGENT_WORK` replaces `LEAD_RESEARCH`; it maps
   only to `agentwork.request` (GREEN, **owner only** — no agent delegates). The preview names the
   agent, the lead, the source, the goal, the result and "sends nothing". The card follows the work
   to its result. A result that recommends an introduction offers a **separate** `LEAD_OUTREACH_DRAFT`
   proposal; nothing is drafted or sent by the result itself. The lead screen delegates the same way.
10. **Truth in the Bureau.** Removed: the sample sections and their mock data (operating model, audit
    console, waiting room, documents, AI governance, playbooks, client implementation, memory,
    settings), the AI Lab, the mock APIs (contacts, projects, tasks, …), the demo seed scripts and
    the eight placeholder agents. The overview shows the runtime, delegated work, connections and
    failures. Database tables with seed rows are **kept** (forensic; dropping them is a production
    data decision) and no code reads them.
11. **One login, bridged, not merged.** Machine authentication is independent of any browser
    session. For the human: `GET /api/os/bureau/handoff` (OS owner session) issues a one-time,
    60-second ticket in the URL fragment; the Bureau's `os-handoff` provider accepts it once, only
    for the OS owner, and signs in the owner user of the OS-linked tenant. Each application keeps
    its own session.

## Rejected

- A second research engine in the Bureau, or a Bureau that only relays to `lead.research`
  (theatre).
- Copying the production model key into the Bureau project (second custodian, provider logic
  duplicated).
- A general workflow engine, agent memory, playbooks, cost dashboards (nothing in this capability
  needs them).
- Automatic delegation (`LEAD_WORKFLOW` stays off; owner-driven only).
- Sharing the OS cookie with `agents.maxpromo.digital`.

## Consequences

- The Bureau is an **early workforce**: one real specialist agent with governance, plus Intake.
- New agents follow the same pattern: a registered work agent (`WORK_AGENTS`), a registered model
  task if needed, a result contract checked by the OS, and an `AGENT_WORK` agent value.
- Proofs: `prove:agent-work` (44 checks, gate 36), `prove:agent-work-evidence` (57 checks, two
  running applications, both evidence databases, real site reads, model step by a local stand-in).
- Open: risks 164–171 (`docs/governance/known-risks.md`).
