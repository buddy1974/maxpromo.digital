# Governed email channel — local implementation and activation

Owner: Marcel Tabit Akwe. Mailbox: info@maxpromo.digital.

## WHAT → EFFORT → VERIFICATION

WHAT: bring the company mailbox into OS business context, retaining Hostinger transport,
existing Max Agents governance and Marcel's private Telegram surface.

EFFORT: inspect the repository, reuse commercial registry/engine, introduce mail storage
and provider adapter, replace the activity-log Inbox, prepare owner capabilities and
attention views, prove safety with synthetic fixtures, leave production disconnected.

VERIFICATION: `npm run prove:email-channel` runs offline contracts/hostile content,
owner actions, safe rendered UI, and webhook tests. `npm run prove:email-storage`
uses only the guarded evidence database. `npm run verify` and `npm run certify`
remain the wider gates. Test output, rather than this description, determines pass status.

## Forensic findings

| Area | Existing implementation and decision |
|---|---|
| OS | `apps/web/app/os/(protected)`; Neon EU database through `lib/db.ts`, evidence resolver |
| Inbox | Previously reconstructed lead/invoice activity, no mailbox synchronization |
| Owner API | `api/os/agent/v1/[action]`, HMAC nonce protection, allowlisted actor |
| Governance | `apps/web/lib/commercial/engine.ts`, GREEN/AMBER/RED, hashed preview, expiring atomic single-use approval |
| Business | `os_leads`, `os_clients`, `os_jobs`, existing sales/operations capabilities; no second CRM |
| Commercial documents | Shared `apps/web/lib/documents/emails.ts`, protected identity, common builders, Resend transport |
| Existing mail | `lib/email.ts`, contact/audit/newsletter and OS document/outreach callers; no Hostinger runtime existed |
| Templates | Existing §19 UStG and legal identity retained; no document/template migration |
| WhatsApp | ADR-0019, chat schema 0012, fixed public capabilities; unchanged and not activated |
| Telegram | `lib/telegram.ts` notification helper; private conversational runtime is external OpenClaw Mission Control |
| Context | Capability focus references and durable drafts; external bot must retain selected thread/draft reference |
| Notices | Existing `owner.notices`/`owner.brief`; email adds attention items, no second notification system |
| Push gap | Risk 90 remains external: no `notifyActors` configuration or bot runtime implementation exists in this repository |
| Bureau | Separate application/database; do not write mailbox state to its US database |
| Secrets | No credentials printed; environment files are not copied into evidence; production remains untouched |

## Storage and ingestion

Migration `0013-email-channel.sql` adds schema `mail`: accounts, threads, messages,
business_links, events, action_audit. Attachments are bounded, sanitized metadata inside
messages rather than a redundant byte store/table. Existing `os_approvals`, `os_audit`
and `os_agent_results` retain governance and caller replay history.

Accounts start disabled. Ingestion validates normalized internal mail, then uses a
single SQL statement and unique `(account_id, provider_message_id)`/event identities.
Only the winning delivery creates a message or updates thread attention. An idempotent
follow-up repairs event references and adds possible links using the stored sender, never
changed retry content. There is no
automatic lead creation, outbound response or privileged tool invocation on ingestion.
Thread IDs must come from verified provider references or a conservative isolated-message
fallback, never sender display name or subject matching. Content is plain text, rendered
by React escaping. HTML is neither rendered nor executed. BCC is not included in local
inbound DTOs or UI. This is an internal ingestion contract, not an invented webhook schema.

Retention, raw MIME storage, real attachment byte retrieval and MIME sniffing are not
implemented. No attachment bytes are downloaded, opened or sent to a model. Metadata
MIME values are downgraded to octet-stream; filenames cannot contain path traversal.
Before enabling byte downloads add authenticated streaming, size checks, content sniffing,
disposition attachment, nosniff and storage/retention policy. Metadata handling is not an
antivirus scanner.

## Provider contracts verified

Primary references, reviewed 2026-10-22:

- [Official API/OpenAPI](https://github.com/hostinger/mail-api/blob/main/openapi.json)
- [Official support guide](https://www.hostinger.com/support/how-to-use-agentic-mail-in-hostinger/)
- [Official TypeScript SDK](https://github.com/hostinger/mail-api-typescript-sdk)

The adapter implements documented folder-scoped list/get/search, folders, flags, move,
and send, including reply/forward references and attachment send payload types. REST uses
Bearer API authentication, paginated envelopes and 429 responses. Sending returns no
provider message ID. No unsupported send-idempotency header is invented. Ambiguous
send failure is uncertain and is never retried automatically.

The separate text retrieval operation marks Seen: it is deliberately not disguised as
a read-only metadata get. Implementing full body synchronization needs deliberate handling
of that state change. Native thread identity, reply-all recipient selection, aliases,
webhook retry/ordering guarantees, permanent deletion/restore and exact limits are not
claimed as implemented. SDK naming differs between reference and repository; no SDK or
other dependency was installed. No Agentic Mail feature was enabled.

## Inbox and owner experience

Inbox lists real synchronized records, supports search, safe full stored text, recipients,
timestamps, unread/needs-reply/waiting and classification filters. Clients/Leads views
require confirmed entity links. Attachments expose metadata. Owner-authenticated actions
permit dictated saved drafts and local read/unread changes. The UI explains that nothing
is sent and that provider synchronization is inactive. Loading, failure, empty and
disconnected states are explicit; styling follows existing brand tokens and mobile layout.

Registry capabilities expose read/search/attachments/summary, explicit business linking,
deduplicated owner-requested lead creation, internal triage, draft/rewrite/translation and
governed send/trash preparation. Model drafting is tool-free with output validation;
recipients come only from stored message data and are shown in the exact approval.
Drafts are actor-bound and previous drafts/approvals superseded. A final stale-draft
check precedes any send attempt. The production mutation port currently refuses all
provider changes; it never falls back to Resend. Local read state is explicitly local.

Natural language such as “Show unread”, “Open it”, “Shorter”, “Send” requires the existing
external bot to discover the capability census and retain returned email_thread/email_draft
focus. No claim is made that the external bot already understands these commands. It must
never interpret quoted email content as Marcel's command. No new bot was created.
Risk 90 depends on risk 89 (`notifyActors`); generating more notices does not close that
external configuration gap.

Morning brief and owner notices include important attention threads, not raw inbox counts.
Routine newsletters/spam are filtered; stable thread-update notice keys permit existing
owner-runtime deduplication. This is notice generation, not a verified proactive Telegram
push. Configure/test the existing owner notification consumer before claiming mobile alerts.

## Security and operational boundaries

`GET /api/os/mail` and `POST /api/os/mail/actions` both require Marcel's session explicitly.
Mutations additionally require exact Origin, JSON, bounded stream size, strict fields and
mail-only capabilities; actor/request ID are bound server-side. Approval execution checks
requesting actor and email capability before calling the existing engine. No arbitrary
capability can be smuggled through the Inbox.

`POST /api/channels/mail` authenticates the documented Bearer webhook secret, limits actual
stream bytes, and fails closed with 503 until the event contract is verified. It has no
production acknowledgment/ingestion path. Bodies and secret values are not logged. Provider
errors expose outcome/status only, not provider response bodies. External redirects are denied.

## Activation procedure — NO-GO until completed

Marcel's account actions, only after local review:

1. Authorize scoped read access for only info@maxpromo.digital; provide API credential securely
   through the deployment secret store, never chat or a committed file.
2. Obtain mailbox resource ID using documented `/api/v1/me` under that restricted token.
3. Authorize a test delivery to a controlled HTTPS staging endpoint and securely provide the
   one-time webhook Bearer secret. Do not point a live production webhook at today's 503 route.
4. Supply a redacted real Test delivery fixture and delivery status evidence. Required contract
   facts: mailbox binding, message/folder/UID identity, event identity, retry/replay behavior,
   truncated content retrieval, UID validity/move behavior. Exact JSON field names remain unknown.

Engineering activation work remains ours after that external evidence arrives: implement/test
the real normalizer, reconciliation/checkpoint worker, safe body synchronization, provider
mutation ledger and uncertain-send reconciliation; wire the already-existing approval engine
to the adapter; verify external Telegram focus/notifyActors; complete isolated end-to-end tests.
No request to Marcel to code or create files is required.

Then separately approve production: migration backup/check, privacy/retention and attachment
policy, auth/API/DB/Cloudflare/Vercel/environment checks, staging replay tests, sender identity
verification, only then deployment and controlled activation. Begin read-only with a pilot.
Live sending is a separate owner decision, with exact recipient preview and delivery evidence.

Environment variable names only:

- `HOSTINGER_MAIL_WEBHOOK_SECRET` — implemented route requirement, minimum 32 characters
- `OS_SESSION_SECRET` — existing cookie authentication
- `OS_AGENT_SECRET`, `OS_AGENT_ALLOWED_ACTORS` — existing signed private agent lane
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — existing notification helper, not a new bot
- `MAXPROMO_EVIDENCE_MODE`, `EVIDENCE_DATABASE_URL` — isolated evidence runs only
- `NEON_DATABASE_URL`, `DATABASE_URL` — existing resolver; never use production in evidence
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` — existing optional generated drafts/summary backends

There are deliberately no invented Hostinger API-token/mailbox-ID environment variables:
the adapter currently receives token and mailboxResourceId as explicit constructor options.
Final runtime environment names will be documented when that activation wiring is implemented.
No environment switch can activate today's webhook or mutation port.

Exact current webhook configuration: **do not configure production**. Future candidate path
`https://maxpromo.digital/api/channels/mail`, method POST, event `message.received`, documented
`Authorization: Bearer <webhook-secret>` authentication. No HMAC header or handshake is assumed.
Verify routing/TLS and test fixture before installation. Today's expected authenticated result
is 503 `webhook_contract_not_verified`, so it is unsuitable for live delivery.

Rollback: disable provider/account processing first, stop webhook delivery in provider control
panel with owner authorization, roll application back; retain additive mail schema and audit
for reconciliation. Never drop evidence/production tables as an application rollback.

## Remaining risks

Real synchronization, attachment bytes, outbox reconciliation and external Telegram routing
cannot be certified by mock contracts. UID/folder identity and send uncertainty need production
provider evidence. Existing notification consumer configuration gap remains. Full external
mobile journeys and real delivery are unverified. These are activation blockers, not P2 polish.
P2: retention automation, richer attachment scanning, indexed multilingual search, reply-all/
forward previews, mailbox management/aliases where separately verified, large-thread pagination.
