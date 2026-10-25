# ADR-0029 — Universal Max V1: the interaction layer of Maxpromo OS

**Status:** implemented 2026-10-25 under Marcel's "Universal Max V1" brief (authority to design, implement,
migrate and deploy); the agent-made decisions below are for Marcel's inspection.
**Context:** after the Foundation repair (ADR-0028) the audit's two readiness questions were answered YES:
clients can be created/updated through proposals; Trash/Restore/drafts can be proposed. Marcel still had
to choose a screen for every piece of routine work. Ask Max (ADR-0023) answered questions and could draft
replies; Quick Scan and the client form extracted contacts. Nothing turned "Esosa paid €500 today" into a
governed action.

## Decisions

1. **One interaction model, not a feature:** capture → understand → ground → propose → preview → Marcel
   confirms → existing capability → result → audit. Architecture and capability map:
   `docs/architecture/universal-max.md`.
2. **Max owns no business data.** Every effect is an existing capability through the engine. New: two
   tables (0026) for what Marcel said and what Max proposed/ran; nothing else.
3. **The model proposes meaning only.** One gateway call returns question / action / unclear and actions as
   registered proposal types (schema enum = registry) with loose fields. Ids, capabilities, recipients,
   amounts and tax are never taken from it unverified; unknown types are reported as "cannot do".
4. **A proposal registry** (`lib/max/proposals.ts`): 17 types, each naming the one (or, for Trash/Restore,
   the single/bulk pair of) capability it may run, its confirmation, its editable fields and its grounding.
   Adding a capability to Max = one registry entry.
5. **Confirmation follows the existing risk.** GREEN capability → one tap; AMBER (`payment.record`) → the tap
   prepares the capability's own approval, a second explicit approval executes it. No new taxonomy.
6. **Bound, single-use execution:** stored proposal → re-grounded now → same payload hash as the preview →
   claimed once → `runCapability` with request id `max:<proposal>`. A changed record shows a new preview.
7. **Draft-first.** Email, quotes, invoices and introductions are drafts; sending stays in the existing
   governed send flows. Max reaches no send, delete, refund, cancel or accept capability.
8. **Documents are data.** Without Marcel's own words, or when a document carries instructions, only
   client/lead capture survives. Recipients only from a record, the conversation or Marcel's words; a
   document-only address is marked and needs a tick. Amounts only from Marcel's words.
9. **Client extraction is shared, not duplicated.** A file's contact comes from `lib/clients/extract`
   (the Foundation repair contract); Quick Scan now opens Max in capture mode; the client form's
   "From document" stays as a contextual shortcut over the same extraction.
10. **Screen context:** pages tell Max what they show (client, open conversation, Inbox selection, invoice,
    quote); the server verifies every id; it follows Marcel into the Max tab as a removable chip and ends
    when he opens another screen.
11. **Voice = transcript.** `audio.transcribe()` boundary with the provider call in the gateway
    (`@maxpromo/ai transcribeAudio`), off unless the owner enables `AUDIO_TRANSCRIPTION_PROVIDER=openai`
    with `OPENAI_API_KEY` (production's Anthropic route cannot transcribe). Meanwhile the browser's own
    speech recognition fills the text field. Never executed from audio; audio never stored.
12. **Files ephemeral; history inspectable.** Only file metadata is stored. Interactions and proposals are
    kept 180 days for Marcel to inspect; executions are also in `os_audit` permanently. No model reasoning
    is stored.
13. **No `TASK_CREATE`:** no task primitive exists (Jobs are projects); reminders are follow-ups on a client,
    lead or invoice.
14. **Found and fixed on the way:** the shared client/lead search did not fold umlauts in the database
    ("Müller" found nothing); `followup.create` reports an existing follow-up as `created: false`;
    `email.assist` gained a `compose` mode (a new email from a brief); `shrinkImage` moved to
    `components/os/shared`; three icons (mic, camera, attach) and `stop` added to the one icon set.

## Consequences

Marcel can give Max routine work in his own words from any screen or the phone's Max tab, review each
action as a card, correct it, and confirm. The gate count is 35 (`prove:max`). Not done: sending from Max,
agent routing, task primitive, server transcription without an owner-enabled provider, Office file reading.
