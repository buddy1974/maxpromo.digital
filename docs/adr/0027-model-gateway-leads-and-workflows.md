# ADR-0027 — The model gateway, the lead workflow and a small workflow layer

Date: 2026-10-24 · Status: **proposed** — part 1 implemented behind an unchanged default; parts 2–4
await Marcel's approval · Relates to: ADR-0018 (OS is the commercial system of record), ADR-0020/0023
(Email OS), ADR-0021 (control planes), ADR-0026 (phone-first OS)

## Context

Marcel's direction (2026-10-24): no "MCP zoo" — *add a capability only when it serves a workflow
actually used*. Build next: **OpenRouter + Leads + Agent Bureau + a workflow engine**, then run one
real Maxpromo prospect campaign with them; video, a content studio and social publishing after that.

What the repository already had:

- **Two model clients that had drifted:** `apps/web/lib/ai.ts` (Anthropic → OpenAI → mock) plus four
  OS routes calling `api.anthropic.com` directly, and the Bureau's own `anthropic-provider.ts` /
  `openai-provider.ts` with a duplicated parser. "Never two implementations" was already broken.
- **Leads and outreach exist** as governed capabilities (lead.intake/check/create/find/update/history,
  outreach.draft/send/whatsapp_link, followup.*, pipeline.show) behind the approval engine.
  `outreach.send` still goes through Resend, not the Email OS (risk 127).
- **No workflow layer:** os_agent_events, os_recurring and the approvals engine, but nothing that
  says "when X happens and Y holds, prepare Z for approval".

## Decision

### 1. One model gateway — `packages/ai` (`@maxpromo/ai`) — implemented

Every model call in both applications goes through `complete()` / `completeJson()`.

- **Route** — `AI_GATEWAY` = `anthropic` | `openai` | `openrouter`. Unset: Anthropic if its key
  exists, else OpenAI — exactly the behaviour before the gateway. **OpenRouter is never chosen
  implicitly**: a key being present is not the owner's decision to send prompts through a broker. An
  unknown name configures nothing. The Bureau keeps `AI_PROVIDER` as its name for the route.
- **Tiers, not model names** — `fast` · `standard` · `deep`, mapped per route; `AI_MODEL_<TIER>`
  overrides. Anthropic and OpenAI keep their current models (`claude-sonnet-4-6`, `gpt-4o-mini`), so
  adopting the gateway changes no answer. On OpenRouter each tier names a primary and one fallback from
  a second family, sent as `models`. **No automatic router.**
- **OpenRouter data rules, not configurable away:** `provider.data_collection = "deny"` on every
  request; zero-data-retention endpoints (`zdr: true`) unless `OPENROUTER_ZDR=0`;
  `require_parameters: true` so structured output is honoured; `OPENROUTER_REGION=eu` uses
  `eu.openrouter.ai` (EU in-region processing — an OpenRouter **Business/Enterprise** feature).
- **Structured output** — Anthropic: one forced tool; OpenAI: JSON mode; OpenRouter: `json_schema`.
  Images in each provider's format.
- **Failures** — classified once (`failure.ts`, moved from `apps/web/lib/ai-failure.ts`): an exhausted
  balance (Anthropic 400, OpenRouter 402) is BILLING, never a bad request; no credential in any
  failure, log line or result.
- **Never executes anything.** Answers are text or JSON; actions stay behind capabilities and approvals.
- `openrouter.ai` / `eu.openrouter.ai` are classified as allowed model hosts in evidence mode, like
  the other model hosts (`packages/config/evidence.ts`).
- Proof: `prove:ai-gateway` (merge gate 32), including "no application file calls a model provider
  except through the gateway".

**Switching production to OpenRouter is an owner step, not part of this change:** create the account,
decide the plan (EU routing needs Business), put `OPENROUTER_API_KEY` in Vercel, then set
`AI_GATEWAY=openrouter` (web) / `AI_PROVIDER=openrouter` (Bureau). Before that, check OpenRouter's
current terms and its sub-processor list for the data-processing record; customer documents (scanned
invoices, business cards) go through these routes.

### 2. Leads — proposed

The lead workflow is the existing lead capabilities plus the missing steps:
**Discover → Research → Enrich → Qualify → Approve → Outreach → Follow-up → Reply → Opportunity.**

- First write down what the Lead Agent must know about a company (trade, location, size signal,
  website quality, public business contact, reason to contact). **Then** choose the search/scraping
  provider, by that list — not the other way round.
- Research results are stored as a lead's evidence with its source URL; nothing invented (the Ask Max
  rule: no causality the facts do not show).
- Qualification is a score with reasons, shown to Marcel; a batch is approved like any other AMBER
  action.
- **Outreach moves onto the Email OS first** (drafts, approval, Hostinger identity, scheduled send) —
  closing risk 127 — before any campaign.

### 3. A small workflow layer — proposed

`EVENT → CONDITIONS → AGENT/ACTION → APPROVAL → ACTION → RESULT`, as data in the OS database, built on
os_agent_events and the approvals engine — no external workflow product, no general-purpose engine.
Every action is an existing capability; anything AMBER stops for approval.

**Scheduling is part of the decision:** the platform's cron is daily. Steps that must run within
minutes need `CRON_SECRET` plus a frequent cron (hosting plan), or the Bureau as the runner. Owner
activity and the OS sweep (as for scheduled send) carry it until then.

### 4. The first campaign, and a legal gate — proposed

Unsolicited advertising email generally requires prior express consent in Germany, **including to
businesses** (UWG §7(2) Nr. 2); collecting contact data from websites is processing under the GDPR.
The campaign workflow therefore ends in research, scoring and an approved call list / personal letter
/ professional-network approach, and **cold email is not built as a channel** until Marcel has a
qualified legal answer. This ADR does not give legal advice; it records the gate.

## Order

1. Gateway (done here, default unchanged) · 2. outreach on the Email OS · 3. lead data definition →
provider choice → research/score/approve · 4. workflow layer · 5. one real campaign · then video
(`video.generate()` behind one provider interface), content studio, social publishing (2–3 channels).

## Consequences

- One model implementation for both applications; the Bureau's two provider files are gone.
- `@maxpromo/ai` is a new workspace package; both apps depend on it.
- Bureau error codes are preserved but coarser on two paths: a malformed provider body is now
  `ai_empty_response` (was `ai_bad_response`), and billing failures map to `ai_provider_error`.
- Production behaviour is unchanged until the owner sets `AI_GATEWAY`/`AI_PROVIDER`.
