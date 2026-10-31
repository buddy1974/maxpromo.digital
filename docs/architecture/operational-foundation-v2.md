# Operational Foundation V2 — blueprint

Status: **PROPOSED (2026-10-31), not started.** Awaiting Marcel's approval. Builds on ADR-0018 (OS is the
system of record), ADR-0029 (Universal Max), ADR-0030 (Agent Bureau), ADR-0033 (the hardening that this
blueprint starts from). Nothing here is implemented until a mission names a programme and a slice.

Labels: **[O]** observed in code or production · **[I]** inference · **[R]** recommendation · **[U]** unknown.

The aim: Maxpromo OS carries an objective of Marcel's through plan → approval → execution → monitoring →
recovery → verification → a truthful result (COMPLETED, PARTIALLY COMPLETED, BLOCKED, FAILED, CANCELLED),
using the governance it already has. It never reports completion because an artifact exists, a provider
answered 200, an agent said done, an automation started or a mutation returned without error.

---

## 1. Target architecture

```
                     Marcel (owner session; passkey second factor before Phase 2 writes)
                                          │
                                   Universal Max  ── reads census('max'): what Maxpromo can actually do
                                          │
             ┌──────────── OBJECTIVE (os_objectives) ── expected outcome, plan, result ───────────┐
             │                            │                                                    │
             │                 PLAN = ordered steps, each a proposal or delegated work            │
             │                            │                                                    │
             │      approval per step by its capability's risk (os_approvals, unchanged)          │
             │                            │                                                    │
             │   ENGINE runCapability / executeApproval (unchanged core, + ops metadata)          │
             │      │                    │                         │                             │
             │   native code        ADAPTER (provider, protocol hidden)   DURABLE WORK (Postgres) │
             │   (OS records)        REST · MCP · n8n · local · SDK      leases, steps, retries   │
             │      │                    │                         │                             │
             │      └──────── VERIFY: re-read canonical / external state ─────────┘              │
             │                            │                                                    │
             └──── RESULT: objective status from verified steps ── os_audit (+ verification) ────┘

  Shared packages:  @maxpromo/ai (gateway V2: routes by data class, records usage/cost)
                    @maxpromo/web (web intelligence: acquire · discover · resolve · evidence)
                    @maxpromo/research (Research Agent: interpretation, opportunity, qualification)
  Services:         Agent Bureau (agent execution), render worker (Playwright, EU container)
  Later:            GitHub/Vercel adapters, n8n named workflows, local worker, document intelligence
```

## 2. What stays canonical (do not rebuild)

| System | Stays the canonical… |
|---|---|
| `lib/commercial/engine.ts` + `CapabilityDefinition` | way anything is done; request idempotency (`os_agent_results`, A2 semantics) |
| `os_approvals` | approval: hash-bound, single use, expiring, deduplicated |
| `os_audit` | audit trail (gains a `verification` column; no second audit system) |
| Universal Max (`lib/max/*`) | owner front door, trust model (only Marcel's words instruct; ids from the OS) |
| `os_max_interactions` / `os_max_proposals` | what Marcel said and decided |
| Agent Bureau work door + HMAC/nonce contract | agent execution boundary |
| `@maxpromo/research` grounding (verbatim quotes, F/I/O/U separation, code scoring) | research truth rules |
| `fetchSite` native reader (after A1) | first and cheapest acquisition rung |
| Neon Postgres (OS eu-central-1) | system of record, job store |
| Hostinger Mail | email transport |

---

## 3. Programme 1 — Capability registry + objective / verification model

### 3.1 Registry: the smallest extension

`CapabilityDefinition` gains one optional block, `ops`, holding only fields that drive a runtime decision:

```ts
ops?: {
  effect: 'read' | 'propose' | 'write' | 'external' | 'financial' | 'infrastructure' | 'destructive'
  data: 'public' | 'internal' | 'client_confidential' | 'personal_sensitive'   // highest class it touches
  surfaces: ('max' | 'screen' | 'bureau' | 'machine')[]                      // replaces the per-route Sets
  verify?: (ctx, input, result) => Promise<Verification>                      // §3.3
  available?: (env) => { ok: boolean; reason?: string }                       // provider configured, not kill-switched
  timeoutMs?: number                                                          // only where the runtime enforces it
  retry?: 'never' | 'safe'                                                    // default by effect: read/propose/write safe, the rest never
  cost?: 'free' | 'metered'                                                   // metered ⇒ budget gate (§9)
}
```

| Field | Decision it drives | Rejected alternative |
|---|---|---|
| `effect` | approval floor (external/financial/infrastructure/destructive ⇒ at least AMBER, checked at load), Max offering, whether `verify` is required | free-text purpose (the description exists) |
| `data` | model route (§5), storage, which services may run it | per-call labels only |
| `surfaces` | who may reach it — Max, owner screens, Bureau agents, machine clients | the ≈11 Sets today (route Sets, `MAX_CAPABILITIES`, `BUREAU_CAPABILITIES`, …) |
| `verify` | objective result | trusting the executor's return |
| `available` | Max does not offer what cannot run; census shows why | a static provider string |
| `timeoutMs`, `retry` | durable runtime only | on every capability |
| `cost` | budget check before run | price tables per capability (prices belong to providers, §9) |

Not added: output schemas (results stay `CapabilityResult`), purpose, provider name (the adapter reports
the provider at run time, §7).

Rules: a verify gate fails the build when a capability lacks `ops` once Programme 1 lands; `census()`
exposes `ops` minus functions; the route Sets are deleted and routes call `allowedOn(surface, id)`.

### 3.2 Objective, plan, action, verification, result

| Term | Exact meaning | Where it lives |
|---|---|---|
| **ACTION** | One bounded execution of one registered capability with one validated input under one request id. | engine; `os_agent_results`; `os_audit` |
| **OBJECTIVE** | The outcome Marcel asked for, in his words, with the expected end state the OS can check ("lead X has research with a resolved identity; nothing sent"). | `os_objectives` (new): `id, interaction_id, actor, statement, expected jsonb, status, result jsonb, created_at, closed_at` |
| **PLAN** | Optional ordered steps for an objective; each step names a capability (a Max proposal) or delegated work, its expectation, and what it depends on. Shown to Marcel before anything runs. | `os_objective_steps` (new): `objective_id, seq, kind proposal|work, ref, capability, expected jsonb, depends_on int[], status, verification jsonb` |
| **VERIFICATION** | Evidence from a read of canonical or external state after the action, compared with what was expected: `verified | mismatch | unverifiable | pending`, with the checks made. | step + `os_audit.verification` |
| **RESULT** | The objective's status, computed — never typed by a model. | `os_objectives.status/result` |

Result rule:

| Status | When |
|---|---|
| COMPLETED | every required step `verified` |
| PARTIALLY COMPLETED | at least one required step verified and at least one failed/mismatched/skipped, nothing waiting |
| BLOCKED | a step waits on Marcel (approval, identity confirmation) or on an external state (`pending`) |
| FAILED | no required step verified and at least one failed |
| CANCELLED | Marcel rejected or cancelled the remaining steps |

Fit with what exists: a Max interaction with one or more action proposals opens one objective; proposals
and agent work get `objective_id`. A single GREEN proposal is a one-step plan (no extra screen). Plan approval
shows what will be read and proposed; it never pre-approves an AMBER step. Max proposes plans only from
`census('max')` filtered by `available`; the server re-validates every step against the registry — the model
cannot name a capability that does not exist (today's enum rule, generalised).

### 3.3 Verification contract

```ts
type Verification = { state: 'verified' | 'mismatch' | 'unverifiable' | 'pending'; checks: { what: string; expected: unknown; actual: unknown }[]; at: string }
```

Run by the engine after a GREEN `run` and after an AMBER `execute`, bounded (2 s, no retries); a throw is
`unverifiable`. Examples: `client.update` re-reads the row; `payment.record` re-reads ledger and open balance;
`email.deliver` → `pending` until the Sent copy is found (the lookup exists), `uncertain` stays uncertain;
agent work → `pending` until terminal, then findings parse + coverage; GitHub issue → GET by id; n8n →
execution status **and** the records the workflow should have created.

---

## 4. Programme 2 — Durable execution runtime

PostgreSQL only. No Kafka, Temporal, Kubernetes or Redis queues — volumes are tens of jobs a day [I].

### 4.1 Tables

- **Bureau `agent_work`** (execution ledger) gains: `lease_owner, lease_until, max_attempts, next_attempt_at,
  deadline_at, cancel_requested, budget jsonb, spent jsonb`.
- **Bureau `agent_work_steps`** (new): `work_id, seq, kind (acquire|render|search|resolve|model|verify|deliver),
  status, attempt, started_at, finished_at, provider, route, model, usage jsonb, cost_cents, output jsonb
  (bounded), error_class, retry_after`. Primary key `(work_id, seq)` = step idempotency.
- **OS `os_agent_work`** stays the OS's view; gains `progress jsonb` (steps done / total, last step) from pulls.

Research work stays on the Bureau (public data; risk 111 move to EU first for anything else). OS-side long
jobs (document processing) use the same shape in the OS database when Phase 2 needs them.

### 4.2 States

`queued → running → (waiting) → completed | partial | blocked | failed | cancelled`.
Retrying is `queued` with `attempt > 0` and `next_attempt_at` (the screen says "retrying at …"); planning and
verifying are step kinds, not states. Fewer states, same information.

### 4.3 Mechanics

| Property | Design |
|---|---|
| Claim / lease | `UPDATE … SET state='running', lease_owner=$w, lease_until=now()+2min WHERE id = (SELECT id … WHERE state='queued' AND next_attempt_at<=now() ORDER BY … FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *` |
| Heartbeat | each step start/finish extends the lease |
| Crash recovery | expired lease ⇒ `queued`, attempt+1, resume at the first unfinished step; after `max_attempts` ⇒ `failed` with the last error class |
| Retries | per step, `retry: 'safe'` only; exponential backoff with jitter (base 5 s, ×4, cap 10 min); honour `Retry-After` |
| Rate limits | `RATE_LIMIT` ⇒ `next_attempt_at` from `Retry-After` or backoff; never a tight loop |
| Timeout | per-step deadline (AbortSignal) + job `deadline_at` |
| Cancellation | `cancel_requested` checked between steps; the running step's AbortController aborted; OS gets a cancel action on screen |
| Partial results | completed steps' outputs kept; budget exceeded or optional step failed ⇒ `partial` with reason |
| Progress | steps listed on the Bureau work page and in the OS pull |
| Hand-back | push + pull as today (A2-correct); OS sweeper (every 5 min) reconciles open work instead of only on view |
| Verification | the last step of every job; its result is the job's evidence |
| Audit | step log (Bureau) + `agentwork.result` audit (OS) |

### 4.4 Driver

Fast path stays `after()`. The durable driver is a signed `tick` on the Bureau that claims and runs steps
within `maxDuration`, triggered by (a) a per-minute Vercel cron if the plan allows it [U, owner], otherwise
(b) the EU worker host (needed anyway for rendering) calling `tick` every 30 s. Browser steps run on the
worker host itself.

---

## 5. Programme 3 — Model Gateway V2

Builds on `@maxpromo/ai` (one package, still never executes anything).

| Concern | Design |
|---|---|
| Providers | Anthropic direct (default), OpenAI direct (fallback, transcription), OpenRouter (opt-in per data class), Ollama (local, Phase 2 local worker only). Agents never call providers. |
| Tiers | real tiers per route (fast/standard/deep → Haiku/Sonnet/Opus-class on Anthropic); today all three are one model [O] |
| Routing | 1) `data` class ⇒ allowed routes; 2) task tier and modality (PDF/image) ⇒ capable models; 3) availability (configured, not failing) ⇒ order; 4) cost only between equals |
| Timeouts | default per tier (fast 20 s, standard 60 s, deep 120 s); none unbounded |
| Retries / fallback | one retry on 429/5xx with jitter; then the next allowed route if any; the chain is recorded |
| Evidence per call | route, model, latency, input/output tokens, cost (from a dated price table in `@maxpromo/config`), attempts and fallback chain, failure class. No prompts, no content, no reasoning. |
| Where | job step when inside a job; otherwise one row in `os_model_calls` (metering, not audit: `at, task, data_class, route, model, ms, tokens_in, tokens_out, cost_cents, outcome`) |
| Schema | the gateway validates JSON against the request schema before returning |
| Bypass | the chat widget's direct SDK call (`lib/chat/claude.ts`) moves onto the gateway before the widget is ever enabled |

Data classes and routes:

| Class | Examples | Allowed |
|---|---|---|
| `public` | prospect websites, search results | Anthropic, OpenAI, OpenRouter (ZDR, data_collection deny, EU), Ollama |
| `internal` | quotes, invoices, pipeline, internal notes | Anthropic, OpenAI; OpenRouter only if Marcel enables it for this class |
| `client_confidential` | client mail, client documents, project data | Anthropic, OpenAI (business terms / DPA); never OpenRouter |
| `personal_sensitive` | employee contracts, IDs, salary, health (Esosa staff files) | local preprocessing (classification, redaction) first; a cloud model only under Marcel's written policy and a DPA; never OpenRouter; never the Bureau (US database, risk 111) |

Nothing is enabled by this blueprint. Provider data-residency and retention terms are [U] until checked
against current contracts when Programme 3 starts.

---

## 6. Programme 4 — Web Intelligence V2 + Research Agent V2

### 6.1 Separation

```
ENTITY / BUSINESS → DISCOVERY → ACQUISITION → EXTRACTION → EVIDENCE → CORROBORATION │ INTERPRETATION → QUALIFICATION
└──────────────── @maxpromo/web (reusable Web Intelligence) ────────────────────────┘ └── @maxpromo/research (Research Agent) ──┘
```

Web Intelligence answers "what do public sources say about this entity, with provenance". The Research
Agent answers "what does that mean for Maxpromo's offer to this business". Client onboarding, Client 360 and
document matching consume the first without the second.

### 6.2 Acquisition ladder (escalate only on a named trigger)

| Rung | Engine | Runs when | Cost | Never |
|---|---|---|---|---|
| 0 Native | `fetchSite` (A1-guarded) + sitemap | always first | free | bypass robots |
| 1 Render | self-hosted Playwright service (§6.3) | rung 0 says `js_shell` | worker compute | run on `placeholder`, `parked`, `challenge` |
| 2 Managed | Firecrawl scrape (§6.4) | rung 1 unavailable or failed on a `js_shell`; budget left | credits | defeat an explicit bot challenge |
| 3 Discovery | search + place APIs (§6.5) | `placeholder`, `parked`, `unreachable`, `identity_mismatch`, off-domain contact, thin site, or confidence below high | per query | invent an identity |

Rung 0 gains a **site-state classifier**: `ok | thin | js_shell | placeholder | parked | challenge |
unreachable | robots`. Today M-Lau's hosting placeholder is reported as "may need JavaScript" [O]; the
classifier makes it `placeholder` and routes it to discovery, never to rendering.

Default policy: a site that challenges automated readers (403/429 with a challenge page) is recorded as
"declines automated reading" and not escalated to stealth tooling [R; owner may change].

### 6.3 Self-controlled rendering: Scrapling vs Playwright

Limitations: neither was installed or run (mission rule); this is a documentation and architecture
comparison. Sources: the Scrapling repository README (BSD-3-Clause, Python ≥ 3.10) and Playwright's own
documentation; Maxpromo code as observed.

| Criterion | Scrapling | Plain Playwright service (Node) |
|---|---|---|
| Static acquisition | `Fetcher` with browser TLS impersonation, HTTP/3 | not needed — rung 0 already does it, with A1 guards |
| JavaScript rendering | `DynamicFetcher` (Playwright Chromium) / `StealthyFetcher` | Chromium via Playwright directly |
| Crawling / discovery | Scrapy-like spiders, robots, throttle, pause/resume | none built in — our crawler logic stays in TS (rung 0 rules reused on the rendered DOM) |
| Sessions | yes | browser contexts (one fresh context per job) |
| Network/API capture | via browser | `page.on('response')`, `route()` interception |
| Extraction / Markdown | `page.markdown()`, adaptive selectors | `page.content()` → our `htmlText`/`anchors` — **the same normalisation the quote verifier uses** |
| Anti-bot | Cloudflare Turnstile handling, stealth — a feature Maxpromo's policy does not use on prospects | none (by design) |
| Language | Python — second runtime, second extractor | TypeScript — the platform's one language |
| Container | published images with browsers | official Playwright images |
| SSRF / egress | must be re-implemented in Python or at the network | request interception calls the same `isPrivateAddress`; plus container egress deny of private ranges |
| Observability | separate logging stack | `@maxpromo/observability` logger |
| Maintenance | fast-moving project; stealth features break as sites change | stable, vendor-maintained |

Recommendation **[R]: Playwright (Node) render service.** Scrapling's distinctive value — stealth/anti-bot,
adaptive selectors for repeatedly scraped structured sites, a Python spider framework — is either outside
policy or not Maxpromo's problem (many small sites, read once, with verbatim-quote evidence). Adding it would
create a second extractor in a second language, which breaks "never two implementations" and puts quote
verification at risk of drift. Revisit only if Maxpromo starts monitoring structured third-party sources
repeatedly, where adaptive selectors pay off.

Service shape: `render.page(url, {budgetMs})` → `{status, finalUrl, html, text, links, consoleErrors,
blockedRequests}`; HMAC door; one fresh context per job, no persistent cookies; route interception refuses
private targets, non-HTML heavy assets, and anything outside the job's registrable domain unless allow-listed
(CDNs for rendering); 20 s per page, 5 pages per job; EU host; container egress firewall denies RFC 1918,
link-local, metadata endpoints.

### 6.4 Firecrawl

Role **[R]: managed fallback (rung 2) and secondary search provider; not primary, not sole.**

| Item | Recommendation |
|---|---|
| Usage | `scrape` (1 credit/page) for `js_shell` sites the render worker could not read; `map` only when no sitemap and rung 0 found < 3 links; `search` as the fallback search provider (2 credits / 10 results). JSON extraction mode not used — extraction stays ours. |
| Volume / cost | ≈ 100 prospects/month × ≤ 10 pages fallback share ⇒ well under the Hobby plan (USD 19/month, 5,000 credits; listed 2026-10-31) |
| Rate limits | Hobby: 5 concurrent, 100 scrape/min — our budget (≤ 1 render fallback per site) stays far below; 429 ⇒ step retry with backoff |
| Privacy | URLs and public pages of prospects leave Maxpromo (public data, `public` class only); never client or personal data; zero retention is Enterprise-only per the pricing page |
| Fallback | Firecrawl down ⇒ the job ends `partial` with coverage saying what was not read — never a false completion |

### 6.5 Search

Requirements: web results with URLs and snippets for German local businesses; a **place/business** lookup
(name, address, phone, website); EU-usable terms; short or no query retention; ≤ ≈ USD 5–10 per 1,000
queries; structured JSON; documented rate limits; no scraping of a search engine's HTML.

Candidate **[R]: Brave Search API (web + place search) as primary; Firecrawl search as fallback.** One
vendor covers both web discovery and place identity at ≈ USD 5 per 1,000 queries (third-party listings,
2026; to confirm on Brave's own page), with its own index. Alternatives: Tavily (LLM-oriented, ≈ USD 0.008
per credit), Google Places API (strong identity data, more expensive, Google terms). Exposed as provider-
independent capabilities `search.web` and `search.place`; the choice is Marcel's (credentials, contract).

### 6.6 Entity resolution

Inputs: lead/client record (company, city, website, email, phone), rung-0 signals (Impressum legal name,
address, phone, register number, email domain, named people), search and place results.

| Identifier | Strength |
|---|---|
| Register number (HRB/HRA + court), exact postal address + legal name, normalised phone (E.164) | strong |
| Email domain = website domain, name fold + city, managing director named on both | medium |
| Name only, category only | weak |

| Status | Rule |
|---|---|
| CONFIRMED | Marcel confirmed it, or ≥ 2 strong identifiers from independent sources agree and none conflicts |
| LIKELY | 1 strong + ≥ 1 medium, no conflict |
| AMBIGUOUS | ≥ 2 candidates within reach, or a strong identifier conflicts |
| NOT ESTABLISHED | nothing above weak |

Boundary: only CONFIRMED identities change what research reads (e.g. an alternate official domain); LIKELY
and AMBIGUOUS are shown with their evidence and need Marcel's confirmation (`lead.identity.confirm`, GREEN,
owner only); nothing ever merges or rewrites a record automatically. CRM duplicate matching stays
`findExisting` / `lib/clients/match.ts`; entity resolution is about the outside world and is stored on the
lead as `identity` (candidates + evidence), not in a new identity table.

### 6.7 Evidence engine

```
SOURCE   {id, url, kind own_site|search|place|directory|registry, method native|render|managed|search, fetched_at, content_hash, status}
CAPTURE  {source_id, text (normalised), hash}             — what the quote verifier checks against
CLAIM    {id, kind fact|inference|hypothesis|unknown|conflict, topic, statement,
          quotes [{source_id, quote}], derived_from [claim ids], sources: n independent}
```

Rules (kept from ADR-0031, made explicit):

- A fact needs a verbatim quote on a captured source; an inference/hypothesis needs fact ids; an unknown is a
  question; a **conflict** is two facts about one attribute with different values (phone, address, name).
- Corroboration counts independent sources (distinct registrable domains or source kinds).
- **Research confidence** (coverage, corroboration, conflicts) is separate from **commercial opportunity**
  (the score); neither moves the other.
- Absence is negative evidence only where the page that would show it was read.
- A sparse site is `thin`, not a technical failure; a technical failure (`unreachable`, `challenge`) is never
  a commercial disqualification — the verdict is `review` or the result `blocked`.

### 6.8 Research Agent V2

Inside the Research Agent: the research objective for Maxpromo's offer, which questions matter, the
interpretation prompt, opportunity analysis, qualification scoring, recommendation, calibration (ADR-0032).
In Web Intelligence: the ladder, site-state classifier, sitemap/discovery, search, entity resolution, source
capture, claim provenance, corroboration and conflict mechanics. Scoring changes only after Marcel's judged
calibration batch.

Permanent regression cases (fixtures, never hard-coded prospects; nobody is contacted):

| Case | Primary problem | Must hold |
|---|---|---|
| Mediza (2009 frameset, windows-1252, HTTP only) | ACQUISITION | 4 frames + contact/appointments/services read, grounded facts, qualified, unchanged by V2 |
| M-Lau (static hosting placeholder) | DISCOVERY / ENTITY | classified `placeholder`; no render call; search + place discovery; candidates with evidence; ambiguous ⇒ Marcel confirms; no invented identity |

---

## 7. Programme 5 — Execution adapter foundation

Capabilities stay what Max sees (`repo.issue.create`, `automation.client_onboarding.run`); an adapter is how
one is implemented. The smallest interface:

```ts
interface Adapter<I, O> {
  provider: string                                   // 'github' | 'vercel' | 'n8n' | 'firecrawl' | 'render' | 'local-worker'
  protocol: 'native' | 'rest' | 'mcp' | 'n8n' | 'local'
  available(env: Env): { ok: boolean; reason?: string }
  invoke(ctx: AdapterContext, input: I): Promise<AdapterResult<O>>
  read?(ctx: AdapterContext, ref: string): Promise<AdapterResult<unknown>>     // for verification
}
interface AdapterContext { requestId: string; idempotencyKey: string; signal: AbortSignal; deadlineMs: number; dataClass: DataClass }
type AdapterResult<O> =
  | { ok: true; output: O; ref?: string; usage?: { units: number; unit: string; costCents?: number }; latencyMs: number }
  | { ok: false; class: 'unavailable' | 'auth' | 'rate_limit' | 'timeout' | 'rejected' | 'uncertain' | 'provider'; retryAfterMs?: number; detail: string }
```

- `uncertain` maps to the engine's `UncertainOutcome` (never retried, never reported done).
- An MCP-backed adapter pins tool name, argument mapping and a hash of the tool's schema; a changed schema
  makes the capability `unavailable`, never silently different. MCP tool descriptions are untrusted data.
- An n8n adapter pins a workflow id and version; `ref` = execution id; `read` = execution status.
- Credentials live with the adapter (Vercel env), read-only scopes first; the model never sees them.
- Each adapter call is a job step or an action; its provider, usage and latency become evidence.

---

## 8. Security model

| Area | Today [O] | Foundation V2 [R] |
|---|---|---|
| Owner identity | one shared password, 7-day HMAC cookie, `sub` = marcel, no revocation | passkey (WebAuthn) second factor, TOTP fallback; server-side session table with revocation; step-up for `financial`, `infrastructure`, `destructive`, `personal_sensitive` |
| Machine identity | HMAC + single-use nonce, actor allow-lists, tenant from env | unchanged; per-adapter credentials; local-worker device keys (revocable) |
| Tenant isolation | `owner_id` columns, no row filter | unchanged for Maxpromo; client systems (Esosa) reuse contracts, never data |
| Data classification | none | four classes on capabilities and job inputs; gateway and storage enforce |
| Network egress | native reader A1-guarded; outbound host list for providers | render worker: interception + container egress deny; adapters call fixed hosts |
| SSRF | A1 (connect-time check) | same guard reused by render interception |
| Browser sandbox | none | fresh context per job, no persistent profile, no downloads, EU container |
| Local worker | none | outbound only, allow-listed folders, no shell capability (§10) |
| MCP / n8n trust | none | pinned tools/workflows, outputs are data, verify by records |
| External communication / financial / destructive | AMBER with own screens | unchanged; effect floor enforced at registry load |
| Infrastructure | none | read-only first; writes AMBER + step-up, Phase 2 earliest |
| Sensitive documents | none | `personal_sensitive`: local preprocessing, no OpenRouter, no Bureau, retention rule |
| Audit / verification | `os_audit` | + verification column, step log, model metering |

MFA (Part F): the threat is credential theft or reuse of one shared password giving full OS control for 7
days with no way to revoke. It is not an immediate exposure today (no infrastructure or engineering writes
exist) [I], so it is not emergency work. It should be a **prerequisite before** any `infrastructure` capability,
any GitHub write, and any `personal_sensitive` processing (Phase 2) — Marcel's decision gate.

## 9. Cost observability

- A dated provider price table in `@maxpromo/config` (model per million tokens, search per 1,000, Firecrawl per
  credit, render per minute, transcription per minute).
- Every model call, search query, managed scrape and render step records units and computed cost (job step or
  `os_model_calls`).
- Capabilities with `cost: 'metered'` check the job budget before running; a job's `budget` (e.g. research:
  ≤ EUR 0.50, ≤ 10 queries, ≤ 20 pages, ≤ 1 render fallback per site) ends it `partial` with the reason.
- One OS page: cost by capability and provider per month. No billing system.

## 10. Client bundle (risk 177)

The foundation is server-side: registry, census, objectives, runtime, gateway, adapters and verification add
no client code. New UI is small (objective status, plan card, progress, identity confirmation). At 1,498 of
1,500 KB even that crosses the budget. **[R]:** Programme 1 slice 0 reclaims headroom by fixing the measured
cause (shared copy modules duplicated into each lead page chunk), then keeps new UI in server components and
lazy islands. The 1,500 KB budget stays realistic only with that slice; raising it is Marcel's decision.

---

## 11. Phase 1 — final order

| # | Programme | Depends on | Slices (each shippable, each behind a switch) | Acceptance gate | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Capability registry + objective/verification | A1–A5 (done) | 0 bundle headroom · 1 `ops` on all capabilities + effect floor + surfaces (route Sets removed) · 2 census-generated Max offering · 3 `verify` on CRM/money/mail capabilities + `os_audit.verification` · 4 `os_objectives`/steps + result rule | scenario 8; every capability declares `ops`; Max offers only registered, available capabilities; all proofs green | `CAPABILITY_VERIFY=off`, additive migration; surfaces fall back to the old Sets in slice 1 |
| 2 | Durable runtime | 1 (timeouts, retry) | 1 lease/step columns + step log · 2 tick driver (cron or worker host) · 3 retries/backoff/rate limits · 4 abortable cancel · 5 OS sweeper + progress | scenarios 6, 7 | `WORK_RUNTIME=legacy` keeps `after()` single-shot |
| 3 | Model Gateway V2 | 1 (`data`) | 1 usage + cost + route evidence · 2 default timeouts + one retry · 3 data-class route policy · 4 real tiers · 5 chat-widget bypass removed | scenario 9; every call metered | per-feature env switches; policy defaults to today's single route |
| 4 | Web Intelligence + Research V2 | 2, 3; owner provider choice | 1 site-state classifier + sitemap · 2 evidence engine (sources/claims) · 3 render worker · 4 search + entity resolution + confirmation · 5 Firecrawl fallback | scenarios 1–5 incl. Mediza/M-Lau | `RESEARCH_ACQUIRE=native`; provider kill switches |
| 5 | Execution adapter foundation | 1, 2 | 1 adapter interface + native/rest base · 2 Firecrawl/search/render as the first adapters (from 4) · 3 MCP and n8n adapter shells with pinning, no live workflow | adapter contract proof; scenario 5 through an adapter | adapters individually kill-switched |

## 12. Phase 2 — order

1. **GitHub + Vercel read-only** (adapters + registry): `os_repositories` client ↔ repo ↔ Vercel project map,
   `repo.status`, `deployment.status`, health; on Client 360. Then `repo.issue.create` / `comment` (AMBER,
   verified by read-back) after MFA.
2. **n8n named workflows** (durable waits + verify): one capability per pinned workflow; Maxpromo owns intent,
   state, approval, audit, verification; n8n owns connector sequences; no arbitrary execution.
3. **Local worker** (Windows service, outbound HTTPS, device key, allow-listed folders, sha256 + local
   dedupe, offline queue, no shell): scanner folders → `document.ingest`.
4. **Document intelligence** (data classes + gateway V2 + adapters + local worker): ingest → hash → extract
   (native text first, model OCR only when needed) → classify → identify → match → propose → approve →
   canonical record → verify (hash + linked record) → audit; EU object storage. Esosa reuses the contracts
   and code in its own system; Esosa data never enters Maxpromo's database.
5. **MCP** for specialist services, only behind pinned adapters.
6. **Calendar / Drive / Gmail adapters** only when a real workflow needs them.

## 13. Provider positions

| Provider | Position |
|---|---|
| Hostinger Mail | ALREADY PRESENT — canonical email transport |
| Gmail | NOT REQUIRED NOW — future communication adapter (client Google Workspace) |
| Google Calendar / Drive | later, only for a real workflow |
| Telegram | notification/alert only; never the control plane |
| Supabase / MySQL | not added; Neon Postgres suffices |
| Whisper/OpenAI transcription, FFmpeg | practical adapters (Phase 2, local worker for sensitive audio) |
| ElevenLabs, HeyGen, Higgsfield, ComfyUI | marketing/media assessment later; not Operational Foundation |
| Scrapling | not adopted (§6.3); revisit for repeated structured scraping only |
| Firecrawl | managed fallback + secondary search (§6.4) |
| Playwright | render worker engine (§6.3) |

## 14. Do not build

A second registry, approval system, audit system, CRM, identity system or workflow engine; Kafka, Temporal,
Kubernetes, Redis queues; a policy language; raw MCP tools or arbitrary n8n workflows exposed to Max; a
remote shell or general PowerShell capability; consequential browser automation (logins, form submission);
stealth or anti-bot circumvention on prospects' sites; automatic retuning of research from calibration;
autonomous outreach; Chromium, FFmpeg or long jobs inside the Vercel web app; a multi-tenant document SaaS;
Telegram command control; anything from OpenClaw.

## 15. Acceptance architecture

| # | Scenario | Pass when |
|---|---|---|
| 1 | Simple static site | rung 0 only; no render, managed or search cost; grounded result |
| 2 | Mediza | as §6.8 |
| 3 | M-Lau | as §6.8 |
| 4 | JavaScript site | rung 0 `js_shell` → render → captured sources with hashes → verified facts |
| 5 | Provider failure | render and Firecrawl unavailable/429 → fallback or `partial` with honest coverage; never `completed` |
| 6 | Long research job | survives the request; worker killed mid-step → resumes from the last finished step; progress visible |
| 7 | Result delivery failure | first hand-back fails → retried → applied once (ADR-0033 A2, proven today in the evidence database) |
| 8 | Objective verification | an action reports done but the re-read differs → step `mismatch`, objective not COMPLETED |
| 9 | Sensitive document | `personal_sensitive` extraction with OpenRouter configured → refused before any network call |
| 10 | Automation (future) | named n8n workflow runs → execution succeeded **and** the expected records read back |
| 11 | Engineering (future) | `repo.issue.create` → issue fetched by id matches |
| 12 | Local file (future) | same scanned PDF twice → one document, one processing |

## 16. Implementation readiness

| Programme | Readiness |
|---|---|
| 1 Capability registry + objective/verification | **READY** |
| 2 Durable runtime | **READY AFTER PREREQUISITE** — Programme 1 slice 1; driver choice needs the Vercel plan answer (or the worker host) |
| 3 Model Gateway V2 | **READY AFTER PREREQUISITE** — Programme 1 `data` field (slices 1–2 can start in parallel) |
| 4 Web Intelligence + Research V2 | **READY AFTER PREREQUISITE** — Programmes 2 and 3; slices 3–5 BLOCKED on Marcel's search provider, worker host and budget |
| 5 Execution adapter foundation | **READY AFTER PREREQUISITE** — Programmes 1 and 2 |
