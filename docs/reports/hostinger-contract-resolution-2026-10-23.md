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
- Rendered Inbox 31 assertions. Full `npm run verify` exit 0 (all 29 gates incl. typecheck,
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

## 8. Remaining: controlled real email

Not yet sent: the agent's attempt to send from the connected Gmail session was refused by the
session permission policy, so the owner sends it. Expected: one mail.messages row, one thread,
classification lead/needs reply (subject contains "automation enquiry"), preview-only body,
possible CRM link only if the sender already exists, no new lead, no outbound, no Telegram.
