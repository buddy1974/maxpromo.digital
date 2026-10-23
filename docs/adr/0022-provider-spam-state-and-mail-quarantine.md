# ADR-0022 — Provider spam state and mail quarantine

Status: **accepted (owner correction 2026-10-23); implemented in the repository; migration 0016
applied to production 2026-10-23; application release pending the owner push.** Extends ADR-0020 (email is a governed OS
channel). Evidence: [provider spam investigation](../reports/hostinger-provider-spam-2026-10-23.md).

## Context

On 2026-10-23 at 15:58Z Hostinger received an invoice-lure email and filed it into
`INBOX.Junk` (IMAP special-use `\Junk`). Maxpromo OS showed it in the Inbox as `billing` and
**Needs reply**, so it also reached attention, the brief and notices.

Root cause, from the provider, the production logs and the published contract:

1. `message.received` fires for mail Hostinger files into Junk (production log 15:58:24Z, accepted).
2. The webhook payload has no folder, junk or spam field. Two genuine deliveries showed exactly
   the 14 documented `data` fields with `unknownKeys: 0`. The public OpenAPI has no payload schema,
   no folder filter on webhooks, and no spam/junk term at all.
3. The OS never asked the provider where the message was. The REST folder API exposes it, but
   that client was never wired (no API token in production).
4. `classifyMail` matched `Rechnung` and returned `billing` with `needsReply: true`. Nothing
   suppressed a `no-reply@` sender or an HTML attachment.

So the provider signal was not dropped by a parser. It never travels on the webhook, and nothing
fetched it.

## Decision

1. **Provider spam state is the primary, deterministic upstream signal.** After each receipt (and
   on Inbox load), a bounded reconciler reads the provider's folder through the REST API:
   - the folder list, with meaning taken from IMAP special-use (`\Junk`, `\Inbox`, `\Trash`),
     never from localized names;
   - a `Message-ID` header search, Junk first.

   It reads metadata only: never a body, source, attachment or signed URL. The port exposes
   `folders` and `search` only, so it cannot move, flag, send or delete. It runs in `after()`,
   so receipt never waits on it or fails because of it. It is a no-op until the owner connects
   `HOSTINGER_MAIL_API_TOKEN` and `HOSTINGER_MAILBOX_RESOURCE_ID`.
2. **Quarantine is a thread state, not a classification.** `mail.threads.quarantine` takes one of
   `provider_junk`, `suspected_phishing`, `owner_spam` or `blocked_sender`. A quarantined thread is
   kept out of:
   - Inbox, Needs reply, Billing, Leads and Clients (it appears only under **Spam**);
   - attention, the morning brief and notices (`emailAttention`);
   - business actions: reply draft, send (including an approval prepared earlier), link, save as
     lead and model summary all refuse;
   - thread joining: quarantined mail always opens its own thread and never raises another one.

   Full content arriving later cannot raise its attention either. Nothing is ever deleted.
3. **Provider state is strong but not final.** `mail.apply_provider_state` quarantines on Junk
   unless Marcel's `owner_verdict` is `not_spam`. If the provider moves the mail back to the Inbox,
   only a `provider_junk` quarantine is lifted.
4. **Owner controls** (`email.spam`, GREEN, local, audited):
   - **Not spam** releases the thread and restores reply attention for reply classes.
   - **Mark as spam.**
   - **Block sender** (two-step). It also quarantines that sender's earlier undecided threads.
     It refuses an unidentified sender, the own domain, and known leads or clients.

   Hostinger is unchanged by all three; provider mutations remain disabled (ADR-0020).
5. **Application signals only where they add value** (`lib/mail/risk.ts`). They are structural,
   use no model and name no sender:
   - an active attachment (HTML, SVG, script, executable or disk image), or a disguised double
     extension, from a sender with no CRM relationship → `suspected_phishing` at receipt;
   - an automated sender (`no-reply@`, `mailer-daemon@`, …) never needs a reply.

   These cover provider misses and the window before provider state is known.
6. **Observability.** Accepted receipts log `unknownDataKeys` as a count, never key names. If
   Hostinger adds a folder field, it becomes visible without any payload content reaching logs.

## Rejected

- Hard-coding the sender, domain or subject of the example message.
- Trusting the provider classification irreversibly (no "not spam" override).
- Fetching the raw source to read `X-Spam-*` headers: it is a content fetch, and the folder is
  more authoritative.
- Inventing an undocumented webhook spam field.
- An AI spam classifier as the primary signal.
- Retroactively quarantining production rows inside the migration: that is a data change. The
  reconciler and Marcel's Spam action correct existing mail.
- Running the provider lookup inside the receipt transaction.

## Consequences

Security boundaries are unchanged:
- no URL or attachment fetching;
- downloads stay disabled;
- the REST reader is refused in evidence mode;
- provider errors are never logged.

Until the owner connects the read-only REST credentials, provider Junk is not detected
automatically. Structural phishing and the owner Spam actions still work, and the Inbox says
"Hostinger spam check not connected" rather than implying protection.
