# Hostinger contract reconciliation and activation

This extends ADR-0020; it does not introduce another mail or notification architecture.

## Current locked production status — 2026-10-23

The locked receiver is deployed and healthy. Public receiver GET/HEAD405, rejected POST401.
Mail0013/0014 are applied:9 tables/18 indexes/2 functions. Marcel approved the single
hostinger:info@maxpromo.digital account binding on2026-10-23; it is now provisioned,
enabled and recognized by the owner Inbox API. All mail activity counts remain zero.
Marcel subsequently installed the genuine secret. A fresh Production deployment on2026-10-23
passed an in-cloud presence-only check and now serves the public domain; SAFE TO PRESS HOSTINGER TEST.
No authenticated Test was performed by the agent. Current production
model proof passed85/85 in-cloud. [Release evidence](../reports/email-locked-production-2026-10-23.md).

## Verified input

Source: official Hostinger contract supplied directly by Marcel on 2026-10-22.
Only message.received is supported. A valid request uses the exact configured Bearer
token; regeneration invalidates the previous token immediately. Never log or paste tokens
into issues, reports or committed files. Mailbox identity is fixed to info@maxpromo.digital.

The top-level id (a UUID in the supplied example) identifies a delivery and remains stable across retries for one
message/webhook. data.eventId is the distinct opaque mailbox-message identity. RFC
messageId/inReplyTo/references are untrusted thread hints. Timestamp is the provider event
time; email Date is parsed independently, nullable if invalid. Neither timestamp is a
retry freshness gate, since legitimate retries can be old.

The supplied bodyUrl/fileUrl examples are placeholders, not a verified download-domain
allowlist. Offline fixtures use synthetic URLs and injected transports; no actual Hostinger
request occurs. No domain is inferred from the example hostname.

## Request and durable acceptance

POST /api/channels/mail enforces the existing rate limit, strict Bearer verification
(constant-time digest comparison), declared and streamed size, UTF-8/JSON schema, event,
mailbox, header/filename/URL checks, provider activation selection and encryption config.
Malformed data returns 400, unauthorized or absent/invalid webhook secret 401, oversized 413.
Authenticated requests with other unavailable configuration/DB return 503. GET/HEAD return
405 with Allow: POST and no-store, without storage/provider work. It returns 200 after
the database transaction accepts a new or duplicate receipt.
It never returns 200 before durability and never calls a model, sends mail or creates leads.

Migration 0014 extends messages with independent RFC headers, event/email dates, preview
and body-state fields, and adds deliveries, content_jobs and content_assets. The existing
mail account must be provisioned/enabled deliberately. Migrations never seed an account;
the separately owner-approved real binding was provisioned on2026-10-23. The database acceptance function checks both the
account and mailbox, serializes a mailbox transaction with an advisory lock, deduplicates
delivery and message identities, and inserts exactly one content job/event/message.
Changed delivery-to-event bindings fail closed. Duplicate messages under another delivery
retain the new receipt without changing thread timestamps, notices, jobs or actions.

Threading links only one uncontested same-sender referenced thread within the account.
It never merges on a subject or display name. Ambiguous references, different senders and
unresolved/out-of-order parents remain isolated rather than silently merging client context.

## Preview, body and attachments

Preview text is stored separately; authoritative body_text stays empty until full retrieval
completes. Inbox and owner read responses label previews. AI summary/generated replies refuse
preview-only messages; owner-dictated drafts remain possible and send governance is unchanged.
HTML previews are validated but not rendered or retained as active markup.

Signed URLs are AES-256-GCM encrypted, bound to account/event, using a domain-separated HKDF
key from OS_SESSION_SECRET. They are absent from message/asset metadata and API responses.
Expiry is conservative: event time or receipt, whichever is earlier, plus one day. Retries do
not renew it. Already expired locators are discarded; completion clears ciphertext; receipt
maintenance and expireMailLocators purge expired candidates. Session-key rotation must account
for any pending locators; do not rotate it as part of setup.

Jobs start blocked_policy (or expired). No HTTP client/cron is wired to signed URLs.
The tested content-worker/store ports use leases/tokens, bounded retries, expiry checks,
atomic body/asset completion and stable private-storage keys. The retrieval port requires
exact verified hostnames, all-public DNS results, pinned connection IP plus TLS/SNI hostname
validation, no redirects, bounded bytes/time, and verified media decoding. Generic fetch
alone does not satisfy DNS pinning. Magic-byte MIME checks and sanitized filenames protect
attachment metadata. Bytes are never executed, rendered inline, or automatically sent to AI.
Durable availability uses private storage references and digests, never a signed URL.

**Remaining provider facts:** exact signed-download host constraints and body response media/
schema. A redacted valid response/official contract is needed, without any real token. Then
we can supply the production pinned transport, decoder and existing private storage backend.
Do not invent an allowlist or let an email supply one. Archive/send/outbound remain disabled.

## Exact URL and environment names

Production target to paste **after authorized deployment and readiness checks**:

https://www.maxpromo.digital/api/channels/mail

Derived from packages/config/domains.ts canonical hub origin and the actual App Router
route. Production GET/HEAD405 and unauthenticated POST401 verified on2026-10-23. This is
a deployed locked receiver, not active mailbox ingestion.

Required names for inbound acceptance (production names inventoried with Vercel env ls,
2026-10-22; values were not printed or changed):

- EMAIL_PROVIDER — literal lowercase hostinger selects the adapter; unset leaves receipt disabled.
- HOSTINGER_WEBHOOK_SECRET — the exact one-time provider-issued token, canonical new name.
- OS_SESSION_SECRET — existing valid session/encryption key; preserve its current value.
- NEON_DATABASE_URL or DATABASE_URL — existing production resolver, only after migration approval.

Vercel Production has OS_SESSION_SECRET and NEON_DATABASE_URL, plus existing
OS_AGENT_SECRET/OS_AGENT_ALLOWED_ACTORS and the legacy Telegram variables. Marcel added
EMAIL_PROVIDER=hostinger and restored the model key/credit. HOSTINGER_WEBHOOK_SECRET is
now present in Production and was included in the refreshed deployment. No duplicate DATABASE_URL is needed.
Code deployment requires neither missing mail variable: absence deliberately locks receipt.
Do not set a placeholder webhook secret or rotate the existing session key.

Do not keep the old HOSTINGER_MAIL_WEBHOOK_SECRET alias: it has been replaced. This task
does not read or modify either production secret. No duplicate variable is supported.
HOSTINGER_MAIL_API_BASE is not needed: the REST adapter pins the official API origin.
HOSTINGER_MAIL_API_TOKEN is not required or consumed for webhook receipt; the existing
disabled REST adapter receives a token explicitly and no real token is requested or used.
Evidence uses MAXPROMO_EVIDENCE_MODE and EVIDENCE_DATABASE_URL only, with existing isolation guards.

## Exact remaining owner actions

1. Completed: locked infrastructure, reviewed migrations and the separately approved single
   mailbox binding. Owner Inbox reports configured:true/threads0. Marcel installed
   HOSTINGER_WEBHOOK_SECRET privately; the refreshed runtime passed presence verification.
   No additional repository approval or SQL work is needed.
2. For later full-content activation, supply the missing signed-download host/media contract or redacted response evidence.
   No API token or actual signed URL needs to be placed in chat. Authorize storage/retention
   activation once the durable backend is verified. Safe preview receipt does not require
   full-content downloading; leave jobs blocked_policy and never present previews as complete.
3. After mailbox-binding readiness, configure Hostinger mailbox info@maxpromo.digital, HTTPS URL
   above, event message.received. Prefer a disabled webhook during setup. If creation cannot
   remain disabled, stop before creation and agree a controlled setup window; retry guarantees
   are not assumed. Copy the one-time token securely; never regenerate casually.
4. Put only the genuine HOSTINGER_WEBHOOK_SECRET in the intended Vercel environment via
   its secret settings and authorize the resulting deployment. EMAIL_PROVIDER is already
   configured; do not duplicate it. Confirm the existing session
   key and account/migrations are ready; no DNS change or API-token rotation is needed.
5. Use Hostinger Test; require HTTP 200 and inspect Recent deliveries timestamp/status/
   duration. Repeat the same delivery fixture and verify one message/job/notice. Verify
   wrong token/mailbox are rejected. Only then enable live receipt deliberately.
6. Telegram: locate/restore the existing restricted Mission Control Gateway installation.
   This machine has no .openclaw directory, openclaw command or discoverable plugin source.
   Verify its notifyActors schema, select only the existing owner telegram-6090014884/profile
   owner/max-agents lane, keep dmPolicy allowlist and groups disabled. Do not create another bot.
   Restart explicitly with the documented openclaw gateway restart, verify port 18789;
   documented fallback is the OpenClaw Gateway scheduled task. Prove one notice delivered
   once and an unauthorized actor denied. No guessed JSON/configuration is provided.

Rollback: disable the Hostinger webhook without deleting it, unset provider selection, stop
content workers, keep audit/metadata for reconciliation, then roll application back. Never
drop mail records as a code rollback. The provider mailbox remains the transport/source mail.

**Current verdict: SAFE TO PRESS HOSTINGER TEST.**
Marcel installed HOSTINGER_WEBHOOK_SECRET privately. Production deployment
dpl_3eb5eCWCpihA87C9XkLdyzrPE59b was built afterward from ff3fefc, passed presence/provider
assertions without printing values and was promoted. Public405/401 and owner OS checks pass;
one enabled account and zero mail activity remain. Test and controlled acceptance remain
subsequent owner steps; the agent never used the genuine secret in a request.
Full-content constraints remain a separate later activation gate; preview receipt is supported.
See the [production preparation report](../reports/email-production-preparation-2026-10-22.md).
