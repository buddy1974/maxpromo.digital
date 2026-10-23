# Provider spam propagation — investigation and fix

2026-10-23 · owner correction: the example message was already in Spam at Hostinger.
Decision record: [ADR-0022](../adr/0022-provider-spam-state-and-mail-quarantine.md).

## 1. What Hostinger assigned

Hostinger Mail connector, read-only, mailbox `info@maxpromo.digital`:

- **Folders:** `INBOX` (`\Inbox`), `INBOX.Junk` (`\Junk`, 3 messages), `INBOX.Trash`,
  `INBOX.Sent`, `INBOX.Drafts`, `INBOX.Notes`.
- **The message:** `INBOX.Junk` UID 35, 2026-10-23T15:58:15Z, unseen.
  - Subject: "(#B2NDI4SR) Ihre Rechnung für die Veranstaltung …".
  - From display name "KRABAT-Mühle", sent from a `no-reply@` address on an unrelated `.be`
    domain.
  - One attachment, `2026-KV-0141_…_.html`, 1,815 bytes.

## 2. Does `message.received` carry spam or folder state?

**No.**
- **Production log:** request `pgv4l-1792771104164`, 15:58:24Z (9 s after arrival).
  `mail.webhook.accepted`, `created: true`, `degraded: []`. So Hostinger fires the event for mail
  it files into Junk.
- **Structure diagnostics:** recorded for two genuine Hostinger deliveries (10:55Z and 12:35Z).
  The `data` object had exactly the 14 documented fields (eventId, mailboxAddress, messageId,
  inReplyTo, references, subject, from, to, cc, date, plainBody, htmlBody, bodyUrl, attachments)
  and `unknownKeys: 0`.
- **Public OpenAPI:** `https://api.mail.hostinger.com/openapi/openapi.json`, 152 KB.
  - No webhook payload schema.
  - Webhook create/update accepts only `events: ["message.received"]`, with no folder filter.
  - Zero occurrences of "spam" or "junk".

## 3. Another endpoint that exposes the state

**Yes: the REST folder API.**
- `GET /folders` gives `specialUse` (`\Junk`).
- `POST /folders/{folder}/messages/search` with `header: "Message-ID:<…>"` locates the message.
- Both are metadata only.
- `/messages/{uid}/source` would expose `X-Spam-*` headers, but that is a content fetch, so it
  is not used.

## 4. What we receive and store

- **Received:** the 14 fields above.
- **Stored:** the sanitized subset (no htmlBody, no URLs except sealed locators). No folder, no
  spam score, no headers beyond Message-ID / In-Reply-To / References.

## 5. Where the signal was lost

It was never on the webhook, and the OS never asked the REST API:
- `HostingerMailProvider` existed with `folders`/`search`, but nothing was wired;
- production has no `HOSTINGER_MAIL_API_TOKEN`.

## 6. Why it became `billing` / Needs reply

`classifyMail` is a fixed regex order over subject and preview: system → billing → routine →
lead. `Rechnung` matched `billing` with `needsReply: true`. Nothing considered:
- the `no-reply@` sender;
- the HTML attachment;
- the absence of any CRM relationship.

`emailAttention` then surfaced it on `/os`, in the brief and in notices.

## 7. Fix (summary)

- **Provider state reconciler:** read-only, after the response, special-use folders,
  Message-ID search, bounded retries.
- **Migration 0016:**
  - provider state per message;
  - quarantine and owner verdict per thread;
  - `mail.sender_blocks`;
  - updated `accept_hostinger` and `complete_content`;
  - new `apply_provider_state`.
- **Structural signals:** active attachment, double extension, automated sender.
- **Quarantine everywhere:**
  - Inbox, filters and search;
  - attention, brief and notices;
  - draft, send, link, lead and summary refusals;
  - no thread joining.
- **Owner Inbox:** Spam view, reason, Hostinger folder, signals, Not spam / Mark as spam /
  two-step Block sender.

## 8. Verification

- **Unit tests:** 51/51 (new `risk` and `providerState` suites; the ingestion lure scenario).
- **Real SQL on the isolated evidence database:** 56/56.
  - 13 new: Junk quarantine, attention exclusion, the owner verdict wins, the provider release,
    receipt-time phishing, no thread joining, known sender exempt, blocked sender, content
    cannot raise attention, CHECK constraints, nothing deleted.
  - Migration replay ×2 identical.
- **Route proofs:**
  - webhook 71: each created receipt schedules one provider check; the unknown-key count is
    logged without names or values;
  - Inbox API 17;
  - owner 24: quarantine refusals including a pre-approved send, the spam decision and block
    guards;
  - notices 10: includes a mutation that removes the quarantine predicate;
  - UI 41: Spam view, Inbox/Needs reply/Billing exclusion, detail, German, two-step block.
- **Browser** (local production build, evidence mode, synthetic webhooks shaped like the real
  message):
  - the Inbox showed only the genuine enquiry;
  - Spam showed "Von Hostinger als Spam eingestuft" and "Phishing-Verdacht …";
  - the detail showed "Hostinger-Ordner: INBOX.Junk", with no reply form and no links;
  - Not spam → Inbox, then Mark as spam → Spam, then Block sender (two-step) → `blocked_sender`;
  - `/api/os/attention` contained none of the three;
  - at 390 px: 387 px viewport, no horizontal scroll.

  Fixtures were removed afterwards (0 rows).

## 9. Remaining

- The REST reader needs the owner's Hostinger API token and mailbox resource id in Vercel.
  Until then, provider Junk is not detected automatically (risk 114).
- The production message (UID 35) stays `billing`/Needs reply until the reconciler runs within
  its 14-day lookback, or Marcel presses Spam (risk 115).

## 10. Closure status (2026-10-23 evening)

- Migration 0016: **deployed** to production and verified.
- Application code: **done, not released** (push blocked by Bureau migration 0002, risk 116).
- Reconciler credentials: **absent** in production (owner, risk 114). With both set before the push,
  the first `/os/inbox` load quarantines the Junk message automatically.
- Junk message: unchanged (`billing`, Needs reply, `unverified`); no new mail since 13:41Z; no outbound.

## 11. Reconciler review (2026-10-23, closure continuation)

- **Credentials:** `hostingerStateReader` reads `HOSTINGER_MAIL_API_TOKEN` and
  `HOSTINGER_MAILBOX_RESOURCE_ID` (must match `^AC[A-Za-z0-9]+$`); either missing, or evidence
  mode, returns `null` and nothing runs.
- **Endpoints:** `GET /api/v1/mailboxes/{id}/folders` and
  `POST /api/v1/mailboxes/{id}/folders/{folder}/messages/search` with
  `{header:"Message-ID:<…>", since}`; Bearer token; 8 s timeout; redirects refused; no cache.
- **Read-only:** the reader object exposes only `folders` and `search` (asserted in tests);
  send/move/flag are unreachable from it.
- **Mapping:** special-use `\Junk` → `provider_junk` quarantine (unless the owner said not spam);
  `\Inbox` → recorded, lifts only a `provider_junk` quarantine; `\Trash` → recorded; not found →
  retried up to 5 times, then `not_found` (no quarantine).
- **Failures:** an API error, timeout or malformed response (strict response validation) ends the
  pass with `failed: true`, changes nothing further and logs only counts. Missing credentials →
  no-op.
- **Legitimate mail:** never deleted. It is hidden from the Inbox only if Hostinger itself files it
  as Junk, if it carries an active attachment from a sender who is no lead or client, or if Marcel
  blocks the sender; all of it is visible under Spam with "Not spam".
- **Before reconciliation:** provider Junk can carry `billing` / Needs reply for the seconds until
  the after-response check, or until the next Inbox or attention view if that check failed. Mail
  never creates leads, approvals or agent actions automatically.
- **Window:** messages received in the last 14 days with `provider_state='unverified'`, 10 per pass,
  newest first.
- **Hardening in this run:** the check now also runs after `GET /api/os/attention`.

## 12. Production activation (2026-10-23 22:50 UTC)

Token stored by the owner; production redeployed. The first Inbox view reconciled 3 messages and
quarantined 1: the Rechnung message (Hostinger `INBOX.Junk`, uid 35) is now `provider_junk`,
needs_reply false, shown only under Spam with its Hostinger folder; nothing deleted, linked or sent.
The other two messages were confirmed in `INBOX`. Full evidence: reconciliation §22.
