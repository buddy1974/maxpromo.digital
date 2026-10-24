# ADR-0025 — The Money domain and Stripe as a payment rail

Status: **accepted for implementation, 2026-10-24** (Stripe ↔ Money mega-run). Live charging is
**not** enabled: it needs Marcel's Stripe keys, the webhook endpoint registered in Stripe and the
explicit `STRIPE_LIVE=1` switch.

## Context — what the code actually was (forensic, 2026-10-24)

Read from the code, not from the groundwork document:

| Concern | Where | Finding |
|---|---|---|
| Invoice master | `os_invoices` (schema.sql, 0009, 0011) | One table; numbering by allocator; EUR/GBP; deposit (`anzahlung`), `restbetrag`, kinds standard/deposit/final; one deposit + one final per quote (unique index). **No status CHECK** — any text could be written. |
| Payment ledger | `os_payments` (0011) | One row per receipt, amount > 0, no provider, no external reference, **no refunds**: money could only ever go up. |
| The payment path | `recordPaymentLocked` (documents.ts) | Sound: row lock, overpay refused inside the transaction, paid at zero, follow-ups closed. Used by `payment.record` and "mark paid". |
| Money owed | `money.ts` `invoiceBalance` / `receivables` | Sound; per currency; overdue derived from due date. Read by attention, briefing, Ask Max. |
| Balance sums | documents.ts ×3, mail/context.ts | `sum(os_payments.amount)` restated in four places. |
| Unsafe transitions | `/api/os/invoices` POST + PATCH | POST took `status` from the body (an invoice could be created **paid** with nothing behind it, or `sent` before any send — the new-invoice form did exactly that before sending). PATCH could set any status, edit amounts and currency of a paid invoice, cancel an invoice with money recorded. |
| Document email | `lib/documents/emails.ts` + `emailHtml.ts` via Resend | A second outbound transport and a second (dark letterhead) identity. The body said "anbei" / "attached" while **nothing was attached** — there was no server-side PDF at all; the PDF existed only as the browser print page. |
| Copy to owner | send routes | BCC to info@ (would arrive in the inbox the Email OS ingests). |
| Audit | `os_audit` append-only | Sound; reused. Redaction did not know Stripe secret shapes. |
| Idempotency | `os_agent_results`, approvals, Resend idempotency key | Hostinger has no idempotency key, so a document send moving there needs the OS's own claim. |
| Groundwork doc | stripe-money-groundwork.md | Mostly right; wrong on two points: Checkout Sessions expire within 24 h (a link in an emailed invoice would die), and `pay.maxpromo.digital` DNS is not needed. |

## Decision

**Maxpromo OS remains the source of truth.** Stripe is a payment rail inside the Money domain of the
Business Control Plane — not a CRM, customer master, invoice master, workflow engine or dashboard.
No Stripe Customer, Invoice, Product or Price object is created or read as truth; Stripe Tax stays off.

Lifecycle → records (migration `0019-money-domain.sql`, schema `money`):

| Lifecycle | Record |
|---|---|
| Quote → accepted → invoice | `os_angebote`, `os_invoices` (unchanged) |
| Payment request | `money.payment_links` — one stable link per invoice, `https://maxpromo.digital/<lang>/pay/<token>` |
| Payment attempt | `money.checkout_sessions` — a Stripe Checkout Session created on an explicit click for the open balance at that moment |
| Payment | `os_payments` (`provider='stripe'`, `provider_ref=pi_…`, unique) — the same ledger as bank payments |
| Fee, net, balance transaction | `money.charges` (beside the payment; fees never reduce what the client owed) |
| Refund, lost dispute | `money.reversals` against the receipt (never an edit of it) |
| Dispute | `money.disputes` |
| Balance | derived: applied charges not yet in a payout |
| Payout → Revolut | `money.payouts` + `reconciled_at` / `bank_reference` (Marcel confirms on the statement) |
| Every provider event once | `money.provider_events` (primary key = event id) |

Net received = receipts − succeeded reversals, defined once in SQL: `money.invoice_paid(id)`. Every
balance query calls it.

Rules:

1. **One payment path.** A card payment settles an invoice only through `recordPaymentLocked`, only
   when it ties to a checkout session the OS created for that invoice, in that currency, in the same
   mode, without overpaying. Anything else is an **unapplied** charge and a critical attention item —
   never a silent write, never dropped.
2. **Verified webhook only.** `POST /api/channels/stripe`: bounded raw body, `Stripe-Signature`
   HMAC-SHA256, constant-time, ±5 min, several secrets for rotation; fails closed without a secret.
   Duplicate deliveries do nothing; an event whose processing did not finish is processed again; a
   concurrent redelivery is answered 409 so Stripe retries.
3. **Uncertain is not failed.** A Stripe create call that times out keeps its idempotency key; the
   next click retries under the same key and gets the same session. Refunds are AMBER (owner
   confirms); an unanswered refund is recorded `uncertain` and the webhook records it if it happened.
4. **A GET never creates anything at Stripe.** Mail scanners open links; the pay page only shows the
   invoice number, the current open amount, due date and bank details. Checkout starts by POST.
5. **Refunds and lost disputes reopen the invoice** in the same transaction (status back to `sent`),
   so "paid" never stands over an open balance. Reversals never exceed the receipt.
6. **Live is a separate decision.** A live key does nothing until `STRIPE_LIVE=1`; the evidence
   environment refuses live keys; `STRIPE_PAYMENTS_DISABLED=1` disconnects the rail.
7. **Invoice status follows real events.** Created as `draft`; `sent` only by a send the mail server
   accepted; `paid` only through the payment path; `cancelled` only with no money recorded; paid and
   cancelled invoices keep their amounts; currency is fixed once money is recorded (`os_invoices_status_check`
   added NOT VALID: binds new writes, rewrites nothing).

Document email (same run, ADR-0023 amended): quotations, invoices and reminders are rendered by the
one outbound identity and sent **through the mailbox (Hostinger) with the document attached as a
PDF** (`lib/documents/pdf.ts`, `pdf-lib`, deterministic for a stored row). The approval binds the
exact email including the PDF bytes. The send is recorded in the client's conversation (an invoice
and its reminders share one), so the client's reply threads. Owner direct sends are claimed in
`os_agent_results` (Hostinger has no idempotency key). The Resend letterhead builders were removed;
Resend remains only for the contact form, newsletter and outreach (risk 127).

## Consequences

- Production needs migration 0019 **before** the release: every balance query now calls
  `money.invoice_paid()`.
- New dependency `pdf-lib` (MIT, pure JS, no native code) — recorded here as its decision record.
- Card payment becomes available the moment Marcel supplies keys and the webhook secret; nothing
  else needs building for the basic flow. Observing a real payment remains his step.
- What Stripe would otherwise own stays in the OS: who the client is, what is owed, what was paid,
  what needs attention.

## Not decided here

Payment Links (Stripe's) are not used. Partial payments by card are possible only as "pay the open
balance". Automatic payout ↔ Revolut statement matching needs a Revolut API connection (none).
