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

The Hostinger contract extension in migration 0014 supersedes generic provider-ID
mapping for that adapter; see the current activation section below.

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

`POST /api/channels/mail` now authenticates and validates the owner-supplied official
message.received contract. It returns 200 only after atomic durable acceptance; invalid
configuration or database failure remains fail-closed. Delivery and mailbox-event IDs
are distinct, RFC headers reconstruct conservative same-sender threads, and previews are
never authoritative full bodies. Signed locators are encrypted, not exposed to clients.

## Reconciled storage and activation

Migration 0014 adds independent header/date/preview state and durable deliveries,
content_jobs and content_assets. No production migration or account activation occurred.
Full body/private attachment processing ports have lease, expiry, SSRF/pinned-DNS,
size/media and durable-reference controls. No live retrieval factory is installed:
verified download host/media constraints are still required. Existing outbound actions
remain disabled and the Resend commercial path is unchanged.

Canonical production target is https://www.maxpromo.digital/api/channels/mail, derived
from the Domain Registry. Read-only HEAD on 2026-10-22 returned 404: local code is not
currently deployed. Do not configure a real receiver before approved deployment/readiness.

Required inbound variable names are EMAIL_PROVIDER, HOSTINGER_WEBHOOK_SECRET and the
existing OS_SESSION_SECRET/database configuration. The old webhook-secret alias is removed;
no API token or configurable API base is required for inbound webhook receipt. No real
API token is requested or used. Existing owner-agent/Telegram/AI variables retain their
existing purposes; no second bot or notice consumer is created.

The [Hostinger activation runbook](../deployment/hostinger-activation.md) is the single
current source for exact environment names, Hostinger/Vercel steps, signed-URL boundary,
external Telegram notifyActors status, verification and rollback. This supersedes the
initial missing-webhook-contract blocker: the parser/receipt contract is now implemented.

## Provider spam state and quarantine (ADR-0022)

Hostinger's `message.received` fires for mail it files into Junk and carries no folder or spam
field. The OS therefore reads the provider folder after receipt through the REST API
(`lib/mail/providerState.ts`: special-use folders + Message-ID header search, read-only port,
`after()`), and applies it with `mail.apply_provider_state`. Quarantine
(`provider_junk` · `suspected_phishing` · `owner_spam` · `blocked_sender`) is a thread state:
quarantined mail appears only under **Spam** and never reaches attention, the brief, notices or
any business action. Marcel's verdict always wins. Structural signals (`lib/mail/risk.ts`) cover
provider misses. The reconciler is inactive until `HOSTINGER_MAIL_API_TOKEN` and
`HOSTINGER_MAILBOX_RESOURCE_ID` are set.

## Remaining risks

Production deployment/migration/account authorization and real signed-download host/media
constraints remain required. Body/attachment workers and durable private-storage backend
are not activated. External Gateway source/configuration is absent from this machine;
owner notice generation is preserved but proactive mobile delivery remains unverified.
Provider outbound reconciliation, richer search, attachment scanning/retention and large
thread pagination remain staged. No production mailbox, WhatsApp or DNS change occurred.
