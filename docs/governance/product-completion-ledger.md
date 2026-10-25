# Product completion ledger

The canonical list of what Maxpromo promised itself, and its real state. **Infrastructure GREEN
is not product complete.** A designed item is not implemented; an implemented item is not
verified until evidence exists; a verified subsystem is not the whole product.

States: **DONE** (implemented, verified, released) · **PARTIAL** (some of the commitment is done
and verified; the rest is listed) · **OWNER** (blocked on an owner/account action) · **DEFERRED**
(deliberately later) · **NEXT** (the next phase).

Last updated: 2026-10-24 (product completion + email acceptance + phone-first OS run; ADR-0026). Previously: Stripe ↔ Money + Email completion run.
ADR-0023, ADR-0024, change log.

## Baseline (infrastructure GREEN, 2026-10-23)

Hostinger inbound, provider Junk reconciliation, Spam quarantine, control-plane contract,
Bureau → OS intake (positive + replay), auth boundaries, WhatsApp OFF, shadow Bureau paused.
Declared GREEN 2026-10-23 for the platform release — not for the product commitments below.

## Commitments

| # | Commitment | State | Evidence / what remains |
|---|---|---|---|
| 1 | Senior Email OS (workspace, context, actions, follow-up) | **PARTIAL** (released, verified) | §Email — outbound attachments and bounce handling now built and proven; a first live send observed in real clients is still the owner's |
| 2 | Professional outbound identity | **PARTIAL** (one identity for conversations AND documents) | §Email — quotes, invoices and reminders now leave through the mailbox in the new identity with the PDF attached; not yet observed in Gmail/Outlook/Apple Mail; outreach now leaves through the mailbox (2026-10-25); contact form and newsletter still on Resend (risk 127) |
| 3 | Safe full body and attachments | **DONE** (released, verified live) | §Email — risk 119 (no malware scanner) stands |
| 4 | Deliverability | **PARTIAL** | §Deliverability — structured bounces now recorded; DMARC `p=none` is the owner's DNS step |
| 5 | Follow-up engine | **DONE** for email conversations (released) | §Email — lead `os_followups` and conversation follow-ups are two views of follow-up, both in attention |
| 6 | Daily command centre | **DONE** (released, verified) | §Command centre |
| 7 | Morning briefing | **DONE** on screen; **OWNER** for the phone push | §Command centre, §Planes |
| 8 | Ask Max | **DONE** (released, verified live with the production model) | §Command centre |
| 9 | Agent Bureau refinement | **PARTIAL** | §Planes — mock CRM removed; example data labelled; visual check is the owner's |
| 10 | Telegram Owner Control Plane | **PARTIAL** → **OWNER** activation | §Planes |
| 11 | Stripe ↔ Money | **DONE in sandbox; live OWNER** | §Money — built and proven against a real Postgres with a fake rail (ADR-0025, migration 0019); 2026-10-24 Stripe API upgraded to `2026-09-30.endive` and the **sandbox** connected to production: signed events verified, ingested once, unknown money held and resolved. Full sandbox lifecycle in production 2026-10-24 (MP-2026-044): pay page → Stripe Checkout → signed webhooks → ledger → paid, fee €0.28 → refund through the OS → invoice reopened → cancelled. Not yet: any live payment. |
| 12 | Broader channel convergence (WhatsApp, voice, more connectors) | **DEFERRED** | WhatsApp gateway exists and is OFF (503); no voice channel |
| 13 | Bureau database US → Frankfurt | **OWNER** | Runbook §21; Neon project creation is an owner action |
| 14 | Delete the paused shadow Bureau | **OWNER** (authorisation) | Paused 2026-10-23, candidate for deletion |
| 15 | Document language follows the OS locale (risk 118) | **DONE** (production) | ADR-0026; production `lang="en"` with the OS in English |
| 16 | Installable mobile app (PWA), phone-first | **DONE in code, local phone-width QA and production desktop** | ADR-0026, §Mobile; physical-device acceptance **OWNER** (risk 137) |
| 17 | Android testing | **PARTIAL** — browser at 360/390/412 px; no physical device | risk 137 |
| 18 | iOS testing | **PARTIAL** — standards-based (dvh, safe areas, 16 px inputs, visualViewport); no iPhone | risk 137 |
| 19 | Reusable client productisation | **DEFERRED** | First make Maxpromo excellent |
| 20 | Integrated business simulation (lead → payment → agent → owner) | **DONE (evidence runtime)** | commercial-agent 85/85 on the final code; Stripe sandbox lifecycle in production (MP-2026-044) |
| 21 | Leads + outreach (ADR-0027) | **DONE manual, production verified 2026-10-25; automation OWNER switch** | research, code qualification, Email OS drafts, prospect send policy (all doors), one controlled test send; reply path evidence-only (risk 152); discovery not connected |
| 22 | Clients foundation (ADR-0028) | **DONE, production verified 2026-10-25** | capabilities only; three-state update (website, country, clearing proven); archive/restore; governed delete of empty clients, database refuses cascades; deterministic matching with candidates before create; client page (360); documents; image + PDF extraction (candidate only) |
| 23 | Inbox hygiene (ADR-0028) | **DONE, production verified 2026-10-25** | reversible Trash (state kept, out of every count), Restore, bulk (read/archive/trash/restore), new-email drafts reopenable; OS-level only — Hostinger unchanged (risk 153) |
| 24 | Scheduled work | **DONE** (daily) | `CRON_SECRET` set; daily run proven (401 without / with a wrong bearer, idempotent); register `docs/deployment/scheduled-work.md`; owner push still OWNER (risk 121) |

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
| Delivery failures (bounces) | DONE in code and evidence; live not yet observed | `lib/mail/bounces.ts`: MAILER-DAEMON/postmaster reports parsed (DSN and human part), linked to Maxpromo's own sent message, shown in the conversation and in attention, pushed as an owner notice |
| Scheduled send | DONE in code and evidence (11/11); production after 0023 | migration 0023; sweeps: OS while open, daily cron, `/api/cron/mail-schedule`; minute accuracy with the OS closed needs `CRON_SECRET` + frequent cron (risk 120) |
| Links in inbound mail | DONE | https only, the visible text is the destination, noopener/noreferrer (`prove:os-app`) |
| Mail sent to the mailbox itself | DONE in code and evidence (8/8); production after 0021 | migration 0021, risk 135 |
| Phone Inbox | DONE (phone-width QA) | sticky action bar, full-screen composer with options below the message and pinned actions, 16 px fields, keyboard-aware height |
| Outbound attachments (attach a file, or an OS quote/invoice PDF, to any email) | DONE in code, evidence and local browser; live **OWNER** | migration 0020; type decided by the bytes, 4 MB/file, 10 MB/draft; part of the confirmed revision; 15 offline + 16 evidence-DB assertions; local browser: attach → confirm lists file → send (sink) → sent message carries the PDF |
| Document emails (quote, invoice, reminder) through the new identity and Hostinger, PDF attached | DONE in code and evidence; live **OWNER** | ADR-0025; `lib/documents/pdf.ts` (27 assertions) + `lib/documents/mail.ts`; approval binds subject, HTML, text and PDF bytes; recorded in the client's conversation (invoice + reminders share one); commercial-agent end-to-end 85/85 against the evidence runtime |
| Cross-client rendering (Gmail/Outlook/Apple Mail) | PARTIAL | Built for it (tables, inline styles, no images, light scheme); seen in Chrome only (risk 122) |

## Money (ADR-0025, 2026-10-24)

| Capability | State | Evidence |
|---|---|---|
| One ledger: `os_payments` with provider + reference; refunds and lost disputes as reversals; `money.invoice_paid()` the single net-received definition | DONE (evidence DB) | migration 0019; 43 assertions against the evidence Postgres |
| Payment request: stable pay link per invoice (`/<lang>/pay/<token>`), current open balance, bank details always, card button only when connected; GET creates nothing | DONE (local HTTP + browser) | 20 HTTP assertions; browser desktop and 390 px frame |
| Checkout attempt: session row before the call, same idempotency key on retry, reuse of a valid session, stale sessions closed | DONE (fake rail) | evidence proof |
| Verified webhook `/api/channels/stripe`: signature, ±5 min, rotation, once per event, 409 while in flight | DONE (local HTTP) | offline + HTTP proofs |
| Payment applied only when tied to an OS checkout, same currency and mode, no overpay; otherwise unapplied + critical attention | DONE (evidence DB) | evidence proof |
| Fees/net per charge, payouts, payout → charges, Revolut confirmation by Marcel | DONE (fake rail) | evidence proof; `/os/money` |
| Refund (AMBER): card through Stripe, bank as a recorded refund; invoice reopens | DONE (manual path proven; card path with fake rail) | evidence proof; browser prepare/cancel |
| Disputes: critical attention + owner notice; lost → chargeback reversal | DONE (evidence DB) | evidence proof |
| Invoice status follows real events (draft → sent by send → paid by payment; cancel only without money) | DONE | API guards; commercial-agent 85/85 |
| `/os/money` screen and the invoice money panel | DONE (local browser) | evidence data |
| Sandbox lifecycle in production: invoice → pay page → Checkout → webhooks → ledger → paid → refund → reopened → cancelled | DONE 2026-10-24 | MP-2026-044, €1.00; card entered by Marcel; see reconciliation §25 |
| Live Stripe payment, refund, dispute, payout | **OWNER** | live restricted key, live destination + secret, `STRIPE_LIVE=1` |
| Revolut statement matching | DEFERRED | no Revolut API; Marcel confirms payouts |

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

Bounces (2026-10-24): Hostinger delivers bounces to the mailbox from `MAILER-DAEMON`; the content check now parses them and marks the outbound message `bounced`/`delayed` (migration 0020), visible in the conversation and in attention.

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

## Mobile (ADR-0026, 2026-10-24)

| Capability | State | Evidence |
|---|---|---|
| Phone information architecture: Today · Inbox · Money · Max · More (Agent Bureau, approvals, all records) | DONE | `prove:os-app`; phone-width QA 360/390/412 |
| Today as owner cockpit (attention first, whole-row targets, routine lists hidden) | DONE | phone-width QA; production desktop |
| Phone Inbox, conversation, compose/reply with keyboard constraints | DONE (browser) | sticky actions, full-screen composer, 16 px inputs, `--os-vvh` |
| Phone Money (hero, exceptions only when present, card money in business words) | DONE | production "Stripe balance −€0.28 …" |
| Ask Max as a tab, language continuity, money grounding | DONE | production German answer with fee |
| Approvals on phone (impact, proposer, what happens, consequence-named confirm) | DONE (browser) | evidence approval card at 390 px |
| Floating control overlap | DONE by architecture | risk 124 closed |
| PWA: manifest, conservative service worker, offline page; no business data cached | DONE | production manifest/sw/offline public, worker controlling `/os` |
| Security headers (no framing of OS / pay page) | DONE | production headers |
| Physical Android / iPhone / installed iOS app | **OWNER** | risk 137 |

## Stripe — owner items

Nothing below is needed to keep using bank transfer.

1. **Sandbox — DONE 2026-10-24** (under the owner's browser authority): restricted key `maxpromo-os-money-sandbox` (Checkout Sessions write, Charges and Refunds write, Balance read) as `STRIPE_SECRET_KEY`, and the destination `we_1UU0afKQCb9O3UXuOXWareak` (Your account · Snapshot · `2026-09-30.endive` · 20 events) with its signing secret as `STRIPE_WEBHOOK_SECRET`, both on `maxpromo-digital` Production, marked sensitive, installed without the values being displayed. The OS shows "Card payment on (test mode)".
2. Event list (for the live destination, same scope, payload style and version): `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.succeeded`, `charge.updated`, `charge.refunded`, `refund.created`, `refund.updated`, `refund.failed`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `payout.created`, `payout.updated`, `payout.paid`, `payout.failed`, `payout.canceled`.
3. **Live**: a live restricted key with the same three permissions as `STRIPE_SECRET_KEY`, a live destination as in 2 with its own signing secret as `STRIPE_WEBHOOK_SECRET`, and **`STRIPE_LIVE=1`** — the explicit go-live switch; without it a live key does nothing. The sandbox key and secret are replaced at the same time.
4. Decisions: card payment for all EUR/GBP invoices (as built) or opt-in per invoice; invoice emails carry the pay link on the live rail only (as built).
5. Not needed: `pay.maxpromo.digital` DNS. The pay page is `https://www.maxpromo.digital/<de|en>/pay/<token>`; Stripe's hosted checkout takes the card.
6. Owner switch: `STRIPE_PAYMENTS_DISABLED=1` disconnects the rail at once.
