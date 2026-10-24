# Hostinger webhook contract resolution — independent review

2026-10-23 · Claude Code takeover of the Codex Hostinger activation work.
Supersedes the retry guidance in [second Test](hostinger-second-test-2026-10-23.md) and the
connectivity-sample design in [first Test](hostinger-first-test-2026-10-23.md).

## 1. Evidence that was already in production but unrecorded

The c1bab75 structural diagnostics captured two further genuine Hostinger Tests that the
earlier reports never recorded (Vercel request log, deployment dpl_CUufN295SyNCE1cefW2ZvRNhs2TJ):

| UTC | Request ID | Result |
| --- | --- | --- |
| 2026-10-23 10:55:43 | vstgf-1792752943410-b18aac1f3521 | 400 validation/invalid_event_id |
| 2026-10-23 12:35:16 | fxp9z-1792758916486-1ce4a047081d | 400 validation/invalid_event_id |

Both carried an identical structure (types and lengths only, no values were logged):

| Field | Observed |
| --- | --- |
| envelope | id string 36 (valid UUID shape), event string 16, timestamp string 29/30, no unknown keys |
| data.eventId | **string, length 0** |
| data.mailboxAddress | string 21, role **configured** (info@maxpromo.digital) |
| messageId / inReplyTo / references | string 29 / empty / empty array |
| subject / from / to / cc | 21 / 18 / 1 string / empty |
| date / plainBody / htmlBody / bodyUrl | 31 / 32 / empty / **empty** |
| attachments | empty array; no test/isTest/is_test markers; exact-sample matcher false |

Conclusion: Hostinger's Test is a normal authenticated `message.received` for our mailbox
that has **no mailbox message behind it**, so it carries an empty `eventId` and no body URL.
It never resembled the displayed documentation sample, which is why the exact-sample bypass
(850b427) could not have matched real traffic.

## 2. Contract research

Hostinger's public OpenAPI (api.mail.hostinger.com/openapi/openapi.json), SDKs and Agentic
Mail docs define webhook management only; they do not specify the inbound payload, the
eventId format or Test behaviour. The only contract is the owner-supplied description:
eventId is an opaque mailbox-message identity, stable across retries. No character set is
guaranteed. The prior grammar `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$` was invented.

## 3. Review findings and decisions

1. **Invented identifier grammar (fixed).** Delivery id and eventId are now opaque bounded
   strings: string, ≤256 UTF-16 units, no C0/C1 controls or lone surrogates. They are only
   ever SQL parameters, AES-GCM AAD and attachment keys; storage keys are SHA-256 hashed.
   No path/URL interpolation exists. Security comes from bounds, types and parameterization.
2. **Empty eventId (new handling).** It cannot be deduplicated as a mailbox message
   (provider_message_id would collide), so it is never ingested. After authentication,
   envelope validation and provider/session configuration, the route verifies the mailbox
   binding read-only and returns `200 {ok:true,ingested:false}`, logging
   `mail.webhook.acknowledged` with the delivery id. This is not a Test discriminator; it is
   the only safe handling of an event without identity. Residual risk recorded as risk 101.
3. **Content-level refusals (fixed).** The parser refused whole receipts for content quirks.
   A 400 loses the message and repeated failures auto-pause the Hostinger webhook for every
   later message. Now only the envelope (event, ids, mailbox, timestamp) can produce 400.
   Content is normalized with fixed degradation codes, for example:
   - `"Doe, John" <j@x.com>` was refused as invalid_address; now parsed (quoted names, comments).
   - malformed Message-ID/In-Reply-To/References entries are dropped individually.
   - subject >998 and preview >200 code points are truncated without splitting surrogates.
   - filenames are sanitized (`..`, separators, `<>|?*"`, trailing dot/space) not refused.
   - attachment metadata above 20 MB is retained; the 20 MB limit belongs to download.
   - an unverifiable bodyUrl/fileUrl is discarded (never stored). SSRF policy is unchanged:
     fetchSignedContent still revalidates, requires an explicit host allowlist, public DNS
     and a pinned transport; downloads remain disabled.
   - NUL/controls/lone surrogates are cleaned so Postgres jsonb can never refuse a receipt.
4. **Ambiguous sender (new).** An unparseable or multi-address From becomes
   `unknown-sender@sender.invalid` (RFC 2606 reserved TLD): it cannot match a lead/client
   (proven against a lead with an empty email), its thread hints are cleared so it never
   joins an existing thread, and the Inbox shows "Unknown sender".
5. **Exact-sample bypass (removed).** hostingerConnectivity.ts and its tests are deleted.
   The documented sample now gets the correct answer: 400 wrong_mailbox.
6. **Diagnostics (kept, decoupled).** Version 2 structural metadata for rejected envelopes:
   fixed field names only, unknown keys counted not named, URL categories, identifier flags.
   Accepted receipts log only `created`, delivery id and degradation codes.
7. **Kept as sound:** constant-time Bearer verification, auth before body, bounded streaming
   body, rate limit, transactional `mail.accept_hostinger` with advisory lock, delivery →
   event binding, same-sender uncontested threading, sealed expiring locators, owner-only
   Inbox API, no model/lead/outbound/Telegram side effects on receipt.
8. **Inbox (small fixes).** List rows now show a preview snippet; preview text is searchable
   (previously every preview-only message was unsearchable by content).

## 4. Verification

- Native mail tests 39/39 (10 rewritten parser tests on the observed wire shape and hostile cases).
- Actual route proof 67 checks: observed Test → 200 ingested:false with 0 writes and a read-only
  binding check, 503 when binding/config missing, 401 auth cases log nothing, envelope 400 codes,
  concurrent duplicate delivery creates once, hostile content accepted with codes, logs contain no
  addresses, URLs, tokens, subjects or driver errors.
- Mutation proofs 6 caught: evidence gate, Bearer, mailbox binding, diagnostic privacy,
  no-identity ingestion, unknown-sender threading.
- Isolated evidence SQL 43/43 (new: opaque ids round-trip/dedupe, unknown sender never links,
  >20 MB metadata retained; migration replay preserves rows).
- Rendered Inbox 31 assertions. Full `npm run verify` exit 0 (every gate (29 at the time) incl. typecheck,
  lint, both builds, release-model postbuild).

## 5. Production

- Read-only Neon console SELECT, project twilight-boat-66649706, branch br-floral-lab-alnv2a1o:
  PostgreSQL 17.11; mail tables 9, indexes 18, functions 2 (accept_hostinger, complete_content),
  11 foreign keys, 15 PK/unique, no custom triggers; exactly one account
  hostinger:info@maxpromo.digital / hostinger / enabled; messages, threads, deliveries, events,
  jobs, assets, links, audit all 0. Deployed accept_hostinger body md5
  705fe7ee1e48ede3ac417eb0b9bd1342 equals migration 0014. No migration was needed.
- Commit 016ceb5 released through main → Vercel Git: dpl_GQwE9b3vtfvKRFcMt1EdwLrRSNvy,
  Ready/Production, serves www.maxpromo.digital; health ok/database ok/release 016ceb5.
  Receiver GET/HEAD 405; POST without auth, Basic or wrong Bearer 401; /de and /os/login 200.
- No secret used or rotated, no Hostinger contact, no Test, no mail sent or fetched.

## 6. What the next owner Test proves

Expected: HTTP 200 `{"ok":true,"ingested":false}` in Hostinger's Recent deliveries, plus a
`mail.webhook.acknowledged` log line. That proves genuine Bearer authentication, provider/
session configuration, the real wire shape passing the parser, and production database
reachability with the enabled binding. It does not prove ingestion; the controlled real
email after it does. If it returns anything else, the log line names the exact stage.

## 7. Hostinger Test result — GREEN

2026-10-23 13:34:32.853Z, one Test via the owner-authorized Hostinger Mail connector
(webhook 01a1672e-5ac4-71ba-b7c6-21fc616252ae, active, info@maxpromo.digital, message.received,
exact production URL). Hostinger reported httpStatus 200, success true.
Vercel request 7jkmm-1792762472853-50e6209c3be8 on dpl_GQwE9b3vtfvKRFcMt1EdwLrRSNvy: POST 200,
`{"event":"mail.webhook.acknowledged","disposition":"no_mailbox_identity","degraded":[]}`.
No degradation codes: the real wire (Message-ID, From, dates) parses cleanly.

Read-only production counts afterwards: mail.messages/threads/deliveries/events/content_jobs/
content_assets/business_links/action_audit all 0; chat.events 0; os_jobs, os_followups,
os_files 0; os_leads 5, os_clients 2, os_angebote 1, os_invoices 2 (pre-existing baseline).
The synthetic Test created no mail, thread, CRM object, job, notice or action.

## 8. Controlled real email (owner-sent)

Planned as a no-attachment test. Marcel sent it from an external Yahoo address; it also carried
one PDF, which made it a more useful test than planned (section 9).

## 9. First real inbound mail — evidence

**Provider (Hostinger Mail connector, read-only).** INBOX UID 45, date 2026-10-23T13:41:37Z,
from akwe.marcel@yahoo.com to info@maxpromo.digital, subject
`MXP-INBOUND-PROOF-20261023 automation enquiry`, RFC Message-ID present (mail.yahoo.com),
no In-Reply-To, plain text ~111 bytes, one attachment `abbaland.pdf` application/pdf
1,548,450 bytes. The one webhook (01a1672e…, active, message.received, exact production URL)
did not change.

**Webhook (Vercel request logs).** Exactly one POST /api/channels/mail since the Test:

| Field | Value |
| --- | --- |
| request | dm56h-1792762908253-322021585cdf, 2026-10-23T13:41:48.253Z, 10.7 s after mailbox arrival |
| deployment | dpl_GQwE9b3vtfvKRFcMt1EdwLrRSNvy (release 016ceb5) |
| response | 200 (returned only after `mail.accept_hostinger` committed) |
| log | `{"event":"mail.webhook.accepted","created":true,"deliveryId":"e4d1cd84-8ebd-5685-8c8b-1f9e4731910c","degraded":[]}` |

A non-empty eventId was present: a 64-character lowercase hex string, unlike the empty Test
value. `degraded: []` means From, Message-ID, dates, filename and sizeBytes all parsed with no
normalization. Every request from 13:41Z to 14:45Z was scanned (each window under the 100-row
cap, so complete): no second webhook POST (no Hostinger retry), and no POST to contact,
newsletter, max-agent, os/agent, os/mail/actions, send-angebot or send-invoice. The only
other non-GET was a scanner's POST /xmlrpc.php → 404.

**Owner Inbox API and UI (authenticated production browser, GET only).** configured true,
exactly one thread (ba40ffeb…, provider_thread_id `hostinger:<eventId>`, account
hostinger:info@maxpromo.digital), one message (7e70435c…): sender akwe.marcel@yahoo.com,
recipients [info@maxpromo.digital], cc [], event_at/received_at 13:41:48.198Z, email_date
13:41:37Z, is_read false, body_state `preview`, body_text empty, preview = the 110-character
body. Classification `lead`, needs_reply true, waiting/archived/trashed false, business links
none. Attachment metadata: filename `abbaland.pdf`, size 1,548,450 (identical to the provider),
contentType `application/octet-stream` (provider MIME deliberately untrusted), id `<eventId>:0`.
The response contains no fileUrl, bodyUrl, URL, nonce, ciphertext or lease token.

Rendered: list row shows Unread, sender, subject, preview, "23 Oct 2026, 15:41", lead, Needs
reply. Detail shows From/To, no Cc row (empty), the preview label "Full content has not been
retrieved", the plain-text notice, the attachment as `abbaland.pdf · 1513 KB · application/
octet-stream` with "Metadata only. Attachment downloads are not enabled", no link, img or
iframe. Filters: Inbox 1, Unread 1, Needs reply 1, Waiting 0, Clients 0, Leads 0, Billing 0,
System 0, Archived 0. Search by proof code, by sender and by preview word finds it; nonsense
finds nothing. At 390 px wide: no horizontal scroll, list → detail with Back. Nothing was
marked read, drafted or archived.

**Leads filter = 0 is the documented design, not a fault.** Clients/Leads views require an
owner-confirmed CRM link (email-channel.md, "Inbox and owner experience"). The sender is no
existing lead or client, so no link was suggested, and the `lead` classification shows as a
chip. Whether a new enquiry should also appear under Leads is a product decision for Marcel.
The code was not changed.

**Classification path.** Rule-based only: `classifyMail` in normalization.ts, a fixed regex
order (system → billing → routine → lead → other) over subject plus preview. "enquiry" and
"automation" in the subject matched `lead`/needsReply. No model, no confidence score, no
fallback. Summary and AI reply refuse preview-only messages.

**Business objects (owner OS APIs).** leads 5, clients 2, quotes 1, invoices 2, jobs 0:
unchanged from baseline. None of them contains the sender. No lead or client was created.
`accept_hostinger` only *suggests* links to existing records with the same address, and
none matched.

**Side effects.** Hostinger Sent: newest item 07:26Z, nothing after arrival. No outbound route
was called. Telegram is sent only from the contact, newsletter and max-agent routes, and none
was called. Email attention is a pull notice read by the WhatsApp gateway, and the gateway is
OFF (/api/channels/whatsapp 503). No model call is on the receipt path. Receiver still
GET 405 and unauthenticated POST 401. Health ok, database ok, release 016ceb5.

**Body and attachment security.** Only `plainBody` (≤200 code points) is stored. htmlBody is
never read or stored. The UI renders plain text in a `<p>` with no innerHTML. A bodyUrl or
fileUrl only survives if it passes the syntax check, and then only as an AES-256-GCM sealed
locator bound to account:eventId, never in message metadata or a response. No production
code calls `fetchSignedContent`, and no worker, cron or allowlisted host exists, so nothing was
fetched. Downloads stay disabled, and SSRF policy is unchanged.

**Direct production SQL (owner-approved, read-only).** Two SELECT-only queries ran in the
Neon console (maxpromo-automation / production br-floral-lab-alnv2a1o / neondb), each inside
`BEGIN READ ONLY … ROLLBACK`. They printed lengths, key names and booleans only; no locator,
URL or credential was shown. The first was blocked by the session permission policy until
Marcel approved it explicitly.

| Fact | Production |
| --- | --- |
| counts | accounts 1, threads 1, messages 1, deliveries 1, events 1, content_jobs 1, content_assets 1, business_links 0, action_audit 0, chat.events 0 |
| delivery | e4d1cd84-…, provider_event_id length 64 = message provider_message_id, linked to the message; event_at 13:41:48.198Z, accepted_at 13:41:49.313Z |
| event | one `received`, thread ba40ffeb…, created 13:41:49.313Z (same transaction) |
| message | RFC Message-ID `<…@mail.yahoo.com>` stored, in_reply_to null, references = one Yahoo `.ref` id (persisted, matched nothing), body_state preview, body_text 0, preview 111 chars, unread, attachments jsonb has no URL |
| content job | blocked_policy, attempts 0, no lease, expires 2026-10-24T13:41:48.198Z; locator keys exactly ciphertext/nonce/tag/version, version 1, ciphertext 1,688 base64 chars, no plaintext URL |
| asset | key `<eventId>:0`, abbaland.pdf, 1,548,450 B, application/octet-stream, **pending**, storage_ref null, sha256 null |
| business objects | os_leads 5, os_clients 2, os_angebote 1, os_invoices 2, os_jobs 0, os_followups 0, os_files 0: baseline |
| approvals | os_approvals 5, all `outreach.send` from 2026-10-08/09; 0 since 13:41Z |
| since 13:41Z | os_audit, os_activities, os_agent_results, os_incidents, chat.messages, chat.leads_telegram all 0 |
| live keys | deliveries PK(account_id, delivery_id); messages UNIQUE(account_id, provider_message_id); threads UNIQUE(account_id, provider_thread_id); content_jobs UNIQUE(message_id); content_assets UNIQUE(message_id, attachment_key); events PK(id); action_audit UNIQUE(approval_id); 15 PK/unique in total |

Production matched the expected state exactly; nothing needed reconciling. The 1,688-character
ciphertext shows Hostinger did send signed body/file URLs that passed the syntax check. They
exist only sealed, bound to account:eventId, and expire with the job. No allowlisted host,
transport or worker exists, so nothing can open them until the download contract is verified.

**Verdict: HOSTINGER EMAIL OS GREEN.** All 19 completion conditions are proven by provider,
log, owner-API/UI and direct database evidence.

**Dedupe and retry.** Hostinger did not retry this delivery, so the proof is the transactional
function plus the isolated real-SQL proofs: 12 concurrent duplicate deliveries commit one
message; one event via a different delivery is not ingested twice; a delivery id cannot be
rebound to another event; opaque ids dedupe exactly once; subject-only and cross-sender
references never merge. prove:email-channel exit 0. prove:email-storage passed 43/43 on 2 of 4
runs. The other 2 failed on connection to the isolated evidence database (`evidence database
unavailable`, Neon pooler), never on an assertion.

**Cleanup.** No activation-only artifact remains: the exact-sample bypass was deleted in 016ceb5.
The structural diagnostics for rejected envelopes are value-free and decide incidents, so they
are kept. No code change was needed. Nothing was committed apart from this documentation.
