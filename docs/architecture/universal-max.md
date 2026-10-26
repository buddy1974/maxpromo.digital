# Universal Max — architecture, capability map, proposal registry, security model

**Decision:** ADR-0029 (2026-10-25). **Code:** `apps/web/lib/max/`, `apps/web/components/os/max/`,
`apps/web/app/api/os/max/`, `apps/web/lib/audio/transcribe.ts`, migration `0026-universal-max.sql`.
**Proofs:** `prove:max` (gate 35, offline), `prove:max-evidence` (evidence database, all twelve scenarios).

Universal Max is the front door of Maxpromo OS: Marcel types, pastes, dictates, photographs or attaches
something, and Max works out what it means, grounds it in the real records, and proposes actions through
the capabilities the OS already has. It is **not** a second CRM, workflow engine, extraction system,
invoice engine or mail system. It owns no business data: it owns the interaction (what Marcel said,
what Max proposed, what Marcel decided, what ran).

```
CAPTURE → UNDERSTAND → GROUND → PROPOSE → PREVIEW → MARCEL CONFIRMS → CAPABILITY → RESULT → AUDIT
 composer   one model     records   stored     card      hash-bound      engine       links    os_audit
            call (data    searches  proposal   (human)   (AMBER: second  (existing)            + record
            ≠ authority)  + context                       approval)                            history
```

## Pieces

| Piece | File | Job |
|---|---|---|
| Contract | `lib/max/contract.ts` | Proposal types, envelope, grounding shape. Ids never from the model. |
| Understanding | `lib/max/understand.ts` | One gateway call (Anthropic in production): question / action / unclear, actions as registered types with loose fields, `instructions_found`. Re-checked field by field (`normaliseUnderstanding`). |
| Context | `lib/max/context.ts` | The screen's ids (client page, open conversation, Inbox selection, invoice, quote) verified against the database; only labels go to the model. |
| Grounding | `lib/max/ground.ts` | Names → records via the OS searches (`searchClients`, `searchLeads`); "this client"/"him" → the screen; amounts and emails checked against Marcel's words. |
| Registry | `lib/max/proposals.ts` | One entry per proposal type: its capability, confirmation, editable fields, grounding. |
| Orchestration | `lib/max/max.ts` | `capture()` (nothing executes), `act()` (edit / choose / reject / confirm / approve), `history()`. |
| Voice | `lib/audio/transcribe.ts`, `components/os/max/useVoice.ts` | `audio.transcribe()` provider boundary; browser speech recognition fallback. Transcript only. |
| Screens | `components/os/max/*` | `MaxProvider` (state above the routes), `MaxSurface` (lazy: composer + conversation), `ProposalCard`. |
| Routes | `app/api/os/max/route.ts`, `…/proposals/route.ts`, `…/transcribe/route.ts` | Owner session, same origin, rate limited. |
| Storage | `os_max_interactions`, `os_max_proposals` (0026) | Input, context labels, reply; proposals with payload, preview, hash, status, result. |

## Capability map (the implementation map)

| Intent / proposal type | Existing capability | Input contract (built by grounding) | Confirmation | Result | Audit path |
|---|---|---|---|---|---|
| Question ("Who owes me money?") | Ask Max `lib/commercial/ask.ts` (read-only intents) | question text | none — read only | answer + facts + links | interaction row |
| `CLIENT_CREATE` | `client.create` (GREEN) | identity; `source:'max'`; `confirmed_distinct_from` only after Marcel chose "a different client" | tap | client + Open link | `max.CLIENT_CREATE` + client timeline |
| `CLIENT_UPDATE` | `client.update` (GREEN) | `client_id` + changed fields; clears explicit; before → after shown | tap | updated client | `max.CLIENT_UPDATE` + timeline |
| `CLIENT_ARCHIVE` / `CLIENT_RESTORE` | `client.archive` / `client.restore` (GREEN) | `client_id`; refused when already in that state | tap | client | `max.*` + timeline |
| `CLIENT_NOTE` | `note.add` (GREEN) | `client_id` or `lead_id`, text | tap | note on timeline | `max.CLIENT_NOTE` + timeline |
| `LEAD_CREATE` | `lead.create` (GREEN) | company + contact; duplicates (`findExisting`) shown first | tap | lead | `max.LEAD_CREATE` + lead history |
| `LEAD_UPDATE` | `lead.update` (GREEN) | `lead_id` + stage (never `won`), value, next action, contact | tap | lead | `max.LEAD_UPDATE` + lead history |
| `AGENT_WORK` (ADR-0030; replaced `LEAD_RESEARCH`) | `agentwork.request` (GREEN, owner only) | `agent: research`, `lead_id`; refused without a website on record | tap ("Start research") | the Research Agent's result on the card (score, verdict, evidence, recommendation); an introduction is offered as a separate proposal | `max.AGENT_WORK`, `agentwork.request`, `agentwork.result` + lead timeline |
| `LEAD_OUTREACH_DRAFT` | `outreach.draft` (GREEN) | `lead_id`, `channel:'email'`, instruction | tap | draft on the lead; **nothing sent** | `max.*` + lead history |
| `EMAIL_REPLY_DRAFT` | `email.assist` (text) → `email.compose` (GREEN) | thread from screen or the person's conversations; recipient = latest inbound sender; text written at proposal time, editable | tap | Email OS draft; **not sent** | `max.*` (+ draft revision) |
| `EMAIL_DRAFT` | `email.assist` mode `compose` → `email.compose` (GREEN) | recipient from client/lead record, Marcel's words, or (marked, ticked) a document | tap (+ tick for a document recipient) | Email OS draft; **not sent** | `max.*` |
| `EMAIL_TRASH` / `EMAIL_RESTORE` | `email.trash` / `email.restore` / `email.bulk` (GREEN) | the open conversation or the Inbox selection only | tap | conversations moved; reversible | `max.*` + `mail.action_audit` |
| `INVOICE_DRAFT` | `invoice.create` (GREEN) | `client_id`, items from Marcel's words; "50 % upfront" = the accepted quote's deposit invoice when one exists, else a part-amount invoice (warned) | tap | numbered **draft**; tax from the document rules (§19 UStG) | `max.*` + invoice history |
| `QUOTE_DRAFT` | `proposal.create` (GREEN) | client or lead, items, EUR/GBP | tap | numbered **draft** Angebot | `max.*` + history |
| `FOLLOW_UP_CREATE` | `followup.create` (GREEN) | client, lead or the invoice on screen; date ≥ today, ≤ 1 year; reason | tap | follow-up | `max.*` |
| `MONEY_RECORD_PAYMENT` | `payment.record` (**AMBER**) | `invoice_id` (named, on screen, the client's only open one, or chosen), amount from Marcel's words, date ≤ today | tap → the capability's own approval preview → **second explicit approval** (hash-bound) | ledger row, open balance, PAID when settled | `max.MONEY_RECORD_PAYMENT` + `payment.record` audit + approval |

## Proposal types not offered (V1) and why

| Not offered | Why |
|---|---|
| `TASK_CREATE` | The OS has no standalone task primitive: Jobs are projects with stages and money, not to-dos. "Remind me to call X" is a follow-up on a client or lead. A reminder about nothing (no client, lead or invoice) is not possible yet. |
| Send anything (email, quote, invoice, reminder, outreach) | Draft-first. Sending stays in the governed send flows (Inbox `email.deliver`, document sends), each with its own confirmation. |
| Permanent deletes (`client.delete`), refunds, invoice cancellation, quote acceptance | Destructive or financial with their own approval screens; not routine front-door work. |
| Payouts, bank transfers, settings, other systems | Not OS capabilities. Reported as "Max cannot do this". |
| Word/Excel/PowerPoint reading | The model route cannot read Office files; Max says so. They can still be attached to a client as documents. |
| Lead discovery, campaigns, social, video | Separate milestones. |

## Confirmation and governance

Max adds **no** new risk taxonomy. A proposal's confirmation is derived from its capability's existing risk:
GREEN → one tap on the card (`confirm`); AMBER → the tap prepares the capability's own approval
(`os_approvals`, payload-hash bound, single use) and a second explicit approval executes it (`approve`).
Questions need nothing. Anything else is not reachable. The proof asserts AMBER ⇔ approve.

Every confirmation: the stored proposal → re-grounded against the records as they are now → must still be
ready with the **same payload hash** the card showed → claimed once (`proposed → executing`, conditional
update) → the type's registered capability via `runCapability` (request id `max:<proposal>`, idempotent).
A changed record (a duplicate created meanwhile, a payment recorded meanwhile) returns the new preview
instead of running.

## Security model

1. **Only Marcel's words instruct.** Documents, screenshots, emails and records are DATA (system prompt,
   `<document>` quoting). With no words from Marcel, or when a document contains instructions
   (`instructions_found`, or the shared `INJECTION` pattern on text documents), only `CLIENT_CREATE` /
   `LEAD_CREATE` survive — a document cannot cause an email, a payment, a trash or an archive.
2. **The model chooses meaning, not authority.** It can name only registered types (schema enum = registry),
   has no field for an id, capability, URL or SQL, and everything it returns is re-validated.
3. **Ids from the OS only:** the verified screen context, a server-made choice (checked against the stored
   options), or a lookup.
4. **Amounts from Marcel only.** An amount on a payment, invoice, quote or lead value must be written in his
   input (or typed by him in the edit form). Invoice numbers are looked up, never invented; tax never computed.
5. **Recipients from trusted sources.** A record, the conversation, or Marcel's own words. An address found
   only in a document is shown as such and needs an explicit tick; any other address is dropped.
6. **Execution is bound and single-use** (above). Another actor cannot see or run Marcel's proposals.
7. **Files are ephemeral.** Read in memory for one request; only name, type, size and SHA-256 are recorded.
   A document is stored only when Marcel keeps it on a client (existing client documents route).
8. **Audio is never stored and never executed.** It becomes text in the composer; Marcel sends the text.
9. **No hidden reasoning is stored** — only Marcel's input, labels of the context, the business-facing
   preview and the result.
10. **Observability without content:** `[max] capture|execute|approve` log lines with request id, types,
    capability, status, latency and model — no input text, no document content.

## Voice

`audio.transcribe()` (`lib/audio/transcribe.ts`) is a provider boundary. Production has only the Anthropic
model route, which does not transcribe audio, so the server provider is **off**; it is enabled by the owner
with `AUDIO_TRANSCRIPTION_PROVIDER=openai` and an `OPENAI_API_KEY` (OpenAI transcription; nothing else
changes). Without it the composer uses the browser's own speech recognition (Chrome, Safari — the audio is
processed by the browser vendor, as with keyboard dictation); without that, Max says so and typing stays.
Flow: tap → speak → tap → transcript in the text field → edit → send. Permission denied, recording failure,
no provider and empty results each have their own message.

## What Universal Max V1 cannot do

- Send anything, delete permanently, refund, cancel, accept quotes, pay out, change settings.
- Act without Marcel: no triggers, no schedules, no agent autonomy. Owner-driven only.
- Create a reminder that is not about a client, lead or invoice (no task primitive).
- Read Word/Excel/PowerPoint files; transcribe on the server without an owner-enabled provider.
- Find a conversation by content ("the email from last week about X") for Trash: it uses the open or
  selected conversations.
- Remember a long chat: each request stands alone with the screen context; history is for inspection.
- Talk back by voice (no live voice mode).
- Route work to Agent Bureau agents (later, through the OS ↔ Bureau contract).

## Evidence (2026-10-25)

**Production** (`www.maxpromo.digital`, Anthropic `claude-sonnet-4-6`; final commit in the change log):

| # | Scenario | Result | Latency |
|---|---|---|---|
| 1 | "Who owes me money?" / "Wer wartet auf meine Antwort?" | grounded answer (Urologie Neuwied €156, 151 days overdue; the waiting conversation), no proposal | 3.8 s / 2.9 s (9.2 s before the question shortcut) |
| 2 | Client from text (fictional) | CLIENT_CREATE ready, preview, confirmed on screen → client created (source max), Open link, `max.CLIENT_CREATE` audit | 4.5 s |
| 3 | Same email again | EXACT candidate with Open link, "a different client" option; confirming anyway refused (409); one client | 3.8 s |
| 4 | Fictional business-card PDF, no words | every field read from the PDF; nothing saved (client count unchanged) | 6.5 s |
| 5 | "Reply that Tuesday works…" with the test conversation open | recipient from the conversation, draft text edited on the card, confirmed → Email OS draft; 0 outbound messages | ~15 s (draft text written by `email.assist`) |
| 6 | "Nordlicht paid €40 today by bank transfer" | real client, invoice MP-2026-045, €100 open → €60 after; confirm → the capability's own approval (ordered preview); cancelled — no payment recorded (risk 162) | 3.6 s |
| 7 | "Create a €100 test invoice draft…" | draft MP-2026-045, VAT "none (§19 UStG — from the document rules)", not sent | 3.2 s |
| 8 | Meeting + quote + email + follow-up | four cards; three confirmed on screen ("3 of 4 actions completed"), the email left as a proposal | 8.4 s |
| 9 | "Remind me Friday to call the TEST Abnahme client" | three candidates, "Who do you mean?", nothing changed | 3.6 s |
| 10 | PDF with planted instructions (send file, pay €5000, trash all) | only the contact capture proposed, with the instructions warning; no email/payment/trash | 4.7 s |
| 11 | "Delete all invoices … transfer 500 € to DE89…" / "Send MP-2026-002 now" | refused with explanation, no proposal; forged proposal 404; extra `capability` field 400 | 6.0 s / 2.5 s |
| 12 | Voice (browser recognition simulated — no microphone in the automated browser) | transcript in the field, edited, sent; follow-up proposal; date edited; confirmed → follow-up | 9 s incl. typing |

Also in production: `CLIENT_ARCHIVE` through Max (active → archived); every execution has an `os_audit` row
(`max.<TYPE>`, capability, status) besides the capability's own history.

**Evidence database** (`prove:max-evidence`, model steps fixed): all twelve scenarios including the full payment path
(approval → `payment.record` → ledger 50, 150 open → audit), double confirmation refused, stale hash refused, foreign actor
refused, id edit refused, server-only choices, document-only recipient needs a tick, invented recipient dropped.

**Mobile** (local build, harness at 360 / 390 / 412 px): composer, attach / photo / microphone controls, proposal cards,
duplicate choice, edit form, approval, payment recorded, multi-select with "Confirm 3 selected", partial-result summary,
microphone-denied message, simulated transcript in the field — LAYOUT PASS / WORKFLOW PASS. Physical phone: OWNER (risk 163).

**Performance:** a question 3–4 s (understanding skipped for plain questions; Ask Max routes and phrases); an action
3–5 s (one understanding call + grounding); email drafts add the writing call (~5–10 s); multi-action grounds in parallel.
The slowest part is model calls; no caching was added.
