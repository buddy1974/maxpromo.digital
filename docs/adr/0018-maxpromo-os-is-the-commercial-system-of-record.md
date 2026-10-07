# ADR-0018 — Maxpromo OS is the commercial system of record; the phone reaches it by a signed contract

**Status:** proposed · 2026-10-07 · built on `feature/mobile-business-os` (this repository) and
`feature/mobile-business-os` (openclaw-business-os). **Awaiting Marcel's decision.** Nothing is
merged to `main`, migrated in production or deployed.
**Related:** ADR-0001 (one repository, separate deployments), ADR-0010 (nothing fails silently),
ADR-0015 (a gate protects a class), the OpenClaw boundary ADR
(`ADR-OPENCLAW-PLATFORM-BUSINESS-OS-BOUNDARY-v1.0`), and the architecture reference
`docs/architecture/mobile-business-os.md`.

---

## Context

Marcel wants to run Maxpromo from his phone: see a business in the street, check it, save it, write
to it, send an Angebot, record the acceptance, invoice the deposit, see who owes money — and have
the business truth end up where the business keeps it, not in a chat.

Two systems already existed, and each had half:

- **Maxpromo OS** (`/os` in `apps/web`, Neon eu-central-1) held the commercial records — clients,
  leads, Angebote, Rechnungen, the jobs board — and everything a document needs to be legally
  right: the per-year numbering allocators, the §19 UStG identity, the bank and MoMo blocks, the
  line-item provenance guard, the email builders. It could only be driven by a browser holding
  Marcel's session cookie.
- **OpenClaw Mission Control** had just gained *Mobile Command* (2026-10-07, unmerged): Telegram as
  a governed client — numeric-id identity, a capability census, deterministic routing,
  single-use confirmation tokens, redaction, audit. It also had its own CRM (empty in
  production: 0 contacts, 0 opportunities) and declared Angebote and Rechnungen **BLOCKED**:
  "no authoritative numbering, VAT or bank source".

The source the census said was missing existed, one system over. Building it a second time in
OpenClaw would have created exactly what `standards.md` calls the most expensive failure on this
platform: two implementations — two numbering series, two CRMs, two copies of the legal identity.

## Decision

1. **Maxpromo OS owns commercial state.** Leads and the pipeline, interactions, follow-ups,
   Angebote, Rechnungen, payments, recurring services, projects, client files (metadata), client
   incidents, the approval record for consequential commercial actions, and the commercial audit.
   Migration `0011-commercial-core.sql` adds what was missing, additively, to the existing database.
2. **OpenClaw owns the conversation and the machinery.** Telegram transport (Gateway), actor
   binding, intent routing, conversational context (*references* to OS records, never copies), the
   Confirm/Cancel token, background work (research, investigation, tests), platform health and its
   own event log. Its CRM is no longer used for commercial records; the Mobile Command entries that
   wrote to it are marked superseded and routed to the OS.
3. **One signed door.** `POST /api/os/agent/v1/{capabilities|run|execute|reject}` on the web
   deployment. HMAC-SHA256 over timestamp, nonce, method, path and the exact body; a ±300 s
   window; single-use nonces; an optional allow-list of actors (`OS_AGENT_ALLOWED_ACTORS`); fails
   closed without a 32-character `OS_AGENT_SECRET`. The session cookie does not open it and it does
   not open anything else. Middleware exempts exactly `/api/os/agent/` from the cookie check and
   sets no staff identity there.
4. **One capability registry** (`lib/commercial/registry.ts`, 42 capabilities). Each declares an
   intent family, a risk, an input schema and its executor. **GREEN** runs. **AMBER** (anything
   that leaves the building, changes money, or records an acceptance) is *prepared*: the OS fixes
   the exact payload, hashes it, stores an approval, and executes it once, by that hash, before it
   expires. Mission Control's Confirm is bound to the approval id and hash; its Cancel rejects the
   approval. Preparing a changed payload supersedes the older approval. **RED** is never offered.
5. **One implementation of each rule.** The number allocators and the document emails moved out of
   the route files into `lib/documents/allocate.ts` and `lib/documents/emails.ts`; the screens and
   the service call the same functions. Owed money is defined once (`lib/commercial/money.ts`) and
   the dashboard and invoice list now use it.

## Consequences

**Good.** No second CRM, numbering series or identity. The phone can do the whole commercial loop
and every record lands in the OS, visible on its screens, covered by its backups. A Telegram outage
loses no business data. Consequential actions are bound twice — MC's token and the OS approval —
and a retried request, a double tap or a replayed approval does nothing twice (proved:
`prove:commercial-agent` 80/80, `prove:mobile-live` against the evidence runtime).

**Cost.** A second authentication mechanism on the web deployment (the fourth in `platform.md` §4),
with a secret to provision and rotate. The OS gains tables it must now migrate and back up.
Mission Control depends on the OS being reachable for business answers; when it is not, those
capabilities say so (NEEDS_SETUP / "not connected"), and OpenClaw's own answers keep working.

**Not decided here.** Production migration and deployment (Marcel), the Telegram binding go-live
(Gateway plugin install, tool policy AF-33), durable storage for file bytes (today the OpenClaw
attachment store on one machine — known risk 75), and any multi-user roles beyond the owner.

## Verification

`npm run verify` (now includes `prove:commercial-boundary`, 40 properties, each source rule shown
failing first); `prove:extraction-integrity` now discovers line-item writers in `lib/`;
`prove:commercial-agent` 80/80 against the evidence runtime with the lab restored;
`prove:mobile-live` — Mission Control's real service through the whole loop over the signed API.
Mission Control: 3,817/3,819 tests (the two failures pre-exist on the base branch), lint and
static-lint clean.
