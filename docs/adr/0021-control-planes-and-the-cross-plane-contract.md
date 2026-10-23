# ADR-0021 — Three control planes, one cross-plane contract

Status: **accepted (owner decisions 2026-10-23); implemented in the repository; production
release pending the owner push.** Extends ADR-0018 (the signed door) and ADR-0001 (one
repository, separate deployments). Evidence: `docs/architecture/control-plane-reconciliation.md`.

## Context

The forensic baseline (2026-10-23) found three systems where the architecture assumed two:

- Maxpromo OS, the only real system of record and governance;
- an Agent Bureau that was a demo, with no runtime and a shadow approval queue;
- OpenClaw Mission Control, the only client of the OS agent door, which had been removed from
  Marcel's machine without a record.

Real Bureau leads never reached the OS. A second, older Bureau was still deployed with its own
credentials. Neither control plane ran in the EU, although the Bureau claimed it did.

## Decision

1. **Business Control Plane = Maxpromo OS.** It owns every business record (leads, clients,
   projects, quotes, invoices, payments, follow-ups, files, Inbox) and the attention model.
   It also owns the **approval record and execution of every business action**: approval is
   bound to the exact payload hash and executed in the same database transaction family as the
   write it authorises. No other plane keeps a lead, client or project table.
2. **Agent Control Plane = Agent Bureau.** It owns agents:
   - the registry, definitions and policies;
   - runs (`agent_runs`), waiting state, failures and cost;
   - agent memory, playbooks, the AI Lab and model governance.

   An agent may observe, reason, recommend, prepare and *request* a business action. It never
   decides one. The Bureau may **project** OS approval state; it may not keep a competing
   business approval record.
3. **Owner Control Plane = Telegram** (later). It is a privileged *client* of the OS, never a
   database. It reads `owner.notices` / `owner.brief` and decides approvals by
   `{approvalId, payloadHash}`.
4. **One cross-plane contract**: the signed door `POST /api/os/agent/v1/*`, defined in
   `packages/config/agent-contract.ts`, which both sides import.
   - **Clients:** each client (`legacy`, `bureau`) has its own secret and allow-list. The OS
     refuses a configuration where two clients share a secret, so an old credential can never
     silently become a new one.
   - **Bureau authority:** `capabilities`, `run` (only the capabilities in `BUREAU_CAPABILITIES`)
     and `events`. It never gets `execute` or `reject`.
   - **Executor binding:** an approval is executed or rejected only by the actor that requested
     it or by the owner in `/os` (`os:marcel`). One interface can never decide another's request.
   - **Concepts:**

     | Concept | How the contract carries it |
     | --- | --- |
     | Agent identity | `bureau:<agent key>` |
     | Request identity and idempotency | `requestId` |
     | Business context | `businessRef` |
     | Action request | an AMBER `run` |
     | Approval state | `approvals.requested` |
     | Agent result, failure or waiting | `events`, stored once per `(client, event_id)` in `os_agent_events` |
     | Audit correlation | `runId`, `approvalId` |
5. **Max Agents** is a defined architecture, not a name.
   - **What an agent is:** a registered identity in the Bureau registry with declared
     capabilities and limits.
   - **Runtime:** the Bureau records each run.
   - **Authority:** it reaches business state only through the contract, under the OS's
     capability allow-list.
   - **Memory:** the agent's own memory stays in the Bureau.
   - **Results and failures:** projected into `/os` attention.
   - **Model routing:** model calls happen where the business capability lives (OS) or in the
     Bureau's AI Lab.
   - **First real agent: Intake** (`bureau:intake`, deterministic). The nine designed agents
     are marked `offline` until they have a runtime.
6. **Owner direct actions** (Marcel clicking in `/os`) need no approval but are held to the
   same guarantees: a content-derived provider idempotency key (once), an `os_audit` row as
   `os:marcel` / `os-web`, documents rendered from the stored record (risk 80 closed), payments
   recorded behind "paid", and no deletion of issued invoices (GoBD).
7. **Channels feed the OS.** The Bureau's public form is a channel. Its submission waits in an
   outbox only until `lead.intake` confirms it, then it is deleted. `os_intake_receipts` makes
   intake idempotent forever.
8. **EU infrastructure.**
   - Both projects' functions run in `fra1` (`vercel.json`).
   - The Bureau database moves to an EU Neon project via `apps/bureau/scripts/migrate-to-eu.mjs`,
     with proof (rehearsed 35/35 tables identical).
   - Public and legal text reads the Bureau database region from one constant
     (`config/infrastructure.ts`), changed in the same release as the database.
9. **Tenancy.** Maxpromo is Bureau tenant 1, linked to the OS by `BUREAU_OS_BUSINESS_ID`.
   Only that tenant sees OS state; the contract makes no assumption that prevents a client
   tenant with its own business system later.

## Rejected

- Merging the applications or databases (ADR-0001 stands; blast radius stays per app).
- Moving business approvals into the Bureau: it would lose the atomic hash-to-write binding or
  create a second write path into commercial state.
- Reusing `OS_AGENT_SECRET` for the Bureau: custody unknown after OpenClaw's removal.
- Fixing the EU claim by deleting the copy only (owner decision: fix the infrastructure).
- Approval prompts on every owner click (a miserable UX); owner actions are audited and
  idempotent instead.

## Consequences

The legacy door is closed in production: no allow-list, and the secret has been removed. The
Bureau's shadow approval route, its Telegram sender and its competing lead store are gone. A
Bureau outage loses no enquiry, and an OS outage loses none either (outbox, retried on
submission, on dashboard view and daily by cron). The `/os` dashboard leads with "what needs
Marcel's attention today", from the same model as the brief and the notices.

Known gaps:
- Attention item text is English-only; it is shared with the brief and notices.
- `jsonb` reorders approval preview fields.
- The Bureau's demo sections remain, clearly labelled as sample data.
