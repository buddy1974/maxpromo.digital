# ADR-0023 — Email OS workspace, outbound identity and full content

Status: **accepted (overnight product run 2026-10-24, under the owner's authority for that run);
implemented and verified in the repository; production migration 0017 and release recorded in
[the product completion ledger](../governance/product-completion-ledger.md).** Extends ADR-0020
(email is a governed OS channel), ADR-0021 (control planes) and ADR-0022 (provider spam state).

## Context

After ADR-0022 the Hostinger transport was proven, but the Email OS was not a product:

- only a 200-character webhook preview was stored; the body was never fetched;
- every send and archive was refused by the runtime ("activation disabled");
- there was no compose, reply-all, forward, CC/BCC, signature or outbound record in a thread;
- business context was one line; follow-up state did not exist;
- "Leads = 0" appeared broken whenever an enquiry existed that was not yet a CRM lead;
- the OS assistant was an ungrounded chat that could invent business facts.

Hostinger's own API (OpenAPI 1.2.2, fixed host `api.mail.hostinger.com`, Bearer token, the same
token the spam reconciler uses) provides what was missing without the signed download URLs that
kept full content off: `GET …/messages/{uid}/text` (plain and HTML parts), `GET
…/messages/{uid}/attachments/{id}` (bytes), and `POST …/send` (text + HTML, display name, CC/BCC,
`inReplyTo`/`forwardOf` by folder + UID, copy saved to `INBOX.Sent`). The spam reconciler already
records each message's folder and UID.

## Decision

1. **Conversation → business context → actions.** The Inbox is a workspace: views (work /
   business / mailbox), the conversation timeline with Maxpromo's own replies in it, and a context
   panel that starts with the next step (lib/mail/context.ts). One conversation state model
   (`needs_reply`, `customer_replied`, `follow_up_due/overdue`, `waiting`, `no_next_step`) is shared
   by the Inbox, attention, the briefing and Ask Max.
2. **Lead semantics are explicit.** *Lead* = owner-confirmed CRM link; *possible match* = a lead or
   client record whose email equals the sender, labelled with its kind; *potential lead* = an
   enquiry with no CRM record. Each has its own label; the Leads view shows all three.
3. **Full text from the provider API only.** After the spam check, a bounded pass fetches the text
   of recent previews by folder + UID (max 10, 3 attempts, 1 MB response cap, strict response
   validation). HTML is converted to plain text on the server and never rendered. Quarantined mail
   is never fetched. Full text may raise attention only for an enquiry or bill from a mailbox a
   person reads (marketing text is full of "urgent").
4. **Attachments are downloads, never renderings.** Owner session, same origin, on click only.
   Bytes stream from the provider host with a hard cap (declared size + 64 KB, max 25 MB), are
   served as `attachment` with a fixed Content-Type, `nosniff` and a sandbox CSP, are not stored,
   and each download is audited. Active types (HTML, SVG, scripts, installers, disk images,
   shortcuts, macro documents) are never served; nothing from Spam is served. There is no malware
   scanner in the pipeline: protection is structural, and opening a document equals opening it in a
   mail client. `MAIL_ATTACHMENTS_DISABLED=1` turns downloads off without a code change.
5. **Sending is one path.** Only a stored draft is sent, at the revision Marcel confirmed
   (`email.deliver`, AMBER, payload hash, 15-minute expiry). The draft is claimed with a
   conditional UPDATE; sends are never retried; a timeout or 5xx after the request left is
   `uncertain` (engine audit, attention item), never "sent" or "failed". The older `email.send`
   (remote interfaces) becomes a draft and uses the same delivery. Replies thread through
   Hostinger (`inReplyTo`); the Sent copy's Message-ID is read back so a customer's answer joins
   the conversation (migration 0017 extends `mail.accept_hostinger`). `MAIL_SEND_DISABLED=1` stops
   every send. Evidence mode uses a sink.
6. **Outbound identity.** One renderer (lib/mail/identity/render.ts), two styles: relationship
   (a letter) and transactional (inked wordmark band, reference block, one action). Multipart
   with the same words in the text part; tables and inline styles; no images at all — the
   wordmark is set in type, honouring the recorded decision that a blocked logo is a blank
   letterhead (brands.ts); colours from the token mirror; every value escaped; actions only to
   Maxpromo's own https domains; legal line on every email; the § 19 UStG clause on commercial
   families only. Fifteen data-driven families (DE/EN) with starter texts that state no fact:
   every gap is `[[marked]]` and sending refuses while one remains.
7. **Max assists, Marcel sends.** `email.assist` drafts, improves, shortens, expands, softens,
   formalises, translates or analyses (summary, intent, open questions, commitments on both
   sides, next step). It returns text only; mail is passed as quoted data; quarantined mail never
   reaches a model.
8. **Archive and trash are local.** Reversible OS state; Hostinger folders are not changed and
   nothing is deleted.
9. **Ask Max is grounded.** The ungrounded `/api/os/ai` chat is removed. `/api/os/ask` maps a
   question to one intent from a fixed list (model or keywords), runs read-only queries and
   capabilities, and answers only from those facts, which are shown with links to the records.
   The one writing intent saves reply drafts; nothing is sent.

## Consequences

- Production needs migration 0017 before the release (additive; old code keeps working against it).
- Scheduled send is not offered: the web project has no minute-level scheduler (Vercel Hobby
  crons run at most daily). The draft model supports it; the scheduler is the open item.
- The first live send and the first live attachment download are owner actions (this run sends
  nothing to a real recipient).
- Cross-client rendering is proven structurally (tables, inline styles, no images, light scheme)
  and visually in Chrome; Outlook desktop and Apple Mail rendering have not been observed.
