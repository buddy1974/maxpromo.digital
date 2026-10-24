# Product completion ledger

The canonical list of what Maxpromo promised itself, and its real state. **Infrastructure GREEN
is not product complete.** A designed item is not implemented; an implemented item is not
verified until evidence exists; a verified subsystem is not the whole product.

States: **DONE** (implemented, verified, released) · **PARTIAL** (some of the commitment is done
and verified; the rest is listed) · **OWNER** (blocked on an owner/account action) · **DEFERRED**
(deliberately later) · **NEXT** (the next phase).

Last updated: 2026-10-24 (overnight product run). Evidence: [reconciliation report §23](../architecture/control-plane-reconciliation.md),
ADR-0023, ADR-0024, change log.

## Baseline (infrastructure GREEN, 2026-10-23)

Hostinger inbound, provider Junk reconciliation, Spam quarantine, control-plane contract,
Bureau → OS intake (positive + replay), auth boundaries, WhatsApp OFF, shadow Bureau paused.
Declared GREEN 2026-10-23 for the platform release — not for the product commitments below.

## Commitments

| # | Commitment | State | Evidence / what remains |
|---|---|---|---|
| 1 | Senior Email OS (workspace, context, actions, follow-up) | **PARTIAL** (released, verified) | §Email — no outbound attachments; first live send is the owner's |
| 2 | Professional outbound identity | **PARTIAL** (released for Email OS) | §Email — document emails (invoice/quote) still use the old Resend letterhead |
| 3 | Safe full body and attachments | **DONE** (released, verified live) | §Email — risk 119 (no malware scanner) stands |
| 4 | Deliverability | **PARTIAL** | §Deliverability — DMARC `p=none`; owner DNS step |
| 5 | Follow-up engine | **DONE** for email conversations (released) | §Email — lead `os_followups` and conversation follow-ups are two views of follow-up, both in attention |
| 6 | Daily command centre | **DONE** (released, verified) | §Command centre |
| 7 | Morning briefing | **DONE** on screen; **OWNER** for the phone push | §Command centre, §Planes |
| 8 | Ask Max | **DONE** (released, verified live with the production model) | §Command centre |
| 9 | Agent Bureau refinement | **PARTIAL** | §Planes — mock CRM removed; example data labelled; visual check is the owner's |
| 10 | Telegram Owner Control Plane | **PARTIAL** → **OWNER** activation | §Planes |
| 11 | Stripe ↔ Money | **NEXT** (Phase A) | Groundwork: [stripe-money-groundwork.md](../architecture/stripe-money-groundwork.md) |
| 12 | Broader channel convergence (WhatsApp, voice, more connectors) | **DEFERRED** | WhatsApp gateway exists and is OFF (503); no voice channel |
| 13 | Bureau database US → Frankfurt | **OWNER** | Runbook §21; Neon project creation is an owner action |
| 14 | Delete the paused shadow Bureau | **OWNER** (authorisation) | Paused 2026-10-23, candidate for deletion |
| 15 | Document language follows the OS locale (risk 118) | **DEFERRED** | `<html lang>` stays `de` in English |
| 16 | Installable mobile app (PWA), phone-first | **NEXT** (Phase B) | See §Mobile |
| 17 | Android testing | **NEXT** (Phase B) | |
| 18 | iOS testing | **NEXT** (Phase B) | |
| 19 | Reusable client productisation | **DEFERRED** | First make Maxpromo excellent |
| 20 | Integrated business simulation (lead → payment → agent → owner) | **NEXT** (Phase C) | |

## Email

Released 2026-10-24 (production `a36c023`+), ADR-0023, migration 0017 applied to production.

| Capability | State | Evidence |
|---|---|---|
| Workspace: views (work/business/mailbox), conversation timeline incl. Maxpromo's own replies, context panel with next step | DONE | Production browser 2026-10-24 (desktop, 390 px, 360 px); 43 UI assertions |
| Lead semantics: Lead / Possible match (client or lead) / Potential lead | DONE | Production shows "Potential lead"; Leads count no longer 0 when an enquiry exists |
| Business context: person, lead/client status, projects, proposals, invoices with open/overdue, reminders, earlier conversations, last contact both ways | DONE | Evidence DB browser QA (Beckmann overdue invoice EVD-2026-0004) |
| Full text from Hostinger API (`/text`), HTML→plain, quarantined never fetched | DONE, live | Production log `mail.content checked 2 stored 2 failed 0`; Junk message stayed preview |
| Attachment download (owner, click, active types refused, Spam refused, streamed, capped, audited) | DONE, live | Production: real PDF 1,548,450 bytes `application/pdf`, attachment + nosniff + sandbox; Spam attachment 409 |
| Compose / reply / reply all / forward, To/Cc/Bcc, autosaved drafts, one draft model | DONE | Evidence send end to end; production composer opened prefilled (no send) |
| Confirmed single send (AMBER, revision claim, never retried, uncertain recorded) | DONE (offline + evidence); live send **OWNER** | 53+ outbound/delivery assertions; evidence sink send recorded thread state, audit, follow-up |
| Threading (reply via `inReplyTo`; customer answer to Maxpromo's mail joins the conversation; Sent Message-ID read back) | DONE in code and SQL; live **OWNER** | migration 0017 `accept_hostinger` outbound rule; proof of function in production schema |
| Archive / unarchive / trash (local, reversible), read/unread, spam / not spam / block | DONE | email gate proofs; production mark read/unread round trip |
| Max assist: draft, improve, shorten, expand, friendlier, formal, translate, analyse (intent, questions, commitments both sides, next step) | DONE, live model | Production `email.assist improve` answered; meaning-shift found and instruction tightened (risk 123) |
| Follow-up engine: needs reply, customer replied, waiting, follow-up due/overdue, no next step; one-tap planning; attention and briefing | DONE | Attention shows overdue follow-up (evidence); production briefing "1 conversation waiting for your reply" |
| Scheduled send | DEFERRED | risk 120 — needs a minute-level scheduler |
| Outbound attachments (attach a file to a reply) | NOT DONE | needs draft attachment storage |
| Document emails (invoice/quote) through the new identity and Hostinger | NEXT (with Phase A) | they still use Resend + the dark letterhead; unify with the payment-link email |
| Cross-client rendering (Gmail/Outlook/Apple Mail) | PARTIAL | Built for it (tables, inline styles, no images, light scheme); seen in Chrome only (risk 122) |

## Deliverability

DNS (read-only lookups, 2026-10-24): MX `mx1/mx2.hostinger.com`; SPF `v=spf1 include:_spf.mail.hostinger.com ~all`;
DKIM Hostinger selectors `hostingermail-a/-b/-c` published (CNAME to Hostinger), Resend `resend._domainkey`
and `send.maxpromo.digital` (SES return path) for document email; DMARC `v=DMARC1; p=none;
rua=…@dmarc-reports.cloudflare.net` (monitoring only).

Application: From `Maxpromo Digital <info@maxpromo.digital>` (the authenticated mailbox, so SPF/DKIM
align); replies thread through Hostinger (`In-Reply-To`/`References` copied by the provider; original
flagged `\Answered`); Message-ID generated by Hostinger and read back from Sent; multipart text + HTML
with the same words; no images, tracking pixels or link shorteners; one action link only to Maxpromo's
own domains; no bulk sending path.

Open: DMARC is `p=none` (owner DNS step after checking the Cloudflare DMARC reports for alignment:
move to `p=quarantine`); bounce handling (Hostinger delivers bounces to the mailbox as mail from
`mailer-daemon`, classified automated, never replied to — no structured bounce state yet).

## Command centre

- **/os** (released, production browser 2026-10-24): briefing (since yesterday · communication · money ·
  agents; empty categories omitted), then the ranked attention list (email follow-ups and customer
  replies now included, deep links to the exact conversation), then figures. Responsive grids; 390/360 px fit.
- **Morning briefing**: one snapshot (`briefingSnapshot`) for the screen and for `owner.brief` (text
  channels). Production: newMail, newLead, repliesOwed 1, outstanding 156 € overdue, 1 draft invoice.
- **Ask Max** (`/api/os/ask`): fixed intents, read-only queries, facts shown with links, model only
  phrases (production model verified: "Wer wartet auf meine Antwort?" → the one waiting conversation;
  "Welche Rechnungen sind offen?" → MP-2026-002 156 €, 150 days overdue). The ungrounded `/api/os/ai`
  chat is removed. Writing intent: "draft the replies that need me" saves drafts only.
- Not done: project blockers come only from late jobs and incidents (no project-task model);
  "hot leads" are ranked by the existing money-today scoring, not a new lead score.

## Planes

- **Agent Bureau**: the signed-in Bureau no longer shows invented leads, contacts, projects, tasks or a
  business briefing; those routes link to Maxpromo OS and left the navigation. AI governance, client
  implementation, memory, research and integrations still show example data, labelled on screen
  (risk 113, PARTIAL). Bureau production serves `f04aa04`; a signed-in visual check is the owner's.
  Agent failures/blocks and agent approval requests feed OS attention and owner notices.
- **Telegram Owner Control Plane** (ADR-0024): push policy, exactly-once ledger (migration 0018 in
  production), dispatcher, triggers after inbound mail (after the spam check), agent events and agent
  approval requests, daily cron route. Inactive until the owner sets `OWNER_TELEGRAM_NOTICES=1`; the
  daily cron also needs `CRON_SECRET`. Owner commands from Telegram (approve, reply) need the Telegram
  owner client on the signed door — outside this repository.
- **Cross-plane sanity**: duplicate draft model removed (one `mail.drafts`); ungrounded assistant route
  removed; Bureau mock CRM removed. Remaining duplicates: two AI provider adapters (risk 112), two
  outbound transports (Resend for document email, Hostinger for conversations — to be unified in Phase A).

## Mobile

The final mobile product is a phone-first Maxpromo experience — not desktop UI in a phone shell,
not card soup, not a fake installable wrapper: fast, thumb-friendly, attention-first,
communications-first, owner actions, OS plus the relevant Agent functions, one tap from the home
screen. Phase B builds it and tests it on Android and iOS.

## Stripe — owner items

1. Stripe **test mode** secret key (`sk_test_…`), stored as `STRIPE_SECRET_KEY` on a preview or the
   evidence environment — never pasted in chat.
2. Stripe **live** key, preferably a **restricted key** limited to Checkout Sessions, Payment Links,
   PaymentIntents (read), Charges/Balance transactions (read), Refunds (write, owner-approved), Payouts
   (read), Disputes (read) — stored as `STRIPE_SECRET_KEY` on `maxpromo-digital` Production.
3. After the endpoint `https://maxpromo.digital/api/channels/stripe` is deployed and created in the
   Stripe dashboard (events listed in the groundwork doc): its **signing secret** (`whsec_…`) as
   `STRIPE_WEBHOOK_SECRET` (test and live are different secrets).
4. The **DNS record** Stripe gives for `pay.maxpromo.digital` (the name does not resolve today).
5. Decisions: Checkout Sessions per invoice (recommended) or Payment Links; which invoices may be
   paid by card (all EUR/GBP invoices, or opt-in per invoice); whether the card payment option appears
   in the invoice email from day one.
