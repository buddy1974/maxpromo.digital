# WhatsApp → Max → Maxpromo OS — the conversation gateway

Status: **built and proved locally; not connected to Meta.** Decision record: **[ADR-0019](../adr/0019-a-public-channel-gets-no-tools.md) (accepted 2026-10-16)**.
Production stays **off** by owner decision: acceptance authorised no Meta connection, production
migration, production secret or deploy.
Last updated: 2026-10-16.

The public WhatsApp Business number (+49 174 5910734) becomes the first doorway through which a
stranger can talk to Maxpromo and have the conversation land in Maxpromo OS. This is the single
reference for how it works. The code is in `apps/web/lib/channels/`; the route is
`apps/web/app/api/channels/whatsapp/route.ts`.

Nothing in this document has touched the real number, Meta, or production.

---

## 1. What existed (forensic reconciliation, 2026-10-16)

| Found | Where | Decision |
|---|---|---|
| Conversation store with handover states `bot / pending / human` | `chat` schema (0006), used by the web chat "Max" | **EXTENDED** (0012) — a WhatsApp conversation is one more `origin` |
| Commercial system of record, capability registry, request-id idempotency, audit | `lib/commercial/*` (ADR-0018) | **REUSED** — through a four-capability public allow-list, never the registry |
| Telegram → Mission Control → OS (Max Agents) | OpenClaw + `/api/os/agent/v1` | **LEFT UNTOUCHED** — it is the *owner's* lane (one allow-listed numeric id); a public channel must not ride it |
| Proactive notices to Marcel's phone | `owner.notices`, polled by the Gateway plugin every 60 s | **EXTENDED** — WhatsApp handovers, qualified leads, failed/uncertain sends, held messages; Mission Control unchanged (it maps notices generically) |
| Structured model output | `callAIJson` in `lib/ai.ts` | **EXTENDED** with a timeout; no second provider client |
| Platform logger with redaction | `@maxpromo/observability` | **REUSED** |
| Evidence boundary (no outbound contact in evidence mode) | `packages/config/evidence.ts` + `prove:evidence-isolation` | **EXTENDED** — `graph.facebook.com` blocked; the gate only scanned `api.*` hosts and could not have seen it |
| Outbound WhatsApp | none — the OS opens `wa.me` links for Marcel's outreach, never sends | **UNCHANGED for outreach.** The gateway only *replies* inside a window the customer opened (ADR-0019) |
| Legal phone `BUSINESS.phone` | `@maxpromo/config` → `+49 173 3645698` | **NOT CHANGED** — differs from the new number. Marcel decided (2026-10-16) +49 174 5910734 is the intended public number, migrated under control: [inventory](../governance/public-number-migration.md) |

The decisive finding: every one of the 48 registry capabilities is written for the owner. GREEN
means "safe for Marcel", and Marcel may read the whole business (`commercial.search`,
`owner.overview`, `lead.find`). Giving the WhatsApp lane the registry would have given every
stranger with a phone the business. So the lane gets **no tools** and **four fixed operations**.

## 2. Architecture

```
customer's WhatsApp
   │  (Meta Cloud API, coexistence with the Business App on the same number)
   ▼
POST /api/channels/whatsapp          ── size cap → config (fail closed) → X-Hub-Signature-256 over raw body
   │  lib/channels/whatsapp.ts            → normalise (our number + WABA only) → ingest (insert-once by wamid)
   │                                      → 200 to Meta → after(): process
   ▼
Conversation orchestrator            ── lib/channels/orchestrator.ts (pure; ports for store/OS/model/provider/clock)
   │  per-conversation lease → may Max speak? → identity by phone → takeover floor
   │  → model (no tools) → validate → guard → OS writes (allow-list) → persist → send
   ├──▶ model  (callAIJson, forced tool, schema, 25 s timeout)
   ├──▶ Maxpromo OS  (lib/channels/os-bridge.ts → commercial engine: lead.check, lead.create, note.add, incident.create)
   ├──▶ chat.* (Neon eu-central-1)  conversation, messages, outbound ledger, trail
   └──▶ WhatsApp provider  (Graph /{phone-number-id}/messages; loopback mock in evidence mode)

Marcel ◀── owner.notices (chat.events trail) ◀── Gateway plugin poll ◀── Telegram (unchanged lane)
Marcel ──▶ WhatsApp Business App ──▶ smb_message_echoes ──▶ conversation becomes "human"; Max goes quiet
```

**Channel-neutral by construction.** `lib/channels/types.ts` defines inbound messages, echoes,
statuses and the `ChannelProvider` interface. Only `whatsapp.ts` knows Meta's shapes. Instagram or
Messenger is another adapter producing the same events; the orchestrator, policy, guard, copy and
OS bridge do not change. (Not built: no second channel exists yet.)

## 3. The conversation

**Understand first, route second, sell last** is in the prompt and in the code:

- The model writes one reply (1–4 sentences, at most one question) and reports, as validated
  fields: language, intent (internal taxonomy, never shown), facts in the customer's words
  (problem, current process, volume, people, tools, desired outcome, urgency, business type,
  company, name, city), a one-line problem summary for Marcel, whether qualification is complete,
  whether they want a person, urgency, and whether they sent sensitive data.
- Facts **accumulate** across turns (`mergeFacts`: added or restated, never deleted) and are fed
  back, so nothing is asked twice.
- **Qualified** = problem + current process + size (or the model says complete with problem + one
  of them). Then the summary is recorded on the lead and Marcel is notified once.
- Existing clients (recognised by verified phone) are **not qualified or sold to**: the prompt says
  so, a support need opens an incident on their own record, and they are handed to Marcel.
- Language: German and English; the model follows the customer's latest message; fixed copy uses
  the conversation's language, falling back to a heuristic only when the model is absent.
- First automated message carries the **AI disclosure** (EU AI Act Art. 50, applicable since
  2026-08-02), added by code, once.

## 4. Who may speak — the order of authority

`policy.mayAnswer`, first match wins:

1. `WHATSAPP_AUTOMATION=off` (default) → record only; Marcel answers from the app.
2. Pilot list set and this number not on it → record only.
3. Marcel is in the chat (`human`) → silent.
4. Customer asked for Marcel and he has not answered (`pending`) → silent.
5. The newest message is older than 6 h when processed (replay, backlog) → held, Marcel told.
6. Outside the 24 h service window (with a 10-minute margin) → held, Marcel told.

Then a **deterministic takeover floor** (`takeoverSignal`, DE/EN) runs before the model: "Kann ich
mit Marcel sprechen?", "call me", "I want a real person", complaints, emergencies. If the model is
down or talked out of it, a person who asks for a person still gets one. It deliberately does
**not** fire on "Marcel told me to message you" — the live demo's opening line.

## 5. Human takeover

| Event | State | Max |
|---|---|---|
| Customer asks for Marcel / complaint / urgent / client needs help / model fails / daily allowance used | `pending` (reason recorded) | sends one fixed, true acknowledgement (with Marcel's next opening hour), then silent |
| Marcel types in the WhatsApp Business App (echo) | `human` | silent |
| The Business App's own greeting/away message echoes | unchanged | — (matched against `WHATSAPP_NATIVE_AUTOREPLY_PREFIXES`) |
| Marcel types while Max is mid-reply | `human` | the reply is **suppressed** at send time |
| Marcel quiet for `WHATSAPP_HUMAN_IDLE_HOURS` (default 48) | back to `bot` | resumes; trail `wa.automation_resumed`; Marcel's own messages are in the model's context, labelled |

The acknowledgement is written **after** the handover is persisted and the notice queued, so
"I have let Marcel know" is always true. Marcel is told through `owner.notices` (≤ 60 s, keyed,
delivered once). Context is never lost: the conversation, facts and lead link stay.

## 6. Maxpromo OS — what the public lane may do

| Operation | Capability | When | Inputs come from |
|---|---|---|---|
| Who is this number? | `lead.check` (phone only) | once per conversation | the WhatsApp-verified number |
| Record the enquiry | `lead.create` (`source: whatsapp`, stage `discovered`) | a real business problem, or a request for Marcel — never for "Hi" | the customer's stated facts |
| Record the qualification | `note.add` on this conversation's lead | once, when qualified | facts + summary |
| Client support | `incident.create` on the client's own record, dedupe `whatsapp:<conversation>` | client + support need | summary |

Run through the commercial engine under actor `whatsapp:<conversation id>`, channel `whatsapp`, with
request ids derived from the customer's message id — a redelivered webhook repeats nothing.

**Identity rule (found by the live run).** A link to an existing record is made **only by the
verified phone number**. If `lead.create` matches an existing lead or client on a name the
customer typed (or, before the fix, their profile name), a *separate* lead is created
(`confirmed_distinct_from`) and Marcel is told (`wa.possible_duplicate`). Otherwise a stranger
calling themselves "Bäckerei Schmidt" would have been attached to the real client, seen the
client's first name in Max's context, and opened incidents on their record.

**Blocked, by construction:** quotes, prices, discounts, proposals, invoices, payments,
acceptance, stage changes, deletion, any read of other records. No capability for them is
reachable from the lane; the model has no tools; the guard refuses the words.

## 7. Security

| Threat | Control | Proved by |
|---|---|---|
| Forged / unsigned webhook | HMAC-SHA256 over the **raw** body with the app secret, constant-time; 401 before parsing | gateway proof; live (401) |
| Re-serialisation trap | raw body hashed; the umlaut case is demonstrated | gateway proof |
| Misconfiguration | three-layer fail-closed config; short or placeholder secrets refused; `on` without token refused | gateway proof |
| Another number/WABA on the same app | events for other `phone_number_id` / WABA ignored | gateway proof; live |
| Oversized body | 512 KB cap before reading as JSON (413) | live |
| Duplicates, retries, storms | unique `(channel, external_id)`; reply key unique per turn; OS request ids per message | gateway proof (51×); live (6×) |
| Replays | duplicates are no-ops; unseen-but-old messages are held, not answered | gateway proof |
| Concurrent deliveries / rapid messages | per-conversation lease (DB clock); messages coalesce into one answer | gateway proof; live |
| Prompt injection | no tools; customer text inside a delimited data block (forged tags neutralised); canary; guard; no business data in context | gateway proof (fully compromised model); live (real model) |
| Price / discount / commitment / foreign link / email / phone / secret in a reply | output guard → fixed copy + notice | gateway proof; live |
| Identity spoofing by name | phone-only linking (§6) | gateway proof; live |
| Double send after timeout | timeout = UNCERTAIN, never retried; interrupted `sending` row = uncertain | gateway proof; live |
| Agent and human both answering | suppress at send if Marcel typed | gateway proof |
| Outbound spam | no proactive path: the provider is called only to answer a pending inbound inside its window; no templates | gateway proof (J23) |
| Secrets / personal data in logs | logger redaction + only ids and counts logged | gateway proof; live (server log scanned) |
| Evidence/test reaching a real number | evidence mode blocks `graph.facebook.com` inside the transport; override only to loopback | `prove:evidence-isolation` |
| Cost abuse | per-IP webhook limit, per-conversation daily model allowance → handover | gateway proof |

## 8. Data and privacy

Stored (Neon, eu-central-1 — same database as the OS): conversation (phone, business-scoped id,
profile name, derived facts, identity, links, takeover times), message text (inbound, Marcel's
echoes, Max's replies), delivery states, a trail of gateway events.

- **Minimisation.** Media is never downloaded (described as "[sent an image]"). A lead is created
  only for a substantive enquiry. Logs carry ids and counts, never text or numbers.
- **Retention.** Message text older than `WHATSAPP_MESSAGE_RETENTION_DAYS` (default 90) is erased in
  place; derived facts stay. `eraseExpiredContent`, opportunistic and bounded.
- **Erasure.** `eraseContact(phone)` deletes the conversation, messages and trail and reports
  linked leads/clients, which are business records handled in the OS.
- **Third parties.** Message text goes to Meta (transport) and to the model provider (Anthropic,
  US) for inference.
- **Sensitive data.** The model flags bank/health/ID/password data; Max asks the person not to send
  it and Marcel is told.

**For professional confirmation (not legal advice; Marcel + adviser):** legal basis (Art. 6(1)(b)
pre-contractual / (f) legitimate interest) for automated replies and lead creation; the privacy
notice on maxpromo.digital must name WhatsApp/Meta and the model provider, the purposes, retention
and the AI assistant; data-processing terms with Meta (WhatsApp Business Solution terms) and
Anthropic, and the US transfer mechanism (EU–US DPF / SCCs); the 90-day default; whether the AI
disclosure wording satisfies Art. 50 AI Act; whether a Datenschutz-Folgenabschätzung is needed.

## 9. Failure behaviour

| Failure | Customer sees | Marcel sees | State |
|---|---|---|---|
| Meta outage | nothing (no delivery) | — | Meta retries for up to 7 days; idempotent |
| DB down at ingest | — | — | 500 → Meta redelivers; nothing lost |
| DB down mid-processing | possibly nothing | "waiting > 10 min" notice | messages stay pending; next delivery or lease expiry recovers |
| Model timeout / garbage | true fallback: received, passed to Marcel, when he is back | handover notice | `pending` |
| OS write fails | normal reply (claims nothing about records) | "recording failed" notice | retried on the next message |
| Provider 5xx / rate limit | reply after one retry, or nothing | failed-send notice | `failed` |
| Provider timeout | maybe the reply | "unclear whether delivered" (critical) | `uncertain`, never resent |
| Window closed (131047) | nothing | failed-send notice | — |
| Username-only contact (no phone) | nothing automatic | failed-send notice | BSUID sending disabled until verified |

## 10. Configuration

[`docs/deployment/whatsapp.env.template`](../deployment/whatsapp.env.template) lists every variable with its meaning. Secrets are entered
in Vercel (production) only — never in chat, never committed. Rollout dials:
`WHATSAPP_AUTOMATION` `off → shadow → on`, `WHATSAPP_TEST_ALLOWLIST` for a pilot on Marcel's own
test phone.

## 11. Testing

```bash
npm run prove:whatsapp-gateway     # offline, in verify: 217 properties, real modules, fakes
npm run evidence:migrate -- apps/web/db/migrations/0012-channel-gateway.sql   # evidence lab only
npm run prove:whatsapp-live        # real route + evidence DB + real model + loopback Graph
npm run prove:whatsapp-live -- --cleanup   # remove everything a run created, after any interruption
```

The live proof starts its own dev server (port 3031) and Graph mock with throwaway secrets; test
numbers are `+49 1520 0009xxx` (fictional range); the transcript of every conversation is written
for review.

## 12. Coexistence with the WhatsApp Business App

Verified against Meta's documentation (2026-10-16) — see §14 for what must be re-verified at the boundary.

- Coexistence onboarding is done through **Embedded Signup** (v4 — v2 was deprecated 2026-10-15)
  by an app that is a **Tech Provider or Solution Partner**. Maxpromo either becomes a Tech Provider
  (Meta app + business verification + app review) or uses a BSP. **This is the main external
  prerequisite.**
- Business App ≥ 2.24.17; the number stays on the app. Webhook fields to subscribe in addition
  to `messages`: `smb_message_echoes` (Marcel's app replies → takeover), `history`,
  `smb_app_state_sync`. History sync must be accepted within 24 h of onboarding or onboarding is
  repeated; the gateway ignores `history` and `smb_app_state_sync` today (it does not import old
  chats — deliberate minimisation).
- After onboarding: disappearing messages, view-once and live location are off for 1:1 chats;
  broadcast lists become read-only; companion devices are unlinked and must be re-linked;
  **WhatsApp for Windows and WearOS are unsupported** — replies Marcel types there produce no echo,
  so Max would not know he took over. Marcel must answer from the phone app or a supported companion.
- Throughput is fixed at 20 messages/s. App messages stay free; API messages are billed under
  Cloud API pricing. A window opens only for messages received *after* onboarding.
- Meta is introducing business-scoped user ids (usernames): a sender may arrive with a `user_id`
  and no phone. The gateway records such contacts and keys them by that id; it does not send to
  them until BSUID sending has been verified live.

### Native greeting / away messages — test matrix (to run at the boundary)

| Case | Expected with native messages ON | Gateway behaviour proved locally |
|---|---|---|
| New contact, open hours | native greeting + Max's reply (Max does not greet again) | J21 |
| New contact, after hours | native away + Max's reply (Max says when Marcel is back on handover) | J22 |
| Existing contact | Max only (greeting is first-contact only) | J1 second turn |
| Marcel took over | native messages per app rules; Max silent | J10 |
| API unavailable | native messages only; Meta retries the webhook | ingest 500 path |
| Model unavailable | native + Max's fixed fallback; handover | J17 |
| Duplicate webhook | one reply | J12 |
| Native greeting echo | not mistaken for Marcel | J21 |
| Native away echo | not mistaken for Marcel | prefix match |

**Recommended starting policy** (to confirm on the live number): keep the **away** message, turn
the **greeting** off once Max replies (two greetings in a row reads as a bot talking to itself),
and set `WHATSAPP_NATIVE_GREETING_ACTIVE=false` when it is off. Whether app auto-messages echo at
all must be observed; the prefix list makes either answer safe.

## 13. Rollout and rollback

1. Owner prerequisites (§14) — nothing below starts without them.
2. Apply `0012-channel-gateway.sql` to production after a Neon recovery branch (additive, idempotent).
3. Set env with `WHATSAPP_AUTOMATION=off`; deploy; register the webhook; Meta verifies (GET).
4. `off` for a day: messages recorded, Marcel answers from the app, nothing automatic.
5. `shadow` + Marcel reads the drafts (`chat.messages` `out_status='draft'`).
6. `on` + `WHATSAPP_TEST_ALLOWLIST=<Marcel's test phone>`: live acceptance on the real number.
7. Remove the allow-list.

**Kill switch / rollback**, fastest first: Meta App Dashboard → unsubscribe the `messages` field
(instant; nothing reaches us) · `WHATSAPP_AUTOMATION=off` + redeploy (recording continues, Max
silent) · remove `WHATSAPP_APP_SECRET` + redeploy (webhook 503, Meta retries/queues) · offboard the
number from Cloud API in WhatsApp Manager (the Business App keeps working). Migration 0012 is
additive; the code ignores it when unused, so no schema rollback is needed.

## 14. External prerequisites and owner actions

Owner-only (account, legal, money, the real number). Recorded once, here; the completion report
carries the click-paths.

1. **Meta Business portfolio + business verification** for Maxpromo Digital.
2. **Path to coexistence:** become a Tech Provider (own Meta app, app review for
   `whatsapp_business_management` and `whatsapp_business_messaging`) **or** choose a BSP. Decision
   with cost implications — Marcel's.
3. **Payment method** on the WhatsApp Business Account (Cloud API messages are billed).
4. **Legal identity** (intended number decided 2026-10-16; migration planned from [the inventory](../governance/public-number-migration.md)): the public number in `@maxpromo/config` (`BUSINESS.phone`, Impressum) is
   `+49 173 3645698`; the business WhatsApp is `+49 174 5910734`. Which number the Impressum shows
   is a legal decision.
5. **Privacy notice** update and processor terms (§8).
6. Values for Vercel (never in chat): `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (generate
   locally), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`
   (system-user token, never a temporary one), and the exact greeting/away texts.
